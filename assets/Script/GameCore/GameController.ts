import Tile from "../Tile";
import IGameCore from "./IGameCore";
import TileInputEventType from "./TileInputEventType";
import TileInputEvent from "./TileInputEvent";
import TileColorConfig from "../Config/TileColorConfig";
import BlastGameModel from "./BlastGameModel";
import IAnimationView from "./IAnimationView";
import IFieldView from "./IFieldView";
import FieldView from "./FieldView";
import INoMovesResolver from "./INoMovesResolver";
import SuperTilesConfig from "../Config/SuperTilesConfig";
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";
import TileSpriteDictionary from "./TileSpriteDictionary";
import SupertileExtensionFactory from "./SupertileExtensionFactory";
import RocketHSupertileExtension from "./RocketHSupertileExtension";
import RocketVSupertileExtension from "./RocketVSupertileExtension";
import DynamiteSupertileExtension from "./DynamiteSupertileExtension";
import DynamiteMaxSupertileExtension from "./DynamiteMaxSupertileExtension";
import BoosterExtensionFactory from "./BoosterExtensionFactory";
import BombBoosterExtension from "./BombBoosterExtension";
import TeleportBoosterExtension from "./TeleportBoosterExtension";
import BoostersConfig from "../Config/BoostersConfig";

export default class GameController implements IGameCore {
    private parentNode: cc.Node;
    private rows: number;
    private cols: number;
    private colors: string[];
    private tileSize: number;
    private tileSpacing: number;
    private tileColorConfig: TileColorConfig = null;

    private animationView: IAnimationView = null;
    private model: BlastGameModel = null;
    private fieldView: IFieldView = null;
    private noMovesResolver: INoMovesResolver | null = null;
    private initialField: (string | null)[][] | null = null;

    private superTilesConfig: SuperTilesConfig | null = null;

    private isAnimating: boolean = false;

    private movesChangedCallback: ((moves: number) => void) | null = null;
    private scoreChangedCallback: ((score: number, targetScore: number) => void) | null = null;
    private winCallback: (() => void) | null = null;
    private loseCallback: (() => void) | null = null;

    constructor(parentNode: cc.Node, rows: number, cols: number, colors: string[], tileSize: number, tileSpacing: number, tileColorConfig: TileColorConfig, moves: number, targetScore: number, movesChangedCallback?: (moves: number) => void, scoreChangedCallback?: (score: number, targetScore: number) => void, animationView?: IAnimationView, winCallback?: () => void, loseCallback?: () => void, noMovesResolver?: INoMovesResolver | null, initialField?: (string | null)[][] | null, superTilesConfig?: SuperTilesConfig | null) {
        this.parentNode = parentNode;
        this.rows = rows;
        this.cols = cols;
        this.colors = colors && colors.length > 0 ? colors.slice() : ["red", "green", "blue", "yellow"];
        this.tileSize = tileSize;
        this.tileSpacing = tileSpacing;
        this.tileColorConfig = tileColorConfig;
        this.movesChangedCallback = movesChangedCallback || null;
        this.scoreChangedCallback = scoreChangedCallback || null;
        this.animationView = animationView || null;
        this.winCallback = winCallback || null;
        this.loseCallback = loseCallback || null;
        this.noMovesResolver = noMovesResolver === undefined ? null : noMovesResolver;
        this.initialField = initialField === undefined ? null : initialField;
        this.superTilesConfig = superTilesConfig === undefined ? null : superTilesConfig;

        this.model = new BlastGameModel(rows, cols, this.colors, moves, targetScore);
        this.fieldView = new FieldView(rows, cols, this.colors, tileSize, tileSpacing, null, tileColorConfig);

        const container = DiContainer.instance;
        let resolvedSuperTilesConfig: SuperTilesConfig | null = null;
        if (container.has(DiTokens.SuperTilesConfig)) {
            const superTilesConfig = container.resolve<SuperTilesConfig>(DiTokens.SuperTilesConfig);
            if (superTilesConfig) {
                resolvedSuperTilesConfig = superTilesConfig;
                this.model.setSuperTileGenerationCallback((size: number) => {
                    return superTilesConfig.getSuperTileTypeForSize(size);
                });
            }
        }
        if (!resolvedSuperTilesConfig && this.superTilesConfig) {
            resolvedSuperTilesConfig = this.superTilesConfig;
        }

        const extensionFactory = new SupertileExtensionFactory();
        extensionFactory.register(new RocketHSupertileExtension());
        extensionFactory.register(new RocketVSupertileExtension());
        extensionFactory.register(new DynamiteMaxSupertileExtension());

        let dynamiteRadius = 2;
        if (resolvedSuperTilesConfig) {
            const cfg = resolvedSuperTilesConfig.getSuperTileConfig("dynamite");
            if (cfg && typeof cfg.radius === "number" && cfg.radius >= 0) {
                dynamiteRadius = cfg.radius;
            }
        }
        extensionFactory.register(new DynamiteSupertileExtension(dynamiteRadius));

        this.model.setSuperTileExtensionFactory(extensionFactory);

        const boosterExtensionFactory = new BoosterExtensionFactory();
        
        let bombRadius = 1;
        if (container.has(DiTokens.BoostersConfig)) {
            const boostersConfig = container.resolve<BoostersConfig>(DiTokens.BoostersConfig);
            if (boostersConfig) {
                const bombConfig = boostersConfig.getBoosterConfig("bomb");
                if (bombConfig && typeof bombConfig.radius === "number" && bombConfig.radius >= 0) {
                    bombRadius = bombConfig.radius;
                }
            }
        }
        
        boosterExtensionFactory.register(new BombBoosterExtension(bombRadius));
        boosterExtensionFactory.register(new TeleportBoosterExtension());

        this.model.setBoosterExtensionFactory(boosterExtensionFactory);
    }

