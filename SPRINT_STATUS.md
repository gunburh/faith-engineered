# SPRINT_STATUS.md
> Last updated: Sprint Day 12 (partial) · Calendar Day ~9
> อ่านไฟล์นี้ก่อนเริ่ม chat ใหม่ทุกครั้ง — เป็น single source of truth สำหรับ progress และ UI decisions

---

## 1. Sprint Progress

| Sprint Day | Theme | Status | Notes |
|---|---|---|---|
| 1 | Repo + scaffold + tokens.css | ✅ Done | |
| 2 | English copy ครบ 4 chapters | ✅ Done | `content/copy-en-draft.md` |
| 3 | Research Ch3-4 + 49 sources | ✅ Done | `docs/research/notes.md`, `sources.md` |
| 4 | Thai translation + copy.json + Figma setup | ✅ Done | `content/copy.json` bilingual |
| 5 | Wireframes ครบ 6 sections | ✅ Done | Figma |
| 6 | Hi-fi Hero + Ch1 (partial) | ✅ Done | Hero complete, Ch1 complete |
| 7 | Hi-fi Ch2-4 + Sources | ✅ Done | All sections hi-fi complete |
| 8 | HTML skeleton + CSS foundation | ✅ Done | W3C valid, zero errors |
| 9 | Chapter CSS stubs (all 5) | ✅ Done | Stubs only — not yet matched to hi-fi |
| 10 | Buffer | ✅ Used for advance work | |
| 11 | Ch3-4 CSS visual complete | ⚠️ Stub only | ยังไม่ match hi-fi จริง |
| 12 | lang-toggle + nav + scroll | 🟡 Partial | lang-toggle ✅, scroll ✅, nav.js ❌ |
| 13 | GSAP motion | ❌ Not started | |

**Next 3 tasks (in order):**
1. `js/core/nav.js` — sticky + scroll-spy
2. Update all chapter CSS to match hi-fi (reference: HIFI_VISUAL_SPEC.pdf)
3. `js/core/motion.js` — GSAP ScrollTrigger animations

---

## 2. What's Shipped (Git)

```
[Day 1]   feat: repo + scaffold + tokens.css
[Day 4]   feat: bilingual copy.json
[Day 8-9] feat: HTML skeleton + full CSS foundation (W3C valid)
[Day 11]  feat: lang-toggle + smooth scroll JS
          - js/main.js, js/core/lang-toggle.js, js/core/scroll.js
          - vendor/: gsap, ScrollTrigger, lenis, howler, splitting, three
[Day 11]  polish: Lenis duration 1.4 → 0.9
```

**Key files:**
- `css/tokens.css` — full design tokens (with aliases added)
- `content/copy.json` — bilingual EN/TH ครบ 4 chapters
- `docs/research/sources.md` — 49 verified sources
- `js/core/lang-toggle.js` — working ✅ tested
- `js/core/scroll.js` — Lenis duration 0.9 + gold progress bar ✅
- `HIFI_VISUAL_SPEC.pdf` — complete hi-fi spec ← อ่านก่อนทำ CSS/JS ทุก section

---

## 3. Locked Numbers (ห้ามแต่ง)

- 47,000,000,000฿ total offering economy (hi-fi แสดงเป็น 47B)
- 40B฿ amulet market = 12× Vatican revenue
- 73% Thai Buddhists who also practice non-Buddhist ritual
- 240M garlands/year
- 20฿ cost of one garland (entry point)
- 2,400+ registered shrines in Bangkok (denser than 7-Elevens)
- Gen Z 2.1× more likely to travel for spirit-homage

---

## 4. UI Direction — Locked Decisions (from HIFI_VISUAL_SPEC.pdf)

### 4.1 Global Shell

**Navigation bar (sticky floating pill):**
- Liquid glass: `backdrop-filter: blur(12px)`, fill F5F1EA 20%, border 45° light reflection 80%
- Figma params: refraction 93, depth 100, dispersion 100, frost 8, splay 68
- Layout: Logo left | Chapter nav pills center-right | Lang toggle + Audio right
- Active chapter: linear-gradient pill (DABF81 stop 0% → 635330 stop 100%), Inter regular 12px cream
- Lang toggle: dual-pill 94×45 — active gold gradient, inactive outline only
- Audio toggle: circle 45×45, gold gradient, ♪ cream

**Progress bar:** 2px gold line top of viewport ✅ already implemented

