// ============================================
// KEYBOARD SHORTCUTS — Global + Test context
// G+key sequences, test navigation shortcuts
// First-use tooltip (one-time, dismissable)
// ============================================

const Shortcuts = {

  _seq: [],           // pending key sequence
  _seqTimer: null,    // sequence reset timer
  _inTest: false,     // test context flag
  _toldUser: false,   // first-use flag shown

  init() {
    this._toldUser = !!localStorage.getItem('mock24_shortcuts_seen');
    document.addEventListener('keydown', (e) => this._onKey(e));
  },

  setTestMode(active) {
    this._inTest = active;
  },

  _onKey(e) {
    // Ignore when typing in inputs
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.contentEditable === 'true') {
      // Only allow Esc in test mode within inputs
      if (this._inTest && e.key === 'Escape') this._handleEsc(e);
      return;
    }

    // Global: open command palette
    if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && !this._inTest) {
      e.preventDefault();
      CommandPalette?.open?.();
      return;
    }

    if (e.key === 'Escape') { this._handleEsc(e); return; }

    // Test context shortcuts
    if (this._inTest) {
      this._handleTestShortcut(e);
      return;
    }

    // G+ sequence shortcuts
    if (e.key === 'g' || e.key === 'G') {
      this._seq = ['g'];
      clearTimeout(this._seqTimer);
      this._seqTimer = setTimeout(() => { this._seq = []; }, 500);
      return;
    }

    if (this._seq.length === 1 && this._seq[0] === 'g') {
      clearTimeout(this._seqTimer);
      this._seq = [];
      this._handleGSeq(e.key.toLowerCase());
    }
  },

  _handleGSeq(key) {
    const routes = {
      h: () => App.navigate('home'),
      d: () => App.navigate('dashboard'),
      b: () => App.navigate('battle'),
      l: () => App.navigate('dashboard'),
      p: () => App.navigate('profile'),
    };
    if (routes[key]) {
      routes[key]();
      if (!this._toldUser) {
        this._toldUser = true;
        localStorage.setItem('mock24_shortcuts_seen', '1');
      }
    }
  },

  _handleEsc(e) {
    // Close any open modal/dropdown
    document.querySelectorAll('.header-user-dropdown.open, .mega-menu.open').forEach(el => {
      el.classList.remove('open');
    });
    CommandPalette?.close?.();
  },

  // ── Test-mode shortcuts ──
  _handleTestShortcut(e) {
    // Prevent default for number keys (avoid scrolling)
    if (['1','2','3','4','ArrowLeft','ArrowRight','f','F'].includes(e.key)) {
      e.preventDefault();
    }

    switch(e.key) {
      case '1': this._dispatchTestAction('select-option', { index: 0 }); break;
      case '2': this._dispatchTestAction('select-option', { index: 1 }); break;
      case '3': this._dispatchTestAction('select-option', { index: 2 }); break;
      case '4': this._dispatchTestAction('select-option', { index: 3 }); break;
      case 'ArrowRight': this._dispatchTestAction('next-question', {}); break;
      case 'ArrowLeft':  this._dispatchTestAction('prev-question', {}); break;
      case 'f':
      case 'F':          this._dispatchTestAction('flag-question', {}); break;
    }
  },

  _dispatchTestAction(type, detail) {
    document.dispatchEvent(new CustomEvent('test-shortcut', { detail: { type, ...detail } }));
  }
};
