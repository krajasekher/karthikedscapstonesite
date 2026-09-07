/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Removes non-authorable site chrome. All selectors verified against
 * migration-work/cleaned.html (representative: bali-surf-camp.html).
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Mobile-only navigation overlay + hamburger toggle (site shell chrome).
    // Verified in cleaned.html: <div id="toggleNav"> (l.496), <div id="mobileNav"> (l.502).
    WebImporter.DOMUtils.remove(element, [
      '#toggleNav',
      '#mobileNav',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable global chrome.
    // Verified in cleaned.html:
    //  - header.cmp-experiencefragment--header (l.5): logo, sign-in, language nav, main nav, search
    //  - footer.cmp-experiencefragment--footer (l.399): footer nav, social buttons, copyright
    //  - iframe#destination_publishing_iframe... (l.494): Adobe ID syncing tracking iframe
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      'iframe',
    ]);
  }
}
