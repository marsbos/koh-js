export const filter = predicate => async (value, skip) => {
    const result = await predicate(value)
    if (result) {
        return value
    }
    return skip()
}
