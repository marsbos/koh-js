import { Stream } from './stream'

export const fromValue = initialValue => new Stream(null, initialValue, true)
