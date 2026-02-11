export default class TileSpriteDictionary {

    private sprites: Map<string, cc.SpriteFrame> = new Map();
    private defaultSprite: cc.SpriteFrame | null = null;

    constructor(defaultSprite?: cc.SpriteFrame | null) {
        this.defaultSprite = defaultSprite || null;
    }

    register(key: string, sprite: cc.SpriteFrame | null): void {
        if (!key || !sprite) {
            return;
        }
        const trimmed = key.trim();
        if (!trimmed) {
            return;
        }
        this.sprites.set(trimmed, sprite);
    }

    get(key: string | null | undefined): cc.SpriteFrame | null {
        if (!key) {
            return this.defaultSprite;
        }
        const trimmed = key.trim();
        if (!trimmed) {
            return this.defaultSprite;
        }
        const sprite = this.sprites.get(trimmed);
        if (sprite) {
            return sprite;
        }
        return this.defaultSprite;
    }

    setDefaultSprite(sprite: cc.SpriteFrame | null): void {
        this.defaultSprite = sprite || null;
    }

    getDefaultSprite(): cc.SpriteFrame | null {
        return this.defaultSprite;
    }
}

