import ISupertileExtension from "./ISupertileExtension";
import BlastGameModel, { BlastGameStepResult } from "./BlastGameModel";

export default class DynamiteMaxSupertileExtension implements ISupertileExtension {
    id: string = "dynamiteMax";

    handle(model: BlastGameModel, row: number, col: number, data?: any): BlastGameStepResult | null {
        const removed: { row: number; col: number }[] = [];
        for (let r = 0; r < model.getRows(); r++) {
            for (let c = 0; c < model.getCols(); c++) {
                const value = model.getCellValue(r, c);
                if (value === null) {
                    continue;
                }
                removed.push({ row: r, col: c });
                model.setCellValue(r, c, null);
            }
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

