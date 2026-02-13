import IGameModel, { BlastGameStepResult } from "../Models/IGameModel";
import { SuperTileChainData } from "../Types/SuperTileData";
import { isSuperTileChainData } from "../Types/TypeGuards";

export interface RemovedCellTracker {
    removed: { row: number; col: number }[];
    used: { [key: string]: boolean };
    pushRemoved: (row: number, col: number) => void;
}

export function createRemovedCellTracker(): RemovedCellTracker {
    const removed: { row: number; col: number }[] = [];
    const used: { [key: string]: boolean } = {};

    const pushRemoved = (row: number, col: number): void => {
        const key = `${row}_${col}`;
        if (used[key]) {
            return;
        }
        used[key] = true;
        removed.push({ row, col });
    };

    return {
        removed,
        used,
        pushRemoved
    };
}

export function getChainDataFromSuperTileData(data: SuperTileData | undefined): SuperTileChainData | null {
    if (!data) {
        return null;
    }
    return isSuperTileChainData(data) ? data : null;
}

export function ensureSuperTileQueue(chainData: SuperTileChainData): void {
    if (!Array.isArray(chainData.superTileQueue)) {
        chainData.superTileQueue = [];
    }
}

export function getDepth(chainData: SuperTileChainData | null): number {
    if (!chainData) {
        return 0;
    }
    return typeof chainData.depth === "number" && chainData.depth >= 0 ? chainData.depth : 0;
}

export function addSuperTileToQueue(
    chainData: SuperTileChainData,
    superTileId: string,
    row: number,
    col: number
): void {
    ensureSuperTileQueue(chainData);
    const depth = getDepth(chainData);
    chainData.superTileQueue!.push({ id: superTileId, row, col, depth: depth + 1 });
}

export function addDirectStepToChain(
    chainData: SuperTileChainData | null,
    directStep: { row: number; col: number }[]
): void {
    if (!chainData || directStep.length === 0) {
        return;
    }
    const depth = getDepth(chainData);
    chainData.superTileChainSteps.push({ depth, cells: directStep });
}

export function processSuperTileQueue(
    model: IGameModel,
    chainData: SuperTileChainData | null,
    tracker: RemovedCellTracker
): void {
    if (!chainData || !Array.isArray(chainData.superTileQueue) || chainData.superTileQueue.length === 0) {
        return;
    }

    const chainResult = model.processSuperTileQueuePublic(chainData);
    if (!chainResult || !chainResult.removed || chainResult.removed.length === 0) {
        return;
    }

    for (let i = 0; i < chainResult.removed.length; i++) {
        const cell = chainResult.removed[i];
        tracker.pushRemoved(cell.row, cell.col);
    }
}

export function calculateAndApplyScore(
    model: IGameModel,
    directRemovedCount: number
): void {
    if (directRemovedCount <= 0) {
        return;
    }
    const scoreDeltaDirect = model.calculateGroupScorePublic(directRemovedCount);
    model.applyScorePublic(scoreDeltaDirect);
}

export function createBlastGameStepResult(
    model: IGameModel,
    removed: { row: number; col: number }[],
    scoreBefore: number
): BlastGameStepResult {
    const scoreDelta = model.getScore() - scoreBefore;
    return {
        removed,
        score: model.getScore(),
        targetScore: model.getTargetScore(),
        remainingMoves: model.getRemainingMoves(),
        scoreDelta
    };
}
