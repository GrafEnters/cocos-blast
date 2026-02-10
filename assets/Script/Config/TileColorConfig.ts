const { ccclass, property } = cc._decorator;

@ccclass
export default class TileColorConfig extends cc.Component {

    @property([cc.String])
    keys: string[] = [];

    @property([cc.SpriteFrame])
    sprites: cc.SpriteFrame[] = [];

    @property(cc.SpriteFrame)
    defaultSprite: cc.SpriteFrame = null;

    getSprite(key: string): cc.SpriteFrame {
        const index = this.keys.indexOf(key);

        if (index >= 0 && index < this.sprites.length) {
            const sprite = this.sprites[index];

            if (sprite) {
                return sprite;
            }
        }

        return this.defaultSprite;
    }
}

