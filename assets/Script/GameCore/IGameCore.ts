import TileInputEventType from "./TileInputEventType";
import TileInputEvent from "./TileInputEvent";

export default interface IGameCore {
    init(): void;
    getSupportedEvents(): TileInputEventType[];
    handleEvent(event: TileInputEvent): void;
    getRemainingMoves(): number;
}



