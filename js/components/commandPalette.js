// ============================================
// COMMAND PALETTE — Linear-inspired
// Keyboard: / or ⌘K to open
//           ↑↓ navigate, Enter select, Esc close
// Anti-AI: No glass, no blur, no glow
// ============================================

const CommandPalette = {

  _isOpen: false,
  _focusedIndex: 0,
  _items: [],        // flat list of currently rendered items
  _debounceTimer: null,

  // ── Mount the palette HTML once (called from App.init) ──
  mount() {
    if (document.getElementById('cp-backdrop')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'cp-backdrop';
    backdrop.className = 'cp-backdrop';
    backdrop.addEventListener('click', () => this.close());

    const modal = document.createElement('div');
    modal.id = 'cp-modal';
    modal.className = 'cp-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Search');
    modal.innerHTML = `
      <div class="cp-input-row">
        <span class="cp-search-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          id="cp-input"
          class="cp-input"
          type="text"
          placeholder="Search exams, tests, topics..."
          autocomplete="off"
          spellcheck="false"
        />
        <span class="cp-close-hint">Esc</span>
      </div>
      <div id="cp-body" class="cp-body"></div>
      <div class="cp-footer">
        <span class="cp-footer-hint">
          <kbd class="cp-footer-kbd">↑↓</kbd> navigate
        </span>
        <span class="cp-footer-hint">
          <kbd class="cp-footer-kbd">↵</kbd> select
        </span>
        <span class="cp-footer-hint">
          <kbd class="cp-footer-kbd">Esc</kbd> close
        </span>
      </div>
    `;

    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Input listener
    const input = document.getElementById('cp-input');
    input.addEventListener('input', () => {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => this._onInput(input.value), 80);
    });

    // Keyboard navigation
    input.addEventListener('keydown', (e) => this._onKeydown(e));

    // Build search index when palette is first mounted
    if (typeof SearchEngine !== 'undefined') {
      SearchEngine.build();
    }
  },

  open() {
    if (this._isOpen) return;
    this._isOpen = true;
    this._focusedIndex = 0;

    document.getElementById('cp-backdrop')?.classList.add('open');
    document.getElementById('cp-modal')?.classList.add('open');

    const input = document.getElementById('cp-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 50);
    }

    this._renderDefault();
    document.body.style.overflow = 'hidden';
  },

  close() {
    if (!this._isOpen) return;
    this._isOpen = false;

    document.getElementById('cp-backdrop')?.classList.remove('open');
    document.getElementById('cp-modal')?.classList.remove('open');
    document.body.style.overflow = '';
  },

  // ── Input handler ──
  _onInput(value) {
    const trimmed = value.trim();
    if (!trimmed) {
      this._renderDefault();
      return;
    }
    this._renderResults(trimmed);
  },

  // ── Keyboard navigation ──
  _onKeydown(e) {
    if (e.key === 'Escape') { this.close(); return; }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._focusedIndex = Math.min(this._focusedIndex + 1, this._items.length - 1);
      this._updateFocus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._focusedIndex = Math.max(this._focusedIndex - 1, 0);
      this._updateFocus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = this._items[this._focusedIndex];
      if (item) this._execute(item);
    }
  },

  _updateFocus() {
    const items = document.querySelectorAll('.cp-item');
    items.forEach((el, i) => {
      el.classList.toggle('focused', i === this._focusedIndex);
      if (i === this._focusedIndex) el.scrollIntoView({ block: 'nearest' });
    });
  },

  // ── Execute an item's action ──
  _execute(item) {
    if (typeof SearchEngine !== 'undefined' && item.name && item.type !== 'action') {
      SearchEngine.addRecent(item.name);
    }
    this.close();
    if (item.action) {
      try { item.action(); } catch(e) { console.error('[CP] action error', e); }
    }
  },

  // ── Render default state (no query) ──
  _renderDefault() {
    this._items = [];
    const recent = typeof SearchEngine !== 'undefined' ? SearchEngine.getRecent() : [];
    const trending = typeof SearchEngine !== 'undefined' ? SearchEngine.getTrending() : [];
    const actions = typeof SearchEngine !== 'undefined' ? SearchEngine.getActions() : [];

    let html = '';

    if (recent.length) {
      html += this._sectionHTML('Recent', recent.map((r, i) => ({
        id: 'recent-' + i, type: 'recent',
        icon: '🕐', name: r, meta: '',
        action: () => {
          const input = document.getElementById('cp-input');
          if (input) { input.value = r; input.dispatchEvent(new Event('input')); }
        }
      })));
    }

    html += this._sectionHTML('Trending Today', trending.slice(0, 4).map((t, i) => ({
      id: 'trend-' + i, type: 'trend',
      icon: '🔥', name: t, meta: '',
      action: () => {
        const input = document.getElementById('cp-input');
        if (input) { input.value = t; input.dispatchEvent(new Event('input')); }
      }
    })));

    html += this._sectionHTML('Quick Jump', actions.map(a => ({ ...a, id: 'action-' + a.name })));

    this._setBody(html);

    // Re-flatten items for keyboard nav
    this._items = [
      ...recent.map((r, i) => ({ id: 'recent-' + i, type: 'recent', name: r, action: () => {
        const input = document.getElementById('cp-input');
        if (input) { input.value = r; input.dispatchEvent(new Event('input')); }
      }})),
      ...trending.slice(0, 4).map((t, i) => ({ id: 'trend-' + i, type: 'trend', name: t, action: () => {
        const input = document.getElementById('cp-input');
        if (input) { input.value = t; input.dispatchEvent(new Event('input')); }
      }})),
      ...actions,
    ];

    this._bindItemClicks();
  },

  // ── Render search results ──
  _renderResults(term) {
    this._items = [];
    if (typeof SearchEngine === 'undefined') return;

    const results = SearchEngine.query(term);
    if (!results) { this._renderDefault(); return; }

    let html = '';
    let allItems = [];

    if (results.exams.length) {
      html += this._sectionHTML('Exams', results.exams, true);
      allItems = allItems.concat(results.exams);
    }
    if (results.tests.length) {
      html += this._sectionHTML('Tests', results.tests, true);
      allItems = allItems.concat(results.tests);
    }
    if (results.polytechnics?.length) {
      html += this._sectionHTML('Polytechnic', results.polytechnics, true);
      allItems = allItems.concat(results.polytechnics);
    }
    if (results.actions.length) {
      html += this._sectionHTML('Quick Actions', results.actions, false);
      allItems = allItems.concat(results.actions);
    }

    if (!allItems.length) {
      html = `<div class="cp-empty">No results for "<strong>${this._escape(term)}</strong>"</div>`;
    }

    this._setBody(html);
    this._items = allItems;
    this._focusedIndex = 0;
    this._updateFocus();
    this._bindItemClicks();
  },

  // ── Build section HTML ──
  _sectionHTML(title, items, hasCta = false) {
    if (!items.length) return '';
    return `
      <div class="cp-section">
        <div class="cp-section-title">${this._escape(title)}</div>
        <div class="cp-section-items">
          ${items.map((item, i) => this._itemHTML(item, hasCta, i)).join('')}
        </div>
      </div>
    `;
  },

  _itemHTML(item, hasCta, index) {
    const icon = typeof item.icon === 'string' && item.icon.length <= 4
      ? item.icon
      : '📝';
    const nameHtml = item.highlight || this._escape(item.name || '');
    const meta = item.meta ? `<div class="cp-item-meta">${this._escape(item.meta)}</div>` : '';
    const cta = (hasCta && item.cta)
      ? `<span class="cp-item-cta">${this._escape(item.cta)}</span>`
      : (item.kbd ? `<span class="cp-item-kbd">${this._escape(item.kbd)}</span>` : '');

    return `
      <button class="cp-item" data-item-id="${this._escape(item.id || String(index))}">
        <span class="cp-item-icon">${icon}</span>
        <span class="cp-item-body">
          <span class="cp-item-name">${nameHtml}</span>
          ${meta}
        </span>
        ${cta}
      </button>
    `;
  },

  _bindItemClicks() {
    const body = document.getElementById('cp-body');
    if (!body) return;
    body.querySelectorAll('.cp-item').forEach((el, i) => {
      el.onclick = () => this._execute(this._items[i]);
      el.onmouseenter = () => {
        this._focusedIndex = i;
        this._updateFocus();
      };
    });
  },

  _setBody(html) {
    const body = document.getElementById('cp-body');
    if (body) body.innerHTML = html;
  },

  _escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
};
