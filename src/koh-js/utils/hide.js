export const makeHide = k => (selector, stream) => {
    const el = k._findEl(selector, 'hide')
    k.subscribe(stream, val => {
        el.hidden = Boolean(val)
    })
}
