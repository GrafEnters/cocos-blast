const { ccclass, property } = cc._decorator;

@ccclass
export default class SuperTilesConfig extends cc.Component {

    @property
    superTilesPath: string = "SuperTiles";

    private _superTiles: cc.JsonAsset[] = [];

    get superTiles(): cc.JsonAsset[] {
        return this._superTiles;
    }

    loadSuperTiles(callback: () => void): void {
        if (this._superTiles.length > 0) {
            callback();
            return;
        }
        const path = this.superTilesPath && this.superTilesPath.trim() ? this.superTilesPath.trim() : "SuperTiles";
        cc.resources.loadDir(path, cc.JsonAsset, (err, assets: cc.JsonAsset[]) => {
            if (!err && assets && assets.length > 0) {
                this._superTiles = assets.slice();
            }
            callback();
        });
    }

    getSuperTileConfigs(): any[] {
        const result: any[] = [];
        if (!this._superTiles || this._superTiles.length === 0) {
            return result;
        }
        for (let i = 0; i < this._superTiles.length; i++) {
            const asset = this._superTiles[i];
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

    getSuperTileConfig(id: string): any | null {
        if (!id) {
            return null;
        }
        const configs = this.getSuperTileConfigs();
        for (let i = 0; i < configs.length; i++) {
            const cfg = configs[i];
            if (cfg && cfg.id === id) {
                return cfg;
            }
        }
        return null;
    }
}

