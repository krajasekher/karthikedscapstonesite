/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns. Base: columns.
 * Source: https://wknd.site/us/en.html
 * Generated: 2026-09-07
 *
 * Structure (from library-description.txt): multiple columns/rows; column count
 * is driven by the natural grouping of content. Row 1: block name. This teaser
 * panel has two natural columns — an image and a text block — so:
 *   Row 2, cell 1: text content (pretitle / title / description / CTA)
 *   Row 2, cell 2: image
 * Source: AEM Core Teaser (`.cmp-teaser`). Content lives in `.cmp-teaser__content`
 * (`.cmp-teaser__pretitle`, `.cmp-teaser__title`, `.cmp-teaser__description`,
 * `.cmp-teaser__action-link`); the image is in `.cmp-teaser__image .cmp-image img`.
 * Covers both --featured and --hero.--imagebottom instances (same content model).
 */
export default function parse(element, { document }) {
  const teaser = element.querySelector('.cmp-teaser') || element;
  const content = teaser.querySelector('.cmp-teaser__content') || teaser;

  // Image cell.
  const img = teaser.querySelector('.cmp-teaser__image img, .cmp-image img, img');

  // Text cell: pretitle (eyebrow), title, description, and CTA link(s).
  const textContent = [];

  const pretitle = content.querySelector('.cmp-teaser__pretitle');
  if (pretitle) textContent.push(pretitle);

  const title = content.querySelector('.cmp-teaser__title, h1, h2, h3, h4, h5, h6');
  if (title) textContent.push(title);

  const description = content.querySelector('.cmp-teaser__description');
  if (description) textContent.push(description);

  content.querySelectorAll('.cmp-teaser__action-link, .cmp-teaser__action-container a[href]').forEach((a) => {
    if (!textContent.includes(a)) textContent.push(a);
  });

  // Empty-block guard: no meaningful content found.
  if (!title && !description && !img) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  // Two columns: text on one side, image on the other.
  cells.push([textContent.length ? textContent : '', img || '']);

  // The --hero/--imagebottom teaser is a full-bleed image with a text overlay,
  // visually distinct from the contained --featured grey panel. Emit it as a
  // "columns (hero)" variant so CSS can style each treatment separately.
  const isHero = element.matches('.cmp-teaser--hero, .cmp-teaser--imagebottom')
    || element.querySelector('.cmp-teaser--hero, .cmp-teaser--imagebottom') !== null
    || (teaser.classList
      && (teaser.classList.contains('cmp-teaser--hero') || teaser.classList.contains('cmp-teaser--imagebottom')));
  const name = isHero ? 'columns (hero)' : 'columns';

  const block = WebImporter.Blocks.createBlock(document, { name, cells });
  element.replaceWith(block);
}
