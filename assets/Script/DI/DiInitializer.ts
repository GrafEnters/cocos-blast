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
import BlastGameCoreView from "../GameCore/Animations/BlastGameCoreView";
import ShuffleNoMovesResolver from "../GameCore/ShuffleNoMovesResolver";
import EndGamePanel from "../UI/EndGamePanel";
import IInput from "../Input/IInput";
import TapInput from "../Input/TapInput";
import BoostersPanelView from "../UI/BoostersPanelView";
import BoostersControllersFactory from "../UI/BoostersControllersFactory";
import TileSpriteDictionary from "../GameCore/TileSpriteDictionary";

@ccclass
@executeInEditMode
export default class DiInitializer extends cc.Component {

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

    @property
    rebuild: boolean = false;

    @property(cc.Label)
    movesLabel: cc.Label = null;

    @property(cc.Label)
    pointsLabel: cc.Label = null;

    @property(cc.Node)
    gameRoot: cc.Node = null;

    @property(BoostersPanelView)
    boostersPanel: BoostersPanelView = null;

    @property(cc.Node)
    movesPanel: cc.Node = null;

    @property(cc.Node)
    endGamePanelNode: cc.Node = null;

    @property
    enableShuffle: boolean = true;

    onLoad() {
        DiContainer.instance.register(DiTokens.DiInitializer, this);

        if (this.mainLevelConfig && typeof this.mainLevelConfig.loadLevels === "function") {
            this.mainLevelConfig.loadLevels(() => this.initialize());
        } else {
            this.initialize();
        }
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

        if (this.boostersConfig) {
            container.register(DiTokens.BoostersConfig, this.boostersConfig);
        }

        if (this.superTilesConfig) {
            container.register(DiTokens.SuperTilesConfig, this.superTilesConfig);
        }

        const tileSpriteDictionary = new TileSpriteDictionary(this.tileColorConfig ? this.tileColorConfig.defaultSprite : null);
        if (this.tileColorConfig) {
            const keys = this.tileColorConfig.keys || [];
            const sprites = this.tileColorConfig.sprites || [];
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                const sprite = i < sprites.length ? sprites[i] : null;
                if (key && sprite) {
                    tileSpriteDictionary.register(key, sprite);
                }
            }
        }
        container.register(DiTokens.TileSpriteDictionary, tileSpriteDictionary);

        const gameModelFactory = new GameModelFactory(container);
        container.register(DiTokens.GameModelFactory, gameModelFactory);

        const ensureBoostersLoaded = (next: () => void) => {
            if (this.boostersConfig && typeof this.boostersConfig.loadBoosters === "function") {
                this.boostersConfig.loadBoosters(next);
            } else {
                next();
            }
        };

