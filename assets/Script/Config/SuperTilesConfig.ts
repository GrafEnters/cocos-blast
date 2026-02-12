import {SupertileConfig} from "./SupertileConfig";

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

    getSuperTileConfig(id: string): SupertileConfig {
        const configs = this.getSuperTileConfigs();
        for (let i = 0; i < configs.length; i++) {
            const cfg = configs[i];
            if (cfg && cfg.id === id) {
                return cfg;
            }
        }
        throw new Error(`No supertile config for id ${id}`)
    }

    getSuperTileTypeForSize(groupSize: number): string | null {
        if (groupSize < 2) {
            return null;
        }
        const configs = this.getSuperTileConfigs();
        let bestThreshold = -1;
        let bestType: string | null = null;
        for (let i = 0; i < configs.length; i++) {
            const cfg = configs[i];
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

