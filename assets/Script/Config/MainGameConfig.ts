const { ccclass, property } = cc._decorator;

@ccclass
export default class MainGameConfig extends cc.Component {

    @property(cc.JsonAsset)
    json: cc.JsonAsset = null;

    get tileSize(): number {
        const data: any = this.json ? this.json.json : {};
        const value = data.tileSize;

        if (value === undefined || value === null) {
            return 64;
        }

        return value;
    }

    get tileSpacing(): number {
        const data: any = this.json ? this.json.json : {};
        const value = data.tileSpacing;

        if (value === undefined || value === null) {
            return 4;
        }

        return value;
    }
}

