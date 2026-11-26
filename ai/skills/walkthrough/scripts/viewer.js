// Walkthrough viewer. All text goes through textContent (the JSON is untrusted), no innerHTML anywhere.
const DATA = JSON.parse(document.getElementById('data').textContent)
const { wt, findings, stats, hunks, snippets } = DATA

const state = { view: 'hot', req: null, scenario: null, focus: null, refs: [], ref: null }

function h(tag, attrs, ...kids) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue
    if (key === 'class') node.className = value
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value)
    else node.setAttribute(key, value === true ? '' : value)
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid === null || kid === undefined || kid === false) continue
    node.append(kid.nodeType ? kid : document.createTextNode(String(kid)))
  }
  return node
}

// Replaces a container's children; unlike replaceChildren it accepts nested arrays and skips null/false.
function mount(container, ...kids) {
  container.replaceChildren(...kids.flat(Infinity).filter((k) => k !== null && k !== undefined && k !== false).map((k) => (k.nodeType ? k : document.createTextNode(String(k)))))
}

const badge = (kind, text) => h('span', { class: `badge ${kind}` }, text ?? kind)
const reqOf = (id) => wt.requirements.find((r) => r.id === id)
const isAssumption = (d) => !d.provenance || d.provenance.kind === 'assumption' || !['request', 'codebase', 'rule'].includes(d.provenance.kind)

