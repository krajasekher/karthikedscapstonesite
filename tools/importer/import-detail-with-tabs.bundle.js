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

  // tools/importer/import-detail-with-tabs.js
  var import_detail_with_tabs_exports = {};
  __export(import_detail_with_tabs_exports, {
    default: () => import_detail_with_tabs_default
  });

  // tools/importer/parsers/carousel-detail.js
  function parse(element, { document: document2 }) {
    let slides = Array.from(element.querySelectorAll(".cmp-carousel__item"));
    if (!slides.length) {
      slides = Array.from(element.querySelectorAll('[class*="carousel__item"], .carousel-item'));
    }
    const cells = [];
    slides.forEach((slide) => {
      const img = slide.querySelector(".cmp-image img, img");
      const textContent = [];
      slide.querySelectorAll("h1, h2, h3, h4, h5, h6, p, a[href]").forEach((node) => {
        if (node.closest(".cmp-carousel__actions, .cmp-carousel__indicators")) return;
        textContent.push(node);
      });
      if (img) {
        cells.push([img, textContent.length ? textContent : ""]);
      }
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "carousel-detail", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/table-spec.js
  function parse2(element, { document: document2 }) {
    let pairs = Array.from(element.querySelectorAll(".cmp-contentfragment__element"));
    const cells = [];
    if (pairs.length) {
      pairs.forEach((pair) => {
        const dt = pair.querySelector("dt, .cmp-contentfragment__element-title");
        const dd = pair.querySelector("dd, .cmp-contentfragment__element-value");
        const label = dt ? (dt.textContent || "").trim() : "";
        const value = dd ? (dd.textContent || "").trim() : "";
        if (label || value) cells.push([label, value]);
      });
    } else {
      const dts = Array.from(element.querySelectorAll("dt"));
      dts.forEach((dt) => {
        const dd = dt.nextElementSibling && dt.nextElementSibling.tagName === "DD" ? dt.nextElementSibling : null;
        const label = (dt.textContent || "").trim();
        const value = dd ? (dd.textContent || "").trim() : "";
        if (label || value) cells.push([label, value]);
      });
    }
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-spec", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-detail.js
  function parse3(element, { document: document2 }) {
    const labels = Array.from(element.querySelectorAll(".cmp-tabs__tablist .cmp-tabs__tab, .cmp-tabs__tab"));
    const panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    const leadingHeadingText = (panel) => {
      const h = panel.querySelector("h1, h2, h3, h4, h5, h6");
      return h ? (h.textContent || "").trim() : "";
    };
    const leadingCounts = {};
    panels.forEach((panel) => {
      const t = leadingHeadingText(panel);
      if (t) leadingCounts[t] = (leadingCounts[t] || 0) + 1;
    });
    const repeatedTitles = new Set(
      Object.keys(leadingCounts).filter((t) => leadingCounts[t] > 1)
    );
    const cells = [];
    panels.forEach((panel, i) => {
      const labelEl = labels[i];
      const label = labelEl ? (labelEl.textContent || "").trim() : `Tab ${i + 1}`;
      const contentCell = [];
      panel.querySelectorAll("h2, h3, h4, h5, h6, p, ul, ol, img").forEach((node) => {
        if (node.tagName === "IMG") {
          contentCell.push(node);
          return;
        }
        if (!(node.textContent || "").trim()) return;
        if (/^H[1-6]$/.test(node.tagName) && repeatedTitles.has((node.textContent || "").trim())) return;
        contentCell.push(node);
      });
      cells.push([label, contentCell.length ? contentCell : ""]);
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
        "iframe"
      ]);
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function transform2(hookName, element, payload) {
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

  // tools/importer/import-detail-with-tabs.js
  var parsers = {
    "carousel-detail": parse,
    "table-spec": parse2,
    "tabs-detail": parse3
  };
  var PAGE_TEMPLATE = {
    name: "detail-with-tabs",
    description: "Detail page layout with breadcrumbs, an image carousel, and tabbed body content.",
    urls: [
      "https://wknd.site/us/en/adventures/bali-surf-camp.html"
    ],
    blocks: [
      {
        name: "carousel-detail",
        instances: [
          "div.carousel.panelcontainer.cmp-carousel--mini",
          ".carousel.cmp-carousel--mini"
        ]
      },
      {
        name: "table-spec",
        instances: [
          "div.cmp-contentfragment",
          ".cmp-contentfragment__elements"
        ]
      },
      {
        name: "tabs-detail",
        instances: [
          "div.tabs.panelcontainer",
          ".tabs.panelcontainer"
        ]
      }
    ],
    sections: [
      {
        id: "breadcrumb",
        name: "Breadcrumb",
        selector: "div.breadcrumb.cmp-breadcrumb--fixed",
        style: null,
        blocks: [],
        defaultContent: ["nav.cmp-breadcrumb", ".cmp-breadcrumb__list"]
      },
      {
        id: "image-carousel",
        name: "Image carousel",
        selector: "div.carousel.panelcontainer.cmp-carousel--mini",
        style: null,
        blocks: ["carousel-detail"],
        defaultContent: []
      },
      {
        id: "adventure-detail",
        name: "Adventure detail (title, metadata, share)",
        selector: "div.title.cmp-title--underline",
        style: null,
        blocks: ["table-spec"],
        defaultContent: ["h1.cmp-title__text", ".cmp-title--underline"]
      },
      {
        id: "tabbed-body",
        name: "Tabbed body content",
        selector: "div.tabs.panelcontainer",
        style: null,
        blocks: ["tabs-detail"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
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
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_detail_with_tabs_default = {
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
  return __toCommonJS(import_detail_with_tabs_exports);
})();
