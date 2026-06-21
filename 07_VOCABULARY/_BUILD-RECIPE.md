# 🛠️ Vocabulary HTML Build Recipe — Cam-11 → reuse for Cam-12…20

> **What this is:** the exact, A-to-Z process used to build `Cam-11/Cam-11-Vocabulary.html`.
> Follow it verbatim for any other Cambridge book (Cam-12, 13, 14, 15…). One self-contained,
> searchable HTML file that renders **everything** from the `.md` source files visually.

---

## 0. Folder layout (input → output)

Each book folder (`All_Practices/07_VOCABULARY/Cam-XX/`) contains:

| File | Role |
|---|---|
| `01_WORDS.md` | ~150–210 words, Test→Passage ordered (SOURCE) |
| `02_IDIOMS-PHRASES.md` | idioms / fixed phrases (SOURCE) |
| `03_PHRASAL-VERBS.md` | phrasal verbs (SOURCE) |
| `04_COLLOCATIONS-GROUP-WORDS.md` | collocations grouped by theme (SOURCE) |
| `05_HIGH-FREQUENCY-SENTENCES.md` | model sentence frames (SOURCE) |
| `README.md` | index of the above |
| **`Cam-XX-Vocabulary.html`** | **OUTPUT — the single searchable study page we build** |

The `.md` files stay as-is (kept as a collapsible fallback link at the bottom of the HTML).

---

## 1. The `.md` formats the parser relies on

**`01_WORDS.md`** — section headers + per-word block:
```
# 📕 TEST 1
## Test 1 · Passage 1 — <passage title>

### <word>  ·  /<IPA>/
**বাংলা অর্থ:** <bn meaning> · **বাংলায় উচ্চারণ:** <bn pronunciation>
- **Meaning (EN):** <english meaning>
- **Synonyms:** <comma list>            (may be "— (no true antonym)" style dash = empty)
- **Antonyms:** <comma list>            (dash = empty, hidden in HTML)
- **Example:** *<EN sentence>* — <BN translation>
- **🧠 Note:** <passage + collocation + IELTS trap, may contain *italics*>
```
Edge cases to handle: header IPA may have a trailing `(or /…/)`; header word may have a
parenthetical like `identical (twins)` → strip `(…)` when matching.

**`02_IDIOMS-PHRASES.md` & `03_PHRASAL-VERBS.md`**:
```
### <phrase>
**অর্থ (বাংলা):** <bn> · **EN:** <en meaning>
- **Example:** *<EN>* — <BN>
- **🧠 Note:** <note>
```

**`04_COLLOCATIONS-GROUP-WORDS.md`** — themed bullets:
```
## 🌍 <Theme name>
- **<collocation>** — <bn meaning> · *e.g. <example>*
```

**`05_HIGH-FREQUENCY-SENTENCES.md`** — bullet triples:
```
- **EN:** *<model sentence>*
  **BN:** <translation>
  **🧠:** <frame name + when to use>
```

---

## 2. The OUTPUT HTML — structure to reproduce

Single file, no external JS. Light/dark theme, Inter + Noto Sans Bengali fonts.

**Layout:** back-link → hero banner → info note → sticky search box + tabs → count → card grid
→ collapsible "📂 source .md files" → footer.

**Tabs (data-f values):**
`all` (📚 সব শব্দ) · `T1` · `T2` · `T3` · `T4` · `idioms` (🧩) · `phrasal` (🔗) · `colloc` (🧵) · `sentences` (📝)

**JS data arrays:**
- `W` = words, **11 fields each**:
  `[word, "/IPA/", বাংলা অর্থ, উচ্চারণ, tag("T1·P1"), EN meaning, synonyms, antonyms, exampleEN, exampleBN, note]`
- `IDIOMS` / `PHRASAL` = `[phrase, বাংলা অর্থ, EN meaning, exampleEN, exampleBN, note]`
- `COLLOC` = `[ [themeLabel, [ [collocation, বাংলা, eg], … ]], … ]`
- `SENT` = `[ [modelEN, BN, noteFrame], … ]`

**Card rendering:**
- Word card shows ALL 11 fields: tag chip, word + IPA, 🔵 অর্থ, 🔊 উচ্চারণ, 📖 EN meaning,
  ✅ Syn (green), ⛔ Ant (orange, hidden if empty), example in chip + BN under it, 🧠 note.
