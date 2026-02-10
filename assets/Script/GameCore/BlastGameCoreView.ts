import Tile from "../Tile";
import IAnimationView from "./IAnimationView";

export default class BlastGameCoreView implements IAnimationView {
    playGroupRemoveAnimation(group: Tile[], onComplete: () => void): void {
        if (!group || group.length === 0) {
            onComplete();
            return;
        }

        let completed = 0;
        const total = group.length;

        const onTileComplete = () => {
            completed++;
            if (completed >= total) {
                onComplete();
            }
        };

        for (let i = 0; i < group.length; i++) {
            const tile = group[i];
            if (!tile || !tile.node || !tile.node.isValid) {
                onTileComplete();
                continue;
            }

            tile.node.scale = 1;

            cc.tween(tile.node)
                .to(0.08, { scale: 1.15 })
                .to(0.08, { scale: 0 })
                .call(onTileComplete)
                .start();
        }
    }
}

