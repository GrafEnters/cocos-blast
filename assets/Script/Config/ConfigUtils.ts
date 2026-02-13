export function ParseConfig<T extends object>(jsonString: string, requiredKeys: (keyof T)[]): T {
    let raw: unknown;
    try {
        raw = JSON.parse(jsonString);
    } catch (e) {
        throw new Error(`ConfigUtils.ParseConfig: invalid JSON - ${e instanceof Error ? e.message : String(e)}`);
    }
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
        throw new Error("ConfigUtils.ParseConfig: expected a JSON object");
    }
    const obj = raw as Record<string, unknown>;
    const missing: string[] = [];
    for (const key of requiredKeys) {
        const k = key as string;
        if (!(k in obj) || obj[k] === undefined) {
            missing.push(k);
        }
    }
    if (missing.length > 0) {
        throw new Error(`ConfigUtils.ParseConfig: missing required fields: ${missing.join(", ")}`);
    }
    return raw as T;
}

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
