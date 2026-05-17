// ============================================
// RAILWAY RENDERER — RRB CBT Clone
// Greener palette, larger buttons, compact timer
// ============================================

const RailwayRenderer = {
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
  resetState() { RendererBase.resetState(); },
  jumpToSection(subject) { RendererBase.jumpToSection(subject); },
  toggleMobilePalette() { RendererBase.toggleMobilePalette(); },
  updateViolationBadge() { RendererBase.updateViolationBadge(); },

  renderInstructions() {
    const preset = this._getPreset();
    if (!preset) return '';
    const sections = preset.sections || [];
    return `
    <div class="rrb-mode" id="rrb-container">
      <div class="rrb-header">
        <div class="rrb-header-left">
          <span class="rrb-logo">🚂 Railway Recruitment Board</span>
          <span class="rrb-exam-name">${preset.fullName || preset.name}</span>
        </div>
        <div class="rrb-header-right">
          <span class="rrb-candidate">${this._getCandidateName()} | Roll: ${this._getCandidateRoll()}</span>
          <span class="rrb-profile-photo">👤</span>
        </div>
      </div>
      <div class="rrb-instructions">
        <div class="rrb-instructions-header">📝 IMPORTANT INSTRUCTIONS</div>
        <div class="rrb-instructions-body">
          <h4>Exam Details</h4>
          <div class="rrb-details-grid">
            <div class="rrb-detail"><span>Total Questions:</span> <strong>${preset.totalQuestions}</strong></div>
            <div class="rrb-detail"><span>Duration:</span> <strong>${ExamPresets.formatTime(preset.totalTime)}</strong></div>
            <div class="rrb-detail"><span>Marks/Q:</span> <strong>+${preset.marksPerQuestion}</strong></div>
            <div class="rrb-detail"><span>Negative:</span> <strong>${preset.negativeMarking ? '-'+preset.negativeValue : 'None'}</strong></div>
          </div>
          ${sections.length > 0 ? `<h4>Sections</h4><table class="rrb-inst-table"><thead><tr><th>Section</th><th>Questions</th></tr></thead><tbody>${sections.map(s=>`<tr><td>${s.name}</td><td>${s.questions}</td></tr>`).join('')}</tbody></table>` : ''}
          <h4>Navigation</h4>
          <ul><li>Click question number in palette to navigate.</li><li>Click "Save & Next" to proceed.</li><li>Click "Clear Response" to deselect.</li><li>Auto-submit when timer reaches zero.</li></ul>
        </div>
        <div class="rrb-instructions-footer">
          <label class="rrb-agree-wrap"><input type="checkbox" id="cbt-agree-check" onchange="RailwayRenderer.toggleBeginBtn()"> I have read the instructions</label>
          <button class="rrb-begin-btn" id="cbt-begin-btn" disabled onclick="RailwayRenderer.beginTest()">Start Exam →</button>
        </div>
      </div>
    </div>`;
  },

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
    const labels = ['A','B','C','D','E'];
    const stats = RendererBase._getStats();
    const navStatus = TestEngine.getNavStatus();
    this.markVisited(current.index);
    const vCount = typeof ExamProctor !== 'undefined' ? ExamProctor.getViolationCount() : 0;

    return `
    <div class="rrb-mode" id="rrb-container">
      <div class="rrb-header">
        <div class="rrb-header-left">
          <span class="rrb-logo-sm">🚂</span>
          <span class="rrb-exam-label">${preset?(preset.fullName||preset.name):'Mock Test'}</span>
          <span class="rrb-candidate-sm">${this._getCandidateName()}</span>
        </div>
        <div class="rrb-header-right">
          ${typeof ExamProctor!=='undefined'?`<span class="ssc-violation-badge ${vCount===0?'clean':vCount>=2?'danger':'warn'}" id="cbt-violation-badge">${vCount===0?'✓':'⚠ '+vCount}</span>`:''}
          ${TestEngine.state.totalTime<99999?`<div class="rrb-timer" id="cbt-timer">${Helpers.formatTime(TestEngine.state.timeRemaining)}</div>`:''}
          <button class="rrb-submit-btn" onclick="RailwayRenderer.showSubmitModal()" id="cbt-submit-btn">Submit</button>
        </div>
      </div>
      ${sections.length>1?`<div class="rrb-section-bar" id="cbt-section-bar">${sections.map((s,i)=>`<button class="rrb-section-tab ${q.subject===s.subject?'active':''} ${this._lockedSections.has(s.subject)?'locked':''}" onclick="RailwayRenderer.jumpToSection('${s.subject}')">${s.name}</button>`).join('')}</div>`:''}
      <div class="rrb-body">
        <div class="rrb-question-panel">
          <div class="rrb-question-info"><span class="rrb-q-number">Q.${current.index+1} of ${current.total}</span><span class="rrb-q-section">${q.subject}</span><span class="rrb-q-marks">+${preset?.marksPerQuestion||1} / ${preset?.negativeMarking?'-'+preset.negativeValue:'No neg'}</span></div>
          ${typeof Lang !== 'undefined' ? Lang.renderQuestionLangToggle() : ''}
          <div class="rrb-question-content" id="cbt-question-content">
            <div class="rrb-question-text">${this._renderQuestionText(q)}</div>
            <div class="rrb-options" id="cbt-options">${(q.optionsEN||q.options).map((opt,i)=>`<div class="rrb-option ${current.selectedAnswer===i?'selected':''}" onclick="TestPage.selectOption(${i})" id="cbt-opt-${i}"><span class="rrb-radio ${current.selectedAnswer===i?'checked':''}"></span><span class="rrb-option-label">${labels[i]}.</span><span class="rrb-option-text">${this._renderOptionText(q,i)}</span></div>`).join('')}</div>
          </div>
          <div class="rrb-action-bar">
            <div class="rrb-action-left"><button class="rrb-btn rrb-btn-clear" onclick="TestPage.clearAnswer()">Clear</button><button class="rrb-btn rrb-btn-review ${current.isMarkedForReview?'active':''}" onclick="TestPage.toggleReview()">${current.isMarkedForReview?'★ Marked':'☆ Mark'}</button></div>
            <div class="rrb-action-right"><button class="rrb-btn rrb-btn-prev" onclick="TestPage.prev()" ${current.index===0?'disabled':''}>← Prev</button><button class="rrb-btn rrb-btn-next" onclick="TestPage.next()">${current.index===current.total-1?'Submit →':'Save & Next →'}</button></div>
          </div>
        </div>
        <div class="rrb-palette" id="cbt-palette">
          <div class="rrb-palette-header">Question Palette</div>
          <div class="rrb-legend"><div class="rrb-legend-item"><span class="rrb-legend-dot answered">${stats.answered}</span> Answered</div><div class="rrb-legend-item"><span class="rrb-legend-dot not-answered">${Math.max(0,stats.visited-stats.answered-stats.reviewed)}</span> Not Ans</div><div class="rrb-legend-item"><span class="rrb-legend-dot not-visited">${stats.notVisited}</span> Not Visited</div><div class="rrb-legend-item"><span class="rrb-legend-dot marked">${stats.reviewed}</span> Marked</div></div>
          <div class="rrb-q-grid" id="cbt-q-grid">${navStatus.map((ns,i)=>`<button class="rrb-q-btn${RendererBase._getNavBtnClass(ns,i)}" onclick="TestPage.goTo(${i})">${i+1}</button>`).join('')}</div>
        </div>
      </div>
      <button class="rrb-mobile-toggle" onclick="RailwayRenderer.toggleMobilePalette()" style="display:none;">☰</button>
      <div class="rrb-mobile-bar" style="display:none;"><button class="rrb-btn" onclick="TestPage.prev()" ${current.index===0?'disabled':''}>←</button><button class="rrb-btn" onclick="RailwayRenderer.toggleMobilePalette()">${current.index+1}/${current.total}</button><button class="rrb-btn rrb-btn-next" onclick="TestPage.next()">${current.index===current.total-1?'Submit':'Next →'}</button></div>
    </div>`;
  },

  refreshQuestion() {
    const current = TestEngine.getCurrentQuestion();
    if (!current) return;
    this.markVisited(current.index);
    const q = current.question;
    const labels = ['A','B','C','D','E'];
    const content = document.getElementById('cbt-question-content');
    if (content) {
      content.innerHTML = `<div class="rrb-question-text">${this._renderQuestionText(q)}</div><div class="rrb-options" id="cbt-options">${(q.optionsEN||q.options).map((opt,i)=>`<div class="rrb-option ${current.selectedAnswer===i?'selected':''}" onclick="TestPage.selectOption(${i})" id="cbt-opt-${i}"><span class="rrb-radio ${current.selectedAnswer===i?'checked':''}"></span><span class="rrb-option-label">${labels[i]}.</span><span class="rrb-option-text">${this._renderOptionText(q,i)}</span></div>`).join('')}</div>`;
    }
    const qNum = document.querySelector('.rrb-q-number');
    if (qNum) qNum.textContent = `Q.${current.index+1} of ${current.total}`;
    const qSec = document.querySelector('.rrb-q-section');
    if (qSec) qSec.textContent = q.subject;
    const prevBtn = document.querySelector('.rrb-btn-prev');
    if (prevBtn) prevBtn.disabled = current.index === 0;
    const nextBtn = document.querySelector('.rrb-action-right .rrb-btn-next');
    if (nextBtn) nextBtn.textContent = current.index===current.total-1?'Submit →':'Save & Next →';
    document.querySelectorAll('.rrb-section-tab').forEach(t => t.classList.remove('active'));
    const preset = this._getPreset();
    const secs = preset?.sections || [];
    const mi = secs.findIndex(s => s.subject === q.subject);
    const tabs = document.querySelectorAll('.rrb-section-tab');
    if (mi>=0 && tabs[mi]) tabs[mi].classList.add('active');
  },

  refreshNav() {
    const grid = document.getElementById('cbt-q-grid');
    if (!grid) return;
    const navStatus = TestEngine.getNavStatus();
    grid.innerHTML = navStatus.map((ns,i)=>`<button class="rrb-q-btn${RendererBase._getNavBtnClass(ns,i)}" onclick="TestPage.goTo(${i})">${i+1}</button>`).join('');
    const stats = RendererBase._getStats();
    const dots = document.querySelectorAll('.rrb-legend-dot');
    if (dots.length>=4) { dots[0].textContent=stats.answered; dots[1].textContent=Math.max(0,stats.visited-stats.answered-stats.reviewed); dots[2].textContent=stats.notVisited; dots[3].textContent=stats.reviewed; }
  },

  updateTimer(timeRemaining, totalTime) {
    const el = document.getElementById('cbt-timer');
    if (!el) return;
    el.textContent = Helpers.formatTime(timeRemaining);
    const pct = timeRemaining / totalTime;
    el.classList.remove('warning','danger');
    if (pct<=0.10) el.classList.add('danger');
    else if (pct<=0.20) el.classList.add('warning');
    this.updateViolationBadge();
  },

  showSubmitModal() {
    const d = RendererBase.getSubmitStats();
    if (!d) return;

    const html = `
      <div class="rrb-submit-overlay" id="renderer-submit-modal"
           onclick="if(event.target===this)RendererBase.dismissSubmitModal()">
        <div class="rrb-submit-modal">
          <div class="rrb-submit-modal-header">
            📝 Exam Summary — ${d.examName}
          </div>
          <div class="rrb-submit-modal-body">
            <table class="rrb-submit-table">
              <thead><tr><th>Section</th><th>Total</th><th>Answered</th><th>Not Answered</th><th>Marked</th></tr></thead>
              <tbody>
                ${d.sectionStats.map(s => `<tr><td>${s.name}</td><td>${s.total}</td><td class="rrb-cell-green">${s.answered}</td><td class="rrb-cell-red">${s.unanswered}</td><td class="rrb-cell-purple">${s.marked}</td></tr>`).join('')}
                <tr class="rrb-submit-total"><td><strong>Total</strong></td><td><strong>${d.total}</strong></td><td class="rrb-cell-green"><strong>${d.answeredCount}</strong></td><td class="rrb-cell-red"><strong>${d.unansweredCount}</strong></td><td class="rrb-cell-purple"><strong>${d.reviewedCount}</strong></td></tr>
              </tbody>
            </table>
            ${d.unansweredCount > 0 ? `<div class="rrb-submit-warning">⚠ ${d.unansweredCount} question${d.unansweredCount > 1 ? 's' : ''} unanswered. Submit anyway?</div>` : ''}
            ${d.violations > 0 ? `<div class="rrb-submit-warning rrb-submit-warning-orange">⚠ ${d.violations} violation${d.violations > 1 ? 's' : ''} recorded.</div>` : ''}
          </div>
          <div class="rrb-submit-modal-footer">
            <button class="rrb-btn" onclick="RendererBase.dismissSubmitModal()">Go Back</button>
            <button class="rrb-btn rrb-btn-confirm" onclick="TestPage.submitTest()">Submit Exam</button>
          </div>
        </div>
      </div>
    `;
    RendererBase.injectModal('rrb-container', html);
  }
};
window.RailwayRenderer = RailwayRenderer;

