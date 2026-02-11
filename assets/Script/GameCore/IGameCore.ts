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
    applyBombAt?(row: number, col: number, bombSpriteFrame: cc.SpriteFrame, onComplete: () => void): void;
    applyTeleport?(fromRow: number, fromCol: number, toRow: number, toCol: number, onComplete: () => void): void;
}



