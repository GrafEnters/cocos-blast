import IBoosterExtension from "./IBoosterExtension";
import IGameModel, { BlastGameStepResult } from "../Models/IGameModel";
import type { BombBoosterConfig } from "../../Config/BombBoosterConfig";
import {BoosterConfig} from "../../Config/BoosterConfig";
import { BoosterData, BombBoosterData, ChainData } from "../Types/BoosterData";
import { isBombBoosterData, isChainData } from "../Types/TypeGuards";
import { BoosterIds } from "../Constants/GameConstants";
import { 
    createRemovedCellTracker, 
    addSuperTileToQueue, 
    processSuperTileQueue, 
    addDirectStepToChain, 
    calculateAndApplyScore, 
    createBlastGameStepResult 
} from "../Supertiles/SupertileChainUtils";
import { SuperTileChainData } from "../Types/SuperTileData";

export default class BombBoosterExtension implements IBoosterExtension {
    id: string = BoosterIds.BOMB;

    private radius: number;

    constructor(config: BoosterConfig) {
        if (!config || typeof config !== "object" || !("radius" in config) || typeof config.radius !== "number") {
            throw new Error("BombBoosterExtension requires a radius property");
        }
        this.radius = (config as BombBoosterConfig).radius;
    }

    handle(model: IGameModel, data?: BoosterData): BlastGameStepResult | null {
        if (!isBombBoosterData(data)) {
            return null;
        }

        const row = data.row;
        const col = data.col;

        if (!model.isInsidePublic(row, col)) {
            return null;
        }

        const chainData: ChainData | null = isChainData(data.chainData) ? data.chainData : null;
        const superTileChainData: SuperTileChainData | null = chainData as SuperTileChainData | null;
        const tracker = createRemovedCellTracker();
        const directStep: { row: number; col: number }[] = [];
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
                    if (!id || !superTileChainData) {
                        continue;
                    }
                    addSuperTileToQueue(superTileChainData, id, r, c);
                    continue;
                }
                model.setCellValue(r, c, null);
                tracker.pushRemoved(r, c);
                directStep.push({ row: r, col: c });
                directRemovedCount++;
            }
        }

        processSuperTileQueue(model, superTileChainData, tracker);

        if (tracker.removed.length === 0) {
            return null;
        }

        addDirectStepToChain(superTileChainData, directStep);
        calculateAndApplyScore(model, directRemovedCount);

        return createBlastGameStepResult(model, tracker.removed, scoreBefore);
    }
}
