export default interface INoMovesResolver {
    tryResolve(shuffle: (onComplete: () => void) => void, onShuffleComplete?: () => void): boolean;
}
