export default class PlayerProfile {

    private boosterCounts: Map<string, number> = new Map();
    private boostersInitialized: boolean = false;

    ensureBoostersInitialized(config: import("./Config/BoostersConfig").default): void {
        if (this.boostersInitialized || !config) {
            return;
        }
        const configs = config.getBoosterConfigs();
        for (let i = 0; i < configs.length; i++) {
            const cfg: any = configs[i];
            if (!cfg || typeof cfg.id !== "string") {
                continue;
            }
            const id = cfg.id;
            if (this.boosterCounts.has(id)) {
                continue;
            }
            const count = typeof cfg.initialCount === "number" && cfg.initialCount >= 0 ? cfg.initialCount : 0;
            this.boosterCounts.set(id, count);
        }
        this.boostersInitialized = true;
    }

    getBoosterCount(id: string): number {
        if (!id) {
            return 0;
        }
        const value = this.boosterCounts.get(id);
        return typeof value === "number" ? value : 0;
    }

    setBoosterCount(id: string, count: number): void {
        if (!id) {
            return;
        }
        const safe = count >= 0 ? count : 0;
        this.boosterCounts.set(id, safe);
    }

    changeBoosterCount(id: string, delta: number): number {
        if (!id || !delta) {
            return this.getBoosterCount(id);
        }
        const current = this.getBoosterCount(id);
        const next = current + delta;
        const safe = next >= 0 ? next : 0;
        this.boosterCounts.set(id, safe);
        return safe;
    }
}

