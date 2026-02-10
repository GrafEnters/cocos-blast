const { ccclass, property } = cc._decorator;

@ccclass
export default class MainLevelsConfig extends cc.Component {

    @property([cc.JsonAsset])
    levels: cc.JsonAsset[] = [];

    @property
    currentLevelIndex: number = 0;

    private get raw(): any {
        const levelAsset = this.currentLevelAsset;
        return levelAsset ? levelAsset.json : {};
    }

    private get currentLevelAsset(): cc.JsonAsset | null {
        if (!this.levels || this.levels.length === 0) {
            return null;
        }

        let index = this.currentLevelIndex;

        if (index < 0) {
            index = 0;
        }

        if (index >= this.levels.length) {
            index = this.levels.length - 1;
        }

        return this.levels[index];
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
}

