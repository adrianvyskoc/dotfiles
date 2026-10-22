---
description: Ako navrhnúť MCP nástroje, aby sa dali povoliť alebo zakázať po jednom.
category: MCP
tags: [agentic, mcp, bezpečnosť]
overenie: Zmiešané
added: 2026-10-22
updated: 2026-10-22
---

# Návrh MCP nástrojov pre per-tool schvaľovanie

## Čo to je
Navrhuj MCP nástroje tak, aby sa dali povoliť alebo zakázať po jednom. Klient ti inak nedá nič medzi „všetko" a „nič".

## Prečo na tom záleží
n8n 2.45.0 (20. 10. 2026) v release notes uvádza „Overhaul MCP tool permissions for Agents", „Don't save MCP connections without user approval" a „Show the policy reason when an agent tool call is refused". Ide len o názvy zmien; ako presne oprávnenia fungujú, nie je overené. Verzia je na GitHube označená ako Pre-release.

## Ako na to
Prvý krok (cca 10 min): prejdi zoznam nástrojov svojho servera a označ každý ako read alebo write. Univerzálne nástroje (`run_query`, `execute`) si poznač na rozdelenie.

1. Oddeľ read a write nástroje; čítanie nesmie zdieľať nástroj s mutáciou.
2. Nahraď univerzálne nástroje úzkymi; univerzálny sa dá povoliť len celý.
3. Chybové hlášky píš tak, aby bolo jasné, prečo bolo volanie odmietnuté.
4. Mutácie (Drizzle) rob idempotentné alebo s explicitným identifikátorom operácie.
5. Nepreháňaj granularitu: veľa nástrojov zaťažuje kontext modelu.

## Overenie zdrojov
- Tvrdenia o n8n sú z primárneho release na GitHube, ale len na úrovni názvov zmien.
- Kroky v sekcii Ako na to nemajú zdroj; je to syntéza, ber ich ako hypotézu.

## Zdroje
- [n8n 2.45.0 release](https://github.com/n8n-io/n8n/releases/tag/n8n%402.45.0)
