# 🏝️ Koh.js

### Reactive islands for static and server-rendered HTML

_Bring static HTML to life with reactive islands_

**Koh.js** is a **tiny, reactive JavaScript library** for building fast, modular, and SSR-friendly UIs. It’s designed for **islands architecture**, **reactive streams**, and **optional DOM helpers**, making it ideal for **static HTML**, **e-commerce platforms (like Magento)**, or any environment where performance and simplicity matter.

---

## Features

- **Define custom HTML tags** as your `interactive islands`

- **Reactive streams** for state management _(fromValue, fromFetch, etc.)_

- **DOM helpers**: _sync, foreach, show, hide, on, qs, qsa_

- **Automatic lifecycle**: subscriptions clean up when the island is removed

- **Operators**: map, filter, debounce, tap, startWith

- **Tiny footprint**: core 2.3kb, streams 3kb, operators <1kb

- **SSR-friendly**: works `directly` on static HTML without hydration

- **Zero dependencies**: batteries are included

- **Pause & resume any stream**  
  Streams can be paused and resumed at any time — without state drift.  
  Time never owns state; streams do.

### Why pause/resume works correctly

In Koh.js, time-based producers never own state.
They emit transformations (`c => c + 1`), not values.

This means:

- pausing stops emissions
- resuming continues from the last known state
- elapsed time never causes unexpected jumps

---

## Demo / Examples

You can check out live examples and demos in the [Docs folder](./docs) or via GitHub Pages:

