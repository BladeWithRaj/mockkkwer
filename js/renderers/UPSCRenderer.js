// ============================================
// UPSC RENDERER — Paper Simulation Mode
// Reading-focused minimalism:
// - Serif typography
// - Newspaper-like question layout
// - Clean answer sheet palette
// - Minimal distractions, slower pace
// - No calculator, no flashy palette
// ============================================

const UPSCRenderer = {
  get _visitedQuestions() { return RendererBase._visitedQuestions; },
  get _showingInstructions() { return RendererBase._showingInstructions; },
  set _showingInstructions(v) { RendererBase._showingInstructions = v; },
  get _lockedSections() { return RendererBase._lockedSections; },
  _getPreset() { return RendererBase._getPreset(); },
  _getCandidateName() { return RendererBase._getCandidateName(); },
  markVisited(idx) { RendererBase.markVisited(idx); },
  isVisited(idx) { return RendererBase.isVisited(idx); },
  isShowingInstructions() { return RendererBase.isShowingInstructions(); },
  toggleBeginBtn() { RendererBase.toggleBeginBtn(); },
  beginTest() { RendererBase.beginTest(); },
  resetState() { RendererBase.resetState(); },
  jumpToSection(subject) { RendererBase.jumpToSection(subject); },
  toggleMobilePalette() { RendererBase.toggleMobilePalette(); },
  updateViolationBadge() { RendererBase.updateViolationBadge(); },

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

  // ══════════════════════════════════════
  //  INSTRUCTIONS — Paper exam booklet style
  // ══════════════════════════════════════

  renderInstructions() {
    const preset = this._getPreset();
    if (!preset) return '';
    const sections = preset.sections || [];

    return `
    <div class="upsc-mode" id="upsc-container">
      <div class="upsc-header">
        <div class="upsc-header-left">
          <span class="upsc-emblem">⚖️</span>
          <span class="upsc-logo">UNION PUBLIC SERVICE COMMISSION</span>
        </div>
        <div class="upsc-header-right">
          <span class="upsc-exam-name">${preset.fullName || preset.name}</span>
        </div>
      </div>
      <div class="upsc-instructions">
        <div class="upsc-instructions-header">INSTRUCTIONS TO CANDIDATES</div>
        <div class="upsc-instructions-body">
          <div class="upsc-booklet-info">
            <span>Time Allowed: <strong>${ExamPresets.formatTime(preset.totalTime)}</strong></span>
            <span>Maximum Marks: <strong>${preset.totalQuestions * (preset.marksPerQuestion || 2)}</strong></span>
            <span>No. of Questions: <strong>${preset.totalQuestions}</strong></span>
          </div>

          <div class="upsc-inst-divider"></div>

          <ol class="upsc-inst-list">
            <li>This test booklet contains <strong>${preset.totalQuestions}</strong> items (questions). Each item comprises four responses (answers). You will select the response which you want to mark on the Answer Sheet.</li>
            <li>You have to mark all your responses on the separate Answer Sheet provided. See directions in the Answer Sheet.</li>
            <li>You have <strong>${ExamPresets.formatTime(preset.totalTime)}</strong> to complete this paper.</li>
            ${preset.negativeMarking
              ? `<li>There is penalty (negative marking) for wrong answers. For each wrong answer, <strong>${preset.negativeValue}</strong> of the marks assigned to that question will be deducted as penalty.</li>`
              : `<li>There is no penalty for wrong answers.</li>`}
            <li>If a candidate gives more than one answer, it will be treated as a wrong answer even if one of the given answers happens to be correct and there will be same penalty as above for that question.</li>
            <li>If a candidate leaves a question unanswered, there will be no penalty for that question.</li>
          </ol>

          ${sections.length > 0 ? `
          <div class="upsc-inst-divider"></div>
          <h4 class="upsc-section-title">PAPER STRUCTURE</h4>
          <table class="upsc-inst-table">
            <thead><tr><th>Subject</th><th>Questions</th><th>Maximum Marks</th></tr></thead>
            <tbody>
              ${sections.map(s => `<tr><td>${s.name}</td><td>${s.questions}</td><td>${s.questions * (preset.marksPerQuestion || 2)}</td></tr>`).join('')}
              <tr class="upsc-total-row"><td><strong>Total</strong></td><td><strong>${preset.totalQuestions}</strong></td><td><strong>${preset.totalQuestions * (preset.marksPerQuestion || 2)}</strong></td></tr>
            </tbody>
          </table>` : ''}
        </div>
        <div class="upsc-instructions-footer">
          <label class="upsc-agree-wrap">
            <input type="checkbox" id="cbt-agree-check" onchange="UPSCRenderer.toggleBeginBtn()">
            I have read and understood the instructions
          </label>
          <button class="upsc-begin-btn" id="cbt-begin-btn" disabled onclick="UPSCRenderer.beginTest()">
            Open Test Booklet →
          </button>
        </div>
      </div>
    </div>`;
  },

  // ══════════════════════════════════════
  //  TEST SCREEN — Paper simulation
  // ══════════════════════════════════════

  renderTest() {
    if (!TestEngine.state) return '';
    const preset = this._getPreset();
    const current = TestEngine.getCurrentQuestion();
    const q = current.question;
    const labels = ['(a)', '(b)', '(c)', '(d)', '(e)'];
    const stats = RendererBase._getStats();
    const navStatus = TestEngine.getNavStatus();
    this.markVisited(current.index);

    // Find section name
    const sections = preset?.sections || [];
    const currentSection = sections.find(s => s.subject === q.subject);

    return `
    <div class="upsc-mode" id="upsc-container">
      <!-- Header — minimal, institutional -->
      <div class="upsc-header">
        <div class="upsc-header-left">
          <span class="upsc-emblem">⚖️</span>
          <span class="upsc-logo">UPSC</span>
          <span class="upsc-exam-label">${preset ? (preset.fullName || preset.name) : ''}</span>
        </div>
        <div class="upsc-header-right">
          ${TestEngine.state.totalTime < 99999 ? `<div class="upsc-timer" id="cbt-timer">${Helpers.formatTime(TestEngine.state.timeRemaining)}</div>` : ''}
          <button class="upsc-submit-btn" onclick="UPSCRenderer.showSubmitModal()" id="cbt-submit-btn">Submit Paper</button>
        </div>
      </div>

      <!-- Body — reading-focused layout -->
      <div class="upsc-body">
        <!-- Question Panel — paper-like -->
        <div class="upsc-question-panel">
          <div class="upsc-q-number-bar">
            <span class="upsc-q-num">${current.index + 1}.</span>
            <span class="upsc-q-subject">${currentSection?.name || q.subject}</span>
            <span class="upsc-q-marks">[${preset?.marksPerQuestion || 2} marks]</span>
          </div>
          ${typeof Lang !== 'undefined' ? Lang.renderQuestionLangToggle() : ''}
          <div class="upsc-question-content" id="cbt-question-content">
            <div class="upsc-question-text">${this._renderQuestionText(q)}</div>
            <div class="upsc-options" id="cbt-options">
              ${(q.optionsEN || q.options).map((opt, i) => `
                <div class="upsc-option ${current.selectedAnswer === i ? 'selected' : ''}"
                     onclick="TestPage.selectOption(${i})" id="cbt-opt-${i}">
                  <span class="upsc-option-label">${labels[i]}</span>
                  <span class="upsc-option-text">${this._renderOptionText(q, i)}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="upsc-action-bar">
            <button class="upsc-btn upsc-btn-clear" onclick="TestPage.clearAnswer()">Clear</button>
            <button class="upsc-btn upsc-btn-review ${current.isMarkedForReview ? 'active' : ''}" onclick="TestPage.toggleReview()">
              ${current.isMarkedForReview ? '★ Marked' : '☆ Mark'}
            </button>
            <div style="flex:1;"></div>
            <button class="upsc-btn upsc-btn-prev" onclick="TestPage.prev()" ${current.index === 0 ? 'disabled' : ''}>← Previous</button>
            <button class="upsc-btn upsc-btn-next" onclick="TestPage.next()">
              ${current.index === current.total - 1 ? 'Submit Paper' : 'Next →'}
            </button>
          </div>
        </div>

        <!-- Answer Sheet Palette -->
        <div class="upsc-palette" id="cbt-palette">
          <div class="upsc-palette-header">Answer Sheet</div>
          <div class="upsc-palette-stats">
            <span class="upsc-stat-answered">${stats.answered} marked</span>
            <span class="upsc-stat-sep">·</span>
            <span class="upsc-stat-remaining">${stats.notVisited} remaining</span>
          </div>
          <div class="upsc-q-grid" id="cbt-q-grid">
            ${navStatus.map((ns, i) => `
              <button class="upsc-q-btn${RendererBase._getNavBtnClass(ns, i)}" onclick="TestPage.goTo(${i})">
                ${i + 1}
              </button>
            `).join('')}
          </div>

          <!-- Section Anchors -->
          ${sections.length > 1 ? `
          <div class="upsc-section-anchors">
            ${sections.map(s => `
              <button class="upsc-anchor-btn" onclick="UPSCRenderer.jumpToSection('${s.subject}')">
                ${s.name} (${s.questions})
              </button>
            `).join('')}
          </div>` : ''}
        </div>
      </div>

      <!-- Mobile bottom bar -->
      <button class="upsc-mobile-toggle" onclick="UPSCRenderer.toggleMobilePalette()" style="display:none;">☰</button>
      <div class="upsc-mobile-bar" style="display:none;">
        <button class="upsc-btn" onclick="TestPage.prev()" ${current.index === 0 ? 'disabled' : ''}>←</button>
        <button class="upsc-btn" onclick="UPSCRenderer.toggleMobilePalette()">${current.index + 1}/${current.total}</button>
        <button class="upsc-btn upsc-btn-next" onclick="TestPage.next()">${current.index === current.total - 1 ? 'Submit' : 'Next →'}</button>
      </div>
    </div>`;
  },

  // ══════════════════════════════════════
  //  REFRESH
  // ══════════════════════════════════════

  refreshQuestion() {
    const current = TestEngine.getCurrentQuestion();
    if (!current) return;
    this.markVisited(current.index);
    const q = current.question;
    const labels = ['(a)', '(b)', '(c)', '(d)', '(e)'];
    const preset = this._getPreset();
    const currentSection = preset?.sections?.find(s => s.subject === q.subject);

    const content = document.getElementById('cbt-question-content');
    if (content) {
      content.innerHTML = `
        <div class="upsc-question-text">${this._renderQuestionText(q)}</div>
        <div class="upsc-options" id="cbt-options">
          ${(q.optionsEN || q.options).map((opt, i) => `
            <div class="upsc-option ${current.selectedAnswer === i ? 'selected' : ''}"
                 onclick="TestPage.selectOption(${i})" id="cbt-opt-${i}">
              <span class="upsc-option-label">${labels[i]}</span>
              <span class="upsc-option-text">${this._renderOptionText(q, i)}</span>
            </div>
          `).join('')}
        </div>`;
    }

    const qn = document.querySelector('.upsc-q-num');
    if (qn) qn.textContent = `${current.index + 1}.`;
    const qs = document.querySelector('.upsc-q-subject');
    if (qs) qs.textContent = currentSection?.name || q.subject;
    const pb = document.querySelector('.upsc-btn-prev');
    if (pb) pb.disabled = current.index === 0;
    const nb = document.querySelector('.upsc-btn-next');
    if (nb) nb.textContent = current.index === current.total - 1 ? 'Submit Paper' : 'Next →';
  },

  refreshNav() {
    const grid = document.getElementById('cbt-q-grid');
    if (!grid) return;
    grid.innerHTML = TestEngine.getNavStatus().map((ns, i) =>
      `<button class="upsc-q-btn${RendererBase._getNavBtnClass(ns, i)}" onclick="TestPage.goTo(${i})">${i + 1}</button>`
    ).join('');
    const stats = RendererBase._getStats();
    const as = document.querySelector('.upsc-stat-answered');
    if (as) as.textContent = `${stats.answered} marked`;
    const rs = document.querySelector('.upsc-stat-remaining');
    if (rs) rs.textContent = `${stats.notVisited} remaining`;
  },

  updateTimer(t, total) {
    const el = document.getElementById('cbt-timer');
    if (!el) return;
    el.textContent = Helpers.formatTime(t);
    const p = t / total;
    el.classList.remove('warning', 'danger');
    if (p <= 0.10) el.classList.add('danger');
    else if (p <= 0.20) el.classList.add('warning');
  },

  showSubmitModal() {
    const d = RendererBase.getSubmitStats();
    if (!d) return;

    const html = `
      <div class="upsc-submit-overlay" id="renderer-submit-modal"
           onclick="if(event.target===this)RendererBase.dismissSubmitModal()">
        <div class="upsc-submit-modal">
          <div class="upsc-submit-modal-header">
            ⚖️ Paper Summary — ${d.examName}
          </div>
          <div class="upsc-submit-modal-body">
            <table class="upsc-submit-table">
              <thead><tr><th>Subject</th><th>Questions</th><th>Attempted</th><th>Unattempted</th><th>Marked</th></tr></thead>
              <tbody>
                ${d.sectionStats.map(s => `<tr><td>${s.name}</td><td>${s.total}</td><td class="upsc-cell-green">${s.answered}</td><td class="upsc-cell-red">${s.unanswered}</td><td class="upsc-cell-purple">${s.marked}</td></tr>`).join('')}
                <tr class="upsc-submit-total"><td><strong>Total</strong></td><td><strong>${d.total}</strong></td><td class="upsc-cell-green"><strong>${d.answeredCount}</strong></td><td class="upsc-cell-red"><strong>${d.unansweredCount}</strong></td><td class="upsc-cell-purple"><strong>${d.reviewedCount}</strong></td></tr>
              </tbody>
            </table>
            ${d.unansweredCount > 0 ? `<div class="upsc-submit-warning">⚠ <strong>${d.unansweredCount}</strong> question${d.unansweredCount > 1 ? 's' : ''} unattempted. Negative marking applies only to wrong answers, not blank answers.</div>` : ''}
            ${d.violations > 0 ? `<div class="upsc-submit-warning upsc-submit-warning-orange">⚠ ${d.violations} integrity violation${d.violations > 1 ? 's' : ''} recorded.</div>` : ''}
          </div>
          <div class="upsc-submit-modal-footer">
            <button class="upsc-btn" onclick="RendererBase.dismissSubmitModal()">Go Back</button>
            <button class="upsc-btn upsc-btn-confirm" onclick="TestPage.submitTest()">Submit Paper</button>
          </div>
        </div>
      </div>
    `;
    RendererBase.injectModal('upsc-container', html);
  }
};
window.UPSCRenderer = UPSCRenderer;

