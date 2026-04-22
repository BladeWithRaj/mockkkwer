// ============================================
// TEST SETUP PAGE — Full UX Upgrade
// Live count, smart suggestion, validation,
// glow button, no PYQ
// ============================================

const SetupPage = {
  config: {
    subject: 'all',
    exam: 'all',
    difficulty: 'all',
    numQuestions: 10,
    timeMode: 'auto',
    timePerQuestion: 60,
    totalTime: null,
    negativeMarking: false,
    negativeValue: 0.25
  },

  render(params = {}) {
    // Pre-fill from URL params
    if (params.exam && params.exam !== 'All') this.config.exam = params.exam;
    if (params.subject) this.config.subject = params.subject;
    if (params.mode === 'daily') {
      this.config.numQuestions = 10;
      this.config.timeMode = 'auto';
      this.config.difficulty = 'all';
    }

    const questions = window.QUESTION_BANK || [];
    const subjects = [...new Set(questions.map(q => q.subject))];
    const exams = [...new Set(questions.flatMap(q => q.exam || []))].filter(Boolean);
    const filtered = this._getFilteredQuestions();
    const canStart = filtered.length >= 5;
    const actualCount = Math.min(this.config.numQuestions, filtered.length);

    // Smart suggestion
    let suggestion = '';
    if (filtered.length >= 25) suggestion = '25 questions (optimal)';
    else if (filtered.length >= 15) suggestion = '15 questions';
    else if (filtered.length >= 10) suggestion = '10 questions';
    else if (filtered.length >= 5) suggestion = `${filtered.length} questions (all available)`;

    return `
      <div class="setup-page page-enter">
        <div class="setup-header">
          <h1 class="animate-fadeInDown">Test Setup</h1>
          <p class="animate-fadeInDown stagger-1" style="color: var(--text-secondary); margin-top: var(--space-2);">
            Configure your mock test
          </p>
        </div>

        <div class="setup-form">
          <!-- Subject -->
          <div class="setup-section animate-fadeInUp stagger-1">
            <div class="setup-section-title">📚 Subject</div>
            <div class="setup-chips" id="subject-chips">
              <button class="setup-chip ${this.config.subject === 'all' ? 'active' : ''}"
                      onclick="SetupPage.setConfig('subject', 'all')">All Subjects</button>
              ${subjects.map(s => `
                <button class="setup-chip ${this.config.subject === s ? 'active' : ''}"
                        onclick="SetupPage.setConfig('subject', '${s}')">${Helpers.getSubjectIcon(s)} ${s}</button>
              `).join('')}
            </div>
          </div>

          <!-- Exam -->
          ${exams.length > 0 ? `
          <div class="setup-section animate-fadeInUp stagger-2">
            <div class="setup-section-title">🎯 Exam</div>
            <div class="setup-chips" id="exam-chips">
              <button class="setup-chip ${this.config.exam === 'all' ? 'active' : ''}"
                      onclick="SetupPage.setConfig('exam', 'all')">All Exams</button>
              ${exams.map(e => `
                <button class="setup-chip ${this.config.exam === e ? 'active' : ''}"
                        onclick="SetupPage.setConfig('exam', '${e}')">${e}</button>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Difficulty -->
          <div class="setup-section animate-fadeInUp stagger-3">
            <div class="setup-section-title">📈 Difficulty</div>
            <div class="setup-chips" id="difficulty-chips">
              <button class="setup-chip ${this.config.difficulty === 'all' ? 'active' : ''}"
                      onclick="SetupPage.setConfig('difficulty', 'all')">All Levels</button>
              <button class="setup-chip ${this.config.difficulty === 'easy' ? 'active' : ''}"
                      onclick="SetupPage.setConfig('difficulty', 'easy')">🟢 Easy</button>
              <button class="setup-chip ${this.config.difficulty === 'medium' ? 'active' : ''}"
                      onclick="SetupPage.setConfig('difficulty', 'medium')">🟡 Medium</button>
              <button class="setup-chip ${this.config.difficulty === 'hard' ? 'active' : ''}"
                      onclick="SetupPage.setConfig('difficulty', 'hard')">🔴 Hard</button>
            </div>
          </div>

          <!-- Available Count (Live) -->
          <div class="setup-match-info animate-fadeInUp stagger-4" id="match-info">
            <div class="match-count ${canStart ? '' : 'danger'}">
              <span class="match-number">${filtered.length}</span>
              <span class="match-label">questions match your filters</span>
            </div>
            ${suggestion ? `<div class="match-suggestion">💡 Suggested: ${suggestion}</div>` : ''}
            ${!canStart ? `<div class="match-warning">⚠️ Minimum 5 questions required</div>` : ''}
          </div>

          <!-- Number of Questions -->
          <div class="setup-section animate-fadeInUp stagger-5">
            <div class="setup-section-title">📝 Number of Questions</div>
            <div class="setup-chips" id="count-chips">
              ${[5, 10, 20, 30, 50].map(n => `
                <button class="setup-chip ${this.config.numQuestions === n ? 'active' : ''} ${n > filtered.length ? 'disabled-chip' : ''}"
                        onclick="SetupPage.setConfig('numQuestions', ${Math.min(n, filtered.length)})"
                        ${n > filtered.length ? 'disabled' : ''}>${n}${n > filtered.length ? ` (${filtered.length})` : ''}</button>
              `).join('')}
            </div>
          </div>

          <!-- Time Settings -->
          <div class="setup-section animate-fadeInUp stagger-6">
            <div class="setup-section-title">⏱️ Time</div>
            <div class="setup-chips" id="time-chips">
              <button class="setup-chip ${this.config.timeMode === 'auto' ? 'active' : ''}"
                      onclick="SetupPage.setConfig('timeMode', 'auto')">Auto (1 min/Q)</button>
              <button class="setup-chip ${this.config.timeMode === 'manual' ? 'active' : ''}"
                      onclick="SetupPage.setConfig('timeMode', 'manual')">Manual</button>
              <button class="setup-chip ${this.config.timeMode === 'none' ? 'active' : ''}"
                      onclick="SetupPage.setConfig('timeMode', 'none')">No Timer</button>
            </div>
            ${this.config.timeMode === 'manual' ? `
              <div style="margin-top: var(--space-4); display: flex; align-items: center; gap: var(--space-3);">
                <label class="input-label">Total minutes:</label>
                <input type="number" class="input" style="width: 100px; text-align: center;"
                       value="${Math.round((this.config.totalTime || 600) / 60)}"
                       min="1" max="180"
                       onchange="SetupPage.setConfig('totalTime', parseInt(this.value) * 60)"
                       id="manual-time-input">
              </div>
            ` : ''}
          </div>

          <!-- Negative Marking -->
          <div class="setup-section animate-fadeInUp stagger-7">
            <div class="setup-section-title">⚖️ Negative Marking</div>
            <div class="switch-wrapper">
              <label class="switch">
                <input type="checkbox" ${this.config.negativeMarking ? 'checked' : ''}
                       onchange="SetupPage.setConfig('negativeMarking', this.checked)"
                       id="neg-mark-toggle">
                <span class="switch-track"></span>
              </label>
              <span style="font-size: var(--text-sm); color: var(--text-secondary);">
                ${this.config.negativeMarking ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            ${this.config.negativeMarking ? `
              <div class="neg-mark-config">
                <label class="input-label">Deduction per wrong answer:</label>
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
            ${this._renderSummary(actualCount)}
          </div>

          <!-- Start Button -->
          <button class="btn btn-primary btn-lg btn-block animate-fadeInUp stagger-8 ${canStart ? 'btn-glow' : ''}"
                  onclick="SetupPage.startTest()" id="start-test-submit"
                  ${!canStart ? 'disabled' : ''}>
            ${canStart ? '🚀 Start Test' : '⚠️ Not Enough Questions'}
          </button>

          <button class="btn btn-ghost btn-block" onclick="App.navigate('home')" style="margin-top: var(--space-2);">
            ← Back to Home
          </button>
        </div>
      </div>
    `;
  },

  _getFilteredQuestions() {
    const questions = window.QUESTION_BANK || [];
    return questions.filter(q => {
      if (this.config.subject !== 'all' && q.subject !== this.config.subject) return false;
      if (this.config.exam !== 'all' && !(q.exam && q.exam.includes(this.config.exam))) return false;
      if (this.config.difficulty !== 'all' && q.difficulty !== this.config.difficulty) return false;
      return true;
    });
  },

  _renderSummary(actualCount) {
    const timeText = this.config.timeMode === 'auto'
      ? `${actualCount} min (auto)`
      : this.config.timeMode === 'manual'
        ? `${Math.round((this.config.totalTime || 600) / 60)} min`
        : 'No timer';

    return `
      <div class="summary-row">
        <span class="summary-label">Subject</span>
        <span class="summary-value">${this.config.subject === 'all' ? 'All Subjects' : this.config.subject}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Exam</span>
        <span class="summary-value">${this.config.exam === 'all' ? 'All Exams' : this.config.exam}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Difficulty</span>
        <span class="summary-value">${this.config.difficulty === 'all' ? 'All Levels' : this.config.difficulty}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Questions</span>
        <span class="summary-value">${actualCount}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Time</span>
        <span class="summary-value">${timeText}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">Negative Marking</span>
        <span class="summary-value">${this.config.negativeMarking ? `-${this.config.negativeValue}` : 'OFF'}</span>
      </div>
    `;
  },

  setConfig(key, value) {
    this.config[key] = value;
    // Auto-adjust numQuestions if filtered count drops
    const filtered = this._getFilteredQuestions();
    if (this.config.numQuestions > filtered.length && filtered.length >= 5) {
      this.config.numQuestions = Math.min(this.config.numQuestions, filtered.length);
    }
    document.getElementById('app').innerHTML = App._renderHeader('setup') + this.render();
  },

  startTest() {
    const filtered = this._getFilteredQuestions();
    if (filtered.length < 5) {
      Helpers.showToast('At least 5 questions required', 'error');
      return;
    }

    const timePerQuestion = this.config.timeMode === 'auto' ? 60 : 0;
    const totalTime = this.config.timeMode === 'none'
      ? 99999
      : this.config.timeMode === 'manual'
        ? (this.config.totalTime || 600)
        : null;

    const result = TestEngine.createTest({
      subject: this.config.subject,
      exam: this.config.exam,
      difficulty: this.config.difficulty,
      numQuestions: Math.min(this.config.numQuestions, filtered.length),
      timePerQuestion,
      totalTime,
      negativeMarking: this.config.negativeMarking,
      negativeValue: this.config.negativeValue
    });

    if (result.error) {
      Helpers.showToast(result.error, 'error');
      return;
    }

    Helpers.showToast(`Test started! ${result.questionCount} questions`, 'success');
    App.navigate('test');
  }
};
