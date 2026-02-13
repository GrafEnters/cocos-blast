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
import SuperTilesConfig from "../../Config/SuperTilesConfig";
import BoostersConfigList from "../../Config/BoostersConfigList";
import DiContainer from "../../DI/DiContainer";
import type { DynamiteSupertileConfig } from "../../Config/DynamiteSupertileConfig";

export default class GameModelFactory {
    private container: DiContainer;

    constructor(container: DiContainer) {
        this.container = container;
    }

    create(rows: number, cols: number, colors: string[], moves: number, targetScore: number, superTilesConfig: SuperTilesConfig, boostersConfig: BoostersConfigList): IGameModel {
        const model = new BlastGameModel(rows, cols, colors, moves, targetScore);

        model.setSuperTileGenerationCallback((size: number) => {
            return superTilesConfig.getSuperTileTypeForSize(size);
        });

        const extensionFactory = new SupertileExtensionFactory();
        extensionFactory.register(new RocketHSupertileExtension(superTilesConfig.getSuperTileConfig("rocketH")));
        extensionFactory.register(new RocketVSupertileExtension(superTilesConfig.getSuperTileConfig("rocketV")));
        const dynamiteConfig = superTilesConfig.getSuperTileConfig("dynamite") as DynamiteSupertileConfig;
        extensionFactory.register(new DynamiteSupertileExtension(dynamiteConfig));
        extensionFactory.register(new DynamiteMaxSupertileExtension(superTilesConfig.getSuperTileConfig("dynamiteMax")));
        model.setSuperTileExtensionFactory(extensionFactory);


        const boosterExtensionFactory = new BoosterExtensionFactory();
        boosterExtensionFactory.register(new BombBoosterExtension(boostersConfig.getBoosterConfig("bomb")));
        boosterExtensionFactory.register(new TeleportBoosterExtension(boostersConfig.getBoosterConfig("teleport")));

        model.setBoosterExtensionFactory(boosterExtensionFactory);

        return model;
    }
}
