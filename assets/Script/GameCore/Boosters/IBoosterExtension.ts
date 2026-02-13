import IGameModel, { BlastGameStepResult } from "../Models/IGameModel";
import { BoosterData } from "../Types/BoosterData";

export default interface IBoosterExtension {
    id: string;
    handle(model: IGameModel, data?: BoosterData): BlastGameStepResult | null;
}
