import { Stream } from './stream'

export const fromTimer = delayMs => {
    let timerId = null
    const cleanup = () => {
        if (timerId) {
            clearTimeout(timerId)
            timerId = null
        }
    }
    return new Stream(
        observer => {
            timerId = setTimeout(() => {
                observer.next(true)
                observer.complete()
            }, delayMs)

            return cleanup
        },
        false,
        false
    )
}
