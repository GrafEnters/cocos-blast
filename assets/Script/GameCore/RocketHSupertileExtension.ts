import ISupertileExtension from "./ISupertileExtension";
import BlastGameModel, { BlastGameStepResult } from "./BlastGameModel";

export default class RocketHSupertileExtension implements ISupertileExtension {
    id: string = "rocketH";

    handle(model: BlastGameModel, row: number, col: number, data?: any): BlastGameStepResult | null {
        if (row < 0 || row >= model.getRows()) {
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

        for (let c = 0; c < model.getCols(); c++) {
            const value = model.getCellValue(row, c);
            if (value === null) {
                continue;
            }
            if (row === row && c === col) {
                model.setCellValue(row, c, null);
                pushRemoved(row, c);
                directRemovedCount++;
                continue;
            }
            if (model.isSuperTile(row, c)) {
                const id = model.getSuperTileId(row, c);
                if (!id) {
                    continue;
                }
                const chainResult = model.handleSuperTileChain(id, row, c);
                if (chainResult && chainResult.removed && chainResult.removed.length > 0) {
                    for (let i = 0; i < chainResult.removed.length; i++) {
                        const cell = chainResult.removed[i];
                        pushRemoved(cell.row, cell.col);
                    }
                }
                continue;
            }
            model.setCellValue(row, c, null);
            pushRemoved(row, c);
            directRemovedCount++;
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

