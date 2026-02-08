import { Stream } from './stream'

const makeQs = params => {
    let qs = []
    if (params && typeof params === 'object') {
        for (const [key, val] of Object.entries(params)) {
            qs.push(`${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
        }
    }
    return qs.length ? qs.join('&') : ''
}

export const fromFetch = (baseUrl, opts = {}, params = {}) => {
    let controller

    const stream = new Stream(null, { params, baseUrl, url: baseUrl, options: opts }, true)
    const fetchStream = stream.pipe(async ({ params, url, options }, skip) => {
        controller?.abort()
        controller = new AbortController()

        try {
            const fullQs = makeQs(params)
            const res = await fetch(fullQs ? `${url}?${fullQs}` : url, {
                ...options,
                signal: controller.signal,
            })

            return await res.json()
        } catch (e) {
            if (e.name === 'AbortError') return skip()
            stream.error(e)
            return skip()
        }
    })

    return {
        pipe: fetchStream.pipe.bind(fetchStream),
        subscribe(subscriber) {
            return fetchStream.subscribe(subscriber)
        },
        next(value) {
            let url = ''
            let options = stream.get()?.options ?? {}
            let params = stream.get()?.params ?? {}

            const assign = val => {
                if (typeof val === 'object') {
                    url = val.url ?? baseUrl
                    options = val?.options ?? options
                    params = val?.params ? { ...params, ...val.params } : params
                } else if (typeof val === 'string') {
                    url = val
                }
            }
            if (typeof value === 'function') {
                const currValue = stream.get()
                assign(value(currValue))
            } else {
                assign(value)
            }
            stream.next({ params, baseUrl, url, options })
        },
    }
}
