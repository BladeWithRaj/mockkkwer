// HOME PAGE - Exam portal layout

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

  _fallbackColors: ['#2563EB', '#16A34A', '#EA580C', '#0284C7', '#475569'],
  _fallbackIcons: ['fileText', 'bookOpen', 'target', 'listChecks', 'activity'],

  _getBoards() {
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];
    if (!allPresets.length) return this._getDefaultBoards();

    const boardMap = {};
    for (const preset of allPresets) {
      const cat = preset.category || 'Other';
      if (cat === 'Quick' || cat === 'Daily') continue;
      if (!boardMap[cat]) boardMap[cat] = { id: cat, exams: [] };
      boardMap[cat].exams.push(preset);
    }

    let colorIdx = 0;
    const boards = Object.values(boardMap).map(board => {
      const tokens = this._boardDesignTokens[board.id] || {};
      const examNames = board.exams
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .slice(0, 5)
        .map(e => e.name.replace(board.id + ' ', '').replace('RRB ', '').replace('RPF ', ''))
        .join(' | ');
      return {
        id: board.id,
        icon: tokens.icon || this._fallbackIcons[colorIdx % this._fallbackIcons.length],
        color: tokens.color || this._fallbackColors[colorIdx++ % this._fallbackColors.length],
        label: tokens.label || board.id,
        desc: tokens.desc || 'Exam category',
        exams: examNames,
        count: board.exams.length
      };
    });
    return boards.length > 0 ? boards : this._getDefaultBoards();
  },

  _getDefaultBoards() {
    return [
      { id: 'SSC', icon: 'clipboard', color: 'var(--board-ssc)', label: 'SSC', desc: 'Staff Selection Commission', exams: 'CGL | CHSL | MTS | GD | CPO', count: 5 },
      { id: 'Railway', icon: 'train', color: 'var(--board-railway)', label: 'Railway', desc: 'Railway Recruitment Board', exams: 'NTPC | Group D | ALP | JE', count: 4 },
      { id: 'Banking', icon: 'landmark', color: 'var(--board-banking)', label: 'Banking', desc: 'IBPS and bank exams', exams: 'IBPS PO | SBI Clerk | RBI Assistant', count: 3 },
      { id: 'UPSC', icon: 'scale', color: 'var(--board-upsc)', label: 'UPSC', desc: 'Union Public Service Commission', exams: 'Prelims | CSAT | NDA', count: 3 },
      { id: 'Teaching', icon: 'graduationCap', color: 'var(--board-teaching)', label: 'Teaching', desc: 'CTET and teaching exams', exams: 'CTET | SUPER TET | KVS', count: 3 },
      { id: 'Defence', icon: 'shield', color: 'var(--board-defence)', label: 'Defence', desc: 'CDS, NDA and defence exams', exams: 'CDS | NDA | AFCAT', count: 3 }
    ];
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
        negative: p.negativeMarking ? `-${p.negativeValue}` : 'No negative',
        meta: `${p.totalQuestions || 0} Questions | ${Math.round((p.totalTime || 0) / 60)} Min | ${p.negativeMarking ? `-${p.negativeValue}` : 'No negative'}`
      }));
  },

  render() {
    const streak = DailySystem.getStreak();
    const dailyDone = DailySystem.isDailyDone();
    const goal = DailySystem.getDailyGoal();
    const streakAlive = DailySystem.isStreakAlive();
    const hasResumeTest = !!Storage.getCurrentTest();
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : Object.values(ExamPresets._presets || {});
    const latestTests = allPresets.filter(p => p.category !== 'Quick' && p.category !== 'Daily').slice(0, 5);
    const recentPyqs = latestTests.slice(0, 4);

    return `
      <div class="page-enter-v3 hp-v5">
        <section class="hp5-top-band">
          <div class="hp5-top-inner">
            <div class="hp5-title-row">
              <div class="hp5-title-block">
                <h1>Mock24hr Exam Practice</h1>
                <p>SSC, Railway, Banking, UPSC and Polytechnic practice tests in CBT format.</p>
              </div>
              <label class="hp5-search">
                ${Icons.get('search', 16)}
                <input type="search" placeholder="Search exam, subject or test" aria-label="Search exams">
              </label>
            </div>

            <div class="hp5-category-strip" aria-label="Exam categories">
              ${this._getBoards().map(board => `
                <button class="hp5-cat-tab" onclick="App.navigate('board', {id: '${board.id}'})">
                  ${Icons.get(board.icon, 15)}
                  <span>${board.label}</span>
                  <span class="hp5-cat-count">${board.count}</span>
                </button>
              `).join('')}
              <button class="hp5-cat-tab" onclick="window.location.href='/polytechnic-important-paper/'">
                ${Icons.get('fileText', 15)}
                <span>Polytechnic</span>
                <span class="hp5-cat-count">Paper</span>
              </button>
            </div>
          </div>
        </section>

        <section class="hp5-container">
          <div class="hp5-grid-main">
            <div>
              <div class="hp5-section-head">
                <div>
                  <h2>Exam Categories</h2>
                  <p>Category > Exam > Stage > Subject > Test Type > Test</p>
                </div>
                <a class="hp5-section-link" href="#exams">View exams</a>
              </div>
              <div class="hp5-board-grid" id="board-section">
                ${this._getBoards().map(board => `
                  <div class="hp5-board-card" style="--bc: ${board.color};" onclick="App.navigate('board', {id: '${board.id}'})" id="board-card-${board.id}">
                    <div class="hp5-board-icon">${Icons.get(board.icon, 18)}</div>
                    <div>
                      <div class="hp5-board-name">${board.label}</div>
                      <div class="hp5-board-desc">${board.desc}</div>
                      <div class="hp5-board-tags">${board.exams}</div>
                    </div>
                    <div class="hp5-board-count">${board.count} Exams</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <aside class="hp5-side-stack">
              <div class="hp5-panel hp5-continue">
                <div class="hp5-continue-title">${hasResumeTest ? 'Continue Learning' : 'Start Practice'}</div>
                <p class="hp5-continue-text">${hasResumeTest ? 'A test is already in progress on this device.' : 'No tests attempted yet. Start your first mock test.'}</p>
                <div class="hp5-actions-row">
                  ${hasResumeTest ? `<button class="hp5-btn-primary" onclick="App.navigate('test')">Continue Test ${Icons.get('arrowRight', 14)}</button>` : `<button class="hp5-btn-primary" onclick="App.navigate('setup')">Start First Mock Test</button>`}
                  <button class="hp5-btn-secondary" onclick="HomePage.startQuickMode('quick-10')">Quick 10</button>
                </div>
              </div>

              <div class="hp5-panel">
                <div class="hp5-dashboard-grid">
                  <div class="hp5-dash-cell"><div class="hp5-dash-value">${this._getTestsCompleted()}</div><div class="hp5-dash-label">Tests Taken</div></div>
                  <div class="hp5-dash-cell"><div class="hp5-dash-value">${this._getAccuracy()}%</div><div class="hp5-dash-label">Accuracy</div></div>
                  <div class="hp5-dash-cell"><div class="hp5-dash-value">${streak.current}</div><div class="hp5-dash-label">Day Streak</div></div>
                  <div class="hp5-dash-cell"><div class="hp5-dash-value">${goal.testsToday}/${goal.target}</div><div class="hp5-dash-label">Daily Goal</div></div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section class="hp5-container" id="exams">
          <div class="hp5-section-head">
            <div>
              <h2>Popular Exams</h2>
              <p>Most used exam presets with question, time and marking details.</p>
            </div>
          </div>
          <div class="hp5-popular-grid">
            ${this._getPopularExams().map((exam, i) => `
              <div class="hp5-popular-card" onclick="HomePage.startPresetExam('${exam.id}')" id="popular-${exam.id}">
                <div class="hp5-pop-rank">${i + 1}</div>
                <div>
                  <div class="hp5-pop-name">${exam.name}</div>
                  <div class="hp5-pop-meta">${exam.meta}</div>
                </div>
                <button class="hp5-pop-btn" onclick="event.stopPropagation(); HomePage.startPresetExam('${exam.id}')">Start</button>
              </div>
            `).join('')}
          </div>
        </section>

        <section class="hp5-container">
          <div class="hp5-grid-main">
            <div>
              <div class="hp5-section-head">
                <div>
                  <h2>Latest Tests</h2>
                  <p>Full mock and focused practice sets recently available.</p>
                </div>
              </div>
              <div class="hp5-tests-list">
                ${latestTests.map(test => `
                  <div class="hp5-test-card" onclick="HomePage.startPresetExam('${test.id}')">
                    <div>
                      <div class="hp5-test-name">${test.name}</div>
                      <div class="hp5-test-meta">${test.category || 'Exam'} > ${test.stage || 'Practice'} > Full Mock</div>
                      <div class="hp5-test-stats">
                        <span class="hp5-chip">${test.totalQuestions || 0} Questions</span>
                        <span class="hp5-chip">${Math.round((test.totalTime || 0) / 60)} Min</span>
                        <span class="hp5-chip">${test.negativeMarking ? 'Negative Marking' : 'No Negative'}</span>
                      </div>
                    </div>
                    <button class="hp5-pop-btn" onclick="event.stopPropagation(); HomePage.startPresetExam('${test.id}')">Start Test</button>
                  </div>
                `).join('')}
              </div>
            </div>

            <div>
              <div class="hp5-section-head">
                <div>
                  <h2>Quick Practice</h2>
                  <p>Focused sessions for daily use.</p>
                </div>
              </div>
              <div class="hp5-tests-list">
                <div class="hp5-mode-card" ${dailyDone ? '' : 'onclick="HomePage.startDailyChallenge()"'} id="action-daily">
                  <div class="hp5-mode-icon" style="color: var(--warning)">${Icons.get(streakAlive ? 'flame' : 'clock', 18)}</div>
                  <div><div class="hp5-mode-title">Daily Challenge</div><div class="hp5-mode-meta">15 Questions | 10 Minutes</div></div>
                  <div class="hp5-mode-action">${dailyDone ? 'Done' : 'Start'}</div>
                </div>
                <div class="hp5-mode-card" onclick="App.navigate('setup')" id="action-custom">
                  <div class="hp5-mode-icon" style="color: var(--primary)">${Icons.get('sliders', 18)}</div>
                  <div><div class="hp5-mode-title">Custom Test</div><div class="hp5-mode-meta">Choose subject, time and difficulty</div></div>
                  <div class="hp5-mode-action">Create</div>
                </div>
                <div class="hp5-mode-card" onclick="App.navigate('battle')" id="action-battle">
                  <div class="hp5-mode-icon" style="color: var(--danger)">${Icons.get('swords', 18)}</div>
                  <div><div class="hp5-mode-title">Rival Battle</div><div class="hp5-mode-meta">5 Rounds | Ranked practice</div></div>
                  <div class="hp5-mode-action">Play</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="hp5-container">
          <div class="hp5-grid-main">
            <div>
              <div class="hp5-section-head">
                <div>
                  <h2>Recently Added PYQs</h2>
                  <p>Previous year paper practice grouped by exam.</p>
                </div>
              </div>
              <div class="hp5-pyq-list">
                ${recentPyqs.map(test => `
                  <div class="hp5-pyq-card" onclick="HomePage.startPresetExam('${test.id}')">
                    <div>
                      <div class="hp5-pyq-name">${test.name} PYQ Set</div>
                      <div class="hp5-pyq-meta">${test.category || 'Exam'} > Previous Year Papers</div>
                      <div class="hp5-pyq-stats"><span class="hp5-chip">${test.totalQuestions || 0} Questions</span><span class="hp5-chip">Updated 2026</span></div>
                    </div>
                    <button class="hp5-pop-btn" onclick="event.stopPropagation(); HomePage.startPresetExam('${test.id}')">Practice</button>
                  </div>
                `).join('')}
              </div>
            </div>

            <div>
              <div class="hp5-section-head">
                <div>
                  <h2>Polytechnic Papers</h2>
                  <p>BTEUP format paper generation.</p>
                </div>
              </div>
              <div class="hp5-panel hp5-poly" onclick="window.location.href='/polytechnic-important-paper/'" id="polytechnic-feature-card">
                <div class="hp5-poly-inner">
                  <div class="hp5-poly-left">
                    <div class="hp5-poly-badge">${Icons.get('fileText', 14)} BTEUP Format</div>
                    <h3 class="hp5-poly-title">Polytechnic Paper Generator</h3>
                    <p class="hp5-poly-desc">60 marks, Part A-D, unit coverage and print-ready A4 layout.</p>
                    <div class="hp5-poly-chips"><span>60 Marks</span><span>Hindi / English</span><span>Print Ready</span></div>
                    <button class="hp5-poly-cta" onclick="event.stopPropagation(); window.location.href='/polytechnic-important-paper/'">Generate Paper</button>
                  </div>
                  <div class="hp5-poly-right">
                    <div class="hp5-poly-paper">
                      <div class="hp5-pp-header">BOARD OF TECHNICAL EDUCATION</div>
                      <div class="hp5-pp-sub">POLYTECHNIC EXAM</div>
                      <div class="hp5-pp-line"></div>
                      <div class="hp5-pp-q">Part A | 10 x 1 = 10</div>
                      <div class="hp5-pp-q dim">Part B | 5 x 2 = 10</div>
                      <div class="hp5-pp-q dim">Part C | 8 x 2.5 = 20</div>
                      <div class="hp5-pp-q dim">Part D | 4 x 5 = 20</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer class="hp5-footer">
          <div class="hp5-footer-inner">
            <div class="hp5-footer-brand">
              <div class="hp5-footer-logo">Mock<span>24hr</span></div>
              <p>Free mock tests for Indian competitive exams. Real CBT simulation for serious aspirants.</p>
            </div>
            <div class="hp5-footer-links">
              <div class="hp5-footer-col"><h4>Platform</h4><a href="#home">Home</a><a href="#setup">New Test</a><a href="#dashboard">Dashboard</a><a href="#leaderboard">Leaderboard</a></div>
              <div class="hp5-footer-col"><h4>Exams</h4><a href="#board?id=SSC">SSC</a><a href="#board?id=Railway">Railway</a><a href="#board?id=Banking">Banking</a><a href="#board?id=UPSC">UPSC</a></div>
              <div class="hp5-footer-col"><h4>Tools</h4><a href="#setup">Custom Test</a><a href="#profile">Profile</a><a href="#analytics">Analytics</a></div>
            </div>
          </div>
          <div class="hp5-footer-bottom"><span>Copyright ${new Date().getFullYear()} Mock24hr. All Rights Reserved.</span></div>
        </footer>
      </div>
    `;
  },

  _getAccuracy() {
    try {
      const history = JSON.parse(localStorage.getItem('test_history') || '[]');
      if (history.length === 0) return '0';
      const total = history.reduce((s, h) => s + (h.correct || 0) + (h.wrong || 0), 0);
      const correct = history.reduce((s, h) => s + (h.correct || 0), 0);
      return total > 0 ? Math.round((correct / total) * 100) : '0';
    } catch { return '0'; }
  },

  _getTestsCompleted() {
    try {
      return JSON.parse(localStorage.getItem('test_history') || '[]').length;
    } catch { return 0; }
  },

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
    if (window.trackEvent) window.trackEvent('page_view', { page: 'home_exam_portal' });
  }
};
