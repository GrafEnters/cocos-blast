const { ccclass, property } = cc._decorator;

@ccclass
export default class MainLevelsConfig extends cc.Component {

    @property
    levelsPath: string = "Configs/Levels";

    @property
    currentLevelIndex: number = 0;

    private _levels: cc.JsonAsset[] = [];

    get levels(): cc.JsonAsset[] {
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
                    this._levels = assets.sort((a, b) => {
                        const idA = (a.json && (a.json as any).id) != null ? (a.json as any).id : 0;
                        const idB = (b.json && (b.json as any).id) != null ? (b.json as any).id : 0;
                        return idA - idB;
                    });
                }
                resolve();
            });
        });
    }

    private get raw(): any {
        const levelAsset = this.currentLevelAsset;
        return levelAsset ? levelAsset.json : {};
    }

    private get currentLevelAsset(): cc.JsonAsset | null {
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
        const data: any = this.raw;
        return data.rows || 8;
    }

    get cols(): number {
        const data: any = this.raw;
        return data.cols || 8;
    }

    get colorsCount(): number {
        const data: any = this.raw;
        return data.colorsCount || 4;
    }

    get targetScore(): number {
        const data: any = this.raw;
        return data.targetScore || 0;
    }

    get moves(): number {
        const data: any = this.raw;
        return data.moves || 0;
    }

    get colors(): string[] {
        const data: any = this.raw;
        const value = data.colors;

        if (Array.isArray(value)) {
            return value;
        }

        return ["red", "green", "blue", "yellow"];
    }

    get initialField(): (string | null)[][] | null {
        const data: any = this.raw;
        const value = data.initialField;

        if (!Array.isArray(value) || value.length === 0) {
            return null;
        }

        return value;
    }
}

