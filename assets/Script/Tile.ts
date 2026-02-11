const { ccclass } = cc._decorator;
import DiContainer from "./DI/DiContainer";
import DiTokens from "./DI/DiTokens";
import IInput from "./Input/IInput";

@ccclass
export default class Tile extends cc.Component {

    row: number = 0;
    col: number = 0;
    tileType: string = null;

    private input: IInput = null;

    onEnable() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.handleClick, this);
    }

    onDisable() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.handleClick, this);
    }

    private resolveInput() {
        if (this.input) {
            return;
        }

        const container = DiContainer.instance;

        if (!container.has(DiTokens.Input)) {
            return;
        }

        this.input = container.resolve<IInput>(DiTokens.Input);
    }

    private handleClick() {
        this.resolveInput();

        if (!this.input) {
            return;
        }

        this.input.handleTileTap(this);
    }
}

