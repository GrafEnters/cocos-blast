import { BoosterData, BombBoosterData, TeleportBoosterData, ChainData } from "./BoosterData";
import { SuperTileData, SuperTileChainData } from "./SuperTileData";

export function isBombBoosterData(data: BoosterData): data is BombBoosterData {
    return typeof data === "object" && 
           data !== null && 
           "row" in data && 
           typeof data.row === "number" && 
           "col" in data && 
           typeof data.col === "number";
}

export function isTeleportBoosterData(data: BoosterData): data is TeleportBoosterData {
    return typeof data === "object" && 
           data !== null && 
           "fromRow" in data && 
           typeof data.fromRow === "number" && 
           "fromCol" in data && 
           typeof data.fromCol === "number" && 
           "toRow" in data && 
           typeof data.toRow === "number" && 
           "toCol" in data && 
           typeof data.toCol === "number";
}

export function isSuperTileChainData(data: SuperTileData): data is SuperTileChainData {
    return typeof data === "object" && 
           data !== null && 
           "superTileChainSteps" in data && 
           Array.isArray(data.superTileChainSteps);
}

export function isChainData(data: unknown): data is ChainData {
    return typeof data === "object" && 
           data !== null && 
           "superTileChainSteps" in data && 
           Array.isArray((data as ChainData).superTileChainSteps);
}
