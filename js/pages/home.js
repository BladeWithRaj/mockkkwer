// ============================================
// HOME PAGE V5 — Premium SaaS-Level Exam Platform
// Stunning visuals, all features, Polytechnic restored
// ============================================

const HomePage = {
  _expandedCategory: null,

  // ── Board design tokens (fallback for styling) ──
  _boardDesignTokens: {
    'SSC': { color: '#2563EB', gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)', label: 'SSC', desc: 'Staff Selection Commission' },
    'Railway': { color: '#059669', gradient: 'linear-gradient(135deg, #059669, #10B981)', label: 'Railway', desc: 'Railway Recruitment Board' },
    'Banking': { color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', label: 'Banking', desc: 'IBPS & Bank Exams' },
    'UPSC': { color: '#9333EA', gradient: 'linear-gradient(135deg, #9333EA, #A855F7)', label: 'UPSC', desc: 'Union Public Service Commission' },
    'Teaching': { color: '#0891B2', gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)', label: 'Teaching', desc: 'CTET & Teaching Exams' },
    'Defence': { color: '#DC2626', gradient: 'linear-gradient(135deg, #DC2626, #EF4444)', label: 'Defence', desc: 'CDS, NDA & Defence Exams' },
    'State': { color: '#D97706', gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', label: 'State Exams', desc: 'State Level Examinations' },
    'Quick': { color: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)', label: 'Quick Modes' },
    'Daily': { color: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444, #F87171)', label: 'Daily' }
  },

  _fallbackColors: ['#6366F1', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4', '#84CC16'],

  _getBoards() {
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];
    if (!allPresets.length) return this._getDefaultBoards();

    const boardMap = {};
    for (const preset of allPresets) {
      const cat = preset.category || 'Other';
      if (cat === 'Quick' || cat === 'Daily') continue;
      if (!boardMap[cat]) boardMap[cat] = { id: cat, exams: [], icons: new Set() };
      boardMap[cat].exams.push(preset);
      if (preset.icon && preset.icon !== '📝') boardMap[cat].icons.add(preset.icon);
    }

    let colorIdx = 0;
    const boards = Object.values(boardMap).map(board => {
      const tokens = this._boardDesignTokens[board.id] || {};
      const examNames = board.exams
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .slice(0, 5)
        .map(e => e.name.replace(board.id + ' ', '').replace('RRB ', '').replace('RPF ', ''))
        .join(' · ');
      return {
        id: board.id,
        icon: [...board.icons][0] || board.exams[0]?.icon || '📝',
        color: tokens.color || this._fallbackColors[colorIdx++ % this._fallbackColors.length],
        gradient: tokens.gradient || `linear-gradient(135deg, ${tokens.color || '#6366F1'}, ${tokens.color || '#8B5CF6'})`,
        label: tokens.label || board.id,
        desc: tokens.desc || '',
        exams: examNames,
        count: board.exams.length
      };
    });
    return boards.length > 0 ? boards : this._getDefaultBoards();
  },

  _getDefaultBoards() {
    return [
      { id: 'SSC', icon: '🎯', color: '#2563EB', gradient: 'linear-gradient(135deg, #2563EB, #3B82F6)', label: 'SSC', desc: 'Staff Selection Commission', exams: 'CGL · CHSL · MTS · GD · Stenographer', count: 5 },
      { id: 'Railway', icon: '🚆', color: '#059669', gradient: 'linear-gradient(135deg, #059669, #10B981)', label: 'Railway', desc: 'Railway Recruitment Board', exams: 'NTPC · Group D · ALP · JE', count: 4 },
      { id: 'Banking', icon: '🏦', color: '#7C3AED', gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', label: 'Banking', desc: 'IBPS & Bank Exams', exams: 'IBPS PO · SBI Clerk · RBI Assistant', count: 3 },
      { id: 'UPSC', icon: '🏛️', color: '#9333EA', gradient: 'linear-gradient(135deg, #9333EA, #A855F7)', label: 'UPSC', desc: 'Union Public Service Commission', exams: 'Prelims · CSAT · NDA', count: 3 },
      { id: 'Teaching', icon: '📚', color: '#0891B2', gradient: 'linear-gradient(135deg, #0891B2, #06B6D4)', label: 'Teaching', desc: 'CTET & Teaching Exams', exams: 'CTET · SUPER TET · KVS', count: 3 },
      { id: 'Defence', icon: '🎖️', color: '#DC2626', gradient: 'linear-gradient(135deg, #DC2626, #EF4444)', label: 'Defence', desc: 'CDS, NDA & Defence Exams', exams: 'CDS · NDA · AFCAT', count: 3 }
    ];
  },

  _getPopularExams() {
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];
    return allPresets
      .filter(p => p.category !== 'Quick' && p.category !== 'Daily')
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        name: p.name,
        icon: p.icon || '📝',
        meta: `${p.totalQuestions}Q · ${Math.round(p.totalTime / 60)} min · ${p.negativeMarking ? '-' + p.negativeValue : 'No neg'}`
      }));
  },

  render() {
    const streak = DailySystem.getStreak();
    const dailyDone = DailySystem.isDailyDone();
    const goal = DailySystem.getDailyGoal();
    const streakAlive = DailySystem.isStreakAlive();
    const hasResumeTest = !!Storage.getCurrentTest();

    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : Object.values(ExamPresets._presets || {});
    const totalExams = allPresets.length;
    const totalQuestions = allPresets.reduce((sum, p) => sum + (p.totalQuestions || 0), 0);

    return `
      <div class="page-enter hp-v5">

        <!-- ═══════════ HERO ═══════════ -->
        <section class="hp5-hero">
          <div class="hp5-hero-bg">
            <div class="hp5-hero-orb hp5-orb-1"></div>
            <div class="hp5-hero-orb hp5-orb-2"></div>
            <div class="hp5-hero-orb hp5-orb-3"></div>
            <div class="hp5-hero-grid"></div>
          </div>

          <div class="hp5-hero-content">
            <div class="hp5-badge">
              <span class="hp5-badge-dot"></span>
              <span>Free · No Login · Instant Start</span>
            </div>

            <h1 class="hp5-title">
              Real <span class="hp5-gradient-text">CBT Simulation</span> for Government Exams
            </h1>

            <p class="hp5-subtitle">
              Practice SSC, Railway, Banking & UPSC mock tests with exam-center interfaces. Feel the pressure before the real day.
            </p>

            <div class="hp5-hero-actions">
              <button class="hp5-btn-glow" onclick="document.getElementById('board-section').scrollIntoView({behavior:'smooth'})" id="hero-explore-btn">
                <span>Explore Exams</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
              <button class="hp5-btn-glass" onclick="App.navigate('setup')" id="hero-custom-btn">
                <span>⚡ Quick Test</span>
              </button>
            </div>

            ${hasResumeTest ? `
            <div class="hp5-resume">
              <button class="hp5-resume-btn" onclick="App.navigate('test')">
                <span class="hp5-resume-pulse"></span>
                Continue Your Test →
              </button>
            </div>
            ` : ''}

            <!-- Stats -->
            <div class="hp5-hero-stats">
              <div class="hp5-hstat">
                <span class="hp5-hstat-num">${totalQuestions || 500}+</span>
                <span class="hp5-hstat-label">Questions</span>
              </div>
              <div class="hp5-hstat-sep"></div>
              <div class="hp5-hstat">
                <span class="hp5-hstat-num">${totalExams || 12}+</span>
                <span class="hp5-hstat-label">Exams</span>
              </div>
              <div class="hp5-hstat-sep"></div>
              <div class="hp5-hstat">
                <span class="hp5-hstat-num">6</span>
                <span class="hp5-hstat-label">Boards</span>
              </div>
              <div class="hp5-hstat-sep"></div>
              <div class="hp5-hstat">
                <span class="hp5-hstat-num">100%</span>
                <span class="hp5-hstat-label">Free</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════ POLYTECHNIC FLAGSHIP ═══════════ -->
        <section class="hp5-container">
          <div class="hp5-poly" onclick="window.location.href='/polytechnic-important-paper/'" id="polytechnic-feature-card">
            <div class="hp5-poly-glow"></div>
            <div class="hp5-poly-inner">
              <div class="hp5-poly-left">
                <div class="hp5-poly-badge">🆕 NEW FEATURE</div>
                <h2 class="hp5-poly-title">Polytechnic Exam Paper Generator</h2>
                <p class="hp5-poly-desc">Generate realistic BTEUP / UPBTE important papers instantly. AI-powered, exam-pattern matched.</p>
                <div class="hp5-poly-chips">
                  <span>✓ BTEUP Pattern</span>
                  <span>✓ Printable</span>
                  <span>✓ Important Questions</span>
                  <span>✓ Semester-wise</span>
                </div>
                <button class="hp5-poly-cta" onclick="event.stopPropagation(); window.location.href='/polytechnic-important-paper/'">
                  Generate Paper →
                </button>
              </div>
              <div class="hp5-poly-right">
                <div class="hp5-poly-visual">
                  <div class="hp5-poly-paper">
                    <div class="hp5-pp-header">BOARD OF TECHNICAL EDUCATION</div>
                    <div class="hp5-pp-sub">POLYTECHNIC EXAMINATION</div>
                    <div class="hp5-pp-line"></div>
                    <div class="hp5-pp-q">Q1. Attempt any ten parts ···(10×1=10)</div>
                    <div class="hp5-pp-q dim">Q2. Attempt any five parts ···(5×2=10)</div>
                    <div class="hp5-pp-q dim">Q3. Attempt any two parts ···(2×5=10)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════ BOARD GRID ═══════════ -->
        <section class="hp5-container" id="board-section">
          <div class="hp5-section-head">
            <h2>Choose Your Board</h2>
            <p>Select your exam category to start practicing</p>
          </div>

          <div class="hp5-board-grid">
            ${this._getBoards().map((board, i) => `
              <div class="hp5-board-card"
                   style="--bc: ${board.color}; --bg: ${board.gradient}; animation-delay: ${0.06 * i}s;"
                   onclick="App.navigate('board', {id: '${board.id}'})"
                   id="board-card-${board.id}">
                <div class="hp5-board-top">
                  <div class="hp5-board-icon">${board.icon}</div>
                  <div class="hp5-board-arrow">→</div>
                </div>
                <div class="hp5-board-name">${board.label}</div>
                <div class="hp5-board-desc">${board.desc || board.exams}</div>
                <div class="hp5-board-tags">${board.exams}</div>
                <div class="hp5-board-footer">
                  <span class="hp5-board-count">${board.count} Exams Available</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ═══════════ QUICK PRACTICE ═══════════ -->
        <section class="hp5-container">
          <div class="hp5-section-head">
            <h2>Quick Practice</h2>
            <p>Jump into a focused session — no setup needed</p>
          </div>

          <div class="hp5-modes-grid">
            <!-- Daily Challenge -->
            <div class="hp5-mode-card hp5-mode-daily" ${dailyDone ? '' : 'onclick="HomePage.startDailyChallenge()"'} id="action-daily">
              <div class="hp5-mode-icon">🔥</div>
              <div class="hp5-mode-body">
                <div class="hp5-mode-title">Daily Challenge</div>
                <div class="hp5-mode-meta">15 Questions · 10 Minutes</div>
              </div>
              <div class="hp5-mode-action ${dailyDone ? 'done' : ''}">${dailyDone ? '✅ Done' : 'Start →'}</div>
            </div>

            <!-- Quick 10 -->
            <div class="hp5-mode-card hp5-mode-quick" onclick="HomePage.startQuickMode('quick-10')" id="action-quick10">
              <div class="hp5-mode-icon">⚡</div>
              <div class="hp5-mode-body">
                <div class="hp5-mode-title">Quick 10</div>
                <div class="hp5-mode-meta">10 Mixed Questions · 5 Minutes</div>
              </div>
              <div class="hp5-mode-action">Start →</div>
            </div>

            <!-- Custom Test -->
            <div class="hp5-mode-card hp5-mode-custom" onclick="App.navigate('setup')" id="action-custom">
              <div class="hp5-mode-icon">🎯</div>
              <div class="hp5-mode-body">
                <div class="hp5-mode-title">Custom Test</div>
                <div class="hp5-mode-meta">Pick subjects, time & difficulty</div>
              </div>
              <div class="hp5-mode-action">Create →</div>
            </div>

            <!-- Rival Battle -->
            <div class="hp5-mode-card hp5-mode-battle" onclick="App.navigate('battle')" id="action-battle">
              <div class="hp5-mode-icon">⚔️</div>
              <div class="hp5-mode-body">
                <div class="hp5-mode-title">Rival Battle</div>
                <div class="hp5-mode-meta">5 Rounds · AI Opponent · Ranked</div>
              </div>
              <div class="hp5-mode-action">Play →</div>
            </div>
          </div>
        </section>

        <!-- ═══════════ POPULAR EXAMS ═══════════ -->
        <section class="hp5-container">
          <div class="hp5-section-head">
            <h2>Popular Exams</h2>
            <p>Most attempted mock tests this week</p>
          </div>

          <div class="hp5-popular-grid">
            ${this._getPopularExams().map((exam, i) => `
              <div class="hp5-popular-card" onclick="HomePage.startPresetExam('${exam.id}')" id="popular-${exam.id}">
                <div class="hp5-pop-rank">${i + 1}</div>
                <div class="hp5-pop-icon">${exam.icon}</div>
                <div class="hp5-pop-info">
                  <div class="hp5-pop-name">${exam.name}</div>
                  <div class="hp5-pop-meta">${exam.meta}</div>
                </div>
                <button class="hp5-pop-btn" onclick="event.stopPropagation(); HomePage.startPresetExam('${exam.id}')">Start</button>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ═══════════ WHY US ═══════════ -->
        <section class="hp5-container">
          <div class="hp5-section-head">
            <h2>Why Mock24hr?</h2>
            <p>Built specifically for Indian government exam aspirants</p>
          </div>

          <div class="hp5-features-grid">
            <div class="hp5-feature-card">
              <div class="hp5-feat-icon" style="--fc: #3B82F6;">🖥️</div>
              <h3>Real CBT Interface</h3>
              <p>Exact replica of TCS iON, RRB, IBPS exam screens</p>
            </div>
            <div class="hp5-feature-card">
              <div class="hp5-feat-icon" style="--fc: #8B5CF6;">📝</div>
              <h3>PYQ Based Questions</h3>
              <p>Previous year patterns with updated syllabus coverage</p>
            </div>
            <div class="hp5-feature-card">
              <div class="hp5-feat-icon" style="--fc: #10B981;">📊</div>
              <h3>Deep Analytics</h3>
              <p>Section-wise analysis, accuracy trends & time insights</p>
            </div>
            <div class="hp5-feature-card">
              <div class="hp5-feat-icon" style="--fc: #F59E0B;">📱</div>
              <h3>Works Everywhere</h3>
              <p>Mobile optimized. Install as app. Zero downloads.</p>
            </div>
          </div>
        </section>

        <!-- ═══════════ STREAK + PROGRESS ═══════════ -->
        <section class="hp5-container">
          <div class="hp5-twin-row">
            <!-- Streak -->
            <div class="hp5-info-card hp5-streak-card">
              <div class="hp5-info-icon">${streakAlive ? '🔥' : '❄️'}</div>
              <div class="hp5-info-body">
                <div class="hp5-info-big">${streak.current}</div>
                <div class="hp5-info-label">Day Streak</div>
                <div class="hp5-info-detail">${goal.testsToday}/${goal.target} tests today${streak.best > 1 ? ` · Best: ${streak.best}` : ''}</div>
              </div>
            </div>

            <!-- Progress -->
            <div class="hp5-info-card hp5-progress-card">
              <div class="hp5-info-icon">📊</div>
              <div class="hp5-info-body">
                <div class="hp5-info-big">${this._getAccuracy()}%</div>
                <div class="hp5-info-label">Overall Accuracy</div>
                <div class="hp5-info-detail">${this._getTestsCompleted()} tests completed</div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════ FOOTER ═══════════ -->
        <footer class="hp5-footer">
          <div class="hp5-footer-inner">
            <div class="hp5-footer-brand">
              <div class="hp5-footer-logo">Mock<span>24hr</span></div>
              <p>Free mock tests for Indian competitive exams. Real CBT simulation for serious aspirants.</p>
            </div>
            <div class="hp5-footer-links">
              <div class="hp5-footer-col">
                <h4>Platform</h4>
                <a href="#home">Home</a>
                <a href="#setup">New Test</a>
                <a href="#dashboard">Dashboard</a>
                <a href="#leaderboard">Leaderboard</a>
              </div>
              <div class="hp5-footer-col">
                <h4>Exams</h4>
                <a href="#board?id=SSC">SSC</a>
                <a href="#board?id=Railway">Railway</a>
                <a href="#board?id=Banking">Banking</a>
                <a href="#board?id=UPSC">UPSC</a>
              </div>
              <div class="hp5-footer-col">
                <h4>Features</h4>
                <a href="#battle">Rival Battle</a>
                <a href="#profile">Profile & Rewards</a>
                <a href="#analytics">Analytics</a>
              </div>
            </div>
          </div>
          <div class="hp5-footer-bottom">
            <span>© ${new Date().getFullYear()} Mock24hr — All Rights Reserved</span>
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
      return JSON.parse(localStorage.getItem('test_history') || '[]').length;
    } catch { return 0; }
  },

  async startPresetExam(presetId) {
    const config = ExamPresets.buildConfig(presetId);
    if (!config) { Helpers.showToast('Exam preset not found', 'error'); return; }
    App.navigate('setup', {
      preset: presetId, exam: config.examName,
      subjects: config.subjects.join(','), questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0
    });
  },

  async startDailyChallenge() {
    if (DailySystem.isDailyDone()) { Helpers.showToast('Daily challenge already completed today! 🎉', 'info'); return; }
    const config = DailySystem.getDailyConfig();
    if (!config) { Helpers.showToast('Could not load daily challenge config', 'error'); return; }
    App.navigate('setup', {
      preset: 'daily-challenge', exam: 'Daily Challenge',
      subjects: config.subjects.join(','), questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0, daily: '1'
    });
  },

  async startQuickMode(modeId) {
    const config = ExamPresets.buildConfig(modeId);
    if (!config) { Helpers.showToast('Mode not found', 'error'); return; }
    App.navigate('setup', {
      preset: modeId, exam: config.examName,
      subjects: config.subjects.join(','), questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0
    });
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent("page_view", { page: "home_v5" });
  }
};
