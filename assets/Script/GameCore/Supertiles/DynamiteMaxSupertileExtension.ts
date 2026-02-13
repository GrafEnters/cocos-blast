import ISupertileExtension from "./ISupertileExtension";
import IGameModel, { BlastGameStepResult } from "../Models/IGameModel";
import type { SupertileConfig } from "../../Config/SupertileConfig";
import { SuperTileData } from "../Types/SuperTileData";
import { getChainDataFromSuperTileData, createRemovedCellTracker, addSuperTileToQueue, addDirectStepToChain, processSuperTileQueue, calculateAndApplyScore, createBlastGameStepResult } from "./SupertileChainUtils";
import { SupertileIds } from "../Constants/GameConstants";

export default class DynamiteMaxSupertileExtension implements ISupertileExtension {
    id: string = SupertileIds.DYNAMITE_MAX;

    constructor(config: SupertileConfig) {
    }

    handle(model: IGameModel, row: number, col: number, data?: SuperTileData): BlastGameStepResult | null {
        const chainData = getChainDataFromSuperTileData(data);
        const tracker = createRemovedCellTracker();
        const directStep: { row: number; col: number }[] = [];
        const scoreBefore = model.getScore();
        let directRemovedCount = 0;

        for (let r = 0; r < model.getRows(); r++) {
            for (let c = 0; c < model.getCols(); c++) {
                const value = model.getCellValue(r, c);
                if (value === null) {
                    continue;
                }
                if (r === row && c === col) {
                    model.setCellValue(r, c, null);
                    tracker.pushRemoved(r, c);
                    directStep.push({ row: r, col: c });
                    directRemovedCount++;
                    continue;
                }
                if (model.isSuperTile(r, c)) {
                    const id = model.getSuperTileId(r, c);
                    if (!id || !chainData) {
                        continue;
                    }
                    addSuperTileToQueue(chainData, id, r, c);
                    continue;
                }
                model.setCellValue(r, c, null);
                tracker.pushRemoved(r, c);
                directStep.push({ row: r, col: c });
                directRemovedCount++;
            }
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

