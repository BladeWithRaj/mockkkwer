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
    polytechnic: PolytechnicPage
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

      // Check for in-progress test to resume
      this._tryResumeTest();

      // Start routing
      window.addEventListener('hashchange', () => this.handleRoute());
      this.handleRoute();

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
          </div>
          <div class="mega-footer">
            <a href="#board" class="mega-footer-link">View All Exams →</a>
          </div>
        </div>
      </div>
      <a href="#polytechnic" class="nav-link ${activePage === 'polytechnic' ? 'active' : ''}">Polytechnic</a>
      <a href="#battle"      class="nav-link ${activePage === 'battle'      ? 'active' : ''}">AI Battle</a>
      <a href="#dashboard" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>
    `;

    return `
      <header class="header">
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
    const isDailyActive = pg === 'setup' && this.params?.preset === 'daily-challenge';
    return `
      <nav class="mobile-bottom-nav" aria-label="Navigation">
        <div class="mobile-bottom-nav-inner">
          ${item('home',                                    'Home',        'home',        pg === 'home')}
          ${item('board',                                   'Exams',       'clipboard',   pg === 'board' || pg === 'exam')}
          ${item('setup?preset=daily-challenge&daily=1',   'Daily',       'zap',         isDailyActive)}
          ${item('dashboard',                              'Dashboard',   'barChart',    pg === 'dashboard' || pg === 'leaderboard')}
          ${item('profile',                                 'Profile',     'user',        pg === 'profile')}
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
              <h4>📬 Stay Updated with Daily Mocks</h4>
              <p>Get free daily challenges, exam tips &amp; cut-off alerts on Telegram</p>
            </div>
            <div class="footer-newsletter-form">
              <a href="https://t.me/mock24hr" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;padding:10px 20px;background:var(--primary);color:#fff;border-radius:10px;text-decoration:none;font-size:13.5px;font-weight:600;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.88" onmouseout="this.style.opacity=1">
                <span style="font-size:18px;">✈️</span> Join Telegram Channel
              </a>
            </div>
          </div>
        </div>

        <!-- Main Footer Grid -->
        <div class="footer-top">

          <!-- Brand column -->
          <div class="footer-brand">
            <a href="#home" class="footer-logo">Mock<span>24hr</span></a>
            <p class="footer-tagline">India's most trusted free mock test platform for SSC, Railway, Banking &amp; UPSC. Practice smarter, score higher.</p>
            <div class="footer-social">
              <a href="https://t.me/mock24hr" target="_blank" rel="noopener" class="footer-social-link" title="Telegram" aria-label="Telegram">✈️</a>
              <a href="https://youtube.com/@mock24hr" target="_blank" rel="noopener" class="footer-social-link" title="YouTube" aria-label="YouTube">▶️</a>
              <a href="https://instagram.com/mock24hr" target="_blank" rel="noopener" class="footer-social-link" title="Instagram" aria-label="Instagram">📷</a>
              <a href="https://twitter.com/mock24hr" target="_blank" rel="noopener" class="footer-social-link" title="Twitter/X" aria-label="Twitter">🐦</a>
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
              <li><a href="#battle">AI Battle Mode</a></li>
              <li><a href="#dashboard">Dashboard</a></li>
              <li><a href="#analytics">Analytics</a></li>
              <li><a href="#profile">My Profile</a></li>
            </ul>
          </div>

          <!-- Company column -->
          <div>
            <div class="footer-col-title">Company</div>
            <ul class="footer-col-links">
              <li><a href="about.html">About Us</a></li>
              <li><a href="contact.html">Contact Us</a></li>
              <li><a href="privacy.html">Privacy Policy</a></li>
              <li><a href="terms.html">Terms of Service</a></li>
            </ul>
          </div>

        </div>

        <div class="footer-divider"></div>

        <!-- Bottom bar -->
        <div class="footer-bottom">
          <div class="footer-copyright">
            &copy; ${year} Mock24hr. All rights reserved. Made with ❤️ in India.
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

// Init
document.addEventListener('DOMContentLoaded', () => App.init());
