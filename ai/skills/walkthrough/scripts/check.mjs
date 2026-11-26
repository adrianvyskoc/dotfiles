#!/usr/bin/env node
// Deterministic checker for a walkthrough.json. It does NOT trust the author's narrative:
// every file:line must exist, every step's function name must sit at its line, every quote must be
// in the request, and every changed hunk in the git diff must be explained by a decision (why) AND a step (how).
//
// Usage: node check.mjs <walkthrough.json> [--json]
// Exit code: 1 when there is at least one `error` finding, else 0.

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { changedHunks, gitRoot, matcher, norm, parseRef, readLines } from './lib.mjs'

const PROVENANCE = ['request', 'codebase', 'rule', 'assumption']
const EDGE_STATES = ['handled', 'unhandled', 'unknown']
const STEP_KINDS = ['new', 'modified', 'unchanged']
const FN_WINDOW = 3

// Collects findings; `where` is a JSON path-ish label shown next to the message.
function createReport() {
  const findings = []
  const add = (severity, code, where, message) => findings.push({ severity, code, where, message })
  return { findings, error: (...a) => add('error', ...a), warn: (...a) => add('warn', ...a), info: (...a) => add('info', ...a) }
}

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v)
const hasText = (v) => typeof v === 'string' && v.trim() !== ''

// Resolves "file:line[-line]" against the working tree. Returns the parsed ref or null (finding already reported).
function resolveRef(root, ref, where, report, { needLine = false } = {}) {
  if (!hasText(ref)) {
    report.error('ref-missing', where, 'reference is empty')
    return null
  }
  const parsed = parseRef(ref)
  const lines = parsed && readLines(root, parsed.file)
  if (!lines) {
    report.error('ref-file-missing', where, `file not found: ${parsed?.file ?? ref}`)
    return null
  }
  if (needLine && parsed.start === null) {
    report.error('ref-needs-line', where, `"${ref}" needs a line (file:line or file:start-end)`)
    return null
  }
  if (parsed.start !== null && (parsed.start < 1 || parsed.end < parsed.start || parsed.end > lines.length)) {
    report.error('ref-line-out-of-range', where, `${ref} is outside the file (${lines.length} lines)`)
    return null
  }
  return parsed
}

