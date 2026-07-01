---
name: human-summary
description: Napíše sumár (bug, zmena, čo som dnes robil, odovzdávka kolegovi) tak, aby vyzeral, že to rýchlo naťukal človek — žiadne AI tells. Spusti IBA na explicitné vyvolanie cez /human-summary alebo priame požiadanie ("zhrň to ako kolegovi", "napíš to po ľudsky"). NIKDY sa neaktivuj automaticky ani na konci konverzácie.
user_invocable: true
---

# Human-summary

Spraví z toho, čo sme práve riešili, krátky sumár, ktorý znie ako keď ho naťukal kolega do Slacku — nie ako keď ho vygenerovala AI. Cieľ číslo jedna: **aby na tom nikto nespoznal AI.**

## Kedy sa spúšťa

Iba keď ho výslovne zavoláš (`/human-summary`) alebo keď používateľ priamo povie nech to zhrnie po ľudsky / pre kolegu. **Nikdy** sa nespúšťa sám, ani ako proaktívny návrh na konci konverzácie. Toto je manuálny nástroj.

## Default štýl (register 3 — "raw kolega")

Ak používateľ nepovie inak, píš takto:

- **jeden súvislý text, žiadne odstavce, žiadne hlavičky, žiadne odrážky**
- **všetko malými písmenami** (aj začiatok vety, aj názvy)
- **bez diakritiky** — slovenčina naťukaná na klávesnici „po anglicky" (nie „č/š/ž/á", ale „c/s/z/a")
- **žiadny markdown** — nič tučné, žiadne `#`, žiadne `-` zoznamy
- **žiadny pozdrav ani úvod** — žiadne „cau", „ahoj", „takze tu je...". Rovno do veci, prvé slovo je samotný obsah (napr. „ten bug s ...", „spravil som ...").
- technické názvy nechaj tak ako sú (`sessionStorage`, `channelSetId`, `BE`, `useXyz`, názvy funkcií/súborov)
- konči s „tldr: ..." — jedna veta, čo to bolo / čo sa spravilo
- krátko, vecne, mierne nedokonalo — tak ako píše unavený človek čo to chce mat za sebou

Príklad výstupu (presne tento register):

> ten bug s epg filtrom: ked si vyberies skupinu kanalov tak sa aj tak ukazu vsetky, filter sa neaplikoval. problem bol ze vybrana skupina sa do sessionStorage ulozila ok, ale do requestu na BE sa neposlala (islo to bez channelSetId takze BE vratil vsetko). cital sa to cez cachovany pinia getter a navyse cez inu instanciu useSessionStorage nez do akej sa to zapisovalo, takze tie dve veci sa spoliehali ze sa nejak zosynchronizuju a vacsinou jo ale obcas getter vratil staru prazdnu hodnotu aj ked v storage uz bola nova, preto to bol taky random tazko reproducovatelny bug. fixol som to tak ze je to teraz jedna zdielana referencia, getter aj setter citaju/pisu to iste, zmena sa prejavi hned a request uz vzdy obsahuje vybranu skupinu. tldr citalo to zastaralu kopiu namiesto aktualnej hodnoty

## Hlavné pravidlo: žiadne AI tells

Toto je jadro skillu. Aj keby zvyšok sedel, jediný z týchto znakov prezradí AI. **Nikdy** nepoužívaj:

- **pomlčku „—" (em dash)** — najväčší AI tell vôbec. Namiesto nej daj čiarku, zátvorku, alebo to proste spoj slovom (a/takze/lebo).
- **typografické úvodzovky** „ " ' ' a podobné — buď žiadne, alebo obyčajné `"`.
- **prechodové slová z eseje**: „okrem toho", „taktiež", „navyše" (v zmysle formálnom), „je dôležité poznamenať", „stojí za zmienku", „v neposlednom rade", „záverom", „v skratke", „celkovo vzaté".
- **dokonale vyvážený zoznam troch vecí** („rýchle, spoľahlivé a škálovateľné") — ľudia takto nehovoria.
- **konštrukciu „nie len X, ale aj Y"**.
- **markdown formátovanie** v raw režime — žiadne **tučné**, hlavičky, odrážky.
- **emoji**, ak ich daný človek bežne nepoužíva.
- **vatu na úvod** typu „Jasné!", „Skvelá otázka", „Tu je zhrnutie:".
- **vysvetľovanie samozrejmostí** kolegovi, čo kontext pozná — predpokladaj zdieľané znalosti.
- **prehnane čistú interpunkciu** — bodkočiarky, dvojbodky pred zoznamom. V raw režime nech to plynie.

## Čo naopak áno (ľudské signály)

- rôzne dlhé vety, pokojne aj jeden zlomok/útržok
- spojky a vsuvky ako „takze", „proste", „btw", „fakt", „ono to", „a tak"
- hovorové slovesá: „fixol som", „spravil som", „dotiahol som", „rozbilo sa to"
- občas mierna neformálnosť/preklep úrovne reálneho rýchleho písania (neprehnať, nie nečitateľné)
- vec povedz priamo, bez obalov

## Knoby (keď používateľ chce iný register)

Default je register 3. Ak používateľ povie inak, prepni:

| Register | Kedy | Ako vyzerá |
|----------|------|-----------|
| **1 — čistý** | „daj mi to poriadne / formálne / na ticket" | hlavičky **Problém / Prečo / Kde bola chyba / Riešenie / Jednou vetou**, plná diakritika, tučné, code refs. Aj tu ale platia anti-AI pravidlá (žiadny em dash, žiadne eseje). |
| **2 — stredný** | „bez diakritiky ale prehladne" | tie isté sekcie (Problem / Preco / Kde bola chyba / Fix / tldr), bez diakritiky, bez tučného. |
| **3 — raw kolega** | default, „pre kolegu", „po ludsky", „do slacku" | jeden odsek, lowercase, bez diakritiky, bez pozdravu/úvodu, rovno do veci, končí „tldr ..." |

Ďalšie knoby, ktoré môže používateľ pridať:
- **jazyk** — ak chce po anglicky, drž rovnaký princíp (lowercase, žiadne AI tells, casual).
- **dĺžka** — „jedna veta" / „dlhsie", inak default je 3–6 viet.
- **diakritika ano/nie**, **velke pismena ano/nie** — dajú sa vyžiadať samostatne nezávisle od registra.

## Postup

1. Vytiahni z konverzácie, čo treba zhrnúť (problém, príčina, fix, dopad). Ak nie je o čom, povedz to a opýtaj sa.
2. Zisti register — default 3, inak podľa toho čo používateľ povedal.
3. Napíš to v danom štýle.
4. Prejdi checklist nižšie a oprav, čo prešlo.
5. Daj len samotný sumár. Žiadny úvod typu „tu je sumár", žiadny komentár pod ním (pokiaľ sa nepýta).

## Checklist pred odovzdaním

- [ ] žiadny em dash „—" nikde
- [ ] žiadne typografické úvodzovky
- [ ] žiadne esejové prechodové slová ani rule-of-three
- [ ] register 3: všetko malé, bez diakritiky, jeden odsek, bez markdownu, končí „tldr ..."
- [ ] technické názvy nedotknuté
- [ ] znie to ako rýchly Slack od kolegu, nie ako vygenerovaný text
- [ ] žiadny meta-úvod ani meta-záver, len holý sumár
