// ============================================
// BATTLE MODE PAGE v3.0 — Premium Arena Design
// 5 battle modes, animated lobby, live arena,
// result screen with detailed breakdown
// ============================================

const BattlePage = {

  // ── State ──
  _state: null,
  _timerInterval: null,
  _rivalPollInterval: null,
  _userStreak: 0,
  _userMaxStreak: 0,
  _userScore: 0,
  _answered: 0,
  _questionResults: [],
  _selectedMode: null,
  _livesLeft: 3,      // for Elimination mode

  // ── Battle Mode Configs ──
  _modes: [
    {
      id: 'quick',
      icon: '⚔️',
      name: 'Quick Battle',
      tagline: 'Fast & Furious',
      desc: '10 questions · 5 minutes · Classic rivalry',
      tag: 'Popular',
      tagColor: '#3B82F6',
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.10)',
      border: 'rgba(59,130,246,0.28)',
      questions: 10,
      timePerQ: 30,
      difficulty: 'medium'
    },
    {
      id: 'speed',
      icon: '⚡',
      name: 'Speed Rush',
      tagline: '10 Seconds Each!',
      desc: '20 questions · 10 sec per Q · Instinct test',
      tag: 'Extreme',
      tagColor: '#EF4444',
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.10)',
      border: 'rgba(239,68,68,0.28)',
      questions: 20,
      timePerQ: 10,
      difficulty: 'medium'
    },
    {
      id: 'sniper',
      icon: '🎯',
      name: 'Subject Sniper',
      tagline: 'Master Your Weak Spot',
      desc: '15 questions · Choose subject · Deep focus',
      tag: 'Focused',
      tagColor: '#10B981',
      color: '#10B981',
      bg: 'rgba(16,185,129,0.10)',
      border: 'rgba(16,185,129,0.28)',
      questions: 15,
      timePerQ: 45,
      difficulty: 'hard'
    },
    {
      id: 'elimination',
      icon: '💀',
      name: 'Elimination',
      tagline: '3 Strikes & You\'re Out',
      desc: '∞ questions · 3 lives · Survive the longest',
      tag: 'Brutal',
      tagColor: '#8B5CF6',
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.10)',
      border: 'rgba(139,92,246,0.28)',
      questions: 25,
      timePerQ: 30,
      difficulty: 'hard'
    },
    {
      id: 'marathon',
      icon: '🏃',
      name: 'Marathon',
      tagline: 'Ultimate Endurance',
      desc: '30 questions · Full mock · Max XP reward',
      tag: 'Max XP',
      tagColor: '#F59E0B',
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.10)',
      border: 'rgba(245,158,11,0.28)',
      questions: 30,
      timePerQ: 60,
      difficulty: 'expert'
    }
  ],

  // ── Rival presets (3 per difficulty) ──
  _rivals: {
    beginner: [
      { name: 'Riya Sharma',   emoji: '👧', accuracy: 0.42, city: 'Jaipur',   rank: 1842 },
      { name: 'Amit Verma',    emoji: '👦', accuracy: 0.38, city: 'Kanpur',   rank: 2010 },
      { name: 'Priya Singh',   emoji: '👩', accuracy: 0.45, city: 'Patna',    rank: 1780 }
    ],
    medium: [
      { name: 'Aryan Gupta',   emoji: '🧑', accuracy: 0.62, city: 'Delhi',    rank: 892  },
      { name: 'Sneha Rao',     emoji: '👩', accuracy: 0.58, city: 'Pune',     rank: 1050 },
      { name: 'Karan Mehta',   emoji: '👦', accuracy: 0.66, city: 'Mumbai',   rank: 804  }
    ],
    hard: [
      { name: 'Divya Nair',    emoji: '👩', accuracy: 0.78, city: 'Bangalore',rank: 312  },
      { name: 'Rahul Tiwari',  emoji: '🧑', accuracy: 0.82, city: 'Chennai',  rank: 248  },
      { name: 'Pooja Sharma',  emoji: '👩', accuracy: 0.75, city: 'Hyderabad',rank: 389  }
    ],
    expert: [
      { name: 'Vikram IAS',    emoji: '🥷', accuracy: 0.91, city: 'Delhi',    rank: 41   },
      { name: 'Neha Topper',   emoji: '👩‍🎓', accuracy: 0.88, city: 'Allahabad',rank: 67   },
      { name: 'The Legend',    emoji: '🤖', accuracy: 0.95, city: '???',      rank: 1    }
    ]
  },

  // ═══════════════════════════════════════════
  //  LOBBY SCREEN
  // ═══════════════════════════════════════════

  render() {
    const modeCards = this._modes.map(m => `
      <div class="bp-mode-card" style="--mc:${m.color};--mc-bg:${m.bg};--mc-border:${m.border}"
           onclick="BattlePage._selectMode('${m.id}')">
        <div class="bp-mc-top">
          <div class="bp-mc-icon">${m.icon}</div>
          <span class="bp-mc-tag" style="background:${m.tagColor}18;color:${m.tagColor}">${m.tag}</span>
        </div>
        <div class="bp-mc-name">${m.name}</div>
        <div class="bp-mc-tagline">${m.tagline}</div>
        <div class="bp-mc-desc">${m.desc}</div>
        <div class="bp-mc-footer">
          <span class="bp-mc-start">Choose Difficulty →</span>
        </div>
      </div>
    `).join('');

    return `
      <div class="bp-page page-enter">

        <!-- HERO -->
        <div class="bp-hero">
          <div class="bp-hero-inner">
            <div class="bp-hero-eyebrow">⚔️ Live Arena</div>
            <h1 class="bp-hero-title">AI Battle Mode</h1>
            <p class="bp-hero-sub">Challenge an AI rival powered by real student data. Answer faster. Score higher. Win the battle.</p>
            <div class="bp-hero-live">
              <span class="bp-live-dot"></span>
              <span id="bp-live-count">2,483</span> students battling right now
            </div>
          </div>
        </div>

        <!-- BATTLE MODES GRID -->
        <div class="bp-content">
          <div class="bp-section-label">Choose Your Battle Mode</div>
          <div class="bp-modes-grid">
            ${modeCards}
          </div>

          <!-- STATS ROW -->
          <div class="bp-stats-strip">
            <div class="bp-stat-chip">
              <span class="bp-sc-val">4.2M+</span>
              <span class="bp-sc-lbl">Battles Fought</span>
            </div>
            <div class="bp-stat-divider"></div>
            <div class="bp-stat-chip">
              <span class="bp-sc-val">68%</span>
              <span class="bp-sc-lbl">Avg Win Rate</span>
            </div>
            <div class="bp-stat-divider"></div>
            <div class="bp-stat-chip">
              <span class="bp-sc-val">12s</span>
              <span class="bp-sc-lbl">Avg Answer Time</span>
            </div>
            <div class="bp-stat-divider"></div>
            <div class="bp-stat-chip">
              <span class="bp-sc-val">+50 XP</span>
              <span class="bp-sc-lbl">Per Win</span>
            </div>
          </div>
        </div>

        <!-- DIFFICULTY MODAL (hidden by default) -->
        <div class="bp-modal-overlay" id="bp-diff-overlay" onclick="BattlePage._closeDiffModal()">
          <div class="bp-diff-modal" onclick="event.stopPropagation()" id="bp-diff-modal">
            <div class="bp-diff-modal-header">
              <div id="bp-diff-mode-name" class="bp-diff-mode-name"></div>
              <button class="bp-diff-close" onclick="BattlePage._closeDiffModal()">✕</button>
            </div>
            <div class="bp-diff-modal-desc" id="bp-diff-mode-desc"></div>
            <div class="bp-diff-label">Select Difficulty</div>
            <div class="bp-diff-options">
              <button class="bp-diff-btn" id="bp-diff-beginner" onclick="BattlePage.startBattle('beginner')">
                <span class="bp-diff-icon">🌱</span>
                <div class="bp-diff-info">
                  <div class="bp-diff-name">Beginner</div>
                  <div class="bp-diff-hint">Low accuracy rival · Easy pace</div>
                </div>
              </button>
              <button class="bp-diff-btn bp-diff-btn--selected" id="bp-diff-medium" onclick="BattlePage.startBattle('medium')">
                <span class="bp-diff-icon">⚡</span>
                <div class="bp-diff-info">
                  <div class="bp-diff-name">Medium</div>
                  <div class="bp-diff-hint">Balanced challenge · ~60% rival accuracy</div>
                </div>
                <span class="bp-diff-rec">Recommended</span>
              </button>
              <button class="bp-diff-btn" id="bp-diff-hard" onclick="BattlePage.startBattle('hard')">
                <span class="bp-diff-icon">🔥</span>
                <div class="bp-diff-info">
                  <div class="bp-diff-name">Expert</div>
                  <div class="bp-diff-hint">High accuracy rival · Real competition</div>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  afterRender() {
    this._animateLiveCount();
    // Escape key closes difficulty modal
    this._escHandler = (e) => { if (e.key === 'Escape') this._closeDiffModal(); };
    document.addEventListener('keydown', this._escHandler);
  },

  _animateLiveCount() {
    const el = document.getElementById('bp-live-count');
    if (!el) return;
    let count = 2400 + Math.floor(Math.random() * 200);
    el.textContent = count.toLocaleString('en-IN');
    setInterval(() => {
      count += Math.floor(Math.random() * 7) - 3;
      if (el) el.textContent = count.toLocaleString('en-IN');
    }, 3000);
  },

  _selectMode(modeId) {
    this._selectedMode = this._modes.find(m => m.id === modeId);
    if (!this._selectedMode) return;

    const overlay = document.getElementById('bp-diff-overlay');
    const namEl   = document.getElementById('bp-diff-mode-name');
    const descEl  = document.getElementById('bp-diff-mode-desc');
    if (overlay) overlay.classList.add('open');
    if (namEl) namEl.textContent = `${this._selectedMode.icon} ${this._selectedMode.name}`;
    if (descEl) descEl.textContent = this._selectedMode.desc;
  },

  _closeDiffModal() {
    const overlay = document.getElementById('bp-diff-overlay');
    if (overlay) overlay.classList.remove('open');
  },

  // ═══════════════════════════════════════════
  //  START BATTLE
  // ═══════════════════════════════════════════

  async startBattle(difficulty) {
    this._closeDiffModal();
    const mode = this._selectedMode || this._modes[0];

    // Show loading overlay
    document.getElementById('app').innerHTML = `
      <div class="bp-loading-arena">
        <div class="bp-load-icon">${mode.icon}</div>
        <div class="bp-load-title">Finding your rival...</div>
        <div class="bp-load-dots"><span></span><span></span><span></span></div>
      </div>
    `;

    try {
      const questions = await window.fetchRandomQuestions({ limit: mode.questions });
      if (!questions || questions.length === 0) {
        Helpers.showToast('No questions available. Try again.', 'error');
        App.navigate('battle');
        return;
      }

      // Pick rival from pool
      const diffKey = difficulty === 'hard' || difficulty === 'expert' ? 'hard' : difficulty;
      const rivalPool = this._rivals[diffKey] || this._rivals.medium;
      const rival = rivalPool[Math.floor(Math.random() * rivalPool.length)];

      // Init state
      this._state = {
        questions,
        currentIdx: 0,
        rival,
        mode,
        difficulty,
        startTime: Date.now(),
        timeRemaining: mode.questions * mode.timePerQ,
        totalTime: mode.questions * mode.timePerQ,
        perQTime: mode.timePerQ,
        qTimerRemaining: mode.timePerQ
      };

      this._userStreak = 0;
      this._userMaxStreak = 0;
      this._userScore = 0;
      this._answered = 0;
      this._questionResults = [];
      this._livesLeft = 3;

      // Init rival engine
      if (typeof RivalEngine !== 'undefined') {
        RivalEngine.createBattle(rival, questions.length);
      }
      if (window.Gamification) Gamification.resetCombo();

      // Dramatic countdown then show battle
      await this._showCountdown(rival);
      this._renderBattleUI();
      this._startTimers();
      this._simulateCurrentRival();

    } catch (err) {
      Helpers.showToast('Failed to start: ' + err.message, 'error');
      App.navigate('battle');
    }
  },

  _showCountdown(rival) {
    return new Promise(resolve => {
      document.getElementById('app').innerHTML = `
        <div class="bp-countdown-screen">
          <div class="bp-cd-rival">
            <div class="bp-cd-rival-emoji">${rival.emoji}</div>
            <div class="bp-cd-rival-name">${rival.name}</div>
            <div class="bp-cd-rival-city">📍 ${rival.city} · Rank #${rival.rank}</div>
          </div>
          <div class="bp-cd-vs">VS</div>
          <div class="bp-cd-you">
            <div class="bp-cd-you-emoji">👤</div>
            <div class="bp-cd-you-name">You</div>
            <div class="bp-cd-you-city">🎯 Ready to battle</div>
          </div>
          <div class="bp-cd-num" id="bp-cd-num">3</div>
        </div>
      `;

      let count = 3;
      const tick = setInterval(() => {
        count--;
        const el = document.getElementById('bp-cd-num');
        if (el) {
          if (count > 0) {
            el.textContent = count;
            el.style.animation = 'none';
            requestAnimationFrame(() => { el.style.animation = ''; });
          } else {
            el.textContent = 'GO!';
            el.style.color = '#10B981';
          }
        }
        if (count <= 0) {
          clearInterval(tick);
          setTimeout(resolve, 600);
        }
      }, 900);
    });
  },

  // ═══════════════════════════════════════════
  //  BATTLE ARENA UI
  // ═══════════════════════════════════════════

  _renderBattleUI() {
    const { questions, currentIdx, rival, mode } = this._state;
    const q = questions[currentIdx];
    const total = questions.length;

    document.getElementById('app').innerHTML = `

      <!-- TOP BAR -->
      <div class="ba-topbar">
        <div class="ba-topbar-left">
          <button class="ba-quit-btn" onclick="BattlePage._confirmEndBattle()">✕ Quit</button>
        </div>
        <div class="ba-mode-tag">${mode.icon} ${mode.name}</div>
        <div class="ba-topbar-right">
          ${mode.id === 'elimination' ? `
            <div class="ba-lives" id="ba-lives">
              ${'❤️'.repeat(this._livesLeft)}${'🖤'.repeat(3 - this._livesLeft)}
            </div>
          ` : `
            <div class="ba-timer ${this._state.timeRemaining <= 60 ? 'ba-timer-warn' : ''}" id="ba-timer">
              ${Icons.get('timer', 14)} <span id="ba-time">${this._formatTime(this._state.timeRemaining)}</span>
            </div>
          `}
        </div>
      </div>

      <!-- SCORE SCOREBOARD -->
      <div class="ba-scoreboard">
        <div class="ba-score-you">
          <div class="ba-score-avatar">👤</div>
          <div class="ba-score-detail">
            <div class="ba-score-name">You</div>
            <div class="ba-score-pts" id="ba-you-pts">${this._userScore}<span>/${total}</span></div>
          </div>
          ${this._userStreak >= 3 ? `<div class="ba-streak-fire">🔥 ${this._userStreak}x</div>` : ''}
        </div>

        <div class="ba-score-center">
          <div class="ba-q-progress">
            <div class="ba-q-progress-bar" id="ba-q-bar" style="width:${Math.round(currentIdx/total*100)}%"></div>
          </div>
          <div class="ba-q-label">${currentIdx + 1} <span>of ${total}</span></div>
        </div>

        <div class="ba-score-rival">
          <div class="ba-score-detail" style="text-align:right">
            <div class="ba-score-name">${rival.name.split(' ')[0]}</div>
            <div class="ba-score-pts" id="ba-rival-pts">0<span>/${total}</span></div>
          </div>
          <div class="ba-score-avatar">${rival.emoji}</div>
        </div>
      </div>

      <!-- RIVAL TOAST -->
      <div class="ba-rival-toast" id="ba-rival-toast"></div>

      <!-- QUESTION AREA -->
      <div class="ba-question-area" id="ba-question-area">
        ${this._renderQuestion(q, currentIdx)}
      </div>

      <!-- BOTTOM NAV -->
      <div class="ba-bottom-nav">
        ${mode.id === 'speed' ? `
          <div class="ba-per-q-timer">
            <div class="ba-pqt-bar" id="ba-pqt-bar" style="width:100%"></div>
          </div>
        ` : ''}
        <button class="ba-skip-btn" onclick="BattlePage._skipQuestion()" id="ba-skip-btn">
          Skip →
        </button>
      </div>
    `;
  },

  _renderQuestion(q, idx) {
    const isHi = typeof Lang !== 'undefined' && Lang.isHindi();
    const questionText = isHi ? (q.questionHI || q.question) : (q.questionEN || q.question);
    const options = isHi ? (q.optionsHI || q.options) : (q.optionsEN || q.options);

    return `
      <div class="ba-q-card">
        <div class="ba-q-meta">
          <span class="ba-q-subject">${q.subject || 'General'}</span>
          <span class="ba-q-num">Q${idx + 1}</span>
        </div>
        <div class="ba-q-text">${questionText}</div>
        <div class="ba-options" id="ba-options">
          ${options.map((opt, i) => `
            <button class="ba-option" id="ba-opt-${i}" onclick="BattlePage._selectAnswer(${i})">
              <span class="ba-opt-letter">${String.fromCharCode(65+i)}</span>
              <span class="ba-opt-text">${opt}</span>
              <span class="ba-opt-icon" id="ba-oi-${i}"></span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════
  //  ANSWER HANDLING
  // ═══════════════════════════════════════════

  _selectAnswer(optionIdx) {
    if (!this._state) return;
    const q = this._state.questions[this._state.currentIdx];
    const isCorrect = optionIdx === q.correct;

    // Disable options
    document.querySelectorAll('.ba-option').forEach(b => {
      b.disabled = true;
      b.style.pointerEvents = 'none';
    });

    // Gamification
    if (window.Gamification) {
      isCorrect ? Gamification.registerCorrect() : Gamification.registerWrong();
    }

    this._answered++;
    if (isCorrect) {
      this._userScore++;
      this._userStreak++;
      this._userMaxStreak = Math.max(this._userMaxStreak, this._userStreak);
    } else {
      this._userStreak = 0;
      if (this._state.mode.id === 'elimination') {
        this._livesLeft--;
        this._updateLives();
      }
    }

    this._questionResults.push({
      questionIdx: this._state.currentIdx,
      question: q,
      selectedAnswer: optionIdx,
      isCorrect,
      isSkipped: false
    });

    // Visual feedback
    const selBtn = document.getElementById(`ba-opt-${optionIdx}`);
    const corBtn = document.getElementById(`ba-opt-${q.correct}`);
    if (isCorrect) {
      selBtn?.classList.add('ba-opt-correct');
      const icon = document.getElementById(`ba-oi-${optionIdx}`);
      if (icon) icon.innerHTML = Icons.get('check', 16);
      this._showStreakFeedback();
    } else {
      selBtn?.classList.add('ba-opt-wrong');
      corBtn?.classList.add('ba-opt-correct');
      const wIcon = document.getElementById(`ba-oi-${optionIdx}`);
      const cIcon = document.getElementById(`ba-oi-${q.correct}`);
      if (wIcon) wIcon.innerHTML = Icons.get('x', 16);
      if (cIcon) cIcon.innerHTML = Icons.get('check', 16);
    }

    this._updateScoreboard();

    // Elimination mode — end if no lives
    if (this._state.mode.id === 'elimination' && this._livesLeft <= 0) {
      setTimeout(() => this._endBattle(), 1200);
      return;
    }

    setTimeout(() => this._nextQuestion(), isCorrect ? 800 : 1500);
  },

  _skipQuestion() {
    if (!this._state) return;
    const q = this._state.questions[this._state.currentIdx];
    this._answered++;
    this._userStreak = 0;
    this._questionResults.push({
      questionIdx: this._state.currentIdx, question: q,
      selectedAnswer: null, isCorrect: false, isSkipped: true
    });
    if (window.Gamification) Gamification.registerWrong();
    this._nextQuestion();
  },

  _nextQuestion() {
    if (!this._state) return;
    this._state.currentIdx++;

    if (this._state.currentIdx >= this._state.questions.length) {
      this._endBattle();
      return;
    }

    const area = document.getElementById('ba-question-area');
    if (area) {
      const q = this._state.questions[this._state.currentIdx];
      area.innerHTML = this._renderQuestion(q, this._state.currentIdx);
    }

    // Reset per-Q timer bar (Speed Rush mode)
    if (this._state.mode.id === 'speed') {
      this._state.qTimerRemaining = this._state.perQTime;
    }

    // Update progress bar
    const bar = document.getElementById('ba-q-bar');
    if (bar) bar.style.width = `${Math.round(this._state.currentIdx / this._state.questions.length * 100)}%`;

    this._simulateCurrentRival();
    this._updateScoreboard();
  },

  // ═══════════════════════════════════════════
  //  TIMERS
  // ═══════════════════════════════════════════

  _startTimers() {
    this._timerInterval = setInterval(() => {
      if (!this._state) { clearInterval(this._timerInterval); return; }

      // Global timer
      this._state.timeRemaining--;
      const timeEl = document.getElementById('ba-time');
      if (timeEl) timeEl.textContent = this._formatTime(this._state.timeRemaining);

      const timerEl = document.getElementById('ba-timer');
      if (timerEl && this._state.timeRemaining <= 60) timerEl.classList.add('ba-timer-warn');

      // Per-question timer (Speed Rush)
      if (this._state.mode.id === 'speed') {
        this._state.qTimerRemaining--;
        const pct = Math.max(0, (this._state.qTimerRemaining / this._state.perQTime) * 100);
        const pqBar = document.getElementById('ba-pqt-bar');
        if (pqBar) {
          pqBar.style.width = `${pct}%`;
          pqBar.style.background = pct < 30 ? '#EF4444' : pct < 60 ? '#F59E0B' : '#3B82F6';
        }
        if (this._state.qTimerRemaining <= 0) {
          this._skipQuestion();
          this._state.qTimerRemaining = this._state.perQTime;
        }
      }

      if (this._state.timeRemaining <= 0) this._endBattle();
    }, 1000);

    // Rival polling
    this._startRivalPoll();
  },

  _formatTime(s) {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  },

  // ═══════════════════════════════════════════
  //  RIVAL ENGINE
  // ═══════════════════════════════════════════

  _simulateCurrentRival() {
    if (!this._state || typeof RivalEngine === 'undefined') return;
    const q = this._state.questions[this._state.currentIdx];
    RivalEngine.simulateRivalAnswer(this._state.currentIdx, q?.difficulty || 'medium');
  },

  _startRivalPoll() {
    const poll = () => {
      if (!this._state) return;
      if (typeof RivalEngine === 'undefined') return;
      const updates = RivalEngine.consumePendingUpdates();
      if (updates.length > 0) {
        this._showRivalToast(updates[updates.length - 1]);
        this._updateScoreboard();
      }
      const next = 2000 + Math.random() * 2000;
      this._rivalPollInterval = setTimeout(poll, next);
    };
    this._rivalPollInterval = setTimeout(poll, 2500 + Math.random() * 1500);
  },

  _showRivalToast(update) {
    const toast = document.getElementById('ba-rival-toast');
    if (!toast) return;
    const rName = this._state.rival.name.split(' ')[0];
    toast.textContent = update.correct ? `${rName} answered correctly ✓` : `${rName} got it wrong ✗`;
    toast.className = `ba-rival-toast ${update.correct ? 'ba-rt-correct' : 'ba-rt-wrong'} show`;
    setTimeout(() => toast.classList.remove('show'), 2000);
  },

  _updateScoreboard() {
    const total = this._state.questions.length;
    let rivalScore = 0;
    if (typeof RivalEngine !== 'undefined') {
      const rs = RivalEngine.getRivalStatus();
      rivalScore = rs ? rs.score : 0;
    }
    const youEl = document.getElementById('ba-you-pts');
    const rivEl = document.getElementById('ba-rival-pts');
    if (youEl) youEl.innerHTML = `${this._userScore}<span>/${total}</span>`;
    if (rivEl) rivEl.innerHTML = `${rivalScore}<span>/${total}</span>`;
  },

  _updateLives() {
    const el = document.getElementById('ba-lives');
    if (el) el.textContent = '❤️'.repeat(this._livesLeft) + '🖤'.repeat(3 - this._livesLeft);
  },

  // ═══════════════════════════════════════════
  //  STREAK FEEDBACK
  // ═══════════════════════════════════════════

  _showStreakFeedback() {
    if (this._userStreak < 3) return;
    const texts = {
      10: ['🔥 UNSTOPPABLE!', 'streak-epic'],
      7:  ['⚡ ON FIRE!', 'streak-fire'],
      5:  ['💥 Hot Streak!', 'streak-hot'],
      3:  ['✨ On a Roll!', 'streak-warm']
    };
    const key = this._userStreak >= 10 ? 10 : this._userStreak >= 7 ? 7 : this._userStreak >= 5 ? 5 : 3;
    const [text, cls] = texts[key];

    const toast = document.createElement('div');
    toast.className = `ba-streak-toast ${cls}`;
    toast.textContent = `${this._userStreak}x ${text}`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 1400);
  },

  // ═══════════════════════════════════════════
  //  END BATTLE
  // ═══════════════════════════════════════════

  _confirmEndBattle() {
    if (confirm('Quit battle? Your progress will be scored.')) this._endBattle();
  },

  _endBattle() {
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this._rivalPollInterval) clearTimeout(this._rivalPollInterval);
    if (!this._state) return;

    let battleResult = null;
    if (typeof RivalEngine !== 'undefined') {
      battleResult = RivalEngine.finishBattle(this._userScore, this._state.questions.length);
      if (battleResult) battleResult.userMaxStreak = this._userMaxStreak;
    }

    if (!battleResult) {
      battleResult = {
        winner: this._userScore > 0 ? 'user' : 'rival',
        userScore: this._userScore,
        userAccuracy: Math.round((this._userScore / this._state.questions.length) * 100),
        userMaxStreak: this._userMaxStreak,
        rivalScore: Math.floor(this._state.questions.length * this._state.rival.accuracy),
        rivalAccuracy: Math.round(this._state.rival.accuracy * 100),
        rivalMaxStreak: 3,
        rival: this._state.rival,
        totalQuestions: this._state.questions.length
      };
    }

    if (typeof DailySystem !== 'undefined') {
      DailySystem.recordProgress({
        accuracy: battleResult.userAccuracy,
        correct: this._userScore,
        wrong: this._answered - this._userScore,
        totalQuestions: this._state.questions.length,
        timeTaken: Math.round((Date.now() - this._state.startTime) / 1000),
        subjectWise: {},
        config: { examId: 'battle-mode' }
      });
    }

    this._renderResult(battleResult);
    if (typeof RivalEngine !== 'undefined') RivalEngine.destroy();
  },

  // ═══════════════════════════════════════════
  //  RESULT SCREEN
  // ═══════════════════════════════════════════

  _renderResult(r) {
    const isWin  = r.winner === 'user';
    const isDraw = r.winner === 'draw';
    const total  = r.totalQuestions;
    const mode   = this._state?.mode || this._modes[0];

    const coinsEarned = 10 + (isWin ? 20 : 0) + (r.userAccuracy >= 90 ? 10 : 0) + (r.userMaxStreak >= 5 ? 5 : 0);
    const xpEarned    = 20 + (this._userScore * 3) + (isWin ? 15 : 0);

    const resultColor = isWin ? '#10B981' : isDraw ? '#F59E0B' : '#3B82F6';
    const resultLabel = isWin ? '🏆 Victory!' : isDraw ? '🤝 Draw!' : '⚡ Good Fight!';
    const resultSub   = isWin ? `You defeated ${r.rival.name}` : isDraw ? 'Perfectly matched!' : `${r.rival.name} won this round`;

    // Accuracy circles
    const userArcPct   = r.userAccuracy;
    const rivalArcPct  = r.rivalAccuracy;

    document.getElementById('app').innerHTML = `
      <div class="br-page page-enter">
        <div class="br-card">

          <!-- RESULT BANNER -->
          <div class="br-banner" style="--rb-color:${resultColor}">
            <div class="br-banner-glow"></div>
            <div class="br-banner-label">${resultLabel}</div>
            <div class="br-banner-sub">${resultSub}</div>
          </div>

          <!-- SCORE COMPARISON -->
          <div class="br-comparison">
            <div class="br-player">
              <div class="br-player-avatar">👤</div>
              <div class="br-player-name">You</div>
              <div class="br-donut-wrap">
                <svg viewBox="0 0 80 80" class="br-donut">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border-color)" stroke-width="8"/>
                  <circle cx="40" cy="40" r="32" fill="none"
                    stroke="${isWin ? '#10B981' : '#3B82F6'}" stroke-width="8" stroke-linecap="round"
                    stroke-dasharray="${2*Math.PI*32}"
                    stroke-dashoffset="${2*Math.PI*32*(1 - userArcPct/100)}"
                    transform="rotate(-90 40 40)"
                    style="transition:stroke-dashoffset 1s ease"/>
                </svg>
                <div class="br-donut-center">
                  <span class="br-donut-pct" style="color:${isWin?'#10B981':'#3B82F6'}">${r.userAccuracy}%</span>
                </div>
              </div>
              <div class="br-player-score">${r.userScore}/${total} correct</div>
              ${r.userMaxStreak >= 3 ? `<div class="br-streak-badge">🔥 ${r.userMaxStreak}x streak</div>` : ''}
            </div>

            <div class="br-vs-col">
              <div class="br-vs-text">VS</div>
              <div class="br-mode-badge">${mode.icon} ${mode.name}</div>
            </div>

            <div class="br-player">
              <div class="br-player-avatar">${r.rival.emoji}</div>
              <div class="br-player-name">${r.rival.name}</div>
              <div class="br-donut-wrap">
                <svg viewBox="0 0 80 80" class="br-donut">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border-color)" stroke-width="8"/>
                  <circle cx="40" cy="40" r="32" fill="none"
                    stroke="${isWin ? '#EF4444' : '#10B981'}" stroke-width="8" stroke-linecap="round"
                    stroke-dasharray="${2*Math.PI*32}"
                    stroke-dashoffset="${2*Math.PI*32*(1 - rivalArcPct/100)}"
                    transform="rotate(-90 40 40)"
                    style="transition:stroke-dashoffset 1.2s ease"/>
                </svg>
                <div class="br-donut-center">
                  <span class="br-donut-pct" style="color:${isWin?'#EF4444':'#10B981'}">${r.rivalAccuracy}%</span>
                </div>
              </div>
              <div class="br-player-score">${r.rivalScore}/${total} correct</div>
              <div class="br-rival-city">📍 ${r.rival.city}</div>
            </div>
          </div>

          <!-- REWARDS ROW -->
          <div class="br-rewards">
            <div class="br-reward-pill">
              <span>🪙</span>
              <span>+${coinsEarned} Coins</span>
            </div>
            <div class="br-reward-pill">
              <span>⚡</span>
              <span>+${xpEarned} XP</span>
            </div>
            ${r.userMaxStreak >= 5 ? `
              <div class="br-reward-pill br-reward-pill--streak">
                <span>🔥</span>
                <span>Streak Bonus!</span>
              </div>
            ` : ''}
          </div>

          <!-- ACTIONS -->
          <div class="br-actions">
            <button class="br-btn br-btn--primary" onclick="App.navigate('battle')">
              ⚔️ Battle Again
            </button>
            <button class="br-btn br-btn--outline" onclick="App.navigate('home')">
              🏠 Home
            </button>
          </div>

        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════
  //  LIFECYCLE
  // ═══════════════════════════════════════════

  destroy() {
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this._rivalPollInterval) clearTimeout(this._rivalPollInterval);
    if (this._escHandler) document.removeEventListener('keydown', this._escHandler);
    if (typeof RivalEngine !== 'undefined') RivalEngine.destroy();
    this._state = null;
    this._selectedMode = null;
  }
};

window.BattlePage = BattlePage;
