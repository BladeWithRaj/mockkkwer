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
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  },

  toggle() {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem(this.STORAGE_KEY, 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem(this.STORAGE_KEY, 'light');
    }
    // Update toggle button icon
    this.updateIcon();
  },

  isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  },

  updateIcon() {
    const btns = document.querySelectorAll('.theme-toggle-btn');
    btns.forEach(btn => {
      btn.innerHTML = this.isDark() ? '🌙' : '☀️';
      btn.title = this.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    });
  }
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
    dashboard: DashboardPage,
    leaderboard: LeaderboardPage,
    analytics: AnalyticsPage,
    profile: ProfilePage,
    battle: BattlePage,
    exam: ExamDetailPage
  },

  async init() {
    const appEl = document.getElementById('app');

    // Loading State
    appEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; gap: 20px;">
        <div class="splash-spinner" style="width: 48px; height: 48px; border: 3px solid var(--bg-glass, rgba(255,255,255,0.1)); border-top-color: var(--primary, #6366f1); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="color: var(--text-secondary, #94a3b8); font-size: 16px; font-weight: 500;">Loading...</p>
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
      appEl.innerHTML = (isBoardMode || isLegacyCBT) ? html : (this._renderHeader(page) + html);
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
    const coins = window.Gamification ? Gamification.getCoins() : 0;
    const streak = window.DailySystem ? DailySystem.getStreak() : { current: 0 };

    return `
      <header class="header">
        <div class="header-inner">
          <a href="#home" class="header-logo">
            <div class="logo-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <span class="brand-text">Mock<span class="brand-accent">24hr</span></span>
          </a>

          <nav class="header-nav">
            ${isTest ? '' : `
              <a href="#home" class="nav-link ${activePage === 'home' ? 'active' : ''}">Home</a>
              <a href="#setup" class="nav-link ${activePage === 'setup' ? 'active' : ''}">Practice</a>
              <a href="#dashboard" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>
              <a href="#leaderboard" class="nav-link ${activePage === 'leaderboard' ? 'active' : ''}">Leaderboard</a>
            `}
          </nav>

          <div class="header-actions">
            ${isTest ? '' : `
            <!-- Rewards Widget -->
            <div class="rewards-widget" id="rewards-widget">
              <button class="rewards-trigger" onclick="App._toggleRewards()">
                <span class="rw-streak ${streak.current > 0 ? 'active' : ''}">🔥 ${streak.current}</span>
                <span class="rw-sep"></span>
                <span class="rw-coins">💰 ${coins}</span>
              </button>
              <div class="rewards-dropdown" id="rewards-dropdown">
                <div class="rw-drop-item">
                  <span class="rw-drop-icon">🔥</span>
                  <div>
                    <div class="rw-drop-label">Streak</div>
                    <div class="rw-drop-value">${streak.current} days</div>
                  </div>
                </div>
                <div class="rw-drop-item">
                  <span class="rw-drop-icon">💰</span>
                  <div>
                    <div class="rw-drop-label">Coins</div>
                    <div class="rw-drop-value">${coins}</div>
                  </div>
                </div>
                <div class="rw-drop-divider"></div>
                <a href="#profile" class="rw-drop-link">View Rewards →</a>
              </div>
            </div>
            `}

            <button class="theme-toggle-btn" onclick="ThemeManager.toggle()" title="${ThemeManager.isDark() ? 'Light Mode' : 'Dark Mode'}">
              ${ThemeManager.isDark() ? '🌙' : '☀️'}
            </button>

            <div class="header-user-menu">
              <button class="header-user-btn" onclick="App._toggleUserMenu()" title="${userName}">
                <span class="header-avatar">${userName.charAt(0).toUpperCase()}</span>
              </button>
              <div class="header-user-dropdown" id="user-dropdown">
                <div class="dropdown-user-info">
                  <span class="dropdown-avatar">${userName.charAt(0).toUpperCase()}</span>
                  <div>
                    <div class="dropdown-name">${userName}</div>
                  </div>
                </div>
                <div class="dropdown-divider"></div>
                <button class="dropdown-item" onclick="App.navigate('profile')">Profile & Rewards</button>
                <button class="dropdown-item" onclick="App.navigate('dashboard')">My Dashboard</button>
                <button class="dropdown-item dropdown-signout" onclick="Auth.signOut()">Sign Out</button>
              </div>
            </div>
          </div>
        </div>
      </header>
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

  _toggleRewards() {
    const dd = document.getElementById('rewards-dropdown');
    if (dd) dd.classList.toggle('open');
    // Close user menu if open
    document.getElementById('user-dropdown')?.classList.remove('open');
    if (dd?.classList.contains('open')) {
      setTimeout(() => {
        const close = (e) => {
          if (!e.target.closest('.rewards-widget')) {
            dd.classList.remove('open');
            document.removeEventListener('click', close);
          }
        };
        document.addEventListener('click', close);
      }, 10);
    }
  },

  _renderError(message) {
    return `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; gap: 16px; padding: 24px;">
        <div style="font-size: 64px;">⚠️</div>
        <h2 style="color: var(--text-primary, #f1f5f9); font-size: 20px; font-weight: 600; margin: 0;">Failed to Load Questions</h2>
        <p style="color: var(--text-secondary, #94a3b8); font-size: 14px; text-align: center; max-width: 400px; margin: 0;">${message}</p>
        <button onclick="location.reload()" style="margin-top: 12px; padding: 10px 24px; background: var(--primary, #6366f1); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
          🔄 Retry
        </button>
      </div>
    `;
  },

  _render404() {
    return `
      ${this._renderHeader('')}
      <div class="setup-page text-center" style="padding-top: var(--space-16);">
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">Page Not Found</div>
          <p style="color: var(--text-muted); margin-bottom: var(--space-6);">The page you're looking for doesn't exist</p>
          <button class="btn btn-primary" onclick="App.navigate('home')">Go Home</button>
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
    Helpers.showToast('📝 Resuming your previous test...', 'info');
    window.location.hash = 'test';
  },

  _renderCrash(page, error) {
    return `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 60vh; padding: var(--space-8);">
        <div class="card" style="max-width: 500px; text-align: center; padding: var(--space-8);">
          <div style="font-size: 48px; margin-bottom: var(--space-4);">💥</div>
          <h2 style="color: var(--danger); margin-bottom: var(--space-2);">Page Crashed</h2>
          <p style="color: var(--text-muted); margin-bottom: var(--space-4);">
            The "${page}" page encountered an error and couldn't render.
          </p>
          <details style="text-align: left; background: var(--bg-glass); padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-6); font-size: var(--text-sm);">
            <summary style="cursor: pointer; color: var(--text-secondary); margin-bottom: var(--space-2);">Error Details</summary>
            <pre style="color: var(--danger-light); white-space: pre-wrap; word-break: break-all; margin: 0;">${error.message}\n\n${error.stack || ''}</pre>
          </details>
          <div style="display: flex; gap: var(--space-3); justify-content: center;">
            <button class="btn btn-primary" onclick="App.navigate('home')">🏠 Go Home</button>
            <button class="btn btn-secondary" onclick="location.reload()">🔄 Reload</button>
          </div>
        </div>
      </div>
    `;
  }
};

// Init
document.addEventListener('DOMContentLoaded', () => App.init());
