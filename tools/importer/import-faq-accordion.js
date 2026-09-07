/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import accordionParser from './parsers/accordion.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import internalLinksTransformer from './transformers/wknd-internal-links.js';
import faqHeadingsTransformer from './transformers/wknd-faq-headings.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  accordion: accordionParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'faq-accordion',
  description: 'FAQ support page: header (title + hero image + intro) followed by an accordion of expandable Q&A rows and a Need more help contact block.',
  urls: [
    'https://wknd.site/us/en/faqs.html',
  ],
  blocks: [
    { name: 'accordion', instances: ['div.accordion.panelcontainer', '.cmp-accordion'] },
  ],
  sections: [
    { id: 'page-header', name: 'Page header', selector: 'div.title.cmp-title--underline', style: null, blocks: [], defaultContent: ['h1.cmp-title__text', '.cmp-image img', 'p'] },
    { id: 'faq-accordion', name: 'FAQ accordion', selector: 'div.accordion.panelcontainer', style: null, blocks: ['accordion'], defaultContent: [] },
    { id: 'need-more-help', name: 'Need more help', selector: 'div.text.cmp-text--font-small', style: null, blocks: [], defaultContent: ['h3.cmp-title__text', 'p'] },
  ],
};

// TRANSFORMER REGISTRY - cleanup → internal-links → section breaks
const transformers = [
  cleanupTransformer,
  internalLinksTransformer,
  faqHeadingsTransformer,
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
