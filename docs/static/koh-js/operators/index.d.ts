export type Operator<T, R> = (value: T, skip: () => any) => R | Promise<R>

/** Delays emissions by 'ms'. Silently skips previous pending values if a new one arrives */
export function debounce<T>(ms: number): Operator<T, T>

/** Only allows values through that pass the predicate test */
export function filter<T>(predicate: (value: T) => boolean | Promise<boolean>): Operator<T, T>

/** Transforms the value into a new form. Supports async transformations */
export function map<T, R>(fn: (value: T) => R | Promise<R>): Operator<T, R>

/** Forces the stream to start with a specific value */
export function startWith<T, S>(startValue: S): Operator<T, T | S>

/** Performs a side-effect (like logging) without modifying the stream value */
export function tap<T>(fn: (value: T) => void): Operator<T, T>
