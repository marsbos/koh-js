export const debounce = ms => {
    let timerId = undefined
    let prevResolve = undefined
    return (value, skip) => {
        prevResolve?.(skip())
        if (timerId) clearTimeout(timerId)

        return new Promise(resolve => {
            prevResolve = resolve

            timerId = setTimeout(() => {
                resolve(value)
                prevResolve = null
            }, ms)
        })
    }
}
