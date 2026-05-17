// ============================================
// HOME PAGE V4 — SaaS-Level Exam Platform
// Board-first, trust-focused, conversion-optimized
// ============================================

const HomePage = {
  _expandedCategory: null,

  // Board registry with design tokens
  _boards: [
    { id: 'SSC',      icon: '📋', color: '#2563EB', label: 'SSC',           exams: 'CGL · CHSL · MTS · GD · CPO',  url: '#board?id=SSC' },
    { id: 'Railway',  icon: '🚂', color: '#059669', label: 'Railway',       exams: 'NTPC · Group D · ALP · JE',     url: '#board?id=Railway' },
    { id: 'Banking',  icon: '🏦', color: '#7C3AED', label: 'Banking',       exams: 'IBPS PO · Clerk · SBI · RBI',   url: '#board?id=Banking' },
    { id: 'UPSC',     icon: '⚖️', color: '#9333EA', label: 'UPSC',          exams: 'Prelims · CAPF · EPFO',         url: '#board?id=UPSC' },
    { id: 'Teaching', icon: '📚', color: '#0891B2', label: 'Teaching',      exams: 'CTET · DSSSB · SUPER TET',      url: '#board?id=Teaching' },
    { id: 'Defence',  icon: '🛡️', color: '#DC2626', label: 'Defence',       exams: 'CDS · AFCAT · NDA',             url: '#board?id=Defence' },
    { id: 'State',    icon: '🏛️', color: '#D97706', label: 'State Exams',   exams: 'UP PCS · BPSC · MPPSC · RAS',   url: '#board?id=State' }
  ],

  // Popular exams for trending section
  _popularExams: [
    { id: 'ssc-cgl',     name: 'SSC CGL',    meta: '100Q · 60 min · Latest Pattern' },
    { id: 'rrb-ntpc',    name: 'RRB NTPC',   meta: '100Q · 90 min · CBT-1 Pattern'  },
    { id: 'ibps-po',     name: 'IBPS PO',    meta: '100Q · 60 min · Prelims'        },
    { id: 'ssc-chsl',    name: 'SSC CHSL',   meta: '100Q · 60 min · Tier-1'         },
    { id: 'rrb-group-d', name: 'RRB Group D', meta: '100Q · 90 min · CBT'           },
    { id: 'sbi-clerk',   name: 'SBI Clerk',  meta: '100Q · 60 min · Prelims'        }
  ],

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

        <!-- ═══ BOARD GRID ═══ -->
        <section class="hp-section" id="board-section">
          <h2 class="hp-section-title">🎯 Choose Your Board</h2>
          <p class="hp-section-sub">Select your exam category to start practicing</p>

          <div class="hp-board-grid">
            ${this._boards.map((board, i) => {
              const presets = ExamPresets.getByCategory(board.id);
              const count = presets ? presets.length : 0;
              return `
                <div class="hp-board-card"
                     style="--board-color: ${board.color}; animation: hp-fadeUp 0.5s ${0.05 * i}s ease both;"
                     onclick="App.navigate('board', {id: '${board.id}'})"
                     id="board-card-${board.id}">
                  <div class="hp-board-icon">${board.icon}</div>
                  <div class="hp-board-name">${board.label}</div>
                  <div class="hp-board-exams">${board.exams}</div>
                  <div class="hp-board-bottom">
                    <span class="hp-board-count">${count} Exams</span>
                    <span class="hp-board-arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
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

        <!-- ═══ POPULAR EXAMS ═══ -->
        <section class="hp-section">
          <h2 class="hp-section-title">🔥 Popular Exams</h2>
          <p class="hp-section-sub">Most attempted mock tests this week</p>

          <div class="hp-popular-list">
            ${this._popularExams.slice(0, 6).map((exam, i) => `
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

        <!-- ═══ QUICK MODES ═══ -->
        <section class="hp-section">
          <h2 class="hp-section-title">⚡ Quick Practice</h2>
          <p class="hp-section-sub">Short bursts for focused improvement</p>

          <div class="hp-quick-row">
            <div class="hp-quick-card" onclick="App.navigate('battle')">
              <div class="hp-quick-icon" style="background: rgba(239, 68, 68, 0.1);">⚔️</div>
              <div>
                <div class="hp-quick-title">Rival Battle</div>
                <div class="hp-quick-sub">Challenge AI rivals · Instant feedback</div>
              </div>
            </div>
            <div class="hp-quick-card" onclick="HomePage.startQuickMode('quick-10')">
              <div class="hp-quick-icon" style="background: rgba(59, 130, 246, 0.1);">⚡</div>
              <div>
                <div class="hp-quick-title">Quick 10</div>
                <div class="hp-quick-sub">10 Questions · 5 min · Mixed</div>
              </div>
            </div>
            <div class="hp-quick-card" onclick="App.navigate('setup')">
              <div class="hp-quick-icon" style="background: rgba(139, 92, 246, 0.1);">🎲</div>
              <div>
                <div class="hp-quick-title">Custom Test</div>
                <div class="hp-quick-sub">Your rules · Your pace</div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ WHY MOCKTESTPRO ═══ -->
        <section class="hp-section">
          <h2 class="hp-section-title">✨ Why MockTestPro?</h2>
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
          <div class="hp-footer-text">© ${new Date().getFullYear()} MockTestPro — Free Mock Tests for Competitive Exams</div>
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
