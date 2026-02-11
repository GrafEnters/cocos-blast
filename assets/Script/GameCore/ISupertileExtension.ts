import BlastGameModel, { BlastGameStepResult } from "./BlastGameModel";

export default interface ISupertileExtension {
    id: string;
    handle(model: BlastGameModel, row: number, col: number, data?: any): BlastGameStepResult | null;
}

