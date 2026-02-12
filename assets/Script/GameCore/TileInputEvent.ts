import Tile from "../Tile";
import TileInputEventType from "./TileInputEventType";

type TileInputEvent = {
    type: TileInputEventType;
    tile: Tile;
    targetTile?: Tile;
    direction?: cc.Vec2;
    boosterId?: string;
    boosterData?: any;
    onComplete?: () => void;
};

export default TileInputEvent;

