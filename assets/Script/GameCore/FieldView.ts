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

    playShuffleAnimation(newBoard: BlastGameBoardCell[][], onComplete: () => void): void {
        const tilesList: Tile[] = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = this.tiles[row][col];
                if (tile) {
                    tilesList.push(tile);
                }
            }
        }

        if (tilesList.length === 0) {
            onComplete();
            return;
        }

        const center = this.getCenterPosition();
        const flyInDuration = 0.25;
        const flyOutDuration = 0.25;

        let completed = 0;
        const onFlyInDone = () => {
            completed++;
            if (completed < tilesList.length) {
                return;
            }

            for (let i = 0; i < tilesList.length; i++) {
                const tile = tilesList[i];
                const row = Math.floor(i / this.cols);
                const col = i % this.cols;
                const colorIndex = newBoard[row][col];
                if (colorIndex === null) {
                    continue;
                }
                tile.row = row;
                tile.col = col;
                tile.colorIndex = colorIndex;
                this.updateTileAppearance(tile, colorIndex);
            }

            const newTiles: (Tile | null)[][] = [];
            for (let r = 0; r < this.rows; r++) {
                newTiles[r] = [];
                for (let c = 0; c < this.cols; c++) {
                    newTiles[r][c] = null;
                }
            }
            for (let i = 0; i < tilesList.length; i++) {
                const tile = tilesList[i];
                newTiles[tile.row][tile.col] = tile;
            }
            this.tiles = newTiles;

            for (let i = 0; i < tilesList.length; i++) {
                const tile = tilesList[i];
                tile.node.setPosition(center);
            }

            completed = 0;
            const onFlyOutDone = () => {
                completed++;
                if (completed >= tilesList.length) {
                    onComplete();
                }
            };

            for (let i = 0; i < tilesList.length; i++) {
                const tile = tilesList[i];
                const targetPos = this.getPositionForCell(tile.row, tile.col);
                cc.tween(tile.node)
                    .to(flyOutDuration, { position: targetPos })
                    .call(onFlyOutDone)
                    .start();
            }
        };

        for (let i = 0; i < tilesList.length; i++) {
            const tile = tilesList[i];
            cc.tween(tile.node)
                .to(flyInDuration, { position: center })
                .call(onFlyInDone)
                .start();
        }
    }

    private getCenterPosition(): cc.Vec3 {
        return cc.v3(0, 0, 0);
    }

    private getPositionForCell(row: number, col: number): cc.Vec3 {
        const width = this.cols * this.tileSize + (this.cols - 1) * this.tileSpacing;
        const height = this.rows * this.tileSize + (this.rows - 1) * this.tileSpacing;
        const originX = -width * 0.5 + this.tileSize * 0.5;
        const originY = -height * 0.5 + this.tileSize * 0.5;
        const x = originX + col * (this.tileSize + this.tileSpacing);
        const y = originY + row * (this.tileSize + this.tileSpacing);
        return cc.v3(x, y, 0);
    }

    private updateTileAppearance(tile: Tile, colorIndex: number): void {
        tile.colorIndex = colorIndex;
        const colorKey = this.colorKeyForIndex(colorIndex);
        const spriteFrame = this.spriteForColorKey(colorKey);
        const sprite = tile.node.getComponent(cc.Sprite);
        if (sprite) {
            sprite.spriteFrame = spriteFrame;
            if (spriteFrame === this.defaultTileSpriteFrame) {
                tile.node.color = this.colorForIndex(colorIndex);
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
        tile.node.position = this.getPositionForCell(tile.row, tile.col);
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

