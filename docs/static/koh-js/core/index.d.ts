import { Stream, Unsubscribe, Subscriber } from '../stream/index'

/** Helpers available inside an island */
export interface IslandHelpers {
    sync: <T>(
        selector: string | HTMLElement,
        stream: Stream<T>,
        attrOrFn?: string | ((el: HTMLElement, value: T) => Record<string, any> | void)
    ) => void

    foreach: <T>(
        target: string | HTMLElement,
        config: {
            stream: Stream<T[]>
            key: (item: T) => string | number
            tpl?: string
            render?: (item: T) => HTMLElement
        }
    ) => void

    on<K extends keyof HTMLElementEventMap>(
        selector: string | HTMLElement,
        event: K,
        handler: (e: HTMLElementEventMap[K]) => void
    ): void

    show: (selector: string | HTMLElement, stream: Stream<any>) => void
    hide: (selector: string | HTMLElement, stream: Stream<any>) => void
}

/** Island context with generic initialData typing */
export interface IslandContext<T = any> extends IslandHelpers {
    initialData: T
    qs: (
        selector: string | HTMLElement,
        scope?: HTMLElement | DocumentFragment
    ) => HTMLElement | null
    qsa: (selector: string, scope?: HTMLElement | DocumentFragment) => HTMLElement[]
    subscribe: <U>(
        stream: Stream<U>,
        subscriber: Subscriber<U> | ((value: U) => void),
        immediate?: boolean
    ) => Unsubscribe
}

export function island<T = any>(name: string, islandModule: (k: IslandContext<T>) => void): void
