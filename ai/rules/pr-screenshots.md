---
description: Every visible change ships annotated before/after screenshots in its PR/MR — numbered arrows on exactly what changed, a legend under each pair
---

## PR screenshots

- **A visible change gets before/after screenshots in the PR/MR description — always annotated.** Anything a reviewer can see in a browser counts: UI, layout, copy, states, icons, interaction (a GIF or a short series of shots is enough). Every pair carries a red outline + arrow + numbered badge on each changed element, on **both** images at the same spot, made with the `annotated-screenshots` skill. A pure non-visual change (refactor, types, tests) has no images.
  - **Why:** a raw before/after pair makes the reviewer play spot-the-difference; a small icon or a one-word copy change gets missed. Numbered marks turn the pair into a checklist.
  - **How to apply:**
    1. Shoot "po" on the branch, then "pred" on the base branch (detached checkout of `origin/<base>`, HMR) — same viewport (≥ 1280 px wide for desktop UI), same URL, same data, same crop.
    2. Take element boxes from the DOM (selector → `getBoundingClientRect`), never eyeballed coordinates; feed them to the skill (`image` mode with `box`, or `url` mode with `selector`). Specs and PNGs live in `.review-shots/` — never committed (see commit-discipline).
    3. Read every annotated PNG before uploading — the arrow must land on the changed element and must not cover it.
    4. Upload to the forge's own attachment storage (GitLab project uploads, GitHub PR attachments) — never a public image host; screenshots can contain production data or unreleased UI.
    5. In the description, one block per screen: `### <screen>`, a one-line legend `1 <what changed> · 2 …` (old → new), then **Pred** / **Po** (or **Before** / **After** in English repos).
