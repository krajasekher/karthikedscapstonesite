/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-category-listing.js
  var import_category_listing_exports = {};
  __export(import_category_listing_exports, {
    default: () => import_category_listing_default
  });

  // tools/importer/parsers/columns.js
  function parse(element, { document: document2 }) {
    const teaser = element.querySelector(".cmp-teaser") || element;
    const content = teaser.querySelector(".cmp-teaser__content") || teaser;
    const img = teaser.querySelector(".cmp-teaser__image img, .cmp-image img, img");
    const textContent = [];
    const pretitle = content.querySelector(".cmp-teaser__pretitle");
    if (pretitle) textContent.push(pretitle);
    const title = content.querySelector(".cmp-teaser__title, h1, h2, h3, h4, h5, h6");
    if (title) textContent.push(title);
    const description = content.querySelector(".cmp-teaser__description");
    if (description) textContent.push(description);
    const ctaLinks = Array.from(content.querySelectorAll(
      ".cmp-teaser__action-link, .cmp-teaser__action-container a[href]"
    ));
    const seenCta = /* @__PURE__ */ new Set();
    ctaLinks.forEach((a) => {
      if (!seenCta.has(a) && !textContent.includes(a)) {
        seenCta.add(a);
        textContent.push(a);
      }
    });
    if (!ctaLinks.length) {
      content.querySelectorAll(".cmp-teaser__action-container").forEach((container) => {
        if (container.querySelector("a[href]")) return;
        if (container.textContent && container.textContent.trim()) {
          textContent.push(container);
        }
      });
    }
    if (!title && !description && !img) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    cells.push([textContent.length ? textContent : "", img || ""]);
    const isHero = element.matches(".cmp-teaser--hero, .cmp-teaser--imagebottom") || element.querySelector(".cmp-teaser--hero, .cmp-teaser--imagebottom") !== null || teaser.classList && (teaser.classList.contains("cmp-teaser--hero") || teaser.classList.contains("cmp-teaser--imagebottom"));
    const name = isHero ? "columns (hero)" : "columns";
    const block = WebImporter.Blocks.createBlock(document2, { name, cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-cards.js
  function buildCardsBlock(gridEl, document2) {
    let items = Array.from(gridEl.querySelectorAll(".cmp-image-list__item"));
    if (!items.length) {
      items = Array.from(gridEl.querySelectorAll('li[class*="image-list__item"], .cards-card'));
    }
    const cells = [];
    items.forEach((item) => {
      const img = item.querySelector(".cmp-image-list__item-image img, .cmp-image img, img");
      const textContent = [];
      const titleLink = item.querySelector("a.cmp-image-list__item-title-link");
      const titleText = item.querySelector(".cmp-image-list__item-title");
      if (titleLink && titleText) {
        textContent.push(titleLink);
      } else if (titleText) {
        textContent.push(titleText);
      } else if (titleLink) {
        textContent.push(titleLink);
      }
      const description = item.querySelector(".cmp-image-list__item-description, p");
      if (description) textContent.push(description);
      if (img) {
        cells.push([img, textContent.length ? textContent : ""]);
      }
    });
    if (!cells.length) return null;
    return WebImporter.Blocks.createBlock(document2, { name: "cards", cells });
  }
  function parse2(element, { document: document2 }) {
    const labels = Array.from(element.querySelectorAll(".cmp-tabs__tablist .cmp-tabs__tab, .cmp-tabs__tab"));
    const panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    const cells = [];
    panels.forEach((panel, i) => {
      const labelEl = labels[i];
      const label = labelEl ? (labelEl.textContent || "").trim() : `Tab ${i + 1}`;
      const grid = panel.querySelector('.image-list, .cmp-image-list, [class*="image-list"]') || panel;
      const cardsBlock = buildCardsBlock(grid, document2);
      cells.push([label, cardsBlock || ""]);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-detail", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#toggleNav",
        "#mobileNav"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.cmp-experiencefragment--header",
        "footer.cmp-experiencefragment--footer",
        "aside.cmp-layoutcontainer--sidebar",
        "iframe"
      ]);
    }
  }

  // tools/importer/transformers/wknd-internal-links.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    element.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (/^\/(?!.*\/assets\/).*\.html$/.test(href)) {
        a.setAttribute("href", href.replace(/\.html$/, ""));
      }
    });
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function transform3(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = element.querySelector(section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || element.querySelector(section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-category-listing.js
  var parsers = {
    columns: parse,
    "tabs-cards": parse2
  };
  var PAGE_TEMPLATE = {
    name: "category-listing",
    description: "Adventures category landing: h1 + hero intro teaser + a tabbed category listing (6 tabs) with a nested cards grid of adventures per tab.",
    urls: [
      "https://wknd.site/us/en/adventures.html"
    ],
    blocks: [
      { name: "columns", instances: ["div.teaser.cmp-teaser--hero", "div.teaser.cmp-teaser--featured"] },
      { name: "tabs-cards", instances: ["div.tabs.panelcontainer"] }
    ],
    sections: [
      { id: "page-title", name: "Page title", selector: "main .title", style: null, blocks: [], defaultContent: ["h1.cmp-title__text", ".cmp-title"] },
      { id: "hero-intro", name: "Hero intro", selector: "div.teaser.cmp-teaser--hero", style: null, blocks: ["columns"], defaultContent: [] },
      { id: "current-adventures", name: "Current Adventures", selector: "div.tabs.panelcontainer", style: null, blocks: ["tabs-cards"], defaultContent: ["h2.cmp-title__text"] }
    ]
  };
  var transformers = [
    transform,
    transform2,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform3] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    (template.blocks || []).forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        document2.querySelectorAll(selector).forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({ name: blockDef.name, selector, element });
        });
      });
    });
    return pageBlocks;
  }
  var import_category_listing_default = {
    transform: (payload) => {
      const { document: document2, url, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_category_listing_exports);
})();
