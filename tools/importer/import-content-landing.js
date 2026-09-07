/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS (reused from homepage template)
import cardsParser from './parsers/cards.js';
import columnsParser from './parsers/columns.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import internalLinksTransformer from './transformers/wknd-internal-links.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  cards: cardsParser,
  columns: columnsParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'content-landing',
  description: 'Overview landing pages (about-us, magazine): h1 + stacked sections of teasers and card grids (article cards, person/contributor cards).',
  urls: [
    'https://wknd.site/us/en/about-us.html',
    'https://wknd.site/us/en/magazine.html',
  ],
  blocks: [
    {
      name: 'cards',
      instances: [
        '.experiencefragment.cmp-experience-fragment--contributor', // about-us person cards (<section>)
        'div.image-list.list', // magazine article grid
      ],
    },
    {
      name: 'columns',
      instances: [
        'div.teaser.cmp-teaser--featured', // magazine featured
        'div.teaser.cmp-teaser--list.cmp-teaser--secure', // magazine members-only
      ],
    },
  ],
  sections: [
    { id: 'page-title', name: 'Page title', selector: 'main .title', style: null, blocks: [], defaultContent: ['h1.cmp-title__text', '.cmp-title'] },
    { id: 'contributors', name: 'Our Contributors', selector: '.experiencefragment.cmp-experience-fragment--contributor', style: null, blocks: ['cards'], defaultContent: ['h2.cmp-title__text', 'p'] },
    { id: 'featured', name: 'Featured teaser', selector: 'div.teaser.cmp-teaser--featured', style: null, blocks: ['columns'], defaultContent: [] },
    { id: 'all-articles', name: 'All Articles grid', selector: 'div.image-list.list', style: null, blocks: ['cards'], defaultContent: ['h2.cmp-title__text'] },
    { id: 'members-only', name: 'Members Only teasers', selector: 'div.teaser.cmp-teaser--secure', style: null, blocks: ['columns'], defaultContent: ['h2.cmp-title__text', 'p'] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, section breaks after
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

    // 3. afterTransform cleanup + section breaks
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
