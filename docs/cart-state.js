import { makeStream } from '../src/koh-js/stream'

const saved = JSON.parse(localStorage.getItem('koh-cart') || '{"items":[]}')
export const cartState = makeStream(saved)

cartState.subscribe(state => {
    localStorage.setItem('koh-cart', JSON.stringify(state))
})
