import {LevelConfig, LevelConfigRaw} from "./LevelConfig";
import ConfigList from "./ConfigList";
import {LoadConfigsFromDir} from "./ConfigUtils";
import {convertLevelConfig} from "./LevelUtils";

const {ccclass} = cc._decorator;

@ccclass
export default class LevelsConfigList extends ConfigList<LevelConfig> {
    async loadConfigs(): Promise<void> {
        const rawList = await LoadConfigsFromDir<LevelConfigRaw>(this.path);
        const configs = rawList
            .map((raw) => convertLevelConfig(raw))
            .sort((a, b) => (a.id ?? 0) - (b.id ?? 0));
        this._configs = configs;
    }

    getLevelConfigByIndex(index: number): LevelConfig | null {
        if (!this._configs.length || index < 0) {
            return null;
        }
        const cycleIndex = index % this._configs.length;
        return this._configs[cycleIndex] || null;
    }
}
