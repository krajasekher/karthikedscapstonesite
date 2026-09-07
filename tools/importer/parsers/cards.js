/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards. Base: cards.
 * Source: https://wknd.site/us/en.html
 * Generated: 2026-09-07
 *
 * Structure (from library-description.txt): 2 columns, multiple rows.
 * Row 1: block name. Each subsequent row = one card:
 *   cell 1 (mandatory): card image
 *   cell 2 (mandatory): text content (title / description / CTA)
 * Source: AEM Core Image List. Cards are `.cmp-image-list__item`, each with a
 * `.cmp-image-list__item-image img`, a `.cmp-image-list__item-title` (inside a
 * title link), and a `.cmp-image-list__item-description`. The item image is
 * wrapped in a link to the article — the title link points to the same target.
 */
export default function parse(element, { document }) {
  // Each card is an image-list item. Fall back to a looser match if the
  // core-component wrapper class is absent on some pages.
  let items = Array.from(element.querySelectorAll('.cmp-image-list__item'));
  if (!items.length) {
    items = Array.from(element.querySelectorAll('li[class*="image-list__item"], .cards-card'));
  }

  const cells = [];

  items.forEach((item) => {
    // Image cell (mandatory).
    const img = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');

    // Text content cell: title (as a link), description, and any CTA link.
    const textContent = [];

    // Title: prefer the title link so the card remains clickable; fall back to
    // the bare title span.
    const titleLink = item.querySelector('a.cmp-image-list__item-title-link');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    if (titleLink && titleText) {
      textContent.push(titleLink);
    } else if (titleText) {
      textContent.push(titleText);
    } else if (titleLink) {
      textContent.push(titleLink);
    }

    // Description.
    const description = item.querySelector('.cmp-image-list__item-description, p');
    if (description) textContent.push(description);

    // Only emit a row if there is an image (mandatory for a card).
    if (img) {
      cells.push([img, textContent.length ? textContent : '']);
    }
  });

  // Empty-block guard: no valid cards found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
