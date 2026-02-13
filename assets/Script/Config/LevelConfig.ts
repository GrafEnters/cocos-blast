export default class LevelConfig {
    id?: number;
    name?: string;
    description?: string;
    rows: number;
    cols: number;
    colors: string[];
    targetScore: number;
    moves: number;
    initialField: (string | null)[][] | null;

    constructor(jsonAsset: cc.JsonAsset) {
        const raw = (jsonAsset && jsonAsset.json) || {};
        if (typeof raw.rows !== "number" || typeof raw.cols !== "number" ||
            !Array.isArray(raw.colors) || raw.colors.length === 0 ||
            typeof raw.targetScore !== "number" || typeof raw.moves !== "number") {
            throw new Error("LevelConfig: required fields missing or invalid (rows, cols, colors, targetScore, moves)");
        }
        this.id = raw.id;
        this.name = raw.name;
        this.description = raw.description;
        this.rows = raw.rows;
        this.cols = raw.cols;
        this.colors = raw.colors;
        this.targetScore = raw.targetScore;
        this.moves = raw.moves;
        this.initialField = this.parseInitialField(raw.initialField);
    }

    private parseInitialField(raw: any): (string | null)[][] | null {
        if (!raw || !Array.isArray(raw) || raw.length === 0) {
            return null;
        }
        const result: (string | null)[][] = [];
        for (let r = 0; r < raw.length; r++) {
            const row: (string | null)[] = [];
            const rawRow = raw[r];
            if (Array.isArray(rawRow)) {
                for (let c = 0; c < rawRow.length; c++) {
                    const cell = rawRow[c];
                    let value: string | null = null;
                    if (typeof cell === "string") {
                        const parts = cell.split(":");
                        if (parts.length === 2) {
                            value = parts[0].trim();
                        } else {
                            value = cell.trim();
                        }
                    }
                    row.push(value && value.length > 0 ? value : null);
                }
            }
            result.push(row);
        }
        return result;
    }

}
