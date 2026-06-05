---
name: obsidian-daily-notes
description: Zapisuje poznámky, sumarizácie konverzácií, tasky a nápady do Obsidian daily notes priamo na disku. Použi tento skill vždy keď používateľ povie "zapiš do Obsidianu", "daily note", "ulož si to", "zapamätaj si", alebo na konci každej konverzácie proaktívne navrhni zápis ak prebehla zmysluplná diskusia. Skill formátuje a sumarizuje obsah sám — používateľ nemusí nič špeciálne formulovať.
---

# Obsidian Daily Notes Skill

## Konfigurácia

```
VAULT_PATH: /Users/adrianvyskoc/Documents/Second brain
DAILY_FOLDER: Daily
DATE_FORMAT: YYYY-MM-DD (napr. 2026-06-04.md)
FULL_PATH: /Users/adrianvyskoc/Documents/Second brain/Daily/YYYY-MM-DD.md
```

## Kedy použiť

- Používateľ explicitne povie "zapiš do Obsidianu", "daily note", "ulož si to", "zapamätaj si to"
- **Na konci každej zmysluplnej konverzácie** — proaktívne navrhni zápis s preview obsahu
- Po dokončení technického riešenia, debaty, alebo brainstormingu

---

## Workflow

### 1. Analyzuj konverzáciu

Pred zápisom identifikuj čo stojí za zachovaním:
- Rozhodnutia ktoré padli
- Technické riešenia / kód / architektúra
- Tasky ktoré vyplynuli
- Zaujímavé myšlienky / nápady
- Zdroje / odkazy

Nezapisuj triviálne small talk ani veci bez hodnoty.

### 2. Navrhni obsah (preview)

Vždy najprv **ukáž používateľovi čo chystáš zapísať** a opýtaj sa či súhlasí, chce niečo pridať/odobrať, alebo upraviť. Formátuj ako finálny markdown aby videl presne čo pôjde do súboru.

### 3. Po schválení — zapis do súboru

```javascript
// Pseudokód logiky
const today = new Date().toISOString().split('T')[0] // "2026-06-04"
const filePath = `/Users/adrianvyskoc/Documents/Second brain/Daily/${today}.md`

// Ak súbor existuje → append
// Ak neexistuje → vytvor s hlavičkou
```

**V Claude Code / Cowork** — použi `bash_tool` alebo `create_file` / `str_replace`:

```bash
# Skontroluj či súbor existuje
FILE="/Users/adrianvyskoc/Documents/Second brain/Daily/$(date +%Y-%m-%d).md"

if [ -f "$FILE" ]; then
  # Append s oddeľovačom
  echo "" >> "$FILE"
  echo "---" >> "$FILE"
  cat << 'EOF' >> "$FILE"
[NOVÝ OBSAH TU]
EOF
else
  # Vytvor nový súbor
  cat << 'EOF' > "$FILE"
[NOVÝ OBSAH TU]
EOF
fi
```

**V Claude.ai** (bez prístupu k filesystému) — vygeneruj markdown blok ktorý používateľ skopíruje, a ponúkni `.md` file na stiahnutie.

---

## Formát záznamu

Každý zápis má túto štruktúru (sekcie vynechaj ak sú prázdne):

```markdown
## HH:MM — [Krátky názov témy]

### 💬 O čom sme hovorili
Stručná sumarizácia (2-5 viet). Čo bol kontext, čo sa riešilo.

### 💡 Kľúčové poznatky / Rozhodnutia
- Bod 1
- Bod 2

### ✅ Tasky
- [ ] Task 1
- [ ] Task 2

### 🔧 Technické detaily
Kód, architektúra, príkazy — ak relevantné. Použi code bloky.

### 🔗 Zdroje & Odkazy
- [Názov](url)
```

**Pravidlá formátovania:**
- Timestamp = čas záznamu (nie celý deň)
- Jazyk = podľa jazyka konverzácie (SK/EN)
- Buď konkrétny, nie vágny — "rozhodli sme sa použiť Drizzle namiesto Prisma kvôli X" nie "riešili sme DB"
- Code snippety zachovaj ak boli dôležité

---

## Hlavička nového súboru

Ak daily note ešte neexistuje, vytvor ju s touto hlavičkou:

```markdown
# Daily Note — 2026-06-04

> *"..."* <!-- voliteľný quote, môžeš vynechať -->

---
```

---

## Proaktívny návrh na konci konverzácie

Ak konverzácia mala zmysluplný obsah a používateľ sám nenavrhol zápis, na konci povedz:

> 📓 **Zapísať do Obsidianu?** Mám z tejto konverzácie [X bodov / rozhodnutie o Y / task Z]. Ukážem ti preview?

Nebuď otravný — navrhni raz, ak odmietne, nerieš.
