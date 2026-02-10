const { ccclass, property } = cc._decorator;
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";
import IGameCore from "../GameCore/IGameCore";
import MainLevelConfig from "../Config/MainLevelConfig";

@ccclass
export default class AdminPanel extends cc.Component {

    @property(MainLevelConfig)
    mainLevelConfig: MainLevelConfig = null;

    @property(cc.JsonAsset)
    level1: cc.JsonAsset = null;

    @property(cc.JsonAsset)
    level2: cc.JsonAsset = null;

    @property(cc.JsonAsset)
    level3: cc.JsonAsset = null;

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

        if (index === 1 && this.level1) {
            this.mainLevelConfig.json = this.level1;
        } else if (index === 2 && this.level2) {
            this.mainLevelConfig.json = this.level2;
        } else if (index === 3 && this.level3) {
            this.mainLevelConfig.json = this.level3;
        } else {
            return;
        }

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

