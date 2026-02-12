import IGameController from "../GameCore/IGameController";
import Tile from "../Tile";
import BoosterButtonView from "./BoosterButtonView";

export default class TeleportBoosterController {
    private overlay: cc.Node = null;
    private hintLabel: cc.Node = null;
    private boostersPanel: cc.Node = null;
    private gameCore: IGameController = null;
    private teleportButton: cc.Node = null;
    private buttonView: BoosterButtonView = null;
    private active: boolean = false;
    private teleportInProgress: boolean = false;
    private firstTile: Tile = null;

    init(
        overlay: cc.Node,
        hintLabel: cc.Node,
        boostersPanel: cc.Node,
        gameCore: IGameController,
        teleportButton: cc.Node
    ): void {
        this.overlay = overlay;
        this.hintLabel = hintLabel;
        this.boostersPanel = boostersPanel;
        this.gameCore = gameCore;
        this.teleportButton = teleportButton;

        if (this.overlay) {
            this.overlay.active = false;
            this.overlay.on(cc.Node.EventType.TOUCH_END, this.onOverlayTouch, this);
        }

        if (this.hintLabel) {
            this.hintLabel.active = false;
        }

        if (this.teleportButton) {
            this.teleportButton.on(cc.Node.EventType.TOUCH_END, this.onTeleportButtonClick, this);
            this.buttonView = this.teleportButton.getComponent(BoosterButtonView);
        }
    }

    private onTeleportButtonClick(): void {
        if (this.active) {
            return;
        }
        if (this.buttonView && !this.buttonView.canUse()) {
            return;
        }
        this.enterTeleportMode();
    }

    private enterTeleportMode(): void {
        this.active = true;
        this.firstTile = null;
        this.teleportInProgress = false;
        this.overlay.active = true;
        if (this.hintLabel) {
            const label = this.hintLabel.getComponent(cc.Label);
            if (label) {
                label.string = "выберите первый тайл";
            }
            this.hintLabel.active = true;
        }
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

    private exitTeleportMode(): void {
        this.active = false;
        this.firstTile = null;
        this.teleportInProgress = false;
        if (this.overlay) {
            this.overlay.active = false;
        }
        if (this.hintLabel) {
            this.hintLabel.active = false;
        }
        if (this.boostersPanel && !this.isGameEnded()) {
            this.boostersPanel.active = true;
        }
    }

    private onOverlayTouch(evt: cc.Event.EventTouch): void {
        if (!this.active) {
            return;
        }
        if (this.teleportInProgress) {
            return;
        }
        this.exitTeleportMode();
    }

    handleTileTap(tile: Tile): boolean {
        if (!this.active) {
            return false;
        }
        if (this.teleportInProgress) {
            return true;
        }
        if (!tile) {
            return true;
        }
        if (!this.firstTile) {
            this.firstTile = tile;
            if (this.hintLabel) {
                const label = this.hintLabel.getComponent(cc.Label);
                if (label) {
                    label.string = "выберите второй тайл";
                }
            }
            return true;
        }
        if (this.firstTile.row === tile.row && this.firstTile.col === tile.col) {
            this.exitTeleportMode();
            return true;
        }
        if (!this.gameCore || !this.gameCore.useBooster) {
            this.exitTeleportMode();
            return true;
        }
        if (this.hintLabel) {
            this.hintLabel.active = false;
        }
        const fromTile = this.firstTile;
        this.firstTile = null;
        this.teleportInProgress = true;
        this.gameCore.useBooster("teleport", {
            fromRow: fromTile.row,
            fromCol: fromTile.col,
            toRow: tile.row,
            toCol: tile.col,
            preAnimation: async (fieldView: any, animationView: any) => {
                if (!fieldView) {
                    return;
                }
                const first = fieldView.getTile(fromTile.row, fromTile.col);
                const second = fieldView.getTile(tile.row, tile.col);
                if (!first || !second || !first.node || !second.node) {
                    return;
                }
                const firstPos = first.node.position.clone ? first.node.position.clone() : cc.v3(first.node.x, first.node.y, first.node.z);
                const secondPos = second.node.position.clone ? second.node.position.clone() : cc.v3(second.node.x, second.node.y, second.node.z);
                
                await Promise.all([
                    new Promise<void>((resolve) => {
                        cc.tween(first.node)
                            .to(0.25, { position: secondPos })
                            .call(() => resolve())
                            .start();
                    }),
                    new Promise<void>((resolve) => {
                        cc.tween(second.node)
                            .to(0.25, { position: firstPos })
                            .call(() => resolve())
                            .start();
                    })
                ]);
            }
        }, () => {
            if (this.buttonView) {
                this.buttonView.consume();
            }
            this.teleportInProgress = false;
            this.exitTeleportMode();
        });
        return true;
    }
}

