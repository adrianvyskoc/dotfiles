---
name: obsidian-knowledge-base
description: Ukladá a manažuje kurátorovaný Knowledge Base v Ado-vom Obsidian vaulte — trvalé, tematické (evergreen) poznámky, oddelené od Daily Notes. Použi keď používateľ povie "ulož do knowledge base", "zapíš to do KB", "pridaj do knowledge base", alebo na konci zmysluplnej konverzácie proaktívne navrhni KB záznam ak vznikol znovupoužiteľný poznatok (technické riešenie, rozhodnutie, koncept, postup, prehľad). Skill sám vyberie kategóriu, vytvorí novú ak treba, a jednu tému zapíše do jedného .md súboru. Knowledge Base sa píše po anglicky (default).
---

# Obsidian Knowledge Base Skill

Maintains a curated, topic-centric Knowledge Base in Ado's Obsidian vault. Distinct from `obsidian-daily-notes` (which is a chronological per-day log). The Knowledge Base is **evergreen**: durable, deduplicated, reusable knowledge.

## Configuration

```
VAULT_PATH:   /Users/adrianvyskoc/Library/Mobile Documents/iCloud~md~obsidian/Documents/Second brain
KB_ROOT:      <VAULT_PATH>/Knowledge Base
INDEX:        <KB_ROOT>/_index.md       # Map of Content
TAXONOMY:     <KB_ROOT>/_taxonomy.md    # canonical structure + category registry
LANGUAGE:     English (default, unless the user asks otherwise for a note)
```

In the bash sandbox the vault may appear at `/sessions/<id>/mnt/Second brain` — translate accordingly. Never expose the raw sandbox path to the user.

## When to use

- User explicitly says "ulož do knowledge base", "zapíš do KB", "add to knowledge base", "pridaj to do KB".
- **At the end of a meaningful conversation** — proactively offer a KB entry if a reusable insight emerged (technical solution, architecture decision, concept explainer, how-to, comparison/overview).
- Do NOT use for ephemeral chit-chat, or for purely time-bound events (those belong in Daily Notes).

## Core rules

1. **One note = one topic.** Each `.md` covers a single self-contained subject.
2. **Category = folder.** Topics live in category folders under `KB_ROOT`; categories may nest sub-categories.
3. **Match before create.** Place into an existing category when it reasonably fits; create a new category only when nothing fits. Keep the tree shallow.
4. **No duplicates.** If a note for the topic already exists, UPDATE it in place (merge new info, bump `updated:`), don't create a second file.
5. **English by default.**
6. **Preview before writing.** Always show the proposed note + chosen path, get approval, then write.

## Workflow

### 1. Read the taxonomy first
Read `TAXONOMY` (`_taxonomy.md`) to load the current category registry and naming rules. Also glance at existing folders/files under `KB_ROOT` so you match conventions and detect an existing note on the topic.

```bash
cat "<KB_ROOT>/_taxonomy.md"
find "<KB_ROOT>" -name '*.md' -not -name '_*' | sort
```

### 2. Distill the topic
From the conversation, identify the ONE reusable topic worth keeping. Strip the conversational noise; keep the durable substance — what it is, the key facts/decisions, code/architecture if relevant, and links.

### 3. Decide placement
- Find the best existing category from `_taxonomy.md`.
- If none fits and you'd expect more than one note there over time, define a NEW category (Title Case folder). Prefer broad, durable categories over narrow ones (a narrow subject is a note or sub-category, not a top-level category).
- Decide the note filename (`Title Case.md`). Check whether such a note already exists → update vs create.

### 4. Preview
Show the user:
- Target path: `Knowledge Base/<Category>/<Title>.md` (new note) or "update existing note X".
- Whether a new category will be created.
- The full markdown content.

Ask for approval / edits. Don't be pushy — offer once.

### 5. Write
- Create the category folder if new.
- Write the note (see format below). On update, merge and set `updated:` to today.
- Update `_index.md`: add the note/category link if not present.
- Update `_taxonomy.md`: if a new category was created, register it with a one-line scope + example, and bump `updated:`.

### 6. Confirm
Briefly tell the user what was written/updated and where. Present the file(s).

## Note format

```markdown
---
title: <Topic Title>
category: <Category name>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [<lowercase-kebab tags>]
---

# <Topic Title>

## Summary
1–3 sentences: what this is and why it matters.

## <Body sections as fit the topic>
Be concrete, not vague. Keep code blocks if they were important. Use prose;
reserve bullets for genuine lists.

## Related
- [[Other Note]] links
```

Rules: `created:` never changes; bump `updated:` on every edit. Use `[[wikilinks]]` to connect related notes. Match the conventions in `_taxonomy.md`.

## Relationship to Daily Notes

`obsidian-daily-notes` = chronological log of a day, in the conversation language (usually SK). This skill = evergreen English reference. They run in parallel. At the end of a conversation either or both may apply — a vet visit goes to Daily Notes; "how Drizzle migrations work" goes to the Knowledge Base. Offer the relevant one(s); don't duplicate the same content into both.

**Cross-linking (Daily ↔ KB).** Daily Notes may link to Knowledge Base notes with `[[wikilinks]]`. When both a daily entry and a KB note come out of the same conversation, the daily note should reference the KB note instead of repeating its content — e.g. the daily note keeps the time-bound log ("today we decided X") and links `→ see [[Topic Title]]` for the durable detail. So the daily note stays a lightweight pointer and the KB note holds the evergreen substance. Linking is one-directional by default (Daily → KB); KB notes link to other KB notes, not to dated daily notes.

## Proactive proposal (end of conversation)

If a reusable insight emerged and the user didn't ask, offer once:

> 🧠 **Save to Knowledge Base?** This looks like a durable topic — *[Title]* under *[Category]*. Want a preview?

If declined, drop it.
