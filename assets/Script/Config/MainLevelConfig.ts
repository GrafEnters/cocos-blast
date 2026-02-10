const { ccclass, property } = cc._decorator;

@ccclass
export default class MainLevelConfig extends cc.Component {

    @property(cc.JsonAsset)
    json: cc.JsonAsset = null;

    private get raw(): any {
        return this.json ? this.json.json : {};
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
}

