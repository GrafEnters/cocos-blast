const { ccclass, property } = cc._decorator;
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";
import IGameController from "../GameCore/IGameController";
import LevelsConfigList from "../Config/LevelsConfigList";
import BoostersConfigList from "../Config/BoostersConfigList";
import { BoosterConfig } from "../Config/BoosterConfig";
import PlayerProfile from "../PlayerProfile";
import DiInitializer from "../DI/DiInitializer";
import BoostersPanelView from "../UI/BoostersPanelView";
import GameUI from "../UI/GameUI";

@ccclass
export default class AdminPanel extends cc.Component {

    @property(cc.Node)
    buttonsGroup: cc.Node = null;

    @property(cc.Prefab)
    levelButtonPrefab: cc.Prefab = null;

    @property(cc.Node)
    boosterButtonsGroup: cc.Node = null;

    @property(cc.Prefab)
    boosterButtonPrefab: cc.Prefab = null;

    onToggleClick() {
        const willShow = !this.node.active;
        this.node.active = !this.node.active;
        if (willShow) {
            this.buildLevelButtons();
            this.buildBoosterButtons();
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

    onAddBooster(event: cc.Event, customEventData: string) {
        if (!customEventData) {
            return;
        }

        this.addBooster(customEventData);
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
        if (!this.buttonsGroup || !this.levelButtonPrefab) {
            return;
        }

        if (!DiContainer.instance.has(DiTokens.LevelsConfigList)) {
            return;
        }

        const levelsConfigList = DiContainer.instance.resolve<LevelsConfigList>(DiTokens.LevelsConfigList);
        if (!levelsConfigList) {
            return;
        }

        const levels = levelsConfigList.getConfigs();

        if (!levels || levels.length === 0) {
            return;
        }

        this.buttonsGroup.removeAllChildren();

        for (let i = 0; i < levels.length; i++) {
            const levelIndex = i + 1;
            const node = cc.instantiate(this.levelButtonPrefab);
            const label = node.getComponentInChildren(cc.Label);

            if (label) {
                const level = levels[i];
                label.string = (level && level.name) ? level.name : "Level " + levelIndex;
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
        if (!DiContainer.instance.has(DiTokens.LevelsConfigList)) {
            return;
        }

        const levelsConfigList = DiContainer.instance.resolve<LevelsConfigList>(DiTokens.LevelsConfigList);
        if (!levelsConfigList) {
            return;
        }

        const levels = levelsConfigList.getConfigs();

        if (!levels || levels.length === 0) {
            return;
        }

        const targetIndex = index - 1;

        if (targetIndex < 0 || targetIndex >= levels.length) {
            return;
        }

        if (!DiContainer.instance.has(DiTokens.PlayerProfile)) {
            return;
        }
        const profile = DiContainer.instance.resolve<PlayerProfile>(DiTokens.PlayerProfile);
        profile.setCurrentLevelIndex(targetIndex);

        if (!DiContainer.instance.has(DiTokens.DiInitializer)) {
            return;
        }

        const diInitializer = DiContainer.instance.resolve<DiInitializer>(DiTokens.DiInitializer);

        if (!diInitializer) {
            return;
        }

        diInitializer.rebuild = true;
    }

    private buildBoosterButtons() {
        if (!this.boosterButtonsGroup || !this.boosterButtonPrefab) {
            return;
        }

        if (!DiContainer.instance.has(DiTokens.BoostersConfig)) {
            return;
        }

        const boostersConfigList = DiContainer.instance.resolve<BoostersConfigList>(DiTokens.BoostersConfig);
        if (!boostersConfigList) {
            return;
        }

        const boosters = boostersConfigList.getConfigs();

        if (!boosters || boosters.length === 0) {
            return;
        }

        this.boosterButtonsGroup.removeAllChildren();

        for (let i = 0; i < boosters.length; i++) {
            const booster = boosters[i];
            if (!booster || !booster.id) {
                continue;
            }

            const node = cc.instantiate(this.boosterButtonPrefab);
            const label = node.getComponentInChildren(cc.Label);

            if (label) {
                label.string = "Add 5 " + booster.id;
            }

            node.name = "AddBooster" + booster.id + "Button";

            const button = node.getComponent(cc.Button);

            if (button) {
                const handler = new cc.Component.EventHandler();
                handler.target = this.node;
                handler.component = "AdminPanel";
                handler.handler = "onAddBooster";
                handler.customEventData = booster.id;
                button.clickEvents.push(handler);
            }

            this.boosterButtonsGroup.addChild(node);
        }
    }

    private addBooster(boosterId: string) {
        if (!boosterId) {
            return;
        }

        if (!DiContainer.instance.has(DiTokens.PlayerProfile)) {
            return;
        }

        const profile = DiContainer.instance.resolve<PlayerProfile>(DiTokens.PlayerProfile);
        if (!profile) {
            return;
        }

        profile.changeBoosterCount(boosterId, 5);

        if (!DiContainer.instance.has(DiTokens.GameUI)) {
            return;
        }

        const gameUI = DiContainer.instance.resolve<GameUI>(DiTokens.GameUI);
        if (!gameUI || !gameUI.boostersPanel) {
            return;
        }

        gameUI.boostersPanel.refreshAllButtons();
    }
}

