import Tile from "../../Tile";
import IAnimationView from "./IAnimationView";
import { GameEventResult } from "../Models/IGameModel";
import IFieldView from "../IFieldView";

export default class BlastAnimationView implements IAnimationView {
    async playGroupRemoveAnimation(group: Tile[]): Promise<void> {
        if (!group || group.length === 0) {
            return;
        }

        const promises: Promise<void>[] = [];

        for (let i = 0; i < group.length; i++) {
            const tile = group[i];
            if (!tile || !tile.node || !tile.node.isValid) {
                continue;
            }

            const promise = new Promise<void>((resolve) => {
                tile.node.scale = 1;

                cc.tween(tile.node)
                    .to(0.08, { scale: 1.15 })
                    .to(0.08, { scale: 0 })
                    .call(() => resolve())
                    .start();
            });

            promises.push(promise);
        }

        await Promise.all(promises);
    }

    async playBombBurnAnimation(node: cc.Node, duration: number): Promise<void> {
        if (!node || !node.isValid) {
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
                return;
            }
            node.x = baseX + sign * amount;
            sign = -sign;
        }, interval);
        
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                clearInterval(id);
                if (node.isValid) {
                    node.setPosition(baseX, baseY);
                }
                resolve();
            }, duration * 1000);
        });
    }

    async playEventAnimations(eventResult: GameEventResult, fieldView: IFieldView): Promise<void> {
        if (eventResult.preAnimation) {
            await eventResult.preAnimation(fieldView, this);
        }

        const tilesToPop = this.collectTilesToPop(eventResult.stepResult.removed, fieldView);
        if (tilesToPop.length === 0) {
            return;
        }

        const animationSteps = eventResult.animationSteps || [];
        if (animationSteps.length > 0) {
            const groupedSteps = this.groupAnimationStepsByDepth(animationSteps, fieldView);
            if (groupedSteps.length > 0) {
                await this.playGroupedAnimations(groupedSteps);
                return;
            }
        }

        await this.playGroupRemoveAnimation(tilesToPop);
    }

    private collectTilesToPop(removedCells: { row: number; col: number }[], fieldView: IFieldView): Tile[] {
        const tilesToPop: Tile[] = [];
        for (let i = 0; i < removedCells.length; i++) {
            const cell = removedCells[i];
            const visualTile = fieldView.getTile(cell.row, cell.col);
            if (visualTile) {
                tilesToPop.push(visualTile);
            }
        }
        return tilesToPop;
    }

    private groupAnimationStepsByDepth(animationSteps: GameAnimationStep[], fieldView: IFieldView): Tile[][] {
        const steps: Tile[][] = [];
        const used: { [key: string]: boolean } = {};
        const depths = this.extractUniqueDepths(animationSteps);

        for (let d = 0; d < depths.length; d++) {
            const depth = depths[d];
            const stepTiles = this.collectTilesForDepth(animationSteps, depth, fieldView, used);
            if (stepTiles.length > 0) {
                steps.push(stepTiles);
            }
        }

        return steps;
    }

    private extractUniqueDepths(animationSteps: GameAnimationStep[]): number[] {
        const depthsUsed: { [key: string]: boolean } = {};
        const depths: number[] = [];

        for (let i = 0; i < animationSteps.length; i++) {
            const entry = animationSteps[i];
            const depthKey = entry.depth.toString();
            if (!depthsUsed[depthKey]) {
                depthsUsed[depthKey] = true;
                depths.push(entry.depth);
            }
        }

        depths.sort((a, b) => a - b);
        return depths;
    }

    private collectTilesForDepth(
        animationSteps: GameAnimationStep[],
        depth: number,
        fieldView: IFieldView,
        used: { [key: string]: boolean }
    ): Tile[] {
        const stepTiles: Tile[] = [];

        for (let i = 0; i < animationSteps.length; i++) {
            const entry = animationSteps[i];
            if (entry.depth !== depth) {
                continue;
            }

            const stepCells = entry.cells;
            for (let j = 0; j < stepCells.length; j++) {
                const cell = stepCells[j];
                const key = cell.row + "_" + cell.col;
                if (used[key]) {
                    continue;
                }
                const visualTile = fieldView.getTile(cell.row, cell.col);
                if (visualTile) {
                    used[key] = true;
                    stepTiles.push(visualTile);
                }
            }
        }

        return stepTiles;
    }

    private async playGroupedAnimations(groupedSteps: Tile[][]): Promise<void> {
        for (let i = 0; i < groupedSteps.length; i++) {
            await this.playGroupRemoveAnimation(groupedSteps[i]);
        }
    }
}

