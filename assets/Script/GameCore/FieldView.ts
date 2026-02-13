import Tile from "../Tile";
import TileColorConfig from "../Config/TileColorConfig";
import { BlastGameBoardCell } from "./Models/BlastGameModel";
import IFieldView from "./IFieldView";
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";
import TileSpriteDictionary from "./TileSpriteDictionary";
import { MainGameConfig } from "../Config/MainGameConfigType";

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
    private tileSpriteDictionary: TileSpriteDictionary = null;

    constructor(rows: number, cols: number, colors: string[], mainGameConfig: MainGameConfig, defaultTileSpriteFrame: cc.SpriteFrame, tileColorConfig: TileColorConfig) {
        this.rows = rows;
        this.cols = cols;
        this.colors = colors && colors.length > 0 ? colors.slice() : ["red", "green", "blue", "yellow"];
        this.tileSize = mainGameConfig.tileSize;
        this.tileSpacing = mainGameConfig.tileSpacing;
        this.defaultTileSpriteFrame = defaultTileSpriteFrame;
        this.tileColorConfig = tileColorConfig;

        const container = DiContainer.instance;
        if (container.has(DiTokens.TileSpriteDictionary)) {
            this.tileSpriteDictionary = container.resolve<TileSpriteDictionary>(DiTokens.TileSpriteDictionary);
            if (!this.defaultTileSpriteFrame && this.tileSpriteDictionary.getDefaultSprite()) {
                this.defaultTileSpriteFrame = this.tileSpriteDictionary.getDefaultSprite();
            }
        }
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
                const cell = board[row][col] as BlastGameBoardCell;

                if (cell === null) {
                    this.tiles[row][col] = null;
                    continue;
                }

                const colorKey: string = this.normalizeKey(cell);
                const tile = this.createTile(row, col, colorKey);
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

    getCellAtPosition(localPos: cc.Vec2): { row: number; col: number } | null {
        const width = this.cols * this.tileSize + (this.cols - 1) * this.tileSpacing;
        const height = this.rows * this.tileSize + (this.rows - 1) * this.tileSpacing;
        const originX = -width * 0.5 + this.tileSize * 0.5;
        const originY = -height * 0.5 + this.tileSize * 0.5;
        const step = this.tileSize + this.tileSpacing;
        const col = Math.floor((localPos.x - originX + this.tileSize * 0.5) / step);
        const row = Math.floor((localPos.y - originY + this.tileSize * 0.5) / step);
        if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
            return null;
        }
        return { row, col };
    }

    setTileSuperAppearance(tile: Tile, spriteFrame: cc.SpriteFrame): void {
        const sprite = tile.node.getComponent(cc.Sprite);
        if (sprite && spriteFrame) {
            sprite.spriteFrame = spriteFrame;
        }
    }

    setTileBombAppearance(tile: Tile, bombSpriteFrame: cc.SpriteFrame): void {
        const sprite = tile.node.getComponent(cc.Sprite);
        if (sprite && bombSpriteFrame) {
            sprite.spriteFrame = bombSpriteFrame;
        }
    }

    getTilesInRadius(centerRow: number, centerCol: number, radius: number): Tile[] {
        const result: Tile[] = [];
        for (let r = centerRow - radius; r <= centerRow + radius; r++) {
            for (let c = centerCol - radius; c <= centerCol + radius; c++) {
                const tile = this.getTile(r, c);
                if (tile) {
                    result.push(tile);
                }
            }
        }
        return result;
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
        const delayBeforeShuffle = 0.25;
        const flyInDuration = 0.25;
        const flyOutDuration = 0.25;

        let completed = 0;
        const startFlyIn = () => {
        for (let i = 0; i < tilesList.length; i++) {
            const tile = tilesList[i];
            cc.tween(tile.node)
                .to(flyInDuration, { position: center })
                .call(onFlyInDone)
                .start();
        }
        };

        const onFlyInDone = () => {
            completed++;
            if (completed < tilesList.length) {
                return;
            }

            for (let i = 0; i < tilesList.length; i++) {
                const tile = tilesList[i];
                const row = Math.floor(i / this.cols);
                const col = i % this.cols;
                const cell = newBoard[row][col];
                if (cell === null) {
                    continue;
                }
                const colorKey: string = this.normalizeKey(cell);
                tile.row = row;
                tile.col = col;
                tile.tileType = colorKey;
                this.updateTileAppearance(tile, colorKey);
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

        setTimeout(startFlyIn, delayBeforeShuffle * 1000);
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

    private updateTileAppearance(tile: Tile, key: string): void {
        tile.tileType = key;
        const spriteFrame = this.spriteForKey(key);
        const sprite = tile.node.getComponent(cc.Sprite);
        if (sprite) {
            sprite.spriteFrame = spriteFrame;
            if (spriteFrame === this.defaultTileSpriteFrame) {
                tile.node.color = this.colorForKey(key);
            }
        }
    }

    private createTile(row: number, col: number, key: string): Tile {
        const node = new cc.Node();
        const sprite = node.addComponent(cc.Sprite);

        const spriteFrame = this.spriteForKey(key);

        sprite.spriteFrame = spriteFrame;
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        node.setContentSize(this.tileSize, this.tileSize);

        if (spriteFrame === this.defaultTileSpriteFrame) {
            node.color = this.colorForKey(key);
        }

        const tile = node.addComponent(Tile);
        tile.row = row;
        tile.col = col;
        tile.tileType = key;

        this.tilesRoot.addChild(node);
        this.updateTilePosition(tile);

        return tile;
    }

    private updateTilePosition(tile: Tile) {
        tile.node.position = this.getPositionForCell(tile.row, tile.col);
    }

    private normalizeKey(value: string | null): string {
        if (value === null) {
            return "default";
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : "default";
    }

    private spriteForKey(key: string): cc.SpriteFrame {
        if (this.tileSpriteDictionary) {
            const sprite = this.tileSpriteDictionary.get(key);
            if (sprite) {
                return sprite;
            }
        }
        if (this.tileColorConfig) {
            const sprite = this.tileColorConfig.getSprite(key);
            if (sprite) {
                return sprite;
            }
        }
        return this.defaultTileSpriteFrame;
    }

    private colorForKey(key: string): cc.Color {
        const index = this.colors.indexOf(key);
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

