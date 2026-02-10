const { ccclass, property } = cc._decorator;
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";
import IGameCore from "../GameCore/IGameCore";
import MainLevelsConfig from "../Config/MainLevelConfig";

@ccclass
export default class AdminPanel extends cc.Component {

    @property(MainLevelsConfig)
    mainLevelConfig: MainLevelsConfig = null;

    onToggleClick() {
        this.node.active = !this.node.active;
    }

    onButtonClick(button: cc.Event, customEventData: string) {
        if (customEventData === "Добавить 5 ходов") {
            this.onAddMoves();
            return;
        }

        if (customEventData === "Запустить уровень 1") {
            this.startLevel(1);
            return;
        }

        if (customEventData === "Запустить уровень 2") {
            this.startLevel(2);
            return;
        }

        if (customEventData === "Запустить уровень 3") {
            this.startLevel(3);
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
        if (!DiContainer.instance.has(DiTokens.GameCore)) {
            return;
        }

        const gameCore = DiContainer.instance.resolve<IGameCore>(DiTokens.GameCore);

        if (!gameCore) {
            return;
        }

        gameCore.addMoves(5);
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

