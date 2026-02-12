import IGameModel, { BlastGameBoardCell, BlastGameStepResult, GameEventResult, GameAnimationStep } from "./IGameModel";
import SupertileExtensionFactory from "../Supertiles/SupertileExtensionFactory";
import BoosterExtensionFactory from "../Boosters/BoosterExtensionFactory";
import TileInputEventType from "../../Input/TileInputEventType";
import TileInputEvent from "../../Input/TileInputEvent";

export type { BlastGameBoardCell, BlastGameStepResult };

export default class BlastGameModel implements IGameModel {
    private rows: number;
    private cols: number;
    private colors: string[];
    private board: BlastGameBoardCell[][] = [];

    private totalMoves: number;
    private remainingMoves: number;
    private score: number;
    private targetScore: number;
    private getSuperTileTypeForSize: ((groupSize: number) => string | null) | null = null;
    private superTileExtensionFactory: SupertileExtensionFactory | null = null;
    private boosterExtensionFactory: BoosterExtensionFactory | null = null;

    constructor(rows: number, cols: number, colors: string[], moves: number, targetScore: number) {
        this.rows = rows;
        this.cols = cols;
        this.colors = colors && colors.length > 0 ? colors.slice() : ["red", "green", "blue", "yellow"];
        this.totalMoves = moves >= 0 ? moves : 0;
        this.remainingMoves = this.totalMoves;
        this.score = 0;
        this.targetScore = targetScore > 0 ? targetScore : 0;
    }

    getSupportedEvents(): TileInputEventType[] {
        return [TileInputEventType.Tap, TileInputEventType.Booster];
    }

    handleEvent(event: TileInputEvent): GameEventResult | null {
        if (this.remainingMoves <= 0) {
            return null;
        }

        if (this.targetScore > 0 && this.score >= this.targetScore) {
            return null;
        }

        if (event.type === TileInputEventType.Tap) {
            const tile = event.tile;
            if (!tile) {
                return null;
            }

            const chainData: { superTileChainSteps: GameAnimationStep[]; depth?: number } = { superTileChainSteps: [] };
            const result = this.handleTap(tile.row, tile.col, chainData);

            if (!result) {
                return null;
            }

            return {
                stepResult: result,
                animationSteps: chainData.superTileChainSteps || []
            };
        } else if (event.type === TileInputEventType.Booster) {
            if (!event.boosterId) {
                return null;
            }

            const chainData: { superTileChainSteps: GameAnimationStep[]; depth?: number } = { superTileChainSteps: [] };
            const boosterData = event.boosterData || {};
            (boosterData as any).chainData = chainData;

            const result = this.handleBooster(event.boosterId, boosterData);

            if (!result) {
                return null;
            }

            const preAnimation = boosterData.preAnimation && typeof boosterData.preAnimation === "function" 
                ? boosterData.preAnimation 
                : undefined;

            return {
                stepResult: result,
                animationSteps: chainData.superTileChainSteps || [],
                preAnimation: preAnimation
            };
        }

        return null;
    }

    setSuperTileGenerationCallback(callback: ((groupSize: number) => string | null) | null): void {
        this.getSuperTileTypeForSize = callback;
    }

    setSuperTileExtensionFactory(factory: SupertileExtensionFactory | null): void {
        this.superTileExtensionFactory = factory;
    }

    setBoosterExtensionFactory(factory: BoosterExtensionFactory | null): void {
        this.boosterExtensionFactory = factory;
    }

