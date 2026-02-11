import ISupertileExtension from "./ISupertileExtension";
import BlastGameModel, { BlastGameStepResult } from "./BlastGameModel";

export default class DynamiteSupertileExtension implements ISupertileExtension {
    id: string = "dynamite";

    private radius: number;

    constructor(radius: number) {
        this.radius = radius >= 0 ? radius : 0;
    }

    handle(model: BlastGameModel, row: number, col: number, data?: any): BlastGameStepResult | null {
        if (!model.isInsidePublic(row, col)) {
            return null;
        }
        const removed: { row: number; col: number }[] = [];
        for (let r = row - this.radius; r <= row + this.radius; r++) {
            for (let c = col - this.radius; c <= col + this.radius; c++) {
                if (!model.isInsidePublic(r, c)) {
                    continue;
                }
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

