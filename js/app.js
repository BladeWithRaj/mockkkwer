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
    analysis: AnalysisPage
  },

  async init() {
    const appEl = document.getElementById('app');

    // Loading State
    appEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80vh; gap: 20px;">
        <div class="splash-spinner" style="width: 48px; height: 48px; border: 3px solid var(--bg-glass, rgba(255,255,255,0.1)); border-top-color: var(--primary, #6366f1); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
        <p style="color: var(--text-secondary, #94a3b8); font-size: 16px; font-weight: 500;">Loading questions...</p>
      </div>
    `;

    try {
      // Fetch from DB
      const data = await window.fetchQuestions();

      if (!data || data.length === 0) {
        appEl.innerHTML = this._renderError("No questions found in database. Add questions via Admin panel.");
        this.questionsLoaded = true;
        return;
      }

      // Map DB → UI format
      const questions = window.mapDBToUI(data);
      window.QUESTION_BANK = questions;
      this.questionsLoaded = true;

      console.log("App ready:", questions.length, "questions loaded");

      // Start routing
      window.addEventListener('hashchange', () => this.handleRoute());
      this.handleRoute();

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
              <a href="admin.html" target="_blank" class="">Admin</a>
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
  }
};

// Init
document.addEventListener('DOMContentLoaded', () => App.init());
