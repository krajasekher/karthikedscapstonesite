// eslint-disable-next-line import/no-unresolved
import {
  toClassName, buildBlock, decorateBlock, loadBlock,
} from '../../scripts/aem.js';

/**
 * Convert a nested block table (kept as raw <table> by DA when it sits inside
 * another block's cell) into an EDS block div, then decorate + load it.
 * DA auto-converts only TOP-LEVEL section tables to blocks; a table nested in a
 * tab panel is not converted, so we do it here. `<th colspan>` holds the block
 * name; each <tbody> <tr>/<td> becomes a block row/cell.
 */
async function decorateNestedTable(table) {
  const nameCell = table.querySelector('thead th, thead td');
  const blockName = nameCell ? toClassName(nameCell.textContent.trim().split('(')[0].trim()) : '';
  if (!blockName) return;
  const rows = [...table.querySelectorAll('tbody > tr')].map(
    (tr) => [...tr.children].map((td) => ({ elems: [...td.childNodes] })),
  );
  const blockEl = buildBlock(blockName, rows);
  table.replaceWith(blockEl);
  decorateBlock(blockEl);
  await loadBlock(blockEl);
}

export default async function decorate(block) {
  // build tablist
  const tablist = document.createElement('div');
  tablist.className = 'tabs-detail-list';
  tablist.setAttribute('role', 'tablist');

  // decorate tabs and tabpanels
  const tabs = [...block.children].map((child) => child.firstElementChild);
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.textContent);

    // decorate tabpanel
    const tabpanel = block.children[i];
    tabpanel.className = 'tabs-detail-panel';
    tabpanel.id = `tabpanel-${id}`;
    tabpanel.setAttribute('aria-hidden', !!i);
    tabpanel.setAttribute('aria-labelledby', `tab-${id}`);
    tabpanel.setAttribute('role', 'tabpanel');

    // build tab button
    const button = document.createElement('button');
    button.className = 'tabs-detail-tab';
    button.id = `tab-${id}`;
    button.innerHTML = tab.innerHTML;

    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      block.querySelectorAll('[role=tabpanel]').forEach((panel) => {
        panel.setAttribute('aria-hidden', true);
      });
      tablist.querySelectorAll('button').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      tabpanel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
    tab.remove();
  });

  block.prepend(tablist);

  // Decorate any nested blocks inside the tab panels (e.g. a cards grid per
  // category on the Adventures listing). EDS does not auto-decorate blocks
  // nested inside another block: DA leaves such grids as raw <table>, and any
  // already-div block is left un-decorated. Handle both. No-op on pages whose
  // panels hold only rich default content (the 16 adventure detail pages).
  const nestedTables = block.querySelectorAll('.tabs-detail-panel table');
  // eslint-disable-next-line no-restricted-syntax
  for (const table of nestedTables) {
    // eslint-disable-next-line no-await-in-loop
    await decorateNestedTable(table);
  }
  const nestedBlocks = block.querySelectorAll('.tabs-detail-panel > div[class]:not(.tabs-detail-panel)');
  await Promise.all([...nestedBlocks].map(async (nested) => {
    decorateBlock(nested);
    await loadBlock(nested);
  }));
}
