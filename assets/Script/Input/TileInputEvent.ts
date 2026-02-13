import Tile from "../Tile";
import TileInputEventType from "./TileInputEventType";
import { BoosterData } from "../GameCore/Types/BoosterData";

type TileInputEvent = {
    type: TileInputEventType;
    tile: Tile;
    targetTile?: Tile;
    direction?: cc.Vec2;
    boosterId?: string;
    boosterData?: BoosterData;
    onComplete?: () => void;
};

export default TileInputEvent;

