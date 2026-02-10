const { ccclass, property, executeInEditMode } = cc._decorator;
import DiContainer from "./DiContainer";
import DiTokens from "./DiTokens";
import MainGameConfig from "../Config/MainGameConfig";
import MainLevelConfig from "../Config/MainLevelConfig";
import TileColorConfig from "../Config/TileColorConfig";
import IGameCore from "../GameCore/IGameCore";
import BlastGameCore from "../GameCore/BlastGameCore";
import IInput from "../Input/IInput";
import TapInput from "../Input/TapInput";

@ccclass
@executeInEditMode
export default class DiInitializer extends cc.Component {

    @property(MainGameConfig)
    mainGameConfig: MainGameConfig = null;

    @property(MainLevelConfig)
    mainLevelConfig: MainLevelConfig = null;

    @property(TileColorConfig)
    tileColorConfig: TileColorConfig = null;

    @property
    rebuild: boolean = false;

    @property(cc.SpriteFrame)
    tileSpriteFrame: cc.SpriteFrame = null;

    @property(cc.Node)
    gameRoot: cc.Node = null;

    onLoad() {
        this.initialize();
    }

    private initialize() {
        const container = DiContainer.instance;

        if (this.mainGameConfig) {
            container.register(DiTokens.MainGameConfig, this.mainGameConfig);
        }

        if (this.mainLevelConfig) {
            container.register(DiTokens.MainLevelConfig, this.mainLevelConfig);
        }

        if (this.tileColorConfig) {
            container.register(DiTokens.TileColorConfig, this.tileColorConfig);
        }

        const gameRootNode = this.gameRoot ? this.gameRoot : this.node;

        gameRootNode.removeAllChildren();

        const rows = this.mainLevelConfig ? this.mainLevelConfig.rows : 8;
        const cols = this.mainLevelConfig ? this.mainLevelConfig.cols : 8;
        const colors = this.mainLevelConfig ? this.mainLevelConfig.colors : ["red", "green", "blue", "yellow"];
        const tileSize = this.mainGameConfig ? this.mainGameConfig.tileSize : 64;
        const tileSpacing = this.mainGameConfig ? this.mainGameConfig.tileSpacing : 4;

        const gameCore: IGameCore = new BlastGameCore(
            gameRootNode,
            this.tileSpriteFrame,
            rows,
            cols,
            colors,
            tileSize,
            tileSpacing,
            this.tileColorConfig
        );

        container.register(DiTokens.GameCore, gameCore);

        const input: IInput = new TapInput(gameCore);

        container.register(DiTokens.Input, input);

        gameCore.init();
        input.init();
    }

    update() {
        if (!this.rebuild) {
            return;
        }

        this.rebuild = false;
        this.initialize();
    }
}

