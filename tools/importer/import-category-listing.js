/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsParser from './parsers/columns.js';
import tabsCardsParser from './parsers/tabs-cards.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import internalLinksTransformer from './transformers/wknd-internal-links.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
// Note: tabs-cards emits a `tabs-detail` block with nested `cards` tables per tab,
// so it reuses the existing tabs-detail + cards styling. No standalone cards parser
// is registered here — the image-list grids are emitted only as nested tables.
const parsers = {
  columns: columnsParser,
  'tabs-cards': tabsCardsParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'category-listing',
  description: 'Adventures category landing: h1 + hero intro teaser + a tabbed category listing (6 tabs) with a nested cards grid of adventures per tab.',
  urls: [
    'https://wknd.site/us/en/adventures.html',
  ],
  blocks: [
    { name: 'columns', instances: ['div.teaser.cmp-teaser--hero', 'div.teaser.cmp-teaser--featured'] },
    { name: 'tabs-cards', instances: ['div.tabs.panelcontainer'] },
  ],
  sections: [
    { id: 'page-title', name: 'Page title', selector: 'main .title', style: null, blocks: [], defaultContent: ['h1.cmp-title__text', '.cmp-title'] },
    { id: 'hero-intro', name: 'Hero intro', selector: 'div.teaser.cmp-teaser--hero', style: null, blocks: ['columns'], defaultContent: [] },
    { id: 'current-adventures', name: 'Current Adventures', selector: 'div.tabs.panelcontainer', style: null, blocks: ['tabs-cards'], defaultContent: ['h2.cmp-title__text'] },
  ],
};

// TRANSFORMER REGISTRY - cleanup → internal-links → section breaks
const transformers = [
  cleanupTransformer,
  internalLinksTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  (template.blocks || []).forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks and parse (skip elements detached by an earlier parser)
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 3. afterTransform cleanup + internal-link rewrite + section breaks
    executeTransformers('afterTransform', main, payload);

    // 4. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Sanitized document path (map root URL to /index)
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
