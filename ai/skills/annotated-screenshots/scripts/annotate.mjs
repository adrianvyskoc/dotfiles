#!/usr/bin/env node
// Annotated review screenshots: red arrow + outline + numbered badge on the exact element.
//
// Usage: node annotate.mjs <spec.json>
//
// Spec (one screenshot per spec):
// {
//   "url": "http://localhost:3000/pricing",      // live page, or
//   "image": "/abs/path/figma.png",              // annotate an existing image (marks use "box")
//   "out": ".review-shots/01-card-spacing.png",
//   "viewport": { "width": 390, "height": 844 }, // default 1440x900
//   "colorScheme": "dark",                       // optional
//   "storageState": "/abs/path/auth.json",       // optional, logged-in session
//   "waitFor": ".pricing-card",                  // optional selector to await
//   "crop": "marks",                             // "marks" (default) | "viewport" | "full"
//   "marks": [
//     { "label": "1", "selector": ".trial-card", "from": "top-right" },
//     { "label": "2", "box": { "x": 40, "y": 600, "width": 300, "height": 20 } }
//   ]
// }
//
// "from" is the side the arrow comes from: top-left | top-right | bottom-left | bottom-right (default top-right).
// Prints a JSON summary to stdout; a missing selector is reported, not fatal.

import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve, extname } from 'node:path'
import { createRequire } from 'node:module'
import { homedir } from 'node:os'

const TOOL_CACHE = resolve(homedir(), '.cache/annotate-shots')
const CROP_PADDING = 140

function loadPlaywright() {
  // Prefer the project's own Playwright, fall back to the pinned copy in the tool cache.
  for (const base of [process.cwd(), TOOL_CACHE]) {
    try {
      return createRequire(resolve(base, 'package.json'))('playwright')
    } catch {}
  }
  console.error(
    `Playwright not found. Install it once:\n` +
      `  mkdir -p ${TOOL_CACHE} && cd ${TOOL_CACHE} && npm init -y && npm i playwright@1.48.2 && npx playwright install chromium`,
  )
  process.exit(2)
}

function imagePage(path) {
  const mime = extname(path).toLowerCase() === '.jpg' || extname(path).toLowerCase() === '.jpeg' ? 'image/jpeg' : 'image/png'
  const data = readFileSync(path).toString('base64')
  return `<html><body style="margin:0;background:#fff"><img id="src" style="display:block" src="data:${mime};base64,${data}"></body></html>`
}

// Runs in the page: resolves marks to document coordinates and draws the overlay.
function drawOverlay(marks) {
  const RED = '#e5342b'
  const ARROW = 90
  const PAD = 4
  const doc = document.documentElement
  const width = Math.max(doc.scrollWidth, window.innerWidth)
  const height = Math.max(doc.scrollHeight, window.innerHeight)
  const ns = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(ns, 'svg')
  svg.setAttribute('width', width)
  svg.setAttribute('height', height)
  svg.style.cssText = 'position:absolute;top:0;left:0;z-index:2147483647;pointer-events:none;overflow:visible'
  svg.innerHTML = `<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${RED}"/></marker></defs>`

  const el = (tag, attrs) => {
    const node = document.createElementNS(ns, tag)
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
    svg.appendChild(node)
    return node
  }

  const results = []
  for (const mark of marks) {
    let box = mark.box
    if (mark.selector) {
      const target = document.querySelector(mark.selector)
      if (!target) {
        results.push({ label: mark.label, ok: false, error: `selector not found: ${mark.selector}` })
        continue
      }
      const r = target.getBoundingClientRect()
      box = { x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height }
    }

    const x = box.x - PAD
    const y = box.y - PAD
    const w = box.width + PAD * 2
    const h = box.height + PAD * 2
    el('rect', { x, y, width: w, height: h, rx: 6, fill: 'none', stroke: '#fff', 'stroke-width': 6, opacity: 0.6 })
    el('rect', { x, y, width: w, height: h, rx: 6, fill: 'none', stroke: RED, 'stroke-width': 3 })

    const from = mark.from || 'top-right'
    const dx = from.endsWith('left') ? -1 : 1
    const dy = from.startsWith('top') ? -1 : 1
    const tipX = dx > 0 ? x + w : x
    const tipY = dy > 0 ? y + h : y
    const tailX = Math.min(Math.max(tipX + dx * ARROW, 16), width - 16)
    const tailY = Math.min(Math.max(tipY + dy * ARROW, 16), height - 16)
    el('line', { x1: tailX, y1: tailY, x2: tipX, y2: tipY, stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: 0.6 })
    el('line', { x1: tailX, y1: tailY, x2: tipX, y2: tipY, stroke: RED, 'stroke-width': 4, 'stroke-linecap': 'round', 'marker-end': 'url(#ah)' })

    if (mark.label) {
      el('circle', { cx: tailX, cy: tailY, r: 14, fill: RED, stroke: '#fff', 'stroke-width': 2 })
      const text = el('text', {
        x: tailX,
        y: tailY + 5,
        'text-anchor': 'middle',
        'font-family': 'system-ui, sans-serif',
        'font-size': 14,
        'font-weight': 700,
        fill: '#fff',
      })
      text.textContent = mark.label
    }

    const minX = Math.min(x, tailX - 16)
    const minY = Math.min(y, tailY - 16)
    const maxX = Math.max(x + w, tailX + 16)
    const maxY = Math.max(y + h, tailY + 16)
    results.push({ label: mark.label, ok: true, extent: { minX, minY, maxX, maxY } })
  }

  document.body.appendChild(svg)
  return { results, width, height }
}