function fnNameAt(root, parsed, fn) {
  const name = String(fn).split(/[.#:]+/).filter(Boolean).pop()?.replace(/\(.*$/, '')
  if (!name) return true
  const lines = readLines(root, parsed.file)
  const from = Math.max(parsed.start - 1 - FN_WINDOW, 0)
  const to = Math.min(parsed.start + FN_WINDOW, lines.length)
  return lines.slice(from, to).some((line) => line.includes(name))
}

function checkStructure(wt, report) {
  for (const key of ['title', 'request']) if (!hasText(wt[key])) report.error('missing-field', key, `"${key}" is required`)
  for (const key of ['requirements', 'decisions', 'scenarios']) {
    if (!Array.isArray(wt[key])) report.error('missing-field', key, `"${key}" must be an array`)
  }
}

function collectIds(items, kind, report) {
  const ids = new Set()
  for (const [i, item] of (items || []).entries()) {
    if (!isObj(item) || !hasText(item.id)) {
      report.error('missing-field', `${kind}[${i}]`, 'every item needs a string "id"')
    } else if (ids.has(item.id)) {
      report.error('duplicate-id', `${kind}[${i}]`, `duplicate id ${item.id}`)
    } else ids.add(item.id)
  }
  return ids
}

function checkProvenance(root, decision, where, request, report) {
  const prov = decision.provenance
  if (!isObj(prov) || !PROVENANCE.includes(prov.kind)) {
    report.warn('no-provenance', where, `${decision.id}: provenance.kind must be one of ${PROVENANCE.join(' | ')} - treat as an assumption`)
    return 'assumption'
  }
  if (prov.kind === 'request') {
    if (!hasText(prov.ref) || !norm(request).includes(norm(prov.ref))) {
      report.error('quote-not-in-request', where, `${decision.id}: provenance quote not found in the request: "${prov.ref ?? ''}"`)
    }
  } else if (prov.kind === 'codebase') {
    resolveRef(root, prov.ref, `${where}.provenance.ref`, report, { needLine: true })
  } else if (prov.kind === 'rule') {
    const parsed = resolveRef(root, prov.ref, `${where}.provenance.ref`, report)
    if (parsed && hasText(prov.quote) && !norm(readLines(root, parsed.file).join('\n')).includes(norm(prov.quote))) {
      report.error('quote-not-in-rule', where, `${decision.id}: quote not found in ${parsed.file}: "${prov.quote}"`)
    }
  } else if (prov.kind === 'assumption') {
    report.info('assumption', where, `${decision.id}: ${decision.title ?? ''} - no source, review this`)
  }
  return prov.kind
}

function checkDecisions(root, wt, reqIds, report, ranges) {
  for (const [i, d] of (wt.decisions || []).entries()) {
    const where = `decisions[${i}]`
    for (const key of ['title', 'chosen', 'why']) if (!hasText(d[key])) report.warn('missing-field', where, `${d.id}: "${key}" is empty`)
    if (!reqIds.has(d.requirement)) report.error('unknown-requirement', where, `${d.id}: requirement "${d.requirement}" does not exist`)
    if (!Array.isArray(d.alternatives) || d.alternatives.length === 0) {
      report.info('no-alternatives', where, `${d.id}: no rejected alternatives recorded - nothing to disagree with`)
    } else {
      for (const [j, alt] of d.alternatives.entries()) {
        if (!hasText(alt.option) || !hasText(alt.rejected_because)) report.warn('missing-field', `${where}.alternatives[${j}]`, 'needs "option" and "rejected_because"')
      }
    }
    checkProvenance(root, d, where, wt.request, report)
    if (!Array.isArray(d.changes) || d.changes.length === 0) {
      report.warn('decision-without-changes', where, `${d.id}: lists no code ranges in "changes" - which code is this decision?`)
    }
    for (const [j, ref] of (d.changes || []).entries()) {
      const parsed = resolveRef(root, ref, `${where}.changes[${j}]`, report)
      if (parsed) ranges.decision.push({ ...parsed, owner: d.id, noFlow: d.noFlow === true })
    }
  }
}

function checkTests(root, scenario, where, report) {
  if (!Array.isArray(scenario.tests) || scenario.tests.length === 0) {
    report.warn('scenario-untested', where, `${scenario.id}: no test covers this scenario`)
    return
  }
  for (const [i, ref] of scenario.tests.entries()) {
    const [path, name] = String(ref).split('#')
    const parsed = resolveRef(root, path, `${where}.tests[${i}]`, report)
    if (parsed && name && !readLines(root, parsed.file).join('\n').includes(name)) {
      report.error('test-name-missing', `${where}.tests[${i}]`, `"${name}" not found in ${parsed.file}`)
    }
  }
}

function checkSteps(root, scenario, where, report, ranges) {
  const seen = new Set()
  if (!Array.isArray(scenario.steps) || scenario.steps.length === 0) {
    report.error('scenario-without-steps', where, `${scenario.id}: no steps`)
    return
  }
  for (const [i, s] of scenario.steps.entries()) {
    const at = `${where}.steps[${i}]`
    if (!hasText(s.id)) report.error('missing-field', at, 'step needs an "id"')
    else if (seen.has(s.id)) report.error('duplicate-id', at, `duplicate step id ${s.id}`)
    if (!hasText(s.fn)) report.error('missing-field', at, `${s.id}: "fn" is required`)
    if (!hasText(s.does)) report.warn('missing-field', at, `${s.id}: "does" is empty`)
    if (!STEP_KINDS.includes(s.kind)) report.error('bad-kind', at, `${s.id}: kind must be ${STEP_KINDS.join(' | ')}`)
    if (!hasText(s.in) || !hasText(s.out)) report.warn('missing-io', at, `${s.id}: needs "in" and "out" (use "-" if truly none)`)
    if (s.parent !== undefined && !seen.has(s.parent)) report.error('bad-parent', at, `${s.id}: parent "${s.parent}" must be an earlier step of this scenario`)
    if (hasText(s.id)) seen.add(s.id)

    const parsed = resolveRef(root, s.at, `${at}.at`, report, { needLine: true })
    if (parsed) {
      if (!fnNameAt(root, parsed, s.fn)) report.warn('fn-not-at-line', `${at}.at`, `${s.id}: "${s.fn}" not found within ${FN_WINDOW} lines of ${s.at}`)
      // "touches" = the changed ranges this step runs through; without it the whole "at" range counts.
      if (!Array.isArray(s.touches) || s.touches.length === 0) ranges.step.push({ ...parsed, owner: s.id })
    }
    for (const [j, ref] of (s.touches || []).entries()) {
      const touched = resolveRef(root, ref, `${at}.touches[${j}]`, report, { needLine: true })
      if (touched) ranges.step.push({ ...touched, owner: s.id })
    }
    for (const [j, edge] of (s.edges || []).entries()) {
      const ew = `${at}.edges[${j}]`
      if (!hasText(edge.case)) report.warn('missing-field', ew, 'edge needs a "case"')
      if (!EDGE_STATES.includes(edge.state)) report.error('bad-edge-state', ew, `state must be ${EDGE_STATES.join(' | ')}`)
      else if (edge.state === 'unhandled') report.info('edge-unhandled', ew, `${s.id}: unhandled - ${edge.case}`)
      else if (edge.state === 'unknown') report.info('edge-unknown', ew, `${s.id}: unknown - ${edge.case}`)
      else if (!edge.at) report.warn('handled-without-location', ew, `${s.id}: "${edge.case}" is marked handled but gives no "at"`)
      if (edge.at) resolveRef(root, edge.at, `${ew}.at`, report, { needLine: true })
    }
  }
}

function checkScenarios(root, wt, reqIds, report, ranges) {
  for (const [i, sc] of (wt.scenarios || []).entries()) {
    const where = `scenarios[${i}]`
    for (const key of ['title', 'trigger', 'input', 'result']) if (!hasText(sc[key])) report.warn('missing-field', where, `${sc.id}: "${key}" is empty`)
    if (!reqIds.has(sc.requirement)) report.error('unknown-requirement', where, `${sc.id}: requirement "${sc.requirement}" does not exist`)
    checkTests(root, sc, where, report)
    checkSteps(root, sc, where, report, ranges)
  }
}

function checkRequirements(wt, report) {
  const decided = new Set((wt.decisions || []).map((d) => d.requirement))
  const scenarios = new Set((wt.scenarios || []).map((s) => s.requirement))
  for (const [i, r] of (wt.requirements || []).entries()) {
    const where = `requirements[${i}]`
    if (!hasText(r.text)) report.error('missing-field', where, `${r.id}: "text" is required`)
    if (!hasText(r.quote)) report.warn('requirement-not-quoted', where, `${r.id}: no "quote" - inferred, not asked for?`)
    else if (!norm(wt.request).includes(norm(r.quote))) report.error('quote-not-in-request', where, `${r.id}: quote not found in the request: "${r.quote}"`)
    if (!decided.has(r.id)) report.warn('requirement-uncovered', where, `${r.id}: no decision explains it`)
    if (!scenarios.has(r.id)) report.warn('requirement-uncovered', where, `${r.id}: no scenario shows it`)
  }
}

const TRIVIAL = /^[\s{}()[\];,]*$/ // blank lines and lone braces/brackets carry no decision of their own

const covers = (file, lines, ranges) => ranges.some((r) => r.file === file && lines.some((n) => r.start === null || (n >= r.start && n <= r.end)))

// A hunk is judged line by line: one decision touching 5 of its 35 lines must not hide the other 30.
// Additions are one unit per non-trivial line; a pure deletion is one unit anchored on the two lines around the cut.
function hunkUnits(root, hunk) {
  if (hunk.len === 0) return [{ lines: [hunk.start, hunk.start + 1] }]
  const text = readLines(root, hunk.file) || []
  const units = []
  for (let n = hunk.start; n < hunk.start + hunk.len; n++) if (!TRIVIAL.test(text[n - 1] ?? '')) units.push({ lines: [n] })
  return units
}

// Merges unit line numbers into ranges; trivial lines between two units do not break a range.
function toRanges(root, file, numbers) {
  const text = readLines(root, file) || []
  const out = []
  for (const n of [...numbers].sort((a, b) => a - b)) {
    const last = out[out.length - 1]
    const gapTrivial = last && text.slice(last.to, n - 1).every((l) => TRIVIAL.test(l))
    if (last && gapTrivial) last.to = n
    else out.push({ from: n, to: n })
  }
  return out
}

const label = (file, { from, to }) => `${file}:${from}${to > from ? `-${to}` : ''}`

// Every changed line must be explained twice: a decision (why) and a step (how). Neither = unrequested change.
function checkHunks(root, wt, report, ranges) {
  const base = wt.base || 'HEAD'
  const scope = (wt.scope || []).map(matcher)
  const ignore = ['.walkthrough/', ...(wt.ignore || [])].map(matcher)
  const extras = []
  for (const [i, extra] of (wt.extras || []).entries()) {
    const parsed = resolveRef(root, extra.ref, `extras[${i}].ref`, report)
    if (!hasText(extra.note)) report.warn('missing-field', `extras[${i}]`, 'extra needs a "note" saying why it is there')
    if (parsed) extras.push({ ...parsed, note: extra.note })
  }

  let hunks
  try {
    hunks = changedHunks(root, base)
  } catch (err) {
    report.error('git-diff-failed', 'base', `git diff against "${base}" failed: ${(err.stderr || err.message).split('\n')[0].trim()}`)
    return []
  }
  const whyRanges = ranges.decision
  const howRanges = [...ranges.step, ...ranges.decision.filter((r) => r.noFlow)]
  const near = (list, file, from, to) => list.filter((r) => r.file === file && (r.start === null || (r.start <= to + 1 && r.end >= from)))
  const rows = []
  for (const hunk of hunks) {
    if (scope.length && !scope.some((m) => m(hunk.file))) continue
    if (ignore.some((m) => m(hunk.file))) continue
    const buckets = { unrequested: [], declared: [], noWhy: [], noHow: [] }
    for (const unit of hunkUnits(root, hunk)) {
      const why = covers(hunk.file, unit.lines, whyRanges)
      const how = covers(hunk.file, unit.lines, howRanges)
      if (why && how) continue
      const bucket = !why && !how ? (covers(hunk.file, unit.lines, extras) ? 'declared' : 'unrequested') : why ? 'noHow' : 'noWhy'
      buckets[bucket].push(unit.lines[0])
    }
    const issues = []
    const note = (bucket, severity, code, message) => {
      for (const range of toRanges(root, hunk.file, buckets[bucket])) {
        report[severity](code, label(hunk.file, range), typeof message === 'function' ? message(range) : message)
        issues.push({ kind: code, from: range.from, to: range.to })
      }
    }
    note('unrequested', 'error', 'unrequested-hunk', 'changed, but no decision and no step covers it - scope creep or missing explanation')
    note('declared', 'warn', 'declared-extra', (r) => `declared extra, not requested: ${extras.find((e) => e.file === hunk.file && (e.start === null || (r.from >= e.start && r.from <= e.end)))?.note ?? ''}`)
    note('noWhy', 'warn', 'hunk-without-why', 'a step runs through it but no decision explains why it changed')
    note('noHow', 'warn', 'hunk-without-how', 'a decision claims it but no scenario step runs through it (use noFlow: true for docs/types/config)')
    const kinds = new Set(issues.map((i) => i.kind))
    const status = ['unrequested-hunk', 'declared-extra', 'hunk-without-why', 'hunk-without-how'].find((k) => kinds.has(k)) ?? 'ok'
    const end = hunk.start + Math.max(hunk.len, 1) - 1
    rows.push({
      ...hunk,
      where: label(hunk.file, { from: hunk.start, to: end }),
      status,
      issues,
      decisions: [...new Set(near(whyRanges, hunk.file, hunk.start, end).map((r) => r.owner))],
      steps: [...new Set(near(howRanges, hunk.file, hunk.start, end).map((r) => r.owner))],
    })
  }
  return rows
}

export function check(wt, { root, ranges = { decision: [], step: [] } } = {}) {
  const report = createReport()
  checkStructure(wt, report)
  const reqIds = collectIds(wt.requirements, 'requirements', report)
  collectIds(wt.decisions, 'decisions', report)
  collectIds(wt.scenarios, 'scenarios', report)
  checkRequirements(wt, report)
  checkDecisions(root, wt, reqIds, report, ranges)
  checkScenarios(root, wt, reqIds, report, ranges)
  const hunks = checkHunks(root, wt, report, ranges)
  const count = (code) => report.findings.filter((f) => f.code === code).length
  const stats = {
    errors: report.findings.filter((f) => f.severity === 'error').length,
    warnings: report.findings.filter((f) => f.severity === 'warn').length,
    assumptions: count('assumption') + count('no-provenance'),
    unrequested: count('unrequested-hunk'),
    declaredExtras: count('declared-extra'),
    untestedScenarios: count('scenario-untested'),
    unhandledEdges: count('edge-unhandled'),
    unknownEdges: count('edge-unknown'),
    hunks: hunks.length,
  }
  return { findings: report.findings, hunks, stats }
}

export function loadAndCheck(path) {
  const wt = JSON.parse(readFileSync(path, 'utf8'))
  const root = gitRoot(dirname(resolve(path)))
  return { wt, root, ...check(wt, { root }) }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = process.argv[2]
  if (!path) {
    console.error('Usage: node check.mjs <walkthrough.json> [--json]')
    process.exit(2)
  }
  const { findings, stats } = loadAndCheck(path)
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ stats, findings }, null, 2))
  } else {
    const order = { error: 0, warn: 1, info: 2 }
    for (const f of [...findings].sort((a, b) => order[a.severity] - order[b.severity])) {
      console.log(`${f.severity.toUpperCase().padEnd(5)} ${f.code.padEnd(26)} ${f.where}  ${f.message}`)
    }
    console.log(`\n${JSON.stringify(stats)}`)
  }
  process.exit(findings.some((f) => f.severity === 'error') ? 1 : 0)
}
