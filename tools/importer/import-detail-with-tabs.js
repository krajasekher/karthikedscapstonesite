/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselDetailParser from './parsers/carousel-detail.js';
import tableSpecParser from './parsers/table-spec.js';
import tabsDetailParser from './parsers/tabs-detail.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-detail': carouselDetailParser,
  'table-spec': tableSpecParser,
  'tabs-detail': tabsDetailParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'detail-with-tabs',
  description: 'Detail page layout with breadcrumbs, an image carousel, and tabbed body content.',
  urls: [
    'https://wknd.site/us/en/adventures/bali-surf-camp.html',
  ],
  blocks: [
    {
      name: 'carousel-detail',
      instances: [
        'div.carousel.panelcontainer.cmp-carousel--mini',
        '.carousel.cmp-carousel--mini',
      ],
    },
    {
      name: 'table-spec',
      instances: [
        'div.cmp-contentfragment',
        '.cmp-contentfragment__elements',
      ],
    },
    {
      name: 'tabs-detail',
      instances: [
        'div.tabs.panelcontainer',
        '.tabs.panelcontainer',
      ],
    },
  ],
  sections: [
    {
      id: 'breadcrumb',
      name: 'Breadcrumb',
      selector: 'div.breadcrumb.cmp-breadcrumb--fixed',
      style: null,
      blocks: [],
      defaultContent: ['nav.cmp-breadcrumb', '.cmp-breadcrumb__list'],
    },
    {
      id: 'image-carousel',
      name: 'Image carousel',
      selector: 'div.carousel.panelcontainer.cmp-carousel--mini',
      style: null,
      blocks: ['carousel-detail'],
      defaultContent: [],
    },
    {
      id: 'adventure-detail',
      name: 'Adventure detail (title, metadata, share)',
      selector: 'div.title.cmp-title--underline',
      style: null,
      blocks: ['table-spec'],
      defaultContent: ['h1.cmp-title__text', '.cmp-title--underline'],
    },
    {
      id: 'tabbed-body',
      name: 'Tabbed body content',
      selector: 'div.tabs.panelcontainer',
      style: null,
      blocks: ['tabs-detail'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup runs first, section breaks after
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 */
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

/**
 * Find all blocks on the page based on the embedded template configuration.
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        // De-dupe: a union of selectors can match the same element twice.
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. beforeTransform cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already detached by a prior parser
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

    // 4. afterTransform cleanup + section breaks
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized document path (map root URL to /index)
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
