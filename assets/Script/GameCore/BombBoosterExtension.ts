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
        const chainData = data && data.chainData && Array.isArray(data.chainData.superTileChainSteps) ? data.chainData as { superTileChainSteps: { depth: number; cells: { row: number; col: number }[] }[]; superTileQueue?: { id: string; row: number; col: number; depth: number }[]; depth?: number } : null;
        const directStep: { row: number; col: number }[] = [];

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
                    if (chainData) {
                        if (!Array.isArray(chainData.superTileQueue)) {
                            chainData.superTileQueue = [];
                        }
                        const depth = typeof chainData.depth === "number" && chainData.depth >= 0 ? chainData.depth : 0;
                        chainData.superTileQueue.push({ id, row: r, col: c, depth: depth + 1 });
                    }
                    continue;
                }
                model.setCellValue(r, c, null);
                pushRemoved(r, c);
                directStep.push({ row: r, col: c });
                directRemovedCount++;
            }
        }

        const baseDepth = chainData && typeof chainData.depth === "number" && chainData.depth >= 0 ? chainData.depth : 0;

        if (chainData && Array.isArray(chainData.superTileQueue) && chainData.superTileQueue.length > 0) {
            const chainResult = model.processSuperTileQueuePublic(chainData);
            if (chainResult && chainResult.removed && chainResult.removed.length > 0) {
                for (let i = 0; i < chainResult.removed.length; i++) {
                    const cell = chainResult.removed[i];
                    pushRemoved(cell.row, cell.col);
                }
            }
        }

        if (removed.length === 0) {
            return null;
        }

        if (chainData && directStep.length > 0) {
            chainData.superTileChainSteps.push({ depth: baseDepth, cells: directStep });
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
