/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: fix faq-accordion heading hierarchy.
 *
 * The source FAQ page renders its lone secondary heading ("Need more help?")
 * as an <h3>, directly after the <h1> page title. The accordion questions are
 * <summary> elements (not headings), so nothing sits at h2 — the page heading
 * order is h1 → h3, which skips h2 and fails Lighthouse's "heading elements in
 * sequentially-descending order" (a11y) check.
 *
 * "Need more help?" is the sole second-level section heading on the page, so
 * promote it to <h2>, making the sequence h1 → h2 (descends one level at a
 * time). Scoped to a leading h3 with no preceding h2 so it won't disturb any
 * legitimately-nested h3 subheadings.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;
  const { document } = payload;

  let seenH2 = false;
  element.querySelectorAll('h2, h3').forEach((h) => {
    if (h.tagName === 'H2') {
      seenH2 = true;
      return;
    }
    // h3 with no h2 before it → promote to h2 to keep the outline descending.
    if (!seenH2) {
      const h2 = document.createElement('h2');
      if (h.id) h2.id = h.id;
      h2.append(...h.childNodes);
      h.replaceWith(h2);
      seenH2 = true;
    }
  });
}