**Footer:** charcoal bg, 4-column grid
- THE PROJECT / CHAPTERS / TECHNOLOGY / CONTACT
- Tech column: JetBrains Mono regular 10px
- Bottom row: copyright left + lang toggle duplicate right
- Icons needed: envelope_icon.png, phone_icon.png, instagram_icon.png

### 4.2 Hero / Landing

**Background:** TWO videos with scroll transition (changed from static smoke)
- `hero_bg02.mov` — plays immediately on load
- Scroll → `hero_bg02` fades out → `hero_bg05.mov` takes over (GSAP scroll-linked)
- Three.js smoke particles layer on top (cursor-interactive, peak opacity 0.3)

**Title:** `hero_logo.png` image asset (945×109) — NOT text `<h1>`
- Eyebrow above: "THAI MUTELU CULTURE" Inter medium 11px, gold, tracked

**Subhead:** Cormorant regular 48px cream, 2 lines:
"Bangkok's spiritual infrastructure is not an accident of faith. It is a design system."

**CTA Button "BEGIN READING →":** 162×47
- Liquid glass: refraction 93, depth 100, dispersion 100, frost 8, splay 68
- Default: F5F1EA 20% fill
- Hover: 40% gold gradient fill (DABF81→635330)
- Active/click: 100% cream fill + oxblood text

**Scroll cue:** "SCROLL" Inter medium 11px FFF1CC 70% + vertical blur-fade line (NO arrow ↓)

**Motion on load:**
- Logo: fade + slight upward rise
- Smoke particles: emit from behind logo, cursor-responsive
- Exit hero: smoke fades + logo scale down → Ch1 reveals

### 4.3 Chapter Pattern (ALL chapters)

**Every chapter header:**
```
[CHAPTER 0X eyebrow — Inter medium 12px] + [horizontal divider line 1px]
[The ChapterName — Cormorant Mixed: "The" medium 96px / rest italic 96px]
[Drop Shadow 0,0 blur 25 FFFFFF 55%, swash variant, full column left]
[| Subtitle — IBM Plex Sans Thai regular 24px, color #5A5A5A]
[Lead paragraph — Cormorant italic 2 lines, cream 22px]
```

**Every chapter closing:**
```
[Cinematic video — blend mode lighten, centered]
[Closing pull quote]
[end chapter line]
[SCROLL ↓ CONTINUE TO CHAPTER 0X — Inter medium 11px FFF1CC 70%]
[/ CHAPTER NAME — Cormorant italic 20px white]
[vertical blur-fade line]
```

### 4.4 Chapter 01 — The Stack

**Quote blocks (2 total):**
- Video background: quote1.mov / quote2.mov (700×388, blend mode lighten)
- Blockquote card: 640×98, no corner radius, liquid glass (refraction 60, depth 26)
- Fill FFFFFF 5% + Drop Shadow 3,16 blur 22 FFFFFF 7%
- Quote 1: gold left-border 2px | Quote 2: gold right-border 2px
- Font: Cormorant italic 22px cream

**Stack diagram (signature interaction):**
- Layout: 2-column — left stack cards / right sticky detail panel
- Cards: 589×135, corner radius 20, unique gradient per layer + gray stroke
- Order top→bottom: Layer 06 (DISTRIBUTION) → Layer 01 (FOUNDATION)

| Layer | Name | Tag | Tag Color | Card Gradient |
|---|---|---|---|---|
| 06 | New Media / Influencer | DISTRIBUTION | green #38F593 25% | #050505 55% → #1C362A |
| 05 | Royal Brahmanism | STATE | red #F53838 25% | #050505 55% → #361C1C |
| 04 | Chinese Folk Religion | MERCHANT | copper #F56A38 25% | #050505 55% → #36211C |
| 03 | Theravada Buddhism | FORMAL OS | blue #385BF5 25% | #050505 55% → #1C1F36 |
| 02 | Hindu Mythology | COURT | violet #8A38F5 25% | #050505 55% → #2D1C36 |
| 01 | Animism | FOUNDATION | gold #E6C878 25% | #050505 55% → #362E1C |

- Active card: gold stroke + side connector line to detail panel
- Detail panel: Origin / Function / Interaction with other layer

**"Why this is not syncretism" block:**
- 3-column cards 387×282: LAYER ISOLATION / ERROR HANDLING / VERSION CONTROL
- Charcoal fill, gray stroke, gold icon top-left, mono 14px title, section divider, body Inter medium 14px

### 4.5 Chapter 02 — The Geography of Luck

