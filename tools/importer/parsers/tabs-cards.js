/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-cards (category-listing template). Base: tabs (rendered as tabs-detail).
 * Source: https://wknd.site/us/en/adventures.html
 * Generated: 2026-09-07
 *
 * NESTED BLOCK-WITHIN-BLOCK.
 * The source is an AEM Core Tabs component (`div.tabs.panelcontainer`) whose
 * every tab panel contains a `.cmp-image-list` grid of adventure cards. This
 * parser emits ONE outer `tabs-detail` block (so it renders with the existing
 * tabs-detail block styling) whose per-tab content cell holds a NESTED `cards`
 * block table built with WebImporter.Blocks.createBlock.
 *
 * Outer table (2 columns, per Tabs library convention):
 *   Row 1: block name ("tabs-detail")
 *   Each subsequent row = one tab:
 *     cell 1 (mandatory): tab label (All / Climbing / Cycling / Skiing / Surfing / Travel)
 *     cell 2 (mandatory): tab content — a nested `cards` block element (the adventures grid)
 *
 * Nested cards table (2 columns, per cards convention), per card:
 *     cell 1 (mandatory): card image
 *     cell 2 (mandatory): title link + description
 *
 * IMPORTANT: This parser is distinct from parsers/tabs-detail.js (used by the 16
 * adventure detail pages, whose panels hold rich body content, not card grids).
 * It is mapped in the category-listing import script under the block name
 * "tabs-cards" while still emitting a "tabs-detail" EDS block. Card extraction
 * mirrors the image-list branch of parsers/cards.js.
 */

// Build a nested `cards` block element from an image-list grid element.
function buildCardsBlock(gridEl, document) {
  // Each card is an image-list item; fall back to a looser match if the
  // core-component wrapper class is absent.
  let items = Array.from(gridEl.querySelectorAll('.cmp-image-list__item'));
  if (!items.length) {
    items = Array.from(gridEl.querySelectorAll('li[class*="image-list__item"], .cards-card'));
  }

  const cells = [];
  items.forEach((item) => {
    // Image cell (mandatory).
    const img = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');

    // Text content cell: title (as a link so the card stays clickable) + description.
    const textContent = [];
    const titleLink = item.querySelector('a.cmp-image-list__item-title-link');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    if (titleLink && titleText) {
      textContent.push(titleLink);
    } else if (titleText) {
      textContent.push(titleText);
    } else if (titleLink) {
      textContent.push(titleLink);
    }

    const description = item.querySelector('.cmp-image-list__item-description, p');
    if (description) textContent.push(description);

    // Only emit a row if there is an image (mandatory for a card).
    if (img) {
      cells.push([img, textContent.length ? textContent : '']);
    }
  });

  if (!cells.length) return null;
  return WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
}

export default function parse(element, { document }) {
  const labels = Array.from(element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab, .cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  const cells = [];

  panels.forEach((panel, i) => {
    // Label text for this panel (matched to tabs by document order).
    const labelEl = labels[i];
    const label = labelEl ? (labelEl.textContent || '').trim() : `Tab ${i + 1}`;

    // Find the cards grid inside this panel. Fall back to the panel itself so
    // items are still discoverable if the grid wrapper class varies.
    const grid = panel.querySelector('.image-list, .cmp-image-list, [class*="image-list"]') || panel;
    const cardsBlock = buildCardsBlock(grid, document);

    // cell 2 is the nested cards block; pad with '' if a panel has no cards.
    cells.push([label, cardsBlock || '']);
  });

  // Empty-block guard: no tab panels found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Emit an outer "tabs-detail" block so it renders with the tabs-detail styling.
  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-detail', cells });
  element.replaceWith(block);
}
