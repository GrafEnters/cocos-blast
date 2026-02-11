import ISupertileExtension from "./ISupertileExtension";
import BlastGameModel, { BlastGameStepResult } from "./BlastGameModel";

export default class RocketVSupertileExtension implements ISupertileExtension {
    id: string = "rocketV";

    handle(model: BlastGameModel, row: number, col: number, data?: any): BlastGameStepResult | null {
        if (col < 0 || col >= model.getCols()) {
            return null;
        }
        const removed: { row: number; col: number }[] = [];
        for (let r = 0; r < model.getRows(); r++) {
            const value = model.getCellValue(r, col);
            if (value === null) {
                continue;
            }
            removed.push({ row: r, col });
            model.setCellValue(r, col, null);
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

