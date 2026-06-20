// ============================================
// HOME PAGE V6 — Precision Prep Design System
// Satoshi headings · Lucide icons · No orbs
// ============================================

const HomePage = {
  _expandedCategory: null,

  // ── Board design tokens ──
  _boardDesignTokens: {
    'SSC': { color: 'var(--board-ssc)', icon: 'clipboard', label: 'SSC', desc: 'Staff Selection Commission' },
    'Railway': { color: 'var(--board-railway)', icon: 'train', label: 'Railway', desc: 'Railway Recruitment Board' },
    'Banking': { color: 'var(--board-banking)', icon: 'landmark', label: 'Banking', desc: 'IBPS & Bank Exams' },
    'UPSC': { color: 'var(--board-upsc)', icon: 'scale', label: 'UPSC', desc: 'Union Public Service Commission' },
    'Teaching': { color: 'var(--board-teaching)', icon: 'graduationCap', label: 'Teaching', desc: 'CTET & Teaching Exams' },
    'Defence': { color: 'var(--board-defence)', icon: 'shield', label: 'Defence', desc: 'CDS, NDA & Defence Exams' },
    'State': { color: 'var(--board-state)', icon: 'building', label: 'State Exams', desc: 'State Level Examinations' },
    'Quick': { color: '#F59E0B', icon: 'zap', label: 'Quick Modes' },
    'Daily': { color: '#EF4444', icon: 'flame', label: 'Daily' }
  },

  _fallbackColors: ['#6366F1', '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#06B6D4', '#84CC16'],
  _fallbackIcons: ['fileText', 'bookOpen', 'brain', 'target', 'listChecks', 'activity', 'graduationCap'],

  _getBoards() {
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];
    if (!allPresets.length) return this._getDefaultBoards();

    const boardMap = {};
    for (const preset of allPresets) {
      const cat = preset.category || 'Other';
      if (cat === 'Quick' || cat === 'Daily') continue;
      if (!boardMap[cat]) boardMap[cat] = { id: cat, exams: [] };
      boardMap[cat].exams.push(preset);
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
        icon: tokens.icon || this._fallbackIcons[colorIdx % this._fallbackIcons.length],
        color: tokens.color || this._fallbackColors[colorIdx++ % this._fallbackColors.length],
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
      { id: 'SSC', icon: 'clipboard', color: 'var(--board-ssc)', label: 'SSC', desc: 'Staff Selection Commission', exams: 'CGL · CHSL · MTS · GD · Stenographer', count: 5 },
      { id: 'Railway', icon: 'train', color: 'var(--board-railway)', label: 'Railway', desc: 'Railway Recruitment Board', exams: 'NTPC · Group D · ALP · JE', count: 4 },
      { id: 'Banking', icon: 'landmark', color: 'var(--board-banking)', label: 'Banking', desc: 'IBPS & Bank Exams', exams: 'IBPS PO · SBI Clerk · RBI Assistant', count: 3 },
      { id: 'UPSC', icon: 'scale', color: 'var(--board-upsc)', label: 'UPSC', desc: 'Union Public Service Commission', exams: 'Prelims · CSAT · NDA', count: 3 },
      { id: 'Teaching', icon: 'graduationCap', color: 'var(--board-teaching)', label: 'Teaching', desc: 'CTET & Teaching Exams', exams: 'CTET · SUPER TET · KVS', count: 3 },
      { id: 'Defence', icon: 'shield', color: 'var(--board-defence)', label: 'Defence', desc: 'CDS, NDA & Defence Exams', exams: 'CDS · NDA · AFCAT', count: 3 }
    ];
  },

  _getPopularExams() {
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];
    const iconMap = { SSC: 'clipboard', Railway: 'train', Banking: 'landmark', UPSC: 'scale', Teaching: 'graduationCap', Defence: 'shield' };
    return allPresets
      .filter(p => p.category !== 'Quick' && p.category !== 'Daily')
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        name: p.name,
        icon: iconMap[p.category] || 'fileText',
        meta: `${p.totalQuestions}Q · ${Math.round(p.totalTime / 60)} min · ${p.negativeMarking ? '-' + p.negativeValue : 'No neg'}`
      }));
  },

  _boardIcon(name, color) {
    const svg = Icons.get(name);
    return `<div class="hp5-board-icon" style="--bc: ${color}">${svg}</div>`;
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
      <div class="page-enter-v3 hp-v5">

        <!-- ═══ HERO ═══ -->
        <section class="hp5-hero">
          <div class="hp5-hero-bg">
            <div class="hp5-hero-grid"></div>
          </div>

          <div class="hp5-hero-content">
            <div class="hp5-badge">
              <span class="hp5-badge-dot"></span>
              <span>Free · No Login · Instant Start</span>
            </div>

            <h1 class="hp5-title">
              Practice with <em>real exam interfaces</em> before the real day
            </h1>

            <p class="hp5-subtitle">
              CBT simulation for SSC, Railway, Banking & UPSC. Same interface, same pressure, better preparation.
            </p>

            <div class="hp5-hero-actions">
              <button class="hp5-btn-primary" onclick="document.getElementById('board-section').scrollIntoView({behavior:'smooth'})" id="hero-explore-btn">
                <span>Explore Exams</span>
                ${Icons.get('arrowRight', 18)}
              </button>
              <button class="hp5-btn-secondary" onclick="App.navigate('setup')" id="hero-custom-btn">
                ${Icons.get('zap', 16)}
                <span>Quick Test</span>
              </button>
            </div>

            ${hasResumeTest ? `
            <div class="hp5-resume">
              <button class="hp5-resume-btn" onclick="App.navigate('test')">
                <span class="hp5-resume-pulse"></span>
                Continue Your Test
                ${Icons.get('arrowRight', 14)}
              </button>
            </div>
            ` : ''}

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

        <!-- ═══ POLYTECHNIC ═══ -->
        <section class="hp5-container">
          <div class="hp5-poly" onclick="window.location.href='/polytechnic-important-paper/'" id="polytechnic-feature-card">
            <div class="hp5-poly-inner">
              <div class="hp5-poly-left">
                <div class="hp5-poly-badge">${Icons.get('fileText', 14)} BTEUP Authentic</div>
                <h2 class="hp5-poly-title">Polytechnic Paper Generator</h2>
                <p class="hp5-poly-desc">Real BTEUP format · 60 Marks · Part A-D · All units covered · Print-ready A4</p>
                <div class="hp5-poly-chips">
                  <span>${Icons.get('check', 12)} Real Format</span>
                  <span>${Icons.get('check', 12)} 60 Marks</span>
                  <span>${Icons.get('check', 12)} Hindi / English</span>
                  <span>${Icons.get('check', 12)} Print Ready</span>
                </div>
                <button class="hp5-poly-cta" onclick="event.stopPropagation(); window.location.href='/polytechnic-important-paper/'">
                  Generate Paper ${Icons.get('arrowRight', 14)}
                </button>
              </div>
              <div class="hp5-poly-right">
                <div class="hp5-poly-visual">
                  <div class="hp5-poly-paper">
                    <div class="hp5-pp-header">BOARD OF TECHNICAL EDUCATION</div>
                    <div class="hp5-pp-sub">POLYTECHNIC EXAM</div>
                    <div class="hp5-pp-line"></div>
                    <div class="hp5-pp-q">Part A ··· 10 × 1 = 10</div>
                    <div class="hp5-pp-q dim">Part B ··· 5 × 2 = 10</div>
                    <div class="hp5-pp-q dim">Part C ··· 8 × 2½ = 20</div>
                    <div class="hp5-pp-q dim">Part D ··· 4 × 5 = 20</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ BOARD GRID ═══ -->
        <section class="hp5-container" id="board-section">
          <div class="hp5-section-head">
            <h2>Choose Your Board</h2>
            <p>Select your exam category to start practicing</p>
          </div>

          <div class="hp5-board-grid">
            ${this._getBoards().map(board => `
              <div class="hp5-board-card"
                   style="--bc: ${board.color}; --bg: ${board.color};"
                   onclick="App.navigate('board', {id: '${board.id}'})"
                   id="board-card-${board.id}">
                <div class="hp5-board-top">
                  <div class="hp5-board-icon">${Icons.get(board.icon, 22)}</div>
                  <div class="hp5-board-arrow">${Icons.get('arrowRight', 16)}</div>
                </div>
                <div class="hp5-board-name">${board.label}</div>
                <div class="hp5-board-desc">${board.desc || board.exams}</div>
                <div class="hp5-board-tags">${board.exams}</div>
                <div class="hp5-board-footer">
                  <span class="hp5-board-count">${board.count} Exams</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ═══ QUICK PRACTICE ═══ -->
        <section class="hp5-container">
          <div class="hp5-section-head">
            <h2>Quick Practice</h2>
            <p>Jump into a focused session — no setup needed</p>
          </div>

          <div class="hp5-modes-grid">
            <div class="hp5-mode-card hp5-mode-daily" ${dailyDone ? '' : 'onclick="HomePage.startDailyChallenge()"'} id="action-daily">
              <div class="hp5-mode-icon" style="color: var(--warning)">${Icons.get('flame', 20)}</div>
              <div class="hp5-mode-body">
                <div class="hp5-mode-title">Daily Challenge</div>
                <div class="hp5-mode-meta">15 Questions · 10 Minutes</div>
              </div>
              <div class="hp5-mode-action ${dailyDone ? 'done' : ''}">${dailyDone ? Icons.get('check', 14) + ' Done' : 'Start →'}</div>
            </div>

            <div class="hp5-mode-card hp5-mode-quick" onclick="HomePage.startQuickMode('quick-10')" id="action-quick10">
              <div class="hp5-mode-icon" style="color: var(--primary)">${Icons.get('zap', 20)}</div>
              <div class="hp5-mode-body">
                <div class="hp5-mode-title">Quick 10</div>
                <div class="hp5-mode-meta">10 Mixed Questions · 5 Minutes</div>
              </div>
              <div class="hp5-mode-action">Start →</div>
            </div>

            <div class="hp5-mode-card hp5-mode-custom" onclick="App.navigate('setup')" id="action-custom">
              <div class="hp5-mode-icon" style="color: var(--secondary)">${Icons.get('target', 20)}</div>
              <div class="hp5-mode-body">
                <div class="hp5-mode-title">Custom Test</div>
                <div class="hp5-mode-meta">Pick subjects, time & difficulty</div>
              </div>
              <div class="hp5-mode-action">Create →</div>
            </div>

            <div class="hp5-mode-card hp5-mode-battle" onclick="App.navigate('battle')" id="action-battle">
              <div class="hp5-mode-icon" style="color: var(--danger)">${Icons.get('swords', 20)}</div>
              <div class="hp5-mode-body">
                <div class="hp5-mode-title">Rival Battle</div>
                <div class="hp5-mode-meta">5 Rounds · AI Opponent · Ranked</div>
              </div>
              <div class="hp5-mode-action">Play →</div>
            </div>
          </div>
        </section>

        <!-- ═══ POPULAR EXAMS ═══ -->
        <section class="hp5-container">
          <div class="hp5-section-head">
            <h2>Popular Exams</h2>
            <p>Most attempted mock tests this week</p>
          </div>

          <div class="hp5-popular-grid">
            ${this._getPopularExams().map((exam, i) => `
              <div class="hp5-popular-card" onclick="HomePage.startPresetExam('${exam.id}')" id="popular-${exam.id}">
                <div class="hp5-pop-rank">${i + 1}</div>
                <div class="hp5-pop-icon">${Icons.get(exam.icon, 20)}</div>
                <div class="hp5-pop-info">
                  <div class="hp5-pop-name">${exam.name}</div>
                  <div class="hp5-pop-meta">${exam.meta}</div>
                </div>
                <button class="hp5-pop-btn" onclick="event.stopPropagation(); HomePage.startPresetExam('${exam.id}')">Start</button>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ═══ WHY US ═══ -->
        <section class="hp5-container">
          <div class="hp5-section-head">
            <h2>Why Mock24hr?</h2>
            <p>Built specifically for Indian government exam aspirants</p>
          </div>

          <div class="hp5-features-grid">
            <div class="hp5-feature-card">
              <div class="hp5-feat-icon" style="--fc: #3B82F6;">${Icons.get('monitor', 22)}</div>
              <h3>Real CBT Interface</h3>
              <p>Exact replica of TCS iON, RRB, IBPS exam screens</p>
            </div>
            <div class="hp5-feature-card">
              <div class="hp5-feat-icon" style="--fc: #8B5CF6;">${Icons.get('fileText', 22)}</div>
              <h3>PYQ Based Questions</h3>
              <p>Previous year patterns with updated syllabus coverage</p>
            </div>
            <div class="hp5-feature-card">
              <div class="hp5-feat-icon" style="--fc: #10B981;">${Icons.get('barChart', 22)}</div>
              <h3>Deep Analytics</h3>
              <p>Section-wise analysis, accuracy trends & time insights</p>
            </div>
            <div class="hp5-feature-card">
              <div class="hp5-feat-icon" style="--fc: #F59E0B;">${Icons.get('smartphone', 22)}</div>
              <h3>Works Everywhere</h3>
              <p>Mobile optimized. Install as app. Zero downloads.</p>
            </div>
          </div>
        </section>

        <!-- ═══ STREAK + PROGRESS ═══ -->
        <section class="hp5-container">
          <div class="hp5-twin-row">
            <div class="hp5-info-card">
              <div class="hp5-info-icon" style="color: ${streakAlive ? 'var(--warning)' : 'var(--text-muted)'}">${Icons.get(streakAlive ? 'flame' : 'clock', 24)}</div>
              <div class="hp5-info-body">
                <div class="hp5-info-big">${streak.current}</div>
                <div class="hp5-info-label">Day Streak</div>
                <div class="hp5-info-detail">${goal.testsToday}/${goal.target} tests today${streak.best > 1 ? ` · Best: ${streak.best}` : ''}</div>
              </div>
            </div>

            <div class="hp5-info-card">
              <div class="hp5-info-icon" style="color: var(--primary)">${Icons.get('target', 24)}</div>
              <div class="hp5-info-body">
                <div class="hp5-info-big">${this._getAccuracy()}%</div>
                <div class="hp5-info-label">Overall Accuracy</div>
                <div class="hp5-info-detail">${this._getTestsCompleted()} tests completed</div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══ FOOTER ═══ -->
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
    if (DailySystem.isDailyDone()) { Helpers.showToast('Daily challenge already completed today!', 'info'); return; }
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
    if (window.trackEvent) window.trackEvent("page_view", { page: "home_v6" });
  }
};
