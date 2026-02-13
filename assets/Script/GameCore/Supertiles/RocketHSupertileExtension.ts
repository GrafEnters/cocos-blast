import ISupertileExtension from "./ISupertileExtension";
import IGameModel, { BlastGameStepResult } from "../Models/IGameModel";
import type { SupertileConfig } from "../../Config/SupertileConfig";
import { SuperTileData } from "../Types/SuperTileData";
import { getChainDataFromSuperTileData, createRemovedCellTracker, addSuperTileToQueue, addDirectStepToChain, processSuperTileQueue, calculateAndApplyScore, createBlastGameStepResult } from "./SupertileChainUtils";
import { SupertileIds } from "../Constants/GameConstants";

export default class RocketHSupertileExtension implements ISupertileExtension {
    id: string = SupertileIds.ROCKET_H;

    constructor(config: SupertileConfig) {
    }

    handle(model: IGameModel, row: number, col: number, data?: SuperTileData): BlastGameStepResult | null {
        if (row < 0 || row >= model.getRows()) {
            return null;
        }

        const chainData = getChainDataFromSuperTileData(data);
        const tracker = createRemovedCellTracker();
        const directStep: { row: number; col: number }[] = [];
        const scoreBefore = model.getScore();
        let directRemovedCount = 0;

        for (let c = 0; c < model.getCols(); c++) {
            const value = model.getCellValue(row, c);
            if (value === null) {
                continue;
            }
            if (row === row && c === col) {
                model.setCellValue(row, c, null);
                tracker.pushRemoved(row, c);
                directStep.push({ row, col: c });
                directRemovedCount++;
                continue;
            }
            if (model.isSuperTile(row, c)) {
                const id = model.getSuperTileId(row, c);
                if (!id || !chainData) {
                    continue;
                }
                addSuperTileToQueue(chainData, id, row, c);
                continue;
            }
            model.setCellValue(row, c, null);
            tracker.pushRemoved(row, c);
            directStep.push({ row, col: c });
            directRemovedCount++;
        }

        if (tracker.removed.length === 0) {
            return null;
        }

        processSuperTileQueue(model, chainData, tracker);
        addDirectStepToChain(chainData, directStep);
        calculateAndApplyScore(model, directRemovedCount);

        return createBlastGameStepResult(model, tracker.removed, scoreBefore);
    }
}

