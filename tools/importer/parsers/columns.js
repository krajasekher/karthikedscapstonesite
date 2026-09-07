/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns. Base: columns.
 * Source: https://wknd.site/us/en.html (featured + hero teasers)
 *         https://wknd.site/us/en/magazine.html (featured + members-only secure teasers)
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
 * Covers --featured, --hero.--imagebottom, and --list.--secure ("Members Only")
 * instances (same content model).
 *
 * CTA resilience: featured/hero teasers expose a real `a.cmp-teaser__action-link`,
 * but the members-only "secure" teasers render "Read More" as PLAIN TEXT inside
 * `.cmp-teaser__action-container` with no `<a>` (the article is locked). We
 * extract the anchor when present, otherwise fall back to the action container's
 * text so the CTA label is never dropped.
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

  // CTA extraction. Featured/hero teasers have a real anchor
  // (`a.cmp-teaser__action-link`). Secure/members-only teasers render the
  // "Read More" label as plain text inside `.cmp-teaser__action-container`
  // with NO anchor (locked article) — capture that text so the CTA is not lost.
  const ctaLinks = Array.from(content.querySelectorAll(
    '.cmp-teaser__action-link, .cmp-teaser__action-container a[href]',
  ));
  const seenCta = new Set();
  ctaLinks.forEach((a) => {
    if (!seenCta.has(a) && !textContent.includes(a)) {
      seenCta.add(a);
      textContent.push(a);
    }
  });
  if (!ctaLinks.length) {
    // No anchor CTA — fall back to any action container(s) with a text label.
    content.querySelectorAll('.cmp-teaser__action-container').forEach((container) => {
      if (container.querySelector('a[href]')) return; // already handled above
      if (container.textContent && container.textContent.trim()) {
        textContent.push(container);
      }
    });
  }

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
