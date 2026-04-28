// ============================================
// TEST PAGE — Full UX Upgrade
// Progress bar, % timer, slide animation,
// mobile bottom sheet, clean question states
// ============================================

const TestPage = {
  timerInterval: null,
  _isProcessing: false,
  _lastWarningShown: false,

  render() {
    if (!TestEngine.state) {
      return `
        <div class="setup-page page-enter text-center" style="padding-top: var(--space-16);">
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-title">${Lang.t('test_no_active')}</div>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">${Lang.t('test_no_active_desc')}</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">${Lang.t('test_go_setup')}</button>
          </div>
        </div>
      `;
    }

    const current = TestEngine.getCurrentQuestion();
    const navStatus = TestEngine.getNavStatus();
    const noTimer = TestEngine.state.totalTime >= 99999;
    const progressPercent = ((current.index + 1) / current.total) * 100;
    const answeredCount = Object.keys(TestEngine.state.answers).length;

    // Progress bar color based on completion
    let progressClass = '';
    if (progressPercent >= 80) progressClass = 'intense';
    else if (progressPercent >= 50) progressClass = 'active';

    return `
      <div class="test-page">
        <!-- Progress Bar -->
        <div class="test-progress-wrap">
          <div class="test-progress-bar ${progressClass}" style="width: ${progressPercent}%" id="test-progress-bar"></div>
        </div>

        <!-- Top Bar -->
        <div class="test-topbar">
          <div class="test-info">
            <span class="test-info-item">
              Q <strong>${current.index + 1}/${current.total}</strong>
            </span>
            <span class="test-info-item answered-badge">
              ✅ ${answeredCount}
            </span>
            <span class="chip ${Helpers.getDifficultyClass(current.question.difficulty)}">
              ${current.question.difficulty}
            </span>
            <span class="chip chip-primary">${current.question.subject}</span>
          </div>
          ${!noTimer ? `
            <div class="timer-display" id="timer-display">
              <span class="timer-icon">⏱️</span>
              <span id="timer-text">${Helpers.formatTime(TestEngine.state.timeRemaining)}</span>
            </div>
          ` : ''}
          <button class="btn btn-danger btn-sm" onclick="TestPage.confirmSubmit()" id="submit-test-btn">
            ${Lang.t('test_submit_btn')}
          </button>
        </div>

        <!-- Test Body -->
        <div class="test-body">
          <!-- Question Area -->
          <div class="question-area" id="question-area">
            ${this._renderQuestion(current)}
          </div>

          <!-- Nav Panel (desktop) -->
          <div class="question-nav-panel" id="nav-panel-desktop">
            <div class="nav-panel-card">
              <div class="nav-panel-title">${Lang.t('test_questions_nav')}</div>
              <div class="nav-grid" id="nav-grid">
                ${navStatus.map((ns, i) => `
                  <button class="nav-btn ${ns.current ? 'current' : ''} ${ns.answered ? 'answered' : ''} ${ns.review ? 'review' : ''}"
                          onclick="TestPage.goTo(${i})" id="nav-btn-${i}">${i + 1}</button>
                `).join('')}
              </div>
              <div class="nav-legend">
                <span class="legend-item"><span class="legend-dot current"></span> ${Lang.t('test_legend_current')}</span>
                <span class="legend-item"><span class="legend-dot answered"></span> ${Lang.t('test_legend_answered')}</span>
                <span class="legend-item"><span class="legend-dot review"></span> ${Lang.t('test_legend_review')}</span>
                <span class="legend-item"><span class="legend-dot unanswered"></span> ${Lang.t('test_legend_not_visited')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Bottom Bar -->
        <div class="test-mobile-bar">
          <button class="mobile-nav-btn" onclick="TestPage.prev()"
                  ${current.index === 0 ? 'disabled' : ''}>${Lang.t('test_prev')}</button>
          <button class="mobile-nav-btn nav-toggle" onclick="TestPage.toggleMobileNav()">
            ${current.index + 1}/${current.total}
          </button>
          <button class="mobile-nav-btn primary" onclick="TestPage.next()">
            ${current.index === current.total - 1 ? Lang.t('submit') : Lang.t('test_next')}
          </button>
        </div>

        <!-- Mobile Nav Sheet -->
        <div class="mobile-nav-sheet" id="mobile-nav-sheet">
          <div class="mobile-nav-sheet-overlay" onclick="TestPage.toggleMobileNav()"></div>
          <div class="mobile-nav-sheet-content">
            <div class="nav-panel-title">${Lang.t('test_questions_nav')}</div>
            <div class="nav-grid" id="nav-grid-mobile">
              ${navStatus.map((ns, i) => `
                <button class="nav-btn ${ns.current ? 'current' : ''} ${ns.answered ? 'answered' : ''} ${ns.review ? 'review' : ''}"
                        onclick="TestPage.goTo(${i});TestPage.toggleMobileNav()">${i + 1}</button>
              `).join('')}
            </div>
            <div class="nav-legend" style="justify-content: center;">
              <span class="legend-item"><span class="legend-dot current"></span> ${Lang.t('test_legend_current')}</span>
              <span class="legend-item"><span class="legend-dot answered"></span> ${Lang.t('test_legend_answered')}</span>
              <span class="legend-item"><span class="legend-dot review"></span> ${Lang.t('test_legend_review')}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _renderQuestion(current) {
    const q = current.question;
    const labels = ['A', 'B', 'C', 'D'];
    const showTopic = q.topic && q.topic !== q.subject;

    return `
      <div class="question-header">
        <div class="question-number">${current.index + 1}</div>
        <div class="question-meta">
          <span class="chip chip-primary">${q.subject}</span>
          ${showTopic ? `<span class="chip">${q.topic}</span>` : ''}
        </div>
      </div>

      <div class="question-text question-slide-in">${q.question}</div>

      <div class="options-list" id="options-list">
        ${q.options.map((opt, i) => `
          <button class="option-btn ${current.selectedAnswer === i ? 'selected' : ''} option-slide-in"
                  style="animation-delay: ${i * 60}ms;"
                  onclick="TestPage.selectOption(${i})" id="option-${i}">
            <span class="option-label">${labels[i]}</span>
            <span class="option-text">${opt}</span>
          </button>
        `).join('')}
      </div>

      <div class="question-actions">
        <div class="question-actions-left">
          <button class="btn btn-ghost btn-sm" onclick="TestPage.clearAnswer()" id="clear-btn">
            ${Lang.t('test_clear')}
          </button>
          <button class="mark-review-btn ${current.isMarkedForReview ? 'active' : ''}"
                  onclick="TestPage.toggleReview()" id="review-btn">
            ${current.isMarkedForReview ? Lang.t('test_marked') : Lang.t('test_mark_review')}
          </button>
        </div>
        <div class="question-actions-right desktop-only">
          <button class="btn btn-secondary btn-sm" onclick="TestPage.prev()"
                  ${current.index === 0 ? 'disabled style="opacity:0.4;pointer-events:none"' : ''}
                  id="prev-btn">
            ${Lang.t('test_prev')}
          </button>
          <button class="btn btn-primary btn-sm" onclick="TestPage.next()" id="next-btn">
            ${current.index === current.total - 1 ? Lang.t('submit') + ' →' : Lang.t('test_next')}
          </button>
        </div>
      </div>
    `;
  },

  afterRender() {
    this.startTimer();

    // Keyboard shortcuts
    this._keyHandler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      switch(e.key) {
        case '1': this.selectOption(0); break;
        case '2': this.selectOption(1); break;
        case '3': this.selectOption(2); break;
        case '4': this.selectOption(3); break;
        case 'ArrowLeft': this.prev(); break;
        case 'ArrowRight': this.next(); break;
        case 'r': case 'R': this.toggleReview(); break;
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    // Swipe support for mobile
    this._setupSwipe();
  },

  destroy() {
    this.stopTimer();
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }
  },

  // ── Swipe support ──
  _setupSwipe() {
    const area = document.getElementById('question-area');
    if (!area) return;
    let startX = 0;
    area.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    area.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 60) {
        if (diff > 0) this.prev();
        else this.next();
      }
    }, { passive: true });
  },

  // ── Timer with %-based thresholds ──
  startTimer() {
    this.stopTimer();
    if (!TestEngine.state || TestEngine.state.totalTime >= 99999) return;

    this.timerInterval = setInterval(() => {
      const result = TestEngine.tick();

      if (result === 'timeout') {
        this.stopTimer();
        // Show timeout popup then auto-submit
        this._showTimeoutPopup();
        return;
      }

      const timerEl = document.getElementById('timer-text');
      const timerDisplay = document.getElementById('timer-display');
      if (timerEl) {
        timerEl.textContent = Helpers.formatTime(result);
      }

      if (timerDisplay) {
        const totalTime = TestEngine.state.totalTime;
        const percentLeft = result / totalTime;

        timerDisplay.classList.remove('warning', 'danger', 'timer-shake');

        if (percentLeft <= 0.10) {
          timerDisplay.classList.add('danger', 'timer-shake');
        } else if (percentLeft <= 0.20) {
          timerDisplay.classList.add('warning');
        }
      }

      // Show warning popup at 60 seconds remaining (once)
      if (result === 60 && !this._lastWarningShown) {
        this._lastWarningShown = true;
        this._showTimerWarning();
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  selectOption(index) {
    // Debounce: prevent rapid double-clicks
    if (this._isProcessing) return;
    this._isProcessing = true;

    TestEngine.selectAnswer(index);
    this.refreshQuestion();
    this.refreshNav();
    this._updateProgress();

    // Release lock after animation frame
    requestAnimationFrame(() => {
      this._isProcessing = false;
    });
  },

  clearAnswer() {
    TestEngine.clearAnswer();
    this.refreshQuestion();
    this.refreshNav();
    this._updateProgress();
  },

  toggleReview() {
    TestEngine.toggleReview();
    this.refreshQuestion();
    this.refreshNav();
  },

  next() {
    const current = TestEngine.getCurrentQuestion();
    if (current.index === current.total - 1) {
      this.confirmSubmit();
    } else {
      TestEngine.nextQuestion();
      this.refreshQuestion('left');
      this.refreshNav();
      this._updateProgress();
    }
  },

  prev() {
    const current = TestEngine.getCurrentQuestion();
    if (current.index === 0) return;
    TestEngine.prevQuestion();
    this.refreshQuestion('right');
    this.refreshNav();
    this._updateProgress();
  },

  goTo(index) {
    TestEngine.goToQuestion(index);
    this.refreshQuestion();
    this.refreshNav();
    this._updateProgress();
  },

  refreshQuestion(direction) {
    const area = document.getElementById('question-area');
    if (area) {
      const current = TestEngine.getCurrentQuestion();
      area.innerHTML = this._renderQuestion(current);
    }
  },

  refreshNav() {
    // Desktop nav
    const grid = document.getElementById('nav-grid');
    if (grid) {
      const navStatus = TestEngine.getNavStatus();
      grid.innerHTML = navStatus.map((ns, i) => `
        <button class="nav-btn ${ns.current ? 'current' : ''} ${ns.answered ? 'answered' : ''} ${ns.review ? 'review' : ''}"
                onclick="TestPage.goTo(${i})" id="nav-btn-${i}">${i + 1}</button>
      `).join('');
    }
    // Mobile nav
    const mGrid = document.getElementById('nav-grid-mobile');
    if (mGrid) {
      const navStatus = TestEngine.getNavStatus();
      mGrid.innerHTML = navStatus.map((ns, i) => `
        <button class="nav-btn ${ns.current ? 'current' : ''} ${ns.answered ? 'answered' : ''} ${ns.review ? 'review' : ''}"
                onclick="TestPage.goTo(${i});TestPage.toggleMobileNav()">${i + 1}</button>
      `).join('');
    }
  },

  _updateProgress() {
    const bar = document.getElementById('test-progress-bar');
    if (bar && TestEngine.state) {
      const current = TestEngine.getCurrentQuestion();
      const pct = ((current.index + 1) / current.total) * 100;
      bar.style.width = pct + '%';
      bar.classList.remove('active', 'intense');
      if (pct >= 80) bar.classList.add('intense');
      else if (pct >= 50) bar.classList.add('active');
    }
  },

  toggleMobileNav() {
    const sheet = document.getElementById('mobile-nav-sheet');
    if (sheet) sheet.classList.toggle('open');
  },

  confirmSubmit() {
    const summary = TestEngine.getSummary();
    if (!summary) return;

    const unansweredWarning = summary.unanswered > 0
      ? `<p style="font-size: var(--text-sm); color: var(--warning); margin-top: var(--space-3);">
           ⚠️ You have <strong>${summary.unanswered}</strong> unanswered question${summary.unanswered > 1 ? 's' : ''}. Submit anyway?
         </p>`
      : '';

    const modalHTML = `
      <div class="modal-backdrop" id="submit-modal" onclick="if(event.target===this)document.getElementById('submit-modal').remove()">
        <div class="modal">
          <div class="modal-title">${Lang.t('test_submit_title')}</div>
          <div class="modal-text">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: var(--space-3); margin: var(--space-4) 0;">
              <div style="padding: var(--space-3); background: var(--success-bg); border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--success);">${summary.answered}</div>
                <div style="font-size: var(--text-xs); color: var(--text-muted);">${Lang.t('test_answered')}</div>
              </div>
              <div style="padding: var(--space-3); background: var(--danger-bg); border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--danger);">${summary.unanswered}</div>
                <div style="font-size: var(--text-xs); color: var(--text-muted);">${Lang.t('test_unanswered')}</div>
              </div>
              <div style="padding: var(--space-3); background: var(--warning-bg); border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--warning);">${summary.reviewed}</div>
                <div style="font-size: var(--text-xs); color: var(--text-muted);">${Lang.t('test_review')}</div>
              </div>
            </div>
            ${unansweredWarning}
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="document.getElementById('submit-modal').remove()">${Lang.t('cancel')}</button>
            <button class="btn btn-primary" onclick="TestPage.submitTest()">${Lang.t('test_confirm_submit')}</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  submitTest() {
    const modal = document.getElementById('submit-modal');
    if (modal) modal.remove();
    const timeoutModal = document.getElementById('timeout-modal');
    if (timeoutModal) timeoutModal.remove();
    const warningModal = document.getElementById('timer-warning-modal');
    if (warningModal) warningModal.remove();

    this.stopTimer();
    this._lastWarningShown = false;

    // Store config for retry
    if (TestEngine.state) {
      App.lastTestConfig = { ...TestEngine.state.config };
      App.lastTestQuestionIds = TestEngine.state.questions.map(q => q.id);
    }

    const result = TestEngine.submit();
    if (result) {
      App.lastResult = result;
      App.navigate('result');
    }
  },

  // ── Time-up popup ──
  _showTimeoutPopup() {
    const html = `
      <div class="modal-backdrop" id="timeout-modal">
        <div class="modal">
          <div class="modal-title" style="color: var(--danger);">${Lang.t('test_timeout_title')}</div>
          <div class="modal-text">
            <p>${Lang.t('test_timeout_desc')}</p>
          </div>
          <div class="modal-actions" style="justify-content: center;">
            <button class="btn btn-primary" onclick="TestPage.submitTest()">${Lang.t('test_view_results')}</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  // ── 60-second warning popup ──
  _showTimerWarning() {
    const html = `
      <div class="modal-backdrop" id="timer-warning-modal" onclick="if(event.target===this)document.getElementById('timer-warning-modal').remove()">
        <div class="modal">
          <div class="modal-title" style="color: var(--warning);">${Lang.t('test_60s_title')}</div>
          <div class="modal-text">
            <p>${Lang.t('test_60s_desc')}</p>
            <div style="margin-top: var(--space-4); padding: var(--space-3); background: var(--warning-bg); border-radius: var(--radius-md); font-size: var(--text-sm); color: var(--warning);">
              ${Lang.t('test_60s_warn')}
            </div>
          </div>
          <div class="modal-actions" style="justify-content: center;">
            <button class="btn btn-secondary" onclick="document.getElementById('timer-warning-modal').remove()">${Lang.t('test_continue')}</button>
            <button class="btn btn-primary" onclick="TestPage.confirmSubmit()">${Lang.t('test_submit_now')}</button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const modal = document.getElementById('timer-warning-modal');
      if (modal) modal.remove();
    }, 5000);
  }
};
