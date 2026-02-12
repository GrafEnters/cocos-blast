export default interface IGameUi {
    init(): void;
    getRootNode():cc.Node;
    setMoves(value: number): void;
    setScore(score: number, target: number): void;
    win(): void;
    lose(): void;
}

