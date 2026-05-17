// ============================================
// BOARD PAGE — Exam Hub per Category
// /board?id=SSC, /board?id=Railway, etc.
// ============================================

const BoardPage = {

  // Board metadata with themes
  _meta: {
    SSC:      { name: 'SSC Mock Test Series',      full: 'Staff Selection Commission',    icon: '📋', color: '#2563EB', tagline: 'CGL, CHSL, MTS, GD, CPO — Latest TCS iON Pattern' },
    Railway:  { name: 'Railway Mock Test Series',   full: 'Railway Recruitment Board',      icon: '🚂', color: '#059669', tagline: 'NTPC, Group D, ALP, JE — Authentic CBT Practice' },
    Banking:  { name: 'Banking Mock Test Series',   full: 'Banking & Insurance',            icon: '🏦', color: '#7C3AED', tagline: 'IBPS PO/Clerk, SBI, RBI — Sectional Timers Included' },
    UPSC:     { name: 'UPSC Mock Test Series',      full: 'Union Public Service Commission', icon: '⚖️', color: '#9333EA', tagline: 'Prelims, CAPF, EPFO — Comprehensive Practice' },
    Teaching: { name: 'Teaching Mock Test Series',   full: 'Teaching Exams',                 icon: '📚', color: '#0891B2', tagline: 'CTET, DSSSB, SUPER TET — Paper 1 & Paper 2' },
    Defence:  { name: 'Defence Mock Test Series',    full: 'Defence Services',               icon: '🛡️', color: '#DC2626', tagline: 'CDS, AFCAT, NDA — Full Syllabus Coverage' },
    State:    { name: 'State Exam Mock Tests',       full: 'State Level Exams',              icon: '🏛️', color: '#D97706', tagline: 'UPPCS, BPSC, MPPSC, RAS — State-specific Patterns' }
  },

  render(params) {
    const boardId = params?.id || 'SSC';
    const meta = this._meta[boardId];
    if (!meta) {
      return `
        <div class="empty-state" style="padding-top: 120px;">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">Board Not Found</div>
          <p style="color: var(--text-muted);">The requested exam board doesn't exist.</p>
          <button class="btn btn-primary" onclick="App.navigate('home')" style="margin-top: 16px;">← Back to Home</button>
        </div>
      `;
    }

    const presets = ExamPresets.getByCategory(boardId);

    return `
      <div class="page-enter" style="--board-color: ${meta.color};">

        <!-- Breadcrumb + Hero -->
        <section class="bp-hero">
          <div class="bp-breadcrumb">
            <a href="#home">Home</a>
            <span>›</span>
            <span style="color: var(--text-primary); font-weight: 500;">${boardId}</span>
          </div>

          <h1 class="bp-title">${meta.icon} ${meta.name}</h1>
          <p class="bp-sub">${meta.tagline}</p>
        </section>

        <!-- Exam Grid -->
        <section class="bp-exam-grid">
          ${presets.length === 0 ? `
            <div class="empty-state" style="grid-column: 1 / -1; padding: 60px 0;">
              <div class="empty-state-icon">📭</div>
              <div class="empty-state-title">Coming Soon</div>
              <p style="color: var(--text-muted);">Mock tests for this board are being prepared.</p>
            </div>
          ` : presets.map((preset, i) => this._renderExamCard(preset, meta, i)).join('')}
        </section>

        <!-- Back Link -->
        <div style="text-align: center; padding: 0 24px 48px;">
          <button class="hp-btn-secondary" onclick="App.navigate('home')" style="font-size: 14px;">
            ← Back to All Boards
          </button>
        </div>
      </div>
    `;
  },

  _renderExamCard(preset, meta, index) {
    const negText = preset.negativeMarking
      ? `-${preset.negativeValue} per wrong`
      : 'No negative';
    const timeText = preset.totalTime >= 3600
      ? `${Math.round(preset.totalTime / 3600)} hr`
      : `${Math.round(preset.totalTime / 60)} min`;

    return `
      <div class="bp-exam-card" style="animation: hp-fadeUp 0.4s ${0.05 * index}s ease both;">
        <div class="bp-exam-top">
          <span class="bp-exam-icon">${preset.icon}</span>
          <span class="bp-exam-badge" style="--board-color: ${meta.color};">${preset.category}</span>
        </div>

        <div class="bp-exam-name">${preset.name}</div>
        <div class="bp-exam-full">${preset.fullName}</div>

        <div class="bp-exam-tags">
          <span class="bp-exam-tag">${preset.totalQuestions} Questions</span>
          <span class="bp-exam-tag">${timeText}</span>
          <span class="bp-exam-tag ${preset.negativeMarking ? 'neg' : ''}">${negText}</span>
          ${preset.marksPerQuestion ? `<span class="bp-exam-tag">+${preset.marksPerQuestion}/correct</span>` : ''}
        </div>

        <div class="bp-exam-sections">
          ${(preset.sections || []).map(s => `
            <span class="bp-section-pill">${s.name} (${s.questions})</span>
          `).join('')}
        </div>

        <button class="bp-exam-start" style="--board-color: ${meta.color};"
                onclick="HomePage.startPresetExam('${preset.id}')" id="start-${preset.id}">
          Start ${preset.name} Test →
        </button>
      </div>
    `;
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent("page_view", { page: "board", board: App.params?.id });
  }
};

window.BoardPage = BoardPage;