[🏝️ Live Demos](https://marsbos.github.io/koh-js/)

## Installation

### 1. Via npm

```bash
npm install koh-js
```

```js
import { island, fromFetch, map } from 'koh-js'

island('my-island', k => {
    const data$ = fromFetch('/api/data')
    k.sync('span', data$)
})
```

### 2. Direct HTML usage

Copy the `dist/` folder into your public/static folder:

```
public/
└─ js/
   └─ koh-js/
      ├─ core/index.js
      ├─ stream/index.js
      ├─ operators/index.js
      └─ index.js
      └─ index.d.ts
```

Then import in your HTML:

```html
<script type="module">
    import { island, fromValue } from './js/koh-js/dist/index.js'

    island('my-island', k => {
        const count$ = fromValue(0)
        k.sync('span', count$)
    })
</script>
```

## How it works

**Koh.js** works by enhancing existing HTML using small, isolated reactive components called `islands`.

First, you define a custom HTML tag in your markup, for example `<hello-island>`. This tag can contain any valid HTML and is rendered normally by the server or browser.

Next, you import Koh.js and register the island by calling `island('hello-island', k => { ... })`.
The name must match the HTML tag. When the element appears in the DOM, Koh.js activates it and runs the callback.

The callback argument `k` is your entire island API. Everything related to state, DOM updates, events, and lifecycle lives on this object:

1. `k.sync()` binds a stream to an element’s text, attribute, or a custom update function

2. `k.foreach()` renders and updates lists using efficient key reconciliation

3. `k.show()` and `k.hide()` toggle element visibility reactively

4. `k.on()` attaches event listeners that are automatically cleaned up

5. `k.subscribe()` allows manual stream subscriptions when needed

Inside the island callback, you work with **streams and operators** to model all reactive state, asynchronous data, and side effects. Streams can come from user input, timers, fetch requests, or static values, and can be transformed using operators like `map`, `filter`, `debounce`, and `tap`.

Each `island` is a self-contained unit, meaning it has its own state, event listeners, and subscriptions, and does not share anything implicitly with other islands on the page.

This makes islands safe to render multiple times on the same page without coordination or shared global state.

Koh.js automatically manages the **lifecycle** of each island. When an island is removed from the DOM, all internal subscriptions, event listeners, and effects are cleaned up automatically. There is no hydration, no virtual DOM, and no manual teardown required.

This makes Koh.js ideal for **server-rendered HTML**, static sites, and e-commerce platforms like **Magento**, where you want to progressively enhance existing markup with minimal JavaScript.

## Example: Reactive Counter

```html
<counter-island>
    <span>0</span>
    <button name="inc">+</button>
    <button name="dec">-</button>

    <script type="module">
        import { island } from './static/koh-js/core'
        import { fromValue } from './static/koh-js/stream'

        island('counter-island', k => {
            const count$ = fromValue(0)
            k.sync('span', count$)
            k.on('[name="inc"]', 'click', () => count$.next(c => c + 1))
            k.on('[name="dec"]', 'click', () => count$.next(c => c - 1))
        })
    </script>
</counter-island>
```

- Multiple islands can exist on the same page independently.

- No bundler or build step is required.

## Advanced Example: Pagination with (from)Fetch

```html
<fetch-island>
    <ul id="users" class="flex flex-col gap-2 mx-auto w-md"></ul>

    <div id="buttons" class="mt-3 flex gap-2 justify-center"></div>

    <script type="module">
        import { island } from './static/koh-js/core'
        import {
            fromEvent,
            fromValue,
            fromInterval,
            fromFetch,
            fromMerge,
        } from './static/koh-js/stream'
        import { map, debounce, startWith, tap, filter } from './static/koh-js/operators'

        island('fetch-island', k => {
            const loading$ = fromValue(false)

            const users$ = fromFetch(`https://dummyjson.com/users`, {}, { limit: 10, skip: 0 })

            const userData$ = users$.pipe(
                filter(data => data?.users?.length > 0),
                map(val => val?.users)
            )

            const pagination$ = users$.pipe(
                map(data => {
                    const { total, skip, limit } = data
                    const totalPages = Math.round(total / limit)
                    const currentPage = skip < limit ? 1 : (skip + limit) / limit

                    return { currentPage, totalPages, pageSize: limit }
                })
            )

            k.foreach('#users', {
                stream: userData$,
                key: u => u.id,
                render: u => {
                    const li = document.createElement('li')
                    li.innerHTML = `${u.firstName} ${u.lastName}`

                    return li
                },
            })

            k.foreach('#buttons', {
                stream: pagination$.pipe(
                    map(({ totalPages }) => {
                        return Array.from({ length: totalPages }, (_, i) => ({
                            id: i,
                        }))
                    })
                ),
                key: u => u.id,
                render: itm => {
                    const btn = document.createElement('button')
                    btn.innerHTML = `${itm.id}`
                    k.on(btn, 'click', () => {
                        users$.next(({ url, baseUrl, params }) => ({
                            params: { skip: itm.id * params.limit },
                        }))
                    })
                    return btn
                },
            })

            k.sync(
                '#buttons',
                pagination$.pipe(filter(page => page.totalPages > 0)),
                (el, page) => {
                    const buttons = k.qsa('button', el)
                    const { currentPage, totalPages } = page
                    const windowSize = 2
                    const realIdx = currentPage - 1

                    const windowStart = Math.max(realIdx - windowSize, 1)
                    const windowEnd = Math.min(realIdx + windowSize, totalPages - 2)

                    buttons.forEach((btn, idx) => {
                        btn.classList.remove('active')
                        btn.hidden = false

                        // Active page
                        if (idx === realIdx) btn.classList.add('active')

                        // Always show first & last
                        if (idx === 0 || idx === totalPages - 1) {
                            btn.hidden = false
                            btn.textContent = (idx + 1).toString()
                            return
                        }

                        // Window pages
                        if (idx >= windowStart && idx <= windowEnd) {
                            btn.textContent = (idx + 1).toString()
                            btn.hidden = false
                            return
                        }
                        // Ellipsis
                        if (idx === windowStart - 1 || idx === windowEnd + 1) {
                            btn.textContent = '...'
                            btn.hidden = false
                            return
                        }

                        // Rest
                        btn.hidden = true
                    })
                }
            )
        })
    </script>
