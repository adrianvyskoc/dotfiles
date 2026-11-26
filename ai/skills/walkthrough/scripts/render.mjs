#!/usr/bin/env node
// Renders a walkthrough.json into ONE self-contained HTML file (no network, no build step).
// The checker runs first and its findings are baked into the page, so what you see is verified, not just narrated.
//
// Usage: node render.mjs <walkthrough.json> [--out <file.html>]
// Default output: next to the JSON, same name, .html. Exit code mirrors the checker (1 = errors).

import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadAndCheck } from './check.mjs'
import { parseRef, readLines } from './lib.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const CONTEXT_BEFORE = 2
const CONTEXT_AFTER_SINGLE = 10
const CONTEXT_AFTER_RANGE = 2
const MAX_LINES = 90

// Every file:line reference in the walkthrough, so the page can show code offline.
function collectRefs(wt, hunks) {
  const refs = new Set()
  const add = (ref) => ref && refs.add(String(ref))
  for (const d of wt.decisions || []) {
    ;(d.changes || []).forEach(add)
    if (['codebase', 'rule'].includes(d.provenance?.kind)) add(d.provenance.ref)
  }
  for (const sc of wt.scenarios || []) {
    ;(sc.tests || []).forEach((t) => add(String(t).split('#')[0]))
    for (const step of sc.steps || []) {
      add(step.at)
      ;(step.touches || []).forEach(add)
      for (const edge of step.edges || []) add(edge.at)
    }
  }
  for (const extra of wt.extras || []) add(extra.ref)
  for (const hunk of hunks) {
    add(hunk.where)
    for (const issue of hunk.issues) add(`${hunk.file}:${issue.from}${issue.to > issue.from ? `-${issue.to}` : ''}`)
  }
  return refs
}

function changedLines(hunks) {
  const byFile = new Map()
  for (const hunk of hunks) {
    if (!byFile.has(hunk.file)) byFile.set(hunk.file, new Set())
    for (let n = hunk.start; n < hunk.start + hunk.len; n++) byFile.get(hunk.file).add(n)
  }
  return byFile
}

function buildSnippets(root, refs, hunks) {
  const changed = changedLines(hunks)
  const snippets = {}
  for (const ref of refs) {
    const parsed = parseRef(ref)
    const text = parsed && readLines(root, parsed.file)
    if (!text) continue
    const hlFrom = parsed.start ?? 1
    const hlTo = parsed.end ?? hlFrom
    const single = parsed.start === parsed.end
    const from = Math.max(hlFrom - CONTEXT_BEFORE, 1)
    const to = Math.min(single ? hlFrom + CONTEXT_AFTER_SINGLE : hlTo + CONTEXT_AFTER_RANGE, text.length, from + MAX_LINES - 1)
    const lines = []
    for (let n = from; n <= to; n++) lines.push({ n, text: text[n - 1], changed: changed.get(parsed.file)?.has(n) ?? false })
    snippets[ref] = { file: parsed.file, hlFrom, hlTo: single ? hlFrom : hlTo, lines }
  }
  return snippets
}

const escapeForScript = (json) => json.replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16)}`)

function main() {
  const args = process.argv.slice(2)
  const input = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out')
  if (!input) {
    console.error('Usage: node render.mjs <walkthrough.json> [--out <file.html>]')
    process.exit(2)
  }
  const outFlag = args.indexOf('--out')
  const out = resolve(outFlag >= 0 ? args[outFlag + 1] : input.replace(/\.json$/, '') + '.html')

  const { wt, root, findings, hunks, stats } = loadAndCheck(input)
  const snippets = buildSnippets(root, collectRefs(wt, hunks), hunks)
  const data = escapeForScript(JSON.stringify({ wt, findings, stats, hunks, snippets }))
  const css = readFileSync(resolve(here, 'viewer.css'), 'utf8')
  const js = readFileSync(resolve(here, 'viewer.js'), 'utf8').replace(/<\/script/gi, '<\\/script')

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${wt.title.replace(/[<&>]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c])}</title>
<style>${css}</style>
</head>
<body>
<header id="head"></header>
<div class="layout"><nav id="nav"></nav><main id="main"></main><aside id="code"></aside></div>
<script type="application/json" id="data">${data}</script>
<script>${js}</script>
</body>
</html>
`
  writeFileSync(out, html)
  console.log(`${out}  (${basename(out)}: ${JSON.stringify(stats)})`)
  process.exit(stats.errors ? 1 : 0)
}

main()
