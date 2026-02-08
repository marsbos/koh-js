import { island } from './static/koh-js/core'
import { fromValue } from './static/koh-js/stream'
island('hello-island', k => {
    const count$ = fromValue(0)

    // Automatically update the span text whenever the stream changes
    k.sync('span', count$)

    // Listen for clicks and increment or decrement the stream
    k.on('[name="increment"]', 'click', () => {
        count$.next(c => c + 1)
    })
    k.on('[name="decrement"]', 'click', () => {
        count$.next(c => c - 1)
    })
})
