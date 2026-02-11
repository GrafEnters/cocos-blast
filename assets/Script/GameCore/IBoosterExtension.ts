import BlastGameModel, { BlastGameStepResult } from "./BlastGameModel";

export default interface IBoosterExtension {
    id: string;
    handle(model: BlastGameModel, data?: any): BlastGameStepResult | null;
}
