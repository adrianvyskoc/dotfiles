---
description: Čo mení MCP spec 2026-07-28 (bezstavový protokol) a čo to znamená pre návrh servera.
category: MCP
tags: [mcp]
overenie: Primárny zdroj
added: 2026-10-22
updated: 2026-10-22
---

# Bezstavový MCP server (spec 2026-07-28)

## Čo to je
MCP server drž bezstavový; stav patrí do databázy a odkazuje sa naň identifikátorom. Spec 2026-07-28 to robí súčasťou protokolu.

## Prečo na tom záleží
Server sa dá prevádzkovať ako bežný request-scoped handler (Hono na Node.js alebo na edge) bez sticky sessions.

## Ako na to
Prvý krok (cca 10 min): v kóde servera vyhľadaj `Mcp-Session-Id`, initialize handler a stav držaný v pamäti spojenia. Zoznam je tvoj migračný dlh.

Hlavné zmeny v spec 2026-07-28:

1. Odpadá handshake initialize a hlavička `Mcp-Session-Id`; každý request nesie verziu protokolu a schopnosti klienta v `_meta`.
2. Schopnosti servera zistíš metódou `server/discover`.
3. Hlavičky `Mcp-Method` a `Mcp-Name` sú povinné na POST requestoch, takže sa dá smerovať bez parsovania tela.
4. Stav ide cez explicitné identifikátory (handle), ktoré model vráti ako bežné argumenty nástroja.
5. Roots, Sampling, Logging, Dynamic Client Registration (nahrádzajú ho Client ID Metadata Documents) a HTTP+SSE sú Deprecated; zostávajú funkčné minimálne 12 mesiacov a nové implementácie ich nemajú začať používať.
6. `ping` a `logging/setLevel` sú odstránené; úroveň logov sa nastavuje per request cez `_meta`.

## Overenie zdrojov
- Body 1 až 6 sú overené v oficiálnom changelogu špecifikácie 2026-07-28.
- Stav finálnych SDK nebol overený. Pred migráciou skontroluj, či tvoj SDK spec už podporuje.

## Zdroje
- [MCP spec 2026-07-28: Key Changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP 2026-07-28 (AAIF)](https://aaif.io/blog/mcp-2026-07-28-whats-changing-and-how-to-migrate)
- [Cloudflare: The next generation of MCP](https://blog.cloudflare.com/mcp-v2/)