**Map:** adapt `shrine-reference-map.html` dev tool (NOT custom SVG — changed from plan)
- 2-column: map 692×692 left / detail card 488×692 right
- Detail card: Cormorant 40px name + definition list (gold labels, cream values)
- **API endpoint pill conceit:** `[GET] /wishes/any` — black pill, mono font, gold GET badge
- Caption: "Click any pin on the map to select and explore shrine details." Cormorant italic 18px

**6 Shrines data:**
| Shrine | Location | Endpoint |
|---|---|---|
| Erawan Shrine | Ratchaprasong | /wishes/any |
| Trimurti Shrine | CentralWorld | /love/romance |
| Ganesh Shrine | Huai Khwang | /career/creative |
| Ai Khai Bangkok | Huai Khwang | /wealth/fast |
| Kuan Yin Shrine | Chinatown | /healing/mercy |
| Jao Mae Tubtim | Sukhumvit 3 | /children/conceive |

**All 6 Shrines row:** horizontal scroll, mini cards 285×158

**Infrastructure Thesis:**
- Left card: CULTURAL COMPARISON 590×266 (Japan/Vatican/Thailand bullet list)
- Right card: 2,400+ in Cormorant medium 128px gold + drop shadow

### 4.6 Chapter 03 — The Offering Economy

**Big number reveal:** `47,000,000,000`
- Cormorant italic 128px, gradient C9A961→F5F1EA
- Count-up animation: one-shot on scroll-in, expo.out, 2.5s

**Key metrics row (3 cards 387×179):**
- 73% / 240M / 20฿ — Cormorant medium italic 64px gold + mono 16px caption

**The Parallel Economy:** 2 side-by-side images (590×445, blend lighten) with captions

**Pull quote (gold, centered):** Cormorant semibold italic 40px gold

**Comparative scale:** 4 horizontal bars
- Thailand: gold gradient | Vatican/Hajj/Japan: gray muted
- Numbers: TBD where not confirmed (ห้ามแต่ง)

**Value chain flow (5 steps):** FLOWER FARM 3฿ → DAMNOEN SADUAK 7฿ → STREET VENDOR 15฿ → TEMPLE STALL 20฿ → OFFERING TABLE [MERIT]
- Cards 186×136, oxblood chevron arrows

**What ฿B Buys slider:** range ฿20→฿1,000, interactive, 3-column output below

**Seasonal peaks bar chart:** 12 bars
- Gold peaks: Chinese New Year, Songkran, New Year
- Oxblood mid: Veg Festival
- Gray: regular months

### 4.7 Chapter 04 — The New Saints

**Headline exception:** "The NEW SAINTS" — uppercase, final S in oxblood color

**4 Saints:**
| Name | Tag | Tag Color | Timeline dot |
|---|---|---|---|
| Nang Kwak | SMALL BUSINESS CULTURE | oxblood | oxblood, 2015 (perennial) |
| Ai Khai | FAST MONEY CULTURE | gold | gold, 2019 |
| Taowessuwan | ECONOMIC ANXIETY | violet | violet, 2022 |
| Kru Kai Kaew | FAST MONEY CULTURE | gold | cream, 2023 |

**Layout: zigzag/staggered** (NOT 2×2 grid — changed from original plan)
- Cards 589×468, corner rad 20, charcoal fill, color-coded stroke per saint
- Alternate: Nang Kwak left → Ai Khai right → Taowessuwan left → Kru Kai Kaew right
- Sculpture image "breaks out" of card boundary (overflow visible — high-craft moment)
- Images: saint1_ch4.png through saint4_ch4.png

**Viral timeline:** horizontal 2015→2025, colored dots, year ticks

**The Pattern grid:** 4-column synthesis cards — NEED + TRIGGER per saint

**Closing pull quote (large, centered):**
"Thailand does not preserve its pantheon. It updates it. Every generation ships a new saint — and the old ones remain in the stack."

### 4.8 Sources & About

**Layout:** 60/40 two-column

**Left (60%):**
- THE PROJECT — IBM Plex Thai bold 24px + Cormorant italic body
- THE AUTHOR — "BHANUPONG CHOMCHIN" Cormorant semibold 40px uppercase, letter-spacing 19%
- RESEARCH SOURCES — 5 accordion rows (Ch1-4 + General) with chevron expand
- VISUAL DESIGNS CREDITS + TYPOGRAPHY CREDITS

**Right (40%):**
- ABOUT THIS PROJECT card (info icon + GitHub link gold mono)
- TECH STACK card (mono table, 7 rows)
- Cinematic video below (387×512, blend lighten)

