import SupertileExtensionFactory from "../Supertiles/SupertileExtensionFactory";
import BoosterExtensionFactory from "../Boosters/BoosterExtensionFactory";
import TileInputEventType from "../../Input/TileInputEventType";
import TileInputEvent from "../../Input/TileInputEvent";
import IFieldView from "../IFieldView";
import IAnimationView from "../Animations/IAnimationView";
import { BoosterData } from "../Types/BoosterData";
import { SuperTileData } from "../Types/SuperTileData";

export type BlastGameBoardCell = string | null;

export interface BlastGameStepResult {
    removed: { row: number; col: number }[];
    score: number;
    targetScore: number;
    remainingMoves: number;
    scoreDelta: number;
}

export interface GameAnimationStep {
    depth: number;
    cells: { row: number; col: number }[];
}

export interface GameEventResult {
    stepResult: BlastGameStepResult;
    animationSteps: GameAnimationStep[];
    preAnimation?: (fieldView: IFieldView, animationView: IAnimationView) => Promise<void>;
}

export default interface IGameModel {
    getSupportedEvents(): TileInputEventType[];
    handleEvent(event: TileInputEvent): GameEventResult | null;
    init(initialField?: (string | null)[][] | null): void;
    getBoard(): BlastGameBoardCell[][];
    getRemainingMoves(): number;
    getScore(): number;
    getTargetScore(): number;
    hasAvailableMoves(): boolean;
    addMoves(value: number): void;
    handleTap(row: number, col: number, data?: SuperTileData): BlastGameStepResult | null;
    handleBooster(boosterId: string, data?: BoosterData): BlastGameStepResult | null;
    setSuperTileGenerationCallback(callback: ((groupSize: number) => string | null) | null): void;
    setSuperTileExtensionFactory(factory: SupertileExtensionFactory | null): void;
    setBoosterExtensionFactory(factory: BoosterExtensionFactory | null): void;
    processSuperTileQueuePublic(data: SuperTileData): BlastGameStepResult | null;
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
