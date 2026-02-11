const { ccclass, property } = cc._decorator;

import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";
import BoostersConfig from "../Config/BoostersConfig";
import PlayerProfile from "../PlayerProfile";

@ccclass
export default class BoosterButtonView extends cc.Component {

    @property
    boosterId: string = "";

    @property(cc.Sprite)
    iconSprite: cc.Sprite = null;

    @property(cc.Label)
    countLabel: cc.Label = null;

    private currentCount: number = 0;
    private boostersConfig: BoostersConfig = null;
    private profile: PlayerProfile = null;

    onLoad() {
        this.resolveBoostersConfig();
        this.resolveProfile();
    }

    initFromConfig(boosterId: string): void {
        this.boosterId = boosterId || "";
        this.resolveBoostersConfig();
        this.resolveProfile();
        this.applyConfig();
    }

    private resolveBoostersConfig() {
        const container = DiContainer.instance;
        if (!container.has(DiTokens.BoostersConfig)) {
            return;
        }
        this.boostersConfig = container.resolve<BoostersConfig>(DiTokens.BoostersConfig);
    }

    private resolveProfile() {
        const container = DiContainer.instance;
        if (!container.has(DiTokens.PlayerProfile)) {
            return;
        }
        this.profile = container.resolve<PlayerProfile>(DiTokens.PlayerProfile);
    }

    private applyConfig() {
        if (!this.boosterId) {
            this.updateView();
            return;
        }
        if (this.boostersConfig) {
            const cfg = this.boostersConfig.getBoosterConfig(this.boosterId);
            if (cfg) {
                const iconPath = cfg.boosterIcon;
                if (typeof iconPath === "string" && iconPath.trim().length > 0 && this.iconSprite) {
                    const path = iconPath.trim();
                    cc.resources.load(path, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
                        if (err) {
                            return;
                        }
                        if (!this.iconSprite || !this.iconSprite.node || !this.iconSprite.node.isValid) {
                            return;
                        }
                        this.iconSprite.spriteFrame = spriteFrame;
                    });
                }
            }
        }

        if (this.profile) {
            this.currentCount = this.profile.getBoosterCount(this.boosterId);
        }

        this.updateView();
    }

    private updateView() {
        if (this.countLabel) {
            this.countLabel.string = this.currentCount > 0 ? this.currentCount.toString() : "0";
        }
        const button = this.getComponent(cc.Button);
        const isActive = this.currentCount > 0;
        if (button) {
            button.interactable = isActive;
        }
        if (this.node) {
            this.node.opacity = isActive ? 255 : 140;
        }
    }

    canUse(): boolean {
        return this.currentCount > 0;
    }

    consume(): boolean {
        if (!this.canUse()) {
            this.updateView();
            return false;
        }
        this.currentCount--;
        if (this.profile) {
            this.profile.setBoosterCount(this.boosterId, this.currentCount);
        }
        this.updateView();
        return true;
    }
}

