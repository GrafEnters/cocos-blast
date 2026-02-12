import {SupertileConfig} from "./SupertileConfig";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SuperTilesConfig extends cc.Component {

    @property
    superTilesPath: string = "SuperTiles";

    private _superTiles: SupertileConfig[] = [];

    loadSuperTiles(callback: () => void): void {
        if (this._superTiles.length > 0) {
            callback();
            return;
        }
        const path = this.superTilesPath && this.superTilesPath.trim() ? this.superTilesPath.trim() : "SuperTiles";
        cc.resources.loadDir(path, cc.JsonAsset, (err, assets: cc.JsonAsset[]) => {
            if (!err && assets && assets.length > 0) {
                const result: SupertileConfig[] = [];
                for (let i = 0; i < assets.length; i++) {
                    const asset = assets[i];
                    if (!asset) {
                        continue;
                    }
                    const data = asset.json as any;
                    if (!data || typeof data.id !== "string") {
                        continue;
                    }
                    result.push(data as SupertileConfig);
                }
                this._superTiles = result;
            }
            callback();
        });
    }

    getSuperTileConfigs(): SupertileConfig[] {
        if (!this._superTiles || this._superTiles.length === 0) {
            return [];
        }
        return this._superTiles.slice();
    }

    getSuperTileConfig(id: string): SupertileConfig {
        if (!id) {
            throw new Error("No supertile config for empty id");
        }
        for (let i = 0; i < this._superTiles.length; i++) {
            const cfg = this._superTiles[i];
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
        for (let i = 0; i < this._superTiles.length; i++) {
            const cfg = this._superTiles[i];
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

