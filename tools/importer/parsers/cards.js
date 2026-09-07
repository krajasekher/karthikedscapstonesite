/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards. Base: cards.
 * Source: https://wknd.site/us/en.html (image-list article cards)
 *         https://wknd.site/us/en/about-us.html (contributor / person cards)
 * Generated: 2026-09-07
 *
 * Structure (from library-description.txt): 2 columns, multiple rows.
 * Row 1: block name. Each subsequent row = one card:
 *   cell 1 (mandatory): card image
 *   cell 2 (mandatory): text content (title / description / CTA)
 *
 * This parser handles TWO source shapes and branches on the element it receives:
 *
 * 1. AEM Core Image List (magazine / homepage article cards). Cards are
 *    `.cmp-image-list__item`, each with a `.cmp-image-list__item-image img`, a
 *    `.cmp-image-list__item-title` (inside a title link), and a
 *    `.cmp-image-list__item-description`. One image-list element yields many
 *    card rows.
 *
 * 2. AEM Experience Fragment contributor/person cards (about-us). The block
 *    mapping selector `div.experiencefragment.cmp-experience-fragment--contributor`
 *    matches EACH person individually (the mapping selector is tag-agnostic —
 *    contributors are `<section>` elements on the live page), so this parser is
 *    invoked once per contributor and emits a single-card block. Each contributor card has an
 *    avatar (`.cmp-image img`), an `h3.cmp-title__text` name, an
 *    `h5.cmp-title__text` role, and 3 social links (`a.cmp-button` /
 *    `.cmp-buildingblock--btn-list a`, with `#`-hrefs). Image cell = avatar;
 *    text cell = [name h3, role h5, social links]. The import script's dedup +
 *    section grouping stacks the individual single-card blocks into the grid.
 */
export default function parse(element, { document }) {
  // --- Branch: contributor / person Experience Fragment card ------------------
  // Detect whether this element IS a contributor XF or CONTAINS one. The mapping
  // selector matches each person individually, so we emit ONE card row here.
  const isContributor = (element.classList
      && element.classList.contains('cmp-experience-fragment--contributor'))
    || element.matches?.('.cmp-experience-fragment--contributor')
    || element.querySelector('.cmp-experience-fragment--contributor') !== null;

  if (isContributor) {
    // Scope to the contributor element itself when the match is a descendant.
    const first = element.matches?.('.cmp-experience-fragment--contributor')
      ? element
      : (element.querySelector('.cmp-experience-fragment--contributor') || element);

    // GROUPING: a person grid is a run of consecutive contributor siblings under
    // the same parent (about-us has two grids — Contributors ×4, Guides ×3).
    // The mapping selector matches each person separately, so the import script
    // invokes this parser once per contributor. To emit ONE grid block per run
    // (not one block per person), the FIRST contributor of a run collects all its
    // consecutive contributor siblings here and removes them; when the parser is
    // later invoked on those already-removed siblings, they are detached from the
    // DOM and the import script's `parentNode` guard skips them.
    const isContribEl = (el) => el
      && el.nodeType === 1
      && (el.classList?.contains('cmp-experience-fragment--contributor')
        || el.matches?.('.cmp-experience-fragment--contributor'));

    // Walk back to the start of this run so any entry point produces the same run.
    let runStart = first;
    while (isContribEl(runStart.previousElementSibling)) {
      runStart = runStart.previousElementSibling;
    }
    // If this invocation is not the run's first contributor, let the run-start
    // invocation handle the whole group; unwrap this node so it leaves no markup.
    if (runStart !== first) {
      element.replaceWith(...element.childNodes);
      return;
    }

    // Collect the consecutive run of contributor siblings.
    const people = [];
    for (let el = runStart; isContribEl(el); el = el.nextElementSibling) {
      people.push(el);
    }

    const cells = [];
    people.forEach((person) => {
      const avatar = person.querySelector('.cmp-image img, img');
      const textContent = [];
      const name = person.querySelector('h3.cmp-title__text, .cmp-title h3, h3');
      if (name) textContent.push(name);
      const role = person.querySelector('h5.cmp-title__text, .cmp-title h5, h5');
      if (role) textContent.push(role);

      // Social links (Facebook / Twitter / Instagram) — icon-only buttons, some
      // with `#` hrefs. Fall back to any anchor in the button list.
      let socialLinks = Array.from(person.querySelectorAll(
        '.cmp-buildingblock--btn-list a.cmp-button, .cmp-button--icononly a, a.cmp-button',
      ));
      if (!socialLinks.length) {
        socialLinks = Array.from(person.querySelectorAll('.cmp-buildingblock--btn-list a[href]'));
      }
      const seen = new Set();
      socialLinks.forEach((a) => {
        if (!seen.has(a)) { seen.add(a); textContent.push(a); }
      });

      if (avatar || name) {
        cells.push([avatar || '', textContent.length ? textContent : '']);
      }
    });

    // Empty-block guard.
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }

    // Person cards are a distinct visual treatment (circular avatars, centered
    // text, social-icon row), so emit a "cards (person)" variant → .cards.person.
    const block = WebImporter.Blocks.createBlock(document, { name: 'cards (person)', cells });
    // Replace the run-start with the grid block; remove the remaining siblings so
    // they are detached before their own parser invocation runs.
    people.slice(1).forEach((p) => p.remove());
    runStart.replaceWith(block);
    return;
  }

  // --- Branch: AEM Core Image List article cards (unchanged behavior) ---------
  // Each card is an image-list item. Fall back to a looser match if the
  // core-component wrapper class is absent on some pages.
  let items = Array.from(element.querySelectorAll('.cmp-image-list__item'));
  if (!items.length) {
    items = Array.from(element.querySelectorAll('li[class*="image-list__item"], .cards-card'));
  }

  const cells = [];

  items.forEach((item) => {
    // Image cell (mandatory).
    const img = item.querySelector('.cmp-image-list__item-image img, .cmp-image img, img');

    // Text content cell: title (as a link), description, and any CTA link.
    const textContent = [];

    // Title: prefer the title link so the card remains clickable; fall back to
    // the bare title span.
    const titleLink = item.querySelector('a.cmp-image-list__item-title-link');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    if (titleLink && titleText) {
      textContent.push(titleLink);
    } else if (titleText) {
      textContent.push(titleText);
    } else if (titleLink) {
      textContent.push(titleLink);
    }

    // Description.
    const description = item.querySelector('.cmp-image-list__item-description, p');
    if (description) textContent.push(description);

    // Only emit a row if there is an image (mandatory for a card).
    if (img) {
      cells.push([img, textContent.length ? textContent : '']);
    }
  });

  // Empty-block guard: no valid cards found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards', cells });
  element.replaceWith(block);
}
