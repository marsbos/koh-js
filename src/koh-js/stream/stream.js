const SKIP = Symbol('stream.skip')
export class Stream {
    constructor(observer, value, initialNotify = true) {
        this.observer = observer
        this.internalValue = value
        this.subscribers = new Set()
        this.initialNotify = initialNotify
        this.queue = new Set()
        this.hasPendingUpdates = false

        this.paused = false
    }

    _processQueue() {
        this.hasPendingUpdates = false
        if (this.paused) return
        this.queue.forEach(sub => sub.next?.(this.get()))
        this.queue.clear()
    }

    get() {
        return this.internalValue
    }

    cleanup() {
        this.destroyFn?.()
        this.subscribers.clear()
        this.observerCalled = false
        this.paused = false
        this.pendingUpdate = undefined
    }

    subscribe(subscriber, immediate = false) {
        let { next, error, complete, pause, resume } = subscriber
        if (!next) {
            if (typeof subscriber === 'function') next = subscriber
        }
        if (!error) {
            error = () => {}
        }
        if (!complete) {
            complete = () => {}
        }
        if (!pause) {
            pause = () => {}
        }
        if (!resume) {
            resume = () => {}
        }
        const subscriberObj = { next, error, complete, pause, resume }

        this.subscribers.add(subscriberObj)
        if (!this.observerCalled && this.observer) {
            this.observerCalled = true
            this.destroyFn = this.observer({
                next: this.next.bind(this),
                error: this.error.bind(this),
                complete: this.complete.bind(this),
                pause: this.pause.bind(this),
                resume: this.resume.bind(this),
            })
        }
        if (this.initialNotify || immediate) subscriberObj.next?.(this.internalValue)

        return () => {
            this.subscribers.delete(subscriberObj)
            if (this.subscribers.size < 1) {
                this.destroyFn?.()
            }
        }
    }

    _batch() {
        this.subscribers.forEach(subscriber => {
            this.queue.add(subscriber)
            if (!this.hasPendingUpdates) {
                this.hasPendingUpdates = true
                queueMicrotask(this._processQueue.bind(this))
            }
        })
    }
    error(err) {
        this.subscribers.forEach(subscriber => {
            subscriber.error(err)
        })
    }

    pause() {
        this.paused = true
        this.subscribers.forEach(sub => sub.pause())
    }

    resume() {
        if (!this.paused) return
        this.paused = false
        this.subscribers.forEach(sub => sub.resume())
    }

    complete() {
        this.subscribers.forEach(subscriber => {
            subscriber.complete()
        })
        this.cleanup()
    }
    next(value) {
        if (this.paused) {
            return
        }
        let newValue = value
        const currValue = this.get()
        if (typeof value === 'function') {
            newValue = value(currValue)
        }
        if (!(value instanceof Node) && Object.is(newValue, this.internalValue)) {
            return
        }
        this.internalValue = newValue
        this._batch()
    }

    pipe(...fns) {
        return new Stream(
            obs => {
                const unsub = this.subscribe({
                    async next(value) {
                        let v = value
                        try {
                            for (const fn of fns) {
                                v = await fn(v, () => SKIP)
                                if (v === SKIP) {
                                    return
                                }
                            }
                            obs.next(v)
                        } catch (err) {
                            console.error('Stream operator error:', err)
                            obs.error(err)
                        }
                    },
                    error(err) {
                        console.error('Stream operator error from source stream!:', err)
                        obs.error(err)
                    },
                    complete() {
                        obs.complete()
                    },
                    pause() {
                        obs.pause()
                    },
                    resume() {
                        obs.resume()
                    },
                })
                return () => {
                    unsub()
                }
            },
            this.get(),
            false
        )
    }
}
