---
name: PFMS — Project Financial Management System
description: Warm-precision enterprise tool for EAC tracking, period management, and project financials.
colors:
  paper: "#fdfcf8"
  paper-subtle: "#f3efe7"
  paper-deep: "#ebe6dc"
  ink: "#1a1815"
  ink-secondary: "#3a352f"
  ink-muted: "#6b655e"
  status-ok: "#3b7a55"
  status-warn: "#c98a2c"
  status-bad: "#b8442e"
  status-info: "#3a5e8c"
typography:
  display:
    fontFamily: "'Caveat', cursive"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "normal"
  headline:
    fontFamily: "'Caveat', cursive"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "'Caveat', cursive"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "'Kalam', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'Kalam', system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    letterSpacing: "0.08em"
  mono:
    fontFamily: "'Courier New', monospace"
    fontSize: "11px"
    fontWeight: 400
rounded:
  sm: "4px"
  pill: "99px"
  dot: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
  button-primary-hover:
    backgroundColor: "{colors.ink-secondary}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
  button-default:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
  button-ghost:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    padding: "4px 12px"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  pill-default:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"
  pill-ok:
    backgroundColor: "transparent"
    textColor: "{colors.status-ok}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"
  pill-warn:
    backgroundColor: "transparent"
    textColor: "{colors.status-warn}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"
  pill-bad:
    backgroundColor: "transparent"
    textColor: "{colors.status-bad}"
    rounded: "{rounded.pill}"
    padding: "3px 8px"
---

# Design System: PFMS

## 1. Overview

**Creative North Star: "The Valuation Report"**

A valuation report is trusted because it is precise, complete, and well-organised. It earns authority through legibility, not through decoration. Every number is accountable. Every table row carries weight. The professional who reads it doesn't have to work to find what matters: the hierarchy does that for them.

PFMS takes this as its design posture. The interface is dense by necessity (construction finance is dense), but density is managed through typographic hierarchy, spatial rhythm, and consistent status vocabulary, not by hiding data behind tabs or simplifying it away. The warmth of the paper-and-ink palette is not decorative; it signals that a human designed this for a professional who has to trust their numbers, not for a product demo.

What this system explicitly rejects: the blue-heavy corporate overload of Salesforce-style SaaS; the undifferentiated grid density of SAP and Excel where every cell shouts equally; the startup dashboard template with gradient metric cards, hero numbers in 72px type, and dark mode with neon accents. PFMS is none of those things. It is the tool a careful project manager would actually print out and take to a client meeting.

**Key Characteristics:**
- Warm neutral palette rooted in paper and ink, not in blue-grey system defaults
- Two-font system: expressive display (Caveat) for headings, humanist handwriting (Kalam) for data
- Status communicated through a four-color semantic vocabulary, always with a label, never by color alone
- 4px border radius throughout: consistent, minimal, never rounded for softness
- Flat elevation: depth through tonal layering, not shadows
- Controls feel tactile and considered: 1.5px borders, deliberate padding, crisp state transitions

## 2. Colors: The Paper-and-Ink Palette

A warm neutral ground with four semantic status colors. No decorative accent; the primary color IS the ink.

### Primary
- **Carbon Draft** (`#1a1815`): The primary ink. Used for all body borders, primary button backgrounds, nav active states, and key typography. The near-black that carries the entire interface.
- **Weathered Ink** (`#3a352f`): Secondary text, ghost button labels, secondary headings. Never used for borders.
- **Faded Annotation** (`#6b655e`): Muted labels, placeholder text, divider lines, ghost borders, section headers. Signals "this is supporting information".

### Neutral
- **Warm Ash Cream** (`#fdfcf8`): Primary surface. Every content area, card background, input background. The paper.
- **Aged Linen** (`#f3efe7`): Secondary surface. Sidebar, filled card variants, table header backgrounds. One step warmer and darker than the primary surface.
- **Worn Fold** (`#ebe6dc`): Dividers, hover states, deepest background layer.

### Status Vocabulary
- **Ledger Green** (`#3b7a55`): On track, completed, approved. Pill borders, dot fills, status text. Never for backgrounds.
- **Amber Flag** (`#c98a2c`): Attention required, approaching deadline, minor variance. Warning state.
- **Red Variance** (`#b8442e`): Exception, overrun, failed approval. Error state. Use sparingly; its rarity is its signal.
- **Blueprint Blue** (`#3a5e8c`): Informational, pending, in-review states. Not urgent.

