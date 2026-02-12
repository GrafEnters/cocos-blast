import IGameModel, { BlastGameStepResult } from "./IGameModel";

export default interface ISupertileExtension {
    id: string;
    handle(model: IGameModel, row: number, col: number, data?: any): BlastGameStepResult | null;
}

