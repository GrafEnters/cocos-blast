import IBoosterExtension from "./IBoosterExtension";
import IGameModel, { BlastGameStepResult } from "./IGameModel";

export default class TeleportBoosterExtension implements IBoosterExtension {
    id: string = "teleport";

    handle(model: IGameModel, data?: any): BlastGameStepResult | null {
        if (!data || typeof data.fromRow !== "number" || typeof data.fromCol !== "number" || 
            typeof data.toRow !== "number" || typeof data.toCol !== "number") {
            return null;
        }

        const fromRow = data.fromRow;
        const fromCol = data.fromCol;
        const toRow = data.toRow;
        const toCol = data.toCol;

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