function chip(ref, group) {
  return h('button', { class: `chip${state.ref === ref ? ' active' : ''}`, title: 'show code', onclick: (event) => { event.stopPropagation(); openRef(ref, group || [ref]) } }, ref.replace(/^.*\//, ''))
}

function openRef(ref, group) {
  state.ref = ref
  state.refs = group
  renderCode()
}

function go(patch) {
  Object.assign(state, patch)
  render()
}

// ---------- header ----------
function renderHeader() {
  const stat = (cls, count, text, view) => (count ? h('button', { class: `stat ${cls}`, onclick: () => go({ view }) }, h('b', {}, count), text) : null)
  mount($('#head'), 
    h('h1', {}, wt.title),
    h('div', { class: 'meta' }, `diff base: ${wt.base || 'HEAD'}`, wt.scope?.length ? `  |  scope: ${wt.scope.join(', ')}` : ''),
    h('details', { class: 'request' }, h('summary', {}, 'Original request'), h('blockquote', {}, wt.request)),
    h('div', { class: 'chips' },
      stat('bad', stats.errors, 'errors', 'findings'),
      stat('bad', stats.unrequested, 'unrequested change(s)', 'lines'),
      stat('note', stats.assumptions, 'assumptions', 'hot'),
      stat('warn', stats.unhandledEdges + stats.unknownEdges, 'open edge cases', 'hot'),
      stat('warn', stats.untestedScenarios, 'untested scenarios', 'hot'),
      stat('warn', stats.declaredExtras, 'declared extras', 'lines'),
      stat('warn', stats.warnings, 'warnings', 'findings'),
    ),
  )
}

// ---------- nav ----------
function renderNav() {
  const item = (label, active, onclick) => h('button', { class: active ? 'active' : '', onclick }, label)
  mount($('#nav'), 
    h('div', { class: 'group' }, 'Review'),
    item('Hot spots', state.view === 'hot', () => go({ view: 'hot' })),
    item('Changed lines', state.view === 'lines', () => go({ view: 'lines' })),
    item(`Checker findings (${findings.filter((f) => f.severity !== 'info').length})`, state.view === 'findings', () => go({ view: 'findings' })),
    h('div', { class: 'group' }, 'Requirements'),
    wt.requirements.map((r) => item([h('span', { class: 'req-id' }, r.id), r.text], state.view === 'req' && state.req === r.id, () => go({ view: 'req', req: r.id, scenario: wt.scenarios.find((s) => s.requirement === r.id)?.id || null, focus: null }))),
  )
}

// ---------- hot spots ----------
function section(title, cards) {
  return cards.length ? [h('h2', {}, `${title} (${cards.length})`), cards] : null
}

function hotSpots() {
  const lineCards = []
  for (const hunk of hunks) {
    for (const issue of hunk.issues) {
      const ref = `${hunk.file}:${issue.from}${issue.to > issue.from ? `-${issue.to}` : ''}`
      lineCards.push(
        h('div', { class: 'card clickable', onclick: () => { go({ view: 'lines' }); openRef(ref, [ref]) } },
          h('div', { class: 'row' }, badge(issue.kind), h('code', {}, ref)),
          h('div', { class: 'muted' }, findings.find((f) => f.where === ref && f.code === issue.kind)?.message || ''),
        ),
      )
    }
  }
  const assumptionCards = wt.decisions.filter(isAssumption).map((d) =>
    h('div', { class: 'card clickable', onclick: () => openDecision(d) },
      h('div', { class: 'row' }, badge('assumption'), h('b', {}, `${d.id} ${d.title}`)),
      h('div', { class: 'muted' }, `Why (unsourced): ${d.why}`),
    ),
  )
  const edgeCards = []
  const untested = []
  for (const sc of wt.scenarios) {
    if (!sc.tests?.length) untested.push(h('div', { class: 'card clickable', onclick: () => openScenario(sc) }, h('div', { class: 'row' }, badge('warn', 'untested'), h('b', {}, `${sc.id} ${sc.title}`))))
    for (const step of sc.steps) {
      for (const edge of step.edges || []) {
        if (edge.state === 'handled') continue
        edgeCards.push(
          h('div', { class: 'card clickable', onclick: () => openScenario(sc, step) },
            h('div', { class: 'row' }, badge(edge.state), h('b', {}, edge.case), h('span', { class: 'muted' }, `${step.id} ${step.fn}`)),
            edge.note ? h('div', { class: 'muted' }, edge.note) : null,
          ),
        )
      }
    }
  }
  const body = [
    section('Unrequested or unexplained changed lines', lineCards),
    section('Assumptions: decisions without a source', assumptionCards),
    section('Edge cases not handled or not checked', edgeCards),
    section('Scenarios without a test', untested),
  ].filter(Boolean)
  return [h('h2', {}, 'Where to look first'), body.length ? body : h('div', { class: 'empty' }, 'Nothing flagged.')]
}

function openDecision(d) {
  go({ view: 'req', req: d.requirement, scenario: wt.scenarios.find((s) => s.requirement === d.requirement)?.id || null, focus: d.id })
  openRef(d.changes?.[0] || '', d.changes || [])
  document.getElementById(`el-${d.id}`)?.scrollIntoView({ block: 'center' })
}

function openScenario(sc, step) {
  go({ view: 'req', req: sc.requirement, scenario: sc.id, focus: step?.id || null })
  if (step) openRef(stepRefs(step)[0], stepRefs(step))
  document.getElementById(`el-${step?.id || sc.id}`)?.scrollIntoView({ block: 'center' })
}

// ---------- requirement view ----------
function provenance(d) {
  const p = d.provenance
  if (isAssumption(d)) return [badge('assumption', 'assumption: no source'), p && p.kind && p.kind !== 'assumption' ? h('span', { class: 'muted' }, `(unknown kind "${p.kind}")`) : null]
  if (p.kind === 'request') return [badge('request', 'from request'), h('span', { class: 'muted' }, `"${p.ref}"`)]
  return [badge(p.kind, p.kind === 'codebase' ? 'matches codebase' : 'project rule'), chip(p.ref), p.quote ? h('span', { class: 'muted' }, `"${p.quote}"`) : null]
}

function decisionCard(d) {
  return h('div', { class: `card${state.focus === d.id ? ' focus' : ''}`, id: `el-${d.id}` },
    h('div', { class: 'row' }, h('b', {}, `${d.id}  ${d.title}`), provenance(d)),
    h('dl', { class: 'kv' },
      h('dt', {}, 'Chosen'), h('dd', {}, d.chosen),
      h('dt', {}, 'Why'), h('dd', {}, d.why),
    ),
    (d.alternatives || []).map((a) => h('div', { class: 'alt' }, h('b', {}, 'Rejected: '), a.option, ' - ', a.rejected_because)),
    d.alternatives?.length ? null : h('div', { class: 'alt' }, 'No alternatives recorded.'),
    h('div', { class: 'row', style: 'margin-top:8px' }, d.noFlow ? badge('info', 'docs / types / config') : null, h('span', { class: 'muted' }, 'code:'), (d.changes || []).map((ref) => chip(ref, d.changes))),
  )
}

const stepRefs = (step) => (step.touches?.length ? step.touches : [step.at])

function stepCard(step, depth) {
  const refs = stepRefs(step)
  return [
    step.when ? h('div', { class: 'when', style: `--depth:${depth}` }, `when: ${step.when}`) : null,
    h('div', { class: `card step clickable${state.focus === step.id ? ' focus' : ''}`, id: `el-${step.id}`, style: `--depth:${depth}`, onclick: () => { state.focus = step.id; openRef(refs[0], refs); renderMain() } },
      h('div', { class: 'row' }, h('b', {}, step.id), h('code', {}, step.fn), badge(step.kind), chip(step.at, refs)),
      h('div', {}, step.does),
      h('dl', { class: 'kv' },
        h('dt', {}, 'in'), h('dd', {}, step.in || '-'),
        h('dt', {}, 'out'), h('dd', {}, step.out || '-'),
        step.effects ? [h('dt', {}, 'effects'), h('dd', {}, step.effects)] : null,
      ),
      (step.edges || []).map((edge) =>
        h('div', { class: 'edge' }, badge(edge.state), h('div', {}, h('span', {}, edge.case), edge.note ? h('span', { class: 'muted' }, ` - ${edge.note}`) : null, ' ', edge.at ? chip(edge.at) : null)),
      ),
    ),
  ]
}

function scenarioView(sc) {
  // Indent only at a real fork (a parent with several children); a straight chain stays flat.
  const children = {}
  for (const s of sc.steps) if (s.parent) children[s.parent] = (children[s.parent] || 0) + 1
  const depth = {}
  const steps = sc.steps.map((s) => {
    const parentDepth = s.parent && depth[s.parent] !== undefined ? depth[s.parent] : -1
    depth[s.id] = parentDepth < 0 ? 0 : children[s.parent] > 1 ? parentDepth + 1 : parentDepth
    return stepCard(s, depth[s.id])
  })
  return [
    h('div', { class: 'card', id: `el-${sc.id}` },
      h('dl', { class: 'kv' },
        h('dt', {}, 'Trigger'), h('dd', {}, sc.trigger),
        h('dt', {}, 'Input'), h('dd', {}, sc.input),
        h('dt', {}, 'Result'), h('dd', {}, sc.result),
        h('dt', {}, 'Tests'), h('dd', {}, sc.tests?.length ? sc.tests.map((t) => chip(t)) : badge('warn', 'none')),
      ),
    ),
    h('h2', {}, 'How: call trace'),
    steps,
  ]
}

function requirementView() {
  const req = reqOf(state.req)
  const scenarios = wt.scenarios.filter((s) => s.requirement === req.id)
  const sc = scenarios.find((s) => s.id === state.scenario) || scenarios[0]
  return [
    h('h2', {}, `${req.id}  ${req.text}`),
    h('div', { class: 'muted' }, req.quote ? `Request says: "${req.quote}"` : 'Not quoted from the request: inferred.'),
    h('h2', {}, 'Why: decisions'),
    wt.decisions.filter((d) => d.requirement === req.id).map(decisionCard),
    h('h2', {}, 'What: scenarios'),
    scenarios.length
      ? [
          h('div', { class: 'tabs' }, scenarios.map((s) => h('button', { class: `tab${s.id === sc.id ? ' active' : ''}`, onclick: () => go({ scenario: s.id, focus: null }) }, `${s.id}  ${s.title}`))),
          scenarioView(sc),
        ]
      : h('div', { class: 'empty' }, 'No scenario shows this requirement.'),
  ]
}

// ---------- changed lines / findings ----------
function linesView() {
  return [
    h('h2', {}, 'Every changed hunk in scope'),
    h('table', {},
      h('thead', {}, h('tr', {}, ['Hunk', 'Status', 'Why (decisions)', 'How (steps)'].map((t) => h('th', {}, t)))),
      h('tbody', {}, hunks.map((hunk) =>
        h('tr', {},
          h('td', {}, chip(hunk.where, [hunk.where])),
          h('td', {}, badge(hunk.status), hunk.issues.map((i) => h('div', { class: 'muted' }, `${i.kind} ${i.from}${i.to > i.from ? `-${i.to}` : ''}`))),
          h('td', {}, hunk.decisions.join(', ') || '-'),
          h('td', {}, hunk.steps.join(', ') || '-'),
        ),
      )),
    ),
  ]
}

function findingsView() {
  const rows = findings.filter((f) => f.severity !== 'info')
  return [
    h('h2', {}, 'Checker findings'),
    rows.length
      ? h('table', {},
          h('thead', {}, h('tr', {}, ['', 'Code', 'Where', 'Message'].map((t) => h('th', {}, t)))),
          h('tbody', {}, rows.map((f) => h('tr', {}, h('td', {}, badge(f.severity)), h('td', {}, h('code', {}, f.code)), h('td', {}, h('code', {}, f.where)), h('td', {}, f.message)))),
        )
      : h('div', { class: 'empty' }, 'No errors or warnings.'),
  ]
}

// ---------- code panel ----------
function renderCode() {
  const snip = snippets[state.ref]
  mount($('#code'), 
    state.refs.length > 1 ? h('div', { class: 'code-head' }, h('div', { class: 'row' }, state.refs.map((r) => chip(r, state.refs)))) : null,
    snip
      ? [
          h('div', { class: 'code-head' }, h('code', {}, `${snip.file}:${snip.hlFrom}${snip.hlTo > snip.hlFrom ? `-${snip.hlTo}` : ''}`), h('div', { class: 'muted' }, 'green = changed in this diff, yellow = referenced lines')),
          h('pre', { class: 'code' }, snip.lines.map((l) => h('div', { class: `ln${l.changed ? ' changed' : ''}${l.n >= snip.hlFrom && l.n <= snip.hlTo ? ' hl' : ''}` }, h('span', { class: 'n' }, l.n), l.text || ' '))),
        ]
      : h('div', { class: 'placeholder' }, state.ref ? 'No preview for this reference.' : 'Click a step, a decision or a changed line to see the code.'),
  )
  renderNav()
}

function renderMain() {
  const body = state.view === 'req' ? requirementView() : state.view === 'lines' ? linesView() : state.view === 'findings' ? findingsView() : hotSpots()
  mount($('#main'), body)
}

function render() {
  renderHeader()
  renderNav()
  renderMain()
  renderCode()
  document.documentElement.style.setProperty('--header-h', `${$('#head').offsetHeight}px`)
}

function $(selector) {
  return document.querySelector(selector)
}

render()
