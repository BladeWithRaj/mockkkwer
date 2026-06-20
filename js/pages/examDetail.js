// ============================================
// EXAM DETAIL PAGE — Individual Exam Dashboard
// /exam?id=ssc-cgl, /exam?id=rrb-ntpc, etc.
// Shows: Stages, Pattern, Syllabus, Tips, Mock Tests
// ============================================

const ExamDetailPage = {

  // ── Exam-specific data ──
  _exams: {
    // ─── SSC CGL ───
    'ssc-cgl': {
      title: 'SSC CGL 2026',
      full: 'Combined Graduate Level Examination',
      board: 'SSC',
      icon: '🎯',
      color: '#2563EB',
      presetIds: ['ssc-cgl'],
      flow: ['Tier 1 (CBT)', 'Tier 2 (CBT)', 'DEST/CPT', 'Document Verification', 'Final Selection'],
      stages: [
        { name: 'Tier 1 — Prelims', desc: '100 Questions · 60 Minutes · 4 Sections · -0.50 Negative', status: 'live', icon: '📘' },
        { name: 'Tier 2 — Mains', desc: 'Session I + II · Math, Reasoning, English, GK, Computer', status: 'coming', icon: '📗' },
        { name: 'DEST', desc: 'Data Entry Speed Test · 2000 Key Depressions · 15 Minutes', status: 'coming', icon: '⌨️' },
        { name: 'CPT', desc: 'Computer Proficiency Test · Word, Spreadsheet, Slides', status: 'coming', icon: '💻' },
        { name: 'Previous Year Papers', desc: 'SSC CGL PYQs (2019–2025) · Year-wise & Shift-wise', status: 'coming', icon: '📄' }
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
        { title: '⏱ Time Management', text: 'Allocate max 15 minutes per section. Solve easy questions first, attempt difficult ones later.' },
        { title: '🎯 Accuracy Over Speed', text: 'With -0.50 negative marking, guessing is risky. 70-80 correct > 100 attempted with low accuracy.' },
        { title: '📊 Daily Mock Tests', text: 'Take one mock test daily. Review analysis, identify weak areas, and focus on those topics.' }
      ]
    },

    // ─── SSC CHSL ───
    'ssc-chsl': {
      title: 'SSC CHSL 2026',
      full: 'Combined Higher Secondary Level',
      board: 'SSC',
      icon: '📝',
      color: '#3B82F6',
      presetIds: ['ssc-chsl'],
      flow: ['Tier 1 (CBT)', 'Tier 2 (CBT+DEST)', 'Document Verification', 'Final Selection'],
      stages: [
        { name: 'Tier 1 — CBT', desc: '100 Questions · 60 Minutes · 4 Sections · -0.50 Negative', status: 'live', icon: '📘' },
        { name: 'Tier 2 — CBT + Skill Test', desc: 'Math, GK, English, Computer · DEST Typing Test', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'SSC CHSL PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SSC CHSL Tier-1 Exam Pattern',
        rows: [
          ['Quantitative Aptitude', '25', '50', '15 min', '-0.50'],
          ['General Intelligence', '25', '50', '15 min', '-0.50'],
          ['English Language', '25', '50', '15 min', '-0.50'],
          ['General Awareness', '25', '50', '15 min', '-0.50']
        ],
        total: ['Total', '100', '200', '60 min', '—']
      },
      syllabus: [
        { subject: 'Quantitative Aptitude', topics: 'Arithmetic, Algebra, Geometry, Trigonometry, Mensuration, Data Interpretation' },
        { subject: 'General Intelligence', topics: 'Analogies, Series, Classification, Coding-Decoding, Venn Diagram, Syllogism' },
        { subject: 'English Language', topics: 'Error Spotting, Cloze Test, Reading Comprehension, Synonyms, Antonyms, Idioms' },
        { subject: 'General Awareness', topics: 'History, Geography, Polity, Economics, Science, Current Affairs' }
      ],
      tips: [
        { title: '📖 Focus on Basics', text: 'CHSL is 10+2 level. Focus on conceptual clarity over complex problem solving.' },
        { title: '⚡ Speed Matters', text: '60 minutes for 100 questions means 36 seconds per question. Practice speed drills.' }
      ]
    },

    // ─── SSC MTS ───
    'ssc-mts': {
      title: 'SSC MTS 2026',
      full: 'Multi Tasking Staff',
      board: 'SSC',
      icon: '📋',
      color: '#0EA5E9',
      presetIds: ['ssc-mts'],
      flow: ['CBT', 'Physical Test', 'Document Verification'],
      stages: [
        { name: 'Computer Based Test', desc: '150 Questions · 90 Minutes · Numerical, Reasoning, English, GA', status: 'live', icon: '📘' },
        { name: 'Previous Year Papers', desc: 'SSC MTS PYQs (2020–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SSC MTS CBT Exam Pattern',
        rows: [
          ['Numerical Aptitude', '20', '60', '—', '-1.00'],
          ['Reasoning & GI', '20', '60', '—', '-1.00'],
          ['English Language', '25', '75', '—', '-1.00'],
          ['General Awareness', '25', '75', '—', '-1.00']
        ],
        total: ['Total', '90', '270', '90 min', '—']
      },
      syllabus: [
        { subject: 'Numerical Aptitude', topics: 'Number System, HCF/LCM, Percentage, Average, Ratio, Profit & Loss, SI/CI, Time & Work' },
        { subject: 'Reasoning', topics: 'Analogies, Classification, Series, Coding-Decoding, Directions, Blood Relations' },
        { subject: 'English', topics: 'Vocabulary, Grammar, Reading Comprehension, Sentence Correction' },
        { subject: 'General Awareness', topics: 'History, Geography, Polity, Economics, Science, Current Affairs' }
      ],
      tips: [
        { title: '📌 Easy Level', text: 'MTS is the easiest SSC exam. Focus on accuracy — cutoff is usually low but competition is high.' }
      ]
    },

    // ─── SSC GD ───
    'ssc-gd': {
      title: 'SSC GD Constable 2026',
      full: 'General Duty Constable',
      board: 'SSC',
      icon: '🛡️',
      color: '#DC2626',
      presetIds: ['ssc-gd'],
      flow: ['CBT', 'PET/PST', 'Medical', 'Document Verification'],
      stages: [
        { name: 'Computer Based Test', desc: '80 Questions · 60 Minutes · 4 Sections · No Negative', status: 'live', icon: '📘' },
        { name: 'Physical Test', desc: 'PET (Running, Long Jump) + PST (Height, Chest)', status: 'coming', icon: '🏃' },
        { name: 'Previous Year Papers', desc: 'SSC GD PYQs (2018–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SSC GD Constable Exam Pattern',
        rows: [
          ['General Intelligence & Reasoning', '20', '40', '—', 'No Neg'],
          ['General Knowledge & GA', '20', '40', '—', 'No Neg'],
          ['Elementary Mathematics', '20', '40', '—', 'No Neg'],
          ['English / Hindi', '20', '40', '—', 'No Neg']
        ],
        total: ['Total', '80', '160', '60 min', '—']
      },
      syllabus: [
        { subject: 'Reasoning', topics: 'Analogies, Classification, Series, Coding-Decoding, Matrix, Venn Diagram, Directions' },
        { subject: 'General Knowledge', topics: 'History, Geography, Polity, Economics, Science, Sports, Current Affairs' },
        { subject: 'Mathematics', topics: 'Number System, HCF/LCM, Decimals, Fractions, Percentage, Average, Ratio, SI/CI' },
        { subject: 'English/Hindi', topics: 'Vocabulary, Grammar, Comprehension, Fill in the Blanks, Error Detection' }
      ],
      tips: [
        { title: '✅ No Negative Marking', text: 'Attempt ALL questions. There is no penalty for wrong answers in SSC GD.' },
        { title: '🏃 Physical Fitness', text: 'Clear CBT first, then focus on physical tests. Start running practice early.' }
      ]
    },

    // ─── RRB NTPC ───
    'rrb-ntpc': {
      title: 'RRB NTPC 2026',
      full: 'Non-Technical Popular Categories',
      board: 'Railway',
      icon: '🚆',
      color: '#059669',
      presetIds: ['rrb-ntpc'],
      flow: ['CBT 1', 'CBT 2', 'CBAT/Typing', 'Document Verification', 'Medical'],
      stages: [
        { name: 'CBT 1', desc: '100 Questions · 90 Minutes · Math, GI, GK', status: 'live', icon: '📘' },
        { name: 'CBT 2', desc: '120 Questions · 90 Minutes · Advanced Level', status: 'coming', icon: '📗' },
        { name: 'Typing Skill Test', desc: 'English 30 WPM / Hindi 25 WPM · Qualifying', status: 'coming', icon: '⌨️' }
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
        { subject: 'General Intelligence & Reasoning', topics: 'Analogies, Number Series, Coding-Decoding, Mathematical Operations, Relationships, Syllogism, Venn Diagram, Data Interpretation' },
        { subject: 'General Awareness', topics: 'Current Events, History, Culture, Geography, Economics, Polity, General Science, Scientific Research, Sports' }
      ],
      tips: [
        { title: '📚 Focus on GK', text: 'General Awareness carries 40 marks — highest weightage. Read daily current affairs.' },
        { title: '⚡ Speed Math', text: 'Learn shortcut tricks. Railway exams reward speed over complex problem solving.' }
      ]
    },

    // ─── IBPS PO ───
    'ibps-po': {
      title: 'IBPS PO 2026',
      full: 'Probationary Officer',
      board: 'Banking',
      icon: '🏦',
      color: '#7C3AED',
      presetIds: ['ibps-po'],
      flow: ['Prelims', 'Mains', 'Interview', 'Final Selection'],
      stages: [
        { name: 'Prelims', desc: '100 Questions · 60 Minutes · 3 Sections · Sectional Cutoff', status: 'live', icon: '📘' },
        { name: 'Mains', desc: '200 Questions · 180 Minutes · 5 Sections · Descriptive Test', status: 'coming', icon: '📗' },
        { name: 'Interview', desc: 'Personality Assessment · 100 Marks', status: 'coming', icon: '🎤' }
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
        { subject: 'Quantitative Aptitude', topics: 'Simplification, Number Series, Data Interpretation, Quadratic Equations, Arithmetic' },
        { subject: 'Reasoning', topics: 'Seating Arrangement, Puzzle, Syllogism, Inequality, Blood Relations, Coding-Decoding, Input-Output' }
      ],
      tips: [
        { title: '📊 Sectional Cutoff', text: 'Banking exams have sectional cutoffs. You MUST clear each section individually.' },
        { title: '📈 DI is King', text: 'Data Interpretation is the highest scoring area. Practice 5 DI sets daily.' }
      ]
    }
  },

  // ── Get exam list for a board ──
  getExamsForBoard(boardId) {
    return Object.entries(this._exams)
      .filter(([_, exam]) => exam.board === boardId)
      .map(([id, exam]) => ({ id, ...exam }));
  },

  render(params) {
    const examId = params?.id;
    const exam = this._exams[examId];

    if (!exam) {
      return `
        <div class="empty-state" style="padding-top: 120px;">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">Exam Not Found</div>
          <p style="color: var(--text-muted);">The requested exam doesn't exist yet.</p>
          <button class="btn btn-primary" onclick="App.navigate('home')" style="margin-top: 16px;">← Back to Home</button>
        </div>
      `;
    }

    // Find matching presets for mock tests
    const allPresets = typeof ExamPresets !== 'undefined' && ExamPresets.getAll ? ExamPresets.getAll() : [];
    const matchingPresets = allPresets.filter(p =>
      exam.presetIds.some(pid => p.id === pid || p.id.includes(pid))
    );

    return `
      <div class="page-enter" style="--board-color: ${exam.color};">

        <!-- Hero -->
        <section class="bp-hero">
          <div class="bp-breadcrumb">
            <a href="#home">Home</a>
            <span>›</span>
            <a href="#board?id=${exam.board}" style="color: var(--text-secondary);">${exam.board}</a>
            <span>›</span>
            <span style="color: var(--text-primary); font-weight: 500;">${exam.title}</span>
          </div>

          <h1 class="bp-title">${exam.icon} ${exam.title}</h1>
          <p class="bp-sub">${exam.full}</p>

          <!-- Selection Flow Bar -->
          <div class="bp-flow-bar">
            <span class="bp-flow-label">📋 Selection Process:</span>
            ${exam.flow.map((step, i) => `
              <span class="bp-flow-step ${i === 0 ? 'active' : ''}">${step}</span>
              ${i < exam.flow.length - 1 ? '<span class="bp-flow-arrow">→</span>' : ''}
            `).join('')}
          </div>
        </section>

        <!-- ═══ SELECTION STAGES ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">Selection Stages</h2>
          <p class="bp-section-sub">Choose your stage and start practicing</p>

          <div class="bp-stages-list">
            ${exam.stages.map((stage, i) => `
              <div class="bp-stage-card ${stage.status === 'coming' ? 'bp-stage-coming' : 'bp-stage-live-clickable'}"
                   style="animation: fadeInUp 0.4s ${0.06 * i}s ease both;${stage.status === 'live' ? 'cursor:pointer;' : ''}"
                   ${stage.status === 'live' ? `onclick="HomePage.startPresetExam('${examId}')"` : ''}>
                <div class="bp-stage-left">
                  <span class="bp-stage-icon">${stage.icon}</span>
                  <div>
                    <div class="bp-stage-name">${stage.name}</div>
                    <div class="bp-stage-desc">${stage.desc}</div>
                  </div>
                </div>
                <div class="bp-stage-right">
                  ${stage.status === 'live'
                    ? `<button class="bp-stage-start-btn" style="--board-color: ${exam.color};">▶ Start Test</button>`
                    : `<span class="bp-stage-badge bp-badge-soon">🔜 Coming Soon</span>`
                  }
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ═══ MOCK TESTS ═══ -->
        ${matchingPresets.length > 0 ? `
        <section class="bp-section">
          <h2 class="bp-section-title">Mock Tests</h2>
          <p class="bp-section-sub">Start a full-length mock test now</p>
          <div class="bp-exam-grid">
            ${matchingPresets.map((preset, i) => `
              <div class="bp-exam-card" style="animation: fadeInUp 0.4s ${0.05 * i}s ease both;">
                <div class="bp-exam-top">
                  <span class="bp-exam-icon">${preset.icon || exam.icon}</span>
                  <span class="bp-exam-badge" style="--board-color: ${exam.color};">${preset.category || exam.board}</span>
                </div>
                <div class="bp-exam-name">${preset.name}</div>
                <div class="bp-exam-full">${preset.fullName || ''}</div>
                <div class="bp-exam-tags">
                  <span class="bp-exam-tag">${preset.totalQuestions} Questions</span>
                  <span class="bp-exam-tag">${preset.totalTime >= 3600 ? Math.round(preset.totalTime/3600)+' hr' : Math.round(preset.totalTime/60)+' min'}</span>
                  <span class="bp-exam-tag ${preset.negativeMarking ? 'neg' : ''}">${preset.negativeMarking ? '-'+preset.negativeValue+' per wrong' : 'No negative'}</span>
                </div>
                <div class="bp-exam-sections">
                  ${(preset.sections || []).map(s => `<span class="bp-section-pill">${s.name} (${s.questions})</span>`).join('')}
                </div>
                <button class="bp-exam-start" style="--board-color: ${exam.color};"
                        onclick="HomePage.startPresetExam('${preset.id}')" id="start-${preset.id}">
                  Start ${preset.name} Test →
                </button>
              </div>
            `).join('')}
          </div>
        </section>
        ` : `
        <section class="bp-section">
          <h2 class="bp-section-title">Mock Tests</h2>
          <p class="bp-section-sub">Full-length mock tests coming soon</p>
          <div class="bp-stage-card bp-stage-coming">
            <div class="bp-stage-left">
              <span class="bp-stage-icon">📝</span>
              <div>
                <div class="bp-stage-name">${exam.title} Mock Test</div>
                <div class="bp-stage-desc">Full-length practice tests are being prepared</div>
              </div>
            </div>
            <div class="bp-stage-right">
              <span class="bp-stage-badge bp-badge-soon">🔜 Coming Soon</span>
            </div>
          </div>
        </section>
        `}

        <!-- ═══ EXAM PATTERN ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">${exam.pattern.title}</h2>
          <p class="bp-section-sub">Our mock tests follow the exact same pattern</p>
          <div class="bp-table-wrap">
            <table class="bp-table">
              <thead>
                <tr><th>Section</th><th>Questions</th><th>Max Marks</th><th>Time</th><th>Negative</th></tr>
              </thead>
              <tbody>
                ${exam.pattern.rows.map(r => `
                  <tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="bp-table-total">
                  <td><strong>${exam.pattern.total[0]}</strong></td>
                  <td><strong>${exam.pattern.total[1]}</strong></td>
                  <td><strong>${exam.pattern.total[2]}</strong></td>
                  <td><strong>${exam.pattern.total[3]}</strong></td>
                  <td>${exam.pattern.total[4]}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <!-- ═══ SYLLABUS ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">Syllabus</h2>
          <p class="bp-section-sub">Subject-wise important topics</p>
          <div class="bp-syllabus-list">
            ${exam.syllabus.map((s, i) => `
              <div class="bp-syllabus-item ${i === 0 ? 'open' : ''}" id="syllabus-${i}">
                <button class="bp-syllabus-q" onclick="document.getElementById('syllabus-${i}').classList.toggle('open')">${s.subject}</button>
                <div class="bp-syllabus-a">${s.topics}</div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ═══ PREPARATION TIPS ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">Preparation Tips</h2>
          <p class="bp-section-sub">Top strategies for ${exam.title}</p>
          <div class="bp-tips-grid">
            ${exam.tips.map(tip => `
              <div class="bp-tip-card">
                <div class="bp-tip-title">${tip.title}</div>
                <p class="bp-tip-text">${tip.text}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Back -->
        <div style="text-align: center; padding: 0 24px 48px;">
          <button class="hp5-btn-secondary" onclick="App.navigate('board', {id: '${exam.board}'})" style="font-size: 14px;">
            ← Back to ${exam.board} Exams
          </button>
        </div>
      </div>
    `;
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent("page_view", { page: "exam_detail", exam: App.params?.id });
  }
};

window.ExamDetailPage = ExamDetailPage;
