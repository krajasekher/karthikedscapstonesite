/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion. Base: accordion.
 * Source: https://wknd.site/us/en/faqs.html (AEM Core Accordion component).
 * Generated: 2026-09-07
 *
 * Structure (per library-description.txt): 2 columns, multiple rows.
 * First row = block name. Each subsequent row = one accordion item:
 *   cell 1 = title (question), cell 2 = content (answer body).
 *
 * Source DOM (AEM Core Accordion):
 *   .cmp-accordion__item
 *     .cmp-accordion__title            -> question text
 *     .cmp-accordion__panel            -> answer body (marked --hidden but text IS present)
 *
 * IMPORTANT: every .cmp-accordion__panel carries the full answer text even though it
 * has the cmp-accordion__panel--hidden class in the initial DOM (not lazy-loaded).
 * We MUST extract the panel content for every item — hidden panels are NOT skipped.
 */
export default function parse(element, { document }) {
  // Union selector resilience: element may be the outer .accordion.panelcontainer
  // or the inner .cmp-accordion. Locate all accordion items either way.
  const items = Array.from(element.querySelectorAll('.cmp-accordion__item'));

  const cells = [];

  items.forEach((item) => {
    // Question: title span (fallback to header/button text if class differs).
    const titleEl = item.querySelector('.cmp-accordion__title, .cmp-accordion__button, .cmp-accordion__header');
    const question = titleEl ? (titleEl.textContent || '').trim() : '';

    // Answer: full contents of the panel. Do NOT skip --hidden panels; text is present.
    const panel = item.querySelector('.cmp-accordion__panel');

    // Prefer the inner text/content wrapper so we keep semantic markup (p, h3, etc.)
    // without the extra container/responsivegrid scaffolding.
    let answerContent = [];
    if (panel) {
      const textWrappers = Array.from(panel.querySelectorAll('.cmp-text'));
      if (textWrappers.length) {
        // Pull the semantic child nodes (paragraphs, headings, etc.) from each text wrapper.
        // Skip empty/whitespace-only nodes (e.g. stray <h3>&nbsp;</h3>) so answers stay clean.
        textWrappers.forEach((tw) => {
          Array.from(tw.children).forEach((child) => {
            if ((child.textContent || '').replace(/ /g, ' ').trim()) {
              answerContent.push(child);
            }
          });
        });
      }
      // Fallback: if no .cmp-text children were captured, use the whole panel's children.
      if (!answerContent.length) {
        answerContent = Array.from(panel.children);
      }
      // Final fallback: raw text if no element children at all.
      if (!answerContent.length) {
        const txt = (panel.textContent || '').trim();
        if (txt) answerContent.push(txt);
      }
    }

    // Only emit a row if we have a question; an empty answer would be a real content gap.
    if (question || answerContent.length) {
      const questionCell = question || '';
      const answerCell = answerContent.length ? answerContent : '';
      cells.push([questionCell, answerCell]);
    }
  });

  // Empty-block guard: nothing extracted, leave content in place.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
