import Tile from "../Tile";

export default interface IAnimationView {
    playGroupRemoveAnimation(group: Tile[], onComplete: () => void): void;
}

