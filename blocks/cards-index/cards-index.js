import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * cards-index — dynamic, query-index-driven variant of the `cards` block.
 *
 * Reads a small config from the authored block (source path prefix, optional
 * limit + sort), fetches /query-index.json, filters/sorts client-side, and
 * renders cards whose DOM + classes are IDENTICAL to the static `cards` block.
 * The block element is given the `cards` class so blocks/cards/cards.css applies
 * verbatim (see cards-index.css, which @imports it) — output is pixel-identical
 * to the hand-authored cards, but new published pages appear automatically.
 *
 * Authored config (each row: key | value), all optional except source:
 *   | cards-index |                       |
 *   | source      | /us/en/magazine/      |
 *   | limit       | 3                     |  (blank = all)
 *   | sort        | lastModified          |  (default: lastModified desc)
 */

const QUERY_INDEX = '/query-index.json';

/** Parse the authored key/value rows into a config object, then empty the block. */
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

/** Strip query params so createOptimizedPicture builds a clean srcset (matches static cards). */
function cleanImageUrl(src) {
  if (!src) return src;
  try {
    const url = new URL(src, window.location.href);
    return `${url.origin}${url.pathname}`;
  } catch {
    return src.split('?')[0];
  }
}

/** Build one <li> matching the static cards DOM exactly. */
function buildCard(row) {
  const li = document.createElement('li');

  const imageDiv = document.createElement('div');
  imageDiv.className = 'cards-card-image';
  if (row.image) {
    const picture = createOptimizedPicture(cleanImageUrl(row.image), row.title || '', false, [{ width: '750' }]);
    imageDiv.append(picture);
  }

  const bodyDiv = document.createElement('div');
  bodyDiv.className = 'cards-card-body';
  const link = document.createElement('a');
  link.href = row.path;
  link.textContent = row.title || row.path;
  bodyDiv.append(link);
  if (row.description) bodyDiv.append(document.createTextNode(row.description));

  // Only append the image cell when there is an image, mirroring authored cards
  // that always have one; a missing image degrades to text-only rather than a gap.
  if (row.image) li.append(imageDiv);
  li.append(bodyDiv);
  return li;
}

export default async function decorate(block) {
  const config = readConfig(block);
  const source = (config.source || '').trim();
  const limit = config.limit ? parseInt(config.limit, 10) : 0;
  const sortKey = (config.sort || 'lastModified').trim();

  // Reuse the exact cards styling: cards.css is scoped to `.cards`.
  block.classList.add('cards');
  block.textContent = '';

  if (!source) {
    // eslint-disable-next-line no-console
    console.warn('cards-index: no "source" configured; nothing to render.');
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
    // network/parse failure → leave the block empty rather than break layout
    rows = [];
  }

  const listingPath = source.replace(/\/$/, '');
  let items = rows.filter((r) => r.path
    && r.path.startsWith(source)
    && r.path !== listingPath);

  // Sort by the chosen key, numeric-desc for lastModified, else title A–Z.
  if (sortKey === 'lastModified') {
    items.sort((a, b) => (Number(b.lastModified) || 0) - (Number(a.lastModified) || 0));
  } else {
    items.sort((a, b) => (a[sortKey] || '').localeCompare(b[sortKey] || ''));
  }

  if (limit > 0) items = items.slice(0, limit);

  const ul = document.createElement('ul');
  items.forEach((row) => ul.append(buildCard(row)));
  block.append(ul);
}
