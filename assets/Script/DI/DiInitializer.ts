const {ccclass, property, executeInEditMode} = cc._decorator;
import DiContainer from "./DiContainer";
import DiTokens from "./DiTokens";
import FieldViewConfigComponent from "../Config/FieldViewConfigComponent";
import LevelsConfigList from "../Config/LevelsConfigList";
import BoostersConfigList from "../Config/BoostersConfigList";
import PlayerProfile from "../PlayerProfile";
import TileColorConfig from "../Config/TileColorConfig";
import SupertilesConfigList from "../Config/SupertilesConfigList";
import IGameController from "../GameCore/IGameController";
import GameController from "../GameCore/GameController";
import GameModelFactory from "../GameCore/Models/GameModelFactory";
import BlastAnimationView from "../GameCore/Animations/BlastAnimationView";
import ShuffleNoMovesResolver from "../GameCore/ShuffleNoMovesResolver";
import FieldView from "../GameCore/FieldView";
import IFieldView from "../GameCore/IFieldView";
import IInput from "../Input/IInput";
import TapInput from "../Input/TapInput";
import BoostersPanelView from "../UI/BoostersPanelView";
import BoostersControllersFactory from "../GameCore/Boosters/BoostersControllersFactory";
import TileSpriteDictionary from "../GameCore/TileSpriteDictionary";
import GameUI from "../UI/GameUI";

@ccclass
@executeInEditMode
export default class DiInitializer extends cc.Component {
    @property
    rebuild: boolean = false;

    @property(FieldViewConfigComponent)
    fieldViewConfigComponent: FieldViewConfigComponent = null;

    @property(LevelsConfigList)
    levelsConfigList: LevelsConfigList = null;

    @property(TileColorConfig)
    tileColorConfig: TileColorConfig = null;

    @property(BoostersConfigList)
    boostersConfig: BoostersConfigList = null;

    @property(SupertilesConfigList)
    superTilesConfig: SupertilesConfigList = null;

    @property(BoostersPanelView)
    boostersPanel: BoostersPanelView = null;

    @property(GameUI)
    gameUI: GameUI = null;

    @property
    enableShuffle: boolean = true;

    async onLoad() {
        DiContainer.instance.register(DiTokens.DiInitializer, this);

        await this.levelsConfigList.loadConfigs();
        this.initialize();
    }

    private async initialize() {
        const container = DiContainer.instance;

        container.register(DiTokens.MainGameConfig, this.fieldViewConfigComponent);
        container.register(DiTokens.LevelsConfigList, this.levelsConfigList);
        container.register(DiTokens.TileColorConfig, this.tileColorConfig);
        container.register(DiTokens.BoostersConfig, this.boostersConfig);
        container.register(DiTokens.SuperTilesConfig, this.superTilesConfig);
        container.register(DiTokens.GameUI, this.gameUI);


        await this.superTilesConfig.loadConfigs();
        const tileSpriteDictionary = this.initTilesDictionary();
        container.register(DiTokens.TileSpriteDictionary, tileSpriteDictionary);

        await this.initSupertiles(tileSpriteDictionary);

        await this.boostersConfig.loadConfigs();
        await this.buildAndStartGame();
    }

    private initTilesDictionary() {
        const tileSpriteDictionary = new TileSpriteDictionary(this.tileColorConfig ? this.tileColorConfig.defaultSprite : null);

        const keys = this.tileColorConfig.keys || [];
        const sprites = this.tileColorConfig.sprites || [];
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const sprite = i < sprites.length ? sprites[i] : null;
            if (key && sprite) {
                tileSpriteDictionary.register(key, sprite);
            }
        }

        return tileSpriteDictionary;
    }

    private async buildAndStartGame() {
        const container = DiContainer.instance;
        const gameModelFactory = new GameModelFactory(container);
        container.register(DiTokens.GameModelFactory, gameModelFactory);

        this.gameUI.init();

        let profile: PlayerProfile;
        if (container.has(DiTokens.PlayerProfile)) {
            profile = container.resolve<PlayerProfile>(DiTokens.PlayerProfile);
        } else {
            profile = new PlayerProfile();
            container.register(DiTokens.PlayerProfile, profile);
        }


        const levelIndex = profile.getCurrentLevelIndex();
        const levelConfig = this.levelsConfigList.getLevelConfigByIndex(levelIndex);

        const mainGameConfig = this.fieldViewConfigComponent.getMainGameConfig();
        const initialField = levelConfig.initialField;

        const animationView = new BlastAnimationView();

        const noMovesResolver = this.enableShuffle ? new ShuffleNoMovesResolver(3) : null;

        const model = gameModelFactory.create(levelConfig, this.superTilesConfig, this.boostersConfig);

        const tileSpriteDictionary = container.resolve<TileSpriteDictionary>(DiTokens.TileSpriteDictionary);
        const fieldView: IFieldView = new FieldView(levelConfig.rows, levelConfig.cols, mainGameConfig, tileSpriteDictionary);

        const gameController: IGameController = new GameController(model, this.gameUI, fieldView, animationView, noMovesResolver, initialField);

        container.register(DiTokens.GameController, gameController);

        const input: IInput = new TapInput(gameController);

        container.register(DiTokens.Input, input);

        profile.ensureBoostersInitialized(this.boostersConfig);

        gameController.init();
        input.init();

        this.initializeBoosters(gameController);
    };

    private async initSupertiles(tileSpriteDictionary: TileSpriteDictionary) {
        const configs = this.superTilesConfig.getConfigs();
        const loadPromises: Promise<void>[] = [];
        for (let i = 0; i < configs.length; i++) {
            const cfg = configs[i];
            const id = cfg.id.trim();
            const iconPath = cfg.icon.trim();
            const loadPromise = new Promise<void>((resolve) => {
                cc.resources.load(iconPath, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
                    if (!err && spriteFrame) {
                        tileSpriteDictionary.register(id, spriteFrame);
                    }
                    resolve();
                });
            });
            loadPromises.push(loadPromise);
        }
        await Promise.all(loadPromises);
    }

    private initializeBoosters(gameCore: IGameController): void {
        const configs = this.boostersConfig.getConfigs();
        const buttons = this.boostersPanel.initialize(configs);

        const boostersButtonFactory = new BoostersControllersFactory();
        boostersButtonFactory.createControllers(configs, buttons, this.boostersPanel, gameCore);
    }

    async update() {
        if (!this.rebuild) {
            return;
        }

        this.rebuild = false;
        await this.initialize();
    }
}

