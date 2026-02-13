const {ccclass, property} = cc._decorator;
import {MainGameConfig} from "./MainGameConfigType";

@ccclass
export default class FieldViewConfigComponent extends cc.Component {

    @property(cc.JsonAsset)
    json: cc.JsonAsset = null;

    getMainGameConfig(): MainGameConfig {
        return this.json.json as MainGameConfig;
    }
}
