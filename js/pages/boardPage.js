// ============================================
// BOARD PAGE — Exam Hub per Category v3.0
// /board?id=SSC, /board?id=Railway, etc.
// Now shows stage badges (Tier 1, Tier 2, CBT, etc.)
// Clicking a card → ExamDetail page for stage selection
// Single-stage exams → Direct to setup
// ============================================

const BoardPage = {

  // Board metadata with themes
  _meta: {
    SSC:      { name: 'SSC Exams',             full: 'Staff Selection Commission',    iconKey: 'clipboard', color: 'var(--board-ssc)',      tagline: 'Choose Your Exam' },
    Railway:  { name: 'Railway Exams',         full: 'Railway Recruitment Board',      iconKey: 'train',     color: 'var(--board-railway)',  tagline: 'Choose Your Exam' },
    Banking:  { name: 'Banking Exams',         full: 'Banking & Insurance',            iconKey: 'landmark',  color: 'var(--board-banking)',  tagline: 'Choose Your Exam' },
    UPSC:     { name: 'UPSC Exams',            full: 'Union Public Service Commission', iconKey: 'scale',     color: 'var(--board-upsc)',     tagline: 'Choose Your Exam' },
    Teaching: { name: 'Teaching Exams',        full: 'Teaching Exams',                 iconKey: 'bookOpen',  color: 'var(--board-teaching)', tagline: 'Choose Your Exam' },
    Defence:  { name: 'Defence Exams',         full: 'Defence Services',               iconKey: 'shield',    color: 'var(--board-defence)',  tagline: 'Choose Your Exam' },
    State:    { name: 'State Exams',           full: 'State Level Exams',              iconKey: 'building',  color: 'var(--board-state)',    tagline: 'Choose Your Exam' },
    Police:   { name: 'Police Exams',          full: 'Police Recruitment Exams',       iconKey: 'user',      color: 'var(--board-state)',    tagline: 'Choose Your Exam' },
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

    // Get exams from ExamDetailPage (has stages info) + fallback to ExamPresets
    const detailExams = typeof ExamDetailPage !== 'undefined' ? ExamDetailPage.getExamsForBoard(boardId) : [];
    const presets = ExamPresets.getByCategory(boardId);

    // Merge: prefer detail page data (has stages), fill gaps with presets
    const examCards = detailExams.length > 0 ? detailExams : presets.map(p => ({ id: p.id, title: p.name, full: p.fullName, icon: p.icon, board: boardId, stages: [] }));

    return `
      <div class="bp page-enter" style="--board-color: ${meta.color}; max-width: 960px; margin: 0 auto; padding: 0 var(--sp-4);">
        
        <!-- Breadcrumb + Hero -->
        <section class="bp-hero" style="padding: var(--sp-5) 0 var(--sp-3);">
          <div class="bp-breadcrumb" style="font-size: var(--text-xs); color: var(--text-muted); display: flex; gap: 4px; margin-bottom: 12px;">
            <a href="#home" style="color: var(--text-muted); text-decoration: none;">Home</a>
            <span>›</span>
            <span style="color: var(--text-primary); font-weight: 500;">${boardId}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
            <h1 class="bp-title" style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--text-primary); margin: 0; font-family: var(--font-display); letter-spacing: -0.02em;">
              📝 ${boardId} Exams
            </h1>
          </div>
          <p class="bp-sub" style="color: var(--text-secondary); font-size: var(--text-sm); margin: 0 0 4px;">
            Exam select karo → Stages dekho → Tier choose karo → Test start karo
          </p>
        </section>

        <!-- Exam Cards Grid -->
        <section class="bp-section" style="margin-top: 8px;">
          <div class="bp-exam-grid-v3" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
            ${examCards.length === 0 ? `
              <div class="empty-state" style="grid-column: 1/-1; padding: 60px 0; text-align: center;">
                <div class="empty-state-icon" style="font-size: 32px; margin-bottom: 8px;">📭</div>
                <div class="empty-state-title" style="font-weight: 600; color: var(--text-primary);">Coming Soon</div>
                <p style="color: var(--text-muted); font-size: 13px;">Mock tests for this board are being prepared.</p>
              </div>
            ` : examCards.map((exam, i) => this._renderExamCard(exam, meta, i, boardId)).join('')}
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

  _renderExamCard(exam, meta, index, boardId) {
    // Get matching preset for stats
    const preset = typeof ExamPresets !== 'undefined' ? ExamPresets.get(exam.id) : null;
    const totalQ = preset ? preset.totalQuestions : '—';
    const timeMin = preset ? (preset.totalTime >= 3600 ? Math.round(preset.totalTime / 3600) + ' hr' : Math.round(preset.totalTime / 60) + ' min') : '—';
    const negText = preset ? (preset.negativeMarking ? `−${preset.negativeValue} Negative` : 'No Negative') : '';
    const popular = exam.popular;

    // Stage badges — only show CBT-simulatable stages
    const visibleStages = typeof ExamDetailPage !== 'undefined' && ExamDetailPage._getVisibleStages
      ? ExamDetailPage._getVisibleStages(exam)
      : (exam.stages || []);
    
    // Build stage badge HTML
    const stageBadges = visibleStages.map(stage => {
      const isLive = stage.status === 'live';
      const bgColor = isLive ? 'var(--primary-bg, rgba(37,99,235,0.12))' : 'var(--bg-secondary)';
      const textColor = isLive ? 'var(--primary)' : 'var(--text-muted)';
      const icon = isLive ? '✅' : '📄';
      // Shorten the name for badge display
      const shortName = stage.name
        .replace('— Prelims', '').replace('— Mains', '')
        .replace('— CBT', '').replace('— CBT + Skill Test', '')
        .replace('— Paper I', '').replace('— Paper II', '')
        .replace('— Objective', '').replace('— Technical', '')
        .replace('Computer Based Test', 'CBT')
        .replace('GS Paper I', 'GS-I')
        .replace('GS Paper', 'GS')
        .replace('CSAT Paper II', 'CSAT')
        .replace('Previous Year Papers', 'PYQ')
        .trim();
      return `<span style="display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-full, 100px); background: ${bgColor}; color: ${textColor}; border: 1px solid ${isLive ? 'var(--primary-bg, rgba(37,99,235,0.2))' : 'var(--border-color)'}; white-space: nowrap;">${icon} ${shortName}</span>`;
    }).join('');

    // Simulated attempts
    const attempts = (12450 + (index * 1420));

    return `
      <div class="bp-exam-card-v3" onclick="BoardPage._startExam('${exam.id}')"
           style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; cursor: pointer; transition: all 180ms ease; position: relative; animation: fadeInUp 0.35s ${0.06 * index}s ease both;"
           onmouseenter="this.style.borderColor='var(--primary)';this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'"
           onmouseleave="this.style.borderColor='var(--border-color)';this.style.transform='none';this.style.boxShadow='none'">

        ${popular ? `<span style="position: absolute; top: 10px; right: 10px; background: linear-gradient(135deg, #F97316, #EF4444); color: #fff; font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: var(--radius-full, 100px); text-transform: uppercase; letter-spacing: 0.05em;">🔥 Popular</span>` : ''}

        <!-- Exam Name -->
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 22px;">${exam.icon || '📝'}</span>
          <div>
            <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display); letter-spacing: -0.01em;">${exam.title || exam.name || ''}</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 1px;">${exam.full || ''}</div>
          </div>
        </div>

        <!-- Stats Row -->
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <span style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
            📋 ${totalQ} Questions
          </span>
          <span style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
            ⏱ ${timeMin}
          </span>
          ${negText ? `<span style="font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">⚠ ${negText}</span>` : ''}
        </div>

        <!-- Stage Badges -->
        ${stageBadges ? `
        <div style="display: flex; flex-wrap: wrap; gap: 5px;">
          ${stageBadges}
        </div>
        ` : ''}

        <!-- Bottom Row -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2px; padding-top: 8px; border-top: 1px solid var(--border-color);">
          <span style="font-size: 11px; color: var(--text-muted); font-weight: 500;">
            ${attempts.toLocaleString()} tests taken
          </span>
          <span class="btn btn-primary" style="font-family: var(--font-display); font-weight: var(--font-medium); font-size: 13px; padding: 6px 14px;">
            Start Mock Test →
          </span>
        </div>
      </div>
    `;
  },

  _startExam(examId) {
    // Check if exam has detail page entry with stages
    const hasDetail = typeof ExamDetailPage !== 'undefined' && ExamDetailPage._exams && ExamDetailPage._exams[examId];
    
    if (hasDetail) {
      const exam = ExamDetailPage._exams[examId];
      const visibleStages = ExamDetailPage._getVisibleStages(exam);
      const liveStages = visibleStages.filter(s => s.status === 'live');
      
      // Single live stage + few total stages → skip to setup directly
      if (liveStages.length === 1 && visibleStages.length <= 2 && liveStages[0].presetId) {
        App.navigate('setup', { preset: liveStages[0].presetId });
        return;
      }
      
      // Multiple stages → show exam detail page for selection
      App.navigate('exam', { id: examId });
    } else {
      // Fallback: go directly to setup (old behavior)
      App.navigate('setup', { preset: examId });
    }
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent("page_view", { page: "board", board: App.params?.id });
  }
};

window.BoardPage = BoardPage;
