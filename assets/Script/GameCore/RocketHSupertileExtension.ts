import ISupertileExtension from "./ISupertileExtension";
import BlastGameModel, { BlastGameStepResult } from "./BlastGameModel";

export default class RocketHSupertileExtension implements ISupertileExtension {
    id: string = "rocketH";

    handle(model: BlastGameModel, row: number, col: number, data?: any): BlastGameStepResult | null {
        if (row < 0 || row >= model.getRows()) {
            return null;
        }
        const removed: { row: number; col: number }[] = [];
        for (let c = 0; c < model.getCols(); c++) {
            const value = model.getCellValue(row, c);
            if (value === null) {
                continue;
            }
            removed.push({ row, col: c });
            model.setCellValue(row, c, null);
        }
        if (removed.length === 0) {
            return null;
        }
        const scoreDelta = model.calculateGroupScorePublic(removed.length);
        model.applyScorePublic(scoreDelta);
        return {
            removed,
            score: model.getScore(),
            targetScore: model.getTargetScore(),
            remainingMoves: model.getRemainingMoves(),
            scoreDelta,
        };
    }
}

