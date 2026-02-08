// @ts-ignore
import esbuild from 'esbuild'
import fs from 'fs'
import { execSync } from 'child_process'

const distPath = './dist'
const examplesStaticPath = './docs/static/koh-js'

// 1. Cleanup dist
if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true })
}
fs.mkdirSync(distPath, { recursive: true })

console.log('🧹 Dist folder clean...')

// 2. Format
try {
    console.log('✨ Formatting code...')
    execSync('npm run format', { stdio: 'inherit' })
} catch (error) {
    console.warn('⚠️ Prettier warning: build will continue.')
}

// 3. Build
const commonConfig = {
    entryPoints: [
        { in: 'src/koh-js/core/index.js', out: 'core/index' },
        { in: 'src/koh-js/operators/index.js', out: 'operators/index' },
        { in: 'src/koh-js/stream/index.js', out: 'stream/index' },
        { in: 'src/koh-js/index.js', out: 'index' },
    ],
    bundle: true,
    minify: true,
    treeShaking: true,
    target: 'es2022',
    format: 'esm',
    legalComments: 'none',
    sourcemap: false,
    outdir: 'dist',
    splitting: false,
    logLevel: 'info',
}

esbuild
    .build(commonConfig)
    .then(() => {
        console.log('⚡ Koh JS build complete!')

        // --- NIEUW: Kopieer Type Definitions ---
        console.log('📘 Copying type definitions...')
        const types = [
            { src: 'src/koh-js/index.d.ts', dest: 'dist/index.d.ts' },
            { src: 'src/koh-js/core/index.d.ts', dest: 'dist/core/index.d.ts' },
            { src: 'src/koh-js/operators/index.d.ts', dest: 'dist/operators/index.d.ts' },
            { src: 'src/koh-js/stream/index.d.ts', dest: 'dist/stream/index.d.ts' },
        ]

        types.forEach(type => {
            if (fs.existsSync(type.src)) {
                fs.copyFileSync(type.src, type.dest)
            } else {
                console.warn(`⚠️ Warning: Type file not found: ${type.src}`)
            }
        })

        // 4. Copy dist → examples/static/koh-js
        if (fs.existsSync(examplesStaticPath)) {
            fs.rmSync(examplesStaticPath, { recursive: true, force: true })
        }

        fs.mkdirSync(examplesStaticPath, { recursive: true })

        fs.cpSync(distPath, examplesStaticPath, {
            recursive: true,
        })

        console.log('📦 Copied build (including types) to docs/static/koh-js')
    })
    .catch(err => {
        console.error('❌ Build failed:', err)
        process.exit(1)
    })
