export const makeOn = k => (selector, event, handler) => {
    const el = k._findEl(selector, 'on')
    el.addEventListener(event, handler)
    k._onDispose(() => el.removeEventListener(event, handler))
}
