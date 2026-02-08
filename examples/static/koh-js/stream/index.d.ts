export type Unsubscribe = () => void

export interface Subscriber<T> {
    next?: (value: T) => void
    error?: (error: any) => void
    complete?: () => void
}

export type ObserverFn<T> = (obs: {
    next: (value: T | ((curr: T) => T)) => void
    error: (err: any) => void
    complete: () => void
}) => Unsubscribe | void

export class Stream<T> {
    constructor(observer: ObserverFn<T> | null, value: T, initialNotify?: boolean)

    /** Returns the current value of the stream */
    get(): T

    /** Pushes a new value into the stream. Accepts a direct value or a transformation function */
    next(value: T | ((curr: T) => T)): void

    /** Signals an error in the stream */
    error(err: any): void

    /** Closes the stream and triggers cleanup */
    complete(): void

    /** Subscribes to value changes. 'immediate' triggers the callback with the current value instantly */
    subscribe(subscriber: Subscriber<T> | ((value: T) => void), immediate?: boolean): Unsubscribe

    /** Chains operators to transform the stream data */
    pipe<R>(...fns: Array<(value: any, skip: () => any) => R | Promise<R>>): Stream<R>
}

/** Creates a stream from DOM events with optional RAF throttling */
export function fromEvent<K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Window | Document,
    event: K,
    options?: { raf?: boolean; immediate?: boolean } & AddEventListenerOptions
): Stream<HTMLElementEventMap[K]>

/** Creates a fetch-based stream that handles AbortControllers automatically */
export function fromFetch<T = any>(
    baseUrl: string,
    opts?: RequestInit,
    params?: Record<string, any>
): {
    pipe: Stream<T>['pipe']
    subscribe: Stream<T>['subscribe']
    next: (
        value:
            | string
            | { url?: string; params?: Record<string, any>; options?: RequestInit }
            | ((curr: any) => any)
    ) => void
}

/** Emits an incrementing number every 'delayMs' */
export function fromInterval(delayMs: number): Stream<number>

/** Merges multiple streams into one emitting an array of all latest values */
export function fromMerge(...streams: Stream<any>[]): Stream<any[]>

/** Emits 'true' once after a delay and then completes */
export function fromTimer(delayMs: number): Stream<boolean>

/** Creates a static stream from a single value */
export function fromValue<T>(initialValue: T): Stream<T>
