import ISupertileExtension from "./ISupertileExtension";
import BlastGameModel, { BlastGameStepResult } from "./BlastGameModel";

export default class RocketVSupertileExtension implements ISupertileExtension {
    id: string = "rocketV";

    handle(model: BlastGameModel, row: number, col: number, data?: any): BlastGameStepResult | null {
        if (col < 0 || col >= model.getCols()) {
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

        for (let r = 0; r < model.getRows(); r++) {
            const value = model.getCellValue(r, col);
            if (value === null) {
                continue;
            }
            if (r === row && col === col) {
                model.setCellValue(r, col, null);
                pushRemoved(r, col);
                directRemovedCount++;
                continue;
            }
            if (model.isSuperTile(r, col)) {
                const id = model.getSuperTileId(r, col);
                if (!id) {
                    continue;
                }
                const chainResult = model.handleSuperTileChain(id, r, col);
                if (chainResult && chainResult.removed && chainResult.removed.length > 0) {
                    for (let i = 0; i < chainResult.removed.length; i++) {
                        const cell = chainResult.removed[i];
                        pushRemoved(cell.row, cell.col);
                    }
                }
                continue;
            }
            model.setCellValue(r, col, null);
            pushRemoved(r, col);
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

