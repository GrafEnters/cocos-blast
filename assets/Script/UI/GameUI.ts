const {ccclass, property} = cc._decorator;
import TopPanelView from "./TopPanelView";
import EndGamePanel from "./EndGamePanel";
import BoostersPanelView from "./BoostersPanelView";
import ActiveBoosterOverlay from "./ActiveBoosterOverlay";
import IGameUi from "./IGameUi";

@ccclass
export default class GameUI extends cc.Component implements IGameUi {

    @property(TopPanelView)
    topPanelView: TopPanelView = null;

    @property(EndGamePanel)
    endGamePanel: EndGamePanel = null;

    @property(BoostersPanelView)
    boostersPanel: BoostersPanelView = null;

    @property(ActiveBoosterOverlay)
    activeBoosterOverlay: ActiveBoosterOverlay = null;

    @property(cc.Node)
    gameRoot: cc.Node = null;


    init(): void {
        this.gameRoot.active = true;
        this.boostersPanel.node.active = true;
        this.topPanelView.setActive(true);
        this.endGamePanel.node.active = false;
        this.gameRoot.removeAllChildren();
    }
    getRootNode(): cc.Node {
        return this.gameRoot;
    }

    setMoves(value: number): void {
        this.topPanelView.setMoves(value);
    }

    setScore(score: number, target: number): void {
        this.topPanelView.setPoints(score, target);
    }

    win(): void {
        this.gameRoot.active = false;
        this.boostersPanel.node.active = false;
        this.topPanelView.setActive(false);
        this.endGamePanel.node.active = true;
        this.endGamePanel.showWin();
    }

    lose(): void {
        this.gameRoot.active = false;
        this.boostersPanel.node.active = false;
        this.topPanelView.setActive(false);
        this.endGamePanel.node.active = true;
        this.endGamePanel.showLose();
    }
}
