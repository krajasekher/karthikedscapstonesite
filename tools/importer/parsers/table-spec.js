/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-spec. Base: table (no-header variant).
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 * Generated: 2026-09-07
 *
 * Structure (from library-description.txt): multiple columns/rows; first row is
 * the block name (with the "no header" variant), each subsequent row is a data
 * row. Here the adventure metadata is a key/value spec list, so the table is
 * 2 columns: label | value.
 *
 * Source: AEM Content Fragment — a `<dl class="cmp-contentfragment__elements">`
 * whose elements are `.cmp-contentfragment__element` wrappers, each holding a
 * `dt.cmp-contentfragment__element-title` (label) and a
 * `dd.cmp-contentfragment__element-value` (value).
 */
export default function parse(element, { document }) {
  // The element may be the wrapping div or the <dl> itself (union selectors).
  // Prefer explicit element wrappers; fall back to raw dt/dd pairs.
  let pairs = Array.from(element.querySelectorAll('.cmp-contentfragment__element'));

  const cells = [];

  if (pairs.length) {
    pairs.forEach((pair) => {
      const dt = pair.querySelector('dt, .cmp-contentfragment__element-title');
      const dd = pair.querySelector('dd, .cmp-contentfragment__element-value');
      const label = dt ? (dt.textContent || '').trim() : '';
      const value = dd ? (dd.textContent || '').trim() : '';
      if (label || value) cells.push([label, value]);
    });
  } else {
    // Fallback: iterate raw dt/dd siblings.
    const dts = Array.from(element.querySelectorAll('dt'));
    dts.forEach((dt) => {
      const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === 'DD'
        ? dt.nextElementSibling
        : null;
      const label = (dt.textContent || '').trim();
      const value = dd ? (dd.textContent || '').trim() : '';
      if (label || value) cells.push([label, value]);
    });
  }

  // Empty-block guard: no spec rows found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-spec', cells });
  element.replaceWith(block);
}
