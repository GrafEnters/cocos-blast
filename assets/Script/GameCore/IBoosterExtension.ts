import IGameModel, { BlastGameStepResult } from "./IGameModel";

export default interface IBoosterExtension {
    id: string;
    handle(model: IGameModel, data?: any): BlastGameStepResult | null;
}
