import Tile from "../Tile";
import { BlastGameBoardCell } from "./BlastGameModel";

export default interface IFieldView {
    init(parentNode: cc.Node): void;
    rebuild(board: BlastGameBoardCell[][]): void;
    getTile(row: number, col: number): Tile | null;
    getCellAtPosition?(localPos: cc.Vec2): { row: number; col: number } | null;
    setTileBombAppearance?(tile: Tile, bombSpriteFrame: cc.SpriteFrame): void;
    getTilesInRadius?(centerRow: number, centerCol: number, radius: number): Tile[];
    playShuffleAnimation?(newBoard: BlastGameBoardCell[][], onComplete: () => void): void;
}

