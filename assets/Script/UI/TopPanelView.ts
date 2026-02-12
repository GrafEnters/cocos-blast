const {ccclass, property} = cc._decorator;

@ccclass
export default class TopPanelView extends cc.Component {

    @property(cc.Label)
    private movesCounter: cc.Label = null;

    @property(cc.Label)
    private pointsCounter: cc.Label = null;

    public setActive(isOn: boolean): void {
        this.node.active = isOn;
    }

    setMoves(value: number): void {
        this.movesCounter.string = `${value}`;
    }

    setPoints(score: number, target: number): void {
        this.pointsCounter.string = `${score}/${target}`;
    }
}
