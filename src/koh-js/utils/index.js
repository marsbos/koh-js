import { makeHide } from './hide'
import { makeForEach } from './foreach'
import { makeOn } from './on'
import { makeShow } from './show'
import { makeSync } from './sync'

export const makeHelpers = k => ({
    foreach: makeForEach(k),
    hide: makeHide(k),
    on: makeOn(k),
    show: makeShow(k),
    sync: makeSync(k),
})
