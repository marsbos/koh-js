export const startWith = startValue => {
    let first = true
    return async value => {
        if (first) {
            first = false
            return startValue
        }
        return value
    }
}
