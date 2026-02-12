import IInput from "./IInput";
import Tile from "../Tile";
import TileInputEventType from "./TileInputEventType";
import TileInputEvent from "./TileInputEvent";
import IGameController from "../GameCore/IGameController";
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";
import BombBoosterController from "../UI/BombBoosterController";
import TeleportBoosterController from "../UI/TeleportBoosterController";

export default class TapInput implements IInput {

    private gameCore: IGameController;
    private bombBooster: BombBoosterController = null;
    private teleportBooster: TeleportBoosterController = null;

    constructor(gameCore: IGameController) {
        this.gameCore = gameCore;
    }

    init(): void {
    }

    getSupportedEvents(): TileInputEventType[] {
        return [TileInputEventType.Tap];
    }

    private resolveBombBooster(): void {
        if (this.bombBooster) {
            return;
        }
        const container = DiContainer.instance;
        if (!container.has(DiTokens.BombBooster)) {
            return;
        }
        this.bombBooster = container.resolve<BombBoosterController>(DiTokens.BombBooster);
    }

    private resolveTeleportBooster(): void {
        if (this.teleportBooster) {
            return;
        }
        const container = DiContainer.instance;
        if (!container.has(DiTokens.TeleportBooster)) {
            return;
        }
        this.teleportBooster = container.resolve<TeleportBoosterController>(DiTokens.TeleportBooster);
    }

    handleTileTap(tile: Tile): void {
        const supportedCoreEvents = this.gameCore.getSupportedEvents();

        if (supportedCoreEvents.indexOf(TileInputEventType.Tap) === -1) {
            return;
        }

        this.resolveBombBooster();
        this.resolveTeleportBooster();
        if (this.teleportBooster && this.teleportBooster.handleTileTap(tile)) {
            return;
        }
        if (this.bombBooster && this.bombBooster.handleTileTap(tile)) {
            return;
        }

        const event: TileInputEvent = {
            type: TileInputEventType.Tap,
            tile: tile,
        };

        this.gameCore.handleEvent(event);
    }
}

