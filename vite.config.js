import { defineConfig } from 'vite'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    root: '.',
    plugins: [tailwindcss()],
    resolve: {
        alias: {
            'koh-js/operators': resolve(__dirname, 'src/koh/operators.js'),
            'koh-js': resolve(__dirname, 'src/koh/index.js'),
        },
    },
    server: {
        open: '/examples/index.html',
    },
})
