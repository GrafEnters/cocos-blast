import Tile from "../Tile";

export default interface IBlastGameCoreView {
    playGroupPopAnimation(group: Tile[], onComplete: () => void): void;
}

