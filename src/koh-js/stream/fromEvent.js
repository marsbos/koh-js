import { Stream } from './stream'

export const fromEvent = (target, event, { raf = false, immediate = false, ...opts } = {}) => {
    return new Stream(
        observer => {
            let rafId = null
            const handler = e => {
                if (raf) {
                    if (rafId) {
                        return
                    }
                    rafId = requestAnimationFrame(() => {
                        observer.next(e)
                        rafId = null
                    })
                } else {
                    observer.next(e)
                }
            }

            target.addEventListener(event, handler, opts)

            return () => {
                if (rafId) {
                    cancelAnimationFrame(rafId)
                    rafId = null
                }
                target.removeEventListener(event, handler, opts)
            }
        },
        null,
        immediate
    )
}
