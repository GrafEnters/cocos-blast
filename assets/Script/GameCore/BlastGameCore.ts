import Tile from "../Tile";
import IGameCore from "./IGameCore";
import TileInputEventType from "./TileInputEventType";
import TileInputEvent from "./TileInputEvent";
import TileColorConfig from "../Config/TileColorConfig";

export default class BlastGameCore implements IGameCore {
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

    private totalMoves: number;
    private remainingMoves: number;
    private movesChangedCallback: ((moves: number) => void) | null = null;

    constructor(parentNode: cc.Node, defaultTileSpriteFrame: cc.SpriteFrame, rows: number, cols: number, colors: string[], tileSize: number, tileSpacing: number, tileColorConfig: TileColorConfig, moves: number, movesChangedCallback?: (moves: number) => void) {
        this.parentNode = parentNode;
        this.defaultTileSpriteFrame = defaultTileSpriteFrame;
        this.rows = rows;
        this.cols = cols;
        this.colors = colors && colors.length > 0 ? colors.slice() : ["red", "green", "blue", "yellow"];
        this.tileSize = tileSize;
        this.tileSpacing = tileSpacing;
        this.tileColorConfig = tileColorConfig;
        this.totalMoves = moves >= 0 ? moves : 0;
        this.remainingMoves = this.totalMoves;
        this.movesChangedCallback = movesChangedCallback || null;
    }

    init(): void {
        this.createTilesRoot();
        this.initBoard();

        this.updateMovesView();
    }

    getSupportedEvents(): TileInputEventType[] {
        return [TileInputEventType.Tap];
    }

    handleEvent(event: TileInputEvent): void {
        if (this.remainingMoves <= 0) {
            return;
        }

        if (event.type !== TileInputEventType.Tap) {
            return;
        }

        const tile = event.tile;
        const group = this.collectGroup(tile);

        if (group.length < 2) {
            return;
        }

        this.removeGroup(group);
        this.applyGravityAndRefill();
        this.decreaseMoves();
    }

    getRemainingMoves(): number {
        return this.remainingMoves;
    }

    private createTilesRoot() {
        this.tilesRoot = new cc.Node();
        this.tilesRoot.name = "TilesRoot";
        this.parentNode.addChild(this.tilesRoot);
    }

    private initBoard() {
        this.tiles = [];

        for (let row = 0; row < this.rows; row++) {
            this.tiles[row] = [];
            for (let col = 0; col < this.cols; col++) {
                const colorIndex = this.randomColorIndex();
                const tile = this.createTile(row, col, colorIndex);
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

    private randomColorIndex(): number {
        return Math.floor(Math.random() * this.colors.length);
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

    private collectGroup(startTile: Tile): Tile[] {
        const result: Tile[] = [];
        const visited: boolean[][] = [];
        const stack: Tile[] = [];

        for (let row = 0; row < this.rows; row++) {
            visited[row] = [];
            for (let col = 0; col < this.cols; col++) {
                visited[row][col] = false;
            }
        }

        stack.push(startTile);
        const targetColor = startTile.colorIndex;

        while (stack.length > 0) {
            const tile = stack.pop() as Tile;

            if (visited[tile.row][tile.col]) {
                continue;
            }

            visited[tile.row][tile.col] = true;
            result.push(tile);

            const neighbors = this.getNeighbors(tile.row, tile.col);

            for (let i = 0; i < neighbors.length; i++) {
                const neighbor = neighbors[i];

                if (!neighbor) {
                    continue;
                }

                if (visited[neighbor.row][neighbor.col]) {
                    continue;
                }

                if (neighbor.colorIndex !== targetColor) {
                    continue;
                }

                stack.push(neighbor);
            }
        }

        return result;
    }

    private getNeighbors(row: number, col: number): Array<Tile | null> {
        const neighbors: Array<Tile | null> = [];

        neighbors.push(this.getTile(row + 1, col));
        neighbors.push(this.getTile(row - 1, col));
        neighbors.push(this.getTile(row, col + 1));
        neighbors.push(this.getTile(row, col - 1));

        return neighbors;
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

    private removeGroup(group: Tile[]) {
        for (let i = 0; i < group.length; i++) {
            const tile = group[i];

            if (this.tiles[tile.row][tile.col] === tile) {
                this.tiles[tile.row][tile.col] = null;
            }

            tile.node.destroy();
        }
    }

    private applyGravityAndRefill() {
        for (let col = 0; col < this.cols; col++) {
            let nextRow = 0;

            for (let row = 0; row < this.rows; row++) {
                const tile = this.tiles[row][col];

                if (!tile) {
                    continue;
                }

                if (row !== nextRow) {
                    this.tiles[nextRow][col] = tile;
                    this.tiles[row][col] = null;
                    tile.row = nextRow;
                    this.updateTilePosition(tile);
                }

                nextRow++;
            }

            for (let row = nextRow; row < this.rows; row++) {
                const colorIndex = this.randomColorIndex();
                const tile = this.createTile(row, col, colorIndex);
                this.tiles[row][col] = tile;
            }
        }
    }

    private decreaseMoves() {
        if (this.remainingMoves <= 0) {
            return;
        }

        this.remainingMoves--;
        this.updateMovesView();
    }

    private updateMovesView() {
        if (!this.movesChangedCallback) {
            return;
        }

        this.movesChangedCallback(this.remainingMoves);
    }
}

