const {ccclass, property} = cc._decorator;

@ccclass
export default class ActiveBoosterOverlay extends cc.Component {

    @property(cc.Label)
    BoosterLabel: cc.Label = null;
}
