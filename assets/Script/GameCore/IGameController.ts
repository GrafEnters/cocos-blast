import TileInputEventType from "../Input/TileInputEventType";
import TileInputEvent from "../Input/TileInputEvent";
import { BoosterData } from "./Types/BoosterData";

export default interface IGameController {
    init(): void;
    getSupportedEvents(): TileInputEventType[];
    handleEvent(event: TileInputEvent): void;
    getRemainingMoves(): number;
    getScore(): number;
    getTargetScore(): number;
    addMoves(value: number): void;
    isGameEnded(): boolean;
    getCellAtPosition?(worldPos: cc.Vec2): { row: number; col: number } | null;
    useBooster?(boosterId: string, data?: BoosterData, onComplete?: () => void): void;
}



