import { Container } from "inversify";
import { ConfigService, ConfigServiceInterface, HTTPService, HTTPServiceInterface, RenderService, RenderServiceInterface, ToastService, ToastServiceInterface } from "../services";
import { TYPES } from './types';

/**
 * Create a DI container for the application.
 * @returns Container.
 */
function createContainer() {
    const container = new Container();

    container.bind<ConfigServiceInterface>(TYPES.ConfigService).to(ConfigService).inSingletonScope();
    container.bind<RenderServiceInterface>(TYPES.RenderService).to(RenderService).inSingletonScope();
    container.bind<ToastServiceInterface>(TYPES.ToastService).to(ToastService).inSingletonScope();
    container.bind<HTTPServiceInterface>(TYPES.HTTPService).to(HTTPService).inSingletonScope();

    container.bind(TYPES.AJAX).toConstantValue({ url: __LORDICON__.url, nonce: __LORDICON__.nonce });
    container.bind(TYPES.VARIANTS).toConstantValue(__LORDICON__.variants || null);
    container.bind(TYPES.STATUS).toConstantValue(__LORDICON__.status || null);

    return container;
}

export class DI {
    private static instance: DI;

    private container!: Container;

    private constructor() {
        // Create a DI container for the application.
        this.container = createContainer();
    }

    public static getInstance(): DI {
        if (!DI.instance) {
            DI.instance = new DI();
        }

        return DI.instance;
    }

    public static get httpService(): HTTPServiceInterface {
        return DI.getInstance().container.get<HTTPServiceInterface>(TYPES.HTTPService);
    }

    public static get configService(): ConfigServiceInterface {
        return DI.getInstance().container.get<ConfigServiceInterface>(TYPES.ConfigService);
    }

    public static get toastService(): ToastServiceInterface {
        return DI.getInstance().container.get<ToastServiceInterface>(TYPES.ToastService);
    }

    public static get renderService(): RenderServiceInterface {
        return DI.getInstance().container.get<RenderServiceInterface>(TYPES.RenderService);
    }
}
