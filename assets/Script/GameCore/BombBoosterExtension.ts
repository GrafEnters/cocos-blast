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
        const used: { [key: string]: boolean } = {};

        const pushRemoved = (r: number, c: number) => {
            const key = r + "_" + c;
            if (used[key]) {
                return;
            }
            used[key] = true;
            removed.push({ row: r, col: c });
        };

        const scoreBefore = model.getScore();
        let directRemovedCount = 0;

        for (let r = row - this.radius; r <= row + this.radius; r++) {
            for (let c = col - this.radius; c <= col + this.radius; c++) {
                if (!model.isInsidePublic(r, c)) {
                    continue;
                }
                const value = model.getCellValue(r, c);
                if (value === null) {
                    continue;
                }
                if (model.isSuperTile(r, c)) {
                    const id = model.getSuperTileId(r, c);
                    if (!id) {
                        continue;
                    }
                    const chainResult = model.handleSuperTileChain(id, r, c);
                    if (chainResult && chainResult.removed && chainResult.removed.length > 0) {
                        for (let i = 0; i < chainResult.removed.length; i++) {
                            const cell = chainResult.removed[i];
                            pushRemoved(cell.row, cell.col);
                        }
                    }
                    continue;
                }
                model.setCellValue(r, c, null);
                pushRemoved(r, c);
                directRemovedCount++;
            }
        }

        if (removed.length === 0) {
            return null;
        }

        if (directRemovedCount > 0) {
            const scoreDeltaDirect = model.calculateGroupScorePublic(directRemovedCount);
            model.applyScorePublic(scoreDeltaDirect);
        }

        const scoreDelta = model.getScore() - scoreBefore;

        return {
            removed,
            score: model.getScore(),
            targetScore: model.getTargetScore(),
            remainingMoves: model.getRemainingMoves(),
            scoreDelta,
        };
    }
}
