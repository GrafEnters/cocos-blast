import { LevelConfig, LevelConfigRaw } from "./LevelConfig";

type LevelConfigSource = LevelConfigRaw & { initialField?: unknown };

export function parseInitialField(raw: unknown): (string | null)[][] | null {
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

export function convertLevelConfig(source: LevelConfigRaw): LevelConfig {
    const raw: LevelConfigSource = source as LevelConfigSource;
    if (typeof raw.rows !== "number" || typeof raw.cols !== "number" ||
        !Array.isArray(raw.colors) || raw.colors.length === 0 ||
        typeof raw.targetScore !== "number" || typeof raw.moves !== "number") {
        throw new Error("LevelConfig: required fields missing or invalid (rows, cols, colors, targetScore, moves)");
    }
    return {
        id: raw.id,
        name: raw.name,
        description: raw.description,
        rows: raw.rows,
        cols: raw.cols,
        colors: raw.colors,
        targetScore: raw.targetScore,
        moves: raw.moves,
        initialField: parseInitialField(raw.initialField),
    };
}
