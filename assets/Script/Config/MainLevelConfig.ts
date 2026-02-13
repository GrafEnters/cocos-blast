const { ccclass, property } = cc._decorator;
import LevelConfig from "./LevelConfig";

@ccclass
export default class MainLevelsConfig extends cc.Component {

    @property
    levelsPath: string = "Configs/Levels";

    @property
    currentLevelIndex: number = 0;

    private _levels: LevelConfig[] = [];

    get levels(): LevelConfig[] {
        return this._levels;
    }

    async loadLevels(): Promise<void> {
        if (this._levels.length > 0) {
            return;
        }

        const path = this.levelsPath && this.levelsPath.trim() ? this.levelsPath.trim() : "Configs/Levels";

        return new Promise<void>((resolve, reject) => {
            cc.resources.loadDir(path, cc.JsonAsset, (err, assets: cc.JsonAsset[]) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (assets && assets.length > 0) {
                    const configs = assets
                        .map((a) => new LevelConfig(a))
                        .sort((a, b) => {
                            const idA = a.id != null ? a.id : 0;
                            const idB = b.id != null ? b.id : 0;
                            return idA - idB;
                        });
                    this._levels = configs;
                }
                resolve();
            });
        });
    }

    private get currentLevelConfig(): LevelConfig | null {
        if (!this._levels || this._levels.length === 0) {
            return null;
        }

        let index = this.currentLevelIndex;

        if (index < 0) {
            index = 0;
        }

        if (index >= this._levels.length) {
            index = index % this._levels.length;
        }

        return this._levels[index];
    }

    get rows(): number {
        const data = this.currentLevelConfig;
        return data ? data.rows || 8 : 8;
    }

    get cols(): number {
        const data = this.currentLevelConfig;
        return data ? data.cols || 8 : 8;
    }

    get colorsCount(): number {
        const data = this.currentLevelConfig;
        return data && data.colors.length ? data.colors.length : 4;
    }

    get targetScore(): number {
        const data = this.currentLevelConfig;
        return data ? data.targetScore || 0 : 0;
    }

    get moves(): number {
        const data = this.currentLevelConfig;
        return data ? data.moves || 0 : 0;
    }

    get colors(): string[] {
        const data = this.currentLevelConfig;
        if (!data || !Array.isArray(data.colors)) {
            return ["red", "green", "blue", "yellow"];
        }
        return data.colors;
    }

    get initialField(): (string | null)[][] | null {
        const data = this.currentLevelConfig;
        if (!data || !Array.isArray(data.initialField) || data.initialField.length === 0) {
            return null;
        }
        return data.initialField;
    }
}

