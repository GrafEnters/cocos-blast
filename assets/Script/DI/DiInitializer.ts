const { ccclass, property } = cc._decorator;
import DiContainer from "./DiContainer";
import DiTokens from "./DiTokens";
import MainGameConfig from "../Config/MainGameConfig";
import MainLevelConfig from "../Config/MainLevelConfig";
import IGameCore from "../GameCore/IGameCore";
import BlastGameCore from "../GameCore/BlastGameCore";
import IInput from "../Input/IInput";
import TapInput from "../Input/TapInput";

@ccclass
export default class DiInitializer extends cc.Component {

    @property(MainGameConfig)
    mainGameConfig: MainGameConfig = null;

    @property(MainLevelConfig)
    mainLevelConfig: MainLevelConfig = null;

    @property(cc.SpriteFrame)
    tileSpriteFrame: cc.SpriteFrame = null;

    @property(cc.Node)
    gameRoot: cc.Node = null;

    onLoad() {
        const container = DiContainer.instance;

        if (this.mainGameConfig) {
            container.register(DiTokens.MainGameConfig, this.mainGameConfig);
        }

        if (this.mainLevelConfig) {
            container.register(DiTokens.MainLevelConfig, this.mainLevelConfig);
        }

        const gameRootNode = this.gameRoot ? this.gameRoot : this.node;

        const rows = this.mainLevelConfig ? this.mainLevelConfig.rows : 8;
        const cols = this.mainLevelConfig ? this.mainLevelConfig.cols : 8;
        const colorsCount = this.mainLevelConfig ? this.mainLevelConfig.colorsCount : 4;
        const tileSize = this.mainGameConfig ? this.mainGameConfig.tileSize : 64;
        const tileSpacing = this.mainGameConfig ? this.mainGameConfig.tileSpacing : 4;

        const gameCore: IGameCore = new BlastGameCore(
            gameRootNode,
            this.tileSpriteFrame,
            rows,
            cols,
            colorsCount,
            tileSize,
            tileSpacing
        );

        container.register(DiTokens.GameCore, gameCore);

        const input: IInput = new TapInput(gameCore);

        container.register(DiTokens.Input, input);

        gameCore.init();
        input.init();
    }
}

