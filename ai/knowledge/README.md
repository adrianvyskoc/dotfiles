# knowledge/ — AI-dev znalostná báza

Náučná dokumentácia k vývoju s AI a k agentickým systémom. Plní sa týždenne z výskumu AI tooling noviniek (naplánovaný task, pondelok ráno). Je to obyčajný markdown, takže ho Claude Code číta priamo z disku, bez MCP.

Nie je to asset pre `aic` — nekopíruje sa do projektov. Po `setup.sh` je dostupná na `~/.ai/knowledge/`, napr. `@~/.ai/knowledge/README.md` v `CLAUDE.local.md` projektu, kde ju chceš mať v kontexte.

Čo sa kedy pridalo, vidno vo [`FEED.md`](FEED.md).

## Pravidlá

1. Jedna téma = jeden súbor `notes/<kebab-slug>.md`. Pred pridaním skontroluj index nižšie; ak téma existuje, uprav ju, nevytváraj druhú.
2. Poznámka je učebný text, nie prerozprávanie správy: platí z nej zásada aj o rok. Správa z týždňa je len ilustrácia s dátumom.
3. Dátumy: `added` a `updated` vo frontmatteri; dátumy udalostí v texte len ako príklad.
4. Zastarané sa nenechávajú. Zmenilo sa niečo podstatné: uprav poznámku na mieste a nastav `updated`. Téma stratila platnosť: zmaž súbor a zapíš to do feedu. História je v gite.
5. Každé tvrdenie má oporu v zdroji. Čo je len z agregátora alebo druhej ruky, je to výslovne označené v sekcii Overenie zdrojov a vo frontmatteri.
6. Index nižšie a `FEED.md` sa aktualizujú v tom istom commite ako poznámky.

## Šablóna poznámky

```markdown
---
description: jedna veta, o čom poznámka je
category: Guardrails & bezpečnosť | MCP | Agenti & workflow | Modely & ceny | Kontext & nástroje
tags: [agentic, guardrails, mcp, ceny, evaly, kontext, bezpečnosť]
overenie: Primárny zdroj | Zmiešané | Len agregátor alebo druhá ruka | Neoverené
added: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Názov

## Čo to je
## Prečo na tom záleží
## Ako na to
## Príklad
## Overenie zdrojov
## Zdroje
```

Sekcia Príklad je voliteľná. Ostatné sú povinné.

## Index

### Guardrails & bezpečnosť

- [Hooky vynucujú konvencie, inštrukcie len usmerňujú](notes/hooky-vynucuju-konvencie.md) — pravidlá pre agenta vynucuj hookom, nie textom · pridané 2026-10-22 · aktualizované 2026-10-22 · Zmiešané
- [Guardrails agenta mimo jeho write scope](notes/guardrails-mimo-write-scope.md) — kontroly nesmú ležať tam, kam agent smie zapisovať · pridané 2026-10-22 · aktualizované 2026-10-22 · Zmiešané

### MCP

- [Bezstavový MCP server (spec 2026-07-28)](notes/mcp-bezstavovy-server.md) — čo mení bezstavový protokol a ako migrovať · pridané 2026-10-22 · aktualizované 2026-10-22 · Primárny zdroj
- [Návrh MCP nástrojov pre per-tool schvaľovanie](notes/mcp-nastroje-per-tool-schvalovanie.md) — read/write oddelene a úzke nástroje · pridané 2026-10-22 · aktualizované 2026-10-22 · Zmiešané

### Agenti & workflow

- [Code review ako vrstvy kontrol podľa rizika](notes/code-review-vrstvy-podla-rizika.md) — ľudský review škáluj podľa rizika zmeny · pridané 2026-10-22 · aktualizované 2026-10-22 · Primárny zdroj

### Kontext & nástroje

- [Tool search: popisy MCP nástrojov a server instructions](notes/tool-search-a-popisy-mcp-nastrojov.md) — dôležité na začiatok popisu, aby ich model našiel · pridané 2026-10-22 · aktualizované 2026-10-22 · Primárny zdroj

Formát riadku: `- [Názov](notes/slug.md) — jedna veta · pridané YYYY-MM-DD · aktualizované YYYY-MM-DD · overenie`, zoskupené pod nadpisom kategórie.
