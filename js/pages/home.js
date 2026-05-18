// ============================================
// HOME PAGE V4 — SaaS-Level Exam Platform
// Board-first, trust-focused, conversion-optimized
// ============================================

const HomePage = {
  _expandedCategory: null,

  // ── Board design tokens (fallback for styling) ──
  _boardDesignTokens: {
    'SSC':      { color: '#2563EB', label: 'SSC' },
    'Railway':  { color: '#059669', label: 'Railway' },
    'Banking':  { color: '#7C3AED', label: 'Banking' },
    'UPSC':     { color: '#9333EA', label: 'UPSC' },
    'Teaching': { color: '#0891B2', label: 'Teaching' },
    'Defence':  { color: '#DC2626', label: 'Defence' },
    'State':    { color: '#D97706', label: 'State Exams' },
    'Quick':    { color: '#F59E0B', label: 'Quick Modes' },
    'Daily':    { color: '#EF4444', label: 'Daily' }
  },

  // Default color palette for unknown boards
  _fallbackColors: ['#6366F1', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4', '#84CC16'],

  /**
   * Generate board cards dynamically from ExamPresets (DB data).
   * New boards added via admin auto-appear here.
   */
  _getBoards() {
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];
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
    return Object.values(boardMap).map(board => {
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
            Prepare for <span class="hp-accent">SSC, Railway, Banking & UPSC</span> Exams
          </h1>

          <p class="hp-hero-sub">
            Real CBT mock tests with latest exam patterns, detailed analytics, and PYQ-based questions. Built for serious aspirants.
          </p>

          <div class="hp-hero-ctas">
            <button class="hp-btn-primary" onclick="document.getElementById('board-section').scrollIntoView({behavior:'smooth'})" id="hero-explore-btn">
              🎯 Explore Exams
            </button>
            <button class="hp-btn-secondary" onclick="App.navigate('setup')" id="hero-custom-btn">
              ⚡ Quick Custom Test
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
            <div class="hp-stat-num">${(totalQuestions / 100).toFixed(0)}00+</div>
            <div class="hp-stat-label">Questions</div>
          </div>
          <div class="hp-stat-sep"></div>
          <div class="hp-stat-item">
            <div class="hp-stat-num">${totalExams * 4}+</div>
            <div class="hp-stat-label">Mock Tests</div>
          </div>
          <div class="hp-stat-sep"></div>
          <div class="hp-stat-item">
            <div class="hp-stat-num">${totalExams}+</div>
            <div class="hp-stat-label">Exams</div>
          </div>
        </div>

        <!-- ═══ POLYTECHNIC FLAGSHIP CARD ═══ -->
        <section class="hp-section" style="margin-top: 8px;">
          <div class="poly-flagship" onclick="window.location.href='/polytechnic-important-paper/'" id="polytechnic-feature-card">
            <div class="poly-flagship-glow"></div>
            <div class="poly-flagship-inner">
              <div class="poly-flagship-left">
                <div class="poly-flagship-badge">NEW</div>
                <h2 class="poly-flagship-title">Polytechnic Exam Paper Generator</h2>
                <p class="poly-flagship-sub">Generate realistic BTEUP / UPBTE important papers instantly.</p>
                <div class="poly-flagship-features">
                  <span>✓ BTEUP Pattern</span>
                  <span>✓ Printable Format</span>
                  <span>✓ Important Questions</span>
                  <span>✓ Semester-wise</span>
                  <span>✓ One Click Generate</span>
                </div>
                <button class="poly-flagship-cta" onclick="event.stopPropagation(); window.location.href='/polytechnic-important-paper/'">
                  <span>⚡ Generate Paper</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
              <div class="poly-flagship-right">
                <div class="poly-flagship-visual">
                  <div class="poly-paper-mock">
                    <div class="poly-paper-header">BOARD OF TECHNICAL EDUCATION</div>
                    <div class="poly-paper-subtitle">POLYTECHNIC EXAMINATION</div>
                    <div class="poly-paper-line"></div>
                    <div class="poly-paper-q">Q1) Attempt any ten parts... (10×1=10)</div>
                    <div class="poly-paper-q dim">Q2) Attempt any five parts... (5×2=10)</div>
                    <div class="poly-paper-q dim">Q3) Attempt any two parts... (2×5=10)</div>
                    <div class="poly-paper-dots">· · ·</div>
                  </div>
                  <div class="poly-sparkle poly-sparkle-1">✦</div>
                  <div class="poly-sparkle poly-sparkle-2">✦</div>
                  <div class="poly-sparkle poly-sparkle-3">⚡</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ BOARD GRID (DB-driven) ═══ -->
        <section class="hp-section" id="board-section">
          <h2 class="hp-section-title">🎯 Choose Your Board</h2>
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

        <!-- ═══ DAILY CHALLENGE + STREAK ═══ -->
        <section class="hp-section">
          <div class="hp-daily-row">

            <!-- Daily Challenge -->
            <div class="hp-daily-card" ${dailyDone ? '' : 'onclick="HomePage.startDailyChallenge()"'}>
              <div class="hp-daily-header">
                <div class="hp-daily-icon" style="background: rgba(245, 158, 11, 0.12);">🔥</div>
                <div>
                  <div class="hp-daily-title">Daily Challenge</div>
                  <div class="hp-daily-sub">15 Questions · 10 Minutes</div>
                </div>
              </div>
              ${dailyDone ? `
                <div class="hp-daily-done">✅ Completed Today!</div>
              ` : `
                <div class="hp-daily-meta">Test yourself daily to maintain your streak and improve consistency.</div>
                <button class="hp-daily-go" onclick="event.stopPropagation(); HomePage.startDailyChallenge()">
                  Start Challenge →
                </button>
              `}
            </div>

            <!-- Streak -->
            <div class="hp-daily-card">
              <div class="hp-daily-header">
                <div class="hp-daily-icon" style="background: rgba(16, 185, 129, 0.12);">
                  ${streakAlive ? '🔥' : '❄️'}
                </div>
                <div>
                  <div class="hp-daily-title">${streakAlive ? 'Streak Active' : 'Streak Broken'}</div>
                  <div class="hp-daily-sub">${streakAlive ? 'Keep going!' : 'Start again today'}</div>
                </div>
              </div>
              <div class="hp-streak-big">${streak.current} <span style="font-size:18px;color:var(--text-muted);">day${streak.current !== 1 ? 's' : ''}</span></div>
              <div class="hp-streak-label">${goal.testsToday}/${goal.target} tests today · ${goal.questionsToday} questions solved</div>
              ${streak.best > 1 ? `<div class="hp-streak-best">🏆 Best streak: ${streak.best} days</div>` : ''}
            </div>
          </div>
        </section>

        <!-- ═══ PROGRESS SNAPSHOT ═══ -->
        <section class="hp-section">
          <h2 class="hp-section-title">📊 Your Progress</h2>
          <p class="hp-section-sub">Keep improving every day</p>

          <div class="hp-progress-row">
            <div class="hp-progress-card">
              <div class="hp-progress-value" style="color: #3B82F6;">${this._getAccuracy()}%</div>
              <div class="hp-progress-label">Accuracy</div>
            </div>
            <div class="hp-progress-card">
              <div class="hp-progress-value">${this._getTestsCompleted()}</div>
              <div class="hp-progress-label">Tests Done</div>
            </div>
            <div class="hp-progress-card">
              <div class="hp-progress-value" style="color: #F59E0B;">${streak.current}</div>
              <div class="hp-progress-label">Day Streak</div>
            </div>
          </div>
        </section>

        <!-- ═══ POPULAR EXAMS (DB-driven) ═══ -->
        <section class="hp-section">
          <h2 class="hp-section-title">🔥 Popular Exams</h2>
          <p class="hp-section-sub">Most attempted mock tests this week</p>

          <div class="hp-popular-list">
            ${this._getPopularExams().map((exam, i) => `
              <div class="hp-popular-card" onclick="HomePage.startPresetExam('${exam.id}')" id="popular-${exam.id}">
                <div class="hp-popular-rank">${i + 1}</div>
                <div class="hp-popular-info">
                  <div class="hp-popular-name">${exam.name}</div>
                  <div class="hp-popular-meta">${exam.meta}</div>
                </div>
                <button class="hp-popular-start" onclick="event.stopPropagation(); HomePage.startPresetExam('${exam.id}')">
                  Start →
                </button>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ═══ QUICK MODES — PREMIUM ═══ -->
        <section class="hp-section">
          <div class="qm-header">
            <div>
              <h2 class="hp-section-title">⚡ Quick Practice</h2>
              <p class="hp-section-sub">Jump into a focused session — no setup needed</p>
            </div>
          </div>

          <div class="qm-grid">
            <!-- ━━━ RIVAL BATTLE — Hero Card ━━━ -->
            <div class="qm-card qm-hero" onclick="App.navigate('battle')" id="mode-rival-battle">
              <div class="qm-card-bg"></div>
              <div class="qm-pill">🔴 LIVE BATTLE</div>
              <div class="qm-hero-content">
                <div class="qm-icon-box qm-icon-battle">
                  <span>⚔️</span>
                </div>
                <div class="qm-info">
                  <h3>Rival Battle</h3>
                  <p>Go head-to-head against AI-powered rivals. Answer faster, score higher, dominate the leaderboard.</p>
                </div>
              </div>
              <div class="qm-footer">
                <div class="qm-tags">
                  <span class="qm-tag">🎯 5 Rounds</span>
                  <span class="qm-tag">⚡ Real-time</span>
                  <span class="qm-tag">🏆 Ranked</span>
                </div>
                <button class="qm-btn qm-btn-battle" onclick="event.stopPropagation(); App.navigate('battle')">
                  Enter Battle
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </button>
              </div>
            </div>

            <!-- ━━━ RIGHT COLUMN — Stacked ━━━ -->
            <div class="qm-stack">
              <!-- Quick 10 -->
              <div class="qm-card qm-compact" onclick="HomePage.startQuickMode('quick-10')" id="mode-quick-10">
                <div class="qm-card-bg"></div>
                <div class="qm-compact-row">
                  <div class="qm-icon-box qm-icon-quick">
                    <span>⚡</span>
                  </div>
                  <div class="qm-compact-info">
                    <div class="qm-compact-top">
                      <h3>Quick 10</h3>
                      <span class="qm-pill-sm">5 MIN</span>
                    </div>
                    <p>10 mixed questions for a rapid warm-up session</p>
                    <div class="qm-tags">
                      <span class="qm-tag">📝 10 Questions</span>
                      <span class="qm-tag">🎲 Mixed</span>
                    </div>
                  </div>
                  <button class="qm-arrow-btn qm-arrow-quick" onclick="event.stopPropagation(); HomePage.startQuickMode('quick-10')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>

              <!-- Custom Test -->
              <div class="qm-card qm-compact" onclick="App.navigate('setup')" id="mode-custom-test">
                <div class="qm-card-bg"></div>
                <div class="qm-compact-row">
                  <div class="qm-icon-box qm-icon-custom">
                    <span>🎯</span>
                  </div>
                  <div class="qm-compact-info">
                    <div class="qm-compact-top">
                      <h3>Custom Test</h3>
                      <span class="qm-pill-sm">FLEX</span>
                    </div>
                    <p>Pick subjects, time & questions — fully customizable</p>
                    <div class="qm-tags">
                      <span class="qm-tag">📚 Any Subject</span>
                      <span class="qm-tag">⏱️ Your Pace</span>
                    </div>
                  </div>
                  <button class="qm-arrow-btn qm-arrow-custom" onclick="event.stopPropagation(); App.navigate('setup')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ WHY MOCKTESTPRO ═══ -->
        <section class="hp-section">
          <h2 class="hp-section-title">✨ Why Mock24hr?</h2>
          <p class="hp-section-sub">Built specifically for Indian competitive exam aspirants</p>

          <div class="hp-trust-grid">
            <div class="hp-trust-card">
              <div class="hp-trust-icon" style="background: rgba(59, 130, 246, 0.1);">🖥️</div>
              <div class="hp-trust-title">Real CBT Interface</div>
              <div class="hp-trust-desc">Exact replica of TCS iON, RRB, IBPS exam screens. Practice like the real exam.</div>
            </div>
            <div class="hp-trust-card">
              <div class="hp-trust-icon" style="background: rgba(139, 92, 246, 0.1);">📝</div>
              <div class="hp-trust-title">PYQ Based</div>
              <div class="hp-trust-desc">Previous year questions with latest exam patterns and updated syllabus.</div>
            </div>
            <div class="hp-trust-card">
              <div class="hp-trust-icon" style="background: rgba(16, 185, 129, 0.1);">📊</div>
              <div class="hp-trust-title">Deep Analytics</div>
              <div class="hp-trust-desc">Section-wise analysis, accuracy trends, time management insights, and more.</div>
            </div>
            <div class="hp-trust-card">
              <div class="hp-trust-icon" style="background: rgba(245, 158, 11, 0.1);">📱</div>
              <div class="hp-trust-title">Mobile Optimized</div>
              <div class="hp-trust-desc">Works perfectly on mobile. Install as app. No download needed.</div>
            </div>
          </div>
        </section>

        <!-- ═══ FOOTER ═══ -->
        <footer class="hp-footer">
          <div class="hp-footer-text">© ${new Date().getFullYear()} Mock24hr — Free Mock Tests for Competitive Exams</div>
          <div class="hp-footer-links">
            <a href="#home">Home</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#leaderboard">Leaderboard</a>
          </div>
        </footer>

        <!-- Mobile Sticky CTA -->
        <div class="hp-mobile-cta">
          <button class="hp-btn-primary" onclick="document.getElementById('board-section').scrollIntoView({behavior:'smooth'})">
            🎯 Explore Exams
          </button>
          <button class="hp-btn-secondary" onclick="App.navigate('setup')">
            ⚡ Quick Test
          </button>
        </div>

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
