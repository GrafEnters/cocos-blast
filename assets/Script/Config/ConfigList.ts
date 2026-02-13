import {LoadConfigsFromDir} from "./ConfigUtils";
import property = cc._decorator.property;

const {ccclass} = cc._decorator;

@ccclass
export default abstract class ConfigList<T> extends cc.Component {

    @property
    path: string = "";
    protected _configs: T[] = [];

    async loadConfigs(): Promise<void> {
        if (this._configs.length > 0) {
            return;
        }
        this._configs = await LoadConfigsFromDir<T>(this.path);
    }

    getConfigs = (): T[] => this._configs.slice();
}
