---
description: Zhrň to, na čom sme robili, ako rýchly sumár pre kolegu — tak aby to nevyzeralo, že to písala AI. Default je raw lowercase štýl bez diakritiky; voliteľne iný register/jazyk.
argument-hint: [voliteľne: register 1|2|3, "po anglicky", "jedna veta", "s diakritikou"]
---

Vyvolaj skill **`human-summary`** a napíš ním sumár toho, čo sme v tejto konverzácii riešili (bug, zmena, čo bolo spravené, na čo si dať pozor). Pravidlá štýlu, registre, zoznam AI tells a checklist sú v tom skille — riaď sa nimi.

Arguments: `$ARGUMENTS` — voliteľné. Môže obsahovať:

- **register** — `1` (čistý, hlavičky + diakritika), `2` (sekcie, bez diakritiky), `3` (raw kolega — default). Ak nie je uvedený, použi default register 3.
- **jazyk** — napr. „po anglicky" / „in english". Default slovenčina.
- **dĺžka** — napr. „jedna veta", „dlhsie". Default 3–6 viet.
- **diakritika / veľké písmená** — dajú sa vyžiadať samostatne (napr. „s diakritikou").

Ak v konverzácii nie je o čom robiť sumár, nevymýšľaj — povedz to a opýtaj sa, čo presne zhrnúť.

Daj len samotný sumár — žiadny úvod typu „tu je sumár", žiadny komentár pod ním (pokiaľ sa používateľ nepýta).
