/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://wknd.site/us/en.html
 * Generated: 2026-09-07
 *
 * Structure (from library-description.txt): 2 columns, multiple rows.
 * Row 1: block name. Each subsequent row = one slide:
 *   cell 1 (mandatory): slide image
 *   cell 2 (optional): text content (title / description / CTA)
 * Source: AEM Core Carousel (--hero). Slides are `.cmp-carousel__item`, each
 * wrapping a `.cmp-teaser` with `.cmp-teaser__content` (h2 title, description,
 * action link) and a `.cmp-teaser__image .cmp-image img`. Unlike the detail
 * carousel, hero slides DO carry text content in cell 2.
 */
export default function parse(element, { document }) {
  // Each slide is a carousel item. Fall back to a looser match if the
  // core-component wrapper class is absent on some pages.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll('[class*="carousel__item"], .carousel-item'));
  }

  const cells = [];

  slides.forEach((slide) => {
    // Image cell (mandatory).
    const img = slide.querySelector('.cmp-teaser__image img, .cmp-image img, img');

    // Text content cell (optional): title, description, and CTA link.
    // Pull from the teaser content, skipping the carousel navigation chrome.
    const content = slide.querySelector('.cmp-teaser__content') || slide;
    const textContent = [];

    const title = content.querySelector('h1, h2, h3, h4, h5, h6, .cmp-teaser__title');
    if (title) textContent.push(title);

    const description = content.querySelector('.cmp-teaser__description, p');
    if (description && description !== title) textContent.push(description);

    content.querySelectorAll('a[href]').forEach((a) => {
      if (a.closest('.cmp-carousel__actions, .cmp-carousel__indicators')) return;
      textContent.push(a);
    });

    // Only emit a row if there is an image (mandatory for a slide).
    if (img) {
      cells.push([img, textContent.length ? textContent : '']);
    }
  });

  // Empty-block guard: no valid slides found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
