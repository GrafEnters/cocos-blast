const { ccclass, property } = cc._decorator;
import MainLevelsConfig from "../Config/MainLevelConfig";
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";

@ccclass
export default class EndGamePanel extends cc.Component {

    @property(cc.Node)
    winState: cc.Node = null;

    @property(cc.Node)
    loseState: cc.Node = null;

    @property(MainLevelsConfig)
    mainLevelConfig: MainLevelsConfig = null;

    showWin() {
        this.node.active = true;

        if (this.winState) {
            this.winState.active = true;
        }

        if (this.loseState) {
            this.loseState.active = false;
        }
    }

    showLose() {
        this.node.active = true;

        if (this.winState) {
            this.winState.active = false;
        }

        if (this.loseState) {
            this.loseState.active = true;
        }
    }

    onRestartClick() {
        if (!this.mainLevelConfig) {
            return;
        }

        this.restartWithCurrentLevel();
    }

    onNextClick() {
        if (!this.mainLevelConfig) {
            return;
        }

        const levels = this.mainLevelConfig.levels;

        if (!levels || levels.length === 0) {
            return;
        }

        const currentIndex = this.mainLevelConfig.currentLevelIndex;
        const nextIndex = currentIndex + 1;

        if (nextIndex < 0 || nextIndex >= levels.length) {
            return;
        }

        this.mainLevelConfig.currentLevelIndex = nextIndex;
        this.restartWithCurrentLevel();
    }

    private restartWithCurrentLevel() {
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