    init(): void {
        this.model.init(this.initialField);

        this.fieldView.init(this.parentNode);
        this.fieldView.rebuild(this.model.getBoard());

        this.ensureMovesAvailable(() => {
            this.updateMovesView();
            this.updateScoreView();
        });
    }

    private ensureMovesAvailable(onDone: () => void): void {
        if (!this.noMovesResolver) {
            onDone();
            return;
        }

        const shuffle = (onComplete: () => void) => {
            this.model.shuffleBoard();
            if (this.fieldView.playShuffleAnimation) {
                this.fieldView.playShuffleAnimation(this.model.getBoard(), onComplete);
            } else {
                this.fieldView.rebuild(this.model.getBoard());
                onComplete();
            }
        };

        const step = () => {
            if (this.model.hasAvailableMoves()) {
                onDone();
                return;
            }
            if (!this.noMovesResolver.tryResolve(shuffle, step)) {
                if (this.loseCallback) {
                    this.loseCallback();
                }
                return;
            }
        };

        step();
    }

    getSupportedEvents(): TileInputEventType[] {
        return [TileInputEventType.Tap];
    }

    handleEvent(event: TileInputEvent): void {
        if (this.isAnimating) {
            return;
        }

        if (this.model.getRemainingMoves() <= 0) {
            return;
        }

        if (this.model.getTargetScore() > 0 && this.model.getScore() >= this.model.getTargetScore()) {
            return;
        }

        if (event.type !== TileInputEventType.Tap) {
            return;
        }

        const tile = event.tile;

        if (!tile) {
            return;
        }

        const result = this.model.handleTap(tile.row, tile.col);

        if (!result) {
            return;
        }

        const tilesToPop: Tile[] = [];

        for (let i = 0; i < result.removed.length; i++) {
            const cell = result.removed[i];
            const visualTile = this.fieldView.getTile(cell.row, cell.col);

            if (visualTile) {
                tilesToPop.push(visualTile);
            }
        }

        this.isAnimating = true;

        const completeStep = () => {
            this.fieldView.rebuild(this.model.getBoard());
            this.updateMovesView();
            this.updateScoreView();
            this.isAnimating = false;
            this.checkEndGame();
            this.model.applyGravityAndRefill();
            this.fieldView.rebuild(this.model.getBoard());
        };

        if (this.animationView && tilesToPop.length > 0) {
            this.animationView.playGroupRemoveAnimation(tilesToPop, completeStep);
        } else {
            completeStep();
        }
    }

