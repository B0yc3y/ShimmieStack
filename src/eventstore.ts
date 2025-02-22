//
// Send events to the database, and tell anyone who is litenening about it
//

import { EventEmitter } from 'events'
import Event, { Meta } from './event'
import { IEventBase } from './eventbase'

class EventStoreEmitter extends EventEmitter {}

export interface IEventStore {
    replayAllEvents: () => Promise<number>
    recordEvent: (
        streamId: string,
        eventName: string,
        data: object,
        meta: Meta
    ) => Promise<any>
    subscribe: (type: string, callback: (eventModel: any) => void) => void
    getAllEvents: () => Promise<any>
}

export default function EventStore(eventbase: IEventBase): IEventStore {
    const eventStoreEmitter = new EventStoreEmitter()

    const recordEvent = async (
        streamId: string,
        eventName: string,
        data: object,
        meta: Meta
    ) => {
        if (!streamId || !eventName || !meta) {
            console.error(
                'EventStore::recorEvent::missing values',
                streamId,
                eventName,
                meta
            )
            throw new Error('Attempt to record bad event data')
        }
        const event = new Event(streamId, eventName, data, meta)
        const rows = await eventbase.addEvent(event) // need to await here to confirm before emitting

        eventStoreEmitter.emit(eventName, event)
        return rows[0]
    }

    const subscribe = (
        type: string,
        callback: (eventModel: any) => void
    ): void => {
        eventStoreEmitter.on(type, callback)
    }

    const getAllEvents = () => {
        return eventbase.getAllEventsInOrder()
    }

    // On startup only re-emit all of the events in the database
    const replayAllEvents = async (): Promise<number> => {
        const allEvents = await eventbase.getAllEventsInOrder()

        for (let e of allEvents) {
            // WARNING: These are field names from the database and hence are all LOWERCASE
            const event = new Event(e.streamid, e.type, e.data, e.meta)
            eventStoreEmitter.emit(event.type, event)
        }

        return allEvents.length
    }

    return {
        replayAllEvents,
        recordEvent,
        subscribe,
        getAllEvents,
    }
}
