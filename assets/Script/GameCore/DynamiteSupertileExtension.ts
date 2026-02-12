import ISupertileExtension from "./ISupertileExtension";
import IGameModel, {BlastGameStepResult} from "./IGameModel";
import type {DynamiteSupertileConfig} from "../Config/DynamiteSupertileConfig";
import {SupertileConfig} from "../Config/SupertileConfig";

export default class DynamiteSupertileExtension implements ISupertileExtension {
    id: string = "dynamite";

    private radius: number;

    constructor(config: SupertileConfig) {
        const dynamiteConfig = config as DynamiteSupertileConfig;
        if (!dynamiteConfig) {
            throw new Error("DynamiteSupertileExtension requires a radius property");
        }
        this.radius = config.radius;
    }

    handle(model: IGameModel, row: number, col: number, data?: any): BlastGameStepResult | null {
        if (!model.isInsidePublic(row, col)) {
            return null;
        }
        const removed: { row: number; col: number }[] = [];
        const used: { [key: string]: boolean } = {};
        const chainSteps = data && Array.isArray(data.superTileChainSteps) ? data.superTileChainSteps as { depth: number; cells: { row: number; col: number }[] }[] : null;
        const directStep: { row: number; col: number }[] = [];

        const pushRemoved = (r: number, c: number) => {
            const key = r + "_" + c;
            if (used[key]) {
                return;
            }
            used[key] = true;
            removed.push({row: r, col: c});
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
                    directStep.push({row: r, col: c});
                    directRemovedCount++;
                    continue;
                }
                if (model.isSuperTile(r, c)) {
                    const id = model.getSuperTileId(r, c);
                    if (!id) {
                        continue;
                    }
                    if (data && Array.isArray(data.superTileQueue)) {
                        const depth = typeof data.depth === "number" && data.depth >= 0 ? data.depth : 0;
                        data.superTileQueue.push({id, row: r, col: c, depth: depth + 1});
                    }
                    continue;
                }
                model.setCellValue(r, c, null);
                pushRemoved(r, c);
                directStep.push({row: r, col: c});
                directRemovedCount++;
            }
        }
        if (removed.length === 0) {
            return null;
        }
        if (chainSteps && directStep.length > 0) {
            const depth = data && typeof data.depth === "number" && data.depth >= 0 ? data.depth : 0;
            chainSteps.push({depth, cells: directStep});
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

