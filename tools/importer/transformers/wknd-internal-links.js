/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: strip `.html` from internal WKND links.
 *
 * The source markup links to internal pages with a `.html` extension
 * (e.g. /us/en/magazine/arctic-surfing.html). On Edge Delivery Services those
 * pages are served extensionless (/us/en/magazine/arctic-surfing); the `.html`
 * form 404s. This rewrites every same-site internal anchor to the extensionless
 * path so links resolve on the live site.
 *
 * Scope: only root-relative `/`-prefixed hrefs ending in `.html` (internal
 * pages). External URLs, in-page `#` anchors, mailto:, and asset paths
 * (/…/assets/… images) are left untouched.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  element.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || '';
    // Only internal, root-relative page links ending in .html — not assets.
    if (/^\/(?!.*\/assets\/).*\.html$/.test(href)) {
      a.setAttribute('href', href.replace(/\.html$/, ''));
    }
  });
}
