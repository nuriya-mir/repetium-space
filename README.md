# Repetium — Open Web Environment for Calm Adult Grapheme-Phoneme Practice & Cognitive Accessibility

**Live Web Prototype:** [https://repetiumspace.vercel.app](https://repetiumspace.vercel.app)  
**Author:** Nuriya Mirsalimova (Kazakhstan)  
**Code License:** [MIT](./LICENSE) (OSI-approved Free & Open Source Software)  
**Service Model:** Non-profit public good — free of charge for learners, no paywalls, no subscriptions

---

## 1. Overview (English)

**Repetium** is an open-source, local-first web environment designed for calm adult practice of French letters, letter combinations, diacritics, and sounds (`grapheme ↔ phoneme`), built from the ground up with cognitive accessibility and neurodivergent-friendly UX principles.

Standard language apps assume effortless visual decoding and rely on timers, red error screens, streak pressure, and competitive leaderboards. For many adults — especially learners experiencing dyslexia, visual crowding, or sensory fatigue — opaque orthographies like French (`eau`, `aient`, `-ent`, silent endings, diacritics `é / è / ê / ë / ç`) cause immediate cognitive overload long before grammar or vocabulary can even begin.

Repetium provides a non-evaluative, calm pre-course perception environment (*"Repetitio est mater studiorum"*):
- **No timers, no red error screens, no public scores, no streak penalties, and no medical/diagnostic labels.**
- **Free and open access:** Repetium is developed as an open public good without paywalls or subscriptions.

### What Is Currently Implemented in This Repository

1. **Three Interactive Letter & Sound Spaces (`app/(main)/letters/` & `components/letters/`):**
   - **House 1 (`house-1`) — Reference French Alphabet:** All 26 letters and diacritic variants (`DiacriticPopover`, `Letter3D`, `LetterGrid`) with 9 interactive perception activities (`CompareActivity`, `NeighborsActivity`, `BetweenActivity`, `AlphabetActivity`, `CloseLettersActivity`, `WhereIsActivity`, `GuessActivity`, `BuildActivity`).
   - **House 2 (`house-2`) — My Alphabet:** Multisensory drawing canvas (`upperPrint`, `lowerPrint`, `upperCursive`, `lowerCursive`, contour tracing and freehand modes) for building personal visual-motor letter memory.
   - **House 3 (`house-3`) — Sound Reference:** Phoneme-to-grapheme mapping across French vowels, nasals, and consonants.
2. **20 Grapheme-Phoneme Exercise Groups (`app/(main)/exercises/g1` – `g20`) & 6-Part Starting Check-In (`app/test/`):**
   - Calm, non-graded 6-part starting check-in (`/test`) and daily practice session (`/session`) without registration or timers.
   - Structured progression from single letters and letter pairs (`G1–G2`), vowels and nasal combinations (`G3–G4`), diacritics (`G5`), contextual readings (`G6`), silent final and internal letters (`G7–G9`), word endings and prefixes (`G10–G11`), syllable division and pseudoword decoding (`G13–G14`), prepositions (`G16`), visual word-length perception (`G19`), to semantic reading blocks (`G20`).
3. **Cognitive Accessibility & Sensory Controls (`components/ui/SettingsPanel/`, `lib/hooks/usePreferences.ts`):**
   - Local-first preferences persisted in `localStorage` (`repetium_prefs`): dyslexia-friendly typography (`Lexend`), light/dark calm themes, audio playback speed (`0.75x / 1.0x / 1.25x`), and optional non-evaluative microphone toggle with full non-microphone fallback.
   - Calm pause screen (`components/PauseScreen/`) available at any moment without losing progress.

### Open-Source Roadmap

- **Structured Open French Grapheme-Phoneme Dataset:** Extracting and publishing the complete French Reading Map (grapheme-phoneme units, contextual reading rules, diacritics, silent letters, and verified fallback word sets) as a standalone open JSON/TypeScript dataset (`CC BY-SA 4.0` / `CC0`).
- **7-Step Unified Exercise Runtime & Accessible Fallbacks:** Completing the unified state machine (`choice → setup → observation → action → support → check → completion`) with manual 3-phase visual fade (`show → dots → blank`) and strict non-audio / non-microphone / keyboard-only fallbacks across all exercise mechanics.
- **Standalone Offline-First Local Mode:** Ensuring 100% of core grapheme-phoneme practice, drawing history, and session state work locally in the browser (`IndexedDB` / `localStorage`) with zero mandatory cloud dependencies.

---

## 2. О проекте (Русский)

**Repetium** — открытая некоммерческая веб-среда для спокойной настройки восприятия французских букв, буквосочетаний, диакритики и звуков (`графема ↔ фонема`) для взрослых, спроектированная с бережным отношением к нейроразнообразию и когнитивной нагрузке.

- **Без оценочного давления:** никаких таймеров, красных экранов ошибки, рейтингов, штрафов за паузу и псевдодиагностических ярлыков.
- **Полностью открытый и бесплатный доступ:** проект развивается как открытое общественное благо под лицензией `MIT` (без платных подписок и без paywall).

---

## 3. Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
