import { makeHelpers } from '../utils/index'

class KohIsland extends HTMLElement {
    constructor(mod) {
        super()
        this.islandModule = mod
        this._mounted = false
        this._disposers = []
        this._delegated = {}
    }

    _dispose() {
        for (const fn of this._disposers) {
            fn?.()
        }
        this._disposers = []
    }

    _onDispose(fn) {
        this._disposers.push(fn)
    }

    _throwError(method, msg) {
        throw new Error(`[k.${method}] on <${this.tagName.toLowerCase()}>: ${msg}`)
    }

    _findEl(target, src) {
        const el = this.qs(target)
        if (!el) {
            this._throwError(src, `${target} not found!`)
        }
        return el
    }

    // API:
    qs(selector, scope = this) {
        return typeof selector === 'string' ? scope.querySelector(selector) : selector
    }
    qsa(selector, scope = this) {
        const nodes = scope.querySelectorAll(selector)
        return [...nodes]
    }

    subscribe(stream, subscriber, immediate = false) {
        if (!('subscribe' in stream)) {
            throw new Error('argument is not a Stream instance!')
        }
        let unsubscribe = stream.subscribe(subscriber, immediate)
        this._onDispose(unsubscribe)
        return unsubscribe
    }

    island(k) {}

    setData(value) {
        this.initialData = value
        return this
    }
    // END API

    connectedCallback() {
        if (this._mounted) return
        this._mounted = true
        this.islandModule({
            initialData: this.initialData,
            qs: this.qs.bind(this),
            qsa: this.qsa.bind(this),
            subscribe: this.subscribe.bind(this),
            island: this.island.bind(this),
            ...makeHelpers(this),
        })
    }

    disconnectedCallback() {
        queueMicrotask(() => {
            if (!this.isConnected) {
                this._mounted = false
                this._dispose()
            }
        })
    }
}

export const island = (name, islandModule) => {
    if (customElements.get(name)) {
        return
    }

    const makeModuleClass = mod =>
        class KohModuleClass extends KohIsland {
            constructor() {
                super(mod)
            }

            connectedCallback() {
                if (this.hasAttribute('data-template')) return
                super.connectedCallback()
            }
        }
    customElements.define(name, makeModuleClass(islandModule))
}
