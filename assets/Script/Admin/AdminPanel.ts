const { ccclass, property } = cc._decorator;
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";
import IGameController from "../GameCore/IGameController";
import MainLevelsConfig from "../Config/MainLevelConfig";

@ccclass
export default class AdminPanel extends cc.Component {

    @property(MainLevelsConfig)
    mainLevelConfig: MainLevelsConfig = null;

    @property(cc.Node)
    buttonsGroup: cc.Node = null;

    @property(cc.Prefab)
    levelButtonPrefab: cc.Prefab = null;

    onToggleClick() {
        const willShow = !this.node.active;
        this.node.active = !this.node.active;
        if (willShow) {
            this.buildLevelButtons();
        }
    }

    onButtonClick(button: cc.Event, customEventData: string) {
        if (customEventData === "Добавить 5 ходов") {
            this.onAddMoves();
            return;
        }
    }

    onStartLevel(event: cc.Event, customEventData: string) {
        const index = parseInt(customEventData, 10);

        if (isNaN(index)) {
            return;
        }

        this.startLevel(index);
    }

    private onAddMoves() {
        if (!DiContainer.instance.has(DiTokens.GameController)) {
            return;
        }

        const gameCore = DiContainer.instance.resolve<IGameController>(DiTokens.GameController);

        if (!gameCore) {
            return;
        }

        gameCore.addMoves(5);
    }

    private buildLevelButtons() {
        if (!this.buttonsGroup || !this.levelButtonPrefab || !this.mainLevelConfig) {
            return;
        }

        const levels = this.mainLevelConfig.levels;

        if (!levels || levels.length === 0) {
            return;
        }

        this.buttonsGroup.removeAllChildren();

        for (let i = 0; i < levels.length; i++) {
            const levelIndex = i + 1;
            const node = cc.instantiate(this.levelButtonPrefab);
            const label = node.getComponentInChildren(cc.Label);

            if (label) {
                const data = levels[i] && levels[i].json ? levels[i].json : null;
                label.string = (data && data.name) ? data.name : "Level " + levelIndex;
            }

            node.name = "SelectLevel" + levelIndex + "Button";

            const button = node.getComponent(cc.Button);

            if (button) {
                const handler = new cc.Component.EventHandler();
                handler.target = this.node;
                handler.component = "AdminPanel";
                handler.handler = "onStartLevel";
                handler.customEventData = String(levelIndex);
                button.clickEvents.push(handler);
            }

            this.buttonsGroup.addChild(node);
        }
    }

    private startLevel(index: number) {
        if (!this.mainLevelConfig) {
            return;
        }

        const levels = this.mainLevelConfig.levels;

        if (!levels || levels.length === 0) {
            return;
        }

        const targetIndex = index - 1;

        if (targetIndex < 0 || targetIndex >= levels.length) {
            return;
        }

        this.mainLevelConfig.currentLevelIndex = targetIndex;

        if (!DiContainer.instance.has(DiTokens.DiInitializer)) {
            return;
        }

        const diInitializer = DiContainer.instance.resolve<any>(DiTokens.DiInitializer);

        if (!diInitializer) {
            return;
        }

        diInitializer.rebuild = true;
    }
}

