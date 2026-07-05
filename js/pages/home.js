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

          <!-- Features / Why Mock24hr -->
          ${this._renderFeatures()}

          <!-- Testimonials -->
          ${this._renderTestimonials()}

          <!-- FAQ -->
          ${this._renderFAQ()}

          <!-- Stats (logged-in only) -->
          ${isLoggedIn ? this._renderStatsStrip(streak) : ''}

        </div>
      </div>
    `;
  },


  // ── HERO ──
  _renderHero(isLoggedIn, userName) {
    const badge = isLoggedIn
      ? `<div class="hp-hero-badge">Welcome back, ${userName} — continue your preparation</div>`
      : `<div class="hp-hero-badge">AI Study OS &middot; Practice &middot; Analyze &middot; Plan &middot; Win</div>`;

    const ctas = isLoggedIn
      ? `<div class="hp-hero-ctas">
           <button class="hp-hero-btn hp-hero-btn--primary" onclick="App.navigate('setup')">Begin Today's Practice →</button>
           <button class="hp-hero-btn hp-hero-btn--secondary" onclick="App.navigate('setup', {mode:'custom'})">Explore Exams →</button>
         </div>`
      : `<div class="hp-hero-ctas">
           <button class="hp-hero-btn hp-hero-btn--primary" onclick="App.navigate('setup')">Start Your Preparation →</button>
           <button class="hp-hero-btn hp-hero-btn--secondary" onclick="App.navigate('setup')">See How It Works →</button>
         </div>`;

    return `
      <section class="hp-hero">

        <!-- LEFT: Text content -->
        <div class="hp-hero-left">
          ${badge}

          <h1>The smarter way to<br><span class="hp-hero-accent">crack competitive exams.</span></h1>

          <p class="hp-hero-subtitle">Not just mock tests &mdash; a complete system to practice daily, analyze your weaknesses, plan your revision, and track real improvement.</p>

          ${ctas}

          <div class="hp-hero-stats">
            <div class="hp-hero-stat">
              <div class="hp-hero-stat-value">2.5M+</div>
              <div class="hp-hero-stat-label">Students</div>
            </div>
            <div class="hp-hero-stat-divider"></div>
            <div class="hp-hero-stat">
              <div class="hp-hero-stat-value">25M+</div>
              <div class="hp-hero-stat-label">Tests Attempted</div>
            </div>
            <div class="hp-hero-stat-divider"></div>
            <div class="hp-hero-stat">
              <div class="hp-hero-stat-value">98.4%</div>
              <div class="hp-hero-stat-label">Success Rate</div>
            </div>
            <div class="hp-hero-stat-divider"></div>
            <div class="hp-hero-stat">
              <div class="hp-hero-stat-value">Free</div>
              <div class="hp-hero-stat-label">Always</div>
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
    const streakText = streak > 0 ? `${streak}-day streak` : 'Start your streak';
    const dailyTag  = dailyDone ? 'Completed today' : streakText;
    const dailyLabel = dailyDone ? 'Daily Challenge — Done' : 'Daily Challenge';

    return `
      <div class="hp-section">
        <div class="hp-section-header">
          <div class="hp-section-title">What should I do today?</div>
        </div>
        <div class="hp-quick-actions">

          <div class="hp-qa-card qa-daily" onclick="HomePage._startDaily()">
            <div class="hp-qa-icon-wrap">
              <span class="hp-qa-symbol">&#9733;</span>
            </div>
            <div class="hp-qa-body">
              <div class="hp-qa-label">${dailyLabel}</div>
              <div class="hp-qa-sub">15 questions &middot; Adaptive difficulty</div>
            </div>
            <span class="hp-qa-tag">${dailyTag}</span>
          </div>

          <a href="#battle" class="hp-qa-card qa-battle">
            <div class="hp-qa-icon-wrap">
              <span class="hp-qa-symbol">&#9651;</span>
            </div>
            <div class="hp-qa-body">
              <div class="hp-qa-label">AI Battle</div>
              <div class="hp-qa-sub">Compete against AI in real-time</div>
            </div>
            <span class="hp-qa-tag">2.5k active</span>
          </a>

          <div class="hp-qa-card qa-custom" onclick="App.navigate('setup', {mode:'custom'})">
            <div class="hp-qa-icon-wrap">
              <span class="hp-qa-symbol">&#9670;</span>
            </div>
            <div class="hp-qa-body">
              <div class="hp-qa-label">Custom Test</div>
              <div class="hp-qa-sub">Choose subject, topic &amp; difficulty</div>
            </div>
            <span class="hp-qa-tag">Unlimited</span>
          </div>

          <a href="#polytechnic" class="hp-qa-card qa-poly">
            <div class="hp-qa-icon-wrap">
              <span class="hp-qa-symbol">&#9632;</span>
            </div>
            <div class="hp-qa-body">
              <div class="hp-qa-label">BTEUP Papers</div>
              <div class="hp-qa-sub">Previous year papers &amp; PDF export</div>
            </div>
            <span class="hp-qa-tag">Updated 2025</span>
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
          <div class="hp-section-title">Prepare by Exam Category</div>
          <a href="#board" class="hp-section-action">All categories →</a>
        </div>
        <div class="hp-board-grid">
          ${cards}
        </div>
      </div>
    `;
  },


  // ── HOT & TRENDING MOCKS (Horizontal icon-left layout) ──
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
      <div class="hp-section">
        <div class="hp-section-header">
          <div class="hp-section-title">Trending This Week</div>
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


  // ── TESTIMONIALS ──
  _renderTestimonials() {
    const reviews = [
      { name: 'Amit Kumar',    exam: 'SSC CGL 2024',       score: '★★★★★', text: 'Mock24hr ke regular mocks ne meri speed aur accuracy dono improve ki. Final mein 148/200 mile!', avatar: 'A', clr: '#4F46E5' },
      { name: 'Priya Sharma',  exam: 'IBPS PO 2024',       score: '★★★★★', text: 'AI Battle mode mujhe bahut pasand hai — isse competitive feel aata hai. Banking mein select ho gayi!', avatar: 'P', clr: '#10B981' },
      { name: 'Rahul Yadav',   exam: 'RRB NTPC 2024',      score: '★★★★☆', text: 'Analysis section bahut detailed hai — pata chalta hai exact weakness kahan hai. Highly recommend!', avatar: 'R', clr: '#F59E0B' },
      { name: 'Sneha Singh',   exam: 'SBI PO Prelims',     score: '★★★★★', text: 'Daily Challenge feature ne mere study schedule ko disciplined bana diya. Interview tak pahunch gayi!', avatar: 'S', clr: '#EC4899' },
    ];
    return `
      <section style="padding: 56px 0 8px; background:var(--bg-secondary); margin: 48px -16px 0; border-top:1px solid var(--border-color); border-bottom:1px solid var(--border-color);">
        <div style="max-width:1200px; margin:0 auto; padding: 0 16px;">
          <div style="text-align:center; margin-bottom: 36px;">
            <div style="display:inline-block; background:rgba(16,185,129,0.1); color:#10B981; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:5px 14px; border-radius:100px; margin-bottom:12px;">Student Reviews</div>
            <h2 style="font-size:clamp(22px,4vw,30px); font-weight:800; color:var(--text-primary); letter-spacing:-0.02em; margin:0 0 10px;">Toppers Trust <span style="color:#10B981;">Mock24hr</span></h2>
            <p style="font-size:15px; color:var(--text-secondary);">Real reviews from real aspirants who cracked their exams.</p>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:18px;">
            ${reviews.map(r => `
              <div style="background:var(--bg-primary); border:1px solid var(--border-color); border-radius:18px; padding:22px 20px; transition:transform 0.2s;" onmouseover="this.style.transform='translateY(-3px)'" onmouseout="this.style.transform=''">
                <div style="color:#F59E0B; font-size:15px; margin-bottom:12px; letter-spacing:1px;">${r.score}</div>
                <p style="font-size:13.5px; color:var(--text-secondary); line-height:1.65; margin:0 0 16px; font-style:italic;">&ldquo;${r.text}&rdquo;</p>
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="width:36px;height:36px;border-radius:50%;background:${r.clr};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;flex-shrink:0;">${r.avatar}</div>
                  <div>
                    <div style="font-size:13.5px;font-weight:700;color:var(--text-primary);">${r.name}</div>
                    <div style="font-size:11.5px;color:var(--text-muted);">${r.exam}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  },

  // ── FAQ SECTION ──
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
      <section style="padding: 56px 0; max-width: 780px; margin: 0 auto;">
        <div style="text-align:center; margin-bottom:36px; padding: 0 16px;">
          <div style="display:inline-block; background:rgba(245,158,11,0.1); color:#D97706; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:5px 14px; border-radius:100px; margin-bottom:12px;">FAQ</div>
          <h2 style="font-size:clamp(22px,4vw,30px); font-weight:800; color:var(--text-primary); letter-spacing:-0.02em; margin:0 0 10px;">Frequently Asked <span style="color:#D97706;">Questions</span></h2>
          <p style="font-size:15px; color:var(--text-secondary);">Koi sawaal hai? Yahan dekho.</p>
        </div>
        <div style="display:flex; flex-direction:column; gap:10px; padding: 0 16px;" id="hp-faq">
          ${faqs.map((f, i) => `
            <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:14px;overflow:hidden;" id="faq-item-${i}">
              <button onclick="HomePage._toggleFaq(${i})" style="width:100%;text-align:left;padding:18px 20px;background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:12px;" aria-expanded="false">
                <span style="font-size:14px;font-weight:600;color:var(--text-primary);">${f.q}</span>
                <span id="faq-icon-${i}" style="font-size:18px;color:var(--text-muted);transition:transform 0.2s;flex-shrink:0;">+</span>
              </button>
              <div id="faq-body-${i}" style="max-height:0;overflow:hidden;transition:max-height 0.3s ease;">
                <div style="padding:0 20px 18px;font-size:13.5px;color:var(--text-secondary);line-height:1.7;">${f.a}</div>
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