    getRemainingMoves(): number {
        return this.model.getRemainingMoves();
    }

    getScore(): number {
        return this.model.getScore();
    }

    getTargetScore(): number {
        return this.model.getTargetScore();
    }

    addMoves(value: number): void {
        this.model.addMoves(value);
        this.updateMovesView();
    }

    getCellAtPosition(worldPos: cc.Vec2): { row: number; col: number } | null {
        const localPos = this.parentNode.convertToNodeSpaceAR(worldPos);
        const fv = this.fieldView as FieldView;
        if (fv.getCellAtPosition) {
            return fv.getCellAtPosition(localPos);
        }
        return null;
    }

    useBooster(boosterId: string, data?: any, onComplete?: () => void): void {
        if (this.isAnimating) {
            if (onComplete) {
                onComplete();
            }
            return;
        }

        const applyBooster = () => {
            const result = this.model.handleBooster(boosterId, data);
            if (!result) {
                this.isAnimating = false;
                if (onComplete) {
                    onComplete();
                }
                return;
            }

            const tilesToPop: Tile[] = [];

            for (let i = 0; i < result.removed.length; i++) {
                const cell = result.removed[i];
                const visualTile = this.fieldView.getTile(cell.row, cell.col);

                if (visualTile) {
                    tilesToPop.push(visualTile);
                }
            }

            const completeStep = () => {
                this.fieldView.rebuild(this.model.getBoard());
                this.updateMovesView();
                this.updateScoreView();
                this.isAnimating = false;
                this.checkEndGame();
                this.model.applyGravityAndRefill();
                this.fieldView.rebuild(this.model.getBoard());
                if (onComplete) {
                    onComplete();
                }
            };

            if (this.animationView && tilesToPop.length > 0) {
                this.animationView.playGroupRemoveAnimation(tilesToPop, completeStep);
            } else {
                completeStep();
            }
        };

        const preAnimation = data && typeof data.preAnimation === "function" ? data.preAnimation : null;

        this.isAnimating = true;

        if (preAnimation && this.animationView) {
            preAnimation(this.fieldView, this.animationView, applyBooster);
        } else {
            applyBooster();
        }
    }


    private checkEndGame() {
        const targetScore = this.model.getTargetScore();
        const score = this.model.getScore();
        const remainingMoves = this.model.getRemainingMoves();
        const hasMovesOnBoard = this.model.hasAvailableMoves();

        const hasTarget = targetScore > 0;
        const isWin = hasTarget && score >= targetScore;
        const isLoseByMoves = hasTarget && score < targetScore && remainingMoves <= 0;
        const isLoseByNoMoves = hasTarget && score < targetScore && remainingMoves > 0 && !hasMovesOnBoard;

        if (isWin) {
            if (this.winCallback) {
                this.winCallback();
            }
            return;
        }

        if (isLoseByMoves) {
            if (this.loseCallback) {
                this.loseCallback();
            }
            return;
        }

        if (isLoseByNoMoves && this.noMovesResolver) {
            this.isAnimating = true;

            const shuffle = (onComplete: () => void) => {
                this.model.shuffleBoard();
                if (this.fieldView.playShuffleAnimation) {
                    this.fieldView.playShuffleAnimation(this.model.getBoard(), () => {
                        this.isAnimating = false;
                        onComplete();
                    });
                } else {
                    this.fieldView.rebuild(this.model.getBoard());
                    this.isAnimating = false;
                    onComplete();
                }
            };

            if (this.noMovesResolver.tryResolve(shuffle)) {
                return;
            }

            this.isAnimating = false;
        }

        if (isLoseByNoMoves) {
            if (this.loseCallback) {
                this.loseCallback();
            }
        }
    }

    private updateMovesView() {
        if (!this.movesChangedCallback) {
            return;
        }

        this.movesChangedCallback(this.model.getRemainingMoves());
    }

    private updateScoreView() {
        if (!this.scoreChangedCallback) {
            return;
        }

        this.scoreChangedCallback(this.model.getScore(), this.model.getTargetScore());
    }
}

