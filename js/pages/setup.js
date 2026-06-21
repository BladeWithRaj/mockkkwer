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
      <div class="setup-page page-enter-v3">

        ${!preset ? `
        <!-- ═══ Custom Test Header ═══ -->
        <div class="sp-header">
          <div class="sp-header-icon">${Icons.get('sliders', 28)}</div>
          <h1>${Lang.t('setup_title')}</h1>
          <p>${Lang.t('setup_subtitle')}</p>
        </div>
        ` : ''}

        ${!preset && bookCount > 0 ? `
        <!-- ═══ Mistake Book Card ═══ -->
        <div class="sp-preset-card mistake-book-card animate-fadeInUp" style="border: 1px solid rgba(239, 68, 68, 0.25); background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(0, 0, 0, 0) 100%); margin-bottom: 24px; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="color: #ef4444; display: flex; align-items: center;">${Icons.get('bookmark', 18)}</span>
              <h3 style="margin: 0; font-size: 1.1rem; color: #fff; font-weight: 600;">Mistake Book Playlist</h3>
            </div>
            <span style="background: rgba(239, 68, 68, 0.2); color: #f87171; padding: 2px 8px; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; font-family: var(--font-mono);">
              ${bookCount} Questions
            </span>
          </div>
          <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">
            Practice specifically the questions you answered incorrectly or skipped in previous tests to convert your weaknesses into strengths.
          </p>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="sp-start-btn" onclick="SetupPage.startMistakeTest()" style="margin: 0; padding: 8px 16px; font-size: 0.875rem; background: var(--error); border-color: var(--error); color: #fff; width: auto; flex: 1; min-width: 150px; justify-content: center; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">
              ${Icons.get('play', 14)}
              <span style="margin-left: 6px;">Start Revision Test</span>
            </button>
            <button class="sp-back-btn" onclick="SetupPage.clearMistakeBook()" style="margin: 0; padding: 8px 16px; font-size: 0.875rem; width: auto; color: var(--error); border-color: rgba(239, 68, 68, 0.2); justify-content: center;">
              ${Icons.get('trash', 14)}
              <span style="margin-left: 6px;">Clear Book</span>
            </button>
          </div>
        </div>
        ` : ''}

        ${preset ? this._renderPresetInfo(preset) : ''}

        <div class="setup-form">
          ${!preset ? `
          <!-- ═══ Subject Selection ═══ -->
          <div class="sp-section">
            <div class="sp-section-head">
              ${Icons.get('bookOpen', 16)}
              <span>${Lang.t('setup_subject')}</span>
            </div>
            <div class="setup-chips" id="subject-chips">
              <button class="setup-chip ${this.config.subjects.length === 0 ? 'active' : ''}" data-subject="all"
                      onclick="SetupPage._toggleSubject('all')" id="chip-all">
                ${Icons.get('dices', 14)}
                <span>${Lang.t('setup_all_subjects')}</span>
              </button>
              ${subjects.map(s => `
                <button class="setup-chip ${this.config.subjects.includes(s) ? 'active' : ''}" data-subject="${s}"
                        onclick="SetupPage._toggleSubject('${s}')" id="chip-${s}">
                  ${Helpers.getSubjectIcon(s)}
                  <span>${s.charAt(0).toUpperCase() + s.slice(1)}</span>
                </button>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${!preset ? `
          <!-- ═══ Question Count ═══ -->
          <div class="sp-section">
            <div class="sp-section-head">
              ${Icons.get('listChecks', 16)}
              <span>${Lang.t('setup_questions')}</span>
            </div>
            <div class="sp-control-row">
              <input type="number" class="sp-number-input"
                     value="${this.config.numQuestions}"
                     min="5" max="200" step="1" placeholder="e.g. 25"
                     onchange="SetupPage._setNumQuestions(this.value)"
                     id="num-questions-input">
              <span class="sp-hint">${Lang.t('setup_questions_hint')}</span>
            </div>
            <div class="sp-quick-chips">
              <button class="sp-qchip" onclick="document.getElementById('num-questions-input').value=10; SetupPage._setNumQuestions(10)">10</button>
              <button class="sp-qchip" onclick="document.getElementById('num-questions-input').value=25; SetupPage._setNumQuestions(25)">25</button>
              <button class="sp-qchip" onclick="document.getElementById('num-questions-input').value=50; SetupPage._setNumQuestions(50)">50</button>
              <button class="sp-qchip" onclick="document.getElementById('num-questions-input').value=100; SetupPage._setNumQuestions(100)">100</button>
            </div>
          </div>
          ` : ''}

          ${!preset ? `
          <!-- ═══ Timer Settings ═══ -->
          <div class="sp-section">
            <div class="sp-section-head">
              ${Icons.get('timer', 16)}
              <span>${Lang.t('setup_time')}</span>
            </div>
            <div class="sp-toggle-row">
              <label class="switch">
                <input type="checkbox" ${this.config.timeMode !== 'none' ? 'checked' : ''}
                       onchange="SetupPage._toggleTimer(this.checked)"
                       id="timer-toggle">
                <span class="switch-track"></span>
              </label>
              <span class="sp-toggle-label">
                ${this.config.timeMode !== 'none' ? Lang.t('setup_timer_on') : Lang.t('setup_no_timer')}
              </span>
            </div>
            ${this.config.timeMode !== 'none' ? `
              <div class="sp-control-row">
                <input type="number" class="sp-number-input"
                       value="${this.config.timeMode === 'auto' ? this.config.numQuestions : Math.round((this.config.totalTime || 600) / 60)}"
                       min="1" max="300" step="1" placeholder="e.g. 30"
                       onchange="SetupPage._setTime(this.value)"
                       id="time-minutes-input">
                <span class="sp-hint">${Lang.t('setup_time_hint')}</span>
              </div>
              <div class="sp-quick-chips">
                <button class="sp-qchip" onclick="document.getElementById('time-minutes-input').value=10; SetupPage._setTime(10)">10m</button>
                <button class="sp-qchip" onclick="document.getElementById('time-minutes-input').value=30; SetupPage._setTime(30)">30m</button>
                <button class="sp-qchip" onclick="document.getElementById('time-minutes-input').value=60; SetupPage._setTime(60)">60m</button>
                <button class="sp-qchip" onclick="document.getElementById('time-minutes-input').value=120; SetupPage._setTime(120)">2h</button>
              </div>
            ` : ''}
          </div>
          ` : ''}

          ${!preset ? `
          <!-- ═══ Negative Marking ═══ -->
          <div class="sp-section">
            <div class="sp-section-head">
              ${Icons.get('minus', 16)}
              <span>${Lang.t('setup_neg_marking')}</span>
            </div>
            <div class="sp-toggle-row">
              <label class="switch">
                <input type="checkbox" ${this.config.negativeMarking ? 'checked' : ''}
                       onchange="SetupPage._toggleNegativeMarking(this.checked)"
                       id="neg-mark-toggle">
                <span class="switch-track"></span>
              </label>
              <span id="neg-mark-status" class="sp-toggle-label">
                ${this.config.negativeMarking ? Lang.t('setup_enabled') : Lang.t('setup_disabled')}
              </span>
            </div>
            <div class="neg-mark-options" id="neg-mark-options" style="${this.config.negativeMarking ? '' : 'display:none;'}">
              <div class="sp-neg-grid">
                <button class="sp-neg-chip ${this.config.negativeValue === 0.25 ? 'active' : ''}" onclick="SetupPage._setNegValue(0.25)">
                  <span class="sp-neg-val">${'\u2212'}0.25</span>
                  <span class="sp-neg-label">SSC</span>
                </button>
                <button class="sp-neg-chip ${this.config.negativeValue === 0.33 ? 'active' : ''}" onclick="SetupPage._setNegValue(0.33)">
                  <span class="sp-neg-val">${'\u2212'}0.33</span>
                  <span class="sp-neg-label">Railway / UPSC</span>
                </button>
                <button class="sp-neg-chip ${this.config.negativeValue === 0.50 ? 'active' : ''}" onclick="SetupPage._setNegValue(0.50)">
                  <span class="sp-neg-val">${'\u2212'}0.50</span>
                  <span class="sp-neg-label">Banking</span>
                </button>
                <button class="sp-neg-chip ${this.config.negativeValue === 0.66 ? 'active' : ''}" onclick="SetupPage._setNegValue(0.66)">
                  <span class="sp-neg-val">${'\u2212'}0.66</span>
                  <span class="sp-neg-label">CTET</span>
                </button>
                <button class="sp-neg-chip ${this.config.negativeValue === 1 ? 'active' : ''}" onclick="SetupPage._setNegValue(1.00)">
                  <span class="sp-neg-val">${'\u2212'}1.00</span>
                  <span class="sp-neg-label">Full</span>
                </button>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- ═══ Summary ═══ -->
          <div class="sp-summary" id="setup-summary">
            ${this._renderSummary()}
          </div>

        </div>

        <!-- ═══ Actions ═══ -->
        <div class="sp-actions">
          <button class="sp-start-btn"
                  onclick="SetupPage.startTest()" id="start-test-btn">
            ${Icons.get('rocket', 18)}
            <span>${preset ? 'Start ' + preset.name + ' Test' : Lang.t('setup_start')}</span>
          </button>

          <button class="sp-back-btn" onclick="App.navigate('home')">
            ${Icons.get('arrowLeft', 14)}
            <span>${Lang.t('setup_back')}</span>
          </button>
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
