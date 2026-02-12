import SupertileExtensionFactory from "./SupertileExtensionFactory";
import BoosterExtensionFactory from "./BoosterExtensionFactory";
import TileInputEventType from "./TileInputEventType";

export type BlastGameBoardCell = string | null;

export interface BlastGameStepResult {
    removed: { row: number; col: number }[];
    score: number;
    targetScore: number;
    remainingMoves: number;
    scoreDelta: number;
}

export default interface IGameModel {
    getSupportedEvents(): TileInputEventType[];
    init(initialField?: (string | null)[][] | null): void;
    getBoard(): BlastGameBoardCell[][];
    getRemainingMoves(): number;
    getScore(): number;
    getTargetScore(): number;
    hasAvailableMoves(): boolean;
    addMoves(value: number): void;
    handleTap(row: number, col: number, data?: any): BlastGameStepResult | null;
    handleBooster(boosterId: string, data?: any): BlastGameStepResult | null;
    setSuperTileGenerationCallback(callback: ((groupSize: number) => string | null) | null): void;
    setSuperTileExtensionFactory(factory: SupertileExtensionFactory | null): void;
    setBoosterExtensionFactory(factory: BoosterExtensionFactory | null): void;
    processSuperTileQueuePublic(data: any): BlastGameStepResult | null;
    isInsidePublic(row: number, col: number): boolean;
    getRows(): number;
    getCols(): number;
    getCellValue(row: number, col: number): string | null;
    setCellValue(row: number, col: number, value: string | null): void;
    calculateGroupScorePublic(size: number): number;
    applyScorePublic(value: number): void;
    applyGravityAndRefill(): void;
    shuffleBoard(): void;
    isSuperTile(row: number, col: number): boolean;
    getSuperTileId(row: number, col: number): string | null;
}