**The Four-Signal Rule.** Every status is one of four: ok, warn, bad, info. No custom one-off colors. If a state doesn't map to these four, reconsider whether it's a real state.

**The Rarity Rule.** Red Variance appears only when a PM must act. If more than 20% of a screen is red, the design has lost signal discipline. Redesign the hierarchy before adding more red.

## 3. Typography

**Display Font:** Caveat (cursive, 700 weight)
**Body Font:** Kalam (300/400/700 weights; system-ui fallback)
**Mono Font:** Courier New (monospace, 11px)

**Character:** Caveat brings expressive authority to headings: legible handwriting at large sizes, never precious. Kalam is the workhorse: humanist, warm, readable at small sizes. Together they feel hand-assembled rather than template-applied. Mono is pure function for WBS codes and numeric identifiers.

### Hierarchy
- **Display** (700, 30px, line-height 1.1): Screen-level greetings, portfolio totals, period labels. One per screen maximum.
- **Headline** (700, 22px, line-height 1.2): Section titles within a screen. EAC totals, module names.
- **Title** (700, 17px, line-height 1.3): Panel headings, table section names, card titles.
- **Body** (400, 14px, line-height 1.4): All data values, descriptions, task labels. The default.
- **Label** (700, 10px, 0.08em letter-spacing, uppercase): Column headers, section dividers, metadata. Always uppercase, always in Faded Annotation.
- **Mono** (400, 11px): WBS codes, SAP reference numbers, any identifier that must be scannable in a column.

**The Two-Font Boundary Rule.** Caveat is for structure-giving text: headings, period labels, totals that anchor a screen. Kalam is for everything else. Never use Caveat below 17px; it reads as decoration at that scale, not authority.

## 4. Elevation

PFMS is flat by design. No drop shadows. Depth is expressed through tonal layering: Warm Ash Cream surfaces sit inside Aged Linen surrounds, which sit inside Worn Fold backgrounds. The 1.5px Carbon Draft border is the elevation tool: it separates, defines, and contains without adding visual weight.

**The Flat-By-Default Rule.** If you reach for `box-shadow`, stop and ask: can this be expressed with a border or a background shift instead? In PFMS the answer is almost always yes. Reserve any shadow for floating elements like open dropdowns only, and keep it tight: `0 2px 8px rgba(0,0,0,0.12)` maximum.

## 5. Components

Controls are tactile and considered. Every interactive element has a 1.5px Carbon Draft border at rest, a clear hover state, and responds to interaction without animation theater.

### Buttons
- **Shape:** Squared corners (4px radius). Not rounded; not sharp.
- **Primary:** Carbon Draft background, Warm Ash Cream text. Padding 4px vertical, 12px horizontal. The only button that feels solid and consequential.
- **Default:** Warm Ash Cream background, Carbon Draft border and text. Standard action.
- **Ghost:** Warm Ash Cream background, Faded Annotation border, Weathered Ink text. Secondary contextual actions (table row CTAs, navigation links).
- **Small (`sm`):** 11px type, 2px vertical / 8px horizontal padding. Used inside data rows.
- **Hover:** Background shifts one tonal step (paper to paper-2 for default; ink to ink-secondary for primary). No translation, no scale. Direct.
- **The Arrow Convention.** Ghost row CTAs end with ` →`. No other icon. This is the system idiom for "navigate into".

### Pills / Status Tags
- **Shape:** Full pill (99px radius). 3px vertical, 8px horizontal padding. 12px body type.
- **Default:** Carbon Draft border and text, transparent background.
- **Status variants:** Matching semantic border and text color. No background fill; the color is the border and label only.
- **Tiny variant:** 10px type, 1px vertical / 6px horizontal. For dense table contexts.
- **The No-Fill Rule.** Status pills are outlined only. A filled red pill looks like an error badge from a design system template. An outlined red pill looks like a deliberate annotation. PFMS uses the latter.