async function main() {
  const specPath = process.argv[2]
  if (!specPath) {
    console.error('Usage: node annotate.mjs <spec.json>')
    process.exit(1)
  }
  const spec = JSON.parse(readFileSync(specPath, 'utf8'))
  if (!spec.out || !spec.marks?.length || !(spec.url || spec.image)) {
    console.error('Spec needs "out", non-empty "marks", and "url" or "image".')
    process.exit(1)
  }

  const { chromium } = loadPlaywright()
  // ANNOTATE_CHROMIUM: path to an installed Chromium when the pinned Playwright wants a build that is not downloaded.
  const browser = await chromium.launch(process.env.ANNOTATE_CHROMIUM ? { executablePath: process.env.ANNOTATE_CHROMIUM } : {})
  try {
    const context = await browser.newContext({
      viewport: spec.viewport || { width: 1440, height: 900 },
      deviceScaleFactor: 2,
      colorScheme: spec.colorScheme,
      storageState: spec.storageState,
    })
    const page = await context.newPage()

    if (spec.image) {
      await page.setContent(imagePage(spec.image))
      const size = await page.$eval('#src', (img) => ({ width: img.naturalWidth, height: img.naturalHeight }))
      await page.setViewportSize(size)
    } else {
      await page.goto(spec.url, { waitUntil: 'networkidle' })
      if (spec.waitFor) await page.waitForSelector(spec.waitFor)
    }

    const { results, width, height } = await page.evaluate(drawOverlay, spec.marks)
    const drawn = results.filter((r) => r.ok)
    if (!drawn.length) {
      console.log(JSON.stringify({ out: null, marks: results }, null, 2))
      process.exitCode = 1
      return
    }

    const crop = spec.image ? 'full' : spec.crop || 'marks'
    const out = resolve(spec.out)
    mkdirSync(dirname(out), { recursive: true })

    if (crop === 'full') {
      await page.screenshot({ path: out, fullPage: true })
    } else if (crop === 'viewport') {
      const first = drawn[0].extent
      await page.evaluate(([x, y]) => window.scrollTo(x, y), [0, Math.max(first.minY - CROP_PADDING, 0)])
      await page.screenshot({ path: out })
    } else {
      const minX = Math.max(Math.min(...drawn.map((r) => r.extent.minX)) - CROP_PADDING, 0)
      const minY = Math.max(Math.min(...drawn.map((r) => r.extent.minY)) - CROP_PADDING, 0)
      const maxX = Math.min(Math.max(...drawn.map((r) => r.extent.maxX)) + CROP_PADDING, width)
      const maxY = Math.min(Math.max(...drawn.map((r) => r.extent.maxY)) + CROP_PADDING, height)
      await page.screenshot({ path: out, fullPage: true, clip: { x: minX, y: minY, width: maxX - minX, height: maxY - minY } })
    }

    console.log(JSON.stringify({ out, marks: results.map(({ extent, ...r }) => r) }, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
