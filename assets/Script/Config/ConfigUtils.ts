export async function LoadConfigsFromDir<T>(path: string): Promise<T[]> {
    const assets = await new Promise<cc.JsonAsset[]>((resolve, reject) => {
        cc.resources.loadDir(path, cc.JsonAsset, (err, list: cc.JsonAsset[]) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(list || []);
        });
    });
    const result: T[] = [];
    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        if (!asset) {
            continue;
        }
        result.push(asset.json as T);
    }
    return result;
}
