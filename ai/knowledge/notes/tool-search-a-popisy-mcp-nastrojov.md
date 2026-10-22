---
description: Pri tool search sa model rozhoduje podľa názvov a popisov, preto ich píš s dôležitým na začiatku a drž krátke.
category: Kontext & nástroje
tags: [mcp, kontext, agentic]
overenie: Primárny zdroj
added: 2026-10-22
updated: 2026-10-22
---

# Tool search: popisy MCP nástrojov a server instructions

## Čo to je
Tool search odkladá definície nástrojov, kým ich model nepotrebuje. Na štarte sa načítajú len názvy nástrojov a server instructions. Model potom nástroje vyhľadá podľa dopytu a popisu. Kvalita názvov a popisov rozhoduje, či nástroj nájde.

## Prečo na tom záleží
Pridanie ďalšieho MCP servera tak zaťaží kontext len minimálne, ale nástroj s popisom, ktorý model nenájde, sa nepoužije. Dokumentácia Claude Code uvádza, že pevný limit počtu nástrojov na server neexistuje a praktickým limitom je rozpočet kontextu. Dopĺňa [[mcp-nastroje-per-tool-schvalovanie]]: tam je dôvod držať nástroje úzke, tu dôvod písať ich popisy tak, aby sa dali nájsť.

## Ako na to
Prvý krok (cca 10 min): otvor popisy nástrojov svojho servera a premiesť do prvých viet slová, ktorými by model nástroj hľadal.

1. Vyplň server instructions: aké úlohy nástroje riešia, kedy ich má model hľadať, aké sú hlavné schopnosti.
2. Kritické veci daj na začiatok. Claude Code text za limitom odreže a tool search pri hľadaní číta len časť v rámci kratšieho limitu.
3. Limity v dokumentácii (stav k 2026-10-22): server instructions a popis upfront nástroja 4 096 znakov; popis nástroja načítaného cez tool search 16 384 znakov. Pred v2.1.296 bol kratší limit 2 048. Ber to ako ilustráciu, čísla sa menia; zásada (dôležité na začiatok) platí aj bez nich.
4. Nástroj, ktorý musí byť vždy po ruke, je výnimka (per-tool „alwaysLoad" podľa dokumentácie); inak nechaj odkladanie zapnuté.
5. Podľa changelogu je od v2.1.304 tool search zapnutý aj za vlastným `ANTHROPIC_BASE_URL` (pri 400 alebo 422 z gateway sa požiadavka zopakuje bez neho). Ak používaš LLM gateway, over, že nástroje nájde.

## Overenie zdrojov
- Správanie tool search, server instructions a limity: overené v dokumentácii MCP v Claude Code.
- Zmena v2.1.304: overená v changelogu Claude Code.
- Názov nastavenia `alwaysLoad` som prevzal len z odkazu v dokumentácii (kotva „per-tool-alwaysload"); presnú syntax neoveruj z tejto poznámky.
- Vercel AI SDK 7 má tiež `toolSearch()`; overené len v druhej ruke (developersdigest.tech), preto tu nie je.

## Zdroje
- [Claude Code: MCP, Scale with MCP tool search](https://code.claude.com/docs/en/mcp)
- [Claude Code changelog](https://code.claude.com/docs/en/changelog)
