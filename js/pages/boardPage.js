// ============================================
// BOARD PAGE — Exam Hub per Category v2.0
// /board?id=SSC, /board?id=Railway, etc.
// Scholar Design System: clean vertical cards, social proof, single column
// ============================================

const BoardPage = {

  // Board metadata with themes
  _meta: {
    SSC:      { name: 'SSC Mock Tests',       full: 'Staff Selection Commission',    iconKey: 'clipboard', color: 'var(--board-ssc)',      tagline: 'CGL, CHSL, MTS, GD, CPO — Latest TCS iON Pattern' },
    Railway:  { name: 'Railway Mock Tests',   full: 'Railway Recruitment Board',      iconKey: 'train',     color: 'var(--board-railway)',  tagline: 'NTPC, Group D, ALP, JE — Authentic CBT Practice' },
    Banking:  { name: 'Banking Mock Tests',   full: 'Banking & Insurance',            iconKey: 'landmark',  color: 'var(--board-banking)',  tagline: 'IBPS PO/Clerk, SBI, RBI — Sectional Timers Included' },
    UPSC:     { name: 'UPSC Mock Tests',      full: 'Union Public Service Commission', iconKey: 'scale',     color: 'var(--board-upsc)',     tagline: 'Prelims, CAPF, EPFO — Comprehensive Practice' },
    Teaching: { name: 'Teaching Mock Tests',   full: 'Teaching Exams',                 iconKey: 'bookOpen',  color: 'var(--board-teaching)', tagline: 'CTET, DSSSB, SUPER TET — Paper 1 & Paper 2' },
    Defence:  { name: 'Defence Mock Tests',    full: 'Defence Services',               iconKey: 'shield',    color: 'var(--board-defence)',  tagline: 'CDS, AFCAT, NDA — Full Syllabus Coverage' },
    State:    { name: 'State Exam Mock Tests',  full: 'State Level Exams',              iconKey: 'building',  color: 'var(--board-state)',    tagline: 'UPPCS, BPSC, MPPSC, RAS — State-specific Patterns' },
    Police:   { name: 'Police Mock Tests',     full: 'Police Recruitment Exams',       iconKey: 'user',      color: 'var(--board-state)',    tagline: 'UP Police, Delhi Police, SSC GD — Physical + Written' },
  },

  render(params) {
    const boardId = params?.id || 'SSC';
    const meta = this._meta[boardId];
    if (!meta) {
      return `
        <div class="empty-state" style="padding-top: 120px; text-align: center;">
          <div class="empty-state-icon" style="font-size: 48px; margin-bottom: 12px;">🔍</div>
          <div class="empty-state-title" style="font-size: var(--text-lg); font-weight: 600; color: var(--text-primary);">Board Not Found</div>
          <p style="color: var(--text-muted); font-size: var(--text-sm);">The requested exam board doesn't exist.</p>
          <button class="btn btn-primary" onclick="App.navigate('home')" style="margin-top: 16px;">← Back to Home</button>
        </div>
      `;
    }

    const presets = ExamPresets.getByCategory(boardId);

    return `
      <div class="bp page-enter" style="--board-color: ${meta.color}; max-width: 640px; margin: 0 auto; padding: 0 var(--sp-4);">
        
        <!-- Breadcrumb + Hero -->
        <section class="bp-hero" style="padding: var(--sp-4) 0 var(--sp-2);">
          <div class="bp-breadcrumb" style="font-size: var(--text-xs); color: var(--text-muted); display: flex; gap: 4px; margin-bottom: 12px;">
            <a href="#home" style="color: var(--text-muted); text-decoration: none;">Home</a>
            <span>›</span>
            <span style="color: var(--text-primary); font-weight: 500;">${boardId}</span>
          </div>

          <h1 class="bp-title" style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary); margin: 0 0 4px; display: flex; align-items: center; gap: 8px; font-family: var(--font-display); border-left: 4px solid var(--board-color); padding-left: 8px;">
            ${meta.name}
          </h1>
          <p class="bp-sub" style="color: var(--text-secondary); font-size: var(--text-sm); margin: 0 0 16px;">${meta.tagline}</p>
        </section>

        <!-- Exam List -->
        <section class="bp-section" style="margin-top: 8px;">
          <div class="bp-exam-list" style="display: flex; flex-direction: column; gap: 12px;">
            ${presets.length === 0 ? `
              <div class="empty-state" style="padding: 60px 0; text-align: center;">
                <div class="empty-state-icon" style="font-size: 32px; margin-bottom: 8px;">📭</div>
                <div class="empty-state-title" style="font-weight: 600; color: var(--text-primary);">Coming Soon</div>
                <p style="color: var(--text-muted); font-size: 13px;">Mock tests for this board are being prepared.</p>
              </div>
            ` : presets.map((preset, i) => this._renderExamCard(preset, meta, i)).join('')}
          </div>
        </section>

        <!-- Back Link -->
        <div style="text-align: center; padding: 32px 0 48px;">
          <button class="btn btn-secondary" onclick="App.navigate('home')" style="font-size: 14px;">
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
    const marksText = preset.marksPerQuestion
      ? `${preset.totalQuestions * preset.marksPerQuestion} Marks`
      : '';

    // Simulated attempts for social proof
    const attempts = preset.attempts || (12450 + (index * 420));

    return `
      <div class="bp-exam-card" style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 12px; transition: border-color 120ms ease;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <div class="bp-exam-name" style="font-size: var(--text-lg); font-weight: var(--font-semibold); color: var(--text-primary); font-family: var(--font-display);">${preset.name}</div>
            <div class="bp-exam-full" style="font-size: var(--text-sm); color: var(--text-secondary); margin-top: 2px;">${preset.fullName || ''}</div>
          </div>
          <span class="bp-exam-icon" style="font-size: 20px;">${preset.icon}</span>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          <span class="badge" style="background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary); font-size: 11px; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 500;">
            ${preset.totalQuestions} Questions
          </span>
          <span class="badge" style="background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary); font-size: 11px; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 500;">
            ${timeText}
          </span>
          ${marksText ? `
          <span class="badge" style="background: var(--bg-secondary); border: 1px solid var(--border-color); color: var(--text-secondary); font-size: 11px; padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 500;">
            ${marksText}
          </span>
          ` : ''}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
          <span style="font-size: var(--text-xs); color: var(--text-muted); font-weight: 500;">
            ${attempts.toLocaleString()} attempts
          </span>
          <button class="btn btn-primary" onclick="BoardPage._startExam('${preset.id}')" style="font-family: var(--font-display); font-weight: var(--font-medium);">
            Start Test →
          </button>
        </div>
      </div>
    `;
  },

  _startExam(presetId) {
    App.navigate('setup', { preset: presetId });
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent("page_view", { page: "board", board: App.params?.id });
  }
};

window.BoardPage = BoardPage;
