# WKND → Edge Delivery Services — Migration Handover

**Source:** wknd.site/us/en · **Live:** https://main--karthikedscapstonesite--krajasekher.aem.live
**Status:** Complete — 26 pages + nav/footer live. Responsive confirmed; Lighthouse mobile A11y 100, Performance 99–100.

## Templates migrated (26 pages)

| Template | Pages | Representative URL |
|---|---|---|
| homepage | 1 | `/us/en` |
| content-landing | 2 | `/us/en/about-us`, `/us/en/magazine` |
| category-listing | 1 | `/us/en/adventures` |
| detail-with-tabs | 16 | `/us/en/adventures/*` (adventure detail pages) |
| article-detail | 5 | `/us/en/magazine/*` (long-form articles) |
| faq-accordion | 1 | `/us/en/faqs` |
| **Chrome** | — | `nav` + `footer` fragments (site-wide) |

## Blocks

**Reused (Block Collection / boilerplate):** `cards`, `columns`, `hero`, `accordion` (native `<details>/<summary>`), `fragment`, `header`, `footer`, `widget`.

**Built for WKND:**
- `carousel-detail` — adventure hero image carousel.
- `carousel-hero` — full-bleed homepage hero variant (overlay heading/CTA; first slide eager+`fetchpriority=high` for LCP, rest lazy).
- `tabs-detail` — adventure spec tabs; decorates DA-nested tables at runtime (block-within-block).
- `table-spec` — adventure key-facts spec table.

Variants were created only where a critique showed a real gap; otherwise existing blocks were reused.

## Import infrastructure (`tools/importer/`)

**Parsers** (HTML → AEM block tables): `accordion`, `cards`, `carousel-detail`, `carousel-hero`, `columns`, `table-spec`, `tabs-cards` (nested tabs→cards for category-listing), `tabs-detail`.

**Transformers** (site-wide DOM): `wknd-cleanup` (strip non-content), `wknd-sections` (section breaks), `wknd-internal-links` (drop `.html` from internal `/us/en/*` links), `wknd-article-title`, `wknd-article-headings` (byline `h4→h2`), `wknd-faq-headings` (lead `h3→h2`).

One `import-<template>.js` per template orchestrates parsers + transformers; content bundled and pushed to Document Authoring (DA), images localized to optimized `media_*` assets.

## Design system (`styles/`)

- **Fonts:** headings **Asar** (serif), body **Source Sans Pro** — loaded deferred (non-render-blocking) via `loadFonts()`.
- **Tokens (`brand.css`):** text `#202020`, links `#0045ff`/hover `#0035cc`, light `#f4f4f4`, dark `#202020`; content max-width 1200px; nav height 64px; mobile-first breakpoints 600/900/1200.
- Heading scale xxl 40 / xl 36 / l 24 / m 16; body 18/16/14.

## Performance & accessibility

- LCP: hero image eager + `fetchpriority=high`; render-blocking Google Fonts removed from `head.html`.
- Heading order fixed site-wide (article byline, footer "Follow Us", FAQ "Need more help?") → A11y 100.

## Known notes / accepted exceptions

1. **Homepage Performance 99** — remaining item is "Minimize main-thread work." Only lever is a riskier lazy carousel-init; deliberately deferred to avoid regression for one point. All other pages 100.
2. **Footer layout** — nav + social stack vertically vs. the source's more horizontal arrangement; approved to ship as-is (final-polish item).
3. **Root `/`** — still the default AEM boilerplate index (references `mysite--aemtutorial`). The WKND homepage lives at `/us/en`. Clean up or redirect `/` if a branded root is desired.
4. **Stale remote branches** — merged feature branches (`homepage`, `article-detail`, `faq-heading`, etc.) remain on origin; safe to delete. `main` is the shipped code.