- Idiom/phrasal card: phrase, EN meaning, 🔵 অর্থ, example+BN chip, 🧠 note.
- Collocation: theme header (full-width) then cards (collocation, 🔵 অর্থ, ✍️ e.g.).
- Sentence: italic model sentence, 🔵 BN, 🧠 frame note.
- `noteFmt()` converts markdown `*italic*` → `<i>` inside notes. `esc()` escapes `< > &`.

**Search:** live filter **within the active tab only**, matching across **all** fields
(so an English meaning / synonym / example word also finds the entry).

---

## 3. The build procedure (how it was actually done)

1. **Read all 5 `.md` files** to confirm they follow the formats in §1.
2. **Hand-author** the `IDIOMS`, `PHRASAL`, `COLLOC`, `SENT` arrays (they're small, ~20–50 items).
   Escape inner double-quotes (`\"`). Keep Bengali verbatim.
3. **Words are too many to hand-type** → use a small **Node parser** (run via the Bash tool):
   - Parse `01_WORDS.md` into a map `word(lowercased) → {en, syn, ant, exEn, exBn, note}`.
     - Header regex: `^###\s+(.+?)\s+·\s+\/`  → capture word; strip `(twins)`-type parentheticals.
     - Synonyms/Antonyms beginning with `—` ⇒ empty string.
     - Example: `^\*(.+?)\*\s*[—–-]\s*(.+)$` ⇒ `[exEn, exBn]`.
   - Either build `W` fresh (tag from the `## Test X · Passage Y` headers) **or**, if a 5-field
     `W` already exists, **merge**: keep the first 5 curated fields, append the 6 parsed ones
     via `JSON.parse` of each row + `r.concat([...])`. Write back with
     `rows.map(r=>JSON.stringify(r)).join(',\n')`.
   - **Verify:** every row ends with **11 fields**, **zero empty EN** fields, and report any
     unmatched words; patch edge cases by hand.
4. **Wire the renderer + CSS + tabs** (see §2). 
5. **Validate** by extracting the `<script>` and `eval`-ing it under a stubbed `document` in Node;
   assert `W.length`, that all rows have 11 fields, and dump one rendered card to eyeball it.
6. Update the intro note text; keep the `.md` links in a `<details>` fallback.

**Counts produced for Cam-11 (sanity reference):**
words **206**, idioms **22**, phrasal **25**, collocations **48**, sentence frames **25**.

---

## 3b. ⚡ Automated build (the fast path — what was used for Cam-12…15)

There is now a **universal generator**: `_build-vocab.js` (in this folder). It parses all 5 `.md`
files of a book and regenerates the HTML using `Cam-11/Cam-11-Vocabulary.html` as the template.
Run from the `07_VOCABULARY` folder via the Bash tool:

```
node _build-vocab.js 12 13 14 15      # space-separated book numbers
```

It auto-parses Words/Idioms/Phrasal/Collocations/Sentences, swaps the data, fixes the title
(`IELTS 11`→`IELTS NN`) and word-count, and writes `Cam-NN/Cam-NN-Vocabulary.html`.
It prints per-book counts + an `emptyEN` check (must be 0).

**How it injects data (important gotcha):** it does NOT regex each array. It slices the template
between `const W=` and `const grid=` (everything there is the 5 data arrays) and replaces that whole
span. Reason: the files are **CRLF**, so a regex anchored on `\n];` silently fails to match — the
slice approach is CRLF-proof. If you ever change the template, keep those two markers intact.

**Always validate after building:** extract `<script>`, `eval` it under a stubbed `document`,
assert `W.length` matches the book's `### ` header count, every row has **11 fields**, no empty EN,
and the title no longer says `IELTS 11`.

Built so far: Cam-11 (206w), **Cam-12 (176w), Cam-13 (199w), Cam-14 (181w), Cam-15 (184w)**.

## 4. ▶️ Command to replicate for another book

Paste this (change the number):

> **"Build `Cam-12/Cam-12-Vocabulary.html` exactly like Cam-11 — follow
> `All_Practices/07_VOCABULARY/_BUILD-RECIPE.md` step by step. Source files are the
> `01–05 .md` files in `All_Practices/07_VOCABULARY/Cam-12/`. Embed the FULL detail of every
> word (IPA, বাংলা অর্থ + উচ্চারণ, English meaning, synonyms, antonyms, example + বাংলা
> translation, 🧠 note) into searchable cards, plus the Idioms / Phrasal verbs / Collocations /
> Sentences tabs. One self-contained HTML file, same design, same tabs, same search."**

That's all I need — I'll re-run the parser + build and hand you the finished page.
If Cam-12's `.md` files use a slightly different format, I'll adapt the regex; the rest is identical.
