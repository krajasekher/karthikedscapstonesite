/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-detail. Base: carousel.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 * Generated: 2026-09-07
 *
 * Structure (from library-description.txt): 2 columns, multiple rows.
 * Row 1: block name. Each subsequent row = one slide:
 *   cell 1 (mandatory): image
 *   cell 2 (optional): text content (title / description / CTA)
 * Source: AEM Core Carousel — slides are `.cmp-carousel__item`, each with a
 * `.cmp-image img`. Text content is optional per slide.
 */
export default function parse(element, { document }) {
  // Each slide is a carousel item. Fall back to the whole element if the
  // core-component wrapper class is absent on some pages.
  let slides = Array.from(element.querySelectorAll('.cmp-carousel__item'));
  if (!slides.length) {
    slides = Array.from(element.querySelectorAll('[class*="carousel__item"], .carousel-item'));
  }

  const cells = [];

  slides.forEach((slide) => {
    // Image cell (mandatory)
    const img = slide.querySelector('.cmp-image img, img');

    // Text content cell (optional): headings, paragraphs, and CTAs, excluding
    // the navigation/indicator chrome and the image itself.
    const textContent = [];
    slide.querySelectorAll('h1, h2, h3, h4, h5, h6, p, a[href]').forEach((node) => {
      // Skip navigation action text / indicators if any bleak into the slide.
      if (node.closest('.cmp-carousel__actions, .cmp-carousel__indicators')) return;
      textContent.push(node);
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

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-detail', cells });
  element.replaceWith(block);
}
