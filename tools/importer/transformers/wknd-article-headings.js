/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: fix article-detail heading hierarchy.
 *
 * The source article header renders the byline ("By {Author}") as an <h4>,
 * directly after the <h1> title — so the page heading order is h1 → h4 → h2…,
 * which skips h2/h3 and fails Lighthouse's "heading elements in sequentially-
 * descending order" (a11y) check.
 *
 * The byline is semantically a subtitle of the H1, so demote it to <h2>, making
 * the sequence h1 → h2 → h2… (descends one level at a time). Applies to all
 * article-detail pages. Scoped to a byline-style h4 ("By …") so it won't touch
 * legitimate h4 subheadings elsewhere.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;
  const { document } = payload;

  element.querySelectorAll('h4').forEach((h4) => {
    const text = (h4.textContent || '').trim();
    // Byline pattern: "By {name}". Only demote these.
    if (/^by\s+\S/i.test(text)) {
      const h2 = document.createElement('h2');
      // preserve id + inline content
      if (h4.id) h2.id = h4.id;
      h2.append(...h4.childNodes);
      h4.replaceWith(h2);
    }
  });
}
