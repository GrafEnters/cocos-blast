const {ccclass, property} = cc._decorator;
import {BoosterConfig} from "../Config/BoosterConfig";
import BoosterButtonView from "./BoosterButtonView";

@ccclass
export default class BoostersPanelView extends cc.Component {

    @property(cc.Prefab)
    boosterButtonPrefab: cc.Prefab = null;

    @property(cc.Node)
    boostersButtonsContainer: cc.Node = null;

    @property(cc.Node)
    activeBoosterOverlay: cc.Node = null;

    @property(cc.Node)
    activeBoosterHintLabel: cc.Node = null;

    initialize(configs: BoosterConfig[]): { [id: string]: BoosterButtonView } {
        this.destroyButtons();

        const result: { [id: string]: BoosterButtonView } = {};

        for (let i = 0; i < configs.length; i++) {
            const cfg = configs[i];

            const node = cc.instantiate(this.boosterButtonPrefab);
            this.boostersButtonsContainer.addChild(node);

            const view = node.getComponent(BoosterButtonView);
            view.initFromConfig(cfg.id);
            result[view.boosterId] = view;
        }

        return result;
    }

    private destroyButtons() {
        const existingChildren = this.boostersButtonsContainer.children.slice();
        for (let i = 0; i < existingChildren.length; i++) {
            const child = existingChildren[i];
            const view = child.getComponent(BoosterButtonView);
            if (view) {
                child.removeFromParent();
                child.destroy();
            }
        }
    }

    refreshAllButtons(): void {
        if (!this.boostersButtonsContainer) {
            return;
        }
        const children = this.boostersButtonsContainer.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const view = child.getComponent(BoosterButtonView);
            if (view) {
                view.refresh();
            }
        }
    }
}
