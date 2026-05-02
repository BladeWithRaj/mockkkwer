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
    setup: SetupPage,
    test: TestPage,
    result: ResultPage,
    analysis: AnalysisPage,
    dashboard: DashboardPage,
    leaderboard: LeaderboardPage,
    analytics: AnalyticsPage
  },

  async init() {
    const appEl = document.getElementById('app');

    // Loading State
    appEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; gap: 20px;">
        <div class="splash-spinner" style="width: 48px; height: 48px; border: 3px solid var(--bg-glass, rgba(255,255,255,0.1)); border-top-color: var(--primary, #6366f1); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="color: var(--text-secondary, #94a3b8); font-size: 16px; font-weight: 500;">Initializing session...</p>
      </div>
    `;

    try {
      // Stabilize Session via Auth module
      if (window.Auth) {
        await window.Auth.init();
      } else if (window.initSession) {
        await window.initSession();
      }

      // No full DB fetch on startup for scalability
      window.QUESTION_BANK = [];
      this.questionsLoaded = true;

      console.log("App ready");

      // Check for in-progress test to resume
      this._tryResumeTest();

      // ── Frictionless Username Prompt ──
      if (!Storage.getUsername()) {
        this.showUsernamePrompt();
        return; // Halt initialization and routing until username is set
      }

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

      // Global error boundaries — catch unhandled errors
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

  showUsernamePrompt() {
    const appEl = document.getElementById('app');
    const avatarOptions = [
      { id: 'boy1', emoji: '👦' }, { id: 'boy2', emoji: '🧑' }, { id: 'boy3', emoji: '👨' },
      { id: 'girl1', emoji: '👧' }, { id: 'girl2', emoji: '👩' }, { id: 'girl3', emoji: '👱‍♀️' },
      { id: 'ninja', emoji: '🥷' }, { id: 'astronaut', emoji: '🧑‍🚀' }, { id: 'robot', emoji: '🤖' },
      { id: 'cat', emoji: '🐱' }, { id: 'dog', emoji: '🐶' }, { id: 'panda', emoji: '🐼' }, { id: 'fox', emoji: '🦊' }
    ];
    
    appEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; padding: 20px;">
        <div style="background: var(--bg-surface); padding: 40px; border-radius: 16px; border: 1px solid var(--border-light); width: 100%; max-width: 440px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
          <div style="font-size: 48px; margin-bottom: 20px;">👋</div>
          <h2 style="margin-bottom: 10px; color: var(--text-primary);">${Lang.t('welcome')}</h2>
          <p style="color: var(--text-secondary); margin-bottom: 24px; font-size: 14px;">${Lang.t('enter_username')}</p>
          
          <input type="text" id="username-input" class="input" placeholder="${Lang.t('username_placeholder')}" maxlength="20" style="margin-bottom: 20px; text-align: center; font-size: 18px; font-weight: bold;">
          
          <!-- Avatar Selection -->
          <p style="color: var(--text-muted); font-size: 12px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Choose Avatar</p>
          <div id="avatar-grid" style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 24px;">
            ${avatarOptions.map(a => `
              <button class="avatar-pick-btn" data-avatar="${a.id}" onclick="App.selectAvatar('${a.id}')"
                style="width: 44px; height: 44px; font-size: 24px; border-radius: 12px; border: 2px solid var(--border-color); background: var(--bg-glass); cursor: pointer; transition: all 0.15s ease; display: flex; align-items: center; justify-content: center;">
                ${a.emoji}
              </button>
            `).join('')}
          </div>
          
          <button onclick="App.submitUsername()" class="btn btn-primary" style="width: 100%; height: 50px; font-size: 16px;">${Lang.t('start_practicing')}</button>
          
          <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
            <button class="theme-toggle-btn" onclick="ThemeManager.toggle()">${ThemeManager.isDark() ? '🌙' : '☀️'}</button>
            <button class="lang-toggle-btn">🌐 ${Lang.isHindi() ? 'EN' : 'हिंदी'}</button>
          </div>
        </div>
      </div>
    `;
    
    // Auto-select first avatar
    this._selectedAvatar = 'boy1';
    setTimeout(() => {
      const firstBtn = document.querySelector('[data-avatar="boy1"]');
      if (firstBtn) {
        firstBtn.style.borderColor = 'var(--primary)';
        firstBtn.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.3)';
        firstBtn.style.transform = 'scale(1.1)';
      }
      const input = document.getElementById('username-input');
      if (input) {
        input.addEventListener('keypress', (e) => {
           if (e.key === 'Enter') this.submitUsername();
        });
        input.focus();
      }
    }, 100);
  },

  _selectedAvatar: 'boy1',

  selectAvatar(avatarId) {
    this._selectedAvatar = avatarId;
    // Update UI
    document.querySelectorAll('.avatar-pick-btn').forEach(btn => {
      btn.style.borderColor = 'var(--border-color)';
      btn.style.boxShadow = 'none';
      btn.style.transform = 'scale(1)';
    });
    const activeBtn = document.querySelector(`[data-avatar="${avatarId}"]`);
    if (activeBtn) {
      activeBtn.style.borderColor = 'var(--primary)';
      activeBtn.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.3)';
      activeBtn.style.transform = 'scale(1.1)';
    }
  },

  submitUsername() {
    const input = document.getElementById('username-input');
    if (!input) return;
    const val = input.value.trim();

    // Length check
    if (val.length < 3) {
      Helpers.showToast("Username must be at least 3 characters", "error");
      return;
    }
    if (val.length > 20) {
      Helpers.showToast("Username must be 20 characters or less", "error");
      return;
    }

    // Special character filter — only alphanumeric, underscore, and Hindi chars allowed
    const usernameRegex = /^[a-zA-Z0-9_\u0900-\u097F]+$/;
    if (!usernameRegex.test(val)) {
      Helpers.showToast("Only letters, numbers, underscore, and Hindi characters allowed", "error");
      return;
    }
    
    // Generate identity
    Storage.setUsername(val);
    Storage.getUserId(); // This auto-generates the UUID

    // Save avatar default
    localStorage.setItem('mocktest_avatar', this._selectedAvatar || 'default');
    
    // Resume routing
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
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
      appEl.innerHTML = this._renderHeader(page) + html;
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
    return `
      <header class="header">
        <div class="header-inner">
          <a href="#home" class="header-logo">
            <div class="logo-icon">📝</div>
            <span>MockTest<span style="color: var(--primary-light);">Pro</span></span>
          </a>
          <nav class="header-nav">
            ${isTest ? '' : `
              <a href="#home" class="${activePage === 'home' ? 'active' : ''}">${Lang.t('nav_home')}</a>
              <a href="#setup" class="${activePage === 'setup' ? 'active' : ''}">${Lang.t('nav_new_test')}</a>
              <a href="#dashboard" class="${activePage === 'dashboard' ? 'active' : ''}">${Lang.t('nav_dashboard')}</a>
              <a href="#leaderboard" class="${activePage === 'leaderboard' ? 'active' : ''}">${Lang.t('nav_leaderboard')}</a>
            `}
            <button class="theme-toggle-btn" onclick="ThemeManager.toggle()" title="${ThemeManager.isDark() ? 'Switch to Light Mode' : 'Switch to Dark Mode'}">
              ${ThemeManager.isDark() ? '🌙' : '☀️'}
            </button>
            <button class="lang-toggle-btn" title="Switch Language">
              🌐 ${Lang.isHindi() ? 'EN' : 'हिंदी'}
            </button>
          </nav>
        </div>
      </header>
    `;
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
