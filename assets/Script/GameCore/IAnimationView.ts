import Tile from "../Tile";
import { GameEventResult } from "./IGameModel";
import IFieldView from "./IFieldView";

export default interface IAnimationView {
    playGroupRemoveAnimation(group: Tile[], onComplete: () => void): void;
    playBombBurnAnimation?(node: cc.Node, duration: number, onComplete: () => void): void;
    playEventAnimations(eventResult: GameEventResult, fieldView: IFieldView, onComplete: () => void): void;
}

