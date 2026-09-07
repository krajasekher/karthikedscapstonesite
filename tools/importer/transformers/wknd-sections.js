/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks / section metadata.
 * Inserts an <hr> before every non-first section from payload.template.sections,
 * and a Section Metadata block after each section that has a style.
 *
 * Section selectors are DOM-verified boundaries from page-templates.json
 * (detail-with-tabs), confirmed against migration-work/cleaned.html:
 *   - div.breadcrumb.cmp-breadcrumb--fixed          (l.165)
 *   - div.carousel.panelcontainer.cmp-carousel--mini (l.181)
 *   - div.title.cmp-title--underline                 (l.214)
 *   - div.tabs.panelcontainer                        (l.279)
 *
 * All sections in this template have style=null, so no Section Metadata blocks
 * are produced; the transformer still handles styled sections generically.
 */
const SECTION_MARKER_ATTR = 'data-excat-section-id';

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break, no metadata
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue; // selector didn't match on this page — skip, never guess

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers may have replaced section elements. Anchor each styled section's
    // Section Metadata block to whichever still exists: the marker <hr> or the
    // original element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || element.querySelector(section.selector);
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove();
      }
    }
  }
}
