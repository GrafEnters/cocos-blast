import IBoosterExtension from "./IBoosterExtension";
import IGameModel, { BlastGameStepResult } from "../Models/IGameModel";
import type { BoosterConfig } from "../../Config/BoosterConfig";
import { BoosterData, TeleportBoosterData } from "../Types/BoosterData";

export default class TeleportBoosterExtension implements IBoosterExtension {
    id: string = "teleport";

    constructor(config: BoosterConfig) {
    }

    handle(model: IGameModel, data?: BoosterData): BlastGameStepResult | null {
        if (!data || typeof data !== "object" || !("fromRow" in data) || typeof data.fromRow !== "number" || 
            !("fromCol" in data) || typeof data.fromCol !== "number" || 
            !("toRow" in data) || typeof data.toRow !== "number" || 
            !("toCol" in data) || typeof data.toCol !== "number") {
            return null;
        }

        const teleportData = data as TeleportBoosterData;
        const fromRow = teleportData.fromRow;
        const fromCol = teleportData.fromCol;
        const toRow = teleportData.toRow;
        const toCol = teleportData.toCol;

        if (!model.isInsidePublic(fromRow, fromCol)) {
            return null;
        }
        if (!model.isInsidePublic(toRow, toCol)) {
            return null;
        }
        if (fromRow === toRow && fromCol === toCol) {
            return null;
        }

        const fromValue = model.getCellValue(fromRow, fromCol);
        const toValue = model.getCellValue(toRow, toCol);

        if (fromValue === null && toValue === null) {
            return null;
        }

        model.setCellValue(fromRow, fromCol, toValue);
        model.setCellValue(toRow, toCol, fromValue);

        return {
            removed: [],
            score: model.getScore(),
            targetScore: model.getTargetScore(),
            remainingMoves: model.getRemainingMoves(),
            scoreDelta: 0,
        };
    }
}
