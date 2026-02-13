import LevelConfig, {LevelConfigRaw} from "./LevelConfig";
import ConfigList from "./ConfigList";
import {LoadConfigsFromDir} from "./ConfigUtils";

const {ccclass, property} = cc._decorator;

@ccclass
export default class LevelsConfigList extends ConfigList<LevelConfig> {

    path: string = "Configs/Levels";

    async loadConfigs(): Promise<void> {
        if (this._configs.length > 0) {
            return;
        }
        const rawList = await LoadConfigsFromDir<LevelConfigRaw>(this.path);
        const configs = rawList
            .map((raw) => new LevelConfig(raw))
            .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        this._configs = configs;
    }

    getLevelConfig(id: number): LevelConfig {
        for (let i = 0; i < this._configs.length; i++) {
            const cfg = this._configs[i];
            if (cfg && cfg.id === id) {
                return cfg;
            }
        }
        throw new Error(`No level config for id ${id}`);
    }

    getLevelConfigByIndex(index: number): LevelConfig | null {
        if (!this._configs.length || index < 0) {
            return null;
        }
        const safeIndex = index >= this._configs.length ? index % this._configs.length : index;
        return this._configs[safeIndex] || null;
    }
}
