---
description: Konvencie pre agenta vynucuj hookom, ktorý zlyhá hlasno, nie len textom v CLAUDE.md alebo AGENTS.md.
category: Guardrails & bezpečnosť
tags: [agentic, guardrails, kontext]
overenie: Zmiešané
added: 2026-10-22
updated: 2026-10-22
---

# Hooky vynucujú konvencie, inštrukcie len usmerňujú

## Čo to je
Pravidlo, ktoré sa dá skontrolovať strojovo (napr. „logovanie vždy cez našu wrapper knižnicu"), patrí do hooku. Hook odmietne akciu a agentovi vráti vysvetlenie, čo má urobiť namiesto toho. Text v CLAUDE.md je len odporúčanie, ktoré sa môže rozísť s kódom.

## Prečo na tom záleží
Geoffrey Huntley (podľa citácie na Simon Willisonovom blogu) nechal AGENTS.md bez zmien a namiesto toho nasadil pre-commit hook. Ten prezrie staged diff, a keď nájde priamy import alebo volanie knižnice mimo firemného diagnostického wrapperu, commit odmietne a agentovi pošle správu, ktorý modul má použiť. Výsledkom je podľa neho takmer dokonalé dodržiavanie. Je to jedna prax jedného autora, nie meranie.

## Ako na to
Prvý krok (cca 10 min): vyber jedno pravidlo, ktoré agent v tvojom repe opakovane porušuje, a napíš pre neho skript, ktorý skončí s exit kódom 2 a vysvetlením na stderr.

1. V Claude Code je hook typu `PreToolUse` s matcherom `Bash` a poľom `if: "Bash(git commit *)"` najbližší ekvivalent pre-commit kontroly. Claude Code nespúšťa `.git/hooks`.
2. Exit kód 2 akciu zablokuje a stderr dostane Claude ako dôvod. Exit kód 1 akciu neblokuje (je to „non-blocking error"); na vynucovanie používaj 2.
3. Pole `onFailure: "block"` (od v2.1.295, platí pre `command` a `http` hooky) zabezpečí, že hook, ktorý sa nespustí, vyprší alebo skončí inak než 0 či 2, akciu zablokuje. Bez neho sa pri zlyhaní hooku akcia vykoná.
4. Filter `if` je podľa dokumentácie best-effort; na tvrdé vynútenie použi permission systém.
5. Správu v stderr píš ako návod („použi `diag.log()`, nie `console.log`"), nie len „zamietnuté".
6. Hook skript a jeho konfiguráciu drž mimo write scope agenta, pozri [[guardrails-mimo-write-scope]].

## Príklad
Drizzle: hook odmietne commit, ak diff obsahuje `db.execute(sql\`...\`)` mimo priečinka `src/db/queries/`, a v správe odkáže na existujúci helper. (Ilustračný príklad, nie zo zdroja.)

## Overenie zdrojov
- Exit kódy, `PreToolUse`, pole `if` a `onFailure` (vrátane verzie 2.1.295): overené v dokumentácii hookov Claude Code; verzia aj v changelogu.
- Huntleyho prax: len cez citáciu a parafrázu na Willisonovom blogu (úroveň B), pôvodný zdroj som neotváral.
- Tvrdenie „takmer dokonalé dodržiavanie" je autorovo, nie zmerané.
- Príklad s Drizzle je moja ilustrácia.

## Zdroje
- [Claude Code: Hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code changelog](https://code.claude.com/docs/en/changelog)
- [Simon Willison: Geoffrey Huntley quote on agent guardrails (2026-10-13)](https://simonwillison.net/2026/Oct/13/geoffrey-huntley/)
