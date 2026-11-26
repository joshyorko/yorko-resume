import destinations from './jump-index.mjs';

const dialog = document.querySelector('#jump-dialog');
if (typeof dialog.showModal === 'function') installJumpMenu();

function installJumpMenu() {
  const opener = document.querySelector('#jump-open');
  const input = document.querySelector('#jump-input');
  const list = document.querySelector('#jump-results');
  const status = document.querySelector('#jump-status');
  const empty = document.querySelector('#jump-empty');
  const close = document.querySelector('#jump-close');
  const viewport = window.visualViewport;
  const normalize = text => text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const entries = destinations.map(([title, href, group, aliases, suggested]) => ({
    title, href, group, suggested, titleKey: normalize(title), text: normalize(title + ' ' + aliases),
  }));
  let rows = [];
  let selected = 0;
  let returnFocus = opener;

  function highlight(index, reveal = false) {
    if (!rows.length) return;
    rows[selected]?.setAttribute('aria-selected', 'false');
    selected = (index + rows.length) % rows.length;
    const active = rows[selected];
    active.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', active.id);
    if (reveal) active.scrollIntoView({ block: 'nearest' });
  }

  function updateResults() {
    const query = normalize(input.value.trim());
    const words = query.split(/\s+/);
    const rank = entry => entry.titleKey === query ? 3 : entry.titleKey.startsWith(query) ? 2 :
      words.every(word => entry.titleKey.includes(word)) ? 1 : 0;
    const matches = query ? entries.filter(entry => words.every(word => entry.text.includes(word)))
      .sort((a, b) => rank(b) - rank(a)) : entries.filter(entry => entry.suggested && entry.href !== location.pathname);
    const groups = new Map();
    for (const item of matches) {
      if (!groups.has(item.group)) groups.set(item.group, []);
      groups.get(item.group).push(item);
    }
    rows = [];
    selected = 0;
    input.removeAttribute('aria-activedescendant');
    list.replaceChildren();
    list.toggleAttribute('data-suggestions', !query);
    for (const [name, items] of groups) {
      const group = document.createElement('div');
      group.className = 'jump-group';
      group.setAttribute('role', 'group');
      group.setAttribute('aria-label', name);
      const label = document.createElement('p');
      label.textContent = name;
      label.setAttribute('aria-hidden', 'true');
      group.append(label);
      for (const item of items) {
        const row = document.createElement('a');
        row.id = 'jump-option-' + rows.length;
        row.className = 'jump-result';
        row.href = item.href;
        row.textContent = item.title;
        row.tabIndex = -1;
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', 'false');
        row.addEventListener('click', () => dialog.close());
        rows.push(row);
        group.append(row);
      }
      list.append(group);
    }
    list.scrollTop = 0;
    list.hidden = !rows.length;
    empty.hidden = Boolean(rows.length);
    status.textContent = rows.length ? rows.length + (rows.length === 1 ? ' destination' : ' destinations') : 'No matches.';
    highlight(0);
  }

  function position() {
    const anchor = opener.getBoundingClientRect();
    const viewportHeight = viewport?.height ?? innerHeight;
    const top = Math.max(10, Math.min(anchor.bottom + 4, viewportHeight - 220));
    dialog.style.setProperty('--jump-top', top + 'px');
    dialog.style.setProperty('--jump-right', Math.max(12, innerWidth - anchor.right) + 'px');
    dialog.style.setProperty('--jump-room', Math.max(96, viewportHeight - top - 10) + 'px');
  }

  function open() {
    if (dialog.open) return;
    returnFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ?
      document.activeElement : opener;
    input.value = '';
    position();
    updateResults();
    dialog.showModal();
    input.focus({ preventScroll: true });
  }

  opener.addEventListener('click', open);
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => returnFocus.focus({ preventScroll: true }));
  input.addEventListener('input', updateResults);
  input.addEventListener('keydown', event => {
    if (event.isComposing || !rows.length) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      rows[selected].click();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      highlight(selected + (event.key === 'ArrowDown' ? 1 : -1), true);
    }
  });
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.isComposing || event.repeat || event.altKey || event.shiftKey ||
        !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k' ||
        event.target.closest?.('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
    event.preventDefault();
    open();
  });
  window.addEventListener('resize', () => { if (dialog.open) position(); });
  viewport?.addEventListener('resize', () => { if (dialog.open) position(); });
  opener.querySelector('kbd').textContent = /^Mac/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';
  opener.parentElement.hidden = false;
  document.documentElement.classList.add('jump-ready');
}
