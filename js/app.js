// ============================================
// MOCK TEST PLATFORM — App Router & Init
// ============================================

const App = {
  currentPage: null,
  lastResult: null,
  params: {},

  pages: {
    home: HomePage,
    setup: SetupPage,
    test: TestPage,
    result: ResultPage,
    analysis: AnalysisPage
  },

  init() {
    // Handle hash-based routing
    window.addEventListener('hashchange', () => this.handleRoute());

    // Initial route
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
    // Destroy current page
    if (this.currentPage && this.pages[this.currentPage] && this.pages[this.currentPage].destroy) {
      this.pages[this.currentPage].destroy();
    }

    this.currentPage = page;
    this.params = params;

    // Update hash
    if (updateHash) {
      const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('&');
      window.location.hash = paramStr ? `${page}?${paramStr}` : page;
    }

    // Render page
    const pageModule = this.pages[page];
    if (!pageModule) {
      document.getElementById('app').innerHTML = this._render404();
      return;
    }

    // Render header + page content
    const appEl = document.getElementById('app');
    appEl.innerHTML = this._renderHeader(page) + pageModule.render(params);

    // After render hooks
    if (pageModule.afterRender) {
      requestAnimationFrame(() => pageModule.afterRender());
    }

    // Scroll to top
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
