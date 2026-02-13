import {BoosterConfig} from "./BoosterConfig";
import ConfigsList from "./ConfigsList";

const {ccclass} = cc._decorator;

@ccclass
export default class BoostersConfigList extends ConfigsList<BoosterConfig> {

    getBoosterConfigs(): BoosterConfig[] {
        return this.getConfigs();
    }

    getBoosterConfig(id: string): BoosterConfig {
        for (let i = 0; i < this._configs.length; i++) {
            const cfg = this._configs[i];
            if (cfg && cfg.id === id) {
                return cfg;
            }
        }
        throw new Error(`No booster config for id ${id}`);
    }
}

