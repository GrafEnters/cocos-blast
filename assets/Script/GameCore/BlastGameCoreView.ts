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

    playBombBurnAnimation(node: cc.Node, duration: number, onComplete: () => void): void {
        if (!node || !node.isValid) {
            onComplete();
            return;
        }
        const amount = 3;
        const baseX = node.x;
        const baseY = node.y;
        const interval = 80;
        let sign = 1;
        const id = setInterval(() => {
            if (!node.isValid) {
                clearInterval(id);
                onComplete();
                return;
            }
            node.x = baseX + sign * amount;
            sign = -sign;
        }, interval);
        setTimeout(() => {
            clearInterval(id);
            if (node.isValid) {
                node.setPosition(baseX, baseY);
            }
            onComplete();
        }, duration * 1000);
    }
}

