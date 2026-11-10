/**
 * Completo's runtime invariants, asserted against the files that actually ship.
 *
 * These are the properties that a passing build does NOT prove, and that broke
 * during development in ways nothing else caught:
 *
 *   - the browser bundle parses and is a real module-loader bundle;
 *   - the composition patch has no duplicated or unparsable row;
 *   - every skill parses exactly as the provider parses it.
 *
 * Run by `npm run check`. Exits non-zero with the reason on stderr.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseSkill, loadSkills } from '../dist/skills/index.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const fails = []
const ok = (condition, message) => {
  if (!condition) fails.push(message)
}
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8')

// --- the browser bundle -----------------------------------------------------
const client = read('dist/completo-client.js')
let clientParses = true
let clientError = ''
try {
  // Parsing only: the bundle needs a DOM and a loader to run.
  new Function(client) // eslint-disable-line no-new-func
} catch (error) {
  clientParses = false
  clientError = String(error?.message ?? error)
}
ok(clientParses, `dist/completo-client.js does not parse: ${clientError}`)
ok(client.includes('window.__ModuleLoader__.load('), 'the browser bundle is not a module-loader bundle')
ok(
  /id:\s*"dsh-completo"/.test(client),
  'the browser bundle does not declare id "dsh-completo" (its row name must match)',
)
ok(!client.includes('__COMPLETO'), 'the browser bundle still holds an unexpanded __COMPLETO_* placeholder')
ok(function registerThemes() {}.name === 'registerThemes', 'harness sanity')

// The two halves and the data they need must both be present.
ok(client.includes('function registerThemes'), 'the theme half is missing from the bundle')
ok(client.includes('function applyPage'), 'the page half is missing from the bundle')
ok(client.includes('completo-studio-light'), 'the palette never reached the bundle')

// --- ONE dictionary, both halves -------------------------------------------
//
// The page and the providers card translate into the same namespace, so the
// bundle may register exactly one locale dictionary and both halves must read
// the very same object. The shipped page once read a `dictionary` field nobody
// assigned, and nothing noticed until every string on the tab rendered as its
// own key - this is the check that would have caught it.
const registrations = [...client.matchAll(/locale\.register\(/gu)].length
ok(registrations === 1, `the bundle registers a locale dictionary ${registrations} times, expected exactly 1`)
const shared = [...client.matchAll(/var en = pageDefinition\.en;/gu)].length
ok(shared === 2, `only ${shared} of the two halves read pageDefinition.en; both must share one object`)
ok(!client.includes('pageDefinition.dictionary'), 'a half still reads the removed pageDefinition.dictionary field');
ok(!client.includes('Object.assign({}, en)'), 'a half copies the shared dictionary instead of merging into it');
ok((client.match(/Object\.assign\(en, \{/gu) ?? []).length === 1, 'the providers half must merge into the one shared dictionary exactly once');
ok(/pageDefinition\.en = \{/u.test(client), 'the shared pageDefinition.en object is never declared')
const enBlock = client.slice(client.indexOf('pageDefinition.en = {'), client.indexOf('pageDefinition.en = {') + 2000)
ok(enBlock.includes('title: "Completo"'), 'the shared dictionary does not start with the page title')
ok(
  client.indexOf('pageDefinition.en = {') < client.indexOf('function providersDefinition'),
  'the shared dictionary must be declared before the providers half merges into it',
)

// --- stylesheet injection --------------------------------------------------
//
// The stylesheet must be appended with `textContent = CSS` where CSS is the
// joined string. Assigning an ARRAY to textContent renders "a,b,c" in a real
// DOM and throws in a stricter one: the page then loses every rule silently.
ok(
  /tag\.textContent = CSS;?$/mu.test(client) || /\.textContent = CSS;?$/mu.test(client),
  'the page stylesheet is not assigned as one joined string',
)
ok(!/textContent = CSS\.join\(/u.test(client), 'the stylesheet is assigned as an array join at the DOM edge')
ok(/var CSS = \[/u.test(client), 'the page no longer builds its CSS from an array of rules')

// --- per-row key hints -----------------------------------------------------
//
// Each secret row prints its own variable name in the shell hint. A single
// String#replace rewrote only the FIRST occurrence, so every row after GitHub
// showed "GITHUB_TOKEN" - the screenshot caught it, this keeps it caught.
ok(!/exportHint\.replace\(/u.test(client), 'the shell hint rewrites only one occurrence of the variable name')
ok((client.match(/exportHint\.split\("GITHUB_TOKEN"\)\.join\(secret\.ref\)/gu) ?? []).length === 1, 'the shell hint does not substitute every occurrence of the variable name')

// --- the composition patch --------------------------------------------------
const patch = read('cordis.patch.yml')
const rowIds = [...patch.matchAll(/^\s+- id:\s*(\S+)\s*$/gmu)].map((match) => match[1])
ok(rowIds.length > 0, 'cordis.patch.yml inserts no rows')
ok(new Set(rowIds).size === rowIds.length, `duplicate row id in cordis.patch.yml: ${rowIds.join(', ')}`)

// Each package name may appear only once as a loader source: the client-modules
// registry rejects two active sources for one package.
const mountedNames = [...patch.matchAll(/^\s+name:\s*'([^']+)'\s*$/gmu)].map((match) => match[1])
const own = mountedNames.filter((nameValue) => nameValue === 'dsh-completo')
ok(own.length === 1, `dsh-completo is mounted ${own.length} times; the client registry allows exactly one source`)

// Every insert block must be a list with at least one row.
const blocks = patch.split(/^- insert:/mu).slice(1)
ok(blocks.length >= 1, 'cordis.patch.yml has no "- insert:" block')
for (const [index, block] of blocks.entries()) {
  const rows = [...block.matchAll(/^\s+- id:\s*(\S+)/gmu)].map((match) => match[1])
  ok(rows.length > 0, `insert block ${index + 1} has no rows`)
}
ok(!/\t/.test(patch), 'cordis.patch.yml contains a tab (YAML forbids tabs for indentation)')

// --- the skill pack ---------------------------------------------------------
const skillsRoot = join(ROOT, 'skills')
const shipped = readdirSync(skillsRoot)
  .filter((entry) => statSync(join(skillsRoot, entry)).isDirectory())
  .sort()
const loaded = loadSkills(skillsRoot)
ok(
  loaded.length === shipped.length,
  `the registry lists ${loaded.length} skills but ${shipped.length} directories ship`,
)
for (const skill of loaded) {
  let parsed = null
  try {
    parsed = parseSkill(readFileSync(skill.path, 'utf8'), skill.path)
  } catch (error) {
    fails.push(`skills/${skill.skillName}/SKILL.md does not parse: ${error.message}`)
  }
  if (parsed === null) continue
  ok(parsed.description.length > 10, `skills/${skill.skillName} has a useless description`)
  ok(parsed.description.length <= 500, `skills/${skill.skillName} description is over 500 chars`)
  ok(!parsed.description.includes('\n'), `skills/${skill.skillName} description spans lines`)
  ok(parsed.content.length > 300, `skills/${skill.skillName} body is too thin to be useful`)
  ok(/^#\s/m.test(parsed.content), `skills/${skill.skillName} body has no heading`)
}

// --- results ----------------------------------------------------------------
if (fails.length > 0) {
  for (const failure of fails) process.stderr.write(`  - ${failure}\n`)
  process.exit(1)
}
process.stdout.write(
  `invariants: bundle parses (${client.length} bytes), ${rowIds.length} rows in ${blocks.length} blocks, ` +
    `${loaded.length} skills parse\n`,
)
