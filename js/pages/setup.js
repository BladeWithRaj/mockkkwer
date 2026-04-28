// ============================================
// TEST SETUP PAGE — Full UX Upgrade
// Live count, smart suggestion, validation,
// glow button, no PYQ
// ============================================

const SetupPage = {
  config: {
    subjects: [],
    numQuestions: 10,
    timeMode: 'auto',
    timePerQuestion: 60,
    totalTime: null,
    negativeMarking: false,
    negativeValue: 0.25
  },

  render(params = {}) {


    // Pre-fill from URL params
    if (params.subject) {
      this.config.subjects = [params.subject.toLowerCase()];
    }
    if (params.limit) this.config.numQuestions = parseInt(params.limit, 10);

    // Available subjects (lowercase)
    const subjects = ['math', 'gk', 'reasoning', 'english', 'hindi', 'science', 'polity', 'geography', 'history'];

    return `
      <div class="setup-page page-enter">
        <div class="setup-header">
          <h1 class="animate-fadeInDown">${Lang.t('setup_title')}</h1>
          <p class="animate-fadeInDown stagger-1" style="color: var(--text-secondary); margin-top: var(--space-2);">
            ${Lang.t('setup_subtitle')}
          </p>
        </div>

        <div class="setup-form">
          <!-- Subject (Multi-Select Chips) -->
          <div class="setup-section animate-fadeInUp stagger-1">
            <div class="setup-section-title">${Lang.t('setup_subject')}</div>
            <div class="setup-chips" id="subject-chips">
              <button class="setup-chip ${this.config.subjects.length === 0 ? 'active' : ''}"
                      onclick="SetupPage._toggleSubject('all')">${Lang.t('setup_all_subjects')}</button>
              ${subjects.map(s => `
                <button class="setup-chip ${this.config.subjects.includes(s) ? 'active' : ''}"
                        onclick="SetupPage._toggleSubject('${s}')">${Helpers.getSubjectIcon(s)} ${s.charAt(0).toUpperCase() + s.slice(1)}</button>
              `).join('')}
            </div>
          </div>

          <!-- Number of Questions (Free Input) -->
          <div class="setup-section animate-fadeInUp stagger-3">
            <div class="setup-section-title">${Lang.t('setup_questions')}</div>
            <div style="display: flex; align-items: center; gap: var(--space-3);">
              <input type="number" class="input" style="width: 120px; text-align: center; font-size: var(--text-lg); font-weight: var(--font-bold);"
                     value="${this.config.numQuestions}"
                     min="5" max="200" step="1" placeholder="e.g. 25"
                     onchange="SetupPage._setNumQuestions(this.value)"
                     id="num-questions-input">
              <span style="font-size: var(--text-sm); color: var(--text-muted);">${Lang.t('setup_questions_hint')}</span>
            </div>
            <div style="display: flex; gap: var(--space-2); margin-top: var(--space-3);">
              <button class="setup-chip" onclick="document.getElementById('num-questions-input').value=10; SetupPage._setNumQuestions(10)">10</button>
              <button class="setup-chip" onclick="document.getElementById('num-questions-input').value=25; SetupPage._setNumQuestions(25)">25</button>
              <button class="setup-chip" onclick="document.getElementById('num-questions-input').value=50; SetupPage._setNumQuestions(50)">50</button>
              <button class="setup-chip" onclick="document.getElementById('num-questions-input').value=100; SetupPage._setNumQuestions(100)">100</button>
            </div>
          </div>

          <!-- Time Settings (Free Input) -->
          <div class="setup-section animate-fadeInUp stagger-4">
            <div class="setup-section-title">${Lang.t('setup_time')}</div>
            <div class="switch-wrapper" style="margin-bottom: var(--space-3);">
              <label class="switch">
                <input type="checkbox" ${this.config.timeMode !== 'none' ? 'checked' : ''}
                       onchange="SetupPage._toggleTimer(this.checked)"
                       id="timer-toggle">
                <span class="switch-track"></span>
              </label>
              <span style="font-size: var(--text-sm); color: var(--text-secondary);">
                ${this.config.timeMode !== 'none' ? Lang.t('setup_timer_on') : Lang.t('setup_no_timer')}
              </span>
            </div>
            ${this.config.timeMode !== 'none' ? `
              <div style="display: flex; align-items: center; gap: var(--space-3);">
                <input type="number" class="input" style="width: 120px; text-align: center; font-size: var(--text-lg); font-weight: var(--font-bold);"
                       value="${this.config.timeMode === 'auto' ? this.config.numQuestions : Math.round((this.config.totalTime || 600) / 60)}"
                       min="1" max="300" step="1" placeholder="e.g. 30"
                       onchange="SetupPage._setTime(this.value)"
                       id="time-minutes-input">
                <span style="font-size: var(--text-sm); color: var(--text-muted);">${Lang.t('setup_time_hint')}</span>
              </div>
              <div style="display: flex; gap: var(--space-2); margin-top: var(--space-3);">
                <button class="setup-chip" onclick="document.getElementById('time-minutes-input').value=10; SetupPage._setTime(10)">10m</button>
                <button class="setup-chip" onclick="document.getElementById('time-minutes-input').value=30; SetupPage._setTime(30)">30m</button>
                <button class="setup-chip" onclick="document.getElementById('time-minutes-input').value=60; SetupPage._setTime(60)">60m</button>
                <button class="setup-chip" onclick="document.getElementById('time-minutes-input').value=120; SetupPage._setTime(120)">2h</button>
              </div>
            ` : ''}
          </div>

          <!-- Negative Marking -->
          <div class="setup-section animate-fadeInUp stagger-7">
            <div class="setup-section-title">${Lang.t('setup_neg_marking')}</div>
            <div class="switch-wrapper">
              <label class="switch">
                <input type="checkbox" ${this.config.negativeMarking ? 'checked' : ''}
                       onchange="SetupPage.setConfig('negativeMarking', this.checked)"
                       id="neg-mark-toggle">
                <span class="switch-track"></span>
              </label>
              <span style="font-size: var(--text-sm); color: var(--text-secondary);">
                ${this.config.negativeMarking ? Lang.t('setup_enabled') : Lang.t('setup_disabled')}
              </span>
            </div>
            ${this.config.negativeMarking ? `
              <div class="neg-mark-config">
                <label class="input-label">${Lang.t('setup_deduction')}</label>
                <select class="select" style="width: auto;"
                        onchange="SetupPage.setConfig('negativeValue', parseFloat(this.value))"
                        id="neg-value-select">
                  <option value="0.25" ${this.config.negativeValue === 0.25 ? 'selected' : ''}>0.25</option>
                  <option value="0.33" ${this.config.negativeValue === 0.33 ? 'selected' : ''}>0.33</option>
                  <option value="0.50" ${this.config.negativeValue === 0.50 ? 'selected' : ''}>0.50</option>
                  <option value="1" ${this.config.negativeValue === 1 ? 'selected' : ''}>1.00</option>
                </select>
              </div>
            ` : ''}
          </div>

          <!-- Summary -->
          <div class="setup-summary animate-fadeInUp stagger-8" id="setup-summary">
            ${this._renderSummary()}
          </div>

          <!-- Available Count Badge -->
          <div id="available-count-badge" style="text-align: center; margin-bottom: var(--space-3); font-size: var(--text-sm); color: var(--text-muted);">
            ${Lang.t('setup_checking')}
          </div>
          </div>

          <!-- Start Button -->
          <button class="btn btn-primary btn-lg btn-block animate-fadeInUp stagger-8 btn-glow"
                  onclick="SetupPage.startTest()" id="start-test-btn" disabled>
            ${Lang.t('setup_start')}
          </button>

          <button class="btn btn-ghost btn-block" onclick="App.navigate('home')" style="margin-top: var(--space-2);">
            ${Lang.t('setup_back')}
          </button>
        </div>
      </div>
    `;
  },

  _renderSummary() {
    const timeText = this.config.timeMode === 'none'
      ? Lang.t('setup_no_timer')
      : `${Math.round((this.config.totalTime || this.config.numQuestions * 60) / 60)} min`;

    const subjectText = this.config.subjects.length === 0
      ? Lang.t('setup_all_subjects')
      : this.config.subjects.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');

    return `
      <div class="summary-row">
        <span class="summary-label">${Lang.t('setup_summary_subject')}</span>
        <span class="summary-value">${subjectText}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">${Lang.t('setup_summary_questions')}</span>
        <span class="summary-value">${this.config.numQuestions}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">${Lang.t('setup_summary_time')}</span>
        <span class="summary-value">${timeText}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">${Lang.t('setup_summary_neg')}</span>
        <span class="summary-value">${this.config.negativeMarking ? `-${this.config.negativeValue}` : 'OFF'}</span>
      </div>
    `;
  },

  // ── Free input handlers (no full re-render to avoid focus loss) ──

  _setNumQuestions(val) {
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 5) {
      Helpers.showToast('Minimum 5 questions required', 'error');
      return;
    }
    if (num > 200) {
      Helpers.showToast('Maximum 200 questions allowed', 'error');
      return;
    }
    this.config.numQuestions = num;

    // If timer is on and was auto, update time to match
    if (this.config.timeMode === 'auto') {
      this.config.totalTime = num * 60;
      const timeInput = document.getElementById('time-minutes-input');
      if (timeInput) timeInput.value = num;
    }

    // Update summary without full re-render
    const summary = document.getElementById('setup-summary');
    if (summary) summary.innerHTML = this._renderSummary();

    // Re-validate
    this._validateAvailability();
  },

  _setTime(val) {
    const mins = parseInt(val, 10);
    if (isNaN(mins) || mins < 1) {
      Helpers.showToast('Minimum 1 minute required', 'error');
      return;
    }
    if (mins > 300) {
      Helpers.showToast('Maximum 300 minutes (5 hours) allowed', 'error');
      return;
    }
    this.config.timeMode = 'manual';
    this.config.totalTime = mins * 60;

    // Update summary
    const summary = document.getElementById('setup-summary');
    if (summary) summary.innerHTML = this._renderSummary();
  },

  _toggleTimer(checked) {
    if (checked) {
      this.config.timeMode = 'auto';
      this.config.totalTime = this.config.numQuestions * 60;
    } else {
      this.config.timeMode = 'none';
      this.config.totalTime = 99999;
    }
    // Full re-render needed to show/hide time input
    document.getElementById('app').innerHTML = App._renderHeader('setup') + this.render();
    this._validateAvailability();
  },

  setConfig(key, value) {
    this.config[key] = value;
    document.getElementById('app').innerHTML = App._renderHeader('setup') + this.render();
    this._validateAvailability();
  },

  // ── Multi-select subject toggle ──
  _toggleSubject(subject) {
    if (subject === 'all') {
      this.config.subjects = [];
    } else {
      const idx = this.config.subjects.indexOf(subject);
      if (idx >= 0) {
        this.config.subjects.splice(idx, 1);
      } else {
        this.config.subjects.push(subject);
      }
    }
    document.getElementById('app').innerHTML = App._renderHeader('setup') + this.render();
    this._validateAvailability();
  },

  /**
   * Check how many questions are available for current filters via API.
   * Enables/disables Start button based on result.
   */
  async _validateAvailability() {
    const badge = document.getElementById('available-count-badge');
    const btn = document.getElementById('start-test-btn');
    if (!badge || !btn) return;

    badge.textContent = Lang.t('setup_checking');
    badge.style.color = 'var(--text-muted)';
    btn.disabled = true;
    btn.textContent = Lang.t('setup_checking');

    try {
      // Quick fetch with limit 1 to check availability (fast)
      const testFetch = await window.fetchRandomQuestions({
        limit: this.config.numQuestions,
        subjects: this.config.subjects,
        seenIds: []
      });

      if (testFetch.error) {
        badge.innerHTML = `<span style="color: var(--danger);">❌ ${testFetch.error}</span>`;
        btn.disabled = true;
        btn.textContent = '⚠️ Cannot Start';
        return;
      }

      const count = Array.isArray(testFetch) ? testFetch.length : 0;

      if (count >= this.config.numQuestions) {
        badge.innerHTML = `<span style="color: var(--success);">✅ ${count} ${Lang.t('setup_available')}</span>`;
        btn.disabled = false;
        btn.textContent = Lang.t('setup_start');
        btn.classList.add('btn-glow');
      } else if (count >= 5) {
        badge.innerHTML = `<span style="color: var(--warning);">⚠️ Only ${count} questions available (requested ${this.config.numQuestions})</span>`;
        btn.disabled = false;
        btn.textContent = `🚀 Start with ${count} Questions`;
        btn.classList.add('btn-glow');
        // Auto-adjust config to available count
        this.config.numQuestions = count;
      } else {
        badge.innerHTML = `<span style="color: var(--danger);">❌ ${Lang.t('setup_not_enough')} (${count})</span>`;
        btn.disabled = true;
        btn.textContent = Lang.t('setup_cannot_start');
        btn.classList.remove('btn-glow');
      }
    } catch (err) {
      badge.innerHTML = `<span style="color: var(--danger);">❌ Failed to check: ${err.message}</span>`;
      // On network error, still allow start — API will validate again
      btn.disabled = false;
      btn.textContent = '🚀 Start Test';
    }
  },

  async startTest() {
    const startBtn = document.getElementById('start-test-btn');
    if (!startBtn) return;
    
    const originalText = startBtn.innerHTML;
    
    // Add loading state
    startBtn.disabled = true;
    startBtn.innerHTML = '<span class="splash-spinner" style="width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; display: inline-block; animation: spin 1s linear infinite; vertical-align: middle; margin-right: 8px;"></span> Generating...';

    try {
      const timePerQuestion = this.config.timeMode === 'auto' ? 60 : 0;
      const totalTime = this.config.timeMode === 'none'
        ? 99999
        : this.config.timeMode === 'manual'
          ? (this.config.totalTime || 600)
          : null;

      // 1. Get seen IDs
      const seenIds = Storage.getSeenQuestions();

      // 2. Fetch random questions from API securely
      const fetchedQuestions = await window.fetchRandomQuestions({
        limit: this.config.numQuestions,
        subjects: this.config.subjects,
        seenIds: seenIds
      });

      if (fetchedQuestions.error) throw new Error(fetchedQuestions.error);
      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        throw new Error('No questions found for the selected filters.');
      }
      if (fetchedQuestions.length < 5) {
        throw new Error(`Only ${fetchedQuestions.length} questions found — need at least 5.`);
      }

      // 3. Save newly seen IDs
      Storage.addSeenQuestions(fetchedQuestions.map(q => q.id));

      console.log("CREATE TEST CALLED", fetchedQuestions.length, "questions");

      // 4. Create test
      const result = TestEngine.createTest({
        ...this.config,
        questions: fetchedQuestions,
        timePerQuestion,
        totalTime
      });

      if (result.error) {
        throw new Error(result.error);
      }

      Helpers.showToast(`Test started! ${result.questionCount} questions`, 'success');
      App.navigate('test');

    } catch (err) {
      Helpers.showToast(err.message, 'error');
      startBtn.disabled = false;
      startBtn.innerHTML = originalText;
    }
  },

  afterRender() {
    // Run availability check when page loads
    this._validateAvailability();
  }
};

