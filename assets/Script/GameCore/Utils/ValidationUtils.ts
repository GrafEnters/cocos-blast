import IGameModel from "../Models/IGameModel";
import { BlastGameBoardCell } from "../Models/IGameModel";

export function isValidPosition(model: IGameModel, row: number, col: number): boolean {
    return model.isInsidePublic(row, col);
}

export function isValidCellValue(value: BlastGameBoardCell): value is string {
    return value !== null && value.trim().length > 0;
}

export function canProcessGameEvent(model: IGameModel): boolean {
    if (model.getRemainingMoves() <= 0) {
        return false;
    }

    const targetScore = model.getTargetScore();
    if (targetScore > 0 && model.getScore() >= targetScore) {
        return false;
    }

    return true;
}
