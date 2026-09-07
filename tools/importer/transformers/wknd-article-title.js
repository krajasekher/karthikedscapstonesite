/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: article-detail duplicate-title cleanup.
 *
 * The WKND article body is an AEM content fragment that auto-renders its title
 * as a leading `h3.cmp-contentfragment__title`. The live site hides this via CSS,
 * but the importer captures it — producing a duplicate of the page's H1 title
 * ("Aloha Spirits in Northern Norway" appearing as both H1 and a body H3).
 *
 * This removes the content-fragment title heading ONLY when its text matches the
 * page H1, so it is a safe no-op on any page whose fragment title differs from
 * the H1. Generic across all article-detail pages (title text is read at runtime,
 * never hardcoded). Wired only into import-article-detail.js.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const { document } = payload;

  const h1 = document.querySelector('h1');
  const h1Text = h1 ? (h1.textContent || '').trim() : '';
  if (!h1Text) return;

  element.querySelectorAll('.cmp-contentfragment__title').forEach((title) => {
    if ((title.textContent || '').trim() === h1Text) {
      title.remove();
    }
  });
}
