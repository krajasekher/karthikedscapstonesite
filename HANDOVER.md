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
4. **Remote branches** — feature branches are deleted after merge; `main` is the shipped code.

## Dynamic listings (index-driven)

The homepage, magazine, and adventures listings are built at runtime from the query index, so newly published pages appear automatically — no hand-authored cards.

**Query index** — `/query-index.json`, created via the Admin Config API (`PUT /config/{org}/sites/{site}/content/query.yaml`), not a repo file. Indexes `/us/en/**` (excludes nav/footer/fragments) and extracts per page: `title` (og:title), `image` (og:image), `description` (og:description), `category` (`meta[name=category]`), `lastModified` (Last-Modified header). `path` is implicit.

**Blocks** (both reuse existing styling verbatim so output is pixel-identical to the former static cards):
- `cards-index` — fetches the index, filters by `source` path-prefix (excluding the listing page itself), sorts by `lastModified` desc, optional `limit`. Builds the exact `cards` DOM and carries the `cards` class (`cards-index.css` `@import`s `cards/cards.css`). Used by: **magazine** (all articles) and **homepage** (Recent Articles limit 4 + Next Adventures limit 4).
- `adventures-index` — builds an **All** tab plus one tab per distinct `category` value; each panel is a `cards` grid filtered by category. Reuses `tabs-detail` (tab UI) + `cards` (grid) via CSS `@import`. Used by: **adventures**. Config: `source`, optional `categories` (fixes tab order), `all-label`, `sort`.

**Category model** — adventures carry a `Category` metadata row (single value, or comma-separated for multi: `cycling-tuscany` = `Cycling, Travel`). Live counts: Climbing 2, Cycling 4, Skiing 3, Surfing 2, Travel 6. Articles are distinguished from adventures by path prefix (`/us/en/magazine/` vs `/us/en/adventures/`), no template field needed. New categories grow their own tab automatically.

**Authoring** — each listing page holds a single small block table (e.g. `cards-index` with `source` + `sort` cells); the static `cards`/`tabs-detail` blocks are untouched and remain available as fallbacks. Shipped via PRs #16 (`cards-index`) and #17 (`adventures-index`).

**Operational note** — index config and (re)indexing are done via the Admin API. On publish/unpublish, the served `query-index.json` needs a preview-regen + live-publish of the index to reflect adds; **removals require `DELETE /index/...`** (async, 202) before republishing. A brief propagation delay (~10–15s) applies to both.

## Known exceptions (dynamic listings)

- **`/us/en/magazine/new-magazine`** ("Test magazine") — a real article kept live by request; appears as a card in the magazine + homepage Recent Articles listings until its metadata title is corrected or it is removed.
- **`cycling-southern-utah`** — uncategorized in the original WKND content (only in "All"); assigned `Cycling` here so it files under a tab. This makes the live Cycling tab count 4 vs the original hand-authored 3.
- **Ordering is recency-based** (`lastModified` desc) across all dynamic listings — correct for "newest first," but differs from the original hand-curated ordering.
