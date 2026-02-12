const {ccclass, property, executeInEditMode} = cc._decorator;
import DiContainer from "./DiContainer";
import DiTokens from "./DiTokens";
import MainGameConfig from "../Config/MainGameConfig";
import MainLevelsConfig from "../Config/MainLevelConfig";
import BoostersConfig from "../Config/BoostersConfig";
import {BoosterConfig} from "../Config/BoosterConfig";
import PlayerProfile from "../PlayerProfile";
import TileColorConfig from "../Config/TileColorConfig";
import SuperTilesConfig from "../Config/SuperTilesConfig";
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

    @property(MainGameConfig)
    mainGameConfig: MainGameConfig = null;

    @property(MainLevelsConfig)
    mainLevelConfig: MainLevelsConfig = null;

    @property(TileColorConfig)
    tileColorConfig: TileColorConfig = null;

    @property(BoostersConfig)
    boostersConfig: BoostersConfig = null;

    @property(SuperTilesConfig)
    superTilesConfig: SuperTilesConfig = null;

    @property(BoostersPanelView)
    boostersPanel: BoostersPanelView = null;

    @property(GameUI)
    gameUI: GameUI = null;

    @property
    enableShuffle: boolean = true;

    async onLoad() {
        DiContainer.instance.register(DiTokens.DiInitializer, this);

        if (this.mainLevelConfig && typeof this.mainLevelConfig.loadLevels === "function") {
            await this.mainLevelConfig.loadLevels();
        }
        this.initialize();
    }

    private async initialize() {
        const container = DiContainer.instance;

        container.register(DiTokens.MainGameConfig, this.mainGameConfig);
        container.register(DiTokens.MainLevelConfig, this.mainLevelConfig);
        container.register(DiTokens.TileColorConfig, this.tileColorConfig);
        container.register(DiTokens.BoostersConfig, this.boostersConfig);
        container.register(DiTokens.SuperTilesConfig, this.superTilesConfig);
        container.register(DiTokens.GameUI, this.gameUI);

        const tileSpriteDictionary = this.initTilesDictionary();
        container.register(DiTokens.TileSpriteDictionary, tileSpriteDictionary);

        await this.initSupertiles(tileSpriteDictionary);
        await this.boostersConfig.loadBoosters();
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

        const rows = this.mainLevelConfig ? this.mainLevelConfig.rows : 8;
        const cols = this.mainLevelConfig ? this.mainLevelConfig.cols : 8;
        const colors = this.mainLevelConfig ? this.mainLevelConfig.colors : ["red", "green", "blue", "yellow"];
        const tileSize = this.mainGameConfig ? this.mainGameConfig.tileSize : 64;
        const tileSpacing = this.mainGameConfig ? this.mainGameConfig.tileSpacing : 4;
        const moves = this.mainLevelConfig ? this.mainLevelConfig.moves : 0;
        const targetScore = this.mainLevelConfig ? this.mainLevelConfig.targetScore : 0;

        const rawField = this.mainLevelConfig ? this.mainLevelConfig.initialField : null;
        let initialField = this.parseInitialField(rawField);

        const animationView = new BlastAnimationView();

        const noMovesResolver = this.enableShuffle ? new ShuffleNoMovesResolver(3) : null;

        const model = gameModelFactory.create(rows, cols, colors, moves, targetScore, this.superTilesConfig, this.boostersConfig);

        const tileSpriteDictionary = container.resolve<TileSpriteDictionary>(DiTokens.TileSpriteDictionary);
        const defaultTileSpriteFrame = tileSpriteDictionary ? tileSpriteDictionary.getDefaultSprite() : null;
        const fieldView: IFieldView = new FieldView(rows, cols, colors, tileSize, tileSpacing, defaultTileSpriteFrame, this.tileColorConfig);

        const gameController: IGameController = new GameController(model, this.gameUI, fieldView, animationView, noMovesResolver, initialField);

        container.register(DiTokens.GameController, gameController);

        const input: IInput = new TapInput(gameController);

        container.register(DiTokens.Input, input);

        let profile: PlayerProfile;
        if (container.has(DiTokens.PlayerProfile)) {
            profile = container.resolve<PlayerProfile>(DiTokens.PlayerProfile);
        } else {
            profile = new PlayerProfile();
            container.register(DiTokens.PlayerProfile, profile);
        }

        profile.ensureBoostersInitialized(this.boostersConfig);

        gameController.init();
        input.init();

        this.initializeBoosters(gameController);
    };

    private parseInitialField(rawField: (string | null)[][]) {
        let initialField: (string | null)[][] | null = null;
        if (rawField && Array.isArray(rawField) && rawField.length > 0) {
            initialField = [];
            for (let r = 0; r < rawField.length; r++) {
                const row: (string | null)[] = [];
                const rawRow = rawField[r];
                if (Array.isArray(rawRow)) {
                    for (let c = 0; c < rawRow.length; c++) {
                        const cell = rawRow[c];
                        let value: string | null = null;
                        if (typeof cell === "string") {
                            const parts = cell.split(":");
                            if (parts.length === 2) {
                                const superId = parts[0].trim();
                                value = superId;
                            } else {
                                value = cell.trim();
                            }
                        }
                        row.push(value && value.length > 0 ? value : null);
                    }
                }
                initialField.push(row);
            }
        }
        return initialField;
    }

    private async initSupertiles(tileSpriteDictionary: TileSpriteDictionary) {
        await this.superTilesConfig.loadSuperTiles();
        const configs = this.superTilesConfig.getSuperTileConfigs();
        const loadPromises: Promise<void>[] = [];
        for (let i = 0; i < configs.length; i++) {
            const cfg: any = configs[i];
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
        const configs = this.boostersConfig.getBoosterConfigs();
        const buttons = this.boostersPanel.initialize(configs as BoosterConfig[]);

        const boostersButtonFactory = new BoostersControllersFactory();
        boostersButtonFactory.createControllers(configs as BoosterConfig[], buttons, this.boostersPanel, gameCore);
    }

    async update() {
        if (!this.rebuild) {
            return;
        }

        this.rebuild = false;
        await this.initialize();
    }
}

