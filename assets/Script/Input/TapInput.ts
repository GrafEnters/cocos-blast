import IInput from "./IInput";
import Tile from "../Tile";
import TileInputEventType from "../GameCore/TileInputEventType";
import TileInputEvent from "../GameCore/TileInputEvent";
import IGameCore from "../GameCore/IGameCore";
import DiContainer from "../DI/DiContainer";
import DiTokens from "../DI/DiTokens";
import BombBoosterController from "../UI/BombBoosterController";

export default class TapInput implements IInput {

    private gameCore: IGameCore;
    private bombBooster: BombBoosterController = null;

    constructor(gameCore: IGameCore) {
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

    handleTileTap(tile: Tile): void {
        const supportedCoreEvents = this.gameCore.getSupportedEvents();

        if (supportedCoreEvents.indexOf(TileInputEventType.Tap) === -1) {
            return;
        }

        this.resolveBombBooster();
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

