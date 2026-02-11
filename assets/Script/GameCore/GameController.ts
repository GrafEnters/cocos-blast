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

    applyTeleport(fromRow: number, fromCol: number, toRow: number, toCol: number, onComplete: () => void): void {
        if (this.isAnimating) {
            onComplete();
            return;
        }
        if (this.model.getRemainingMoves() <= 0) {
            onComplete();
            return;
        }
        if (this.model.getTargetScore() > 0 && this.model.getScore() >= this.model.getTargetScore()) {
            onComplete();
            return;
        }
        const fromTile = this.fieldView.getTile(fromRow, fromCol);
        const toTile = this.fieldView.getTile(toRow, toCol);
        if (!fromTile || !toTile) {
            onComplete();
            return;
        }
        if (fromRow === toRow && fromCol === toCol) {
            onComplete();
            return;
        }
        const fromNode = fromTile.node;
        const toNode = toTile.node;
        if (!fromNode || !toNode || !fromNode.parent || fromNode.parent !== toNode.parent) {
            onComplete();
            return;
        }
        const parent = fromNode.parent;
        const childrenCount = parent.childrenCount;
        fromNode.setSiblingIndex(childrenCount - 1);
        toNode.setSiblingIndex(childrenCount - 2 >= 0 ? childrenCount - 2 : childrenCount - 1);
        const fromPos = fromNode.position.clone();
        const toPos = toNode.position.clone();
        this.isAnimating = true;
        let completed = 0;
        const onSwapComplete = () => {
            completed++;
            if (completed < 2) {
                return;
            }
            this.model.handleTeleport(fromRow, fromCol, toRow, toCol);
            this.fieldView.rebuild(this.model.getBoard());
            this.updateMovesView();
            this.updateScoreView();
            this.isAnimating = false;
            this.checkEndGame();
            onComplete();
        };
        cc.tween(fromNode)
            .to(0.15, { position: toPos })
            .call(onSwapComplete)
            .start();
        cc.tween(toNode)
            .to(0.15, { position: fromPos })
            .call(onSwapComplete)
            .start();
    }

    applyBombAt(row: number, col: number, bombSpriteFrame: cc.SpriteFrame, onComplete: () => void): void {
        if (this.isAnimating) {
            onComplete();
            return;
        }
        if (this.model.getRemainingMoves() <= 0) {
            onComplete();
            return;
        }
        const radius = 1;
        const centerTile = this.fieldView.getTile(row, col);
        if (!centerTile) {
            onComplete();
            return;
        }
        const fv = this.fieldView as FieldView;
        if (!fv.setTileBombAppearance || !fv.getTilesInRadius) {
            onComplete();
            return;
        }
        fv.setTileBombAppearance(centerTile, bombSpriteFrame);
        const tilesInRadius = fv.getTilesInRadius(row, col, radius);
        if (tilesInRadius.length === 0) {
            onComplete();
            return;
        }
        const chainedSuperTiles: { row: number; col: number; id: string }[] = [];
        for (let r = row - radius; r <= row + radius; r++) {
            for (let c = col - radius; c <= col + radius; c++) {
                const id = this.model.getSuperTileId(r, c);
                if (!id) {
                    continue;
                }
                chainedSuperTiles.push({ row: r, col: c, id });
            }
        }
        this.isAnimating = true;
        const completeStep = () => {
            this.fieldView.rebuild(this.model.getBoard());
            this.updateMovesView();
            this.updateScoreView();
            this.activateSuperTilesChain(chainedSuperTiles, () => {
                this.isAnimating = false;
                this.checkEndGame();
                this.model.applyGravityAndRefill();
                this.fieldView.rebuild(this.model.getBoard());
                onComplete();
            });
        };
        const doExplodeAfterBurn = () => {
            const result = this.model.handleBombNoMove(row, col, radius);
            if (!result) {
                this.isAnimating = false;
                onComplete();
                return;
            }
            if (this.animationView && tilesInRadius.length > 0) {
                this.animationView.playGroupRemoveAnimation(tilesInRadius, completeStep);
            } else {
                completeStep();
            }
        };
        if (this.animationView && this.animationView.playBombBurnAnimation) {
            this.animationView.playBombBurnAnimation(centerTile.node, 1.5, doExplodeAfterBurn);
        } else {
            doExplodeAfterBurn();
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

    private activateSuperTilesChain(superTiles: { row: number; col: number; id: string }[], onComplete: () => void): void {
        if (!superTiles || superTiles.length === 0) {
            onComplete();
            return;
        }
        const queue = superTiles.slice();
        const step = () => {
            if (queue.length === 0) {
                onComplete();
                return;
            }
            const current = queue.shift() as { row: number; col: number; id: string };
            if (current.id === "rocketH") {
                this.handleRocketHChain(current.row, step);
            } else if (current.id === "rocketV") {
                this.handleRocketVChain(current.col, step);
            } else if (current.id === "dynamite") {
                this.handleDynamiteChain(current.row, current.col, step);
            } else if (current.id === "dynamiteMax") {
                this.handleDynamiteMaxChain(step);
            } else {
                step();
            }
        };
        step();
    }

    private handleRocketHChain(row: number, onComplete: () => void): void {
        const removedTiles: Tile[] = [];
        for (let col = 0; col < this.cols; col++) {
            const visualTile = this.fieldView.getTile(row, col);
            if (visualTile) {
                removedTiles.push(visualTile);
            }
        }
        const result = this.model.handleRocketHNoMove(row);
        if (!result) {
            onComplete();
            return;
        }
        const completeStep = () => {
            this.fieldView.rebuild(this.model.getBoard());
            this.updateMovesView();
            this.updateScoreView();
            onComplete();
        };
        if (this.animationView && removedTiles.length > 0) {
            this.animationView.playGroupRemoveAnimation(removedTiles, completeStep);
        } else {
            completeStep();
        }
    }

    private handleRocketVChain(col: number, onComplete: () => void): void {
        const removedTiles: Tile[] = [];
        for (let row = 0; row < this.rows; row++) {
            const visualTile = this.fieldView.getTile(row, col);
            if (visualTile) {
                removedTiles.push(visualTile);
            }
        }
        const result = this.model.handleRocketVNoMove(col);
        if (!result) {
            onComplete();
            return;
        }
        const completeStep = () => {
            this.fieldView.rebuild(this.model.getBoard());
            this.updateMovesView();
            this.updateScoreView();
            onComplete();
        };
        if (this.animationView && removedTiles.length > 0) {
            this.animationView.playGroupRemoveAnimation(removedTiles, completeStep);
        } else {
            completeStep();
        }
    }

    private handleDynamiteChain(row: number, col: number, onComplete: () => void): void {
        let radius = 2;
        if (this.superTilesConfig) {
            const cfg = this.superTilesConfig.getSuperTileConfig("dynamite");
            if (cfg && typeof cfg.radius === "number" && cfg.radius >= 0) {
                radius = cfg.radius;
            }
        }
        const removedTiles: Tile[] = [];
        const fv = this.fieldView as FieldView;
        if (fv.getTilesInRadius) {
            const tilesInRadius = fv.getTilesInRadius(row, col, radius);
            removedTiles.push(...tilesInRadius);
        } else {
            for (let r = row - radius; r <= row + radius; r++) {
                for (let c = col - radius; c <= col + radius; c++) {
                    const visualTile = this.fieldView.getTile(r, c);
                    if (visualTile) {
                        removedTiles.push(visualTile);
                    }
                }
            }
        }
        const result = this.model.handleDynamiteNoMove(row, col, radius);
        if (!result) {
            onComplete();
            return;
        }
        const completeStep = () => {
            this.fieldView.rebuild(this.model.getBoard());
            this.updateMovesView();
            this.updateScoreView();
            onComplete();
        };
        if (this.animationView && removedTiles.length > 0) {
            this.animationView.playGroupRemoveAnimation(removedTiles, completeStep);
        } else {
            completeStep();
        }
    }

    private handleDynamiteMaxChain(onComplete: () => void): void {
        const removedTiles: Tile[] = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const visualTile = this.fieldView.getTile(row, col);
                if (visualTile) {
                    removedTiles.push(visualTile);
                }
            }
        }
        const result = this.model.handleDynamiteMaxNoMove();
        if (!result) {
            onComplete();
            return;
        }
        const completeStep = () => {
            this.fieldView.rebuild(this.model.getBoard());
            this.updateMovesView();
            this.updateScoreView();
            onComplete();
        };
        if (this.animationView && removedTiles.length > 0) {
            this.animationView.playGroupRemoveAnimation(removedTiles, completeStep);
        } else {
            completeStep();
        }
    }

}

