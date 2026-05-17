// ============================================
// BANKING RENDERER — IBPS/SBI Authentic
// Enterprise assessment feel:
// - Sectional timers (per-section countdown)
// - Section locking (can't go back)
// - On-screen calculator
// - Keyboard-first navigation (1-4, arrows)
// - Compact, corporate UI
// ============================================

const BankingRenderer = {
  get _visitedQuestions() { return RendererBase._visitedQuestions; },
  get _showingInstructions() { return RendererBase._showingInstructions; },
  set _showingInstructions(v) { RendererBase._showingInstructions = v; },
  get _lockedSections() { return RendererBase._lockedSections; },
  _getPreset() { return RendererBase._getPreset(); },
  _getCandidateName() { return RendererBase._getCandidateName(); },
  _getCandidateRoll() { return RendererBase._getCandidateRoll(); },
  markVisited(idx) { RendererBase.markVisited(idx); },
  isVisited(idx) { return RendererBase.isVisited(idx); },
  isShowingInstructions() { return RendererBase.isShowingInstructions(); },
  toggleBeginBtn() { RendererBase.toggleBeginBtn(); },
  beginTest() { RendererBase.beginTest(); },
  resetState() {
    RendererBase.resetState();
    this._calcOpen = false;
    this._calcDisplay = '0';
    this._sectionTimers = {};
    this._keyboardBound = false;
  },
  jumpToSection(subject) { RendererBase.jumpToSection(subject); },
  toggleMobilePalette() { RendererBase.toggleMobilePalette(); },
  updateViolationBadge() { RendererBase.updateViolationBadge(); },

  // ── Banking-specific state ──
  _calcOpen: false,
  _calcDisplay: '0',
  _sectionTimers: {},  // { subject: remainingSeconds }
  _keyboardBound: false,

  // ══════════════════════════════════════
  //  INSTRUCTIONS
  // ══════════════════════════════════════

  renderInstructions() {
    const preset = this._getPreset();
    if (!preset) return '';
    const sections = preset.sections || [];
    const hasSectionTimers = preset.sectionTimers || false;

    return `
    <div class="ibps-mode" id="ibps-container">
      <div class="ibps-header">
        <div class="ibps-header-left">
          <span class="ibps-logo">🏦 IBPS Online Examination</span>
          <span class="ibps-exam-name">${preset.fullName || preset.name}</span>
        </div>
        <div class="ibps-header-right">
          <span class="ibps-candidate">Candidate: <strong>${this._getCandidateName()}</strong></span>
          <span class="ibps-profile">👤</span>
        </div>
      </div>
      <div class="ibps-instructions">
        <div class="ibps-instructions-header">📋 Examination Instructions</div>
        <div class="ibps-instructions-body">
          <h4>Exam Pattern</h4>
          <table class="ibps-inst-table">
            <thead><tr><th>Section</th><th>Questions</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              ${sections.map(s => {
                const time = hasSectionTimers && s.sectionTime
                  ? Math.round(s.sectionTime / 60) + ' min'
                  : Math.round(preset.totalTime / sections.length / 60) + ' min';
                return `<tr><td>${s.name}</td><td>${s.questions}</td><td>${time}</td><td>Pending</td></tr>`;
              }).join('')}
            </tbody>
          </table>

          <h4>Important Rules</h4>
          <ul class="ibps-rules-list">
            ${hasSectionTimers ? '<li><strong>⏱️ Sectional Timer:</strong> Each section has a <strong>separate time limit</strong>. When the timer expires, the section auto-submits and you move to the next section.</li>' : ''}
            ${preset.sectionLocking ? '<li><strong>🔒 Section Locking:</strong> Once you move to the next section, you <strong>cannot return</strong> to the previous section.</li>' : ''}
            <li>Marks: <strong>+${preset.marksPerQuestion}</strong> for correct, ${preset.negativeMarking ? '<strong>-' + preset.negativeValue + '</strong> for wrong' : 'No negative marking'}.</li>
            ${preset.calculator ? '<li><strong>🧮 Calculator:</strong> An on-screen calculator is available during the exam.</li>' : ''}
            <li><strong>⌨️ Keyboard Shortcuts:</strong> Press <kbd>1</kbd>-<kbd>4</kbd> for options, <kbd>→</kbd>/<kbd>←</kbd> for navigation, <kbd>C</kbd> to clear.</li>
          </ul>

          <h4>Question Status Legend</h4>
          <div class="ibps-status-legend">
            <div class="ibps-status-item"><span class="ibps-dot ibps-dot-answered"></span> Answered</div>
            <div class="ibps-status-item"><span class="ibps-dot ibps-dot-not-answered"></span> Not Answered</div>
            <div class="ibps-status-item"><span class="ibps-dot ibps-dot-not-visited"></span> Not Visited</div>
            <div class="ibps-status-item"><span class="ibps-dot ibps-dot-marked"></span> Marked for Review</div>
          </div>
        </div>
        <div class="ibps-instructions-footer">
          <label class="ibps-agree-wrap">
            <input type="checkbox" id="cbt-agree-check" onchange="BankingRenderer.toggleBeginBtn()">
            I have read and understood the instructions. I agree to the examination rules.
          </label>
          <button class="ibps-begin-btn" id="cbt-begin-btn" disabled onclick="BankingRenderer.beginTest()">
            Begin Examination →
          </button>
        </div>
      </div>
    </div>`;
  },

  // ══════════════════════════════════════
  //  TEST SCREEN
  // ══════════════════════════════════════

  // ── Bilingual helpers ──
  _renderQuestionText(q) {
    const mode = typeof Lang !== 'undefined' ? Lang.questionLang : 'en';
    if (mode === 'bilingual') {
      return `<div class="qlang-en">${q.questionEN || q.question}</div><hr class="qlang-divider"><div class="qlang-hi">${q.questionHI || q.questionEN || q.question}</div>`;
    } else if (mode === 'hi') { return q.questionHI || q.questionEN || q.question; }
    return q.questionEN || q.question;
  },
  _renderOptionText(q, i) {
    const mode = typeof Lang !== 'undefined' ? Lang.questionLang : 'en';
    const en = (q.optionsEN || q.options)[i] || '';
    const hi = (q.optionsHI || q.optionsEN || q.options)[i] || en;
    if (mode === 'bilingual') return `<span class="qlang-en">${en}</span><span class="qlang-hi" style="display:block;color:#888;font-size:0.9em;margin-top:2px;">${hi}</span>`;
    if (mode === 'hi') return hi;
    return en;
  },

  renderTest() {
    if (!TestEngine.state) return '';
    const preset = this._getPreset();
    const current = TestEngine.getCurrentQuestion();
    const q = current.question;
    const sections = preset?.sections || [];
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const stats = RendererBase._getStats();
    const navStatus = TestEngine.getNavStatus();
    this.markVisited(current.index);

    // Init section timers if needed
    if (preset?.sectionTimers && Object.keys(this._sectionTimers).length === 0) {
      this._initSectionTimers(sections);
    }

    // Current section info
    const currentSection = sections.find(s => s.subject === q.subject);
    const sectionTimeStr = preset?.sectionTimers && currentSection?.sectionTime
      ? `<div class="ibps-section-timer" id="ibps-section-timer">⏱ ${Helpers.formatTime(this._sectionTimers[q.subject] || currentSection.sectionTime)}</div>`
      : '';

    return `
    <div class="ibps-mode" id="ibps-container">
      <!-- Header -->
      <div class="ibps-header">
        <div class="ibps-header-left">
          <span class="ibps-logo-sm">🏦</span>
          <span class="ibps-exam-label">${preset ? (preset.fullName || preset.name) : 'Exam'}</span>
        </div>
        <div class="ibps-header-right">
          ${TestEngine.state.totalTime < 99999 ? `<div class="ibps-timer" id="cbt-timer">${Helpers.formatTime(TestEngine.state.timeRemaining)}</div>` : ''}
          ${sectionTimeStr}
          ${preset?.calculator ? `<button class="ibps-calc-btn" onclick="BankingRenderer.toggleCalculator()" title="Calculator (Alt+C)">🧮</button>` : ''}
          <button class="ibps-submit-btn" onclick="BankingRenderer.showSubmitModal()" id="cbt-submit-btn">Submit</button>
        </div>
      </div>

      <!-- Section Bar with locking indicators -->
      ${sections.length > 1 ? `
      <div class="ibps-section-bar" id="cbt-section-bar">
        ${sections.map((s, si) => {
          const isActive = q.subject === s.subject;
          const isLocked = this._lockedSections.has(s.subject);
          const lockIcon = isLocked ? '🔒 ' : '';
          const sTime = preset?.sectionTimers && s.sectionTime
            ? ` (${Math.round((this._sectionTimers[s.subject] || s.sectionTime) / 60)}m)`
            : '';
          return `<button class="ibps-section-tab ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}"
                    onclick="BankingRenderer.jumpToSection('${s.subject}')"
                    ${isLocked ? 'disabled' : ''}>
                    ${lockIcon}${s.name}${sTime}
                  </button>`;
        }).join('')}
      </div>` : ''}

      <!-- Body -->
      <div class="ibps-body">
        <!-- Question Panel -->
        <div class="ibps-question-panel">
          <div class="ibps-question-info">
            <span class="ibps-q-number">Q.${current.index + 1}/${current.total}</span>
            <span class="ibps-q-section">${currentSection?.name || q.subject}</span>
            <span class="ibps-q-marks">+${preset?.marksPerQuestion || 1} / ${preset?.negativeMarking ? '-' + preset.negativeValue : '0'}</span>
          </div>
          ${typeof Lang !== 'undefined' ? Lang.renderQuestionLangToggle() : ''}
          <div class="ibps-question-content" id="cbt-question-content">
            <div class="ibps-question-text">${this._renderQuestionText(q)}</div>
            <div class="ibps-options" id="cbt-options">
              ${(q.optionsEN || q.options).map((opt, i) => `
                <div class="ibps-option ${current.selectedAnswer === i ? 'selected' : ''}"
                     onclick="TestPage.selectOption(${i})" id="cbt-opt-${i}">
                  <span class="ibps-radio ${current.selectedAnswer === i ? 'checked' : ''}"></span>
                  <span class="ibps-option-label">${labels[i]}.</span>
                  <span class="ibps-option-text">${this._renderOptionText(q, i)}</span>
                  <span class="ibps-kbd-hint">${i + 1}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="ibps-action-bar">
            <div class="ibps-action-left">
              <button class="ibps-btn ibps-btn-clear" onclick="TestPage.clearAnswer()">Clear Response</button>
              <button class="ibps-btn ibps-btn-review ${current.isMarkedForReview ? 'active' : ''}" onclick="TestPage.toggleReview()">
                ${current.isMarkedForReview ? '★ Marked' : '☆ Mark for Review'}
              </button>
            </div>
            <div class="ibps-action-right">
              <button class="ibps-btn ibps-btn-prev" onclick="TestPage.prev()" ${current.index === 0 ? 'disabled' : ''}>← Previous</button>
              <button class="ibps-btn ibps-btn-next" onclick="TestPage.next()">
                ${current.index === current.total - 1 ? 'Submit' : 'Save & Next →'}
              </button>
            </div>
          </div>
        </div>

        <!-- Palette -->
        <div class="ibps-palette" id="cbt-palette">
          <div class="ibps-palette-header">Question Palette</div>
          <div class="ibps-legend">
            <div class="ibps-legend-item"><span class="ibps-legend-dot answered">${stats.answered}</span>Answered</div>
            <div class="ibps-legend-item"><span class="ibps-legend-dot not-answered">${Math.max(0, stats.visited - stats.answered - stats.reviewed)}</span>Not Ans</div>
            <div class="ibps-legend-item"><span class="ibps-legend-dot not-visited">${stats.notVisited}</span>Not Visited</div>
            <div class="ibps-legend-item"><span class="ibps-legend-dot marked">${stats.reviewed}</span>Marked</div>
          </div>
          <div class="ibps-q-grid" id="cbt-q-grid">
            ${navStatus.map((ns, i) => `<button class="ibps-q-btn${RendererBase._getNavBtnClass(ns, i)}" onclick="TestPage.goTo(${i})">${i + 1}</button>`).join('')}
          </div>
        </div>
      </div>

      <!-- Calculator -->
      ${preset?.calculator ? this._renderCalculator() : ''}

      <!-- Mobile Bar -->
      <button class="ibps-mobile-toggle" onclick="BankingRenderer.toggleMobilePalette()" style="display:none;">☰</button>
      <div class="ibps-mobile-bar" style="display:none;">
        <button class="ibps-btn" onclick="TestPage.prev()" ${current.index === 0 ? 'disabled' : ''}>←</button>
        <button class="ibps-btn" onclick="BankingRenderer.toggleMobilePalette()">${current.index + 1}/${current.total}</button>
        <button class="ibps-btn ibps-btn-next" onclick="TestPage.next()">${current.index === current.total - 1 ? 'Submit' : 'Next →'}</button>
      </div>
    </div>`;
  },

  // ══════════════════════════════════════
  //  CALCULATOR (Draggable widget)
  // ══════════════════════════════════════

  _renderCalculator() {
    return `
    <div class="ibps-calculator" id="ibps-calculator" style="display:none;">
      <div class="ibps-calc-header">
        <span>🧮 Calculator</span>
        <button onclick="BankingRenderer.toggleCalculator()">✕</button>
      </div>
      <div class="ibps-calc-display" id="ibps-calc-display">0</div>
      <div class="ibps-calc-grid">
        <button onclick="BankingRenderer.calcInput('7')">7</button>
        <button onclick="BankingRenderer.calcInput('8')">8</button>
        <button onclick="BankingRenderer.calcInput('9')">9</button>
        <button class="ibps-calc-op" onclick="BankingRenderer.calcInput('/')">÷</button>
        <button onclick="BankingRenderer.calcInput('4')">4</button>
        <button onclick="BankingRenderer.calcInput('5')">5</button>
        <button onclick="BankingRenderer.calcInput('6')">6</button>
        <button class="ibps-calc-op" onclick="BankingRenderer.calcInput('*')">×</button>
        <button onclick="BankingRenderer.calcInput('1')">1</button>
        <button onclick="BankingRenderer.calcInput('2')">2</button>
        <button onclick="BankingRenderer.calcInput('3')">3</button>
        <button class="ibps-calc-op" onclick="BankingRenderer.calcInput('-')">−</button>
        <button onclick="BankingRenderer.calcInput('0')">0</button>
        <button onclick="BankingRenderer.calcInput('.')">.</button>
        <button class="ibps-calc-eq" onclick="BankingRenderer.calcEval()">=</button>
        <button class="ibps-calc-op" onclick="BankingRenderer.calcInput('+')">+</button>
        <button class="ibps-calc-clear" onclick="BankingRenderer.calcClear()" style="grid-column:span 2;">C</button>
        <button class="ibps-calc-clear" onclick="BankingRenderer.calcBackspace()" style="grid-column:span 2;">⌫</button>
        <button onclick="BankingRenderer.calcInput('(')">(</button>
        <button onclick="BankingRenderer.calcInput(')')">)</button>
        <button onclick="BankingRenderer.calcPercent()">%</button>
        <button class="ibps-calc-op" onclick="BankingRenderer.calcSqrt()">√</button>
      </div>
    </div>`;
  },

  // ══════════════════════════════════════
  //  CALCULATOR LOGIC
  // ══════════════════════════════════════

  toggleCalculator() {
    const el = document.getElementById('ibps-calculator');
    if (el) {
      this._calcOpen = !this._calcOpen;
      el.style.display = this._calcOpen ? 'block' : 'none';
    }
  },

  calcInput(v) {
    if (this._calcDisplay === '0' && v !== '.' && v !== '(' && v !== ')') this._calcDisplay = '';
    this._calcDisplay += v;
    this._updateCalcDisplay();
  },

  calcClear() {
    this._calcDisplay = '0';
    this._updateCalcDisplay();
  },

  calcBackspace() {
    this._calcDisplay = this._calcDisplay.slice(0, -1) || '0';
    this._updateCalcDisplay();
  },

  calcPercent() {
    try {
      const val = eval(this._calcDisplay);
      this._calcDisplay = String(val / 100);
    } catch { this._calcDisplay = 'Error'; }
    this._updateCalcDisplay();
  },

  calcSqrt() {
    try {
      const val = eval(this._calcDisplay);
      this._calcDisplay = String(Math.sqrt(val));
    } catch { this._calcDisplay = 'Error'; }
    this._updateCalcDisplay();
  },

  calcEval() {
    try {
      this._calcDisplay = String(eval(this._calcDisplay));
    } catch { this._calcDisplay = 'Error'; }
    this._updateCalcDisplay();
  },

  _updateCalcDisplay() {
    const d = document.getElementById('ibps-calc-display');
    if (d) d.textContent = this._calcDisplay;
  },

  // ══════════════════════════════════════
  //  SECTIONAL TIMER
  // ══════════════════════════════════════

  _initSectionTimers(sections) {
    sections.forEach(s => {
      if (s.sectionTime) {
        this._sectionTimers[s.subject] = s.sectionTime;
      }
    });
  },

  /** Called by TestPage timer tick when sectionTimers is enabled */
  tickSectionTimer() {
    const current = TestEngine.getCurrentQuestion();
    if (!current) return;
    const subject = current.question.subject;
    if (this._sectionTimers[subject] !== undefined) {
      this._sectionTimers[subject]--;
      const el = document.getElementById('ibps-section-timer');
      if (el) {
        el.textContent = `⏱ ${Helpers.formatTime(this._sectionTimers[subject])}`;
        if (this._sectionTimers[subject] <= 60) el.classList.add('danger');
        else if (this._sectionTimers[subject] <= 120) el.classList.add('warning');
      }
      // Auto-advance when section time expires
      if (this._sectionTimers[subject] <= 0) {
        this._autoAdvanceSection(subject);
      }
    }
  },

  _autoAdvanceSection(subject) {
    const preset = this._getPreset();
    const sections = preset?.sections || [];
    const currentIdx = sections.findIndex(s => s.subject === subject);
    if (currentIdx < 0) return;

    // Lock current section
    this._lockedSections.add(subject);

    // Move to next section
    if (currentIdx < sections.length - 1) {
      const nextSection = sections[currentIdx + 1];
      Helpers.showToast(`⏱ Section "${sections[currentIdx].name}" time expired. Moving to ${nextSection.name}.`, 'warning');
      this.jumpToSection(nextSection.subject);
    } else {
      // Last section — auto-submit
      Helpers.showToast('⏱ All sections completed. Submitting exam.', 'info');
      TestPage.submitTest();
    }
  },

  // ══════════════════════════════════════
  //  KEYBOARD NAVIGATION
  // ══════════════════════════════════════

  bindKeyboard() {
    if (this._keyboardBound) return;
    this._keyboardBound = true;

    this._keyHandler = (e) => {
      if (!TestEngine.state || TestEngine.state.isSubmitted) return;
      // Don't intercept when typing in calculator
      if (this._calcOpen) return;

      switch (e.key) {
        case '1': case '2': case '3': case '4':
          e.preventDefault();
          TestPage.selectOption(parseInt(e.key) - 1);
          break;
        case 'ArrowRight':
        case 'Enter':
          e.preventDefault();
          TestPage.next();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          TestPage.prev();
          break;
        case 'c':
        case 'C':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            if (e.altKey) {
              this.toggleCalculator();
            } else {
              TestPage.clearAnswer();
            }
          }
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            TestPage.toggleReview();
          }
          break;
      }
    };

    document.addEventListener('keydown', this._keyHandler);
  },

  unbindKeyboard() {
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyboardBound = false;
      this._keyHandler = null;
    }
  },

  // ══════════════════════════════════════
  //  REFRESH METHODS
  // ══════════════════════════════════════

  refreshQuestion() {
    const current = TestEngine.getCurrentQuestion();
    if (!current) return;
    this.markVisited(current.index);
    const q = current.question;
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const preset = this._getPreset();
    const currentSection = preset?.sections?.find(s => s.subject === q.subject);

    const content = document.getElementById('cbt-question-content');
    if (content) {
      content.innerHTML = `
        <div class="ibps-question-text">${this._renderQuestionText(q)}</div>
        <div class="ibps-options" id="cbt-options">
          ${(q.optionsEN || q.options).map((opt, i) => `
            <div class="ibps-option ${current.selectedAnswer === i ? 'selected' : ''}"
                 onclick="TestPage.selectOption(${i})" id="cbt-opt-${i}">
              <span class="ibps-radio ${current.selectedAnswer === i ? 'checked' : ''}"></span>
              <span class="ibps-option-label">${labels[i]}.</span>
              <span class="ibps-option-text">${this._renderOptionText(q, i)}</span>
              <span class="ibps-kbd-hint">${i + 1}</span>
            </div>
          `).join('')}
        </div>`;
    }

    // Update question info
    const qn = document.querySelector('.ibps-q-number');
    if (qn) qn.textContent = `Q.${current.index + 1}/${current.total}`;
    const qs = document.querySelector('.ibps-q-section');
    if (qs) qs.textContent = currentSection?.name || q.subject;
    const pb = document.querySelector('.ibps-btn-prev');
    if (pb) pb.disabled = current.index === 0;
    const nb = document.querySelector('.ibps-action-right .ibps-btn-next');
    if (nb) nb.textContent = current.index === current.total - 1 ? 'Submit' : 'Save & Next →';

    // Update active section tab
    document.querySelectorAll('.ibps-section-tab').forEach(t => t.classList.remove('active'));
    const secs = preset?.sections || [];
    const mi = secs.findIndex(s => s.subject === q.subject);
    const tabs = document.querySelectorAll('.ibps-section-tab');
    if (mi >= 0 && tabs[mi]) tabs[mi].classList.add('active');

    // Bind keyboard if not already bound
    if (preset?.keyboardNav) this.bindKeyboard();
  },

  refreshNav() {
    const grid = document.getElementById('cbt-q-grid');
    if (!grid) return;
    const navStatus = TestEngine.getNavStatus();
    grid.innerHTML = navStatus.map((ns, i) =>
      `<button class="ibps-q-btn${RendererBase._getNavBtnClass(ns, i)}" onclick="TestPage.goTo(${i})">${i + 1}</button>`
    ).join('');

    const stats = RendererBase._getStats();
    const dots = document.querySelectorAll('.ibps-legend-dot');
    if (dots.length >= 4) {
      dots[0].textContent = stats.answered;
      dots[1].textContent = Math.max(0, stats.visited - stats.answered - stats.reviewed);
      dots[2].textContent = stats.notVisited;
      dots[3].textContent = stats.reviewed;
    }
  },

  updateTimer(t, total) {
    const el = document.getElementById('cbt-timer');
    if (el) {
      el.textContent = Helpers.formatTime(t);
      const p = t / total;
      el.classList.remove('warning', 'danger');
      if (p <= 0.10) el.classList.add('danger');
      else if (p <= 0.20) el.classList.add('warning');
    }
    this.updateViolationBadge();

    // Tick section timer if enabled
    const preset = this._getPreset();
    if (preset?.sectionTimers) {
      this.tickSectionTimer();
    }
  },

  showSubmitModal() {
    const d = RendererBase.getSubmitStats();
    if (!d) return;

    const html = `
      <div class="ibps-submit-overlay" id="renderer-submit-modal"
           onclick="if(event.target===this)RendererBase.dismissSubmitModal()">
        <div class="ibps-submit-modal">
          <div class="ibps-submit-modal-header">
            🏦 Examination Summary — ${d.examName}
          </div>
          <div class="ibps-submit-modal-body">
            <table class="ibps-submit-table">
              <thead><tr><th>Section</th><th>Total</th><th>Answered</th><th>Not Answered</th><th>Marked</th><th>Not Visited</th></tr></thead>
              <tbody>
                ${d.sectionStats.map(s => `<tr><td>${s.name}</td><td>${s.total}</td><td class="ibps-cell-green">${s.answered}</td><td class="ibps-cell-red">${s.unanswered}</td><td class="ibps-cell-purple">${s.marked}</td><td>${s.total - s.answered}</td></tr>`).join('')}
                <tr class="ibps-submit-total"><td><strong>Total</strong></td><td><strong>${d.total}</strong></td><td class="ibps-cell-green"><strong>${d.answeredCount}</strong></td><td class="ibps-cell-red"><strong>${d.unansweredCount}</strong></td><td class="ibps-cell-purple"><strong>${d.reviewedCount}</strong></td><td><strong>${d.notVisitedCount}</strong></td></tr>
              </tbody>
            </table>
            ${d.unansweredCount > 0 ? `<div class="ibps-submit-warning">⚠ You have <strong>${d.unansweredCount}</strong> unanswered question${d.unansweredCount > 1 ? 's' : ''}. Are you sure you want to submit?</div>` : ''}
            ${d.violations > 0 ? `<div class="ibps-submit-warning ibps-submit-warning-orange">⚠ ${d.violations} integrity violation${d.violations > 1 ? 's' : ''} recorded.</div>` : ''}
          </div>
          <div class="ibps-submit-modal-footer">
            <button class="ibps-btn" onclick="RendererBase.dismissSubmitModal()">Go Back</button>
            <button class="ibps-btn ibps-btn-confirm" onclick="TestPage.submitTest()">Submit Examination</button>
          </div>
        </div>
      </div>
    `;
    RendererBase.injectModal('ibps-container', html);
  }
};
window.BankingRenderer = BankingRenderer;

