export const makeForEach =
    k =>
    (target, { stream, key: keyFn, tpl, render }) => {
        const el = k._findEl(target, 'foreach')
        const currentItems = new Map()

        k.subscribe(stream, list => {
            if (!Array.isArray(list)) return

            const newKeys = new Set(list.map(itm => keyFn(itm)))

            for (const [key, node] of currentItems) {
                if (!newKeys.has(key)) {
                    // remove
                    node.remove()
                    currentItems.delete(key)
                }
            }
            let nextNode = el.firstChild
            list.forEach(itm => {
                const key = keyFn(itm)
                let node = currentItems.get(key)
                if (!node) {
                    // render?
                    if (render) {
                        node = render(itm)
                    } else if (tpl) {
                        //template?
                        const template = el.querySelector(tpl)
                        const clone = template.cloneNode(true)
                        clone.removeAttribute('data-template')
                        clone.removeAttribute('hidden')
                        clone.setData(itm)
                        node = clone
                    }
                    if (!node) {
                        k._throwError('foreach', `could not create node`)
                    }
                    currentItems.set(key, node)
                }
                if (!node.isConnected || node !== nextNode) {
                    el.insertBefore(node, nextNode)
                }
                nextNode = node.nextSibling
            })
        })
    }
