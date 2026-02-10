const { ccclass } = cc._decorator;
import IGameCore from "./GameCore/IGameCore";
import TileInputEventType from "./GameCore/TileInputEventType";
import TileInputEvent from "./GameCore/TileInputEvent";

@ccclass
export default class Tile extends cc.Component {

    row: number = 0;
    col: number = 0;
    colorIndex: number = 0;
    game: IGameCore = null;

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

        const supported = this.game.getSupportedEvents();

        if (supported.indexOf(TileInputEventType.Tap) === -1) {
            return;
        }

        const event: TileInputEvent = {
            type: TileInputEventType.Tap,
            tile: this,
        };

        this.game.handleEvent(event);
    }
}



