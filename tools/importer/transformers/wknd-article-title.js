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
 * `.cmp-contentfragment__title` is the CF component's auto-rendered title — always
 * hidden as chrome on the live WKND site — so it is removed unconditionally. This
 * transformer is wired ONLY into import-article-detail.js, where that class always
 * denotes the article title (not authored body content), so unconditional removal
 * is safe and handles title-text variants (e.g. page H1 "San Diego Surf Spots" vs
 * fragment title "San Diego Surfspots").
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  element.querySelectorAll('.cmp-contentfragment__title').forEach((title) => {
    title.remove();
  });
}
