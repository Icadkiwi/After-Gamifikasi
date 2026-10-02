import fs from 'node:fs'
import path from 'node:path'

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const name = path.join(dir, entry.name)
  return entry.isDirectory() ? walk(name) : [name.replaceAll('\\', '/')]
})
const files = [...walk('src'), ...walk('tests')]
const inventory = files.map((file) => {
  const content = fs.readFileSync(file, 'utf8')
  const imports = [...content.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)].map((m) => m[1])
  const resolved = imports.map((name) => name.startsWith('.')
    ? path.posix.normalize(path.posix.join(path.posix.dirname(file), name))
    : name.startsWith('@/') ? `src/${name.slice(2)}` : name)
  return { file, imports, resolved, storage: content.split(/\r?\n/).filter((line) => /localStorage|sessionStorage|[Ss]torage(?:Key|Prefix)|collection\(|doc\(db/.test(line)).map((line) => line.trim()) }
})
for (const entry of inventory) {
  const stem = entry.file.replace(/\.[^.]+$/, '')
  entry.importedBy = inventory.filter((item) => item.resolved.includes(stem) || item.resolved.includes(entry.file)).map((item) => item.file)
}
fs.mkdirSync('docs', { recursive: true })
const target = process.argv[2] ?? 'docs/source-audit.json'
if (fs.existsSync(target)) throw new Error(`Audit already exists: ${target}`)
fs.writeFileSync(target, JSON.stringify(inventory, null, 2) + '\n')
console.log(`Audited ${inventory.length} source/test files into ${target}`)
