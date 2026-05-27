// ============================================
// RENDERER BASE — Shared utilities for all
// board-specific exam renderers.
// NO UI logic here — just helpers.
// ============================================

const RendererBase = {
  _visitedQuestions: new Set(),
  _showingInstructions: true,
  _currentSectionIdx: 0,
  _lockedSections: new Set(),

  // ── Shared Helpers ──

  _getPreset() {
    if (!TestEngine.state?.config?.examId) return null;
    return ExamPresets.get(TestEngine.state.config.examId);
  },

  _getCandidateName() {
    try {
      const raw = localStorage.getItem('mock_user') || localStorage.getItem('username');
      if (!raw) return 'Candidate';
      // Try parsing as JSON (mock_user stores {id, username, name})
      try {
        const obj = JSON.parse(raw);
        return obj.name || obj.username || raw;
      } catch {
        return raw; // plain string
      }
    } catch { return 'Candidate'; }
  },

  _getCandidateRoll() {
    // Generate a consistent roll number for the session
    try {
      const u = localStorage.getItem('mock_user') || localStorage.getItem('username') || 'user';
      let hash = 0;
      for (let i = 0; i < u.length; i++) {
        hash = ((hash << 5) - hash) + u.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash % 9000000 + 1000000).toString();
    } catch { return '2024001'; }
  },

  // ── State Management ──

  resetState() {
    this._showingInstructions = true;
    this._visitedQuestions.clear();
    this._currentSectionIdx = 0;
    this._lockedSections.clear();
    if (typeof ExamProctor !== 'undefined') ExamProctor.stop();
  },

  markVisited(idx) {
    this._visitedQuestions.add(idx);
  },

  isVisited(idx) {
    return this._visitedQuestions.has(idx);
  },

  isShowingInstructions() {
    return this._showingInstructions;
  },

  toggleBeginBtn() {
    const cb = document.getElementById('cbt-agree-check');
    const btn = document.getElementById('cbt-begin-btn');
    if (cb && btn) btn.disabled = !cb.checked;
  },

  beginTest() {
    this._showingInstructions = false;
    this._visitedQuestions.clear();
    this._visitedQuestions.add(0);
    this._currentSectionIdx = 0;
    this._lockedSections.clear();
    if (typeof ExamProctor !== 'undefined') ExamProctor.start();
    if (typeof CBTEngine !== 'undefined') CBTEngine.start();
    const container = document.getElementById('app');
    if (container) {
      const html = TestPage.render();
      container.innerHTML = html;
      if (TestPage.afterRender) {
        requestAnimationFrame(() => TestPage.afterRender());
      }
    }
  },

  // ── Section Navigation ──

  jumpToSection(subject) {
    if (!TestEngine.state) return;
    const preset = this._getPreset();
    const sections = preset?.sections || [];
    const targetIdx = sections.findIndex(s => s.subject === subject);

    if (this._lockedSections.has(subject)) {
      if (typeof Helpers !== 'undefined') {
        Helpers.showToast('🔒 This section is locked. You cannot return.', 'warning');
      }
      return;
    }

    if (preset?.sectionLocking && targetIdx > this._currentSectionIdx) {
      const currentSection = sections[this._currentSectionIdx];
      if (currentSection) this._lockedSections.add(currentSection.subject);
    }

    this._currentSectionIdx = targetIdx >= 0 ? targetIdx : this._currentSectionIdx;
    const idx = TestEngine.state.questions.findIndex(q => q.subject === subject);
    if (idx >= 0) TestPage.goTo(idx);
  },

  // ── Mobile Palette Toggle ──

  toggleMobilePalette() {
    const p = document.getElementById('cbt-palette');
    if (p) p.classList.toggle('open');
  },

  // ── Violation Badge ──

  updateViolationBadge() {
    const badge = document.getElementById('cbt-violation-badge');
    if (!badge || typeof ExamProctor === 'undefined') return;
    const count = ExamProctor.getViolationCount();
    badge.className = `cbt-violation-badge ${count === 0 ? 'clean' : count >= 2 ? 'danger' : 'warn'}`;
    badge.textContent = count === 0 ? '✓ Clean' : `⚠ ${count}/3`;
  },

  // ── Stats Helpers ──

  _getStats() {
    if (!TestEngine.state) return {};
    const answered = Object.keys(TestEngine.state.answers).length;
    const reviewed = TestEngine.state.markedForReview.filter(r => r).length;
    const visited = this._visitedQuestions.size;
    const total = TestEngine.state.questions.length;
    return { answered, reviewed, visited, notVisited: total - visited, total };
  },

  // ── Build Nav Button Classes ──

  _getNavBtnClass(ns, idx) {
    let cls = '';
    if (ns.current) cls += ' current';
    if (ns.review && ns.answered) cls += ' review answered';
    else if (ns.review) cls += ' review';
    else if (ns.answered) cls += ' answered';
    else if (this.isVisited(idx)) cls += ' not-answered';
    return cls;
  },

  // ══════════════════════════════════════
  //  SUBMIT MODAL — Shared Data Layer
  //  Renderers call getSubmitStats() for
  //  data, then render their own themed HTML.
  // ══════════════════════════════════════

  getSubmitStats() {
    if (!TestEngine.state) return null;
    const preset = this._getPreset();
    const sections = preset?.sections || [];
    const questions = TestEngine.state.questions;
    const answers = TestEngine.state.answers;
    const reviewed = TestEngine.state.markedForReview;
    const total = questions.length;

    const answeredCount = Object.keys(answers).length;
    const reviewedCount = reviewed.filter(r => r).length;
    const unansweredCount = total - answeredCount;

    const sectionStats = sections.map(sec => {
      const sectionQs = questions.map((q, i) => ({ q, i })).filter(x => x.q.subject === sec.subject);
      const ans = sectionQs.filter(x => answers[x.q.id] !== undefined && answers[x.q.id] !== null).length;
      const rev = sectionQs.filter(x => reviewed[x.i]).length;
      return { name: sec.name, total: sectionQs.length, answered: ans, unanswered: sectionQs.length - ans, marked: rev };
    });

    const violations = typeof ExamProctor !== 'undefined' ? ExamProctor.getViolationCount() : 0;

    return {
      preset,
      examName: preset?.fullName || preset?.name || 'Exam',
      total,
      answeredCount,
      unansweredCount,
      reviewedCount,
      notVisitedCount: total - this._visitedQuestions.size,
      sectionStats,
      violations
    };
  },

  /** Dismiss submit modal */
  dismissSubmitModal() {
    const modal = document.getElementById('renderer-submit-modal');
    if (modal) modal.remove();
  },

  /** Inject modal into renderer container (stays inside CSS scope) */
  injectModal(containerId, html) {
    // Remove old modal if exists
    this.dismissSubmitModal();
    const container = document.getElementById(containerId);
    if (container) {
      container.insertAdjacentHTML('beforeend', html);
    } else {
      // Fallback: inject into #app (still better than document.body)
      const app = document.getElementById('app');
      if (app) app.insertAdjacentHTML('beforeend', html);
    }
  }
};
window.RendererBase = RendererBase;

