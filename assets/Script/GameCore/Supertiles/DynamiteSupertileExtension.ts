import ISupertileExtension from "./ISupertileExtension";
import IGameModel, {BlastGameStepResult} from "../Models/IGameModel";
import type {DynamiteSupertileConfig} from "../../Config/DynamiteSupertileConfig";
import {SupertileConfig} from "../../Config/SupertileConfig";
import { SuperTileData, SuperTileChainData } from "../Types/SuperTileData";

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

    handle(model: IGameModel, row: number, col: number, data?: SuperTileData): BlastGameStepResult | null {
        if (!model.isInsidePublic(row, col)) {
            return null;
        }
        const removed: { row: number; col: number }[] = [];
        const used: { [key: string]: boolean } = {};
        const chainData = data && typeof data === "object" && "superTileChainSteps" in data && Array.isArray(data.superTileChainSteps) ? data as SuperTileChainData : null;
        const chainSteps = chainData ? chainData.superTileChainSteps : null;
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
                    if (chainData && "superTileQueue" in chainData && Array.isArray(chainData.superTileQueue)) {
                        const depth = typeof chainData.depth === "number" && chainData.depth >= 0 ? chainData.depth : 0;
                        chainData.superTileQueue.push({id, row: r, col: c, depth: depth + 1});
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
            const depth = chainData && typeof chainData.depth === "number" && chainData.depth >= 0 ? chainData.depth : 0;
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

