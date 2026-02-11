import ISupertileExtension from "./ISupertileExtension";

export default class SupertileExtensionFactory {
    private extensions: ISupertileExtension[] = [];

    constructor(extensions?: ISupertileExtension[]) {
        if (extensions && extensions.length > 0) {
            this.extensions = extensions.slice();
        }
    }

    register(extension: ISupertileExtension): void {
        if (!extension) {
            return;
        }
        if (this.extensions.indexOf(extension) >= 0) {
            return;
        }
        this.extensions.push(extension);
    }

    get(id: string): ISupertileExtension | null {
        if (!id) {
            return null;
        }
        const trimmed = id.trim();
        if (!trimmed) {
            return null;
        }
        for (let i = 0; i < this.extensions.length; i++) {
            const ext = this.extensions[i];
            if (!ext || !ext.id) {
                continue;
            }
            if (ext.id === trimmed) {
                return ext;
            }
        }
        return null;
    }
}

