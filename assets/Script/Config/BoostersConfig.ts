import {BoosterConfig} from "./BoosterConfig";

const {ccclass, property} = cc._decorator;

@ccclass
export default class BoostersConfig extends cc.Component {

    @property
    boostersPath: string = "Boosters";

    private _boosters: BoosterConfig[] = [];

    async loadBoosters(): Promise<void> {
        if (this._boosters.length > 0) {
            return;
        }

        const path = this.boostersPath && this.boostersPath.trim() ? this.boostersPath.trim() : "Boosters";

        return new Promise<void>((resolve, reject) => {
            cc.resources.loadDir(path, cc.JsonAsset, (err, assets: cc.JsonAsset[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (assets && assets.length > 0) {
                    const result: BoosterConfig[] = [];
                    for (let i = 0; i < assets.length; i++) {
                        const asset = assets[i];
                        if (!asset) {
                            continue;
                        }
                        const data = asset.json as any;
                        if (!data || typeof data.id !== "string") {
                            continue;
                        }
                        result.push(data as BoosterConfig);
                    }
                    this._boosters = result;
                }
                resolve();
            });
        });
    }

    getBoosterConfigs(): BoosterConfig[] {
        if (!this._boosters || this._boosters.length === 0) {
            return [];
        }


        return this._boosters.slice();

    }

    getBoosterConfig(id: string): BoosterConfig {
        if (!id) {
            throw new Error("No booster config for empty id");
        }
        for (let i = 0; i < this._boosters.length; i++) {
            const cfg = this._boosters[i];
            if (cfg && cfg.id === id) {
                return cfg;
            }
        }
        throw new Error(`No booster config for id ${id}`);
    }
}