</fetch-island>
```

- Handles **dynamic buttons, fetching new pages**, and **windowed pagination** reactively.

- Uses **fromFetch + .next()** API to update the stream automatically.

## API Overview

### Core / Island API

The core of Koh.js revolves around islands: isolated, reactive components bound to custom HTML elements.

- **`island(name, callback)`** – Register an island  
  Registers a reactive island bound to a custom HTML tag.  
  The callback runs when the element appears in the DOM and receives the island context `k`.

- **`k.sync(selector, stream, attrOrFn?)`** – Bind stream to DOM  
  Synchronizes a stream with an element’s text content, attribute, or a custom update function.  
  Updates automatically when the stream emits a new value.

- **`k.foreach(target, config)`** – Render reactive lists  
  Renders an array-stream into the DOM using keyed reconciliation.  
  Only changed items are added, updated, or removed.

- **`k.on(selector, event, handler)`** – Event binding  
  Attaches an event listener scoped to the island.  
  Automatically removed when the island is destroyed.

- **`k.show(selector, stream)`** – Reactive visibility (show)  
  Shows the element when the stream value is truthy by toggling the `hidden` attribute.

- **`k.hide(selector, stream)`** – Reactive visibility (hide)  
  Hides the element when the stream value is truthy by toggling the `hidden` attribute.

- **`k.subscribe(stream, subscriber, immediate?)`** – Manual subscription  
  Subscribes to a stream with automatic cleanup when the island is removed. The recommended way to use streams within **Koh.js**.
  Useful for side effects or advanced use cases.

- **`k.qs(selector, scope?)`** – Scoped querySelector  
  Finds a single element, default scoped to the island root.

- **`k.qsa(selector, scope?)`** – Scoped querySelectorAll  
  Finds multiple elements, default scoped to the island root.

### Streams

Streams are the core reactive primitive in Koh.js. A stream represents a value that changes over time and can be observed, transformed, and composed.

_All streams can be paused and resumed_ using `.pause()` or `.resume()`

- **`Stream<T>`** – Reactive container  
  Holds the current value and notifies subscribers when it changes.  
  Supports functional updates (`next(curr => next)`), object identity comparison (`Object.is`), and operator chaining via `pipe()`.

- **`fromFetch(baseUrl, opts?, params?)`** – Reactive fetch stream  
  Creates a fetch-backed stream with internal state and automatic request cancellation.  
  Calling `.next()` updates the URL, parameters, or options and aborts any in-flight request.  
  Ideal for pagination, filtering, and server-driven UI.

- **`fromEvent(target, event, options?)`** – Event stream  
  Emits DOM, window, or document events as a stream.  
  Supports optional `requestAnimationFrame` throttling and immediate emission.

- **`fromValue(initialValue)`** – Static reactive value  
  Creates a stream from a single initial value.  
  Useful for local UI state such as counters, toggles, or flags.

- **`fromInterval(delayMs)`** – Interval-based stream  
  Emits an incrementing number at a fixed interval.  
  Commonly used for polling, timers, or repeated actions.

- **`fromTimer(delayMs)`** – One-shot timer  
  Emits `true` once after the specified delay and then completes.

- **`fromMerge(...streams)`** – Combined stream  
  Merges multiple streams into a single stream emitting an array of their latest values.  
  Useful when deriving state from multiple independent sources.

### Operators

Operators transform or control stream values and are applied using `.pipe()` on a source stream. _Pipe()_ creates a new stream you can subscribe to.

- **`map(fn)`** – Transform values  
  Maps each emitted value to a new value. Supports async functions.

- **`filter(predicate)`** – Conditional propagation  
   Only allows values through that satisfy the predicate.

- **`debounce(ms)`** – Emission control  
   Delays emissions until values stop changing for the specified duration.  
   Commonly used for search inputs or resize events.

- **`tap(fn)`** – Side effects  
  Executes a side effect without modifying the stream value.  
  Useful for logging, debugging, or analytics, etc.

- **`startWith(value)`** – Initial emission  
  Forces the stream to emit a predefined value before any other emissions.

## Quick Reference

A compact overview of the most common Koh.js patterns.

**Create an island**

```js
island('my-island', k => {
    // logic
})
```

**Create state**

```js
const count$ = fromValue(0)
```

**Update state**

```js
count$.next(v => v + 1)
//or
count$.next(10)
```

**Bind state to DOM**

_There are multiple ways to let your DOM elements sync with your stream changes_

```js
// Uses textContent as default:

