const { ccclass, property } = cc._decorator;

@ccclass
export default class MainGameConfig extends cc.Component {

    @property(cc.JsonAsset)
    json: cc.JsonAsset = null;

    get tileSize(): number {
        const data: any = this.json ? this.json.json : {};
        return data.tileSize || 64;
    }

    get tileSpacing(): number {
        const data: any = this.json ? this.json.json : {};
        return data.tileSpacing || 4;
    }
}

