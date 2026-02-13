const { ccclass, property } = cc._decorator;
import LevelsConfigList from "../Config/MainLevelConfig";
import PlayerProfile from "../PlayerProfile";
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";

@ccclass
export default class EndGamePanel extends cc.Component {

    @property(cc.Node)
    winState: cc.Node = null;

    @property(cc.Node)
    loseState: cc.Node = null;

    @property(LevelsConfigList)
    mainLevelConfig: LevelsConfigList = null;

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

        if (!DiContainer.instance.has(DiTokens.PlayerProfile)) {
            return;
        }

        const levels = this.mainLevelConfig.getConfigs();

        if (!levels || levels.length === 0) {
            return;
        }

        const profile = DiContainer.instance.resolve<PlayerProfile>(DiTokens.PlayerProfile);
        const currentIndex = profile.getCurrentLevelIndex();
        const nextIndex = (currentIndex + 1) % levels.length;
        profile.setCurrentLevelIndex(nextIndex);
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

