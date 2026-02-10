import Tile from "../Tile";
import TileColorConfig from "../Config/TileColorConfig";
import { BlastGameBoardCell } from "./BlastGameModel";
import IFieldView from "./IFieldView";

export default class FieldView implements IFieldView {
    private rows: number;
    private cols: number;
    private colors: string[];
    private tileSize: number;
    private tileSpacing: number;

    private tilesRoot: cc.Node = null;
    private tiles: Tile[][] = [];
    private tileColorConfig: TileColorConfig = null;
    private defaultTileSpriteFrame: cc.SpriteFrame;

    constructor(rows: number, cols: number, colors: string[], tileSize: number, tileSpacing: number, defaultTileSpriteFrame: cc.SpriteFrame, tileColorConfig: TileColorConfig) {
        this.rows = rows;
        this.cols = cols;
        this.colors = colors && colors.length > 0 ? colors.slice() : ["red", "green", "blue", "yellow"];
        this.tileSize = tileSize;
        this.tileSpacing = tileSpacing;
        this.defaultTileSpriteFrame = defaultTileSpriteFrame;
        this.tileColorConfig = tileColorConfig;
    }

    init(parentNode: cc.Node): void {
        this.tilesRoot = new cc.Node();
        this.tilesRoot.name = "TilesRoot";
        parentNode.addChild(this.tilesRoot);
    }

    rebuild(board: BlastGameBoardCell[][]): void {
        this.tilesRoot.removeAllChildren();
        this.tiles = [];

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

    getTile(row: number, col: number): Tile | null {
        if (row < 0 || row >= this.rows) {
            return null;
        }

        if (col < 0 || col >= this.cols) {
            return null;
        }

        return this.tiles[row][col];
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
}

