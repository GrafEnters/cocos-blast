import IInput from "./IInput";
import Tile from "../Tile";
import TileInputEventType from "../GameCore/TileInputEventType";
import TileInputEvent from "../GameCore/TileInputEvent";
import IGameCore from "../GameCore/IGameCore";

export default class TapInput implements IInput {

    private gameCore: IGameCore;

    constructor(gameCore: IGameCore) {
        this.gameCore = gameCore;
    }

    init(): void {
    }

    getSupportedEvents(): TileInputEventType[] {
        return [TileInputEventType.Tap];
    }

    handleTileTap(tile: Tile): void {
        const supportedCoreEvents = this.gameCore.getSupportedEvents();

        if (supportedCoreEvents.indexOf(TileInputEventType.Tap) === -1) {
            return;
        }

        const event: TileInputEvent = {
            type: TileInputEventType.Tap,
            tile: tile,
        };

        this.gameCore.handleEvent(event);
    }
}

