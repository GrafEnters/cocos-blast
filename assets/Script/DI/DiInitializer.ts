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
import { LevelConfig } from "../Config/LevelConfig";
import { MainGameConfig } from "../Config/MainGameConfigType";

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

    private initTilesDictionary(): TileSpriteDictionary {
        const defaultSprite = this.tileColorConfig ? this.tileColorConfig.defaultSprite : null;
        const tileSpriteDictionary = new TileSpriteDictionary(defaultSprite);

        const keys = this.tileColorConfig.keys || [];
        const sprites = this.tileColorConfig.sprites || [];
        const maxLength = Math.min(keys.length, sprites.length);

        for (let i = 0; i < maxLength; i++) {
            const key = keys[i];
            const sprite = sprites[i];
            if (key && sprite) {
                tileSpriteDictionary.register(key, sprite);
            }
        }

        return tileSpriteDictionary;
    }

    private async buildAndStartGame(): Promise<void> {
        const container = DiContainer.instance;
        this.registerGameModelFactory(container);
        this.gameUI.init();

        const profile = this.getOrCreatePlayerProfile(container);
        const levelConfig = this.getLevelConfig(profile);
        if (!levelConfig) {
            throw new Error("LevelConfig not found");
        }

        const mainGameConfig = this.fieldViewConfigComponent.getMainGameConfig();
        const initialField = levelConfig.initialField;

        const model = this.createGameModel(container, levelConfig);
        const fieldView = this.createFieldView(container, levelConfig, mainGameConfig);
        const gameController = this.createGameController(model, fieldView, initialField);

        container.register(DiTokens.GameController, gameController);
        this.setupInput(container, gameController);

        profile.ensureBoostersInitialized(this.boostersConfig);
        gameController.init();
        this.initializeBoosters(gameController);
    }

    private registerGameModelFactory(container: DiContainer): void {
        const gameModelFactory = new GameModelFactory(container);
        container.register(DiTokens.GameModelFactory, gameModelFactory);
    }

    private getOrCreatePlayerProfile(container: DiContainer): PlayerProfile {
        if (container.has(DiTokens.PlayerProfile)) {
            return container.resolve<PlayerProfile>(DiTokens.PlayerProfile);
        }
        const profile = new PlayerProfile();
        container.register(DiTokens.PlayerProfile, profile);
        return profile;
    }

    private getLevelConfig(profile: PlayerProfile): LevelConfig | null {
        const levelIndex = profile.getCurrentLevelIndex();
        return this.levelsConfigList.getLevelConfigByIndex(levelIndex);
    }

    private createGameModel(container: DiContainer, levelConfig: LevelConfig): IGameModel {
        const gameModelFactory = container.resolve<GameModelFactory>(DiTokens.GameModelFactory);
        return gameModelFactory.create(levelConfig, this.superTilesConfig, this.boostersConfig);
    }

    private createFieldView(container: DiContainer, levelConfig: LevelConfig, mainGameConfig: MainGameConfig): IFieldView {
        const tileSpriteDictionary = container.resolve<TileSpriteDictionary>(DiTokens.TileSpriteDictionary);
        return new FieldView(levelConfig.rows, levelConfig.cols, mainGameConfig, tileSpriteDictionary);
    }

    private createGameController(model: IGameModel, fieldView: IFieldView, initialField: (string | null)[][] | null): IGameController {
        const animationView = new BlastAnimationView();
        const noMovesResolver = this.enableShuffle ? new ShuffleNoMovesResolver(3) : null;
        return new GameController(model, this.gameUI, fieldView, animationView, noMovesResolver, initialField);
    }

    private setupInput(container: DiContainer, gameController: IGameController): void {
        const input: IInput = new TapInput(gameController);
        container.register(DiTokens.Input, input);
        input.init();
    }

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