        const buildAndStartGame = () => {
            const gameRootNode = this.gameRoot ? this.gameRoot : this.node;

            if (this.gameRoot) {
                this.gameRoot.active = true;
            }

            if (this.boostersPanel) {
                this.boostersPanel.node.active = true;
            }

            if (this.movesPanel) {
                this.movesPanel.active = true;
            }

            if (this.endGamePanelNode) {
                this.endGamePanelNode.active = false;
            }

            gameRootNode.removeAllChildren();


            const rows = this.mainLevelConfig ? this.mainLevelConfig.rows : 8;
            const cols = this.mainLevelConfig ? this.mainLevelConfig.cols : 8;
            const colors = this.mainLevelConfig ? this.mainLevelConfig.colors : ["red", "green", "blue", "yellow"];
            const tileSize = this.mainGameConfig ? this.mainGameConfig.tileSize : 64;
            const tileSpacing = this.mainGameConfig ? this.mainGameConfig.tileSpacing : 4;
            const moves = this.mainLevelConfig ? this.mainLevelConfig.moves : 0;
            const targetScore = this.mainLevelConfig ? this.mainLevelConfig.targetScore : 0;

            const rawField = this.mainLevelConfig ? this.mainLevelConfig.initialField : null;
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

            const gameCoreView = new BlastGameCoreView();

            const endGamePanel = this.endGamePanelNode ? this.endGamePanelNode.getComponent(EndGamePanel) : null;

            const noMovesResolver = this.enableShuffle ? new ShuffleNoMovesResolver(3) : null;

            const model = gameModelFactory.create(rows, cols, colors, moves, targetScore, this.superTilesConfig, this.boostersConfig);

            const gameCore: IGameController = new GameController(
                gameRootNode,
                rows,
                cols,
                colors,
                tileSize,
                tileSpacing,
                this.tileColorConfig,
                model,
                this.movesLabel ? (value => {
                    this.movesLabel.string = value.toString();
                }) : undefined,
                this.pointsLabel ? ((score, target) => {
                    if (target > 0) {
                        this.pointsLabel.string = score.toString() + " / " + target.toString();
                    } else {
                        this.pointsLabel.string = score.toString();
                    }
                }) : undefined,
                gameCoreView,
                endGamePanel ? (() => {
                    if (this.gameRoot) {
                        this.gameRoot.active = false;
                    }

                    if (this.boostersPanel) {
                        this.boostersPanel.node.active = false;
                    }

                    if (this.movesPanel) {
                        this.movesPanel.active = false;
                    }

                    if (this.endGamePanelNode) {
                        this.endGamePanelNode.active = true;
                    }

                    endGamePanel.showWin();
                }) : undefined,
                endGamePanel ? (() => {
                    if (this.gameRoot) {
                        this.gameRoot.active = false;
                    }

                    if (this.boostersPanel) {
                        this.boostersPanel.node.active = false;
                    }

                    if (this.movesPanel) {
                        this.movesPanel.active = false;
                    }

                    if (this.endGamePanelNode) {
                        this.endGamePanelNode.active = true;
                    }

                    endGamePanel.showLose();
                }) : undefined,
                noMovesResolver,
                initialField
            );

            container.register(DiTokens.GameCore, gameCore);

            const input: IInput = new TapInput(gameCore);

            container.register(DiTokens.Input, input);

            let profile: PlayerProfile;
            if (container.has(DiTokens.PlayerProfile)) {
                profile = container.resolve<PlayerProfile>(DiTokens.PlayerProfile);
            } else {
                profile = new PlayerProfile();
                container.register(DiTokens.PlayerProfile, profile);
            }

            if (this.boostersConfig && profile) {
                profile.ensureBoostersInitialized(this.boostersConfig);
            }

            gameCore.init();
            input.init();

            this.initializeBoosters(gameCore);
        };

        if (this.superTilesConfig && typeof this.superTilesConfig.loadSuperTiles === "function") {
            this.superTilesConfig.loadSuperTiles(() => {
                const configs = this.superTilesConfig.getSuperTileConfigs();
                if (!configs || configs.length === 0) {
                    ensureBoostersLoaded(buildAndStartGame);
                    return;
                }
                let pending = 0;
                for (let i = 0; i < configs.length; i++) {
                    const cfg: any = configs[i];
                    if (!cfg || typeof cfg.id !== "string" || typeof cfg.icon !== "string") {
                        continue;
                    }
                    const id = cfg.id.trim();
                    const iconPath = cfg.icon.trim();
                    if (!id || !iconPath) {
                        continue;
                    }
                    pending++;
                    cc.resources.load(iconPath, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
                        if (!err && spriteFrame) {
                            tileSpriteDictionary.register(id, spriteFrame);
                        }
                        pending--;
                        if (pending <= 0) {
                            ensureBoostersLoaded(buildAndStartGame);
                        }
                    });
                }
                if (pending === 0) {
                    ensureBoostersLoaded(buildAndStartGame);
                }
            });
        } else {
            ensureBoostersLoaded(buildAndStartGame);
        }
    }

    private initializeBoosters(gameCore: IGameController): void {
        const configs = this.boostersConfig.getBoosterConfigs();
        const buttons = this.boostersPanel.initialize(configs as BoosterConfig[]);

        const boostersButtonFactory = new BoostersControllersFactory();
        boostersButtonFactory.createControllers(configs as BoosterConfig[], buttons, this.boostersPanel, gameCore);
    }

    update() {
        if (!this.rebuild) {
            return;
        }

        this.rebuild = false;
        this.initialize();
    }
}

