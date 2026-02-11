import Tile from "../Tile";
import { BlastGameBoardCell } from "./BlastGameModel";

export default interface IFieldView {
    init(parentNode: cc.Node): void;
    rebuild(board: BlastGameBoardCell[][]): void;
    getTile(row: number, col: number): Tile | null;
    playShuffleAnimation?(newBoard: BlastGameBoardCell[][], onComplete: () => void): void;
}

