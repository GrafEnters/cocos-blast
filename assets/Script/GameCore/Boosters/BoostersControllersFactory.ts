import {BoosterConfig} from "../../Config/BoosterConfig";
import IGameController from "../IGameController";
import BoostersPanelView from "../../UI/BoostersPanelView";
import BoosterButtonView from "../../UI/BoosterButtonView";
import BombBoosterController from "./BombBoosterController";
import TeleportBoosterController from "./TeleportBoosterController";
import DiContainer from "../../DI/DiContainer";
import DiTokens from "../../DI/DiTokens";
import IBoosterController from "./IBoosterController";
import { BoosterIds } from "../Constants/GameConstants";

export default class BoostersControllersFactory {
    createControllers(
        configs: BoosterConfig[],
        buttons: { [id: string]: BoosterButtonView },
        panelView: BoostersPanelView,
        gameCore: IGameController
    ): void {
        const panelNode = panelView.node;
        const container = DiContainer.instance;

        for (const key in buttons) {
            let controller: IBoosterController;
            let token: string;
            switch (key) {
                case BoosterIds.BOMB:
                    controller = new BombBoosterController();
                    token = DiTokens.BombBooster;
                    break;
                case BoosterIds.TELEPORT:
                    controller = new TeleportBoosterController();
                    token = DiTokens.TeleportBooster;
                    break;
                default:
                    throw new Error(`Not identified booster ${key}`);
            }
            controller.init(
                panelView.activeBoosterOverlay,
                panelView.activeBoosterHintLabel,
                panelNode,
                gameCore,
                configs.find(c => c.id === key),
                buttons[key].node
            );
            container.register(token, controller);
        }
    }
}

