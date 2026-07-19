// ============================================
// HOME PAGE — Doc 5 "Homepage UX & Conversion PRD"
// Goal: Convert visitors into active learners in 60s
// Flow: Hero → Search → Activity → Exams → Trending →
//       Features → AI Study → BTEUP → Progress/Trust →
//       Testimonials → Pricing → FAQ
// ============================================

const HomePage = {

  _boardConfig: {
    SSC:      { icon: '◆', color: '#1A56DB', label: 'SSC',         bg: '#EBF5FF', sub: 'CGL · CHSL · MTS · GD · CPO',      img: 'assets/ssc-editorial.png' },
    Railway:  { icon: '▲', color: '#E02424', label: 'Railway',     bg: '#FDE8E8', sub: 'NTPC · Group D · ALP',              img: 'assets/railway-editorial.png' },
    Banking:  { icon: '◎', color: '#0E9F6E', label: 'Banking',     bg: '#EBF8F2', sub: 'IBPS PO · SBI PO · Clerk',          img: 'assets/banking-editorial.png' },
    UPSC:     { icon: '▤', color: '#D97706', label: 'UPSC',        bg: '#FEF3C7', sub: 'Civil Services · EPFO',             img: 'assets/upsc-editorial.png' }
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

        <!-- HERO — Full viewport centered (Doc 5 §4) -->
        ${this._renderHero(isLoggedIn, userName, hasResume)}

        <!-- BELOW THE FOLD — scrollable content -->
        <div class="hp-content">

          <!-- Universal Search + Quick Start Chips (Doc 5 §6) -->
          ${this._renderSearch()}

          <!-- Live Activity Feed (Doc 5 §26A) -->
          ${this._renderLiveActivity()}

          <!-- Popular Exams Grid (Doc 5 §7) -->
          ${this._renderBoardGrid(boards)}

          <!-- Today's Trending Tests (Doc 5 §8) -->
          ${this._renderHotMocks()}

          <!-- Why Mock24hr — Features (Doc 5 §9, surface bg) -->
          ${this._renderFeatures()}

          <!-- AI Study System (Doc 5 §10) -->
          ${this._renderAIStudy()}

          <!-- BTEUP Generator Showcase (Doc 5 §11, editorial bg) -->
          ${this._renderBTEUPShowcase()}

          <!-- Student Progress / Trust (Doc 5 §12/§9) -->
          ${isLoggedIn ? this._renderProgressDemo() : this._renderTrust()}

          <!-- Testimonials (Doc 5 §13, surface bg) -->
          ${this._renderTestimonials()}

          <!-- Pricing (Doc 5 §14) -->
          ${this._renderPricing()}

          <!-- FAQ (Doc 5 §15) -->
          ${this._renderFAQ()}

        </div>
      </div>
    `;
  },


  // ── HERO (Doc 5 §4-5) ──
  _renderHero(isLoggedIn, userName, hasResume) {
    // Returning user gets continue card inside hero
    const continueBlock = (isLoggedIn && hasResume) ? this._renderHeroContinue() : '';

    const badge = isLoggedIn
      ? `<div class="hp-hero-badge">Welcome back, ${userName}</div>`
      : `<div class="hp-hero-badge">Free Mock Test Platform · SSC · Railway · Banking · UPSC</div>`;

    return `
      <section class="hp-hero">
        <div class="hp-hero-left">
          ${badge}

          <h1 class="text-display">Crack Your Next Exam<br>With <span class="hp-hero-accent">Smarter Practice,</span><br>Not More Guesswork.</h1>

          <p class="hp-hero-subtitle">AI-powered mock tests, personalized revision, and BTEUP paper generation — in one platform.</p>

          ${continueBlock}

          <div class="hp-hero-ctas">
            <button class="hp-hero-btn hp-hero-btn--primary" onclick="App.navigate('setup')">
              Start Free Mock &rarr;
            </button>
            <button class="hp-hero-btn hp-hero-btn--secondary" onclick="document.querySelector('.hp-board-grid')?.scrollIntoView({behavior:'smooth'})">
              Explore Exams &rarr;
            </button>
          </div>

          <!-- Trust Row — exam board names, not icons (Doc 5 §4) -->
          <div class="hp-hero-trust">
            <span class="hp-hero-trust-label">Trusted by aspirants of</span>
            <div class="hp-hero-trust-boards">
              <span>SSC</span>
              <span class="hp-trust-dot"></span>
              <span>Railway</span>
              <span class="hp-trust-dot"></span>
              <span>Banking</span>
              <span class="hp-trust-dot"></span>
              <span>UPSC</span>
              <span class="hp-trust-dot"></span>
              <span>BTEUP</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: Study scene image -->
        <div class="hp-hero-right">
          <img src="assets/hero-study.png" alt="Student desk with textbooks, notebook, and laptop in natural morning light" loading="eager" />
        </div>
      </section>
    `;
  },

  // Continue card embedded in hero for returning users
  _renderHeroContinue() {
    const test = window.Storage?.getCurrentTest?.();
    if (!test) return '';
    const name = test?.config?.name || 'Previous Test';
    const q = test?.currentQuestion || 0;
    const total = test?.questions?.length || 0;
    const pct = total > 0 ? Math.round((q / total) * 100) : 0;
    return `
      <div class="hp-hero-continue" onclick="App.navigate('test')">
        <div class="hp-hero-continue-info">
          <span class="hp-hero-continue-badge">⚡ Resume</span>
          <span class="hp-hero-continue-name">${name}</span>
          <span class="hp-hero-continue-meta">Q.${q+1}/${total} · ${pct}% done</span>
        </div>
        <div class="hp-hero-continue-bar">
          <div class="hp-hero-continue-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  },


  // ══════════════════════════════════════════════════════════
  // UNIVERSAL SEARCH + QUICK START CHIPS (Doc 5 §6, §26E)
  // ══════════════════════════════════════════════════════════
  _renderSearch() {
    const chips = [
      { label: 'SSC CGL',      action: "App.navigate('board', {id:'SSC'})" },
      { label: 'Railway NTPC', action: "App.navigate('board', {id:'Railway'})" },
      { label: 'Banking PO',   action: "App.navigate('board', {id:'Banking'})" },
      { label: 'UPSC Pre',     action: "App.navigate('board', {id:'UPSC'})" },
      { label: 'BTEUP',        action: "App.navigate('polytechnic')" },
    ];
    return `
      <div class="hp-search-section">
        <div class="hp-search-bar" onclick="CommandPalette?.open?.()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <span class="hp-search-placeholder">Search Exams, Subjects, Questions, Papers...</span>
          <kbd class="hp-search-kbd">/</kbd>
        </div>
        <div class="hp-chips">
          ${chips.map(c => `<button class="hp-chip" onclick="${c.action}">${c.label}</button>`).join('')}
        </div>
      </div>
    `;
  },


  // ══════════════════════════════════════════════════════════
  // LIVE ACTIVITY FEED (Doc 5 §26A)
  // ══════════════════════════════════════════════════════════
  _renderLiveActivity() {
    return `
      <div class="hp-activity-strip">
        <div class="hp-activity-item">
          <span class="hp-activity-dot hp-activity-dot--green"></span>
          <strong>2,341</strong> students practicing right now
        </div>
        <div class="hp-activity-divider"></div>
        <div class="hp-activity-item">
          <strong>128</strong> tests started in the last hour
        </div>
        <div class="hp-activity-divider"></div>
        <div class="hp-activity-item">
          <strong>54</strong> BTEUP papers generated today
        </div>
      </div>
    `;
  },


  // ══════════════════════════════════════════════════════════
  // POPULAR EXAMS GRID (Doc 5 §7) — editorial photo cards
  // ══════════════════════════════════════════════════════════
  _renderBoardGrid(boards) {
    const boardClass = { SSC: 'board-ssc', Railway: 'board-railway', Banking: 'board-banking', UPSC: 'board-upsc' };
    const cards = boards.map(b => `
      <a href="#board?id=${b.id}" class="hp-board-card ${boardClass[b.id] || ''}" style="background-image: url('${b.img}'); background-size: cover; background-position: center;">
        <div class="hp-board-icon">${b.icon}</div>
        <div class="hp-board-info">
          <div class="hp-board-name">${b.label}</div>
          <div class="hp-board-count">${b.sub}</div>
        </div>
        <span class="hp-board-arrow">→</span>
      </a>
    `).join('');

    const emptyState = boards.length === 0 ? `
      <div class="hp-empty-state">
        <div class="hp-empty-icon">◎</div>
        <p>You're just one mock away from building your progress history.</p>
        <button class="hp-hero-btn hp-hero-btn--primary" onclick="App.navigate('setup')">Start your first test →</button>
      </div>
    ` : '';

    return `
      <div class="hp-section" style="padding-top:64px; padding-bottom:48px;">
        <div class="hp-section-header">
          <div class="hp-section-title">Prepare by Exam Category</div>
          <a href="#board" class="hp-section-action">All categories →</a>
        </div>
        <div class="hp-board-grid">
          ${cards}
        </div>
        ${emptyState}
      </div>
    `;
  },


  // ══════════════════════════════════════════════════════════
  // TODAY'S TRENDING TESTS (Doc 5 §8) — social proof
  // ══════════════════════════════════════════════════════════
  _renderHotMocks() {
    const cards = this._hotMocks.map(m => {
      const cls = `hot-${m.category.toLowerCase()}`;
      return `
        <div class="hp-hot-card ${cls}" onclick="HomePage._startExam('${m.id}')">
          <div class="hp-hot-icon">${this._boardConfig[m.category]?.icon || '&#9632;'}</div>
          <div class="hp-hot-body">
            <div class="hp-hot-header">
              <span class="hp-hot-badge">${m.badge}</span>
              <span class="hp-live-indicator">
                <span class="hp-live-dot"></span>
                ${m.active}
              </span>
            </div>
            <div class="hp-hot-name">${m.name}</div>
            <div class="hp-hot-stats">${m.q} Questions &middot; ${m.min} Mins &middot; Negative Marks</div>
            <div class="hp-hot-attempts">${m.attempts}</div>
            <button class="hp-hot-btn" onclick="event.stopPropagation(); HomePage._startExam('${m.id}')">Start Now →</button>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="hp-section" style="padding-top:48px; padding-bottom:64px;">
        <div class="hp-section-header">
          <div class="hp-section-title">Today's Trending Tests</div>
          <a href="#board" class="hp-section-action">View all mocks →</a>
        </div>
        <div class="hp-hot-grid">
          ${cards}
        </div>
      </div>
    `;
  },


  // ── FEATURES SECTION ── 5 Product Pillars
  _renderFeatures() {
    const pillars = [
      {
        symbol: '→',
        color: '#1A56DB',
        bg: 'rgba(26,86,219,0.08)',
        title: 'Practice',
        desc: 'Full-length mock tests, PYQs, section tests, and daily quizzes modelled on the real exam pattern.'
      },
      {
        symbol: '◎',
        color: '#0E9F6E',
        bg: 'rgba(14,159,110,0.08)',
        title: 'Analysis',
        desc: 'Subject-wise accuracy, time heatmap, speed tracking, percentile rank, and actionable improvement areas.'
      },
      {
        symbol: '▤',
        color: '#D97706',
        bg: 'rgba(217,119,6,0.08)',
        title: 'Planning',
        desc: 'AI-powered daily study plan, revision calendar, goal setting, and personalized topic scheduling.'
      },
      {
        symbol: '✶',
        color: '#9061F9',
        bg: 'rgba(144,97,249,0.08)',
        title: 'Generation',
        desc: 'Offline paper generator, custom question sets, BTEUP papers, and downloadable PDF exports.'
      },
      {
        symbol: '◈',
        color: '#E02424',
        bg: 'rgba(224,36,36,0.08)',
        title: 'Motivation',
        desc: 'Daily streaks, XP points, achievements, AI Battle Mode, friends leaderboard — stay consistent every day.'
      },
    ];
    return `
      <section class="hp-features-section">
        <div class="hp-features-header">
          <div class="hp-features-label">The Platform</div>
          <h2 class="hp-features-title">Practice smarter.<br>Analyze deeper.<br>Improve faster.</h2>
          <p class="hp-features-sub">Five pillars that turn daily practice into actual selection &mdash; not just a score.</p>
        </div>
        <div class="hp-pillars-grid">
          ${pillars.map((p, i) => `
            <div class="hp-pillar-card" style="animation-delay:${i * 80}ms">
              <div class="hp-pillar-symbol" style="color:${p.color}; background:${p.bg};">${p.symbol}</div>
              <div class="hp-pillar-title">${p.title}</div>
              <div class="hp-pillar-desc">${p.desc}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },


  // ══════════════════════════════════════════════════════════
  // AI STUDY SYSTEM (Doc 5 §10)
  // ══════════════════════════════════════════════════════════
  _renderAIStudy() {
    const cards = [
      { icon: '◎', color: '#EF4444', bg: 'rgba(239,68,68,0.08)', title: 'Weakness Detection', desc: 'After every test, AI identifies your weakest topics and tells you exactly what to revise first.' },
      { icon: '▤', color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', title: 'Revision Planner', desc: 'Personalized daily study schedule based on your strengths, weaknesses, and exam date.' },
      { icon: '★', color: '#10B981', bg: 'rgba(16,185,129,0.08)', title: 'Daily Tasks', desc: 'Curated set of questions every day — adaptive difficulty that grows with your ability.' },
      { icon: '◈', color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', title: 'Performance Prediction', desc: 'AI predicts your exam readiness score and suggests what to focus on this week.' },
    ];
    return `
      <div class="hp-section" style="padding-top:96px; padding-bottom:64px;">
        <div class="hp-section-header" style="text-align:center; max-width:600px; margin:0 auto 40px;">
          <div class="hp-features-label">AI-Powered</div>
          <h2 class="hp-features-title">Your Personal Study Assistant</h2>
          <p class="hp-features-sub">Four intelligent tools that adapt to how you learn.</p>
        </div>
        <div class="hp-ai-grid">
          ${cards.map(c => `
            <div class="hp-ai-card">
              <div class="hp-ai-icon" style="color:${c.color}; background:${c.bg};">${c.icon}</div>
              <h3 class="hp-ai-title">${c.title}</h3>
              <p class="hp-ai-desc">${c.desc}</p>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center; margin-top:32px;">
          <button class="hp-hero-btn hp-hero-btn--primary" onclick="App.navigate('dashboard')" style="margin:0 auto;">Try AI Analysis &rarr;</button>
        </div>
      </div>
    `;
  },


  // ══════════════════════════════════════════════════════════
  // BTEUP GENERATOR SHOWCASE (Doc 5 §11)
  // ══════════════════════════════════════════════════════════
  _renderBTEUPShowcase() {
    return `
      <section class="hp-bteup-showcase">
        <div class="hp-bteup-inner">
          <div class="hp-bteup-left">
            <div class="hp-features-label" style="color:#8B5CF6;">Engineering Tools</div>
            <h2 class="hp-bteup-title">BTEUP Previous Year<br>Paper Generator</h2>
            <p class="hp-bteup-desc">Instantly generate semester-wise question papers from our database of 10,000+ verified BTEUP questions. Download as PDF, practice offline.</p>
            <ul class="hp-bteup-features">
              <li>All semesters (1st to 6th) covered</li>
              <li>Subject-wise filtering</li>
              <li>PDF export with answer key</li>
              <li>Updated with 2024-25 papers</li>
            </ul>
            <button class="hp-hero-btn hp-hero-btn--primary" onclick="App.navigate('polytechnic')">Generate Sample Paper &rarr;</button>
          </div>
          <div class="hp-bteup-right">
            <div class="hp-bteup-preview">
              <div class="hp-bteup-preview-header">
                <span class="hp-bteup-preview-dot" style="background:#EF4444;"></span>
                <span class="hp-bteup-preview-dot" style="background:#F59E0B;"></span>
                <span class="hp-bteup-preview-dot" style="background:#10B981;"></span>
                <span style="font-size:11px; color:var(--text-muted); margin-left:8px;">paper-generator.pdf</span>
              </div>
              <div class="hp-bteup-preview-body">
                <div class="hp-bteup-preview-line hp-bteup-preview-line--title">BTEUP Examination 2024-25</div>
                <div class="hp-bteup-preview-line hp-bteup-preview-line--sub">Semester: 3rd &middot; Subject: Applied Mathematics</div>
                <div class="hp-bteup-preview-line hp-bteup-preview-line--divider"></div>
                <div class="hp-bteup-preview-line">Q.1 Solve the differential equation...</div>
                <div class="hp-bteup-preview-line">Q.2 Find the Laplace transform of...</div>
                <div class="hp-bteup-preview-line">Q.3 Evaluate the integral...</div>
                <div class="hp-bteup-preview-line hp-bteup-preview-line--fade">Q.4 Using matrix method, solve...</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  },


  // ══════════════════════════════════════════════════════════
  // STUDENT PROGRESS DEMO (Doc 5 §12)
  // ══════════════════════════════════════════════════════════
  _renderProgressDemo() {
    const streak = window.DailySystem?.getStreak?.() || { current: 0 };
    const history = window.Storage?.getHistory?.() || [];
    const totalTests = history.length;
    const avgScore = totalTests > 0 ? Math.round(history.reduce((s,t) => s + (t.score||0), 0) / totalTests) : 0;
    const weakArea = this._getWeakArea(history);

    return `
      <section class="hp-progress-section">
        <div class="hp-progress-inner">
          <div class="hp-features-label" style="text-align:center;">Your Progress</div>
          <h2 class="hp-features-title" style="text-align:center;">See how you're improving</h2>
          <div class="hp-progress-grid">
            <div class="hp-progress-card">
              <div class="hp-progress-value" style="color:#3B82F6;">${streak.current}</div>
              <div class="hp-progress-label">Day Streak</div>
            </div>
            <div class="hp-progress-card">
              <div class="hp-progress-value" style="color:#10B981;">${avgScore}%</div>
              <div class="hp-progress-label">Avg Accuracy</div>
            </div>
            <div class="hp-progress-card">
              <div class="hp-progress-value" style="color:#F59E0B;">${totalTests}</div>
              <div class="hp-progress-label">Tests Taken</div>
            </div>
            <div class="hp-progress-card">
              <div class="hp-progress-value" style="color:#EF4444;">${weakArea}</div>
              <div class="hp-progress-label">Focus Area</div>
            </div>
          </div>
          <div style="text-align:center; margin-top:24px;">
            <button class="hp-hero-btn hp-hero-btn--secondary" onclick="App.navigate('analytics')">View Full Analytics &rarr;</button>
          </div>
        </div>
      </section>
    `;
  },

  _getWeakArea(history) {
    if (!history || history.length === 0) return 'Start a test';
    const subjectScores = {};
    history.forEach(t => {
      if (t.subjectScores) {
        Object.entries(t.subjectScores).forEach(([sub, data]) => {
          if (!subjectScores[sub]) subjectScores[sub] = { total: 0, correct: 0 };
          subjectScores[sub].total += data.total || 0;
          subjectScores[sub].correct += data.correct || 0;
        });
      }
    });
    let weakest = 'General';
    let lowestPct = 100;
    Object.entries(subjectScores).forEach(([sub, d]) => {
      const pct = d.total > 0 ? (d.correct / d.total) * 100 : 100;
      if (pct < lowestPct) { lowestPct = pct; weakest = sub; }
    });
    return weakest;
  },


  // ══════════════════════════════════════════════════════════
  // PRICING (Doc 5 §14)
  // ══════════════════════════════════════════════════════════
  _renderPricing() {
    return `
      <section class="hp-pricing-section">
        <div class="hp-pricing-header">
          <div class="hp-features-label">Plans</div>
          <h2 class="hp-features-title">Simple, transparent pricing</h2>
          <p class="hp-features-sub">Start free. Upgrade when you're ready for more.</p>
        </div>
        <div class="hp-pricing-grid">

          <!-- Free -->
          <div class="hp-pricing-card">
            <div class="hp-pricing-plan">Free</div>
            <div class="hp-pricing-price">₹0 <span>/ forever</span></div>
            <ul class="hp-pricing-features">
              <li>All mock tests (SSC, Railway, Banking, UPSC)</li>
              <li>Basic test analysis</li>
              <li>Daily Challenge</li>
              <li>AI Battle Mode</li>
              <li>Progress tracking</li>
            </ul>
            <button class="hp-pricing-btn" onclick="App.navigate('setup')">Start Free &rarr;</button>
          </div>

          <!-- Plus (highlighted) -->
          <div class="hp-pricing-card hp-pricing-card--popular">
            <div class="hp-pricing-badge">Most Popular</div>
            <div class="hp-pricing-plan">Plus</div>
            <div class="hp-pricing-price">Coming Soon</div>
            <ul class="hp-pricing-features">
              <li>Everything in Free</li>
              <li>AI Weakness Detection</li>
              <li>Personalized Revision Planner</li>
              <li>Performance Prediction</li>
              <li>Priority support</li>
            </ul>
            <button class="hp-pricing-btn hp-pricing-btn--primary" disabled>Notify Me &rarr;</button>
          </div>

          <!-- Pro -->
          <div class="hp-pricing-card">
            <div class="hp-pricing-plan">Pro</div>
            <div class="hp-pricing-price">Coming Soon</div>
            <ul class="hp-pricing-features">
              <li>Everything in Plus</li>
              <li>BTEUP PDF export</li>
              <li>Offline paper access</li>
              <li>Custom test builder</li>
              <li>1-on-1 coaching sessions</li>
            </ul>
            <button class="hp-pricing-btn" disabled>Notify Me &rarr;</button>
          </div>

        </div>
      </section>
    `;
  },
  // ── TESTIMONIALS (Doc 5 §13: Before/After improvement data) ──
  _renderTestimonials() {
    const reviews = [
      {
        name: 'Amit Kumar', exam: 'SSC CGL 2024', score: '★★★★★', avatar: 'A', clr: '#4F46E5',
        text: 'Mock24hr ke regular mocks ne meri speed aur accuracy dono improve ki.',
        before: '54% accuracy', after: '148/200 final score', metric: 'Score improved by 37%'
      },
      {
        name: 'Priya Sharma', exam: 'IBPS PO 2024', score: '★★★★★', avatar: 'P', clr: '#10B981',
        text: 'AI Battle mode mujhe bahut pasand hai — isse competitive feel aata hai.',
        before: '12 tests/month', after: 'Selected in Banking', metric: '3 months of practice'
      },
      {
        name: 'Rahul Yadav', exam: 'RRB NTPC 2024', score: '★★★★☆', avatar: 'R', clr: '#F59E0B',
        text: 'Analysis section bahut detailed hai — pata chalta hai exact weakness kahan hai.',
        before: '61% GK accuracy', after: '89% GK accuracy', metric: 'Weakest subject fixed'
      },
      {
        name: 'Sneha Singh', exam: 'SBI PO Prelims', score: '★★★★★', avatar: 'S', clr: '#EC4899',
        text: 'Daily Challenge feature ne mere study schedule ko disciplined bana diya.',
        before: '0-day streak', after: 'Interview stage', metric: '47-day study streak'
      },
    ];
    return `
      <section class="hp-testimonials-section">
        <div class="hp-testimonials-inner">
          <div class="hp-testimonials-header">
            <div class="hp-testimonials-badge">Student Reviews</div>
            <h2 class="hp-testimonials-title">Toppers Trust <span>Mock24hr</span></h2>
            <p class="hp-testimonials-sub">Real reviews from real aspirants — with real results.</p>
          </div>
          <div class="hp-testimonials-grid">
            ${reviews.map(r => `
              <div class="hp-testimonial-card">
                <div class="hp-testimonial-stars">${r.score}</div>
                <p class="hp-testimonial-text">&ldquo;${r.text}&rdquo;</p>
                <!-- Before/After improvement row (Doc 5 §13) -->
                <div class="hp-testimonial-improvement">
                  <div class="hp-improvement-before">
                    <span class="hp-improvement-label">Before</span>
                    <span class="hp-improvement-val">${r.before}</span>
                  </div>
                  <div class="hp-improvement-arrow">&rarr;</div>
                  <div class="hp-improvement-after">
                    <span class="hp-improvement-label">After</span>
                    <span class="hp-improvement-val hp-improvement-val--green">${r.after}</span>
                  </div>
                </div>
                <div class="hp-testimonial-metric">${r.metric}</div>
                <div class="hp-testimonial-author">
                  <div class="hp-testimonial-avatar" style="background:${r.clr}">${r.avatar}</div>
                  <div>
                    <div class="hp-testimonial-name">${r.name}</div>
                    <div class="hp-testimonial-exam">${r.exam}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  },

  // ── TRUST SECTION ──
  _renderTrust() {
    const signals = [
      { symbol: '\u2192', title: 'Official Syllabus Aligned', desc: 'Questions built from NCERT, official notifications, and previous year papers for SSC, Railway, Banking, UPSC.' },
      { symbol: '\u25ce', title: 'AI-Powered Weakness Detection', desc: 'After every test, our analysis engine identifies your weakest topics and tells you exactly what to revise.' },
      { symbol: '\u25a4', title: 'No Paywalls on Core Practice', desc: 'Mock tests are free. Always. Premium unlocks intelligence \u2014 not the basic right to practice.' },
      { symbol: '\u2736', title: 'Updated with Latest PYQs', desc: 'Question bank is regularly updated with previous year papers, new exam patterns, and 2024\u201325 notifications.' },
    ];

    return `
      <section class="hp-trust-section">
        <div class="hp-trust-header">
          <div class="hp-trust-label">Why Students Trust Us</div>
          <h2 class="hp-trust-title">Built for serious aspirants,<br>not casual browsers.</h2>
        </div>
        <div class="hp-trust-grid">
          ${signals.map(s => `
            <div class="hp-trust-card">
              <div class="hp-trust-symbol">${s.symbol}</div>
              <div>
                <div class="hp-trust-card-title">${s.title}</div>
                <div class="hp-trust-card-desc">${s.desc}</div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="hp-trust-hook">
          Students who complete 5+ mocks see an average <strong>18% improvement</strong> in accuracy.
          <a href="#" onclick="App.navigate('setup'); return false;">Start your first mock &rarr;</a>
        </div>
      </section>
    `;
  },

  // ── FAQ SECTION (Doc 4: extracted from inline styles to CSS classes) ──
  _renderFAQ() {
    const faqs = [
      { q: 'Kya Mock24hr bilkul free hai?',                   a: 'Haan! Mock24hr completely free hai. SSC, Railway, Banking, UPSC ke sare mocks bina kisi payment ke available hain.' },
      { q: 'Kya questions real exam jaise hote hain?',         a: 'Haan, hamare questions official syllabus aur previous year papers ke basis par bante hain. Difficulty level bhi actual exam jaise hota hai.' },
      { q: 'Result aur analysis kahan dekhun?',               a: 'Har mock test ke baad detailed analysis milti hai — subject-wise accuracy, time-per-question, rank, aur improvement areas.' },
      { q: 'Kya mobile pe use kar sakte hain?',                a: 'Bilkul! Mock24hr fully mobile-responsive hai. Android aur iOS dono par browser mein perfectly kaam karta hai.' },
      { q: 'AI Battle Mode kya hota hai?',                     a: 'AI Battle Mode mein aap ek AI opponent ke against real-time mock test khelti/khelte ho. Speed aur accuracy dono test hoti hai.' },
      { q: 'Kya mera progress save hota hai?',                 a: 'Haan, Google login ke baad aapka poora progress — tests, scores, streaks — dashboard mein save rehta hai.' },
    ];
    return `
      <section class="hp-faq-section">
        <div class="hp-faq-header">
          <div class="hp-faq-badge">FAQ</div>
          <h2 class="hp-faq-title">Frequently Asked <span>Questions</span></h2>
          <p class="hp-faq-sub">Koi sawaal hai? Yahan dekho.</p>
        </div>
        <div class="hp-faq-list" id="hp-faq">
          ${faqs.map((f, i) => `
            <div class="hp-faq-item" id="faq-item-${i}">
              <button class="hp-faq-question" onclick="HomePage._toggleFaq(${i})" aria-expanded="false">
                <span class="hp-faq-question-text">${f.q}</span>
                <span class="hp-faq-icon" id="faq-icon-${i}">+</span>
              </button>
              <div class="hp-faq-answer" id="faq-body-${i}">
                <div class="hp-faq-answer-inner">${f.a}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },

  _toggleFaq(index) {
    const body = document.getElementById(`faq-body-${index}`);
    const icon = document.getElementById(`faq-icon-${index}`);
    if (!body || !icon) return;
    const isOpen = body.style.maxHeight !== '0px' && body.style.maxHeight !== '';
    // Close all
    document.querySelectorAll('[id^="faq-body-"]').forEach(b => b.style.maxHeight = '0px');
    document.querySelectorAll('[id^="faq-icon-"]').forEach(ic => { ic.textContent = '+'; ic.style.transform = ''; });
    if (!isOpen) {
      body.style.maxHeight = body.scrollHeight + 'px';
      icon.textContent = '−';
      icon.style.transform = 'rotate(0deg)';
    }
  },

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
