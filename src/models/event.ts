// for users to not be confused with their own event types (eg an event sourced system!)
export type ShimmieEvent = IEvent;
export type EventHandler = (event: IEvent) => void;
export type EventName = string;
export type StreamId = string;
export type EventData = any;

export interface IEvent {
    streamId: StreamId;
    data: EventData;
    type: string;
    meta: IMeta;
};

export interface IMeta {
    username: string;
    userId: string; // can be device id?
};