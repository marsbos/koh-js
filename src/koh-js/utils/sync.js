export const makeSync =
    k =>
    (selector, stream, attrOrFn = 'textContent') => {
        const el = k._findEl(selector, 'sync')
        k.subscribe(
            stream,
            value => {
                if (typeof attrOrFn === 'function') {
                    const obj = attrOrFn(el, value)
                    if (obj && typeof obj === 'object') {
                        Object.entries(obj).forEach(([k, v]) => (el[k] = v))
                    }
                } else {
                    el[attrOrFn] = value
                }
            },
            true
        )
    }
