const { ccclass } = cc._decorator;
import Helloworld from "./Helloworld";

@ccclass
export default class Tile extends cc.Component {

    row: number = 0;
    col: number = 0;
    colorIndex: number = 0;
    game: Helloworld = null;

    onEnable() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.handleClick, this);
    }

    onDisable() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.handleClick, this);
    }

    private handleClick() {
        if (!this.game) {
            return;
        }

        this.game.onTileClicked(this);
    }
}

