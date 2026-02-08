import { Stream } from './stream'

export const fromMerge = (...streams) => {
    const merged$ = new Stream(null, null, false)

    const values = []
    const subscriber = idx => value => {
        values[idx] = value
        merged$.next([...values])
    }
    const unsubs = streams.reduce((memo, stream, idx) => {
        return [...memo, stream.subscribe(subscriber(idx))]
    }, [])

    // override merged$.subscribe for cleanup
    const originalSubscribe = merged$.subscribe.bind(merged$)
    merged$.subscribe = fn => {
        const subscription = originalSubscribe(fn)
        return () => {
            // cleanup dev subscription
            subscription()
            // cleanup internal subscribers
            unsubs.forEach(u => {
                u()
            })
        }
    }
    return merged$
}
