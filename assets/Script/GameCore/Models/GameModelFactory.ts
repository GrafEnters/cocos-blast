import IGameModel from "./IGameModel";
import BlastGameModel from "./BlastGameModel";
import SupertileExtensionFactory from "../Supertiles/SupertileExtensionFactory";
import BoosterExtensionFactory from "../Boosters/BoosterExtensionFactory";
import RocketHSupertileExtension from "../Supertiles/RocketHSupertileExtension";
import RocketVSupertileExtension from "../Supertiles/RocketVSupertileExtension";
import DynamiteSupertileExtension from "../Supertiles/DynamiteSupertileExtension";
import DynamiteMaxSupertileExtension from "../Supertiles/DynamiteMaxSupertileExtension";
import BombBoosterExtension from "../Boosters/BombBoosterExtension";
import TeleportBoosterExtension from "../Boosters/TeleportBoosterExtension";
import SupertilesConfigList from "../../Config/SupertilesConfigList";
import BoostersConfigList from "../../Config/BoostersConfigList";
import DiContainer from "../../DI/DiContainer";
import type { DynamiteSupertileConfig } from "../../Config/DynamiteSupertileConfig";
import {LevelConfig} from "../../Config/LevelConfig";
import { SupertileIds, BoosterIds } from "../Constants/GameConstants";

export default class GameModelFactory {
    private container: DiContainer;

    constructor(container: DiContainer) {
        this.container = container;
    }

    create(levelConfig: LevelConfig, superTilesConfig: SupertilesConfigList, boostersConfig: BoostersConfigList): IGameModel {
        const model = new BlastGameModel(levelConfig.rows, levelConfig.cols, levelConfig.colors, levelConfig.moves, levelConfig.targetScore);

        model.setSuperTileGenerationCallback((size: number) => {
            return superTilesConfig.getSuperTileTypeForSize(size);
        });

        const extensionFactory = new SupertileExtensionFactory();
        extensionFactory.register(new RocketHSupertileExtension(superTilesConfig.getSuperTileConfig(SupertileIds.ROCKET_H)));
        extensionFactory.register(new RocketVSupertileExtension(superTilesConfig.getSuperTileConfig(SupertileIds.ROCKET_V)));
        const dynamiteConfig = superTilesConfig.getSuperTileConfig(SupertileIds.DYNAMITE);
        if (!dynamiteConfig || typeof dynamiteConfig !== "object" || !("radius" in dynamiteConfig)) {
            throw new Error("DynamiteSupertileConfig is required");
        }
        extensionFactory.register(new DynamiteSupertileExtension(dynamiteConfig as DynamiteSupertileConfig));
        extensionFactory.register(new DynamiteMaxSupertileExtension(superTilesConfig.getSuperTileConfig(SupertileIds.DYNAMITE_MAX)));
        model.setSuperTileExtensionFactory(extensionFactory);


        const boosterExtensionFactory = new BoosterExtensionFactory();
        boosterExtensionFactory.register(new BombBoosterExtension(boostersConfig.getBoosterConfig(BoosterIds.BOMB)));
        boosterExtensionFactory.register(new TeleportBoosterExtension(boostersConfig.getBoosterConfig(BoosterIds.TELEPORT)));

        model.setBoosterExtensionFactory(boosterExtensionFactory);

        return model;
    }
}
