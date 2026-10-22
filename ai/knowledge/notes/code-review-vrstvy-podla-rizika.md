---
description: Review je sústava vrstiev kontrol škálovaná podľa rizika zmeny, nie otázka „prečítal to človek".
category: Agenti & workflow
tags: [agentic, guardrails, evaly]
overenie: Primárny zdroj
added: 2026-10-22
updated: 2026-10-22
---

# Code review ako vrstvy kontrol podľa rizika

## Čo to je
Namiesto otázky „prečítal každý riadok človek?" sa pýtaj: čo sa môže pokaziť a ktorá kontrola (automatická alebo ľudská) to má zachytiť. Tím Claude Code opisuje review ako rad vrstiev a ľudský čas míňa tam, kde je riziko.

## Prečo na tom záleží
Keď agent píše väčšinu kódu, ľudský review sa stáva úzkym miestom. Anthropic uvádza cieľ: najmenej ľudského času na review, ktorý nezvýši počet revertov a incidentov. Zdroj popisuje ich vlastný postup, nie univerzálne meranie.

## Ako na to
Prvý krok (cca 15 min): pridaj do repa PR šablónu s tromi poľami „Testing", „Risk", „How to revert". Je to prvá vec, ktorú zdroj odporúča pri zavádzaní.

Vrstvy podľa zdroja (od najlacnejšej):

1. Pred PR: Claude spustí testy alebo build a ukáže výstup, nie tvrdenie; subagent skontroluje diff v čistom kontexte.
2. AI review na každom PR; nálezy overujú iní agenti, publikujú sa len podložené, každý sa opraví alebo zdôvodní.
3. Bezpečnostný review, ktorého otvorené nálezy blokujú merge.
4. Povinné CI: lint, typy, testy, build.
5. Ľudský súhlas podľa rizika (nízke bez človeka, stredné jeden, vysoké dvaja); súhlas agenta sa nepočíta ako ľudský a viaže sa na konkrétny commit.
6. Merge queue, feature flagy, postupné nasadenie; rýchle vypnutie bez deployu.

Konfigurácia podľa zdroja: krátky `CLAUDE.md`, súbor `REVIEW.md` od vlastníkov kódu (čo je zlyhanie v tomto repe, limit na nity, cesty na preskočenie), `CODEOWNERS` a branch protection pre auth, billing a CI. Opakujúce sa nálezy oprav pri zdroji (skill, lint pravidlo, CLAUDE.md). Z minulých incidentov a revertov urob eval set a prehodnoť reviewera pri zmene promptov či modelu.

## Overenie zdrojov
- Obsah vrstiev, `REVIEW.md`, tri úrovne rizika a eval set: overené v pôvodnom článku Anthropic (doména claude.dev, mimo zoznamu primárnych domén; autor a vydavateľ sú Anthropic).
- Citáciu na Willisonovom blogu som použil len na lokalizáciu článku.
- Funkcie Code Review (Quick/Standard/Deep) sú podľa zdroja pre plány Team a Enterprise; nepoužívaš ich, preto ich v krokoch nepredpokladám.

## Zdroje
- [How the Claude Code team does code review](https://claude.dev/blog/solving-code-review-at-anthropic/)
- [Simon Willison: Code review quote (2026-10-16)](https://simonwillison.net/2026/Oct/16/code-review/)
