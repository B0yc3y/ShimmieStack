import { CorsOptions } from "cors";
import { Router } from "express";
import { EventData, EventHandler, EventName, IMeta, StreamId } from "./event";

export interface IStackConfig {
    EventbaseURL: string;
    ServerPort: number;
    CORS?: CorsOptions;
}

export interface IStackType {
    setApiVersion(version: string): IStackType;
    router(): Router;
    recordEvent(
        streamdId: StreamId,
        eventName: EventName,
        eventData: EventData,
        meta: IMeta
    ): void;
    startup(): void;
    restart(): void;
    shutdown(): void;
    registerModel<T>(name: string, model: T): void;
    getModel<T>(name: string): T;
    mountProcessor(
        name: string,
        mountPoint: string,
        router: Router
    ): IStackType;
    subscribe(eventName: EventName, handler: EventHandler): void;
    use(a: any): any;
    configure(stackConfig: IStackConfig): IStackType
};