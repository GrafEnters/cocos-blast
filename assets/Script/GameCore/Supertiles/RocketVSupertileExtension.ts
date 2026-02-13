import ISupertileExtension from "./ISupertileExtension";
import IGameModel, { BlastGameStepResult } from "../Models/IGameModel";
import type { SupertileConfig } from "../../Config/SupertileConfig";
import { SuperTileData } from "../Types/SuperTileData";
import { getChainDataFromSuperTileData, createRemovedCellTracker, addSuperTileToQueue, addDirectStepToChain, processSuperTileQueue, calculateAndApplyScore, createBlastGameStepResult } from "./SupertileChainUtils";
import { SupertileIds } from "../Constants/GameConstants";

export default class RocketVSupertileExtension implements ISupertileExtension {
    id: string = SupertileIds.ROCKET_V;

    constructor(config: SupertileConfig) {
    }

    handle(model: IGameModel, row: number, col: number, data?: SuperTileData): BlastGameStepResult | null {
        if (col < 0 || col >= model.getCols()) {
            return null;
        }

        const chainData = getChainDataFromSuperTileData(data);
        const tracker = createRemovedCellTracker();
        const directStep: { row: number; col: number }[] = [];
        const scoreBefore = model.getScore();
        let directRemovedCount = 0;

        for (let r = 0; r < model.getRows(); r++) {
            const value = model.getCellValue(r, col);
            if (value === null) {
                continue;
            }
            if (r === row && col === col) {
                model.setCellValue(r, col, null);
                tracker.pushRemoved(r, col);
                directStep.push({ row: r, col });
                directRemovedCount++;
                continue;
            }
            if (model.isSuperTile(r, col)) {
                const id = model.getSuperTileId(r, col);
                if (!id || !chainData) {
                    continue;
                }
                addSuperTileToQueue(chainData, id, r, col);
                continue;
            }
            model.setCellValue(r, col, null);
            tracker.pushRemoved(r, col);
            directStep.push({ row: r, col });
            directRemovedCount++;
        }

        if (tracker.removed.length === 0) {
            return null;
        }

        addDirectStepToChain(chainData, directStep);
        processSuperTileQueue(model, chainData, tracker);
        calculateAndApplyScore(model, directRemovedCount);

        return createBlastGameStepResult(model, tracker.removed, scoreBefore);
    }
}

