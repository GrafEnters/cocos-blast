import Tile from "../Tile";
import IGameCore from "./IGameCore";
import TileInputEventType from "./TileInputEventType";
import TileInputEvent from "./TileInputEvent";
import TileColorConfig from "../Config/TileColorConfig";
import BlastGameModel, { BlastGameBoardCell } from "./BlastGameModel";
import IBlastGameCoreView from "./IBlastGameCoreView";

export default class GameController implements IGameCore {
    private parentNode: cc.Node;
    private defaultTileSpriteFrame: cc.SpriteFrame;

    private rows: number;
    private cols: number;
    private colors: string[];
    private tileSize: number;
    private tileSpacing: number;

    private tilesRoot: cc.Node = null;
    private tiles: Tile[][] = [];
    private tileColorConfig: TileColorConfig = null;

    private view: IBlastGameCoreView = null;
    private model: BlastGameModel = null;

    private isAnimating: boolean = false;

    private movesChangedCallback: ((moves: number) => void) | null = null;
    private scoreChangedCallback: ((score: number, targetScore: number) => void) | null = null;

    constructor(parentNode: cc.Node, defaultTileSpriteFrame: cc.SpriteFrame, rows: number, cols: number, colors: string[], tileSize: number, tileSpacing: number, tileColorConfig: TileColorConfig, moves: number, targetScore: number, movesChangedCallback?: (moves: number) => void, scoreChangedCallback?: (score: number, targetScore: number) => void, view?: IBlastGameCoreView) {
        this.parentNode = parentNode;
        this.defaultTileSpriteFrame = defaultTileSpriteFrame;
        this.rows = rows;
        this.cols = cols;
        this.colors = colors && colors.length > 0 ? colors.slice() : ["red", "green", "blue", "yellow"];
        this.tileSize = tileSize;
        this.tileSpacing = tileSpacing;
        this.tileColorConfig = tileColorConfig;
        this.movesChangedCallback = movesChangedCallback || null;
        this.scoreChangedCallback = scoreChangedCallback || null;
        this.view = view || null;

        this.model = new BlastGameModel(rows, cols, this.colors, moves, targetScore);
    }

    init(): void {
        this.model.init();

        this.createTilesRoot();
        this.rebuildViewFromModel();

        this.updateMovesView();
        this.updateScoreView();
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
            const visualTile = this.getTile(cell.row, cell.col);

            if (visualTile) {
                tilesToPop.push(visualTile);
            }
        }

        this.isAnimating = true;

        const completeStep = () => {
            this.rebuildViewFromModel();
            this.updateMovesView();
            this.updateScoreView();
            this.isAnimating = false;
        };

        if (this.view && tilesToPop.length > 0) {
            this.view.playGroupPopAnimation(tilesToPop, completeStep);
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

    private createTilesRoot() {
        this.tilesRoot = new cc.Node();
        this.tilesRoot.name = "TilesRoot";
        this.parentNode.addChild(this.tilesRoot);
    }

    private rebuildViewFromModel() {
        this.tilesRoot.removeAllChildren();
        this.tiles = [];

        const board = this.model.getBoard();

        for (let row = 0; row < this.rows; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const value = board[row][col] as BlastGameBoardCell;

                if (value === null) {
                    this.tiles[row][col] = null;
                    continue;
                }

                const tile = this.createTile(row, col, value);
                this.tiles[row][col] = tile;
            }
        }
    }

    private createTile(row: number, col: number, colorIndex: number): Tile {
        const node = new cc.Node();
        const sprite = node.addComponent(cc.Sprite);

        const colorKey = this.colorKeyForIndex(colorIndex);
        const spriteFrame = this.spriteForColorKey(colorKey);

        sprite.spriteFrame = spriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        node.setContentSize(this.tileSize, this.tileSize);

        if (spriteFrame === this.defaultTileSpriteFrame) {
            node.color = this.colorForIndex(colorIndex);
        }

        const tile = node.addComponent(Tile);
        tile.row = row;
        tile.col = col;
        tile.colorIndex = colorIndex;

        this.tilesRoot.addChild(node);
        this.updateTilePosition(tile);

        return tile;
    }

    private updateTilePosition(tile: Tile) {
        const width = this.cols * this.tileSize + (this.cols - 1) * this.tileSpacing;
        const height = this.rows * this.tileSize + (this.rows - 1) * this.tileSpacing;

        const originX = -width * 0.5 + this.tileSize * 0.5;
        const originY = -height * 0.5 + this.tileSize * 0.5;

        const x = originX + tile.col * (this.tileSize + this.tileSpacing);
        const y = originY + tile.row * (this.tileSize + this.tileSpacing);

        tile.node.position = cc.v3(x, y, 0);
    }

    private colorKeyForIndex(index: number): string {
        if (index < 0 || index >= this.colors.length) {
            return "default";
        }

        return this.colors[index];
    }

    private spriteForColorKey(key: string): cc.SpriteFrame {
        if (this.tileColorConfig) {
            const sprite = this.tileColorConfig.getSprite(key);

            if (sprite) {
                return sprite;
            }
        }

        return this.defaultTileSpriteFrame;
    }

    private colorForIndex(index: number): cc.Color {
        switch (index) {
            case 0:
                return cc.Color.RED;
            case 1:
                return cc.Color.GREEN;
            case 2:
                return cc.Color.BLUE;
            case 3:
                return cc.Color.YELLOW;
            default:
                return cc.Color.WHITE;
        }
    }

    private getTile(row: number, col: number): Tile | null {
        if (row < 0 || row >= this.rows) {
            return null;
        }

        if (col < 0 || col >= this.cols) {
            return null;
        }

        return this.tiles[row][col];
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

