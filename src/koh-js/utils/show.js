export const makeShow = k => (selector, stream) => {
    const el = k._findEl(selector, 'show')
    k.subscribe(stream, val => {
        el.hidden = !Boolean(val)
    })
}