    init(initialField?: (string | null)[][] | null): void {
        this.board = [];

        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                let value: string | null = null;
                if (initialField && row < initialField.length && initialField[row] && col < (initialField[row] as (string | null)[]).length) {
                    const cell = (initialField[row] as (string | null)[])[col];
                    if (typeof cell === "string" && cell.trim().length > 0) {
                        value = cell.trim();
                    }
                }
                this.board[row][col] = value !== null ? value : this.randomColorKey();
            }
        }
    }

    getBoard(): BlastGameBoardCell[][] {
        return this.board;
    }

    getRemainingMoves(): number {
        return this.remainingMoves;
    }

    getScore(): number {
        return this.score;
    }

    getTargetScore(): number {
        return this.targetScore;
    }

    hasAvailableMoves(): boolean {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const value = this.board[row][col];

                if (value === null) {
                    continue;
                }

                if (this.isSuperTile(row, col)) {
                    continue;
                }

                if (!this.isColor(value)) {
                    continue;
                }

                if (this.hasSameColorNeighbor(row, col, value)) {
                    return true;
                }
            }
        }

        return false;
    }

    addMoves(value: number): void {
        if (value <= 0) {
            return;
        }

        this.remainingMoves += value;
    }

    handleTap(row: number, col: number, data?: any): BlastGameStepResult | null {
        if (this.remainingMoves <= 0) {
            return null;
        }

        if (this.targetScore > 0 && this.score >= this.targetScore) {
            return null;
        }

        if (!this.isInside(row, col)) {
            return null;
        }

        const cellValue = this.board[row][col];

        if (cellValue === null) {
            return null;
        }

        if (this.isSuperTile(row, col)) {
            const superTileId = this.getSuperTileId(row, col);
            if (!superTileId) {
                return null;
            }

            const chainData = data || {};
            if (!Array.isArray(chainData.superTileQueue)) {
                chainData.superTileQueue = [];
            }
            chainData.superTileQueue.push({ id: superTileId, row, col, depth: 0 });
            chainData.depth = 0;

            const internalResult = this.processSuperTileQueueInternal(chainData);
            if (!internalResult) {
                return null;
            }

            this.decreaseMoves();

            return {
                removed: internalResult.removed,
                score: this.score,
                targetScore: this.targetScore,
                remainingMoves: this.remainingMoves,
                scoreDelta: internalResult.scoreDelta,
            };
        }

        if (!this.isColor(cellValue)) {
            return null;
        }

        const group = this.collectGroup(row, col, cellValue);

        if (group.length < 2) {
            return null;
        }

        const removed: { row: number; col: number }[] = [];

        for (let i = 0; i < group.length; i++) {
            const cell = group[i];
            removed.push({ row: cell.row, col: cell.col });
            this.board[cell.row][cell.col] = null;
        }

        if (this.getSuperTileTypeForSize) {
            const superTileType = this.getSuperTileTypeForSize(group.length);
            if (superTileType && this.isInside(row, col)) {
                this.board[row][col] = superTileType;
            }
        }

        const scoreDelta = this.calculateGroupScore(group.length);
        this.applyScore(scoreDelta);
        this.decreaseMoves();

        return {
            removed,
            score: this.score,
            targetScore: this.targetScore,
            remainingMoves: this.remainingMoves,
            scoreDelta: scoreDelta,
        };
    }


    handleBooster(boosterId: string, data?: any): BlastGameStepResult | null {
        if (this.remainingMoves <= 0) {
            return null;
        }

        if (this.targetScore > 0 && this.score >= this.targetScore) {
            return null;
        }

        if (!this.boosterExtensionFactory) {
            return null;
        }

        const extension = this.boosterExtensionFactory.get(boosterId);
        if (!extension) {
            return null;
        }

        const result = extension.handle(this, data);
        if (!result) {
            return null;
        }

        this.decreaseMoves();
        return result;
    }

    private handleSuperTileInternal(id: string, row: number, col: number, data?: any): BlastGameStepResult | null {
        if (!this.superTileExtensionFactory) {
            return null;
        }
        const extension = this.superTileExtensionFactory.get(id);
        if (!extension) {
            return null;
        }
        return extension.handle(this, row, col, data);
    }

    private processSuperTileQueueInternal(data: any): BlastGameStepResult | null {
        if (!data || !Array.isArray(data.superTileQueue)) {
            return null;
        }

        const queue = data.superTileQueue as { id: string; row: number; col: number; depth: number }[];
        if (queue.length === 0) {
            return null;
        }

        const removedCombined: { row: number; col: number }[] = [];
        const usedRemoved: { [key: string]: boolean } = {};
        const scoreBefore = this.score;

        while (queue.length > 0) {
            const item = queue.shift() as { id: string; row: number; col: number; depth: number };
            if (!item || !item.id) {
                continue;
            }

            data.depth = item.depth;

            const result = this.handleSuperTileInternal(item.id, item.row, item.col, data);
            if (!result || !result.removed || result.removed.length === 0) {
                continue;
            }

            for (let i = 0; i < result.removed.length; i++) {
                const cell = result.removed[i];
                const key = cell.row + "_" + cell.col;
                if (usedRemoved[key]) {
                    continue;
                }
                usedRemoved[key] = true;
                removedCombined.push({ row: cell.row, col: cell.col });
            }
        }

        if (removedCombined.length === 0) {
            return null;
        }

        const scoreDelta = this.score - scoreBefore;

        return {
            removed: removedCombined,
            score: this.score,
            targetScore: this.targetScore,
            remainingMoves: this.remainingMoves,
            scoreDelta,
        };
    }

    processSuperTileQueuePublic(data: any): BlastGameStepResult | null {
        return this.processSuperTileQueueInternal(data);
    }

    private isInside(row: number, col: number): boolean {
        if (row < 0 || row >= this.rows) {
            return false;
        }

        if (col < 0 || col >= this.cols) {
            return false;
        }

        return true;
    }

    isInsidePublic(row: number, col: number): boolean {
        if (row < 0 || row >= this.rows) {
            return false;
        }

        if (col < 0 || col >= this.cols) {
            return false;
        }

        return true;
    }

    getRows(): number {
        return this.rows;
    }

    getCols(): number {
        return this.cols;
    }

    getCellValue(row: number, col: number): string | null {
        if (!this.isInsidePublic(row, col)) {
            return null;
        }
        return this.board[row][col];
    }

    setCellValue(row: number, col: number, value: string | null): void {
        if (!this.isInsidePublic(row, col)) {
            return;
        }
        this.board[row][col] = value;
    }

    calculateGroupScorePublic(size: number): number {
        return this.calculateGroupScore(size);
    }

    applyScorePublic(value: number): void {
        this.applyScore(value);
    }

    private hasSameColorNeighbor(row: number, col: number, colorKey: string): boolean {
        if (this.isSuperTile(row, col)) {
            return false;
        }
        const neighbors = this.getNeighbors(row, col);

        for (let i = 0; i < neighbors.length; i++) {
            const neighbor = neighbors[i];

            if (!neighbor) {
                continue;
            }

            const neighborValue = this.board[neighbor.row][neighbor.col];

            if (neighborValue === null) {
                continue;
            }

            if (this.isSuperTile(neighbor.row, neighbor.col)) {
                continue;
            }

            if (!this.isColor(neighborValue)) {
                continue;
            }

            if (neighborValue === colorKey) {
                return true;
            }
        }

        return false;
    }

    private randomColorKey(): string {
        if (!this.colors || this.colors.length === 0) {
            return "default";
        }
        const index = Math.floor(Math.random() * this.colors.length);
        return this.colors[index];
    }

    private collectGroup(startRow: number, startCol: number, targetColorKey: string): { row: number; col: number }[] {
        if (this.isSuperTile(startRow, startCol)) {
            return [];
        }
        const result: { row: number; col: number }[] = [];
        const visited: boolean[][] = [];
        const stack: { row: number; col: number }[] = [];

        for (let row = 0; row < this.rows; row++) {
            visited[row] = [];
            for (let col = 0; col < this.cols; col++) {
                visited[row][col] = false;
            }
        }

        stack.push({ row: startRow, col: startCol });

        while (stack.length > 0) {
            const cell = stack.pop() as { row: number; col: number };

            if (visited[cell.row][cell.col]) {
                continue;
            }

            visited[cell.row][cell.col] = true;
            result.push(cell);

            const neighbors = this.getNeighbors(cell.row, cell.col);

            for (let i = 0; i < neighbors.length; i++) {
                const neighbor = neighbors[i];

                if (!neighbor) {
                    continue;
                }

                if (visited[neighbor.row][neighbor.col]) {
                    continue;
                }

                const neighborValue = this.board[neighbor.row][neighbor.col];

                if (neighborValue === null) {
                    continue;
                }

                if (this.isSuperTile(neighbor.row, neighbor.col)) {
                    continue;
                }

                if (!this.isColor(neighborValue)) {
                    continue;
                }

                if (neighborValue !== targetColorKey) {
                    continue;
                }

                stack.push(neighbor);
            }
        }

        return result;
    }

    private getNeighbors(row: number, col: number): Array<{ row: number; col: number } | null> {
        const result: Array<{ row: number; col: number } | null> = [];

        if (this.isInside(row + 1, col)) {
            result.push({ row: row + 1, col });
        } else {
            result.push(null);
        }

        if (this.isInside(row - 1, col)) {
            result.push({ row: row - 1, col });
        } else {
            result.push(null);
        }

        if (this.isInside(row, col + 1)) {
            result.push({ row, col: col + 1 });
        } else {
            result.push(null);
        }

        if (this.isInside(row, col - 1)) {
            result.push({ row, col: col - 1 });
        } else {
            result.push(null);
        }

        return result;
    }

    applyGravityAndRefill() {
        for (let col = 0; col < this.cols; col++) {
            let nextRow = 0;

            for (let row = 0; row < this.rows; row++) {
                const value = this.board[row][col];

                if (value === null) {
                    continue;
                }

                if (row !== nextRow) {
                    this.board[nextRow][col] = value;
                    this.board[row][col] = null;
                }

                nextRow++;
            }

            for (let row = nextRow; row < this.rows; row++) {
                this.board[row][col] = this.randomColorKey();
            }
        }
    }

    private calculateGroupScore(size: number): number {
        if (size <= 0) {
            return 0;
        }

        return size * size;
    }

    private applyScore(value: number) {
        if (value <= 0) {
            return;
        }

        if (this.targetScore > 0) {
            const next = this.score + value;

            if (next >= this.targetScore) {
                this.score = this.targetScore;
            } else {
                this.score = next;
            }
        } else {
            this.score += value;
        }
    }

    private decreaseMoves() {
        if (this.remainingMoves <= 0) {
            return;
        }

        this.remainingMoves--;
    }

    shuffleBoard(): void {
        const values: string[] = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const v = this.board[row][col];
                if (v !== null) {
                    values.push(v);
                }
            }
        }

        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = values[i];
            values[i] = values[j];
            values[j] = t;
        }

        let idx = 0;
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] !== null) {
                    this.board[row][col] = values[idx++];
                }
            }
        }
    }

    isSuperTile(row: number, col: number): boolean {
        if (!this.isInside(row, col)) {
            return false;
        }
        const value = this.board[row][col];
        if (value === null) {
            return false;
        }
        return !this.isColor(value);
    }

    getSuperTileId(row: number, col: number): string | null {
        if (!this.isInside(row, col)) {
            return null;
        }
        const value = this.board[row][col];
        if (value === null) {
            return null;
        }
        if (this.isColor(value)) {
            return null;
        }
        return value;
    }

    private isColor(value: string | null): boolean {
        if (value === null) {
            return false;
        }
        return this.colors.indexOf(value) >= 0;
    }

}

