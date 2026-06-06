---
name: obsidian-daily-notes
description: Saves notes, conversation summaries, tasks, and ideas to Obsidian daily notes directly on disk. Use this skill whenever the user says "write to Obsidian", "daily note", "save this", "remember this", or at the end of any meaningful conversation proactively suggest saving if something worth keeping was discussed. The skill formats and summarizes content itself — the user doesn't need to phrase anything specially.
---

# Obsidian Daily Notes Skill

## Configuration

```
VAULT_PATH:   /Users/adrianvyskoc/Library/Mobile Documents/iCloud~md~obsidian/Documents
DAILY_FOLDER: Daily
DATE_FORMAT:  YYYY-MM-DD (e.g. 2026-06-04.md)
FULL_PATH:    <VAULT_PATH>/Daily/YYYY-MM-DD.md
```

## When to use

- User explicitly says "write to Obsidian", "daily note", "save this", "remember this"
- **At the end of any meaningful conversation** — proactively suggest saving with a content preview
- After completing a technical solution, debate, or brainstorming session

---

## Workflow

### 1. Analyse the conversation

Before writing, identify what's worth preserving:
- Decisions that were made
- Technical solutions / code / architecture
- Tasks that came out of the discussion
- Interesting thoughts / ideas
- Sources / links

Don't save trivial small talk or things without value.

### 2. Propose the content (preview)

Always **show the user what you're about to write first** and ask whether they approve, want to add/remove something, or adjust anything. Format it as final markdown so they see exactly what will go into the file.

### 3. After approval — write to file

```javascript
// Logic pseudocode
const today = new Date().toISOString().split('T')[0] // "2026-06-04"
const filePath = `<VAULT_PATH>/Daily/${today}.md`

// If file exists → append
// If file doesn't exist → create with header
```

**In Claude Code / Cowork** — use `bash_tool` or `create_file` / `str_replace`:

```bash
FILE="<VAULT_PATH>/Daily/$(date +%Y-%m-%d).md"

if [ -f "$FILE" ]; then
  # Append with separator
  echo "" >> "$FILE"
  echo "---" >> "$FILE"
  cat << 'EOF' >> "$FILE"
[NEW CONTENT HERE]
EOF
else
  # Create new file
  cat << 'EOF' > "$FILE"
[NEW CONTENT HERE]
EOF
fi
```

**In Claude.ai** (no filesystem access) — generate a markdown block the user can copy, and offer a `.md` file for download.

---

## Entry format

Each entry follows this structure (skip empty sections):

```markdown
## HH:MM — [Short topic title]

### 💬 What we discussed
Brief summary (2–5 sentences). What the context was, what was being solved.

### 💡 Key insights / Decisions
- Point 1
- Point 2

### ✅ Tasks
- [ ] Task 1
- [ ] Task 2

### 🔧 Technical details
Code, architecture, commands — if relevant. Use code blocks.

### 🔗 Sources & Links
- [Name](url)

### 📚 Knowledge Base
- [[KB Note Title]] — one-liner on why it's related
```

**Formatting rules:**
- Timestamp = time of the entry (not the whole day)
- Language = match the conversation language (SK/EN)
- Be specific, not vague — "decided to use Drizzle instead of Prisma because of X" not "discussed DB"
- Preserve code snippets if they were important
- **Knowledge Base links:** if a KB note was created or already exists that covers a topic from this conversation, add a `### 📚 Knowledge Base` section at the end and link it with `[[wikilink]]`. Don't repeat the KB content — just point to it. E.g.: `[[Drizzle Migrations]] — migration workflow we settled on today`

---

## New file header

If the daily note doesn't exist yet, create it with this header:

```markdown
# Daily Note — 2026-06-04

> *"..."* <!-- optional quote, can be omitted -->

---
```

---

## Relationship to the Knowledge Base

Daily Notes = chronological per-day log (usually in SK). The Knowledge Base = evergreen English reference. They run in parallel and complement each other:

- Time-bound events, decisions, tasks → Daily Notes
- Durable, reusable knowledge → Knowledge Base
- **When both are relevant:** write the durable substance to KB, keep only a short pointer in the daily entry — e.g. "today we decided X → see [[Topic Title]]"
- Linking is one-directional: Daily Notes → KB (via `[[wikilinks]]`), not the other way round

---

## Proactive suggestion at end of conversation

If the conversation had meaningful content and the user didn't propose saving it, say at the end:

> 📓 **Save to Obsidian?** I have [X points / decision about Y / task Z] from this conversation. Want a preview?

Don't be pushy — offer once, if declined, drop it.
