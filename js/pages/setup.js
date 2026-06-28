// ============================================
// TEST SETUP PAGE V3 — Precision Prep Design
// Lucide icons · No emoji · Token-driven
// ============================================

const SetupPage = {
  config: {
    subjects: [],
    numQuestions: 10,
    timeMode: 'auto',
    timePerQuestion: 60,
    totalTime: null,
    negativeMarking: false,
    negativeValue: 0.25,
    marksPerQuestion: 1,
    examId: null,
    examName: null,
    isDaily: false
  },

  render(params = {}) {
    // ── Reset config to clean defaults ──
    this.config = {
      subjects: [],
      numQuestions: 10,
      timeMode: 'auto',
      timePerQuestion: 60,
      totalTime: null,
      negativeMarking: false,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      examId: null,
      examName: null,
      isDaily: false
    };

    // ── Auto-fill from exam preset ──
    if (params.preset) {
      const preset = ExamPresets.get(params.preset);
      if (preset) {
        this.config.examId = preset.id;
        this.config.examName = preset.name;
        this.config.numQuestions = preset.totalQuestions;
        this.config.totalTime = preset.totalTime;
        this.config.timeMode = 'manual';
        this.config.negativeMarking = preset.negativeMarking;
        this.config.negativeValue = preset.negativeValue;
        this.config.marksPerQuestion = preset.marksPerQuestion || 1;
        this.config.subjects = ExamPresets.getSubjects(preset.id);
        this.config.isDaily = params.daily === '1';
      }
    }

    // Legacy param support
    if (params.subject && !params.preset) {
      this.config.subjects = [params.subject.toLowerCase()];
    }
    if (params.limit && !params.preset) this.config.numQuestions = parseInt(params.limit, 10);

    const subjects = ['math', 'gk', 'reasoning', 'english', 'hindi', 'science', 'polity', 'geography', 'history'];
    const preset = this.config.examId ? ExamPresets.get(this.config.examId) : null;
    const bookCount = Storage.getMistakeBook ? Storage.getMistakeBook().length : 0;

    return `
      <div class="setup-page page-enter">
        <div class="sp-container">

        ${preset ? `
          <!-- ═══ Preset Exam: Simplified Flow ═══ -->
          ${this._renderPresetInfo(preset)}

          <div class="sp-actions">
            <button class="btn btn-primary btn-lg btn-block" onclick="SetupPage.startTest()" id="start-test-btn">
              Start Test →
            </button>
            <button class="btn btn-ghost" onclick="App.navigate('home')">
              ← Back to Home
            </button>
          </div>
        ` : `
          <!-- ═══ Custom Test Flow ═══ -->
          <div class="sp-header">
            <h1>Practice Test</h1>
            <p>Configure your mock test</p>
          </div>

          ${bookCount > 0 ? `
          <div class="card sp-mistake-card">
            <div class="sp-mistake-top">
              <div class="sp-mistake-info">
                <span class="chip chip-danger">${bookCount} Questions</span>
                <div class="sp-mistake-title">Mistake Book</div>
                <div class="sp-mistake-desc">Revise questions you got wrong</div>
              </div>
              <button class="btn btn-danger btn-sm" onclick="SetupPage.startMistakeTest()">Revise →</button>
            </div>
          </div>
          ` : ''}

          <!-- Subject Selection -->
          <div class="sp-section">
            <div class="sp-section-head">Subjects</div>
            <div class="setup-chips" id="subject-chips">
              <button class="setup-chip ${this.config.subjects.length === 0 ? 'active' : ''}" data-subject="all"
                      onclick="SetupPage._toggleSubject('all')" id="chip-all">All</button>
              ${subjects.map(s => `
                <button class="setup-chip ${this.config.subjects.includes(s) ? 'active' : ''}" data-subject="${s}"
                        onclick="SetupPage._toggleSubject('${s}')" id="chip-${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</button>
              `).join('')}
            </div>
          </div>

          <!-- Questions -->
          <div class="sp-section">
            <div class="sp-section-head">Questions</div>
            <div class="sp-quick-chips">
              <button class="sp-qchip ${this.config.numQuestions === 10 ? 'active' : ''}" onclick="SetupPage._setNumQuestions(10)">10</button>
              <button class="sp-qchip ${this.config.numQuestions === 25 ? 'active' : ''}" onclick="SetupPage._setNumQuestions(25)">25</button>
              <button class="sp-qchip ${this.config.numQuestions === 50 ? 'active' : ''}" onclick="SetupPage._setNumQuestions(50)">50</button>
              <button class="sp-qchip ${this.config.numQuestions === 100 ? 'active' : ''}" onclick="SetupPage._setNumQuestions(100)">100</button>
            </div>
          </div>

          <!-- Advanced Settings (collapsed) -->
          <details class="sp-advanced">
            <summary class="sp-advanced-toggle">Advanced Settings</summary>
            <div class="sp-advanced-body">

              <!-- Timer -->
              <div class="sp-section">
                <div class="sp-section-head">Timer</div>
                <div class="sp-toggle-row">
                  <label class="switch">
                    <input type="checkbox" ${this.config.timeMode !== 'none' ? 'checked' : ''}
                           onchange="SetupPage._toggleTimer(this.checked)" id="timer-toggle">
                    <span class="switch-track"></span>
                  </label>
                  <span class="sp-toggle-label">
                    ${this.config.timeMode !== 'none' ? 'Timer enabled' : 'No timer'}
                  </span>
                </div>
                ${this.config.timeMode !== 'none' ? `
                <div class="sp-control-row">
                  <input type="number" class="sp-number-input" value="${this.config.timeMode === 'auto' ? this.config.numQuestions : Math.round((this.config.totalTime || 600) / 60)}"
                         min="1" max="300" onchange="SetupPage._setTime(this.value)" id="time-minutes-input">
                  <span class="sp-hint">minutes</span>
                </div>
                ` : ''}
              </div>

              <!-- Negative Marking -->
              <div class="sp-section">
                <div class="sp-section-head">Negative Marking</div>
                <div class="sp-toggle-row">
                  <label class="switch">
                    <input type="checkbox" ${this.config.negativeMarking ? 'checked' : ''}
                           onchange="SetupPage._toggleNegativeMarking(this.checked)" id="neg-mark-toggle">
                    <span class="switch-track"></span>
                  </label>
                  <span id="neg-mark-status" class="sp-toggle-label">
                    ${this.config.negativeMarking ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div class="neg-mark-options" id="neg-mark-options" style="${this.config.negativeMarking ? '' : 'display:none;'}">
                  <div class="sp-neg-grid">
                    <button class="sp-neg-chip ${this.config.negativeValue === 0.25 ? 'active' : ''}" onclick="SetupPage._setNegValue(0.25)">−0.25</button>
                    <button class="sp-neg-chip ${this.config.negativeValue === 0.33 ? 'active' : ''}" onclick="SetupPage._setNegValue(0.33)">−0.33</button>
                    <button class="sp-neg-chip ${this.config.negativeValue === 0.50 ? 'active' : ''}" onclick="SetupPage._setNegValue(0.50)">−0.50</button>
                    <button class="sp-neg-chip ${this.config.negativeValue === 1 ? 'active' : ''}" onclick="SetupPage._setNegValue(1.00)">−1.00</button>
                  </div>
                </div>
              </div>

            </div>
          </details>

          <!-- Summary -->
          <div class="sp-summary" id="setup-summary">
            ${this._renderSummary()}
          </div>

          <!-- Actions -->
          <div class="sp-actions">
            <button class="btn btn-primary btn-lg btn-block" onclick="SetupPage.startTest()" id="start-test-btn">
              Start Test →
            </button>
            <button class="btn btn-ghost" onclick="App.navigate('home')">
              ← Back
            </button>
          </div>
        `}

        </div>
      </div>
    `;
  },

  /** Render preset exam info card */
  _renderPresetInfo(preset) {
    return `
      <div class="sp-preset-card">
        <div class="sp-preset-top">
          <div class="sp-preset-badge">${preset.category}</div>
          <h2 class="sp-preset-name">${preset.name}</h2>
        </div>

        <div class="sp-preset-tags">
          <span class="sp-ptag">
            ${Icons.get('listChecks', 12)}
            ${preset.totalQuestions} Questions
          </span>
          <span class="sp-ptag">
            ${Icons.get('clock', 12)}
            ${ExamPresets.formatTime(preset.totalTime)}
          </span>
          <span class="sp-ptag ${preset.negativeMarking ? 'sp-ptag-neg' : ''}">
            ${Icons.get(preset.negativeMarking ? 'minus' : 'check', 12)}
            ${ExamPresets.formatNeg(preset)}
          </span>
          ${preset.marksPerQuestion > 1 ? `
          <span class="sp-ptag">
            ${Icons.get('zap', 12)}
            +${preset.marksPerQuestion}/correct
          </span>` : ''}
        </div>

        <div class="sp-preset-sections">
          <div class="sp-ps-title">Sections</div>
          ${preset.sections.map(s => `
            <div class="sp-ps-row">
              <span class="sp-ps-icon">${Helpers.getSubjectIcon(s.subject)}</span>
              <span class="sp-ps-name">${s.name}</span>
              <span class="sp-ps-count">${s.questions}Q</span>
            </div>
          `).join('')}
        </div>

        <div class="sp-preset-note">
          ${Icons.get('zap', 12)}
          Exact ${preset.name} exam pattern — Timer strict, marking enforced
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
      <div class="sp-sum-row">
        <span class="sp-sum-icon">${Icons.get('bookOpen', 14)}</span>
        <span class="sp-sum-label">${Lang.t('setup_summary_subject')}</span>
        <span class="sp-sum-value">${subjectText}</span>
      </div>
      <div class="sp-sum-row">
        <span class="sp-sum-icon">${Icons.get('listChecks', 14)}</span>
        <span class="sp-sum-label">${Lang.t('setup_summary_questions')}</span>
        <span class="sp-sum-value">${this.config.numQuestions}</span>
      </div>
      <div class="sp-sum-row">
        <span class="sp-sum-icon">${Icons.get('clock', 14)}</span>
        <span class="sp-sum-label">${Lang.t('setup_summary_time')}</span>
        <span class="sp-sum-value">${timeText}</span>
      </div>
      <div class="sp-sum-row">
        <span class="sp-sum-icon">${Icons.get('minus', 14)}</span>
        <span class="sp-sum-label">${Lang.t('setup_summary_neg')}</span>
        <span class="sp-sum-value">${this.config.negativeMarking ? '\u2212' + this.config.negativeValue : 'OFF'}</span>
      </div>
    `;
  },

  // ── Input handlers (unchanged logic) ──

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

    if (this.config.timeMode === 'auto') {
      this.config.totalTime = num * 60;
      const timeInput = document.getElementById('time-minutes-input');
      if (timeInput) timeInput.value = num;
    }

    const summary = document.getElementById('setup-summary');
    if (summary) summary.innerHTML = this._renderSummary();
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
    document.getElementById('app').innerHTML = App._renderHeader('setup') + this.render();
  },

  setConfig(key, value) {
    this.config[key] = value;
    const summary = document.getElementById('setup-summary');
    if (summary) summary.innerHTML = this._renderSummary();
  },

  _toggleNegativeMarking(checked) {
    this.config.negativeMarking = checked;
    const optionsEl = document.getElementById('neg-mark-options');
    const statusEl = document.getElementById('neg-mark-status');
    if (optionsEl) optionsEl.style.display = checked ? '' : 'none';
    if (statusEl) statusEl.textContent = checked ? Lang.t('setup_enabled') : Lang.t('setup_disabled');
    const summary = document.getElementById('setup-summary');
    if (summary) summary.innerHTML = this._renderSummary();
  },

  _setNegValue(val) {
    this.config.negativeValue = val;
    document.querySelectorAll('.sp-neg-chip').forEach(chip => {
      const chipVal = parseFloat(chip.querySelector('.sp-neg-val').textContent.replace('\u2212', ''));
      chip.classList.toggle('active', Math.abs(chipVal - val) < 0.01);
    });
    const summary = document.getElementById('setup-summary');
    if (summary) summary.innerHTML = this._renderSummary();
  },

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

    const chipsContainer = document.getElementById('subject-chips');
    if (chipsContainer) {
      const buttons = chipsContainer.querySelectorAll('.setup-chip');
      buttons.forEach(btn => {
        const subj = btn.getAttribute('data-subject');
        if (subj === 'all') {
          btn.classList.toggle('active', this.config.subjects.length === 0);
        } else {
          btn.classList.toggle('active', this.config.subjects.includes(subj));
        }
      });
    }

    const summary = document.getElementById('setup-summary');
    if (summary) summary.innerHTML = this._renderSummary();
  },

  async startTest() {
    const startBtn = document.getElementById('start-test-btn');
    if (!startBtn) return;

    const originalText = startBtn.innerHTML;

    startBtn.disabled = true;
    startBtn.innerHTML = `<span class="spinner" style="width:16px;height:16px;"></span> Loading...`;

    try {
      const timePerQuestion = this.config.timeMode === 'auto' ? 60 : 0;
      const totalTime = this.config.timeMode === 'none'
        ? 99999
        : this.config.timeMode === 'manual'
          ? (this.config.totalTime || 600)
          : null;

      // Fetch questions — section-wise for presets, random for custom
      const preset = this.config.examId ? ExamPresets.get(this.config.examId) : null;
      let fetchedQuestions;

      if (preset && preset.sections && preset.sections.length > 0 && window.fetchSectionWiseQuestions) {
        fetchedQuestions = await window.fetchSectionWiseQuestions({
          sections: preset.sections,
          totalQuestions: this.config.numQuestions,
          subjects: this.config.subjects
        });
      } else {
        fetchedQuestions = await window.fetchRandomQuestions({
          limit: this.config.numQuestions,
          subjects: this.config.subjects
        });
      }

      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        throw new Error('No questions found. Check database or subject filter.');
      }

      const result = TestEngine.createTest({
        ...this.config,
        questions: fetchedQuestions,
        timePerQuestion,
        totalTime
      });

      if (result.error) {
        throw new Error(result.error);
      }

      Helpers.showToast('Test started! ' + result.questionCount + ' questions', 'success');
      App.navigate('test');

    } catch (err) {
      Helpers.showToast(err.message, 'error');
      startBtn.disabled = false;
      startBtn.innerHTML = originalText;
    }
  },

  startMistakeTest() {
    const book = Storage.getMistakeBook();
    if (book.length === 0) {
      Helpers.showToast('No questions in your Mistake Book', 'error');
      return;
    }

    // Shuffle questions
    const questions = [...book].sort(() => Math.random() - 0.5);
    
    // Limit to max 25 questions for revision efficiency
    const limit = Math.min(questions.length, 25);
    const selected = questions.slice(0, limit);

    const result = TestEngine.createTest({
      subjects: Array.from(new Set(selected.map(q => q.subject))),
      numQuestions: selected.length,
      questions: selected,
      timePerQuestion: 60,
      totalTime: 60 * selected.length,
      negativeMarking: false,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      examId: 'mistake_book',
      examName: 'Mistake Book Revision'
    });

    if (result.error) {
      Helpers.showToast(result.error, 'error');
      return;
    }

    Helpers.showToast(`Started Mistake Revision Test! ${result.questionCount} questions`, 'success');
    App.navigate('test');
  },

  clearMistakeBook() {
    if (confirm('Are you sure you want to clear your Mistake Book? All saved incorrect/skipped questions will be deleted.')) {
      Storage.clearMistakeBook();
      Helpers.showToast('Mistake Book cleared!', 'success');
      App.navigate('setup');
    }
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent("page_view", { page: "setup_v3" });
  }
};