### Cards / Boxes
- **Shape:** 4px radius (same as buttons; one radius in the system).
- **Default:** Carbon Draft border (1.5px), Warm Ash Cream background.
- **Filled:** Aged Linen background. Used for summary panels, totals, contextual sidecars.
- **Ghost:** Faded Annotation dashed border. Placeholder content, empty states, future-date items.
- **Internal Padding:** 12px compact, 16px standard, 20px for breathing room in wider layouts.
- **Nested cards are prohibited.** A box inside a box signals a failure of layout thinking. Use a table, a list, or a wider panel instead.

### Inputs / Fields
- **Style:** Carbon Draft border (1.5px), Warm Ash Cream background, 4px radius. Min height 28px standard, 36px for primary inputs.
- **Focus:** Border color shifts from Carbon Draft to Blueprint Blue. No glow, no shadow. Direct.
- **Typography:** Kalam 13px. Numeric values in columns should use mono.
- **Custom dropdowns only.** Never OS native `<select>`. The OS renders options outside CSS scope. Custom div-based dropdowns maintain the design system. See Shared.jsx for reference.

### Navigation (Sidebar)
- **Default state:** Kalam 11.5px, Weathered Ink color, transparent background, 3px radius hover zone.
- **Active state:** Carbon Draft background, Warm Ash Cream text, 700 weight. Complete inversion.
- **Hover:** Worn Fold background. No border change.
- **Section labels:** 9px uppercase Kalam in Faded Annotation. Visual separator without a horizontal rule.
- **Width:** 200px fixed. This is a desktop-first professional workflow tool; sidebar does not collapse.

### Data Tables
- **Container:** Carbon Draft border, 4px radius, CSS grid layout.
- **Header row:** Aged Linen background, 10px uppercase label in Faded Annotation, 1.5px bottom border.
- **Data rows:** Warm Ash Cream background, Worn Fold bottom border at 1px. Last rows drop the border.
- **Row highlights:** Amber-tinted (`#fdf5e3`) for attention rows; red-tinted (`#fbe9e3`) for exception rows. Applied as an override class; never as default state.
- **The Scan Rule.** A PM should scan a 20-row table in 3 seconds. WBS codes get mono type; amounts get right-aligned mono; status gets a fixed narrow column.

### Status Dots
- **Shape:** 8px circle.
- **Usage:** Always paired with a label or text value. Never a standalone color indicator. This is the WCAG AA compliance anchor: color alone never conveys status.

## 6. Do's and Don'ts

### Do:
- **Do** use Carbon Draft (`#1a1815`) as the sole border color for interactive elements at rest.
- **Do** pair every status dot or pill with a text label or value. Color alone is not accessible.
- **Do** use custom div-based dropdowns. Never `<select>`.
- **Do** use Worn Fold (`#ebe6dc`) for hover states on interactive list items.
- **Do** express priority through spatial placement and typographic weight before reaching for color.
- **Do** keep the sidebar at 200px fixed. Desktop-first, professional workflow.
- **Do** use Caveat only at 17px and above. Below that it reads as decoration.

### Don't:
- **Don't** use gradient text (`background-clip: text`). Single solid color only.
- **Don't** add `box-shadow` to cards or containers at rest. Elevation is tonal.
- **Don't** use the hero-metric template (big number, small label, gradient accent). This is the startup dashboard anti-pattern PFMS explicitly rejects.
- **Don't** make identical card grids. Same-sized icon + heading + body cards in a 3-col grid is the Salesforce-SaaS cliche. Use tables, lists, or varied-weight layouts.
- **Don't** use color alone to communicate status. Every indicator needs a dot AND a label, or a pill with text.
- **Don't** use side-stripe borders (colored `border-left` > 1px as a card accent). Use a full border, background tint, or leading status dot instead.
- **Don't** reach for dark mode. PFMS users work at a desk in daylight; the warm paper ground is correct.
- **Don't** use modal dialogs as the first response to any interaction. Exhaust inline alternatives first.
- **Don't** use blue-heavy chrome, overloaded sidebars, or corporate nav patterns. These are the Salesforce anti-references.
- **Don't** use grid-everything density where every cell has the same visual weight. This is the SAP/Excel pattern.
- **Don't** use gradient metric cards, neon accents, or dark backgrounds with glowing numbers. These are the startup dashboard anti-references.
