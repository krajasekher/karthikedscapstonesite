/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-detail. Base: tabs.
 * Source: https://wknd.site/us/en/adventures/bali-surf-camp.html
 * Generated: 2026-09-07
 *
 * Structure (from library-description.txt): 2 columns, multiple rows. Row 1 is
 * the block name; each subsequent row is one tab:
 *   cell 1 (mandatory): tab label
 *   cell 2 (mandatory): tab content (rich body)
 *
 * Source: AEM Core Tabs — labels are `<li class="cmp-tabs__tab">` inside
 * `.cmp-tabs__tablist`; content panels are `.cmp-tabs__tabpanel`, matched to
 * labels by document order. Each panel wraps a content fragment whose body is
 * a mix of paragraphs, images, and lists interspersed with empty layout grids.
 */
export default function parse(element, { document }) {
  const labels = Array.from(element.querySelectorAll('.cmp-tabs__tablist .cmp-tabs__tab, .cmp-tabs__tab'));
  const panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));

  // The source content-fragment repeats its title (the adventure name) as the
  // leading heading of every panel; the AEM component hides it via CSS, so it is
  // duplicate chrome, not authored body content. Detect it generically (rather
  // than hardcoding a page title) as the leading heading text that recurs across
  // 2+ panels, and drop it from every panel so the re-import stays clean.
  const leadingHeadingText = (panel) => {
    const h = panel.querySelector('h1, h2, h3, h4, h5, h6');
    return h ? (h.textContent || '').trim() : '';
  };
  const leadingCounts = {};
  panels.forEach((panel) => {
    const t = leadingHeadingText(panel);
    if (t) leadingCounts[t] = (leadingCounts[t] || 0) + 1;
  });
  const repeatedTitles = new Set(
    Object.keys(leadingCounts).filter((t) => leadingCounts[t] > 1),
  );

  const cells = [];

  panels.forEach((panel, i) => {
    // Label text for this panel (by order). Fall back to a generic label.
    const labelEl = labels[i];
    const label = labelEl ? (labelEl.textContent || '').trim() : `Tab ${i + 1}`;

    // Collect meaningful body content in document order, skipping the empty
    // layout grid scaffolding. Images are pulled from their wrappers directly.
    const contentCell = [];
    panel.querySelectorAll('h2, h3, h4, h5, h6, p, ul, ol, img').forEach((node) => {
      if (node.tagName === 'IMG') {
        contentCell.push(node);
        return;
      }
      // Skip empty text containers (layout grids often produce blank <p>/<div>).
      if (!(node.textContent || '').trim()) return;
      // Skip the repeated content-fragment title heading (duplicate chrome).
      if (/^H[1-6]$/.test(node.tagName) && repeatedTitles.has((node.textContent || '').trim())) return;
      contentCell.push(node);
    });

    cells.push([label, contentCell.length ? contentCell : '']);
  });

  // Empty-block guard: no tab panels found.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-detail', cells });
  element.replaceWith(block);
}
