import Tile from "../Tile";
import IGameController from "./IGameController";
import TileInputEventType from "./TileInputEventType";
import TileInputEvent from "./TileInputEvent";
import TileColorConfig from "../Config/TileColorConfig";
import IGameModel, { GameEventResult } from "./IGameModel";
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

export default class GameController implements IGameController {
    private parentNode: cc.Node;
    private colors: string[];
    private tileSize: number;
    private tileSpacing: number;
    private tileColorConfig: TileColorConfig = null;

    private animationView: IAnimationView = null;
    private model: IGameModel = null;
    private fieldView: IFieldView = null;
    private noMovesResolver: INoMovesResolver | null = null;
    private initialField: (string | null)[][] | null = null;

    private superTilesConfig: SuperTilesConfig | null = null;

    private isAnimating: boolean = false;

    private movesChangedCallback: ((moves: number) => void) | null = null;
    private scoreChangedCallback: ((score: number, targetScore: number) => void) | null = null;
    private winCallback: (() => void) | null = null;
    private loseCallback: (() => void) | null = null;

    constructor(parentNode: cc.Node, rows: number, cols: number, colors: string[], tileSize: number, tileSpacing: number, tileColorConfig: TileColorConfig, moves: number, targetScore: number, modelFactory: (rows: number, cols: number, colors: string[], moves: number, targetScore: number) => IGameModel, movesChangedCallback?: (moves: number) => void, scoreChangedCallback?: (score: number, targetScore: number) => void, animationView?: IAnimationView, winCallback?: () => void, loseCallback?: () => void, noMovesResolver?: INoMovesResolver | null, initialField?: (string | null)[][] | null, superTilesConfig?: SuperTilesConfig | null) {
        this.parentNode = parentNode;
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

        this.model = modelFactory(rows, cols, this.colors, moves, targetScore);
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
        return this.model.getSupportedEvents();
    }

    handleEvent(event: TileInputEvent): void {
        if (this.isAnimating) {
            return;
        }

        const eventResult = this.model.handleEvent(event);
        if (!eventResult) {
            if (event.onComplete) {
                event.onComplete();
            }
            return;
        }

        this.playEventAnimations(eventResult, event.onComplete);
    }

    private playEventAnimations(eventResult: GameEventResult, onComplete?: () => void): void {
        const result = eventResult.stepResult;
        const animationSteps = eventResult.animationSteps || [];

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
            if (onComplete) {
                onComplete();
            }
        };

        const applyAnimations = () => {
            if (!this.animationView || tilesToPop.length === 0) {
                completeStep();
                return;
            }

            if (animationSteps.length > 0) {
                const steps: Tile[][] = [];
                const used: { [key: string]: boolean } = {};
                const depthsUsed: { [key: string]: boolean } = {};
                const depths: number[] = [];

                for (let i = 0; i < animationSteps.length; i++) {
                    const entry = animationSteps[i];
                    const depthKey = entry.depth.toString();
                    if (!depthsUsed[depthKey]) {
                        depthsUsed[depthKey] = true;
                        depths.push(entry.depth);
                    }
                }

                depths.sort((a, b) => a - b);

                for (let d = 0; d < depths.length; d++) {
                    const depth = depths[d];
                    const stepTiles: Tile[] = [];

                    for (let i = 0; i < animationSteps.length; i++) {
                        const entry = animationSteps[i];
                        if (entry.depth !== depth) {
                            continue;
                        }

                        const stepCells = entry.cells;
                        for (let j = 0; j < stepCells.length; j++) {
                            const cell = stepCells[j];
                            const key = cell.row + "_" + cell.col;
                            if (used[key]) {
                                continue;
                            }
                            const visualTile = this.fieldView.getTile(cell.row, cell.col);
                            if (visualTile) {
                                used[key] = true;
                                stepTiles.push(visualTile);
                            }
                        }
                    }

                    if (stepTiles.length > 0) {
                        steps.push(stepTiles);
                    }
                }

                if (steps.length > 0) {
                    let index = 0;
                    const playNext = () => {
                        if (index >= steps.length) {
                            completeStep();
                            return;
                        }
                        const group = steps[index];
                        index++;
                        this.animationView.playGroupRemoveAnimation(group, playNext);
                    };
                    playNext();
                    return;
                }
            }

            this.animationView.playGroupRemoveAnimation(tilesToPop, completeStep);
        };

        if (eventResult.preAnimation && this.animationView) {
            eventResult.preAnimation(this.fieldView, this.animationView, applyAnimations);
        } else {
            applyAnimations();
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
        let tile: Tile = null;
        if (data && typeof data.row === "number" && typeof data.col === "number") {
            tile = this.fieldView.getTile(data.row, data.col);
        }

        if (!tile) {
            tile = { row: -1, col: -1, node: null } as Tile;
        }

        const event: TileInputEvent = {
            type: TileInputEventType.Booster,
            tile: tile,
            boosterId: boosterId,
            boosterData: data || {},
            onComplete: onComplete
        };
        this.handleEvent(event);
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

