import { GameAnimationStep } from "../Models/IGameModel";

export interface SuperTileChainData {
    superTileChainSteps: GameAnimationStep[];
    superTileQueue?: { id: string; row: number; col: number; depth: number }[];
    depth?: number;
}

export type SuperTileData = SuperTileChainData | Record<string, unknown>;