k.sync('span', count$)
```

```js
// Just alter the element

k.sync('span', count$, (element, value) => {
    if (value > 10) {
        element.classList.toggle('...')
    }
})
```

```js
// Return an object with attributes that will be assigned to the DOM element

k.sync('span', count$, (element, value) => ({
    className: value < 4 ? 'myClass' : '',
    hidden: value > 2,
    textContent: value,
}))
```

**Handle events**

_Simple event handling:_

```js
k.on('button', 'click', () => count$.next(c => c + 1))
```

```js
k.on('#query', 'input', e => search$.next(e.target.value))
```

_Advanced:_

```js
const query$ = fromEvent('#query', 'input').pipe(debounce(4000))

// query$ is a stream
```

**Fetch data**

```js
const data$ = fromFetch('/api/items')
```

**Update fetch parameters**

```js
data$.next(({ params }) => ({
    params: { ...params, page: 2 },
}))
```

**Transform streams**

```js
const filtered$ = data$.pipe(
    filter(Boolean),
    map(v => v.items)
)
```

**Render lists**

```js
k.foreach('#list', {
    stream: items$,
    key: item => item.id,
    render: item => {
        const el = document.createElement('li')
        el.textContent = item.name
        return el
    },
})
```

**Combine streams**

```js
const combined$ = fromMerge(a$, b$)
```

_**Automatic cleanup**_

_All subscriptions, event listeners, and effects are `cleaned up automatically` when the island is removed from the DOM._

## Usage in Magento / Static HTML

Koh.js is designed to work directly on server-rendered or static HTML.  
No bundler, hydration, or build step is required.

#### 1. Install Koh.js

Install via npm (recommended), or download the `dist/` folder manually.

```bash
npm install koh-js
```

#### 2. Copy to your public/static folder

In Magento or any static setup, copy the compiled files to a publicly accessible folder.

Example (Magento theme):

```
pub/static/js/koh-js/
├─ core/index.js
├─ stream/index.js
├─ operators/index.js
```

#### 3. Use Koh.js directly in HTML

Koh.js works using native ES modules and `<script type="module">`.

```html
<hello-island>
    <span>0</span>
    <button name="inc">+</button>

    <script type="module">
        import { island } from '/static/js/koh-js/core/index.js'
        import { fromValue } from '/static/js/koh-js/stream/index.js'

        island('hello-island', k => {
            const count$ = fromValue(0)
            k.sync('span', count$)
            k.on('[name="inc"]', 'click', () => count$.next(c => c + 1))
        })
    </script>
</hello-island>
```

#### 4. Reuse islands via modules

Island logic can be defined once and reused across multiple HTML instances or within the same HTML file.

```html
<hello-island>
    <span>0</span>
    <button name="inc">+</button>
    <script type="module">
        import '/static/js/hello-island.js'
    </script>
</hello-island>
```

```js
// hello-island.js
import { island } from '/static/js/koh-js/core/index.js'
import { fromValue } from '/static/js/koh-js/stream/index.js'

island('hello-island', k => {
    const count$ = fromValue(0)
    k.sync('span', count$)
    k.on('[name="inc"]', 'click', () => count$.next(c => c + 1))
})
```

#### 5. Multiple islands on the same page

Each island instance is fully isolated.
You can place the same island multiple times on a page without shared state.

```html
<hello-island>...</hello-island>
<hello-island>...</hello-island>
```

#### Why this works well in Magento

- Works `directly` on SSR HTML
- No hydration or virtual DOM
- No global state
- No framework lock-in
- Progressive enhancement friendly
- Matches how Magento themes already load JavaScript

Koh.js fits naturally into Magento, Shopify, and other server-rendered platforms.

## Philosophy

Koh.js is not a full SPA framework.

It does not aim to replace React, Vue, or similar libraries.
Instead, it focuses on enhancing existing server-rendered or static HTML with small, isolated, reactive islands.

_No build step._
_No compilation._
_No hydration._
_No virtual DOM._
_No global state._

## Author

Created and maintained by **Marcel Bos**.

- GitHub: https://github.com/marsbos

## License

MIT © Marcel Bos
