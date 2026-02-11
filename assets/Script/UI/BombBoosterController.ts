import IGameCore from "../GameCore/IGameCore";
import Tile from "../Tile";
import BoosterButtonView from "./BoosterButtonView";

export default class BombBoosterController {
    private overlay: cc.Node = null;
    private hintLabel: cc.Node = null;
    private boostersPanel: cc.Node = null;
    private gameCore: IGameCore = null;
    private bombSpriteFrame: cc.SpriteFrame = null;
    private bombButton: cc.Node = null;
    private buttonView: BoosterButtonView = null;
    private active: boolean = false;
    private bombInProgress: boolean = false;

    init(
        overlay: cc.Node,
        hintLabel: cc.Node,
        boostersPanel: cc.Node,
        gameCore: IGameCore,
        bombSpriteFrame: cc.SpriteFrame,
        bombButton: cc.Node
    ): void {
        this.overlay = overlay;
        this.hintLabel = hintLabel;
        this.boostersPanel = boostersPanel;
        this.gameCore = gameCore;
        this.bombSpriteFrame = bombSpriteFrame;
        this.bombButton = bombButton;

        if (this.overlay) {
            this.overlay.active = false;
            this.overlay.on(cc.Node.EventType.TOUCH_END, this.onOverlayTouch, this);
        }

        if (this.hintLabel) {
            this.hintLabel.active = false;
        }

        if (this.bombButton) {
            this.bombButton.on(cc.Node.EventType.TOUCH_END, this.onBombButtonClick, this);
            this.buttonView = this.bombButton.getComponent(BoosterButtonView);
        }
    }

    private onBombButtonClick(): void {
        if (this.active) {
            return;
        }
        if (this.buttonView && !this.buttonView.canUse()) {
            return;
        }
        this.enterBombMode();
    }

    private enterBombMode(): void {
        this.active = true;
        this.overlay.active = true;
        this.hintLabel.active = true;
        if (this.boostersPanel) {
            this.boostersPanel.active = false;
        }
    }

    private isGameEnded(): boolean {
        if (!this.gameCore) {
            return false;
        }
        const targetScore = this.gameCore.getTargetScore();
        if (targetScore <= 0) {
            return false;
        }
        const score = this.gameCore.getScore();
        const remainingMoves = this.gameCore.getRemainingMoves();
        const isWin = score >= targetScore;
        const isLoseByMoves = remainingMoves <= 0 && score < targetScore;
        return isWin || isLoseByMoves;
    }

    private exitBombMode(): void {
        this.active = false;
        this.overlay.active = false;
        this.hintLabel.active = false;
        if (this.boostersPanel && !this.isGameEnded()) {
            this.boostersPanel.active = true;
        }
    }

    private onOverlayTouch(evt: cc.Event.EventTouch): void {
        if (!this.active) {
            return;
        }
        if (this.bombInProgress) {
            return;
        }
        this.exitBombMode();
    }

    handleTileTap(tile: Tile): boolean {
        if (!this.active) {
            return false;
        }
        if (this.bombInProgress) {
            return true;
        }
        if (!this.gameCore.useBooster || !this.bombSpriteFrame) {
            this.exitBombMode();
            return true;
        }
        if (this.hintLabel) {
            this.hintLabel.active = false;
        }
        this.bombInProgress = true;
        this.gameCore.useBooster("bomb", { row: tile.row, col: tile.col, bombSpriteFrame: this.bombSpriteFrame }, () => {
            if (this.buttonView) {
                this.buttonView.consume();
            }
            this.bombInProgress = false;
            this.exitBombMode();
        });
        return true;
    }
}
