# Elite Football — Design System

Premium **"pro sports data"** look for a football *simulation game*. Dark green-black
surfaces, one saturated lime accent, big condensed numbers for data. Serious sports-data
tool credibility — never cartoon, never stock athlete photography.

> Reference mood: `design-refs/style-referemce-statsports.png` (dark, one green accent,
> big bold numbers, stacked data cards). We translate the *feeling*, not the imagery.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Zustand.
Tokens live in `app/globals.css` (`@theme` + `:root`). Do **not** introduce a new styling
stack. Fonts are wired via `next/font` in `app/layout.tsx`.

---

## 1. Color

All tokens are exposed as Tailwind utilities via `@theme` (e.g. `bg-bg`, `text-accent`,
`border-line`, `text-dim`).

| Token | Hex / value | Utility | Use |
|---|---|---|---|
| `--color-bg` | `#070E0B` | `bg-bg` | Page base (deep turf-black) |
| `--color-elev` | `#0C1712` | `bg-elev` | Slightly raised area |
| `--color-surface` | `#101B16` | `bg-surface` | Solid cards / tables |
| `--color-line` | `rgba(233,240,234,.09)` | `border-line` | Hairline borders |
| `--color-line-strong` | `rgba(233,240,234,.16)` | `border-line-strong` | Stronger dividers, inputs |
| `--color-accent` | `#B6FF3A` | `text-accent` `bg-accent` | THE accent: key numbers, CTAs, active states |
| `--color-accent-2` | `#7CE88A` | `text-accent-2` | Softer green support (wins) |
| `--color-accent-ink` | `#06120A` | `text-accent-ink` | Text **on** lime buttons |
| `--color-text` | `#E9F1EA` | `text-text` | Primary text (off-white) |
| `--color-dim` | `#9DB0A5` | `text-dim` | Secondary text |
| `--color-faint` | `#7C8F84` | `text-faint` | Labels / eyebrows (large/uppercase only) |
| `--color-win` | `#7CE88A` | `text-win` | Result: win |
| `--color-draw` | `#F5C451` | `text-draw` | Result: draw |
| `--color-loss` | `#FF6B7A` | `text-loss` | Result: loss |

**Contrast (on `#070E0B`), WCAG:**

| Pair | Ratio | Verdict |
|---|---|---|
| `text` `#E9F1EA` | ~16.5:1 | AAA |
| `dim` `#9DB0A5` | ~7.5:1 | AA (all sizes) |
| `faint` `#7C8F84` | ~4.9:1 | AA (normal ≥4.5) |
| `accent` `#B6FF3A` | ~14:1 | AAA |
| `win` `#7CE88A` | ~9:1 | AAA |
| `draw` `#F5C451` | ~10:1 | AAA |
| `loss` `#FF6B7A` | ~6:1 | AA |
| `accent-ink` on `accent` bg | ~13:1 | AAA |

**Discipline:** exactly one accent (lime). Everything else stays quiet so the accent and
the data pop. Reserve lime for: primary CTAs, active/selected states, the single most
important number on a card, ratings. Do not tint whole surfaces lime.

---

## 2. Typography

Two roles from one family for cohesion, athletic voice:

- **Display / data — Barlow Condensed** (`font-display`, weights 600/700/800). Scores,
  ratings, big stat numbers, page headings. Evokes jersey numbers & scoreboards. Always
  `tabular-nums` for numbers (helper class `.stat-num` sets family + weight + tabular).
- **UI / body — Barlow** (`--font-sans`, weights 400/500/600/700). Everything else.

**Type scale** (Tailwind sizes):

| Role | Size | Weight | Notes |
|---|---|---|---|
| Hero stat | `text-6xl`–`text-7xl` (3.75–4.5rem) | 800 display | `.stat-num`, often `text-accent` |
| Page title | `text-3xl` (1.875rem) | 800 display | |
| Section / card title | `text-lg`–`text-xl` | 700 | |
| Body | `text-sm`–`text-base` | 400–500 | `text-dim` for secondary |
| Data / score | `text-2xl`–`text-4xl` | 800 display | `tabular-nums` |
| Eyebrow / label | `text-[11px]` | 700 | `.eyebrow`, uppercase, `tracking-[0.14em]`, `text-faint` |
| Micro (chips) | `text-[10px]` | 700 | uppercase |

Helpers: `.eyebrow`, `.stat-num`, `.font-display`, `.text-glow` (lime glow for hero numbers).

---

## 3. Spacing & radius

- **Spacing:** 4px base — use Tailwind `1,2,3,4,5,6,8,10,12,16` (4–64px). Generous gutters:
  card padding `p-5`/`p-6`, section gaps `gap-4`/`gap-5`, page padding `px-4 py-6+`.
- **Radius:** cards `1.25rem` (`.card`), inner controls `rounded-xl` (0.75rem),
  buttons `0.85rem`, chips/pills `rounded-full`. Tighter than the old design — reads
  technical, not pillowy.
- **Max widths:** marketing `max-w-3xl`, app content `max-w-5xl`/`max-w-6xl`.

---

## 4. Components

**Buttons** (`app/globals.css`)
- `.btn-primary` — lime fill, dark ink, subtle ring + glow. Hover: brighten + stronger glow.
  Active: `translateY(1px)`. Disabled: 35% opacity + grayscale, no shadow. (No chunky 3D
  bottom-shadow — that was the old cartoon tell.)
- `.btn-secondary` — ghost: `white/4` fill, `line-strong` border, light text. Hover: lighter.
- Focus: global `:focus-visible` → 2px lime outline, 2px offset (keyboard visible everywhere).

**Cards**
- `.card` — dark glass: subtle white gradient, `blur(14px)`, `border-line`, radius 1.25rem,
  inset top highlight + soft drop shadow. Default grouping container.
- `.card-solid` — opaque `surface`, for tables / dense data.

**Inputs**
- `.glass-input` — `white/4` fill, `line-strong` border; focus → lime border + lime ring.

**Badges / chips**
- Pills: `rounded-full border border-line bg-white/[0.04] px-3 py-1.5`, label in `.eyebrow`,
  value in `.stat-num`. Rating badges keep `ratingColor()` scale (see `components/ui.tsx`).

**Tables**
- Wrap in `.card`/`.card-solid`, `overflow-hidden`. Header: `bg-white/[0.03]`, `text-faint`,
  uppercase micro labels. Rows: `border-t border-line`, `text-dim`; user/active row tinted
  `bg-accent/8` with `text-accent`. Numbers `tabular-nums`, right-aligned.

**Pitch (`.pitch`)**
- Dark turf: deep green-black with faint lime-tinted mow stripes, vignette, drop shadow.
  Player tokens: rating color fill, `ring` for state, condensed number. Field lines: SVG at
  `rgba(255,255,255,~.5)`. (Full match-screen polish handled in a dedicated pass.)

**Signature element**
- The unbeaten-record readout: huge `.stat-num` in lime with `.text-glow`, faint hairlines,
  eyebrow labels — the scoreboard motif that recurs across data displays.

---

## 5. Guardrails

- Style only. No changes to routes, API/DB calls, state, or game logic. Touch markup only
  where strictly required for the new look.
- Responsive: mobile → desktop. WCAG AA minimum contrast. Visible focus states.
  `prefers-reduced-motion` respected (globals.css).
- No real athlete photos. Stylized icons / abstract player avatars only.
