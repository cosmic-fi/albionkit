# Contributing Translations

Thank you for helping translate AlbionKit! This guide walks you through the process.

## Quick Start

1. **Choose a locale** — Check [TRANSLATION_STATUS.md](TRANSLATION_STATUS.md) to see which languages need the most help
2. **Open the locale file** — Files are in `src/i18n/locale/` (e.g. `fr.json`, `de.json`)
3. **Find untranslated keys** — Look for values that still match the English text in `en.json`
4. **Translate them** — Replace English strings with your translations
5. **Test** — Change the app locale to verify your translations appear correctly

## Detailed Steps

### Step 1: Identify Untranslated Keys

Open the locale file (e.g. `fr.json`) and compare it with `en.json`. Any value that is identical to the English version needs translation.

You can also use this script to find untranslated keys:

```bash
node -e "const fs=require('fs'); const en=JSON.parse(fs.readFileSync('en.json','utf8')); const loc=JSON.parse(fs.readFileSync('fr.json','utf8')); const untranslated=[]; function findUntranslated(enObj,locObj,prefix=''){for(const k in enObj){const path=prefix?prefix+'.'+k:k; if(typeof enObj[k]==='object'&&enObj[k]!==null){findUntranslated(enObj[k],locObj[k]||{},path);}else{if(locObj[k]===enObj[k]){untranslated.push(path);}}} } findUntranslated(en,loc); console.log(untranslated.join('\n'));"
```

### Step 2: Translate Values

**Important rules:**
- ONLY translate the string values (the text after the colon)
- NEVER change the keys (the text before the colon)
- Keep all placeholders like `{name}`, `{count}`, `{region}` exactly as they are
- Keep HTML tags like `<strong>`, `<br>`, `<em>` intact
- Keep emojis 🎮 🚀 ✨ intact
- Keep URLs intact

**Example:**

```json
// BEFORE
"Common.welcome": "Welcome to AlbionKit!"

// AFTER (French)
"Common.welcome": "Bienvenue sur AlbionKit!"
```

### Step 3: Handle Special Cases

**Placeholders:**
```json
// KEEP THESE EXACTLY AS THEY ARE
"PlayerIntel.killsDeaths": "{kills} kills / {deaths} deaths"
// Translate to:
"PlayerIntel.killsDeaths": "{kills} kills / {deaths} morts"
```

**HTML tags:**
```json
// KEEP HTML TAGS INTACT
"Emails.welcome.body1": "Thanks for joining <strong>AlbionKit</strong>."
// Translate to:
"Emails.welcome.body1": "Merci d'avoir rejoint <strong>AlbionKit</strong>."
```

**Game-specific terms:**
Terms like "ROI", "DPS", "IP", "PvP", "ZvZ" are commonly used in English by the Albion Online community. You can keep them as-is or translate them based on your community's preference.

**City names:**
City names (Martlock, Bridgewatch, Lymhurst, Fort Sterling, Thetford, Caerleon, Brecilien) should remain in English as they are proper nouns in the game.

### Step 4: Submit Your Changes

1. Create a new branch: `git checkout -b translations/fr-update`
2. Make your changes to the locale file
3. Commit: `git commit -m "Update French translations"`
4. Push: `git push origin translations/fr-update`
5. Open a Pull Request

## Translation Tips

### Consistency
- Use the same translation for recurring terms (e.g. always translate "Profit" the same way)
- Check existing translations in the file to maintain consistency
- Use the same formality level throughout (formal "you" vs informal "you")

### Context
- Some strings appear in multiple contexts. Try to understand the context by searching for the key in the codebase
- If unsure, check the English version and surrounding keys for clues

### Length considerations
- Some UI elements have limited space. Keep translations concise when possible
- But don't sacrifice clarity for brevity

## Common Translation Patterns

### German (de)
- "Profit" → "Profit"
- "Silver" → "Silber"
- "Kill" → "Kill"
- "Fame" → "Fame"
- "Guild" → "Gilde"
- "Player Intel" → "Spieler-Intel"

### French (fr)
- "Profit" → "Profit"
- "Silver" → "Argent"
- "Kill" → "Kill"
- "Fame" → "Fame"
- "Guild" → "Guilde"
- "Player Intel" → "Intel Joueur"

### Russian (ru)
- "Profit" → "Прибыль"
- "Silver" → "Серебро"
- "Kill" → "Убийство"
- "Fame" → "Известность"
- "Guild" → "Гильдия"
- "Player Intel" → "Разведка игроков"

### Spanish (es)
- "Profit" → "Beneficio"
- "Silver" → "Plata"
- "Kill" → "Kill"
- "Fame" → "Fama"
- "Guild" → "Hermandad"
- "Player Intel" → "Intel de Jugadores"

### Turkish (tr)
- "Profit" → "Kar"
- "Silver" → "Gümüş"
- "Kill" → "Öldürme"
- "Fame" → "Şöhret"
- "Guild" → "Lonca"
- "Player Intel" → "Oyuncu İstihbaratı"

### Chinese (zh)
- "Profit" → "利润"
- "Silver" → "银币"
- "Kill" → "击杀"
- "Fame" → "声望"
- "Guild" → "公会"
- "Player Intel" → "玩家情报"

### Korean (ko)
- "Profit" → "이익"
- "Silver" → "은화"
- "Kill" → "킬"
- "Fame" → "명성"
- "Guild" → "길드"
- "Player Intel" → "플레이어 정보"

## Questions?

If you have questions about a specific translation, feel free to:
- Open an [issue on GitHub](https://github.com/cosmic-fi/albionkit/issues)
- Ask on [Discord](https://discord.gg/92GbV3QVs3)
- Comment on the PR

Thank you for contributing! 🎉
