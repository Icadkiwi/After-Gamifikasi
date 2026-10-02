import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Resolve existing Vite-style TS imports; image URLs are inert in domain tests.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL) {
      const url = new URL(specifier, context.parentURL)
      for (const suffix of ['.ts', '.tsx']) {
        if (existsSync(fileURLToPath(url) + suffix)) return nextResolve(url.href + suffix, context)
      }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (/\.(png|jpg|svg)$/.test(url)) return { format: 'module', source: `export default ${JSON.stringify(url)}`, shortCircuit: true }
    return nextLoad(url, context)
  },
})
