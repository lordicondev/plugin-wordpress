import { injectable } from "inversify";

/**
 * Interface for config data.
 */
export interface ConfigDataInterface {
    /**
     * Token for authentication.
     */
    token?: string;

    /**
     * Last used variant.
     */
    variant?: string;
}

/**
 * Interface for config service.
 */
export interface ConfigServiceInterface {
    /**
     * Set config stored in the service.
     * @param config - Data object.
     */
    replaceConfig(config: ConfigDataInterface): void;

    /**
     * Get config value by key.
     * @param key - Config key.
     * @returns - Config value.
     */
    get<K extends keyof ConfigDataInterface>(key: K): ConfigDataInterface[K];

    /**
     * Set config value by key. 
     * @param key - Config key.
     * @param value - Config value.
     */
    set<K extends keyof ConfigDataInterface>(key: K, value: ConfigDataInterface[K]): void;

    /**
     * Reset config data.
     */
    reset(): void;

    /**
     * Save all config data.
     */
    save(): void;
}

/** 
 * Config service.
*/
@injectable()
export class ConfigService implements ConfigServiceInterface {
    private data: ConfigDataInterface = {};


    replaceConfig(config: ConfigDataInterface): void {
        this.data = config;
    }

    get(key: keyof ConfigDataInterface): any {
        return this.data[key];
    }

    set(key: keyof ConfigDataInterface, value: any): void {
        this.data[key] = value;
    }

    reset(): void {
        this.data = {};
    }

    save(): void {
        // console.log('Saving config data:', this.data);
    }
}
