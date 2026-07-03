// ============================================
// HOME PAGE — Premium Redesign v10
// Full-viewport centered hero
// Opaque solid cards (no glassmorphism)
// Board cards link directly to board pages
// Hot & Trending Mock cards with pulsing live dot
// Matches approved mockup exactly
// ============================================

const HomePage = {

  _boardConfig: {
    SSC:      { icon: '📋', color: '#1A56DB', label: 'SSC',         bg: '#EBF5FF', sub: 'CGL · CHSL · MTS · GD · CPO' },
    Railway:  { icon: '🚆', color: '#E02424', label: 'Railway',     bg: '#FDE8E8', sub: 'NTPC · Group D · ALP' },
    Banking:  { icon: '🏦', color: '#0E9F6E', label: 'Banking',     bg: '#EBF8F2', sub: 'IBPS PO · SBI PO · Clerk' },
    UPSC:     { icon: '⚖️', color: '#D97706', label: 'UPSC',        bg: '#FEF3C7', sub: 'Civil Services · EPFO' }
  },

  _hotMocks: [
    { id: 'ssc-cgl',   name: 'SSC CGL Full Mock',        q: 100, min: 60,  badge: 'Hot',      category: 'SSC',     attempts: '14.2k attempts this week', active: '5k+ practicing' },
    { id: 'rrb-ntpc',  name: 'Railway NTPC Mock',         q: 100, min: 90,  badge: 'Trending', category: 'Railway', attempts: '9.8k attempts this week',  active: '3k+ practicing' },
    { id: 'ibps-po',   name: 'IBPS PO Full Mock',         q: 100, min: 60,  badge: 'Hot',      category: 'Banking', attempts: '11.5k attempts this week', active: '4k+ practicing' },
    { id: 'sbi-po',    name: 'SBI PO Prelims Mock',       q: 100, min: 60,  badge: 'Trending', category: 'Banking', attempts: '8.4k attempts this week',  active: '2k+ practicing' }
  ],

  render() {
    const isLoggedIn = window.FirebaseAuth && FirebaseAuth.isLoggedIn();
    const user = isLoggedIn ? FirebaseAuth.getUser() : null;
    const userName = user ? (user.displayName || 'Student') : '';

    const hasResume = !!window.Storage?.getCurrentTest?.();
    const dailyDone = window.DailySystem?.isDailyDone?.() || false;
    const streak    = window.DailySystem?.getStreak?.()?.current || 0;
    const boards    = this._getBoards();

    return `
      <div class="hp page-enter">

        <!-- HERO — Full viewport centered -->
        ${this._renderHero(isLoggedIn, userName)}

        <!-- BELOW THE FOLD — scrollable content -->
        <div class="hp-content">

          <!-- Continue Card -->
          ${hasResume ? this._renderContinueCard() : ''}

          <!-- Quick Actions -->
          ${this._renderQuickActions(dailyDone, streak)}

          <!-- Choose Your Board Grid -->
          ${this._renderBoardGrid(boards)}

          <!-- Hot & Trending Mock Cards -->
          ${this._renderHotMocks()}

          <!-- Stats (logged-in only) -->
          ${isLoggedIn ? this._renderStatsStrip(streak) : ''}

        </div>
      </div>
    `;
  },


  // ── HERO ──
  _renderHero(isLoggedIn, userName) {
    const badge = isLoggedIn
      ? `<div class="hp-hero-badge">👋 Welcome back, ${userName}</div>`
      : `<div class="hp-hero-badge">🎯 India's Most Trusted Mock Test Platform</div>`;

    const ctas = isLoggedIn
      ? `<div class="hp-hero-ctas">
           <button class="hp-hero-btn hp-hero-btn--primary" onclick="App.navigate('setup')">Start Free Test →</button>
           <button class="hp-hero-btn hp-hero-btn--secondary" onclick="App.navigate('setup', {mode:'custom'})">Explore Exams →</button>
         </div>`
      : `<div class="hp-hero-ctas">
           <button class="hp-hero-btn hp-hero-btn--primary" onclick="App.navigate('setup')">Start Free Test →</button>
           <button class="hp-hero-btn hp-hero-btn--secondary" onclick="App.navigate('setup')">Explore Exams →</button>
         </div>`;

    return `
      <section class="hp-hero">

        <!-- LEFT: Text content -->
        <div class="hp-hero-left">
          ${badge}

          <h1>Practice Smart,<br><span class="hp-hero-accent">Score Higher.</span></h1>

          <p class="hp-hero-subtitle">Unlimited mocks, real exam pattern, detailed analysis and AI-powered insights to help you ace every exam.</p>

          ${ctas}

          <div class="hp-hero-stats">
            <div class="hp-hero-stat">
              <div class="hp-hero-stat-icon" style="--hs-bg:rgba(99,102,241,0.15);">👥</div>
              <div class="hp-hero-stat-text">
                <div class="hp-hero-stat-value">2.5M+</div>
                <div class="hp-hero-stat-label">Students</div>
              </div>
            </div>
            <div class="hp-hero-stat">
              <div class="hp-hero-stat-icon" style="--hs-bg:rgba(16,185,129,0.15);">📋</div>
              <div class="hp-hero-stat-text">
                <div class="hp-hero-stat-value">25M+</div>
                <div class="hp-hero-stat-label">Mocks Attempted</div>
              </div>
            </div>
            <div class="hp-hero-stat">
              <div class="hp-hero-stat-icon" style="--hs-bg:rgba(245,158,11,0.15);">🏆</div>
              <div class="hp-hero-stat-text">
                <div class="hp-hero-stat-value">1.2M+</div>
                <div class="hp-hero-stat-label">Tests Completed</div>
              </div>
            </div>
            <div class="hp-hero-stat">
              <div class="hp-hero-stat-icon" style="--hs-bg:rgba(59,130,246,0.15);">🚀</div>
              <div class="hp-hero-stat-text">
                <div class="hp-hero-stat-value">98.4%</div>
                <div class="hp-hero-stat-label">Success Rate</div>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: Study scene image -->
        <div class="hp-hero-right">
          <img src="assets/hero-study.png" alt="Study desk with textbooks" loading="eager" />
        </div>

      </section>
    `;
  },



  // ── CONTINUE CARD ──
  _renderContinueCard() {
    const test = window.Storage?.getCurrentTest?.();
    const name = test?.config?.name || 'Previous Test';
    const q = test?.currentQuestion || 0;
    const total = test?.questions?.length || 0;
    const pct = total > 0 ? Math.round((q / total) * 100) : 0;

    return `
      <div class="hp-continue" onclick="App.navigate('test')">
        <div>
          <div class="hp-continue-badge">⚡ In-Progress Test</div>
          <div class="hp-continue-name">${name}</div>
          <div class="hp-continue-meta">Q.${q + 1} of ${total} · Auto-saved</div>
          <div class="hp-continue-progress">
            <div class="hp-continue-progress-bar" style="width: ${pct}%"></div>
          </div>
        </div>
        <button class="btn btn-primary btn-sm">Resume →</button>
      </div>
    `;
  },


  // ── QUICK ACTIONS ──
  _renderQuickActions(dailyDone, streak) {
    const streakText = streak > 0 ? `🔥 ${streak} day streak` : 'Streak: 0 days';
    const dailyTag  = dailyDone ? '✓ Done today' : streakText;

    return `
      <div class="hp-section">
        <div class="hp-quick-actions">
          <div class="hp-qa-card qa-daily" onclick="HomePage._startDaily()">
            <div class="hp-qa-icon">🔥</div>
            <div class="hp-qa-label">${dailyDone ? '✓ Completed' : 'Daily Challenge'}</div>
            <div class="hp-qa-sub">15 Questions · Adaptive</div>
            <span class="hp-qa-tag">${dailyTag}</span>
          </div>
          <a href="#battle" class="hp-qa-card qa-battle">
            <div class="hp-qa-icon">⚔️</div>
            <div class="hp-qa-label">AI Battle</div>
            <div class="hp-qa-sub">Compete with AI</div>
            <span class="hp-qa-tag">⚡ 2.5k playing</span>
          </a>
          <div class="hp-qa-card qa-custom" onclick="App.navigate('setup', {mode:'custom'})">
            <div class="hp-qa-icon">🎯</div>
            <div class="hp-qa-label">Custom Test</div>
            <div class="hp-qa-sub">Create your own test</div>
            <span class="hp-qa-tag">♾️ Unlimited</span>
          </div>
          <a href="#polytechnic" class="hp-qa-card qa-poly">
            <div class="hp-qa-icon">📝</div>
            <div class="hp-qa-label">BTEUP Papers</div>
            <div class="hp-qa-sub">Previous Year Papers</div>
            <span class="hp-qa-tag">📜 Updated</span>
          </a>
        </div>
      </div>
    `;
  },


  // ── BOARD GRID (Links to board pages, gradient cards like screenshot) ──
  _renderBoardGrid(boards) {
    const boardClass = { SSC: 'board-ssc', Railway: 'board-railway', Banking: 'board-banking', UPSC: 'board-upsc' };
    const cards = boards.map(b => `
      <a href="#board?id=${b.id}" class="hp-board-card ${boardClass[b.id] || ''}">
        <div class="hp-board-icon">${b.icon}</div>
        <div class="hp-board-info">
          <div class="hp-board-name">${b.label}</div>
          <div class="hp-board-count">${b.sub}</div>
        </div>
        <span class="hp-board-arrow">→</span>
      </a>
    `).join('');

    return `
      <div class="hp-section">
        <div class="hp-section-header">
          <div class="hp-section-title">Choose Your Board</div>
          <a href="#board" class="hp-section-action">See all boards →</a>
        </div>
        <div class="hp-board-grid">
          ${cards}
        </div>
      </div>
    `;
  },


  // ── 🔥 HOT & TRENDING MOCKS (Horizontal icon-left layout) ──
  _renderHotMocks() {
    const cards = this._hotMocks.map(m => {
      const cls = `hot-${m.category.toLowerCase()}`;
      return `
        <div class="hp-hot-card ${cls}" onclick="HomePage._startExam('${m.id}')">
          <div class="hp-hot-icon">${this._boardConfig[m.category]?.icon || '📋'}</div>
          <div class="hp-hot-body">
            <div class="hp-hot-header">
              <span class="hp-hot-badge">${m.badge}</span>
              <span class="hp-live-indicator">
                <span class="hp-live-dot"></span>
                ${m.active}
              </span>
            </div>
            <div class="hp-hot-name">${m.name}</div>
            <div class="hp-hot-stats">${m.q} Questions · ${m.min} Mins · Negative Marks</div>
            <div class="hp-hot-attempts">📈 ${m.attempts}</div>
            <button class="hp-hot-btn" onclick="event.stopPropagation(); HomePage._startExam('${m.id}')">Start Now →</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="hp-section">
        <div class="hp-section-header">
          <div class="hp-section-title">🔥 Hot &amp; Trending Mocks</div>
          <a href="#board" class="hp-section-action">View all mocks →</a>
        </div>
        <div class="hp-hot-grid">
          ${cards}
        </div>
      </div>
    `;
  },


  // ── STATS STRIP (with icon circles like screenshot) ──
  _renderStatsStrip(streak) {
    return `
      <div class="hp-section">
        <div class="hp-stats">
          <div class="hp-stat-item">
            <div class="hp-stat-icon" style="background:rgba(99,102,241,0.15);">👥</div>
            <div class="hp-stat-text">
              <div class="hp-stat-value">2.5M+</div>
              <div class="hp-stat-label">Total Users</div>
            </div>
          </div>
          <div class="hp-stat-item">
            <div class="hp-stat-icon" style="background:rgba(16,185,129,0.15);">✅</div>
            <div class="hp-stat-text">
              <div class="hp-stat-value">25M+</div>
              <div class="hp-stat-label">Mocks Attempted</div>
            </div>
          </div>
          <div class="hp-stat-item">
            <div class="hp-stat-icon" style="background:rgba(245,158,11,0.15);">🏆</div>
            <div class="hp-stat-text">
              <div class="hp-stat-value">1.2M+</div>
              <div class="hp-stat-label">Tests Completed</div>
            </div>
          </div>
          <div class="hp-stat-item">
            <div class="hp-stat-icon" style="background:rgba(59,130,246,0.15);">📈</div>
            <div class="hp-stat-text">
              <div class="hp-stat-value">98.4%</div>
              <div class="hp-stat-label">Success Rate</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },


  // ── HELPERS ──
  _getBoards() {
    const allPresets = window.ExamPresets?.getAll ? ExamPresets.getAll() : [];
    const boardMap = {};
    for (const p of allPresets) {
      const cat = p.category || 'Other';
      if (cat === 'Quick' || cat === 'Daily') continue;
      boardMap[cat] = (boardMap[cat] || 0) + 1;
    }
    return Object.entries(this._boardConfig).map(([id, cfg]) => ({
      id,
      ...cfg,
      tests: boardMap[id] || 0,
    }));
  },

  async _startExam(presetId) {
    if (!window.ExamPresets) return;
    App.navigate('setup', { preset: presetId });
  },

  async _startDaily() {
    if (window.DailySystem?.isDailyDone?.()) {
      window.Helpers?.showToast?.('Daily challenge already completed today!', 'info');
      return;
    }
    App.navigate('setup', { preset: 'daily-challenge', daily: '1' });
  },

  afterRender() {
    if (window.trackEvent) trackEvent('page_view', { page: 'home' });
  },

  destroy() {
    // Clean up
  }
};

window.HomePage = HomePage;
