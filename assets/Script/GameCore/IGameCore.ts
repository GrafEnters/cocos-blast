import TileInputEventType from "./TileInputEventType";
import TileInputEvent from "./TileInputEvent";

export default interface IGameCore {
    init(): void;
    getSupportedEvents(): TileInputEventType[];
    handleEvent(event: TileInputEvent): void;
    getRemainingMoves(): number;
    getScore(): number;
    getTargetScore(): number;
    addMoves(value: number): void;
    getCellAtPosition?(worldPos: cc.Vec2): { row: number; col: number } | null;
    useBooster?(boosterId: string, data?: any, onComplete?: () => void): void;
}



