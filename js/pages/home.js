// ============================================
// HOME PAGE — Clean Scholar v7
// 4 sections: Hero/Continue, Categories, Popular Tests, Daily Challenge
// One Primary Action: Start Test
// ============================================

const HomePage = {

  _boardConfig: {
    SSC:      { icon: '📋', color: 'var(--board-ssc)',      label: 'SSC',         desc: 'CGL · CHSL · MTS',       bg: '#EFF6FF' },
    Railway:  { icon: '🚆', color: 'var(--board-railway)',  label: 'Railway',     desc: 'NTPC · Group D · ALP',   bg: '#FEF2F2' },
    Banking:  { icon: '🏦', color: 'var(--board-banking)',  label: 'Banking',     desc: 'IBPS · SBI · RBI',       bg: '#ECFDF5' },
    UPSC:     { icon: '⚖️', color: 'var(--board-upsc)',     label: 'UPSC',        desc: 'IAS · IPS · IFS',        bg: '#FFFBEB' },
    Teaching: { icon: '🎓', color: 'var(--board-teaching)', label: 'Teaching',    desc: 'CTET · STET · TET',      bg: '#ECFEFF' },
    Defence:  { icon: '🛡️', color: 'var(--board-defence)',  label: 'Defence',     desc: 'CDS · NDA · AFCAT',      bg: '#F5F3FF' },
    State:    { icon: '🏛️', color: 'var(--board-state)',    label: 'State Exams', desc: 'PSC · State level',      bg: '#FFF7ED' }
  },

  _getBoards() {
    const allPresets = window.ExamPresets?.getAll ? ExamPresets.getAll() : [];
    const boardMap = {};
    for (const p of allPresets) {
      const cat = p.category || 'Other';
      if (cat === 'Quick' || cat === 'Daily') continue;
      if (!boardMap[cat]) boardMap[cat] = 0;
      boardMap[cat]++;
    }
    return Object.keys(boardMap).length
      ? Object.entries(boardMap).map(([id, count]) => ({ id, count, ...this._boardConfig[id] || { icon: '📝', color: 'var(--primary)', label: id, desc: 'Exam category', bg: '#F8FAFC' } }))
      : Object.entries(this._boardConfig).map(([id, cfg]) => ({ id, count: 5, ...cfg }));
  },

  _getPopularExams() {
    if (!window.ExamPresets?.getAll) return [];
    return ExamPresets.getAll()
      .filter(p => p.category !== 'Quick' && p.category !== 'Daily')
      .slice(0, 6)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category || '',
        questions: p.totalQuestions || 0,
        minutes: Math.round((p.totalTime || 0) / 60),
        neg: p.negativeMarking ? `−${p.negativeValue}` : 'No neg.'
      }));
  },

  render() {
    const hasResume = !!window.Storage?.getCurrentTest?.();
    const dailyDone = window.DailySystem?.isDailyDone?.() || false;
    const streak = window.DailySystem?.getStreak?.()?.current || 0;
    const boards = this._getBoards();
    const exams = this._getPopularExams();

    return `
      <div class="hp page-enter">
        <div class="hp-container">

          ${hasResume ? this._renderContinue() : this._renderHero(streak)}

          <!-- Exam Categories -->
          <div class="hp-section">
            <div class="hp-section-title">Choose Your Exam</div>
            <div class="hp-board-grid">
              ${boards.map(b => `
                <a href="#board?id=${b.id}" class="hp-board-card" style="--bc:${b.color}">
                  <div class="hp-board-icon" style="background:${b.bg || 'var(--bg-secondary)'};color:${b.color}">
                    <span style="font-size:18px;line-height:1">${b.icon || '📝'}</span>
                  </div>
                  <div style="flex:1;min-width:0">
                    <div class="hp-board-name">${b.label}</div>
                    <div class="hp-board-count">${b.desc || b.count + ' tests'}</div>
                  </div>
                  <div class="hp-board-chevron">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>

          <!-- Popular Tests -->
          ${exams.length ? `
          <div class="hp-section">
            <div class="hp-section-title">Popular Tests</div>
            <div class="hp-exam-list">
              ${exams.map(e => `
                <div class="hp-exam-card" onclick="HomePage._startExam('${e.id}')">
                  <div>
                    <div class="hp-exam-name">${e.name}</div>
                    <div class="hp-exam-meta">${e.questions} Qs · ${e.minutes} min · ${e.neg}</div>
                  </div>
                  <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();HomePage._startExam('${e.id}')">
                    Start →
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Daily Challenge -->
          <div class="hp-section">
            <div class="hp-section-title">Daily Challenge</div>
            <div class="hp-daily-card ${dailyDone ? 'done' : ''}" ${!dailyDone ? `onclick="HomePage._startDaily()"` : ''}>
              <div class="hp-daily-left">
                <div class="hp-daily-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                  </svg>
                </div>
                <div>
                  <div class="hp-daily-title">Today's Challenge</div>
                  <div class="hp-daily-meta">15 questions · 10 minutes${streak > 0 ? ` · 🔥 ${streak} day streak` : ''}</div>
                </div>
              </div>
              <span class="hp-daily-action">${dailyDone ? '✓ Completed' : 'Start →'}</span>
            </div>
          </div>

        </div>

        ${App._renderFooter()}
      </div>
    `;
  },

  _renderHero(streak) {
    return `
      <div class="hp-hero">
        <div class="hp-hero-eyebrow">Free mock tests for competitive exams</div>
        <h1 class="hp-welcome-title">Prepare smarter.<br>Score higher.</h1>
        <p class="hp-welcome-text">
          SSC, Railway, Banking, UPSC — full-length mock tests with real exam patterns and instant results.
        </p>
        <div class="hp-hero-actions">
          <button class="btn btn-primary btn-lg" onclick="App.navigate('setup')">Start Practice Test →</button>
          <a href="#leaderboard" class="btn btn-secondary">View Leaderboard</a>
        </div>
      </div>
    `;
  },

  _renderContinue() {
    return `
      <div class="hp-continue-card">
        <div>
          <div class="hp-continue-label">Test in Progress</div>
          <div class="hp-continue-name">Continue where you left off</div>
          <div class="hp-continue-meta">Your answers are saved</div>
        </div>
        <button class="btn btn-primary" onclick="App.navigate('test')">Continue →</button>
      </div>
    `;
  },

  async _startExam(presetId) {
    if (!window.ExamPresets) return;
    const cfg = ExamPresets.buildConfig(presetId);
    if (!cfg) { window.Helpers?.showToast?.('Exam not found', 'error'); return; }
    App.navigate('setup', { preset: presetId });
  },

  async _startDaily() {
    if (window.DailySystem?.isDailyDone?.()) {
      window.Helpers?.showToast?.('Daily challenge already completed today', 'info');
      return;
    }
    App.navigate('setup', { preset: 'daily-challenge', daily: '1' });
  },

  afterRender() {
    if (window.trackEvent) trackEvent('page_view', { page: 'home' });
  }
};
