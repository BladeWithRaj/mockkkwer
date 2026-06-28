// ============================================
// HOME PAGE — Clean Scholar v7
// 3 sections: Continue/Start, Popular Exams, Daily Challenge
// One Primary Action: Start Test
// ============================================

const HomePage = {
  _boardDesignTokens: {
    'SSC': { color: 'var(--board-ssc)', icon: 'clipboard', label: 'SSC', desc: 'Staff Selection Commission' },
    'Railway': { color: 'var(--board-railway)', icon: 'train', label: 'Railway', desc: 'Railway Recruitment Board' },
    'Banking': { color: 'var(--board-banking)', icon: 'landmark', label: 'Banking', desc: 'IBPS & bank exams' },
    'UPSC': { color: 'var(--board-upsc)', icon: 'scale', label: 'UPSC', desc: 'Union Public Service Commission' },
    'Teaching': { color: 'var(--board-teaching)', icon: 'graduationCap', label: 'Teaching', desc: 'CTET and teaching exams' },
    'Defence': { color: 'var(--board-defence)', icon: 'shield', label: 'Defence', desc: 'CDS, NDA and defence exams' },
    'State': { color: 'var(--board-state)', icon: 'building', label: 'State Exams', desc: 'State level examinations' }
  },

  _getPopularExams() {
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];
    return allPresets
      .filter(p => p.category !== 'Quick' && p.category !== 'Daily')
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || 'Exam',
        questions: p.totalQuestions || 0,
        minutes: Math.round((p.totalTime || 0) / 60),
        negative: p.negativeMarking ? `-${p.negativeValue}` : 'No neg.'
      }));
  },

  _getBoards() {
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];
    if (!allPresets.length) return this._getDefaultBoards();

    const boardMap = {};
    for (const preset of allPresets) {
      const cat = preset.category || 'Other';
      if (cat === 'Quick' || cat === 'Daily') continue;
      if (!boardMap[cat]) boardMap[cat] = { id: cat, count: 0 };
      boardMap[cat].count++;
    }

    return Object.values(boardMap).map(board => {
      const tokens = this._boardDesignTokens[board.id] || {};
      return {
        id: board.id,
        icon: tokens.icon || 'fileText',
        color: tokens.color || 'var(--primary)',
        label: tokens.label || board.id,
        desc: tokens.desc || 'Exam category',
        count: board.count
      };
    });
  },

  _getDefaultBoards() {
    return [
      { id: 'SSC', icon: 'clipboard', color: 'var(--board-ssc)', label: 'SSC', desc: 'Staff Selection Commission', count: 5 },
      { id: 'Railway', icon: 'train', color: 'var(--board-railway)', label: 'Railway', desc: 'Railway Recruitment Board', count: 4 },
      { id: 'Banking', icon: 'landmark', color: 'var(--board-banking)', label: 'Banking', desc: 'IBPS and bank exams', count: 3 },
      { id: 'UPSC', icon: 'scale', color: 'var(--board-upsc)', label: 'UPSC', desc: 'Union Public Service Commission', count: 3 },
      { id: 'Teaching', icon: 'graduationCap', color: 'var(--board-teaching)', label: 'Teaching', desc: 'CTET and teaching exams', count: 3 },
      { id: 'Defence', icon: 'shield', color: 'var(--board-defence)', label: 'Defence', desc: 'CDS, NDA and defence exams', count: 3 }
    ];
  },

  render() {
    const hasResumeTest = !!Storage.getCurrentTest();
    const dailyDone = DailySystem.isDailyDone();
    const streakAlive = DailySystem.isStreakAlive();

    return `
      <div class="page-enter hp">
        <div class="hp-container">

          <!-- Section 1: Continue / Start -->
          ${hasResumeTest ? this._renderContinue() : this._renderWelcome()}

          <!-- Section 2: Exam Categories -->
          <section class="hp-section">
            <h2 class="hp-section-title">Exam Categories</h2>
            <div class="hp-board-grid">
              ${this._getBoards().map(board => `
                <a href="#board?id=${board.id}" class="hp-board-card" style="--bc: ${board.color};">
                  <div class="hp-board-icon" style="color: ${board.color}">
                    ${Icons.get(board.icon, 18)}
                  </div>
                  <div class="hp-board-info">
                    <div class="hp-board-name">${board.label}</div>
                    <div class="hp-board-desc">${board.desc}</div>
                  </div>
                  <span class="hp-board-count">${board.count}</span>
                </a>
              `).join('')}
            </div>
          </section>

          <!-- Section 3: Popular Exams -->
          <section class="hp-section">
            <h2 class="hp-section-title">Popular Tests</h2>
            <div class="hp-exam-list">
              ${this._getPopularExams().map(exam => `
                <div class="hp-exam-card" onclick="HomePage.startPresetExam('${exam.id}')">
                  <div class="hp-exam-info">
                    <div class="hp-exam-name">${exam.name}</div>
                    <div class="hp-exam-meta">${exam.questions}Q · ${exam.minutes} min · ${exam.negative}</div>
                  </div>
                  <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); HomePage.startPresetExam('${exam.id}')">Start</button>
                </div>
              `).join('')}
            </div>
          </section>

          <!-- Section 4: Daily Challenge -->
          <section class="hp-section">
            <div class="hp-daily-card ${dailyDone ? 'done' : ''}" ${dailyDone ? '' : 'onclick="HomePage.startDailyChallenge()"'}>
              <div class="hp-daily-left">
                <div class="hp-daily-icon">${Icons.get(streakAlive ? 'flame' : 'clock', 20)}</div>
                <div>
                  <div class="hp-daily-title">Daily Challenge</div>
                  <div class="hp-daily-meta">15 Questions · 10 Minutes</div>
                </div>
              </div>
              <span class="hp-daily-action">${dailyDone ? 'Done ✓' : 'Start →'}</span>
            </div>
          </section>

        </div>

        ${App._renderFooter()}
      </div>
    `;
  },

  _renderContinue() {
    return `
      <section class="hp-section hp-hero-section">
        <div class="hp-continue-card">
          <div class="hp-continue-info">
            <div class="hp-continue-label">Continue your test</div>
            <div class="hp-continue-text">You have a test in progress on this device.</div>
          </div>
          <button class="btn btn-primary" onclick="App.navigate('test')">
            Continue →
          </button>
        </div>
      </section>
    `;
  },

  _renderWelcome() {
    return `
      <section class="hp-section hp-hero-section">
        <div class="hp-welcome">
          <h1 class="hp-welcome-title">Practice for competitive exams</h1>
          <p class="hp-welcome-text">SSC, Railway, Banking, UPSC — free mock tests with real exam pattern.</p>
          <button class="btn btn-primary btn-lg" onclick="App.navigate('setup')">
            Start Mock Test →
          </button>
        </div>
      </section>
    `;
  },

  // ── Actions ──

  async startPresetExam(presetId) {
    const config = ExamPresets.buildConfig(presetId);
    if (!config) { Helpers.showToast('Exam preset not found', 'error'); return; }
    App.navigate('setup', {
      preset: presetId, exam: config.examName,
      subjects: config.subjects.join(','), questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0
    });
  },

  async startDailyChallenge() {
    if (DailySystem.isDailyDone()) { Helpers.showToast('Daily challenge already completed today', 'info'); return; }
    const config = DailySystem.getDailyConfig();
    if (!config) { Helpers.showToast('Could not load daily challenge config', 'error'); return; }
    App.navigate('setup', {
      preset: 'daily-challenge', exam: 'Daily Challenge',
      subjects: config.subjects.join(','), questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0, daily: '1'
    });
  },

  async startQuickMode(modeId) {
    const config = ExamPresets.buildConfig(modeId);
    if (!config) { Helpers.showToast('Mode not found', 'error'); return; }
    App.navigate('setup', {
      preset: modeId, exam: config.examName,
      subjects: config.subjects.join(','), questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0
    });
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent('page_view', { page: 'home' });
  }
};
