// Shared helpers for check.mjs and render.mjs: ref parsing, file reads, git diff hunks.

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'

// "src/a.ts", "src/a.ts:12", "src/a.ts:12-30" -> { file, start, end } (start/end null when no line given)
export function parseRef(ref) {
  const match = /^(.+?)(?::(\d+)(?:-(\d+))?)?$/.exec(String(ref).trim())
  if (!match) return null
  const start = match[2] ? Number(match[2]) : null
  const end = match[3] ? Number(match[3]) : start
  return { file: match[1], start, end }
}

const fileCache = new Map()
export function readLines(root, file) {
  const key = `${root}:${file}`
  if (!fileCache.has(key)) {
    const abs = resolve(root, file)
    fileCache.set(key, existsSync(abs) ? readFileSync(abs, 'utf8').split('\n') : null)
  }
  return fileCache.get(key)
}

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })
}

export function gitRoot(cwd) {
  return git(cwd, ['rev-parse', '--show-toplevel']).trim()
}

// Changed hunks on the new side of `git diff -U0 <base>` (base vs working tree), plus untracked files as whole-file hunks.
// A pure deletion has len 0: it is anchored at the line after which text was removed.
export function changedHunks(root, base) {
  const hunks = []
  const diff = git(root, ['diff', '-U0', '--no-color', '--no-ext-diff', base, '--'])
  let file = null
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      file = line === '+++ /dev/null' ? null : line.slice(6)
      continue
    }
    const match = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line)
    if (match && file) hunks.push({ file, start: Number(match[1]), len: match[2] === undefined ? 1 : Number(match[2]) })
  }
  const untracked = git(root, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
  for (const path of untracked) {
    const lines = readLines(root, path)
    if (lines) hunks.push({ file: path, start: 1, len: lines.length, untracked: true })
  }
  return hunks
}

// Simple glob: "*" within a segment, "**" across segments. Plain prefixes ("src/api/") match as prefixes.
export function matcher(pattern) {
  if (!/[*]/.test(pattern)) return (path) => path === pattern || path.startsWith(pattern.endsWith('/') ? pattern : `${pattern}/`)
  const source = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*')
  const regex = new RegExp(`^${source}$`)
  return (path) => regex.test(path)
}

export const norm = (text) => String(text).replace(/\s+/g, ' ').trim().toLowerCase()
