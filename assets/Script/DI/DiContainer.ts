export default class DiContainer {
    private static instanceValue: DiContainer = new DiContainer();

    private services: Map<string, unknown> = new Map();

    static get instance(): DiContainer {
        return DiContainer.instanceValue;
    }

    register<T>(token: string, instance: T): void {
        this.services.set(token, instance);
    }

    resolve<T>(token: string): T {
        return this.services.get(token);
    }

    has(token: string): boolean {
        return this.services.has(token);
    }
}

