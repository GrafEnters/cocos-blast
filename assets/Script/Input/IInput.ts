import Tile from "../Tile";
import TileInputEventType from "../GameCore/TileInputEventType";

export default interface IInput {
    init(): void;
    getSupportedEvents(): TileInputEventType[];
    handleTileTap(tile: Tile): void;
}

