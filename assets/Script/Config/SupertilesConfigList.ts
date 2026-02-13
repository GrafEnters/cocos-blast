import {SupertileConfig} from "./SupertileConfig";
import ConfigList from "./ConfigList";

const {ccclass} = cc._decorator;

@ccclass
export default class SupertilesConfigList extends ConfigList<SupertileConfig> {

    getSuperTileConfig(id: string): SupertileConfig {
        for (let i = 0; i < this._configs.length; i++) {
            const cfg = this._configs[i];
            if (cfg && cfg.id === id) {
                return cfg;
            }
        }
        throw new Error(`No supertile config for id ${id}`);
    }

    getSuperTileTypeForSize(groupSize: number): string | null {
        if (groupSize < 2) {
            return null;
        }
        let bestThreshold = -1;
        let bestType: string | null = null;
        for (let i = 0; i < this._configs.length; i++) {
            const cfg = this._configs[i];
            if (!cfg || typeof cfg.id !== "string") {
                continue;
            }
            const threshold = typeof cfg.generationThreshold === "number" ? cfg.generationThreshold : -1;
            if (threshold >= 0 && threshold <= groupSize && threshold > bestThreshold) {
                bestThreshold = threshold;
                bestType = cfg.id;
            }
        }
        return bestType;
    }
}
