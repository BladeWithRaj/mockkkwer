// ============================================
// APP — Router & Init (Async, DB-driven)
// ============================================

// ── THEME MANAGER ──
const ThemeManager = {
  STORAGE_KEY: 'mocktest_theme',

  init() {
    // Light is default — only switch to dark if explicitly saved
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  },

  toggle() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(this.STORAGE_KEY, 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    }
    // Update toggle button icon
    this.updateIcon();
  },

  isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  },

  updateIcon() {
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach(btn => {
      btn.innerHTML = this.isDark() ? '🌙' : '☀️';
      btn.title = this.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
  }
};

ThemeManager.updateIcon = function() {
  const moonIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
  const sunIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>';
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.innerHTML = this.isDark() ? moonIcon : sunIcon;
    btn.title = this.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode';
  });
};

// Apply theme ASAP (before DOM content loaded)
ThemeManager.init();

const App = {
  currentPage: null,
  lastResult: null,
  lastTestConfig: null,
  lastTestQuestionIds: null,
  params: {},
  questionsLoaded: false,

  pages: {
    home: HomePage,
    board: BoardPage,
    setup: SetupPage,
    test: TestPage,
    result: ResultPage,
    analysis: AnalysisPage,
    leaderboard: LeaderboardPage,  /* kept for backward-compat hash navigation — redirects to dashboard */
    dashboard: DashboardPage,
    analytics: AnalyticsPage,
    profile: ProfilePage,
    battle: BattlePage,
    exam: ExamDetailPage,
    polytechnic: PolytechnicPage,
    aptitude: AptitudePage,
    coach: AICoachPage,    /* Doc 8 — AI Study Command Center */
    pricing: PricingPage,  /* Doc 9 — Subscription Plans */
    dev: ShowcasePage      /* Doc 10 — Component Showcase (dev only, hidden) */
  },


  async init() {
    const appEl = document.getElementById('app');

    // Loading State
    appEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; gap: 20px;">
        <div class="splash-spinner" style="width: 48px; height: 48px; border: 3px solid var(--border-color, #E2E5EA); border-top-color: var(--primary, #2563EB); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="color: var(--text-secondary, #4B5563); font-size: 16px; font-weight: 500;">Loading...</p>
      </div>
    `;

    try {
      // Doc 10 §29C: Check/set schema version for future migrations
      if (typeof Storage !== 'undefined' && Storage.checkSchema) {
        Storage.checkSchema();
      }

      // Check for existing session
      if (window.Auth) {
        await window.Auth.init();
      }

      // If no session — show username modal and wait
      // if (!Auth.isAuthenticated()) {
      //   const user = await Auth.showUsernameModal();
      //   console.log("🎉 Welcome,", user.username);
      // }

      // No full DB fetch on startup for scalability
      window.QUESTION_BANK = [];
      this.questionsLoaded = true;

      // Load exam configs from API (replaces hardcoded presets)
      // Note: ExamPresets is declared with `const`, so it won't exist on `window`.
      // Use `typeof` to safely check for its existence.
      if (typeof ExamPresets !== 'undefined' && ExamPresets.load) {
        await ExamPresets.load();
      }

      console.log("App ready — user:", Auth.getUser()?.name);

      // Gamification: load profile from server (v2 — no client-side login bonus)
      if (window.Gamification && Gamification.loadProfileFromServer) {
        Gamification.loadProfileFromServer();
      }

      // Mount command palette overlay (must be before first render)
      if (typeof CommandPalette !== 'undefined') {
        CommandPalette.mount();
      }

      // Initialize keyboard shortcuts
      if (typeof Shortcuts !== 'undefined') {
        Shortcuts.init();
      }

      // Doc 9: Initialize Mission Engine (subscribes to EventBus)
      if (typeof MissionEngine !== 'undefined' && MissionEngine.init) {
        MissionEngine.init();
      }

      // Doc 11: Initialize Sync Service (localStorage ↔ Supabase bridge)
      if (typeof SyncService !== 'undefined' && SyncService.init) {
        SyncService.init();
        // Non-blocking: sync data with cloud after page renders
        setTimeout(() => SyncService.syncAll().catch(() => {}), 2000);
      }

      // Check for in-progress test to resume
      this._tryResumeTest();

      // Start routing
      window.addEventListener('hashchange', () => this.handleRoute());
      this.handleRoute();

      // Doc 5 §3 — Navbar scroll-shrink behavior
      window.addEventListener('scroll', () => {
        const header = document.querySelector('.header');
        if (header) {
          header.classList.toggle('header--scrolled', window.scrollY > 80);
        }
      }, { passive: true });

      // Protect against accidental navigation during test
      window.addEventListener('beforeunload', (e) => {
        if (TestEngine.state && TestEngine.state.isActive && !TestEngine.state.isSubmitted) {
          e.preventDefault();
          e.returnValue = 'You have an active test. Are you sure you want to leave?';
          return e.returnValue;
        }
      });

      // Global error boundaries
      window.addEventListener('error', (event) => {
        console.error('[GLOBAL ERROR]', event.error);
        if (Helpers && Helpers.showToast) {
          Helpers.showToast('Unexpected error: ' + (event.error?.message || 'Unknown'), 'error');
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('[UNHANDLED PROMISE]', event.reason);
        if (Helpers && Helpers.showToast) {
          Helpers.showToast('Async error: ' + (event.reason?.message || 'Promise rejected'), 'error');
        }
      });

    } catch (err) {
      console.error("App init error:", err);
      appEl.innerHTML = this._renderError("Something went wrong: " + err.message);
      this.questionsLoaded = true;
    }
  },


  handleRoute() {
    const hash = window.location.hash.slice(1) || 'home';
    const [page, paramStr] = hash.split('?');
    const params = {};
    if (paramStr) {
      paramStr.split('&').forEach(p => {
        const [k, v] = p.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    this.navigate(page, params, false);
  },

  // Re-render current page without changing hash (used for in-page tab switches)
  renderPage(page) {
    const target = page || this.currentPage;
    const pageModule = this.pages[target];
    if (!pageModule) return;
    const appEl = document.getElementById('app');
    try {
      const isTestPage = target === 'test';
      const html = pageModule.render(this.params);
      const footer = isTestPage ? '' : this._renderFooter();
      appEl.innerHTML = isTestPage ? html : (this._renderHeader(target) + html + footer);
      if (pageModule.afterRender) {
        requestAnimationFrame(() => { try { pageModule.afterRender(); } catch(e) {} });
      }
    } catch(e) {
      console.warn('[renderPage] error:', e);
    }
  },


  navigate(page, params = {}, updateHash = true) {
    // Leaderboard is removed — redirect to dashboard
    if (page === 'leaderboard') { page = 'dashboard'; }

    if (this.currentPage && this.pages[this.currentPage] && this.pages[this.currentPage].destroy) {
      this.pages[this.currentPage].destroy();
    }

    this.currentPage = page;
    this.params = params;

    if (updateHash) {
      const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
      window.location.hash = paramStr ? `${page}?${paramStr}` : page;
    }

    const pageModule = this.pages[page];
    if (!pageModule) {
      document.getElementById('app').innerHTML = this._render404();
      return;
    }

    const appEl = document.getElementById('app');

    // Error boundary: wrap render in try-catch
    try {
      const html = pageModule.render(params);
      // Board-specific renderer: skip SPA header — renderers have their own system bar
      const isBoardMode = page === 'test' && typeof RendererRouter !== 'undefined' && RendererRouter.shouldUseBoardRenderer();
      const isLegacyCBT = page === 'test' && typeof CBTRenderer !== 'undefined' && CBTRenderer.shouldUseCBT();
      const isTestPage = page === 'test';
      const footer = (isBoardMode || isLegacyCBT || isTestPage) ? '' : this._renderFooter();
      appEl.innerHTML = (isBoardMode || isLegacyCBT || isTestPage) ? html : (this._renderHeader(page) + html + footer);
    } catch (renderErr) {
      console.error(`[ERROR BOUNDARY] Page "${page}" render crashed:`, renderErr);
      appEl.innerHTML = this._renderHeader(page) + this._renderCrash(page, renderErr);
      return;
    }

    // Error boundary: wrap afterRender in try-catch
    if (pageModule.afterRender) {
      requestAnimationFrame(() => {
        try {
          pageModule.afterRender();
        } catch (afterErr) {
          console.error(`[ERROR BOUNDARY] Page "${page}" afterRender crashed:`, afterErr);
          Helpers.showToast('Page loaded with errors: ' + afterErr.message, 'error');
        }
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  _renderHeader(activePage) {
    const isTest = activePage === 'test';
    const user = Auth.getUser();
    const userName = user?.name || user?.username || Storage.getUsername() || 'User';

    const moonIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
    const sunIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>';
    const caretDown = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
    const searchIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    const userPhoto = window.FirebaseAuth && FirebaseAuth.isLoggedIn() && FirebaseAuth.getUser()?.photoURL;
    const userEmail = window.FirebaseAuth && FirebaseAuth.isLoggedIn() && FirebaseAuth.getUser()?.email;
    const isLoggedIn = window.FirebaseAuth && FirebaseAuth.isLoggedIn();

    const navLinks = isTest ? '' : `
      <!-- Exams mega-menu -->
      <div class="nav-item" id="nav-exams-item">
        <button class="nav-link" onclick="App._toggleMegaMenu()" aria-haspopup="true" aria-expanded="false">
          Exams <span class="nav-link-caret">${caretDown}</span>
        </button>
        <div class="mega-menu" id="nav-mega-menu" role="menu">
          <div class="mega-menu-grid">
            <div>
              <div class="mega-col-title">Central Govt</div>
              <div class="mega-col-items">
                <a href="#exam?id=ssc-cgl"  class="mega-item">SSC CGL</a>
                <a href="#exam?id=ssc-chsl" class="mega-item">SSC CHSL</a>
                <a href="#board?id=SSC"     class="mega-item">SSC MTS</a>
                <a href="#board?id=SSC"     class="mega-item">SSC GD</a>
              </div>
              <div class="mega-col-title" style="margin-top:12px">Railways</div>
              <div class="mega-col-items">
                <a href="#exam?id=rrb-ntpc" class="mega-item">RRB NTPC</a>
                <a href="#board?id=Railway" class="mega-item">Group D</a>
                <a href="#board?id=Railway" class="mega-item">ALP</a>
              </div>
            </div>
            <div>
              <div class="mega-col-title">Banking</div>
              <div class="mega-col-items">
                <a href="#exam?id=ibps-po"  class="mega-item">IBPS PO</a>
                <a href="#board?id=Banking" class="mega-item">IBPS Clerk</a>
                <a href="#exam?id=sbi-po"   class="mega-item">SBI PO</a>
                <a href="#board?id=Banking" class="mega-item">SBI Clerk</a>
                <a href="#board?id=Banking" class="mega-item">RBI Grade B</a>
              </div>
              <div class="mega-col-title" style="margin-top:12px">Defence</div>
              <div class="mega-col-items">
                <a href="#board?id=Defence" class="mega-item">NDA</a>
                <a href="#board?id=Defence" class="mega-item">CDS</a>
                <a href="#board?id=Defence" class="mega-item">AFCAT</a>
              </div>
            </div>
            <div>
              <div class="mega-col-title">State Exams</div>
              <div class="mega-col-items">
                <a href="#board?id=State" class="mega-item">UP PCS</a>
                <a href="#board?id=State" class="mega-item">BPSC</a>
                <a href="#board?id=State" class="mega-item">RPSC</a>
                <a href="#board?id=State" class="mega-item">MPPSC</a>
              </div>
              <div class="mega-col-title" style="margin-top:12px">Other</div>
              <div class="mega-col-items">
                <a href="#board?id=Teaching" class="mega-item">CTET</a>
                <a href="#board?id=Police"   class="mega-item">Police</a>
                <a href="#exam?id=upsc-gs1"  class="mega-item">UPSC Prelims</a>
              </div>
            </div>
            <div>
              <div class="mega-col-title">Polytechnic</div>
              <div class="mega-col-items">
                <a href="#polytechnic" class="mega-item">BTEUP Generator</a>
                <a href="#polytechnic" class="mega-item">Browse Papers</a>
              </div>
              <div class="mega-col-title" style="margin-top:12px">Quick Access</div>
              <div class="mega-col-items">
                <a href="#battle"      class="mega-item">AI Battle Mode</a>
                <a href="#setup"       class="mega-item">Custom Test</a>
              </div>
            </div>
          </div>
          <div class="mega-footer">
            <a href="#board" class="mega-footer-link">View All Exams &rarr;</a>
          </div>
        </div>
      </div>
      <a href="#aptitude"    class="nav-link ${activePage === 'aptitude' ? 'active' : ''}">Aptitude Qs</a>
      <a href="#polytechnic" class="nav-link ${activePage === 'polytechnic' ? 'active' : ''}">Paper Generator</a>
      <a href="#coach"       class="nav-link nav-link--ai ${activePage === 'coach' ? 'active' : ''}" title="AI Study Coach — personalized insights">AI Coach</a>
      <a href="#dashboard"   class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>
    `;

    return `

      <header class="header header--glass">
        <div class="header-inner">
          <a href="#home" class="header-logo">
            <span class="brand-text" style="font-family: var(--font-display); font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: var(--brand-primary);">Mock<span style="color: var(--text-primary);">24hr</span></span>
          </a>

          <nav class="header-nav" role="navigation" aria-label="Primary">
            ${navLinks}
          </nav>

          <div class="header-actions">
            <!-- Search button -->
            ${!isTest ? `
            <button class="header-search-btn" onclick="CommandPalette?.open?.()" aria-label="Search" title="Search (/)">
              ${searchIcon}
              <span class="header-search-text" style="color:var(--text-muted);font-size:var(--text-sm)">Search...</span>
              <span class="header-search-kbd">/</span>
            </button>
            ` : ''}

            <button class="theme-toggle-btn" onclick="ThemeManager.toggle()" title="${ThemeManager.isDark() ? 'Light Mode' : 'Dark Mode'}" aria-label="Toggle theme">
              ${ThemeManager.isDark() ? moonIcon : sunIcon}
            </button>

            ${isLoggedIn ? '' : `
            <button class="nav-login-btn" onclick="FirebaseAuth.signInWithGoogle()" title="Sign in to save progress">
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login
            </button>
            `}

            <div class="header-user-menu">
              <button class="header-user-btn" onclick="App._toggleUserMenu()" title="${userName}" aria-label="User menu">
                ${userPhoto
                  ? `<img src="${FirebaseAuth.getUser().photoURL}" alt="" class="header-avatar" style="width:30px;height:30px;object-fit:cover;" onerror="this.outerHTML='<span class=header-avatar>${userName.charAt(0).toUpperCase()}</span>'" />`
                  : `<span class="header-avatar">${userName.charAt(0).toUpperCase()}</span>`
                }
              </button>
              <div class="header-user-dropdown" id="user-dropdown">
                <div class="dropdown-user-info">
                  ${userPhoto
                    ? `<img src="${FirebaseAuth.getUser().photoURL}" alt="" class="dropdown-avatar" style="width:34px;height:34px;object-fit:cover;" />`
                    : `<span class="dropdown-avatar">${userName.charAt(0).toUpperCase()}</span>`
                  }
                  <div>
                    <div class="dropdown-name">${userName}</div>
                    ${userEmail ? `<div class="dropdown-email">${userEmail}</div>` : ''}
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" onclick="App.navigate('dashboard')">Dashboard</button>
                <button class="dropdown-item" onclick="App.navigate('profile')">Profile</button>
                <button class="dropdown-item" onclick="App.navigate('analytics')">Analytics</button>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item dropdown-signout" onclick="Auth.signOut()">Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      </header>
      ${isTest ? '' : this._renderBreadcrumb(activePage)}
      ${isTest ? '' : this._renderMobileBottomNav(activePage)}
    `;
  },

  _renderBreadcrumb(activePage) {
    if (['home','battle','dashboard','profile'].includes(activePage)) return '';
    if (typeof Breadcrumb === 'undefined') return '';
    return Breadcrumb.render(activePage, this.params || {});
  },

  _toggleMegaMenu() {
    const item = document.getElementById('nav-exams-item');
    const menu = document.getElementById('nav-mega-menu');
    const isOpen = item?.classList.contains('open');
    // Close all other dropdowns first
    document.querySelectorAll('.nav-item.open').forEach(el => el.classList.remove('open'));
    document.getElementById('user-dropdown')?.classList.remove('open');
    if (!isOpen && item && menu) {
      item.classList.add('open');
      // Auto-close on outside click
      setTimeout(() => {
        const outside = (e) => {
          if (!item.contains(e.target)) {
            item.classList.remove('open');
            document.removeEventListener('click', outside);
          }
        };
        document.addEventListener('click', outside);
      }, 10);
    }
  },

  _renderMobileBottomNav(activePage) {
    const item = (page, label, icon, active) => `
      <a href="#${page}" class="mobile-nav-item ${active ? 'active' : ''}" aria-label="${label}">
        ${Icons.get(icon, 20)}
        ${active ? `<span>${label}</span>` : ''}
      </a>
    `;
    const pg = activePage || '';
    return `
      <nav class="mobile-bottom-nav" aria-label="Navigation">
        <div class="mobile-bottom-nav-inner">
          ${item('home',        'Home',       'home',     pg === 'home')}
          ${item('board',       'Exams',      'clipboard', pg === 'board' || pg === 'exam')}
          ${item('dashboard',   'AI Study',   'zap',      pg === 'analytics' || pg === 'battle')}
          ${item('dashboard',   'Dashboard',  'barChart', pg === 'dashboard' || pg === 'leaderboard')}
          ${item('profile',     'Profile',    'user',     pg === 'profile')}
        </div>
      </nav>
    `;
  },

  _toggleUserMenu() {
    const dd = document.getElementById('user-dropdown');
    if (dd) dd.classList.toggle('open');
    // Close rewards if open
    document.getElementById('rewards-dropdown')?.classList.remove('open');
    if (dd?.classList.contains('open')) {
      setTimeout(() => {
        const close = (e) => {
          if (!e.target.closest('.header-user-menu')) {
            dd.classList.remove('open');
            document.removeEventListener('click', close);
          }
        };
        document.addEventListener('click', close);
      }, 10);
    }
  },

  _renderFooter() {
    const year = new Date().getFullYear();
    return `
      <footer class="site-footer" role="contentinfo">

        <!-- Newsletter Strip -->
        <div class="footer-newsletter">
          <div class="footer-newsletter-inner">
            <div class="footer-newsletter-text">
              <h4>Stay Updated with Daily Mocks</h4>
              <p>Get free daily challenges, exam tips &amp; cut-off alerts on Telegram</p>
            </div>
            <div class="footer-newsletter-form">
              <a href="https://t.me/mock24hr" target="_blank" rel="noopener" class="footer-newsletter-btn">
                Join Telegram Channel
              </a>
            </div>
          </div>
        </div>

        <!-- Main Footer Grid (Doc 5 §16 — 5 columns) -->
        <div class="footer-top">

          <!-- Brand column -->
          <div class="footer-brand">
            <a href="#home" class="footer-logo">Mock<span>24hr</span></a>
            <p class="footer-tagline">India's most trusted free mock test platform for SSC, Railway, Banking &amp; UPSC. Practice smarter, score higher.</p>
            <div class="footer-social">
              <a href="https://t.me/mock24hr" target="_blank" rel="noopener" class="footer-social-link" title="Telegram" aria-label="Telegram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.66-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.44 3.8-1.58 4.59-1.86 5.1-1.87.11 0 .37.03.54.17.14.12.18.28.2.47-.01.06.01.24 0 .37z"/></svg>
              </a>
              <a href="https://youtube.com/@mock24hr" target="_blank" rel="noopener" class="footer-social-link" title="YouTube" aria-label="YouTube">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              </a>
              <a href="https://instagram.com/mock24hr" target="_blank" rel="noopener" class="footer-social-link" title="Instagram" aria-label="Instagram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="https://twitter.com/mock24hr" target="_blank" rel="noopener" class="footer-social-link" title="Twitter/X" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          <!-- Exams column -->
          <div>
            <div class="footer-col-title">Exams</div>
            <ul class="footer-col-links">
              <li><a href="#board?id=SSC">SSC (CGL, CHSL, GD)</a></li>
              <li><a href="#board?id=Railway">Railway (NTPC, Group D)</a></li>
              <li><a href="#board?id=Banking">Banking (IBPS, SBI)</a></li>
              <li><a href="#board?id=UPSC">UPSC (Prelims, EPFO)</a></li>
              <li><a href="#polytechnic">Polytechnic (BTEUP)</a></li>
            </ul>
          </div>

          <!-- Features column -->
          <div>
            <div class="footer-col-title">Features</div>
            <ul class="footer-col-links">
              <li><a href="#setup?preset=daily-challenge&daily=1">Daily Challenge</a></li>
              <li><a href="#coach">AI Coach</a></li>
              <li><a href="#battle">AI Battle Mode</a></li>
              <li><a href="#dashboard">Dashboard</a></li>
              <li><a href="#analytics">Analytics</a></li>
              <li><a href="#pricing">Plans & Pricing</a></li>
              <li><a href="#profile">My Profile</a></li>
            </ul>
          </div>

          <!-- Resources column (Doc 5 §16 — new) -->
          <div>
            <div class="footer-col-title">Resources</div>
            <ul class="footer-col-links">
              <li><a href="#board">Exam Syllabus</a></li>
              <li><a href="#board">Previous Year Papers</a></li>
              <li><a href="#board">Current Affairs</a></li>
              <li><a href="#board">Exam Calendar</a></li>
              <li><a href="#polytechnic">BTEUP Papers</a></li>
            </ul>
          </div>

          <!-- Company column -->
          <div>
            <div class="footer-col-title">Support</div>
            <ul class="footer-col-links">
              <li><a href="about.html">About Us</a></li>
              <li><a href="contact.html">Contact Us</a></li>
              <li><a href="privacy.html">Privacy Policy</a></li>
              <li><a href="terms.html">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        <div class="footer-divider"></div>

        <!-- Bottom bar (Doc 5 §16 — version + last updated) -->
        <div class="footer-bottom">
          <div class="footer-copyright">
            &copy; ${year} Mock24hr. All rights reserved. Made with ❤️ in India.
          </div>
          <div class="footer-meta" style="font-size:11px; color:var(--text-muted);">
            v2.0.0 &middot; Last updated July 2026
          </div>
          <ul class="footer-bottom-links">
            <li><a href="privacy.html">Privacy Policy</a></li>
            <li><a href="terms.html">Terms</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>

      </footer>
    `;
  },

  _renderError(message) {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; gap: 16px; padding: 24px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <h2 style="color: var(--text-primary); font-size: 20px; font-weight: 600; margin: 0;">Failed to Load Questions</h2>
        <p style="color: var(--text-secondary); font-size: 14px; text-align: center; max-width: 400px; margin: 0;">${message}</p>
        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 12px;">
          Retry
        </button>
      </div>
    `;
  },

  _render404() {
    return `
      ${this._renderHeader('')}
      <div class="setup-page text-center" style="padding-top: var(--space-16);">
        <div class="empty-state">
          <div class="empty-state-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
          <div class="empty-state-title">Page Not Found</div>
          <p style="color: var(--text-muted); margin-bottom: var(--space-6);">This page does not exist.</p>
          <button class="btn btn-primary" onclick="App.navigate('home')">Back to Home</button>
        </div>
      </div>
    `;
  },

  /**
   * Try to resume an in-progress test from localStorage
   */
  _tryResumeTest() {
    const savedTest = Storage.getCurrentTest();
    if (!savedTest || savedTest.isSubmitted || !savedTest.isActive) return;

    // Questions are stored inside the saved test state — no QUESTION_BANK needed
    if (!savedTest.questions || savedTest.questions.length === 0) return;

    // Recalculate timeRemaining based on elapsed time
    const elapsed = Math.round((Date.now() - savedTest.startTime) / 1000);
    if (savedTest.totalTime < 99999) {
      savedTest.timeRemaining = Math.max(0, savedTest.totalTime - elapsed);
      if (savedTest.timeRemaining <= 0) {
        // Test has timed out while away — auto submit
        Storage.clearCurrentTest();
        return;
      }
    }

    // Reset questionStartTime to now (to avoid wrong time tracking)
    savedTest.questionStartTime = Date.now();

    // Restore engine state
    TestEngine.state = savedTest;

    // Navigate to test page
    console.log('Resuming in-progress test:', savedTest.questions.length, 'questions');
    Helpers.showToast('Resuming your previous test...', 'info');
    window.location.hash = 'test';
  },

  _renderCrash(page, error) {
    return `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 60vh; padding: var(--space-8);">
        <div class="card" style="max-width: 500px; text-align: center; padding: var(--space-8);">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" style="margin-bottom:var(--space-4)"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <h2 style="color: var(--danger); margin-bottom: var(--space-2);">Page Error</h2>
          <p style="color: var(--text-muted); margin-bottom: var(--space-4);">
            The "${page}" page encountered an error.
          </p>
          <details style="text-align: left; background: var(--bg-input); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-6); font-size: var(--text-sm);">
            <summary style="cursor: pointer; color: var(--text-secondary); margin-bottom: var(--space-2);">Error Details</summary>
            <pre style="color: var(--danger); white-space: pre-wrap; word-break: break-all; margin: 0;">${error.message}\n\n${error.stack || ''}</pre>
          </details>
          <div style="display: flex; gap: var(--space-3); justify-content: center;">
            <button class="btn btn-primary" onclick="App.navigate('home')">Go Home</button>
            <button class="btn btn-secondary" onclick="location.reload()">Reload</button>
          </div>
        </div>
      </div>
    `;
  }
};

window.App = App;

// Init
document.addEventListener('DOMContentLoaded', () => App.init());
