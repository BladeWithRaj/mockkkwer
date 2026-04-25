// ============================================
// APP — Router & Init (Async, DB-driven)
// ============================================

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

    } catch (err) {
      console.error("App init error:", err);
      appEl.innerHTML = this._renderError("Something went wrong: " + err.message);
      this.questionsLoaded = true;
    }
  },

  showUsernamePrompt() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; padding: 20px;">
        <div style="background: var(--bg-surface); padding: 40px; border-radius: 16px; border: 1px solid var(--border-light); width: 100%; max-width: 400px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
          <div style="font-size: 48px; margin-bottom: 20px;">👋</div>
          <h2 style="margin-bottom: 10px; color: var(--text-primary);">Welcome to MockTestPro</h2>
          <p style="color: var(--text-secondary); margin-bottom: 30px; font-size: 14px;">Enter a username to start practicing immediately. No signup required.</p>
          
          <input type="text" id="username-input" class="input" placeholder="Choose a username (3-20 chars)" maxlength="20" style="margin-bottom: 20px; text-align: center; font-size: 18px; font-weight: bold;">
          
          <button onclick="App.submitUsername()" class="btn btn-primary" style="width: 100%; height: 50px; font-size: 16px;">Start Practicing</button>
        </div>
      </div>
    `;
    
    setTimeout(() => {
      const input = document.getElementById('username-input');
      if (input) {
        input.addEventListener('keypress', (e) => {
           if (e.key === 'Enter') this.submitUsername();
        });
        input.focus();
      }
    }, 100);
  },

  submitUsername() {
    const input = document.getElementById('username-input');
    if (!input) return;
    const val = input.value.trim();
    if (val.length < 3) {
      Helpers.showToast("Username must be at least 3 characters", "error");
      return;
    }
    
    // Generate identity
    Storage.setUsername(val);
    Storage.getUserId(); // This auto-generates the UUID
    
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
    appEl.innerHTML = this._renderHeader(page) + pageModule.render(params);

    if (pageModule.afterRender) {
      requestAnimationFrame(() => pageModule.afterRender());
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
              <a href="#home" class="${activePage === 'home' ? 'active' : ''}">Home</a>
              <a href="#setup" class="${activePage === 'setup' ? 'active' : ''}">New Test</a>
              <a href="#leaderboard" class="${activePage === 'leaderboard' ? 'active' : ''}">Leaderboard</a>
            `}
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

    // Validate that the saved test questions still exist in the question bank
    const bank = window.QUESTION_BANK || [];
    if (bank.length === 0) return;

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
  }
};

// Init
document.addEventListener('DOMContentLoaded', () => App.init());
