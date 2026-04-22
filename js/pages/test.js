// ============================================
// MOCK TEST PLATFORM — Test Page
// ============================================

const TestPage = {
  timerInterval: null,

  render() {
    if (!TestEngine.state) {
      return `
        <div class="setup-page page-enter text-center" style="padding-top: var(--space-16);">
          <div class="empty-state">
            <div class="empty-state-icon">📝</div>
            <div class="empty-state-title">No Active Test</div>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">Start a new test from the setup page</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">Go to Setup</button>
          </div>
        </div>
      `;
    }

    const current = TestEngine.getCurrentQuestion();
    const navStatus = TestEngine.getNavStatus();
    const noTimer = TestEngine.state.totalTime >= 99999;

    return `
      <div class="test-page">
        <!-- Top Bar -->
        <div class="test-topbar">
          <div class="test-info">
            <span class="test-info-item">
              Q <strong>${current.index + 1}/${current.total}</strong>
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
            Submit Test
          </button>
        </div>

        <!-- Test Body -->
        <div class="test-body">
          <!-- Question Area -->
          <div class="question-area" id="question-area">
            ${this._renderQuestion(current)}
          </div>

          <!-- Nav Panel -->
          <div class="question-nav-panel">
            <div class="nav-panel-card">
              <div class="nav-panel-title">Questions</div>
              <div class="nav-grid" id="nav-grid">
                ${navStatus.map((ns, i) => `
                  <button class="nav-btn ${ns.current ? 'current' : ''} ${ns.answered ? 'answered' : ''} ${ns.review ? 'review' : ''}"
                          onclick="TestPage.goTo(${i})" id="nav-btn-${i}">${i + 1}</button>
                `).join('')}
              </div>
              <div class="nav-legend">
                <span class="legend-item"><span class="legend-dot current"></span> Current</span>
                <span class="legend-item"><span class="legend-dot answered"></span> Answered</span>
                <span class="legend-item"><span class="legend-dot review"></span> Review</span>
                <span class="legend-item"><span class="legend-dot unanswered"></span> Not visited</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _renderQuestion(current) {
    const q = current.question;
    const labels = ['A', 'B', 'C', 'D'];

    return `
      <div class="question-header">
        <div class="question-number">${current.index + 1}</div>
        <div class="question-meta">
          <span class="chip chip-primary">${q.subject}</span>
          <span class="chip">${q.topic}</span>
          ${q.pyq ? `<span class="chip chip-warning">PYQ ${q.year || ''}</span>` : ''}
        </div>
      </div>

      <div class="question-text">${q.question}</div>

      <div class="options-list" id="options-list">
        ${q.options.map((opt, i) => `
          <button class="option-btn ${current.selectedAnswer === i ? 'selected' : ''}"
                  onclick="TestPage.selectOption(${i})" id="option-${i}">
            <span class="option-label">${labels[i]}</span>
            <span class="option-text">${opt}</span>
          </button>
        `).join('')}
      </div>

      <div class="question-actions">
        <div class="question-actions-left">
          <button class="btn btn-ghost btn-sm" onclick="TestPage.clearAnswer()" id="clear-btn">
            🗑️ Clear
          </button>
          <button class="mark-review-btn ${current.isMarkedForReview ? 'active' : ''}"
                  onclick="TestPage.toggleReview()" id="review-btn">
            🔖 ${current.isMarkedForReview ? 'Marked' : 'Mark for Review'}
          </button>
        </div>
        <div class="question-actions-right">
          <button class="btn btn-secondary btn-sm" onclick="TestPage.prev()"
                  ${current.index === 0 ? 'disabled style="opacity:0.4;pointer-events:none"' : ''}
                  id="prev-btn">
            ← Prev
          </button>
          <button class="btn btn-primary btn-sm" onclick="TestPage.next()" id="next-btn">
            ${current.index === current.total - 1 ? 'Submit →' : 'Next →'}
          </button>
        </div>
      </div>
    `;
  },

  afterRender() {
    // Start timer
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
  },

  destroy() {
    this.stopTimer();
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
    }
  },

  startTimer() {
    this.stopTimer();
    if (!TestEngine.state || TestEngine.state.totalTime >= 99999) return;

    this.timerInterval = setInterval(() => {
      const result = TestEngine.tick();

      if (result === 'timeout') {
        this.stopTimer();
        Helpers.showToast('⏰ Time\'s up! Auto-submitting...', 'error');
        setTimeout(() => this.submitTest(), 500);
        return;
      }

      const timerEl = document.getElementById('timer-text');
      const timerDisplay = document.getElementById('timer-display');
      if (timerEl) {
        timerEl.textContent = Helpers.formatTime(result);
      }
      if (timerDisplay) {
        timerDisplay.classList.remove('warning', 'danger');
        if (result <= 30) {
          timerDisplay.classList.add('danger');
        } else if (result <= 60) {
          timerDisplay.classList.add('warning');
        }
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
    TestEngine.selectAnswer(index);
    this.refreshQuestion();
  },

  clearAnswer() {
    TestEngine.clearAnswer();
    this.refreshQuestion();
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
      this.refreshQuestion();
      this.refreshNav();
    }
  },

  prev() {
    TestEngine.prevQuestion();
    this.refreshQuestion();
    this.refreshNav();
  },

  goTo(index) {
    TestEngine.goToQuestion(index);
    this.refreshQuestion();
    this.refreshNav();
  },

  refreshQuestion() {
    const area = document.getElementById('question-area');
    if (area) {
      const current = TestEngine.getCurrentQuestion();
      area.innerHTML = this._renderQuestion(current);
      area.querySelector('.question-text').style.animation = 'fadeIn 200ms ease';
    }
  },

  refreshNav() {
    const grid = document.getElementById('nav-grid');
    if (grid) {
      const navStatus = TestEngine.getNavStatus();
      grid.innerHTML = navStatus.map((ns, i) => `
        <button class="nav-btn ${ns.current ? 'current' : ''} ${ns.answered ? 'answered' : ''} ${ns.review ? 'review' : ''}"
                onclick="TestPage.goTo(${i})" id="nav-btn-${i}">${i + 1}</button>
      `).join('');
    }
  },

  confirmSubmit() {
    const summary = TestEngine.getSummary();
    if (!summary) return;

    const modalHTML = `
      <div class="modal-backdrop" id="submit-modal" onclick="if(event.target===this)document.getElementById('submit-modal').remove()">
        <div class="modal">
          <div class="modal-title">Submit Test?</div>
          <div class="modal-text">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin: var(--space-4) 0;">
              <div style="padding: var(--space-3); background: var(--success-bg); border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--success);">${summary.answered}</div>
                <div style="font-size: var(--text-xs); color: var(--text-muted);">Answered</div>
              </div>
              <div style="padding: var(--space-3); background: var(--danger-bg); border-radius: var(--radius-md); text-align: center;">
                <div style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--danger);">${summary.unanswered}</div>
                <div style="font-size: var(--text-xs); color: var(--text-muted);">Unanswered</div>
              </div>
            </div>
            ${summary.reviewed > 0 ? `<p style="font-size: var(--text-sm);">⚠️ ${summary.reviewed} questions marked for review</p>` : ''}
            <p style="font-size: var(--text-sm); margin-top: var(--space-2);">Are you sure you want to submit?</p>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" onclick="document.getElementById('submit-modal').remove()">Cancel</button>
            <button class="btn btn-primary" onclick="TestPage.submitTest()">Submit</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  },

  submitTest() {
    // Remove modal
    const modal = document.getElementById('submit-modal');
    if (modal) modal.remove();

    this.stopTimer();

    const result = TestEngine.submit();
    if (result) {
      App.lastResult = result;
      App.navigate('result');
    }
  }
};
