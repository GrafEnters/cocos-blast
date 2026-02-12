import {BoosterConfig} from "../Config/BoosterConfig";
import IGameController from "../GameCore/IGameController";
import Tile from "../Tile";

export default interface IBoosterController {
    init(
        overlay: cc.Node,
        hintLabel: cc.Node,
        boostersPanel: cc.Node,
        gameCore: IGameController,
        config: BoosterConfig,
        buttonNode: cc.Node
    ): void;

    handleTileTap(tile: Tile): boolean;
}
