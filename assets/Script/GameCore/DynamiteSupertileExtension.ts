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
                if (r === row && c === col) {
                    model.setCellValue(r, c, null);
                    pushRemoved(r, c);
                    directRemovedCount++;
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

