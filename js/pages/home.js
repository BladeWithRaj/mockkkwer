// ============================================
// HOME PAGE V4 — SaaS-Level Exam Platform
// Board-first, trust-focused, conversion-optimized
// ============================================

const HomePage = {
  _expandedCategory: null,

  // ── Board design tokens (fallback for styling) ──
  _boardDesignTokens: {
    'SSC': { color: '#2563EB', label: 'SSC' },
    'Railway': { color: '#059669', label: 'Railway' },
    'Banking': { color: '#7C3AED', label: 'Banking' },
    'UPSC': { color: '#9333EA', label: 'UPSC' },
    'Teaching': { color: '#0891B2', label: 'Teaching' },
    'Defence': { color: '#DC2626', label: 'Defence' },
    'State': { color: '#D97706', label: 'State Exams' },
    'Quick': { color: '#F59E0B', label: 'Quick Modes' },
    'Daily': { color: '#EF4444', label: 'Daily' }
  },

  // Default color palette for unknown boards
  _fallbackColors: ['#6366F1', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4', '#84CC16'],

  /**
   * Generate board cards dynamically from ExamPresets (DB data).
   * New boards added via admin auto-appear here.
   */
  _getBoards() {
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];

    // ── SAFE FALLBACK: if no presets loaded, show default boards ──
    if (!allPresets.length) {
      return this._getDefaultBoards();
    }

    const boardMap = {};

    // Group exams by category (which maps to board)
    for (const preset of allPresets) {
      const cat = preset.category || 'Other';
      // Skip utility modes from board grid
      if (cat === 'Quick' || cat === 'Daily') continue;

      if (!boardMap[cat]) {
        boardMap[cat] = { id: cat, exams: [], icons: new Set() };
      }
      boardMap[cat].exams.push(preset);
      if (preset.icon && preset.icon !== '📝') boardMap[cat].icons.add(preset.icon);
    }

    // Convert to array with design tokens
    let colorIdx = 0;
    const boards = Object.values(boardMap).map(board => {
      const tokens = this._boardDesignTokens[board.id] || {};
      const examNames = board.exams
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .slice(0, 5)
        .map(e => e.name.replace(board.id + ' ', '').replace('RRB ', '').replace('RPF ', ''))
        .join(' · ');
      const firstIcon = board.exams[0]?.icon || '📝';

      return {
        id: board.id,
        icon: [...board.icons][0] || firstIcon,
        color: tokens.color || this._fallbackColors[colorIdx++ % this._fallbackColors.length],
        label: tokens.label || board.id,
        exams: examNames,
        count: board.exams.length
      };
    });

    // If only Quick/Daily categories exist, still show defaults
    return boards.length > 0 ? boards : this._getDefaultBoards();
  },

  /**
   * Hardcoded default boards — guaranteed homepage never goes empty.
   */
  _getDefaultBoards() {
    return [
      { id: 'SSC', icon: '🎯', color: '#2563EB', label: 'SSC', exams: 'CGL · CHSL · MTS · GD · Stenographer', count: 5 },
      { id: 'Railway', icon: '🚆', color: '#059669', label: 'Railway', exams: 'NTPC · Group D · ALP · JE', count: 4 },
      { id: 'Banking', icon: '🏦', color: '#7C3AED', label: 'Banking', exams: 'IBPS PO · SBI Clerk · RBI Assistant', count: 3 },
      { id: 'UPSC', icon: '🏛️', color: '#9333EA', label: 'UPSC', exams: 'Prelims · CSAT · NDA', count: 3 },
      { id: 'Teaching', icon: '📚', color: '#0891B2', label: 'Teaching', exams: 'CTET · SUPER TET · KVS', count: 3 },
      { id: 'Defence', icon: '🎖️', color: '#DC2626', label: 'Defence', exams: 'CDS · NDA · AFCAT', count: 3 }
    ];
  },

  /**
   * Generate popular exams dynamically from ExamPresets.
   * Shows first 6 exams sorted by sort_order (most important first).
   */
  _getPopularExams() {
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];
    return allPresets
      .filter(p => p.category !== 'Quick' && p.category !== 'Daily')
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        name: p.name,
        meta: `${p.totalQuestions}Q · ${Math.round(p.totalTime / 60)} min · ${p.negativeMarking ? '-' + p.negativeValue + ' marking' : 'No negative'}`
      }));
  },

  render() {
    const streak = DailySystem.getStreak();
    const dailyDone = DailySystem.isDailyDone();
    const goal = DailySystem.getDailyGoal();
    const streakAlive = DailySystem.isStreakAlive();
    const hasResumeTest = !!Storage.getCurrentTest();

    // Count total questions and exams
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : Object.values(ExamPresets._presets || {});
    const totalExams = allPresets.length;
    const totalQuestions = allPresets.reduce((sum, p) => sum + (p.totalQuestions || 0), 0);

    return `
      <div class="page-enter">

        <!-- ═══ HERO ═══ -->
        <section class="hp-hero">
          <div class="hp-hero-badge">
            <span class="live-dot"></span>
            Free · No Login Required · Instant Start
          </div>

          <h1>
            Practice for <span class="hp-accent">Government Exams</span> with Real CBT Interface
          </h1>

          <p class="hp-hero-sub">
            Mock tests that look and feel exactly like SSC, Railway, Banking & UPSC exam centers. Built for serious aspirants.
          </p>

          <div class="hp-hero-ctas">
            <button class="hp-btn-primary" onclick="document.getElementById('board-section').scrollIntoView({behavior:'smooth'})" id="hero-explore-btn">
              Explore Exams →
            </button>
          </div>

          ${hasResumeTest ? `
          <div class="hp-resume-bar">
            <button class="hp-resume-btn" onclick="App.navigate('test')">
              <span class="pulse-dot"></span>
              Continue Your Test →
            </button>
          </div>
          ` : ''}
        </section>

        <!-- ═══ STATS STRIP ═══ -->
        <div class="hp-stats-strip">
          <div class="hp-stat-item">
            <div class="hp-stat-num">${totalQuestions}+</div>
            <div class="hp-stat-label">Questions</div>
          </div>
          <div class="hp-stat-sep"></div>
          <div class="hp-stat-item">
            <div class="hp-stat-num">${totalExams}+</div>
            <div class="hp-stat-label">Exam Patterns</div>
          </div>
          <div class="hp-stat-sep"></div>
          <div class="hp-stat-item">
            <div class="hp-stat-num">4</div>
            <div class="hp-stat-label">Boards</div>
          </div>
        </div>

        <!-- ═══ BOARD GRID ═══ -->
        <section class="hp-section" id="board-section">
          <h2 class="hp-section-title">Choose Your Board</h2>
          <p class="hp-section-sub">Select your exam category to start practicing</p>

          <div class="hp-board-grid">
            ${this._getBoards().map((board, i) => `
                <div class="hp-board-card"
                     style="--board-color: ${board.color}; animation: hp-fadeUp 0.5s ${0.05 * i}s ease both;"
                     onclick="App.navigate('board', {id: '${board.id}'})"
                     id="board-card-${board.id}">
                  <div class="hp-board-icon">${board.icon}</div>
                  <div class="hp-board-name">${board.label}</div>
                  <div class="hp-board-exams">${board.exams}</div>
                  <div class="hp-board-bottom">
                    <span class="hp-board-count">${board.count} Exams</span>
                    <span class="hp-board-arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>
            `).join('')}
          </div>
        </section>

        <!-- ═══ QUICK ACTIONS ═══ -->
        <section class="hp-section">
          <h2 class="hp-section-title">Quick Practice</h2>
          <p class="hp-section-sub">Jump into a focused session — no setup needed</p>

          <div class="hp-quick-actions">
            <div class="hp-action-card" ${dailyDone ? '' : 'onclick="HomePage.startDailyChallenge()"'} id="action-daily">
              <div class="hp-action-icon" style="background: rgba(245, 158, 11, 0.12);">🔥</div>
              <div class="hp-action-info">
                <div class="hp-action-title">Daily Challenge</div>
                <div class="hp-action-meta">15 Questions · 10 Minutes</div>
              </div>
              ${dailyDone
                ? '<div class="hp-action-badge done">Done</div>'
                : '<div class="hp-action-badge">Start →</div>'
              }
            </div>

            <div class="hp-action-card" onclick="HomePage.startQuickMode('quick-10')" id="action-quick10">
              <div class="hp-action-icon" style="background: rgba(59, 130, 246, 0.12);">⚡</div>
              <div class="hp-action-info">
                <div class="hp-action-title">Quick 10</div>
                <div class="hp-action-meta">10 Mixed Questions · 5 Minutes</div>
              </div>
              <div class="hp-action-badge">Start →</div>
            </div>

            <div class="hp-action-card" onclick="App.navigate('setup')" id="action-custom">
              <div class="hp-action-icon" style="background: rgba(139, 92, 246, 0.12);">🎯</div>
              <div class="hp-action-info">
                <div class="hp-action-title">Custom Test</div>
                <div class="hp-action-meta">Pick subjects, time & difficulty</div>
              </div>
              <div class="hp-action-badge">Create →</div>
            </div>

            <div class="hp-action-card" onclick="App.navigate('battle')" id="action-battle">
              <div class="hp-action-icon" style="background: rgba(239, 68, 68, 0.12);">⚔️</div>
              <div class="hp-action-info">
                <div class="hp-action-title">Rival Battle</div>
                <div class="hp-action-meta">5 Rounds · AI Opponent · Ranked</div>
              </div>
              <div class="hp-action-badge">Play →</div>
            </div>
          </div>
        </section>

        <!-- ═══ STREAK BAR (only if active) ═══ -->
        ${streak.current > 0 ? `
        <section class="hp-section">
          <div class="hp-streak-bar">
            <div class="hp-streak-fire">${streakAlive ? '🔥' : '❄️'}</div>
            <div class="hp-streak-info">
              <span class="hp-streak-count">${streak.current} day streak</span>
              <span class="hp-streak-detail">${goal.testsToday}/${goal.target} tests today</span>
            </div>
            ${streak.best > 1 ? `<div class="hp-streak-best">Best: ${streak.best} days</div>` : ''}
          </div>
        </section>
        ` : ''}

        <!-- ═══ FOOTER ═══ -->
        <footer class="hp-footer">
          <div class="hp-footer-inner">
            <div class="hp-footer-brand">
              <div class="hp-footer-logo">Mock<span>24hr</span></div>
              <div class="hp-footer-tagline">Free mock tests for competitive exams</div>
            </div>
            <div class="hp-footer-links-grid">
              <div class="hp-footer-col">
                <div class="hp-footer-col-title">Platform</div>
                <a href="#home">Home</a>
                <a href="#setup">New Test</a>
                <a href="#dashboard">Dashboard</a>
              </div>
              <div class="hp-footer-col">
                <div class="hp-footer-col-title">Exams</div>
                <a href="#board?id=SSC">SSC</a>
                <a href="#board?id=Railway">Railway</a>
                <a href="#board?id=Banking">Banking</a>
              </div>
              <div class="hp-footer-col">
                <div class="hp-footer-col-title">More</div>
                <a href="#battle">Rival Battle</a>
                <a href="#profile">Profile</a>
                <a href="#leaderboard">Leaderboard</a>
              </div>
            </div>
          </div>
          <div class="hp-footer-bottom">
            © ${new Date().getFullYear()} Mock24hr — All Rights Reserved
          </div>
        </footer>

      </div>
    `;
  },

  // ── Helpers ──

  _getAccuracy() {
    try {
      const history = JSON.parse(localStorage.getItem('test_history') || '[]');
      if (history.length === 0) return '—';
      const total = history.reduce((s, h) => s + (h.correct || 0) + (h.wrong || 0), 0);
      const correct = history.reduce((s, h) => s + (h.correct || 0), 0);
      return total > 0 ? Math.round((correct / total) * 100) : '—';
    } catch { return '—'; }
  },

  _getTestsCompleted() {
    try {
      const history = JSON.parse(localStorage.getItem('test_history') || '[]');
      return history.length;
    } catch { return 0; }
  },

  /** Start a test with exam preset config */
  async startPresetExam(presetId) {
    const config = ExamPresets.buildConfig(presetId);
    if (!config) {
      Helpers.showToast('Exam preset not found', 'error');
      return;
    }

    App.navigate('setup', {
      preset: presetId,
      exam: config.examName,
      subjects: config.subjects.join(','),
      questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0
    });
  },

  /** Start daily challenge */
  async startDailyChallenge() {
    if (DailySystem.isDailyDone()) {
      Helpers.showToast('Daily challenge already completed today! 🎉', 'info');
      return;
    }

    const config = DailySystem.getDailyConfig();
    if (!config) {
      Helpers.showToast('Could not load daily challenge config', 'error');
      return;
    }

    App.navigate('setup', {
      preset: 'daily-challenge',
      exam: 'Daily Challenge',
      subjects: config.subjects.join(','),
      questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0,
      daily: '1'
    });
  },

  /** Start quick mode */
  async startQuickMode(modeId) {
    const config = ExamPresets.buildConfig(modeId);
    if (!config) {
      Helpers.showToast('Mode not found', 'error');
      return;
    }

    App.navigate('setup', {
      preset: modeId,
      exam: config.examName,
      subjects: config.subjects.join(','),
      questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0
    });
  },

  afterRender() {
    // Track page view
    if (window.trackEvent) window.trackEvent("page_view", { page: "home_v4" });
  }
};