---

## 5. Assets Still Needed

### Videos (Day 16)
`hero_bg02.mov`, `hero_bg05.mov`, `quote1.mov`, `quote2.mov`, `closing visual ch1.mp4`, `closing visual ch2.MOV`, `opening visual ch2.jpeg`, `opening visual ch3.mov`, `closing visual ch3.MOV`, `opening visual ch4.MOV`, `closing visual ch4.mp4`, `final-visual_about.mov`

### Images (Day 14-15, Midjourney)
`fe_logo01.png` (154×80), `hero_logo.png` (945×109), `saint1_ch4.png`–`saint4_ch4.png`

### Icons (Figma export or free source)
stack_icon, LAYER ISOLATION_icon, ERROR HANDLING_icon, VERSION CONTROL_icon, cultcomp_icon, shrine_icon, flower_icon, market_icon, vendor_icon, temple_icon, table_icon, candle_icon, amulet_icon, info_icon, stack2_icon, envelope_icon, phone_icon, instagram_icon

---

## 6. Decisions Changed from Original Plan

| Original | Final | Note |
|---|---|---|
| Custom SVG Bangkok map | Adapt shrine-reference-map.html | File already exists |
| `<h1>` text hero title | hero_logo.png image | Specific yant/typography design |
| 4-portrait grid Ch4 | Zigzag staggered layout | Craft moment |
| Simple stack layers (generic) | Color-coded layers with tags + connector | More editorial |
| Higgsfield smoke loop video | Two videos: bg02 → bg05 scroll transition | More dynamic |
| Static blockquotes | Video-background blockquotes (blend lighten) | Cinematic |
| Simple data numbers | Count-up + bar chart + slider + flow diagram | Full wow mechanics |
| Nav: simple glassmorphism | Liquid glass (Figma: refraction/depth/dispersion params) | More refined |

---

## 7. Claude Code Instructions

- Model: flexible — use Opus for architecture, Sonnet for implementation
- Always attach HIFI_VISUAL_SPEC.pdf + section spec + existing file before asking to code
- No React/Vue/Tailwind/Bootstrap/jQuery
- Vanilla HTML/CSS/JS only + approved vendor libraries
- All colors from `css/tokens.css` — no hardcoded hex in component CSS (except in tokens.css itself)
- `prefers-reduced-motion` must be respected in every animation

---

## 8. Design Tokens Quick Reference

```css
--color-ink: #0A0A0A          /* primary bg */
--color-cream: #F5F1EA        /* primary text */
--color-gold: #C9A961         /* accent */
--color-oxblood: #6B1F2E      /* rare accent */
--color-charcoal: #1A1A1A     /* card bg */
--color-slate: #5A5A5A        /* subhead color */

/* Gold gradient (nav active, buttons) */
linear-gradient(135deg, #DABF81 0%, #635330 100%)

/* Liquid glass recipe */
background: rgba(10, 10, 10, 0.4);
backdrop-filter: blur(12px);
border: 1px solid rgba(245, 241, 234, 0.08);
border-radius: 100px;

/* Fonts */
--font-display-en: 'Cormorant Garamond', serif;
--font-display-th: 'IBM Plex Thai Looped', serif;
--font-body-th: 'IBM Plex Thai', sans-serif;
--font-ui: 'Inter', sans-serif;        /* alias */
--font-mono: 'JetBrains Mono', monospace;

/* Motion */
--motion-base: 300ms;
--ease-brand: cubic-bezier(0.19, 1, 0.22, 1);  /* expo ease out */
```

---

## 9. Project Info

- **Repo:** `git@github.com:gunburh/faith-engineered.git`
- **Local:** `/Users/gunburh/Desktop/final project web/faith-engineered`
- **Figma:** `https://www.figma.com/design/cjLzyZUU6OkjpcOZHqPjFM`
- **Deadline:** 14 May 2026 (Day 20)
- **Submission email:** `unchana.kt133@gmail.com`

---

## 10. Rubric (30 pts)

| | Points | Key req | Status |
|---|---|---|---|
| A Content | 5 | 4 chapters, sources, bilingual | ✅ copy done |
| B Structure | 5 | Semantic HTML, ≥5 sections, valid | ✅ locked |
| C Code | 10 | CSS variables, Flexbox/Grid, JS works, UX | 🟡 partial |
| D Visual | 10 | Consistent design, editorial quality | 🟡 hi-fi done, code pending |
