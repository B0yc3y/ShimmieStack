// testing a new naming scheme. Replace IEvent if we like this one better. Easier

import cors from "cors";
import { Router, Express } from "express";
import eventBase, { IEventBase } from "../eventbase";
import eventStore, { IEventStore } from "../eventStore";
import { EventHandler, IMeta, ShimmieEvent } from "./event";
import { IStackConfig, IStackType } from "./stack";
import AdminProcessor from "../admin_processor"
import { startApiListener } from "../index";
import { ShimmieRoutes } from "../shimmieRoutes";

export default class ShimmieStack implements IStackType {
    private readonly ADMIN_PROCESSOR_NAME = 'Administration API';
    private readonly ADMIN_ROUTE = '/admin';

    private config: IStackConfig;
    private apiVersion = 'v1';
    private modelStore: Record<string, any> = {};
    private app: Express
    private eventBase: IEventBase
    private eventStore: IEventStore

    public constructor(
        app: Express,
        config: IStackConfig,
    ) {
        this.app = app;
        this.configure(config);
    };

    public setApiVersion(version: string): IStackType {
        this.apiVersion = version;
        return this;
    };

    public router(): Router {
        return Router();
    };

    public async recordEvent(streamdId: string, eventName: string, eventData: any, meta: IMeta): Promise<ShimmieEvent> {
        return this.eventStore.recordEvent(streamdId, eventName, eventData, meta)
    };

    public async startup(): Promise<ShimmieStack> {
        try {
            console.info('ShimmieStack Start up sequence initiated.');
            console.info('ShimmieStack Environment:', process.env.NODE_ENV);
            console.info('ShimmieStack Config:', this.config);

            ShimmieRoutes.finaliseRoutes(this.app);

            console.info('ShimmieStack: All processors mounted');

            // Get the database started
            await this.eventBase.connect();
            await this.eventBase.createTables();

            console.info('ShimmieStack: database connected.');

            // Process the entire event history on start up and load into memory
            console.info(`ShimmieStack: Starting to replay the entire event stream to rebuild memory models`);

            const numEvents = await this.eventStore.replayAllEvents();
            console.info(`ShimmieStack: replayed ${numEvents} events`);

            // Start accepting requests from the outside world
            startApiListener(this.app, this.config.ServerPort);

            console.info('ShimmieStack: Start up complete');
            return this;

        } catch (err) {
            // log and rethrow
            console.error(`ShimmieStack1 Error during start up, aborting: ( ${err} )`);
            throw err;
        }
    };

    public restart(): void {
        throw new Error("Method not implemented.");
    };

    public shutdown(): void {
        throw new Error("Method not implemented.");
    };

    public registerModel<T>(name: string, model: T): void {
        this.modelStore[name] = model;
    };

    public getModel<T>(name: string): T {
        const model = this.modelStore[name];
        if (!model) {
            throw new Error('No registered model found: ' + name);
        }

        return model;
    };

    public mountProcessor(name: string, mountPoint: string, router: Router): IStackType {
        ShimmieRoutes.mountApi(
            this.app,
            name,
            mountPoint,
            router
        );

        return this;
    };

    public subscribe(eventName: string, handler: EventHandler): void {
        console.log('ShimmieStack: Registering event handler: ', eventName);
        this.eventStore.subscribe(eventName, handler);
    };

    public use(handler: any): void {
        this.app.use(handler);
    };


    public configure(config: IStackConfig): ShimmieStack {
        this.config = config;

        // Setup cors
        this.app.use(cors(config.CORS));

        // setup the event base
        this.eventBase = eventBase(config.EventbaseURL);

        // setup the event store
        this.eventStore = eventStore(this.eventBase);

        // Setup Middleware
        ShimmieRoutes.setupMiddleware(this.app);

        // Setup Admin API
        ShimmieRoutes.mountApi(
            this.app,
            this.ADMIN_PROCESSOR_NAME,
            this.ADMIN_ROUTE,
            AdminProcessor(this.eventStore, this.eventBase)
        );

        return this;
    };
};
