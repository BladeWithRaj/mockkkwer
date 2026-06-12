// ============================================
// BOARD PAGE — Exam Hub per Category
// /board?id=SSC, /board?id=Railway, etc.
// Now with Selection Stages, Exam Pattern, Syllabus & Tips
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

  // ── Selection Stages per board ──
  _stages: {
    SSC: {
      flow: ['Tier 1', 'Tier 2', 'DEST/CPT', 'Document Verification', 'Final Selection'],
      stages: [
        { name: 'Tier 1 (Prelims)', desc: '100 Questions · 60 Minutes · 4 Sections · -0.50 Negative', type: 'objective', status: 'live', icon: '📘' },
        { name: 'Tier 2 (Mains)', desc: 'Session I + II · Math, Reasoning, English, GK, Computer', type: 'objective', status: 'coming', icon: '📗' },
        { name: 'DEST', desc: 'Data Entry Speed Test · 2000 Key Depressions · 15 Minutes', type: 'typing', status: 'coming', icon: '⌨️' },
        { name: 'CPT', desc: 'Computer Proficiency Test · Word, Spreadsheet, Slides', type: 'skill', status: 'coming', icon: '💻' },
        { name: 'Previous Year Papers', desc: 'SSC CGL PYQs (2019–2025) · Year-wise & Shift-wise', type: 'pyq', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SSC CGL Tier-1 Exam Pattern',
        rows: [
          ['Quantitative Aptitude', '25', '50', '15 min', '-0.50'],
          ['General Intelligence & Reasoning', '25', '50', '15 min', '-0.50'],
          ['English Language', '25', '50', '15 min', '-0.50'],
          ['General Awareness', '25', '50', '15 min', '-0.50']
        ],
        total: ['Total', '100', '200', '60 min', '—']
      },
      syllabus: [
        { subject: 'Quantitative Aptitude', topics: 'Number System, Percentage, Ratio & Proportion, Average, Profit & Loss, SI/CI, Time & Work, Time Speed Distance, Algebra, Geometry, Trigonometry, Mensuration, Data Interpretation' },
        { subject: 'General Intelligence & Reasoning', topics: 'Analogy, Classification, Series, Coding-Decoding, Blood Relations, Direction Sense, Venn Diagram, Syllogism, Matrix, Paper Folding, Mirror Image, Embedded Figures' },
        { subject: 'English Language', topics: 'Reading Comprehension, Cloze Test, Error Spotting, Fill in the Blanks, Synonyms/Antonyms, Idioms & Phrases, One Word Substitution, Sentence Improvement' },
        { subject: 'General Awareness', topics: 'History (Ancient, Medieval, Modern), Geography, Indian Polity, Economics, General Science (Physics, Chemistry, Biology), Current Affairs, Static GK' }
      ],
      tips: [
        { title: 'Time Management', text: 'Allocate max 15 minutes per section. Solve easy questions first, attempt difficult ones later.' },
        { title: 'Accuracy Over Speed', text: 'With -0.50 negative marking, guessing is risky. 70-80 correct > 100 attempted with low accuracy.' },
        { title: 'Daily Mock Tests', text: 'Take one mock test daily. Review analysis, identify weak areas, and focus on those topics.' }
      ]
    },
    Railway: {
      flow: ['CBT 1', 'CBT 2', 'CBAT/Typing', 'Document Verification', 'Medical'],
      stages: [
        { name: 'CBT 1', desc: '100 Questions · 90 Minutes · Math, GI, GK, GA', type: 'objective', status: 'live', icon: '📘' },
        { name: 'CBT 2', desc: '120 Questions · 90 Minutes · Advanced Sections', type: 'objective', status: 'coming', icon: '📗' },
        { name: 'Typing Skill Test', desc: 'English 30 WPM / Hindi 25 WPM · Qualifying', type: 'typing', status: 'coming', icon: '⌨️' },
        { name: 'Previous Year Papers', desc: 'RRB NTPC, Group D PYQs (2019–2024)', type: 'pyq', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'RRB NTPC CBT-1 Exam Pattern',
        rows: [
          ['Mathematics', '30', '30', '—', '-⅓'],
          ['General Intelligence & Reasoning', '30', '30', '—', '-⅓'],
          ['General Awareness', '40', '40', '—', '-⅓']
        ],
        total: ['Total', '100', '100', '90 min', '—']
      },
      syllabus: [
        { subject: 'Mathematics', topics: 'Number System, Decimals, Fractions, LCM, HCF, Ratio, Percentage, Mensuration, Time & Work, Time & Distance, SI/CI, Profit & Loss, Algebra, Geometry, Trigonometry, Statistics' },
        { subject: 'General Intelligence & Reasoning', topics: 'Analogies, Alphabetical/Number Series, Coding-Decoding, Mathematical Operations, Relationships, Syllogism, Jumbling, Venn Diagram, Data Interpretation, Conclusions' },
        { subject: 'General Awareness', topics: 'Current Events, History, Culture, Geography, Economics, Polity, General Science, Scientific Research, Sports, Important Schemes' }
      ],
      tips: [
        { title: 'Focus on GK', text: 'General Awareness carries 40 marks — highest weightage. Prepare Current Affairs daily.' },
        { title: 'Speed Math', text: 'Learn shortcut tricks for calculation. Railway exams reward speed over complex problem solving.' }
      ]
    },
    Banking: {
      flow: ['Prelims', 'Mains', 'Interview', 'Final Selection'],
      stages: [
        { name: 'Prelims', desc: '100 Questions · 60 Minutes · 3 Sections · Sectional Cutoff', type: 'objective', status: 'live', icon: '📘' },
        { name: 'Mains', desc: '200 Questions · 180 Minutes · 5 Sections · Descriptive Test', type: 'objective', status: 'coming', icon: '📗' },
        { name: 'Interview', desc: 'Personality Assessment · 100 Marks', type: 'interview', status: 'coming', icon: '🎤' }
      ],
      pattern: {
        title: 'IBPS PO Prelims Exam Pattern',
        rows: [
          ['English Language', '30', '30', '20 min', '-0.25'],
          ['Quantitative Aptitude', '35', '35', '20 min', '-0.25'],
          ['Reasoning Ability', '35', '35', '20 min', '-0.25']
        ],
        total: ['Total', '100', '100', '60 min', '—']
      },
      syllabus: [
        { subject: 'English', topics: 'Reading Comprehension, Cloze Test, Para Jumbles, Fill in the Blanks, Error Detection, Vocabulary' },
        { subject: 'Quantitative Aptitude', topics: 'Simplification, Number Series, Data Interpretation, Quadratic Equations, Arithmetic (Percentage, Ratio, Profit & Loss, Time & Work)' },
        { subject: 'Reasoning', topics: 'Seating Arrangement, Puzzle, Syllogism, Inequality, Blood Relations, Direction Sense, Coding-Decoding, Input-Output, Data Sufficiency' }
      ],
      tips: [
        { title: 'Sectional Cutoff', text: 'Banking exams have sectional cutoffs. You MUST clear each section individually, not just overall.' },
        { title: 'DI is King', text: 'Data Interpretation questions are scoring. Practice 5 DI sets daily for guaranteed marks.' }
      ]
    }
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
    const stageData = this._stages[boardId];

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

          ${stageData ? `
          <!-- Selection Flow Bar -->
          <div class="bp-flow-bar">
            <span class="bp-flow-label">📋 Selection Process:</span>
            ${stageData.flow.map((step, i) => `
              <span class="bp-flow-step ${i === 0 ? 'active' : ''}">${step}</span>
              ${i < stageData.flow.length - 1 ? '<span class="bp-flow-arrow">→</span>' : ''}
            `).join('')}
          </div>
          ` : ''}
        </section>

        ${stageData ? `
        <!-- ═══ SELECTION STAGES ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">Selection Stages</h2>
          <p class="bp-section-sub">Choose your stage, select test type, and start practicing</p>

          <div class="bp-stages-list">
            ${stageData.stages.map((stage, i) => `
              <div class="bp-stage-card ${stage.status === 'coming' ? 'bp-stage-coming' : ''}" style="animation: hp-fadeUp 0.4s ${0.06 * i}s ease both;">
                <div class="bp-stage-left">
                  <span class="bp-stage-icon">${stage.icon}</span>
                  <div>
                    <div class="bp-stage-name">${stage.name}</div>
                    <div class="bp-stage-desc">${stage.desc}</div>
                  </div>
                </div>
                <div class="bp-stage-right">
                  <span class="bp-stage-badge ${stage.status === 'live' ? 'bp-badge-live' : 'bp-badge-soon'}">
                    ${stage.status === 'live' ? '🟢 Live' : '🔜 Coming Soon'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
        ` : ''}

        <!-- Exam Grid (existing) -->
        <section class="bp-section">
          <h2 class="bp-section-title">Mock Tests</h2>
          <p class="bp-section-sub">Start a full-length mock test now</p>
          <div class="bp-exam-grid">
            ${presets.length === 0 ? `
              <div class="empty-state" style="grid-column: 1 / -1; padding: 60px 0;">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-title">Coming Soon</div>
                <p style="color: var(--text-muted);">Mock tests for this board are being prepared.</p>
              </div>
            ` : presets.map((preset, i) => this._renderExamCard(preset, meta, i)).join('')}
          </div>
        </section>

        ${stageData?.pattern ? `
        <!-- ═══ EXAM PATTERN ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">${stageData.pattern.title}</h2>
          <p class="bp-section-sub">Our mock tests follow the exact same pattern</p>
          <div class="bp-table-wrap">
            <table class="bp-table">
              <thead>
                <tr>
                  <th>Section</th><th>Questions</th><th>Max Marks</th><th>Time</th><th>Negative</th>
                </tr>
              </thead>
              <tbody>
                ${stageData.pattern.rows.map(r => `
                  <tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="bp-table-total">
                  <td><strong>${stageData.pattern.total[0]}</strong></td>
                  <td><strong>${stageData.pattern.total[1]}</strong></td>
                  <td><strong>${stageData.pattern.total[2]}</strong></td>
                  <td><strong>${stageData.pattern.total[3]}</strong></td>
                  <td>${stageData.pattern.total[4]}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
        ` : ''}

        ${stageData?.syllabus ? `
        <!-- ═══ SYLLABUS ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">Syllabus</h2>
          <p class="bp-section-sub">Subject-wise important topics</p>
          <div class="bp-syllabus-list">
            ${stageData.syllabus.map((s, i) => `
              <div class="bp-syllabus-item ${i === 0 ? 'open' : ''}" id="syllabus-${i}">
                <button class="bp-syllabus-q" onclick="document.getElementById('syllabus-${i}').classList.toggle('open')">${s.subject}</button>
                <div class="bp-syllabus-a">${s.topics}</div>
              </div>
            `).join('')}
          </div>
        </section>
        ` : ''}

        ${stageData?.tips ? `
        <!-- ═══ PREPARATION TIPS ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">Preparation Tips</h2>
          <p class="bp-section-sub">Top strategies for your exam</p>
          <div class="bp-tips-grid">
            ${stageData.tips.map(tip => `
              <div class="bp-tip-card">
                <div class="bp-tip-title">${tip.title}</div>
                <p class="bp-tip-text">${tip.text}</p>
              </div>
            `).join('')}
          </div>
        </section>
        ` : ''}

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
