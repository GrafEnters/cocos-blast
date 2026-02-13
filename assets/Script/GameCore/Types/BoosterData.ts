import IFieldView from "../IFieldView";
import IAnimationView from "../Animations/IAnimationView";
import { GameAnimationStep } from "../Models/IGameModel";

export type PreAnimationCallback = (fieldView: IFieldView, animationView: IAnimationView) => Promise<void>;

export interface ChainData {
    superTileChainSteps: GameAnimationStep[];
    superTileQueue?: { id: string; row: number; col: number; depth: number }[];
    depth?: number;
}

export interface BombBoosterData {
    row: number;
    col: number;
    bombSpriteFrame?: cc.SpriteFrame;
    preAnimation?: PreAnimationCallback;
    chainData?: ChainData;
}

export interface TeleportBoosterData {
    fromRow: number;
    fromCol: number;
    toRow: number;
    toCol: number;
    preAnimation?: PreAnimationCallback;
    chainData?: ChainData;
}

export type BoosterData = BombBoosterData | TeleportBoosterData | Record<string, unknown>;
