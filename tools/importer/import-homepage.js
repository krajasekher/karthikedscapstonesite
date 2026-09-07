/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import carouselHeroParser from './parsers/carousel-hero.js';
import cardsParser from './parsers/cards.js';
import columnsParser from './parsers/columns.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'carousel-hero': carouselHeroParser,
  cards: cardsParser,
  columns: columnsParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'WKND homepage: hero carousel, featured/teaser panels, and article + adventure card grids.',
  urls: [
    'https://wknd.site/us/en.html',
  ],
  blocks: [
    { name: 'carousel-hero', instances: ['div.carousel.panelcontainer.cmp-carousel--hero', '.carousel.cmp-carousel--hero'] },
    { name: 'columns', instances: ['div.teaser.cmp-teaser--featured', 'div.teaser.cmp-teaser--hero.cmp-teaser--imagebottom'] },
    { name: 'cards', instances: ['div.image-list.list'] },
  ],
  sections: [
    { id: 'hero-carousel', name: 'Hero carousel', selector: 'div.carousel.cmp-carousel--hero', style: null, blocks: ['carousel-hero'], defaultContent: [] },
    { id: 'featured-teaser', name: 'Featured Article teaser', selector: 'div.teaser.cmp-teaser--featured', style: 'grey', blocks: ['columns'], defaultContent: [] },
    { id: 'recent-articles', name: 'Recent Articles', selector: 'div.image-list.list', style: null, blocks: ['cards'], defaultContent: ['h2.cmp-title__text', '.cmp-title'] },
    { id: 'climbing-teaser', name: 'Climbing New Zealand teaser', selector: 'div.teaser.cmp-teaser--hero.cmp-teaser--imagebottom', style: null, blocks: ['columns'], defaultContent: [] },
    { id: 'next-adventures', name: 'Next Adventures', selector: 'div.image-list.list', style: null, blocks: ['cards'], defaultContent: ['h2.cmp-title__text', 'h3.cmp-title__text', '.cmp-title'] },
  ],
};

// TRANSFORMER REGISTRY - cleanup first, section breaks after (5 sections → apply)
const transformers = [
  cleanupTransformer,
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
