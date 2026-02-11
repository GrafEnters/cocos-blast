const { ccclass, property, executeInEditMode } = cc._decorator;
import DiContainer from "./DiContainer";
import DiTokens from "./DiTokens";
import MainGameConfig from "../Config/MainGameConfig";
import MainLevelsConfig from "../Config/MainLevelConfig";
import TileColorConfig from "../Config/TileColorConfig";
import IGameCore from "../GameCore/IGameCore";
import GameController from "../GameCore/GameController";
import BlastGameCoreView from "../GameCore/BlastGameCoreView";
import ShuffleNoMovesResolver from "../GameCore/ShuffleNoMovesResolver";
import EndGamePanel from "../UI/EndGamePanel";
import IInput from "../Input/IInput";
import TapInput from "../Input/TapInput";

@ccclass
@executeInEditMode
export default class DiInitializer extends cc.Component {

    @property(MainGameConfig)
    mainGameConfig: MainGameConfig = null;

    @property(MainLevelsConfig)
    mainLevelConfig: MainLevelsConfig = null;

    @property(TileColorConfig)
    tileColorConfig: TileColorConfig = null;

    @property
    rebuild: boolean = false;

    @property(cc.Label)
    movesLabel: cc.Label = null;

    @property(cc.Label)
    pointsLabel: cc.Label = null;

    @property(cc.Node)
    gameRoot: cc.Node = null;

    @property(cc.Node)
    boostersPanel: cc.Node = null;

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

        const gameRootNode = this.gameRoot ? this.gameRoot : this.node;

        if (this.gameRoot) {
            this.gameRoot.active = true;
        }

        if (this.boostersPanel) {
            this.boostersPanel.active = true;
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
        let initialField: (number | null)[][] | null = null;
        if (rawField && Array.isArray(rawField) && rawField.length > 0) {
            initialField = [];
            for (let r = 0; r < rawField.length; r++) {
                const row: (number | null)[] = [];
                const rawRow = rawField[r];
                if (Array.isArray(rawRow)) {
                    for (let c = 0; c < rawRow.length; c++) {
                        const cell = rawRow[c];
                        if (typeof cell === "string") {
                            const idx = colors.indexOf(cell);
                            row.push(idx >= 0 ? idx : null);
                        } else {
                            row.push(null);
                        }
                    }
                }
                initialField.push(row);
            }
        }

        const gameCoreView = new BlastGameCoreView();

        const endGamePanel = this.endGamePanelNode ? this.endGamePanelNode.getComponent(EndGamePanel) : null;

        const noMovesResolver = this.enableShuffle ? new ShuffleNoMovesResolver(3) : null;

        const gameCore: IGameCore = new GameController(
            gameRootNode,
            rows,
            cols,
            colors,
            tileSize,
            tileSpacing,
            this.tileColorConfig,
            moves,
            targetScore,
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
                    this.boostersPanel.active = false;
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
                    this.boostersPanel.active = false;
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

