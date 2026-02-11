import INoMovesResolver from "./INoMovesResolver";

export default class ShuffleNoMovesResolver implements INoMovesResolver {
    private usedCount: number = 0;
    private readonly maxShuffles: number;

    constructor(maxShuffles: number = 3) {
        this.maxShuffles = maxShuffles >= 0 ? maxShuffles : 0;
    }

    tryResolve(shuffle: (onComplete: () => void) => void, onShuffleComplete?: () => void): boolean {
        if (this.usedCount >= this.maxShuffles) {
            return false;
        }

        this.usedCount++;
        shuffle(onShuffleComplete || (() => {}));
        return true;
    }
}
