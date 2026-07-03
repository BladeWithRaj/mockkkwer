// ============================================
// SEARCH ENGINE — Client-side, <200ms results
// Indexes: exams, tests, topics, PYQs, polytechnic
// Reference: Linear command palette, GitHub search
// ============================================

const SearchEngine = {

  _index: [],
  _ready: false,

  // ── Static quick-jump actions ──
  _actions: [
    { type: 'action', icon: '⚔️', name: 'AI Battle — Quick Match',   meta: 'Challenge an AI rival',         action: () => App.navigate('battle'),      kbd: '⌘B' },
    { type: 'action', icon: '🔥', name: 'Daily Challenge',           meta: 'Today\'s 15-question challenge', action: () => HomePage._startDaily(),      kbd: '' },
    { type: 'action', icon: '📄', name: 'BTEUP Paper Generator',     meta: 'Generate polytechnic paper',     action: () => App.navigate('polytechnic'), kbd: '' },
    { type: 'action', icon: '📊', name: 'My Dashboard',              meta: 'View your stats & history',      action: () => App.navigate('dashboard'),   kbd: '⌘D' },
    { type: 'action', icon: '📋', name: 'Practice Test Setup',       meta: 'Start a custom test',            action: () => App.navigate('setup'),       kbd: '' },
  ],

  // ── Board categories for quick access ──
  _boards: [
    { id: 'SSC',      name: 'SSC',           icon: '📋', desc: 'CGL · CHSL · MTS · GD' },
    { id: 'Railway',  name: 'Railway',        icon: '🚆', desc: 'NTPC · Group D · ALP' },
    { id: 'Banking',  name: 'Banking',        icon: '🏦', desc: 'IBPS PO · SBI PO · RBI' },
    { id: 'UPSC',     name: 'UPSC',           icon: '⚖️', desc: 'Prelims GS1 · GS2 · CSAT' },
    { id: 'Defence',  name: 'Defence',        icon: '🛡️', desc: 'NDA · CDS · AFCAT' },
    { id: 'Teaching', name: 'Teaching',       icon: '🎓', desc: 'CTET · STET · KVS' },
    { id: 'State',    name: 'State Exams',    icon: '🏛️', desc: 'UP PCS · BPSC · RPSC' },
    { id: 'Police',   name: 'Police',         icon: '👮', desc: 'UP Police · SSC GD' },
  ],

  _trending: [
    'SSC CGL 2024 Mock',
    'Railway NTPC 2024',
    'IBPS PO Full Mock',
    'UPSC Prelims GS1',
    'SSC GD Mock Test',
  ],

  // ── Build the in-memory index ──
  build() {
    this._index = [];

    // From ExamPresets
    if (typeof ExamPresets !== 'undefined' && ExamPresets.getAll) {
      const presets = ExamPresets.getAll();
      for (const p of presets) {
        if (p.category === 'Daily' || p.category === 'Quick') continue;
        this._index.push({
          type: 'test',
          id: p.id,
          name: p.name,
          meta: `${p.totalQuestions || 0} Qs · ${Math.round((p.totalTime || 0) / 60)} min · ${p.category || ''}`,
          category: p.category || '',
          icon: this._getCategoryIcon(p.category),
          action: () => App.navigate('setup', { preset: p.id }),
          cta: 'Start →',
        });
      }
    }

    // Board categories
    for (const b of this._boards) {
      this._index.push({
        type: 'exam',
        id: 'board-' + b.id,
        name: b.name,
        meta: b.desc,
        icon: b.icon,
        action: () => App.navigate('board', { id: b.id }),
        cta: 'View →',
      });
    }

    // Exam detail pages
    const examDetails = [
      { id: 'ssc-cgl',    name: 'SSC CGL',         meta: 'Mock Tests, PYQs, Syllabus', icon: '🎯' },
      { id: 'ssc-chsl',   name: 'SSC CHSL',        meta: 'Mock Tests, PYQs, Syllabus', icon: '📝' },
      { id: 'rrb-ntpc',   name: 'Railway NTPC',    meta: 'Mock Tests, PYQs, Syllabus', icon: '🚆' },
      { id: 'ibps-po',    name: 'IBPS PO',         meta: 'Mock Tests, PYQs, Syllabus', icon: '🏦' },
      { id: 'sbi-po',     name: 'SBI PO',          meta: 'Mock Tests, PYQs, Syllabus', icon: '🏦' },
    ];
    for (const e of examDetails) {
      this._index.push({
        type: 'exam',
        id: 'detail-' + e.id,
        name: e.name,
        meta: e.meta,
        icon: e.icon,
        action: () => App.navigate('exam', { id: e.id }),
        cta: 'Open →',
      });
    }

    // Polytechnic subjects
    const polySubjects = [
      'Data Structures', 'Computer Networks', 'DBMS', 'Operating Systems',
      'Digital Electronics', 'Circuit Theory', 'Fluid Mechanics', 'Thermodynamics',
      'Engineering Drawing', 'Mathematics III', 'Physics', 'Chemistry',
    ];
    for (const s of polySubjects) {
      this._index.push({
        type: 'polytechnic',
        id: 'poly-' + s.toLowerCase().replace(/\s+/g, '-'),
        name: s,
        meta: 'Polytechnic · BTEUP subject',
        icon: '📄',
        action: () => App.navigate('polytechnic', { subject: s }),
        cta: 'Papers →',
      });
    }

    this._ready = true;
  },

  // ── Main query function — returns categorized results ──
  query(term) {
    if (!term || term.trim().length < 2) return null;

    const q = term.toLowerCase().trim();
    const results = { exams: [], tests: [], polytechnic: [], actions: [] };

    for (const item of this._index) {
      const score = this._score(item, q);
      if (score > 0) {
        const bucket = results[item.type + 's'] || results.tests;
        if (bucket.length < 5) {
          bucket.push({ ...item, score, highlight: this._highlight(item.name, term) });
        }
      }
    }

    // Also check actions
    for (const a of this._actions) {
      if (a.name.toLowerCase().includes(q) || a.meta.toLowerCase().includes(q)) {
        results.actions.push({ ...a, highlight: this._highlight(a.name, term) });
      }
    }

    return results;
  },

  // ── Score an item against query ──
  _score(item, q) {
    const name = item.name.toLowerCase();
    const meta = (item.meta || '').toLowerCase();
    if (name.startsWith(q))     return 10;
    if (name.includes(q))       return 6;
    if (meta.includes(q))       return 3;
    const words = q.split(' ');
    const allMatch = words.every(w => name.includes(w) || meta.includes(w));
    if (allMatch)               return 5;
    return 0;
  },

  // ── Highlight matching term in text ──
  _highlight(text, term) {
    if (!term) return text;
    const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(re, '<mark class="cp-match">$1</mark>');
  },

  _getCategoryIcon(cat) {
    const map = { SSC: '📋', Railway: '🚆', Banking: '🏦', UPSC: '⚖️', Defence: '🛡️', Teaching: '🎓', State: '🏛️', Police: '👮' };
    return map[cat] || '📝';
  },

  // ── Recent searches ──
  _recentKey: 'mock24_recent_searches',

  getRecent() {
    try { return JSON.parse(localStorage.getItem(this._recentKey) || '[]'); }
    catch { return []; }
  },

  addRecent(term) {
    if (!term || term.length < 2) return;
    const recent = this.getRecent().filter(r => r !== term).slice(0, 4);
    recent.unshift(term);
    localStorage.setItem(this._recentKey, JSON.stringify(recent.slice(0, 5)));
  },

  getTrending() {
    return this._trending;
  },

  getActions() {
    return this._actions;
  }
};
