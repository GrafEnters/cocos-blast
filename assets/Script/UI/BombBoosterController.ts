import IGameController from "../GameCore/IGameController";
import Tile from "../Tile";
import BoosterButtonView from "./BoosterButtonView";
import IBoosterController from "./IBoosterController";
import {BoosterConfig} from "../Config/BoosterConfig";
import {BombBoosterConfig} from "../Config/BombBoosterConfig";

export default class BombBoosterController implements IBoosterController {
    private overlay: cc.Node = null;
    private hintLabel: cc.Node = null;
    private boostersPanel: cc.Node = null;
    private gameCore: IGameController = null;
    private bombSpriteFrame: cc.SpriteFrame = null;
    private bombButton: cc.Node = null;
    private buttonView: BoosterButtonView = null;
    private active: boolean = false;
    private bombInProgress: boolean = false;

    init(
        overlay: cc.Node,
        hintLabel: cc.Node,
        boostersPanel: cc.Node,
        gameCore: IGameController,
        config: BoosterConfig,
        bombButton: cc.Node
    ): void {
        this.overlay = overlay;
        this.hintLabel = hintLabel;
        this.boostersPanel = boostersPanel;
        this.gameCore = gameCore;
        this.bombButton = bombButton;

        const bombConfig = config as BombBoosterConfig;
        if (!bombConfig) {
            throw new Error(`BombBoosterConfig is incorrect`)
        }

        const path = bombConfig.bombSprite;
        cc.resources.load(path, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
            if (!err && spriteFrame) {
                this.bombSpriteFrame = spriteFrame;
            }
        });


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

    private exitBombMode(): void {
        this.active = false;
        this.overlay.active = false;
        this.hintLabel.active = false;
        if (this.boostersPanel && !this.gameCore.isGameEnded()) {
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
        this.gameCore.useBooster("bomb", {
            row: tile.row,
            col: tile.col,
            bombSpriteFrame: this.bombSpriteFrame,
            preAnimation: async (fieldView: any, animationView: any) => {
                if (!fieldView) {
                    return;
                }
                const centerTile = fieldView.getTile(tile.row, tile.col);
                if (!centerTile || !centerTile.node) {
                    return;
                }
                if (fieldView.setTileBombAppearance && this.bombSpriteFrame) {
                    fieldView.setTileBombAppearance(centerTile, this.bombSpriteFrame);
                }
                if (!animationView || !animationView.playBombBurnAnimation || !this.bombSpriteFrame) {
                    return;
                }
                await animationView.playBombBurnAnimation(centerTile.node, 1.5);
            }
        }, () => {
            if (this.buttonView) {
                this.buttonView.consume();
            }
            this.bombInProgress = false;
            this.exitBombMode();
        });
        return true;
    }
}
