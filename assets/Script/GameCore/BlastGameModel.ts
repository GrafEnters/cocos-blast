export type BlastGameBoardCell = number | null;

export interface BlastGameStepResult {
    removed: { row: number; col: number; colorIndex: number }[];
    score: number;
    targetScore: number;
    remainingMoves: number;
    scoreDelta: number;
}

export default class BlastGameModel {
    private rows: number;
    private cols: number;
    private colors: string[];
    private board: BlastGameBoardCell[][] = [];

    private totalMoves: number;
    private remainingMoves: number;
    private score: number;
    private targetScore: number;

    constructor(rows: number, cols: number, colors: string[], moves: number, targetScore: number) {
        this.rows = rows;
        this.cols = cols;
        this.colors = colors && colors.length > 0 ? colors.slice() : ["red", "green", "blue", "yellow"];
        this.totalMoves = moves >= 0 ? moves : 0;
        this.remainingMoves = this.totalMoves;
        this.score = 0;
        this.targetScore = targetScore > 0 ? targetScore : 0;
    }

    init(): void {
        this.board = [];

        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col] = this.randomColorIndex();
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

    addMoves(value: number): void {
        if (value <= 0) {
            return;
        }

        this.remainingMoves += value;
    }

    handleTap(row: number, col: number): BlastGameStepResult | null {
        if (this.remainingMoves <= 0) {
            return null;
        }

        if (this.targetScore > 0 && this.score >= this.targetScore) {
            return null;
        }

        if (!this.isInside(row, col)) {
            return null;
        }

        const colorIndex = this.board[row][col];

        if (colorIndex === null) {
            return null;
        }

        const group = this.collectGroup(row, col, colorIndex);

        if (group.length < 2) {
            return null;
        }

        const removed = [];

        for (let i = 0; i < group.length; i++) {
            const cell = group[i];
            removed.push({ row: cell.row, col: cell.col, colorIndex: colorIndex });
            this.board[cell.row][cell.col] = null;
        }

        this.applyGravityAndRefill();

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

    private isInside(row: number, col: number): boolean {
        if (row < 0 || row >= this.rows) {
            return false;
        }

        if (col < 0 || col >= this.cols) {
            return false;
        }

        return true;
    }

    private randomColorIndex(): number {
        return Math.floor(Math.random() * this.colors.length);
    }

    private collectGroup(startRow: number, startCol: number, targetColor: number): { row: number; col: number }[] {
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

                const neighborColor = this.board[neighbor.row][neighbor.col];

                if (neighborColor === null) {
                    continue;
                }

                if (neighborColor !== targetColor) {
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

    private applyGravityAndRefill() {
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
                this.board[row][col] = this.randomColorIndex();
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
}

