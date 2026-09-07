/* eslint-disable */
/* global WebImporter */

// No parsers — article-detail is a fully default-content template (no blocks).

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/wknd-cleanup.js';
import articleTitleTransformer from './transformers/wknd-article-title.js';
import articleHeadingsTransformer from './transformers/wknd-article-headings.js';
import sectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY (empty — default content only)
const parsers = {};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'article-detail',
  description: 'Long-form magazine article: breadcrumb, hero image, H1 title + byline, article body with pull-quote, and author bio. Fully default content.',
  urls: [
    'https://wknd.site/us/en/magazine/arctic-surfing.html',
  ],
  blocks: [],
  sections: [
    { id: 'hero-image', name: 'Hero image', selector: 'div.image.aem-GridColumn', style: null, blocks: [], defaultContent: ['div.image img', '.cmp-image'] },
    { id: 'breadcrumb', name: 'Breadcrumb', selector: 'div.breadcrumb', style: null, blocks: [], defaultContent: ['nav.cmp-breadcrumb', '.cmp-breadcrumb__list'] },
    { id: 'article-header', name: 'Article header', selector: 'main.aem-GridColumn--default--8 > div', style: null, blocks: [], defaultContent: ['h1.cmp-title__text', 'h4.cmp-title__text', '.cmp-title'] },
    { id: 'article-body', name: 'Article body', selector: 'article.contentfragment', style: null, blocks: [], defaultContent: ['article.contentfragment p', 'article.contentfragment h2', 'blockquote', 'article.contentfragment img'] },
    { id: 'author-bio', name: 'Author bio', selector: 'div.experiencefragment', style: null, blocks: [], defaultContent: ['div.experiencefragment h2', 'div.experiencefragment p', 'div.experiencefragment a'] },
  ],
};

// TRANSFORMER REGISTRY - cleanup runs first, section breaks after (5 sections → apply)
const transformers = [
  cleanupTransformer,
  articleTitleTransformer,
  articleHeadingsTransformer,
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
 * Returns [] for default-content templates.
 */
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

    // 2. Discover blocks (none for this template) and parse
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
