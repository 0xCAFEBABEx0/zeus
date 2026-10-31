/**
 * @astrojs/vercel only knows Node.js runtimes up to 24 and falls back to `nodejs24.x` on newer
 * versions. Vercel Functions support Node.js 26, which the rest of the repository runs on, so set
 * the runtime of every generated function to the Node.js major version that ran the build.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const functionsDir = path.resolve(import.meta.dirname, '../.vercel/output/functions')
const runtime = `nodejs${process.versions.node.split('.')[0]}.x`

const entries = await readdir(functionsDir, { recursive: true }).catch(() => [])

for (const entry of entries.filter((name) => name.endsWith('.vc-config.json'))) {
  const file = path.join(functionsDir, entry)
  const config = JSON.parse(await readFile(file, 'utf8'))
  if (config.runtime?.startsWith('nodejs') && config.runtime !== runtime) {
    config.runtime = runtime
    await writeFile(file, `${JSON.stringify(config, null, '\t')}\n`)
    console.log(`[set-function-runtime] ${entry}: ${runtime}`)
  }
}
