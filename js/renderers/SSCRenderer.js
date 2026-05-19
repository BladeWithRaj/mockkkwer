// ============================================
// SSC RENDERER — TCS iON CBT Exact Clone
// ============================================
// Flat blue, white, grey. Radio circles.
// Boring official instructions. Compressed spacing.
// NO gradients, NO glass, NO neon, NO animations.
// ============================================

const SSCRenderer = {
  // Delegate shared state to RendererBase
  get _visitedQuestions() { return RendererBase._visitedQuestions; },
  get _showingInstructions() { return RendererBase._showingInstructions; },
  set _showingInstructions(v) { RendererBase._showingInstructions = v; },
  get _currentSectionIdx() { return RendererBase._currentSectionIdx; },
  set _currentSectionIdx(v) { RendererBase._currentSectionIdx = v; },
  get _lockedSections() { return RendererBase._lockedSections; },

  // Delegate helpers
  _getPreset() { return RendererBase._getPreset(); },
  _getCandidateName() { return RendererBase._getCandidateName(); },
  _getCandidateRoll() { return RendererBase._getCandidateRoll(); },
  markVisited(idx) { RendererBase.markVisited(idx); },
  isVisited(idx) { return RendererBase.isVisited(idx); },
  isShowingInstructions() { return RendererBase.isShowingInstructions(); },
  toggleBeginBtn() { RendererBase.toggleBeginBtn(); },
  beginTest() { RendererBase.beginTest(); },
  resetState() { RendererBase.resetState(); },
  jumpToSection(subject) { RendererBase.jumpToSection(subject); },
  toggleMobilePalette() { RendererBase.toggleMobilePalette(); },
  updateViolationBadge() { RendererBase.updateViolationBadge(); },

  // ── SSC-specific check ──
  shouldUseCBT() {
    const preset = this._getPreset();
    if (!preset) return false;
    const boards = ['SSC', 'Defence', 'State', 'Teaching'];
    return boards.includes(preset.category);
  },

  // ── Dynamic org branding based on category ──
  _getOrgInfo() {
    const preset = this._getPreset();
    const cat = preset?.category || 'SSC';
    const map = {
      'SSC':      { icon: '📋', name: 'Staff Selection Commission', short: 'SSC' },
      'Defence':  { icon: '🎖️', name: 'Ministry of Defence', short: 'MoD' },
      'State':    { icon: '🏛️', name: 'State Public Service Commission', short: 'SPSC' },
      'Teaching': { icon: '📚', name: 'Central Teacher Eligibility Test', short: 'CTET' }
    };
    return map[cat] || map['SSC'];
  },

  // ── Bilingual question text rendering ──
  _renderQuestionText(q) {
    const mode = typeof Lang !== 'undefined' ? Lang.questionLang : 'en';
    if (mode === 'bilingual') {
      return `<div class="qlang-en">${q.questionEN || q.question}</div>
              <hr class="qlang-divider">
              <div class="qlang-hi">${q.questionHI || q.questionEN || q.question}</div>`;
    } else if (mode === 'hi') {
      return q.questionHI || q.questionEN || q.question;
    }
    return q.questionEN || q.question;
  },

  // ── Bilingual options rendering ──
  _renderOptions(q, current, labels) {
    const mode = typeof Lang !== 'undefined' ? Lang.questionLang : 'en';
    const optionsEN = q.optionsEN || q.options;
    const optionsHI = q.optionsHI || q.optionsEN || q.options;

    return optionsEN.map((optEN, i) => {
      const optHI = optionsHI[i] || optEN;
      let displayText = '';
      if (mode === 'bilingual') {
        displayText = `<span class="qlang-en">${optEN}</span><span class="qlang-hi" style="display:block;color:#666;font-size:0.9em;margin-top:2px;">${optHI}</span>`;
      } else if (mode === 'hi') {
        displayText = optHI;
      } else {
        displayText = optEN;
      }
      return `
        <label class="ssc-option ${current.selectedAnswer === i ? 'selected' : ''}"
             onclick="TestPage.selectOption(${i})" id="cbt-opt-${i}">
          <span class="ssc-radio ${current.selectedAnswer === i ? 'checked' : ''}"></span>
          <span class="ssc-option-label">${labels[i]})</span>
          <span class="ssc-option-text">${displayText}</span>
        </label>
      `;
    }).join('');
  },

  // ════════════════════════════════════════════
  //  INSTRUCTION SCREEN — TCS iON Style
  //  Boring, official, government-grade
  // ════════════════════════════════════════════

  renderInstructions() {
    const preset = this._getPreset();
    if (!preset) return '';

    const sections = preset.sections || [];
    const negInfo = preset.negativeMarking
      ? `<li><strong>Negative Marking:</strong> ${preset.negativeValue} marks will be deducted for each wrong answer.</li>`
      : `<li>There is <strong>NO negative marking</strong> in this exam.</li>`;

    const org = this._getOrgInfo();
    return `
    <div class="ssc-mode" id="ssc-container">
      <!-- TCS iON Header -->
      <div class="ssc-header">
        <div class="ssc-header-left">
          <div class="ssc-header-logo">
            <div class="ssc-logo-icon">${org.icon}</div>
            <div class="ssc-logo-text">
              <span class="ssc-org-name">${org.name}</span>
              <span class="ssc-exam-subtitle">${preset.fullName || preset.name}</span>
            </div>
          </div>
        </div>
        <div class="ssc-header-right">
          <div class="ssc-candidate-info">
            <span class="ssc-candidate-label">Candidate:</span>
            <span class="ssc-candidate-name">${this._getCandidateName()}</span>
          </div>
          <div class="ssc-candidate-info">
            <span class="ssc-candidate-label">Roll No:</span>
            <span class="ssc-candidate-name">${this._getCandidateRoll()}</span>
          </div>
          <div class="ssc-profile-photo">
            <span>👤</span>
          </div>
        </div>
      </div>

      <!-- Instructions Panel -->
      <div class="ssc-instructions">
        <div class="ssc-instructions-header">
          <span class="ssc-inst-icon">ℹ</span>
          General Instructions
        </div>
        <div class="ssc-instructions-body">
          <div class="ssc-inst-section">
            <h4>Please read the instructions carefully</h4>
            <ol class="ssc-inst-list">
              <li>Total duration of the examination is <strong>${ExamPresets.formatTime(preset.totalTime)}</strong>.</li>
              <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
              <li>The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:</li>
            </ol>
          </div>

          <div class="ssc-status-legend">
            <div class="ssc-status-item">
              <span class="ssc-status-dot ssc-dot-not-visited"></span>
              You have not visited the question yet.
            </div>
            <div class="ssc-status-item">
              <span class="ssc-status-dot ssc-dot-not-answered"></span>
              You have not answered the question.
            </div>
            <div class="ssc-status-item">
              <span class="ssc-status-dot ssc-dot-answered"></span>
              You have answered the question.
            </div>
            <div class="ssc-status-item">
              <span class="ssc-status-dot ssc-dot-marked"></span>
              You have NOT answered the question, but have marked the question for review.
            </div>
            <div class="ssc-status-item">
              <span class="ssc-status-dot ssc-dot-marked-answered"></span>
              The question(s) "Answered and Marked for Review" will be considered for evaluation.
            </div>
          </div>

          <div class="ssc-inst-section">
            <h4>Exam Pattern</h4>
            <table class="ssc-inst-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>No. of Questions</th>
                  <th>Maximum Marks</th>
                </tr>
              </thead>
              <tbody>
                ${sections.map(s => `
                  <tr>
                    <td>${s.name}</td>
                    <td>${s.questions}</td>
                    <td>${s.questions * (preset.marksPerQuestion || 1)}</td>
                  </tr>
                `).join('')}
                <tr class="ssc-inst-total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>${preset.totalQuestions}</strong></td>
                  <td><strong>${preset.totalQuestions * (preset.marksPerQuestion || 1)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="ssc-inst-section">
            <h4>Marking Scheme</h4>
            <ul class="ssc-inst-list">
              <li>Each question carries <strong>+${preset.marksPerQuestion}</strong> mark(s) for correct answer.</li>
              ${negInfo}
              <li>No marks will be given for unanswered / unattempted questions.</li>
            </ul>
          </div>

          <div class="ssc-inst-section">
            <h4>Navigating to a Question</h4>
            <ul class="ssc-inst-list">
              <li>To answer a question, click on the question number in the Question Palette at the right of your screen.</li>
              <li>You can use <strong>"Save & Next"</strong> to save your answer and go to the next question.</li>
              <li>You can use <strong>"Mark for Review & Next"</strong> to mark the question for review and go to the next question.</li>
              <li>Click <strong>"Clear Response"</strong> to clear your saved answer.</li>
            </ul>
          </div>
        </div>

        <div class="ssc-instructions-footer">
          <label class="ssc-agree-wrap">
            <input type="checkbox" id="cbt-agree-check" onchange="SSCRenderer.toggleBeginBtn()">
            <span>I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc.</span>
          </label>
          <button class="ssc-begin-btn" id="cbt-begin-btn" disabled onclick="SSCRenderer.beginTest()">
            I am ready to begin →
          </button>
        </div>
      </div>
    </div>
    `;
  },

  // ════════════════════════════════════════════
  //  TEST SCREEN — TCS iON Exact Layout
  // ════════════════════════════════════════════

  renderTest() {
    if (!TestEngine.state) return '';

    const preset = this._getPreset();
    const current = TestEngine.getCurrentQuestion();
    const q = current.question;
    const sections = preset?.sections || [];
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const stats = RendererBase._getStats();

    this.markVisited(current.index);

    const vCount = typeof ExamProctor !== 'undefined' ? ExamProctor.getViolationCount() : 0;
    const violationCls = vCount === 0 ? 'clean' : vCount >= 2 ? 'danger' : 'warn';
    const navStatus = TestEngine.getNavStatus();

    return `
    <div class="ssc-mode" id="ssc-container">
      <!-- SSC System Header — TCS iON style -->
      <div class="ssc-header">
        <div class="ssc-header-left">
          <div class="ssc-header-logo">
            <div class="ssc-logo-icon">${this._getOrgInfo().icon}</div>
            <div class="ssc-logo-text">
              <span class="ssc-org-name">${this._getOrgInfo().name}</span>
              <span class="ssc-exam-subtitle">${preset ? (preset.fullName || preset.name) : 'Mock Test'}</span>
            </div>
          </div>
        </div>
        <div class="ssc-header-center">
          <div class="ssc-candidate-info">
            <span class="ssc-candidate-label">Candidate:</span>
            <span class="ssc-candidate-name">${this._getCandidateName()}</span>
          </div>
        </div>
        <div class="ssc-header-right">
          ${typeof ExamProctor !== 'undefined' ? `
          <span class="ssc-violation-badge ${violationCls}" id="cbt-violation-badge"
                title="Exam integrity violations">
            ${vCount === 0 ? '✓ Clean' : '⚠ ' + vCount + '/3'}
          </span>` : ''}
          ${TestEngine.state.totalTime < 99999 ? `
          <div class="ssc-timer-wrap">
            <span class="ssc-timer-label">Time Left:</span>
            <div class="ssc-timer" id="cbt-timer">
              ${Helpers.formatTime(TestEngine.state.timeRemaining)}
            </div>
          </div>
          ` : ''}
          <div class="ssc-profile-photo"><span>👤</span></div>
        </div>
      </div>

      <!-- Section Tabs — TCS style -->
      ${sections.length > 1 ? `
      <div class="ssc-section-bar" id="cbt-section-bar">
        ${sections.map((s, i) => {
      const isActive = q.subject === s.subject;
      const isLocked = this._lockedSections.has(s.subject);
      return `<button class="ssc-section-tab ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}"
                    onclick="SSCRenderer.jumpToSection('${s.subject}')">${s.name}</button>`;
    }).join('')}
      </div>
      ` : ''}

      <!-- Main Body — Two Column -->
      <div class="ssc-body">
        <!-- Left: Question Panel -->
        <div class="ssc-question-panel">
          <!-- Question Info Bar -->
          <div class="ssc-question-info">
            <div class="ssc-q-left">
              <span class="ssc-q-type">Single Choice</span>
              <span class="ssc-q-section-label">${q.subject}</span>
            </div>
            <div class="ssc-q-right">
              <span class="ssc-q-marks-info">
                Marks for correct answer: <strong class="ssc-marks-positive">+${preset?.marksPerQuestion || 1}</strong>
                | Negative marks: <strong class="ssc-marks-negative">${preset?.negativeMarking ? '-' + preset.negativeValue : '0'}</strong>
              </span>
            </div>
          </div>

          <!-- Question Language Toggle — TCS iON style -->
          ${typeof Lang !== 'undefined' ? Lang.renderQuestionLangToggle() : ''}

          <!-- Question Content -->
          <div class="ssc-question-content" id="cbt-question-content">
            <div class="ssc-q-number-line">
              <span class="ssc-q-number">Question No. ${current.index + 1}</span>
            </div>
            <div class="ssc-question-text">${this._renderQuestionText(q)}</div>
            <div class="ssc-options" id="cbt-options">
              ${this._renderOptions(q, current, labels)}
            </div>
          </div>

          <!-- Bottom Action Bar — TCS style -->
          <div class="ssc-action-bar">
            <div class="ssc-action-left">
              <button class="ssc-btn ssc-btn-mark ${current.isMarkedForReview ? 'active' : ''}"
                      onclick="TestPage.toggleReview()">
                Mark for Review & Next
              </button>
              <button class="ssc-btn ssc-btn-clear" onclick="TestPage.clearAnswer()">
                Clear Response
              </button>
            </div>
            <div class="ssc-action-right">
              <button class="ssc-btn ssc-btn-prev" onclick="TestPage.prev()"
                      ${current.index === 0 ? 'disabled' : ''}>
                ← Back
              </button>
              <button class="ssc-btn ssc-btn-next" onclick="TestPage.next()">
                ${current.index === current.total - 1 ? 'Submit' : 'Save & Next'}
              </button>
            </div>
          </div>

          <!-- Submit Button Row -->
          <div class="ssc-submit-bar">
            <button class="ssc-submit-btn" onclick="SSCRenderer.showSubmitModal()" id="cbt-submit-btn">
              Submit Test
            </button>
          </div>
        </div>

        <!-- Right: Question Palette -->
        <div class="ssc-palette" id="cbt-palette">
          <div class="ssc-palette-header">Question Palette</div>

          <!-- Status Legend -->
          <div class="ssc-palette-legend">
            <div class="ssc-legend-row">
              <span class="ssc-legend-dot ssc-dot-answered">${stats.answered}</span>
              <span class="ssc-legend-text">Answered</span>
            </div>
            <div class="ssc-legend-row">
              <span class="ssc-legend-dot ssc-dot-not-answered">${Math.max(0, stats.visited - stats.answered - stats.reviewed)}</span>
              <span class="ssc-legend-text">Not Answered</span>
            </div>
            <div class="ssc-legend-row">
              <span class="ssc-legend-dot ssc-dot-not-visited">${stats.notVisited}</span>
              <span class="ssc-legend-text">Not Visited</span>
            </div>
            <div class="ssc-legend-row">
              <span class="ssc-legend-dot ssc-dot-marked">${stats.reviewed}</span>
              <span class="ssc-legend-text">Marked for Review</span>
            </div>
            <div class="ssc-legend-row">
              <span class="ssc-legend-dot ssc-dot-marked-answered">0</span>
              <span class="ssc-legend-text">Answered & Marked for Review</span>
            </div>
          </div>

          <!-- Section filter in palette (if multiple sections) -->
          ${sections.length > 1 ? `
          <div class="ssc-palette-section-label">
            ${q.subject}
          </div>
          ` : ''}

          <!-- Question Grid -->
          <div class="ssc-q-grid" id="cbt-q-grid">
            ${navStatus.map((ns, i) => {
      let cls = RendererBase._getNavBtnClass(ns, i);
      return `<button class="ssc-q-btn${cls}" onclick="TestPage.goTo(${i})">${i + 1}</button>`;
    }).join('')}
          </div>
        </div>
      </div>

      <!-- Mobile toggle & bottom bar -->
      <button class="ssc-mobile-toggle" onclick="SSCRenderer.toggleMobilePalette()" style="display:none;">☰</button>
      <div class="ssc-mobile-bar" style="display:none;">
        <button class="ssc-btn ssc-btn-prev" onclick="TestPage.prev()" ${current.index === 0 ? 'disabled' : ''}>← Prev</button>
        <button class="ssc-btn" onclick="SSCRenderer.toggleMobilePalette()" style="flex:0.6;">${current.index + 1}/${current.total}</button>
        <button class="ssc-btn ssc-btn-next" onclick="TestPage.next()">${current.index === current.total - 1 ? 'Submit' : 'Next →'}</button>
      </div>
    </div>
    `;
  },

  // ════════════════════════════════════════════
  //  REFRESH QUESTION — Minimal DOM patch
  // ════════════════════════════════════════════

  refreshQuestion() {
    const current = TestEngine.getCurrentQuestion();
    if (!current) return;
    this.markVisited(current.index);

    const q = current.question;
    const labels = ['A', 'B', 'C', 'D', 'E'];
    const preset = this._getPreset();

    // Update question content
    const content = document.getElementById('cbt-question-content');
    if (content) {
      content.innerHTML = `
        <div class="ssc-q-number-line">
          <span class="ssc-q-number">Question No. ${current.index + 1}</span>
        </div>
        <div class="ssc-question-text">${this._renderQuestionText(q)}</div>
        <div class="ssc-options" id="cbt-options">
          ${this._renderOptions(q, current, labels)}
        </div>
      `;
    }

    // Update section label
    const secLabel = document.querySelector('.ssc-q-section-label');
    if (secLabel) secLabel.textContent = q.subject;

    // Update marks info
    const marksInfo = document.querySelector('.ssc-q-marks-info');
    if (marksInfo) {
      marksInfo.innerHTML = `
        Marks for correct answer: <strong class="ssc-marks-positive">+${preset?.marksPerQuestion || 1}</strong>
        | Negative marks: <strong class="ssc-marks-negative">${preset?.negativeMarking ? '-' + preset.negativeValue : '0'}</strong>
      `;
    }

    // Update prev/next buttons
    const prevBtn = document.querySelector('.ssc-btn-prev');
    if (prevBtn) {
      prevBtn.disabled = current.index === 0;
    }
    const nextBtn = document.querySelector('.ssc-action-right .ssc-btn-next');
    if (nextBtn) {
      nextBtn.textContent = current.index === current.total - 1 ? 'Submit' : 'Save & Next';
    }

    // Update section tabs
    document.querySelectorAll('.ssc-section-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    const preset2 = this._getPreset();
    const sections = preset2?.sections || [];
    const matchIdx = sections.findIndex(s => s.subject === q.subject);
    const allTabs = document.querySelectorAll('.ssc-section-tab');
    if (matchIdx >= 0 && allTabs[matchIdx]) {
      allTabs[matchIdx].classList.add('active');
    }
  },

  // ════════════════════════════════════════════
  //  REFRESH NAV PALETTE
  // ════════════════════════════════════════════

  refreshNav() {
    const grid = document.getElementById('cbt-q-grid');
    if (!grid) return;

    const navStatus = TestEngine.getNavStatus();
    grid.innerHTML = navStatus.map((ns, i) => {
      let cls = RendererBase._getNavBtnClass(ns, i);
      return `<button class="ssc-q-btn${cls}" onclick="TestPage.goTo(${i})">${i + 1}</button>`;
    }).join('');

    // Update legend counts
    const stats = RendererBase._getStats();
    const legendDots = document.querySelectorAll('.ssc-legend-dot');
    if (legendDots.length >= 5) {
      legendDots[0].textContent = stats.answered;
      legendDots[1].textContent = Math.max(0, stats.visited - stats.answered - stats.reviewed);
      legendDots[2].textContent = stats.notVisited;
      legendDots[3].textContent = stats.reviewed;
      // marked+answered
      const markedAnswered = TestEngine.state.markedForReview.filter((r, i) =>
        r && TestEngine.state.answers[TestEngine.state.questions[i].id] !== undefined
      ).length;
      legendDots[4].textContent = markedAnswered;
    }
  },

  // ════════════════════════════════════════════
  //  TIMER UPDATE
  // ════════════════════════════════════════════

  updateTimer(timeRemaining, totalTime) {
    const el = document.getElementById('cbt-timer');
    if (!el) return;
    el.textContent = Helpers.formatTime(timeRemaining);

    const pct = timeRemaining / totalTime;
    el.classList.remove('warning', 'danger');
    if (pct <= 0.10) el.classList.add('danger');
    else if (pct <= 0.20) el.classList.add('warning');

    this.updateViolationBadge();
  },

  // ════════════════════════════════════════════
  //  SUBMIT MODAL — TCS iON style
  // ════════════════════════════════════════════

  showSubmitModal() {
    const d = RendererBase.getSubmitStats();
    if (!d) return;

    const html = `
      <div class="ssc-submit-overlay" id="renderer-submit-modal"
           onclick="if(event.target===this)RendererBase.dismissSubmitModal()">
        <div class="ssc-submit-modal">
          <div class="ssc-submit-modal-header">
            Exam Summary — ${d.examName}
          </div>
          <div class="ssc-submit-modal-body">
            <table class="ssc-submit-table">
              <thead>
                <tr>
                  <th>Section</th>
                  <th>No. of Questions</th>
                  <th>Answered</th>
                  <th>Not Answered</th>
                  <th>Marked for Review</th>
                  <th>Not Visited</th>
                </tr>
              </thead>
              <tbody>
                ${d.sectionStats.map(s => `
                  <tr>
                    <td>${s.name}</td>
                    <td>${s.total}</td>
                    <td class="ssc-cell-green">${s.answered}</td>
                    <td class="ssc-cell-red">${s.unanswered}</td>
                    <td class="ssc-cell-purple">${s.marked}</td>
                    <td>${s.total - s.answered}</td>
                  </tr>
                `).join('')}
                <tr class="ssc-submit-total-row">
                  <td><strong>Total</strong></td>
                  <td><strong>${d.total}</strong></td>
                  <td class="ssc-cell-green"><strong>${d.answeredCount}</strong></td>
                  <td class="ssc-cell-red"><strong>${d.unansweredCount}</strong></td>
                  <td class="ssc-cell-purple"><strong>${d.reviewedCount}</strong></td>
                  <td><strong>${d.notVisitedCount}</strong></td>
                </tr>
              </tbody>
            </table>

            ${d.unansweredCount > 0 ? `
            <div class="ssc-submit-warning">
              ⚠ You have <strong>${d.unansweredCount}</strong> unanswered question${d.unansweredCount > 1 ? 's' : ''}.
              Are you sure you want to submit?
            </div>
            ` : ''}

            ${d.violations > 0 ? `
            <div class="ssc-submit-warning ssc-submit-warning-orange">
              ⚠ ${d.violations} integrity violation${d.violations > 1 ? 's' : ''} recorded.
            </div>
            ` : ''}
          </div>
          <div class="ssc-submit-modal-footer">
            <button class="ssc-btn" onclick="RendererBase.dismissSubmitModal()">
              Go Back
            </button>
            <button class="ssc-btn ssc-btn-submit-confirm" onclick="TestPage.submitTest()">
              Submit Exam
            </button>
          </div>
        </div>
      </div>
    `;
    RendererBase.injectModal('ssc-container', html);
  }
};
window.SSCRenderer = SSCRenderer;

