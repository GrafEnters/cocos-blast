export type LevelConfigRaw = {
    id?: number;
    name?: string;
    description?: string;
    rows: number;
    cols: number;
    colors: string[];
    targetScore: number;
    moves: number;
};

export type LevelConfig = LevelConfigRaw & {
    initialField: (string | null)[][] | null;
};
