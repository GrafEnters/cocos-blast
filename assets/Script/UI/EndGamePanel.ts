const { ccclass, property } = cc._decorator;
import LevelsConfigList from "../Config/LevelsConfigList";
import PlayerProfile from "../PlayerProfile";
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";

@ccclass
export default class EndGamePanel extends cc.Component {

    @property(cc.Node)
    winState: cc.Node = null;

    @property(cc.Node)
    loseState: cc.Node = null;

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
        this.restartWithCurrentLevel();
    }

    onNextClick() {
        if (!DiContainer.instance.has(DiTokens.PlayerProfile)) {
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

