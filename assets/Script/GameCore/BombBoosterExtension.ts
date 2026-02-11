import IBoosterExtension from "./IBoosterExtension";
import BlastGameModel, { BlastGameStepResult } from "./BlastGameModel";

export default class BombBoosterExtension implements IBoosterExtension {
    id: string = "bomb";

    private radius: number;

    constructor(radius: number = 1) {
        this.radius = radius >= 0 ? radius : 1;
    }

    handle(model: BlastGameModel, data?: any): BlastGameStepResult | null {
        if (!data || typeof data.row !== "number" || typeof data.col !== "number") {
            return null;
        }

        const row = data.row;
        const col = data.col;

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
