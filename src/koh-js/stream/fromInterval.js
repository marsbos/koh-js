import { Stream } from './stream'

export const fromInterval = delayMs => {
    let timerId = null

    return new Stream(
        observer => {
            timerId = setInterval(() => observer.next(c => c + 1), delayMs)

            return () => {
                if (timerId) {
                    clearInterval(timerId)
                    timerId = null
                }
            }
        },
        0,
        false
    )
}
