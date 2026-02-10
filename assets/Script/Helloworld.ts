const { ccclass, property } = cc._decorator;
import IGameCore from "./GameCore/IGameCore";
import BlastGameCore from "./GameCore/BlastGameCore";

@ccclass
export default class Helloworld extends cc.Component {

    @property(cc.Label)
    label: cc.Label = null;

    @property(cc.SpriteFrame)
    tileSpriteFrame: cc.SpriteFrame = null;

    private rows: number = 8;
    private cols: number = 8;
    private colorsCount: number = 4;
    private tileSize: number = 64;
    private tileSpacing: number = 4;

    private gameCore: IGameCore = null;

    start() {
        if (!this.tileSpriteFrame) {
            return;
        }

        this.gameCore = new BlastGameCore(
            this.node,
            this.tileSpriteFrame,
            this.rows,
            this.cols,
            this.colorsCount,
            this.tileSize,
            this.tileSpacing
        );

        this.gameCore.init();
    }
}
