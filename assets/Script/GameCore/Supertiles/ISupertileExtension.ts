import IGameModel, { BlastGameStepResult } from "../Models/IGameModel";
import { SuperTileData } from "../Types/SuperTileData";

export default interface ISupertileExtension {
    id: string;
    handle(model: IGameModel, row: number, col: number, data?: SuperTileData): BlastGameStepResult | null;
}

