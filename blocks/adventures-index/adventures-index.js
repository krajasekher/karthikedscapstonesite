import { createOptimizedPicture, toClassName } from '../../scripts/aem.js';

/**
 * adventures-index — dynamic, query-index-driven tabbed adventure listing.
 *
 * Fetches /query-index.json, filters to adventures under a configured path
 * prefix, and renders a tabbed grid: an "All" tab plus one tab per distinct
 * `category` value found in the index. Each panel holds a cards grid built from
 * the matching adventures. New adventures with a `category` appear under the
 * right tab(s) automatically; a new category value grows a new tab on its own.
 *
 * Fidelity: the tab UI reuses the `tabs-detail` classes + styling and the card
 * grid reuses the `cards` classes + styling (adventures-index.css @imports both),
 * so the rendered output matches the original hand-authored tabs + cards.
 *
 * Authored config (key | value), all optional except source:
 *   | adventures-index |                    |
 *   | source           | /us/en/adventures/ |
 *   | categories       | Climbing, ... |  (optional: fixes tab order; omit = derive + sort)
 *   | all-label        | All                |  (optional, default "All")
 *   | sort             | lastModified       |  (default: lastModified desc)
 */

const QUERY_INDEX = '/query-index.json';
const ALL = '__all__';

function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key) config[key] = value;
    }
  });
  return config;
}

function cleanImageUrl(src) {
  if (!src) return src;
  try {
    const url = new URL(src, window.location.href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return src.split('?')[0];
  }
}

/** categories on a row: comma-separated "category" field → trimmed array */
function rowCategories(row) {
  return (row.category || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

/** Build one card <li> identical to the static `cards` block DOM. */
function buildCard(row) {
  const li = document.createElement('li');
  if (row.image) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'cards-card-image';
    imageDiv.append(createOptimizedPicture(cleanImageUrl(row.image), row.title || '', false, [{ width: '750' }]));
    li.append(imageDiv);
  }
  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'cards-card-body';
  const link = document.createElement('a');
  link.href = row.path;
  link.textContent = row.title || row.path;
  bodyDiv.append(link);
  if (row.description) bodyDiv.append(document.createTextNode(row.description));
  li.append(bodyDiv);
  return li;
}

/** Build a cards grid (ul.cards > li) for a set of rows. */
function buildGrid(rows) {
  const cards = document.createElement('div');
  cards.className = 'cards';
  const ul = document.createElement('ul');
  rows.forEach((row) => ul.append(buildCard(row)));
  cards.append(ul);
  return cards;
}

export default async function decorate(block) {
  const config = readConfig(block);
  const source = (config.source || '').trim();
  const allLabel = (config['all-label'] || 'All').trim();
  const sortKey = (config.sort || 'lastModified').trim();
  const fixedCategories = (config.categories || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  block.textContent = '';

  if (!source) {
    // eslint-disable-next-line no-console
    console.warn('adventures-index: no "source" configured; nothing to render.');
    return;
  }

  let rows = [];
  try {
    const resp = await fetch(QUERY_INDEX);
    if (resp.ok) {
      const json = await resp.json();
      rows = Array.isArray(json.data) ? json.data : [];
    }
  } catch {
    rows = [];
  }

  const listingPath = source.replace(/\/$/, '');
  const items = rows.filter((r) => r.path
    && r.path.startsWith(source)
    && r.path !== listingPath);

  if (sortKey === 'lastModified') {
    items.sort((a, b) => (Number(b.lastModified) || 0) - (Number(a.lastModified) || 0));
  } else {
    items.sort((a, b) => (a[sortKey] || '').localeCompare(b[sortKey] || ''));
  }

  // Determine the tab set: configured order if given, else distinct categories sorted A–Z.
  let categories = fixedCategories;
  if (!categories.length) {
    const set = new Set();
    items.forEach((r) => rowCategories(r).forEach((c) => set.add(c)));
    categories = [...set].sort((a, b) => a.localeCompare(b));
  }

  // Tabs = "All" + one per category. Each entry: { key, label, rows }.
  const tabs = [
    { key: ALL, label: allLabel, rows: items },
    ...categories.map((cat) => ({
      key: cat,
      label: cat,
      rows: items.filter((r) => rowCategories(r).includes(cat)),
    })),
  ];

  // Build tablist + panels, reusing tabs-detail markup/classes.
  block.classList.add('tabs-detail');
  const tablist = document.createElement('div');
  tablist.className = 'tabs-detail-list';
  tablist.setAttribute('role', 'tablist');

  const panels = [];
  tabs.forEach((tab, i) => {
    const id = toClassName(tab.key === ALL ? 'all' : tab.key);

    const panel = document.createElement('div');
    panel.className = 'tabs-detail-panel';
    panel.id = `tabpanel-${id}`;
    panel.setAttribute('aria-hidden', !!i);
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.setAttribute('role', 'tabpanel');
    panel.append(buildGrid(tab.rows));
    panels.push(panel);

    const button = document.createElement('button');
    button.className = 'tabs-detail-tab';
    button.id = `tab-${id}`;
    button.textContent = tab.label;
    button.setAttribute('aria-controls', `tabpanel-${id}`);
    button.setAttribute('aria-selected', !i);
    button.setAttribute('role', 'tab');
    button.setAttribute('type', 'button');
    button.addEventListener('click', () => {
      panels.forEach((p) => p.setAttribute('aria-hidden', true));
      tablist.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', false));
      panel.setAttribute('aria-hidden', false);
      button.setAttribute('aria-selected', true);
    });
    tablist.append(button);
  });

  block.append(tablist);
  panels.forEach((p) => block.append(p));
}
