import Tile from "../../Tile";
import { GameEventResult } from "../Models/IGameModel";
import IFieldView from "../IFieldView";

export default interface IAnimationView {
    playGroupRemoveAnimation(group: Tile[]): Promise<void>;
    playBombBurnAnimation?(node: cc.Node, duration: number): Promise<void>;
    playEventAnimations(eventResult: GameEventResult, fieldView: IFieldView): Promise<void>;
}

