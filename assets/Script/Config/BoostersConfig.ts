const { ccclass, property } = cc._decorator;

@ccclass
export default class BoostersConfig extends cc.Component {

    @property
    boostersPath: string = "Boosters";

    private _boosters: cc.JsonAsset[] = [];

    get boosters(): cc.JsonAsset[] {
        return this._boosters;
    }

    loadBoosters(callback: () => void): void {
        if (this._boosters.length > 0) {
            callback();
            return;
        }

        const path = this.boostersPath && this.boostersPath.trim() ? this.boostersPath.trim() : "Boosters";

        cc.resources.loadDir(path, cc.JsonAsset, (err, assets: cc.JsonAsset[]) => {
            if (!err && assets && assets.length > 0) {
                this._boosters = assets.slice();
            }
            callback();
        });
    }

    getBoosterConfigs(): any[] {
        if (!this._boosters || this._boosters.length === 0) {
            return [];
        }
        const result: any[] = [];
        for (let i = 0; i < this._boosters.length; i++) {
            const asset = this._boosters[i];
            if (!asset) {
                continue;
            }
            const data = asset.json as any;
            if (data) {
                result.push(data);
            }
        }
        return result;
    }

    getBoosterConfig(id: string): any | null {
        if (!id) {
            return null;
        }
        const configs = this.getBoosterConfigs();
        for (let i = 0; i < configs.length; i++) {
            const cfg = configs[i];
            if (cfg && cfg.id === id) {
                return cfg;
            }
        }
        return null;
    }
}

