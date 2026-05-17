// ============================================
// CBT TEST RENDERER — Government Exam Style
// Authentic SSC/Railway CBT terminal feel
// Instruction screen → Test → Submit
// ============================================

const CBTRenderer = {
  _visitedQuestions: new Set(),
  _showingInstructions: true,
  _currentSectionIdx: 0,
  _lockedSections: new Set(), // Sections that have been left and can't be revisited

  // Get board info from current test
  _getPreset() {
    if (!TestEngine.state?.config?.examId) return null;
    return ExamPresets.get(TestEngine.state.config.examId);
  },

  _getCandidateName() {
    try {
      const u = localStorage.getItem('mock_user') || localStorage.getItem('username');
      return u || 'Candidate';
    } catch { return 'Candidate'; }
  },

  // ── Check if this exam should use CBT mode ──
  shouldUseCBT() {
    const preset = this._getPreset();
    if (!preset) return false;
    const cbtBoards = ['SSC', 'Railway', 'Banking', 'Defence', 'State'];
    return cbtBoards.includes(preset.category);
  },

  // ── Render instruction screen ──
  renderInstructions() {
    const preset = this._getPreset();
    if (!preset) return '';

    const sections = preset.sections || [];
    const negInfo = preset.negativeMarking
      ? `<li><strong>Negative Marking:</strong> ${preset.negativeValue} marks will be deducted for each wrong answer.</li>`
      : `<li>There is <strong>NO negative marking</strong> in this exam.</li>`;

    return `
    <div class="cbt-mode" id="cbt-container">
      <div class="cbt-header">
        <div class="cbt-header-left">
          <span class="cbt-exam-name">${preset.icon} ${preset.fullName || preset.name}</span>
          <span class="cbt-candidate">${this._getCandidateName()}</span>
        </div>
        <div class="cbt-header-right">
          <span style="font-size:12px;opacity:0.7;">MockTest Pro</span>
        </div>
      </div>

      <div class="cbt-instructions">
        <div class="cbt-instructions-header">
          General Instructions
        </div>
        <div class="cbt-instructions-body">
          <h3>Exam Overview</h3>
          <ul>
            <li><strong>Total Questions:</strong> ${preset.totalQuestions}</li>
            <li><strong>Duration:</strong> ${ExamPresets.formatTime(preset.totalTime)}</li>
            <li><strong>Marks per Question:</strong> +${preset.marksPerQuestion}</li>
            ${negInfo}
            <li><strong>Total Marks:</strong> ${preset.totalQuestions * preset.marksPerQuestion}</li>
          </ul>

          ${sections.length > 0 ? `
          <h3>Sections</h3>
          <table style="width:100%;border-collapse:collapse;margin:8px 0;">
            <thead>
              <tr style="background:#F0F4F8;">
                <th style="padding:8px 12px;text-align:left;border:1px solid #C5CDD6;font-size:13px;">Section</th>
                <th style="padding:8px 12px;text-align:center;border:1px solid #C5CDD6;font-size:13px;">Questions</th>
              </tr>
            </thead>
            <tbody>
              ${sections.map(s => `
                <tr>
                  <td style="padding:8px 12px;border:1px solid #C5CDD6;font-size:13px;">${s.name}</td>
                  <td style="padding:8px 12px;text-align:center;border:1px solid #C5CDD6;font-size:13px;">${s.questions}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : ''}

          <h3>Navigation</h3>
          <ul>
            <li>Click on a question number in the palette to go to that question.</li>
            <li>Click <strong>"Mark for Review"</strong> to flag a question for later review.</li>
            <li>Click <strong>"Clear Response"</strong> to deselect your answer.</li>
          </ul>

          <h3>Question Status</h3>
          <ul>
            <li><span style="display:inline-block;width:14px;height:14px;background:#38A169;border-radius:2px;vertical-align:middle;margin-right:6px;"></span> <strong>Answered</strong> — You have selected an answer.</li>
            <li><span style="display:inline-block;width:14px;height:14px;background:#E53E3E;border-radius:2px;vertical-align:middle;margin-right:6px;"></span> <strong>Not Answered</strong> — You visited but didn't answer.</li>
            <li><span style="display:inline-block;width:14px;height:14px;background:#805AD5;border-radius:2px;vertical-align:middle;margin-right:6px;"></span> <strong>Marked for Review</strong> — Flagged for review.</li>
            <li><span style="display:inline-block;width:14px;height:14px;background:#C5CDD6;border-radius:2px;vertical-align:middle;margin-right:6px;"></span> <strong>Not Visited</strong> — You haven't seen this question yet.</li>
          </ul>

          <h3>Submission</h3>
          <ul>
            <li>The test will auto-submit when the timer reaches zero.</li>
            <li>You can submit early by clicking the <strong>"Submit Test"</strong> button.</li>
            <li>Once submitted, you cannot change your answers.</li>
          </ul>
        </div>
        <div class="cbt-instructions-footer">
          <label class="cbt-agree-wrap">
            <input type="checkbox" id="cbt-agree-check" onchange="CBTRenderer.toggleBeginBtn()">
            I have read and understood the instructions
          </label>
          <button class="cbt-begin-btn" id="cbt-begin-btn" disabled onclick="CBTRenderer.beginTest()">
            Begin Test →
          </button>
        </div>
      </div>
    </div>
    `;
  },

  toggleBeginBtn() {
    const cb = document.getElementById('cbt-agree-check');
    const btn = document.getElementById('cbt-begin-btn');
    if (cb && btn) btn.disabled = !cb.checked;
  },

  beginTest() {
    this._showingInstructions = false;
    this._visitedQuestions.clear();
    this._visitedQuestions.add(0);
    this._currentSectionIdx = 0;
    this._lockedSections.clear();
    // Start proctoring
    if (typeof ExamProctor !== 'undefined') ExamProctor.start();
    // Re-render: use App.navigate to trigger full re-render cycle
    const container = document.getElementById('app');
    if (container) {
      const html = TestPage.render();
      container.innerHTML = html;
      if (TestPage.afterRender) {
        requestAnimationFrame(() => TestPage.afterRender());
      }
    }
  },

  isShowingInstructions() {
    return this._showingInstructions;
  },

  resetState() {
    this._showingInstructions = true;
    this._visitedQuestions.clear();
    this._currentSectionIdx = 0;
    this._lockedSections.clear();
    // Stop proctoring
    if (typeof ExamProctor !== 'undefined') ExamProctor.stop();
  },

  markVisited(idx) {
    this._visitedQuestions.add(idx);
  },

  isVisited(idx) {
    return this._visitedQuestions.has(idx);
  },

  // ── Render CBT test screen ──
  renderTest() {
    if (!TestEngine.state) return '';

    const preset = this._getPreset();
    const current = TestEngine.getCurrentQuestion();
    const q = current.question;
    const sections = preset?.sections || [];
    const labels = ['A', 'B', 'C', 'D', 'E'];

    this.markVisited(current.index);

    // Violation tracking
    const vCount = typeof ExamProctor !== 'undefined' ? ExamProctor.getViolationCount() : 0;
    const violationCls = vCount === 0 ? 'clean' : vCount >= 2 ? 'danger' : 'warn';

    // Build nav status with visited tracking
    const navStatus = TestEngine.getNavStatus();

    // Count stats
    const answered = Object.keys(TestEngine.state.answers).length;
    const reviewed = TestEngine.state.markedForReview.filter(r => r).length;
    const visited = this._visitedQuestions.size;
    const notVisited = current.total - visited;

    return `
    <div class="cbt-mode" id="cbt-container">
      <!-- System Header -->
      <div class="cbt-header">
        <div class="cbt-header-left">
          <span class="cbt-exam-name">${preset ? preset.icon + ' ' + (preset.fullName || preset.name) : 'Mock Test'}</span>
          <span class="cbt-candidate">${this._getCandidateName()}</span>
        </div>
        <div class="cbt-header-right">
          ${typeof ExamProctor !== 'undefined' ? `
          <span class="cbt-violation-badge ${violationCls}" id="cbt-violation-badge"
                title="Exam integrity violations">
            ${vCount === 0 ? '✓ Clean' : '⚠ ' + vCount + '/3'}
          </span>` : ''}
          ${TestEngine.state.totalTime < 99999 ? `
          <div class="cbt-timer" id="cbt-timer">
            ${Helpers.formatTime(TestEngine.state.timeRemaining)}
          </div>
          ` : ''}
          <button class="cbt-submit-btn" onclick="CBTRenderer.showSubmitModal()" id="cbt-submit-btn">
            Submit Test
          </button>
        </div>
      </div>

      <!-- Section Tabs -->
      ${sections.length > 1 ? `
      <div class="cbt-section-bar" id="cbt-section-bar">
        ${sections.map((s, i) => {
      const isActive = q.subject === s.subject;
      const isLocked = this._lockedSections.has(s.subject);
      return `<button class="cbt-section-tab ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}"
                    onclick="CBTRenderer.jumpToSection('${s.subject}')">${s.name}</button>`;
    }).join('')}
      </div>
      ` : ''}

      <!-- Main Body -->
      <div class="cbt-body">
        <!-- Question Panel -->
        <div class="cbt-question-panel">
          <div class="cbt-question-info">
            <span>
              <span class="cbt-q-number">Question ${current.index + 1} of ${current.total}</span>
              <span class="cbt-q-section" style="margin-left:12px;">${q.subject}</span>
            </span>
            <span class="cbt-q-marks">
              Marks: +${preset?.marksPerQuestion || 1} / ${preset?.negativeMarking ? '-' + preset.negativeValue : 'No negative'}
            </span>
          </div>

          <div class="cbt-question-content" id="cbt-question-content">
            <div class="cbt-question-text">${q.question}</div>
            <div class="cbt-options" id="cbt-options">
              ${q.options.map((opt, i) => `
                <div class="cbt-option ${current.selectedAnswer === i ? 'selected' : ''}"
                     onclick="TestPage.selectOption(${i})" id="cbt-opt-${i}">
                  <div class="cbt-option-radio"></div>
                  <span class="cbt-option-label">${labels[i]}.</span>
                  <span class="cbt-option-text">${opt}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Action Bar -->
          <div class="cbt-action-bar">
            <div class="cbt-action-left">
              <button class="cbt-btn cbt-btn-clear" onclick="TestPage.clearAnswer()">Clear Response</button>
              <button class="cbt-btn cbt-btn-review ${current.isMarkedForReview ? 'active' : ''}"
                      onclick="TestPage.toggleReview()">
                ${current.isMarkedForReview ? '★ Marked' : '☆ Mark for Review'}
              </button>
            </div>
            <div class="cbt-action-right">
              <button class="cbt-btn cbt-btn-prev" onclick="TestPage.prev()"
                      ${current.index === 0 ? 'disabled style="opacity:0.4"' : ''}>
                ← Previous
              </button>
              <button class="cbt-btn cbt-btn-next" onclick="TestPage.next()">
                ${current.index === current.total - 1 ? 'Submit →' : 'Save & Next →'}
              </button>
            </div>
          </div>
        </div>

        <!-- Right Palette -->
        <div class="cbt-palette" id="cbt-palette">
          <div class="cbt-palette-header">Question Palette</div>
          <div class="cbt-legend">
            <div class="cbt-legend-item">
              <span class="cbt-legend-dot answered">${answered}</span>
              Answered
            </div>
            <div class="cbt-legend-item">
              <span class="cbt-legend-dot not-answered">${visited - answered - reviewed}</span>
              Not Answered
            </div>
            <div class="cbt-legend-item">
              <span class="cbt-legend-dot not-visited">${notVisited}</span>
              Not Visited
            </div>
            <div class="cbt-legend-item">
              <span class="cbt-legend-dot marked">${reviewed}</span>
              Marked
            </div>
          </div>
          <div class="cbt-q-grid" id="cbt-q-grid">
            ${navStatus.map((ns, i) => {
      const isVisitedQ = this.isVisited(i);
      let cls = '';
      if (ns.current) cls += ' current';
      if (ns.review && ns.answered) cls += ' review answered';
      else if (ns.review) cls += ' review';
      else if (ns.answered) cls += ' answered';
      else if (isVisitedQ) cls += ' not-answered';
      // else: not visited (default grey)
      return `<button class="cbt-q-btn${cls}" onclick="TestPage.goTo(${i})">${i + 1}</button>`;
    }).join('')}
          </div>
        </div>
      </div>

      <!-- Mobile toggle & bottom bar -->
      <button class="cbt-mobile-toggle" onclick="CBTRenderer.toggleMobilePalette()" style="display:none;">☰</button>
      <div class="cbt-mobile-bar" style="display:none;">
        <button class="cbt-btn cbt-btn-prev" onclick="TestPage.prev()" ${current.index === 0 ? 'disabled' : ''}>← Prev</button>
        <button class="cbt-btn" onclick="CBTRenderer.toggleMobilePalette()" style="flex:0.6;">${current.index + 1}/${current.total}</button>
        <button class="cbt-btn cbt-btn-next" onclick="TestPage.next()">${current.index === current.total - 1 ? 'Submit' : 'Next →'}</button>
      </div>
    </div>
    `;
  },

  jumpToSection(subject) {
    if (!TestEngine.state) return;
    const preset = this._getPreset();
    const sections = preset?.sections || [];
    const targetIdx = sections.findIndex(s => s.subject === subject);

    // Section locking: can't go back
    if (this._lockedSections.has(subject)) {
      if (typeof Helpers !== 'undefined') {
        Helpers.showToast('🔒 This section is locked. You cannot return.', 'warning');
      }
      return;
    }

    // Lock current section when moving forward
    if (preset?.sectionLocking && targetIdx > this._currentSectionIdx) {
      const currentSection = sections[this._currentSectionIdx];
      if (currentSection) this._lockedSections.add(currentSection.subject);
    }

    this._currentSectionIdx = targetIdx >= 0 ? targetIdx : this._currentSectionIdx;
    const idx = TestEngine.state.questions.findIndex(q => q.subject === subject);
    if (idx >= 0) TestPage.goTo(idx);
  },

  toggleMobilePalette() {
    const p = document.getElementById('cbt-palette');
    if (p) p.classList.toggle('open');
  },

  // ── Refresh question in CBT mode (no full re-render) ──
  refreshQuestion() {
    const current = TestEngine.getCurrentQuestion();
    if (!current) return;
    this.markVisited(current.index);

    const q = current.question;
    const labels = ['A', 'B', 'C', 'D', 'E'];

    // Update question content
    const content = document.getElementById('cbt-question-content');
    if (content) {
      content.innerHTML = `
        <div class="cbt-question-text">${q.question}</div>
        <div class="cbt-options" id="cbt-options">
          ${q.options.map((opt, i) => `
            <div class="cbt-option ${current.selectedAnswer === i ? 'selected' : ''}"
                 onclick="TestPage.selectOption(${i})" id="cbt-opt-${i}">
              <div class="cbt-option-radio"></div>
              <span class="cbt-option-label">${labels[i]}.</span>
              <span class="cbt-option-text">${opt}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Update question info
    const qNum = document.querySelector('.cbt-q-number');
    if (qNum) qNum.textContent = `Question ${current.index + 1} of ${current.total}`;
    const qSection = document.querySelector('.cbt-q-section');
    if (qSection) qSection.textContent = q.subject;

    // Update review button
    const revBtn = document.querySelector('.cbt-btn-review');
    if (revBtn) {
      revBtn.className = `cbt-btn cbt-btn-review ${current.isMarkedForReview ? 'active' : ''}`;
      revBtn.textContent = current.isMarkedForReview ? '★ Marked' : '☆ Mark for Review';
    }

    // Update prev button
    const prevBtn = document.querySelector('.cbt-btn-prev');
    if (prevBtn) {
      prevBtn.disabled = current.index === 0;
      prevBtn.style.opacity = current.index === 0 ? '0.4' : '1';
    }

    // Update next button
    const nextBtn = document.querySelector('.cbt-btn-next');
    if (nextBtn) {
      nextBtn.textContent = current.index === current.total - 1 ? 'Submit →' : 'Save & Next →';
    }

    // Update section tabs active state
    document.querySelectorAll('.cbt-section-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.textContent.toLowerCase().includes(q.subject.substring(0, 4).toLowerCase())) {
        tab.classList.add('active');
      }
    });
  },

  // ── Refresh palette grid ──
  refreshNav() {
    const grid = document.getElementById('cbt-q-grid');
    if (!grid) return;

    const navStatus = TestEngine.getNavStatus();
    grid.innerHTML = navStatus.map((ns, i) => {
      const isVisitedQ = this.isVisited(i);
      let cls = '';
      if (ns.current) cls += ' current';
      if (ns.review && ns.answered) cls += ' review answered';
      else if (ns.review) cls += ' review';
      else if (ns.answered) cls += ' answered';
      else if (isVisitedQ) cls += ' not-answered';
      return `<button class="cbt-q-btn${cls}" onclick="TestPage.goTo(${i})">${i + 1}</button>`;
    }).join('');

    // Update legend counts
    const answered = Object.keys(TestEngine.state.answers).length;
    const reviewed = TestEngine.state.markedForReview.filter(r => r).length;
    const visited = this._visitedQuestions.size;

    const legendDots = document.querySelectorAll('.cbt-legend-dot');
    if (legendDots.length >= 4) {
      legendDots[0].textContent = answered;
      legendDots[1].textContent = Math.max(0, visited - answered - reviewed);
      legendDots[2].textContent = navStatus.length - visited;
      legendDots[3].textContent = reviewed;
    }
  },

  // ── Update timer in CBT mode ──
  updateTimer(timeRemaining, totalTime) {
    const el = document.getElementById('cbt-timer');
    if (!el) return;
    el.textContent = Helpers.formatTime(timeRemaining);

    const pct = timeRemaining / totalTime;
    el.classList.remove('warning', 'danger');
    if (pct <= 0.10) el.classList.add('danger');
    else if (pct <= 0.20) el.classList.add('warning');

    // Also update violation badge periodically
    this.updateViolationBadge();
  },

  // ── Update violation badge live ──
  updateViolationBadge() {
    const badge = document.getElementById('cbt-violation-badge');
    if (!badge || typeof ExamProctor === 'undefined') return;
    const count = ExamProctor.getViolationCount();
    badge.className = `cbt-violation-badge ${count === 0 ? 'clean' : count >= 2 ? 'danger' : 'warn'}`;
    badge.textContent = count === 0 ? '✓ Clean' : `⚠ ${count}/3`;
  },

  // ── CBT Submit Modal (government-style with per-section breakdown) ──
  showSubmitModal() {
    if (!TestEngine.state) return;
    const preset = this._getPreset();
    const sections = preset?.sections || [];
    const questions = TestEngine.state.questions;
    const answers = TestEngine.state.answers;
    const reviewed = TestEngine.state.markedForReview;
    const total = questions.length;

    // Overall stats
    const answeredCount = Object.keys(answers).length;
    const reviewedCount = reviewed.filter(r => r).length;
    const unansweredCount = total - answeredCount;

    // Per-section stats
    const sectionStats = sections.map(sec => {
      const sectionQs = questions.map((q, i) => ({ q, i })).filter(x => x.q.subject === sec.subject);
      const ans = sectionQs.filter(x => answers[x.q.id] !== undefined && answers[x.q.id] !== null).length;
      const rev = sectionQs.filter(x => reviewed[x.i]).length;
      const unans = sectionQs.length - ans;
      return { name: sec.name, total: sectionQs.length, answered: ans, unanswered: unans, marked: rev };
    });

    // Violation count
    const violations = typeof ExamProctor !== 'undefined' ? ExamProctor.getViolationCount() : 0;

    const sectionRows = sectionStats.map(s => `
      <div class="cbt-submit-section-row">
        <span class="cbt-submit-section-name">${s.name}</span>
        <div class="cbt-submit-section-stats">
          <span class="s-ans">✓ ${s.answered}/${s.total}</span>
          <span class="s-unans">✗ ${s.unanswered}</span>
          <span class="s-mark">★ ${s.marked}</span>
        </div>
      </div>
    `).join('');

    const html = `
      <div class="cbt-submit-overlay" id="cbt-submit-modal"
           onclick="if(event.target===this)document.getElementById('cbt-submit-modal').remove()">
        <div class="cbt-submit-modal">
          <div class="cbt-submit-modal-header">
            ⚠ Confirm Submission — ${preset?.fullName || preset?.name || 'Exam'}
          </div>
          <div class="cbt-submit-modal-body">
            <div class="cbt-submit-stats">
              <div class="cbt-submit-stat total">
                <div class="cbt-submit-stat-val">${total}</div>
                <div class="cbt-submit-stat-label">Total</div>
              </div>
              <div class="cbt-submit-stat answered">
                <div class="cbt-submit-stat-val">${answeredCount}</div>
                <div class="cbt-submit-stat-label">Answered</div>
              </div>
              <div class="cbt-submit-stat not-answered">
                <div class="cbt-submit-stat-val">${unansweredCount}</div>
                <div class="cbt-submit-stat-label">Unanswered</div>
              </div>
              <div class="cbt-submit-stat review">
                <div class="cbt-submit-stat-val">${reviewedCount}</div>
                <div class="cbt-submit-stat-label">Marked</div>
              </div>
            </div>

            ${unansweredCount > 0 ? `
            <div class="cbt-submit-warning">
              ⚠ You have <strong>${unansweredCount}</strong> unanswered question${unansweredCount > 1 ? 's' : ''}.
              Once submitted, you cannot change your answers.
            </div>
            ` : ''}

            ${violations > 0 ? `
            <div class="cbt-submit-warning" style="background:#FFFAF0;border-color:#FEEBC8;color:#DD6B20;">
              ⚠ ${violations} integrity violation${violations > 1 ? 's' : ''} recorded during this exam.
            </div>
            ` : ''}

            <div class="cbt-submit-sections">
              <div class="cbt-submit-section-row" style="background:#F0F4F8;font-weight:700;">
                <span class="cbt-submit-section-name">Section</span>
                <div class="cbt-submit-section-stats">
                  <span>Answered</span>
                  <span>Skipped</span>
                  <span>Review</span>
                </div>
              </div>
              ${sectionRows}
            </div>
          </div>
          <div class="cbt-submit-modal-footer">
            <button class="cbt-btn" onclick="document.getElementById('cbt-submit-modal').remove()">
              ← Go Back
            </button>
            <button class="cbt-btn cbt-btn-next" onclick="TestPage.submitTest()">
              Confirm Submit ✓
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  }
};
