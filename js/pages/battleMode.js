// ============================================
// BATTLE MODE PAGE — Rival Battle System
// Instant feedback, live rival scoring,
// streak tracking, battle result screen
// ============================================

const BattlePage = {

  // Battle state
  _state: null,
  _timerInterval: null,
  _rivalPollInterval: null,
  _userStreak: 0,
  _userMaxStreak: 0,
  _userScore: 0,
  _answered: 0,
  _questionResults: [],
  _comboCoinsToday: 0,

  // ═══════════════════════════════════════════
  //  SETUP SCREEN
  // ═══════════════════════════════════════════

  render() {
    return `
      <div class="battle-setup page-enter">
        <div class="battle-setup-card animate-scaleIn">
          <div class="battle-setup-icon">⚔️</div>
          <h1 class="battle-setup-title">Rival Battle</h1>
          <p class="battle-setup-desc">Challenge an AI rival in a fast-paced practice battle with instant feedback!</p>

          <div class="battle-difficulty-grid">
            <button class="battle-diff-card" onclick="BattlePage.startBattle('beginner')" id="diff-beginner">
              <div class="diff-emoji">🌱</div>
              <div class="diff-name">Beginner</div>
              <div class="diff-desc">Relaxed pace, lower accuracy</div>
            </button>
            <button class="battle-diff-card" onclick="BattlePage.startBattle('medium')" id="diff-medium">
              <div class="diff-emoji">⚡</div>
              <div class="diff-name">Medium</div>
              <div class="diff-desc">Balanced challenge</div>
            </button>
            <button class="battle-diff-card" onclick="BattlePage.startBattle('expert')" id="diff-expert">
              <div class="diff-emoji">🔥</div>
              <div class="diff-name">Expert</div>
              <div class="diff-desc">Fast & deadly accurate</div>
            </button>
          </div>

          <button class="btn btn-ghost" onclick="App.navigate('home')" style="margin-top:var(--space-4);">← Back to Home</button>
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════
  //  START BATTLE
  // ═══════════════════════════════════════════

  async startBattle(difficulty) {
    // Disable buttons
    document.querySelectorAll('.battle-diff-card').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });

    try {
      // Fetch questions
      const questions = await window.fetchRandomQuestions({ limit: 15 });
      if (!questions || questions.length === 0) {
        Helpers.showToast('No questions available. Try again.', 'error');
        document.querySelectorAll('.battle-diff-card').forEach(b => { b.disabled = false; b.style.opacity = '1'; });
        return;
      }

      // Pick rival
      const rival = RivalPool.pickRival(difficulty);

      // Init battle state
      this._state = {
        questions,
        currentIdx: 0,
        rival,
        difficulty,
        startTime: Date.now(),
        timeRemaining: questions.length * 30, // 30s per question
        totalTime: questions.length * 30
      };

      this._userStreak = 0;
      this._userMaxStreak = 0;
      this._userScore = 0;
      this._answered = 0;
      this._questionResults = [];

      // Init rival engine
      RivalEngine.createBattle(rival, questions.length);

      // Reset gamification combo
      if (window.Gamification) Gamification.resetCombo();

      // Render battle UI
      this._renderBattleUI();

      // Start timer
      this._startTimer();

      // Start rival polling
      this._startRivalPoll();

      // Simulate rival answer for first question
      this._simulateCurrentRival();

    } catch (err) {
      Helpers.showToast('Failed to start battle: ' + err.message, 'error');
      document.querySelectorAll('.battle-diff-card').forEach(b => { b.disabled = false; b.style.opacity = '1'; });
    }
  },

  // ═══════════════════════════════════════════
  //  BATTLE UI
  // ═══════════════════════════════════════════

  _renderBattleUI() {
    const q = this._state.questions[this._state.currentIdx];
    const rivalStatus = RivalEngine.getRivalStatus();
    const total = this._state.questions.length;

    const appEl = document.getElementById('app');
    appEl.innerHTML = `
      <!-- Battle Header (no normal header) -->
      <div class="battle-header">
        <div class="battle-timer" id="battle-timer">
          <span class="battle-timer-icon">⏱</span>
          <span id="battle-time-value">${this._formatTime(this._state.timeRemaining)}</span>
        </div>
        <div class="battle-progress-text">${this._state.currentIdx + 1} / ${total}</div>
      </div>

      <!-- Score Bar -->
      <div class="battle-score-bar" id="battle-score-bar">
        <div class="battle-score-user">
          <span class="bsu-emoji">🧑</span>
          <span class="bsu-label">YOU</span>
          <span class="bsu-score" id="user-score">${this._userScore}/${total}</span>
          ${this._userStreak >= 3 ? `<span class="bsu-streak">🔥${this._userStreak}</span>` : ''}
        </div>
        <div class="battle-vs">VS</div>
        <div class="battle-score-rival">
          <span class="bsr-score" id="rival-score">${rivalStatus.score}/${total}</span>
          <span class="bsr-label">${rivalStatus.name.split(' ')[0]}</span>
          <span class="bsr-emoji">${rivalStatus.emoji}</span>
          ${rivalStatus.streak >= 3 ? `<span class="bsr-streak">🔥${rivalStatus.streak}</span>` : ''}
        </div>
      </div>

      <!-- Rival Status Toast -->
      <div class="rival-status-toast" id="rival-toast"></div>

      <!-- Question Card -->
      <div class="battle-question-area" id="battle-question-area">
        ${this._renderQuestion(q, this._state.currentIdx)}
      </div>

      <!-- Navigation -->
      <div class="battle-nav">
        <button class="btn btn-ghost" onclick="BattlePage._skipQuestion()" id="battle-skip-btn">Skip →</button>
        <button class="btn btn-danger" onclick="BattlePage._confirmEndBattle()" style="font-size:var(--text-xs);">End Battle</button>
      </div>
    `;
  },

  _renderQuestion(q, idx) {
    const isHi = typeof Lang !== 'undefined' && Lang.isHindi();
    const questionText = isHi ? (q.questionHI || q.question) : (q.questionEN || q.question);
    const options = isHi ? (q.optionsHI || q.options) : (q.optionsEN || q.options);

    return `
      <div class="battle-q-card animate-fadeInUp">
        <div class="battle-q-subject">${Helpers.getSubjectIcon(q.subject)} ${q.subject}</div>
        <div class="battle-q-text">${questionText}</div>
        <div class="battle-options" id="battle-options">
          ${options.map((opt, i) => `
            <button class="battle-option" data-idx="${i}" onclick="BattlePage._selectAnswer(${i})" id="battle-opt-${i}">
              <span class="bo-letter">${String.fromCharCode(65 + i)}</span>
              <span class="bo-text">${opt}</span>
              <span class="bo-icon" id="bo-icon-${i}"></span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════
  //  ANSWER HANDLING (Instant Feedback)
  // ═══════════════════════════════════════════

  _selectAnswer(optionIdx) {
    if (!this._state) return;
    const q = this._state.questions[this._state.currentIdx];
    const isCorrect = optionIdx === q.correct;

    // Disable all options immediately
    document.querySelectorAll('.battle-option').forEach(btn => {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
    });

    // Track gamification combo
    if (window.Gamification) {
      if (isCorrect) Gamification.registerCorrect();
      else Gamification.registerWrong();
    }

    // Update user state
    this._answered++;
    if (isCorrect) {
      this._userScore++;
      this._userStreak++;
      this._userMaxStreak = Math.max(this._userMaxStreak, this._userStreak);
    } else {
      this._userStreak = 0;
    }

    // Store result
    this._questionResults.push({
      questionIdx: this._state.currentIdx,
      question: q,
      selectedAnswer: optionIdx,
      isCorrect,
      isSkipped: false
    });

    // === INSTANT FEEDBACK (no page reload, DOM-only) ===
    const selectedBtn = document.getElementById(`battle-opt-${optionIdx}`);
    const correctBtn = document.getElementById(`battle-opt-${q.correct}`);

    if (isCorrect) {
      // Correct answer
      selectedBtn.classList.add('battle-option-correct');
      document.getElementById(`bo-icon-${optionIdx}`).textContent = '✓';

      // Streak visual
      this._showStreakFeedback();
    } else {
      // Wrong answer
      selectedBtn.classList.add('battle-option-wrong');
      document.getElementById(`bo-icon-${optionIdx}`).textContent = '✗';

      // Highlight correct
      correctBtn.classList.add('battle-option-correct');
      document.getElementById(`bo-icon-${q.correct}`).textContent = '✓';
    }

    // Update score bar
    this._updateScoreBar();

    // Auto-advance after delay
    setTimeout(() => this._nextQuestion(), isCorrect ? 800 : 1500);
  },

  _skipQuestion() {
    if (!this._state) return;
    const q = this._state.questions[this._state.currentIdx];

    this._answered++;
    this._userStreak = 0;
    this._questionResults.push({
      questionIdx: this._state.currentIdx,
      question: q,
      selectedAnswer: null,
      isCorrect: false,
      isSkipped: true
    });

    if (window.Gamification) Gamification.registerWrong();

    this._nextQuestion();
  },

  _nextQuestion() {
    if (!this._state) return;

    this._state.currentIdx++;

    // Check if battle is over
    if (this._state.currentIdx >= this._state.questions.length) {
      this._endBattle();
      return;
    }

    // Render next question
    const area = document.getElementById('battle-question-area');
    if (area) {
      const q = this._state.questions[this._state.currentIdx];
      area.innerHTML = this._renderQuestion(q, this._state.currentIdx);

      // Update progress
      const progText = document.querySelector('.battle-progress-text');
      if (progText) progText.textContent = `${this._state.currentIdx + 1} / ${this._state.questions.length}`;
    }

    // Simulate rival for this question
    this._simulateCurrentRival();
    this._updateScoreBar();
  },

  // ═══════════════════════════════════════════
  //  STREAK FEEDBACK
  // ═══════════════════════════════════════════

  _showStreakFeedback() {
    if (this._userStreak < 3) return;

    let streakText, streakClass;
    if (this._userStreak >= 10) {
      streakText = `🔥🔥🔥 ${this._userStreak}x UNSTOPPABLE!`;
      streakClass = 'streak-epic';
    } else if (this._userStreak >= 7) {
      streakText = `🔥🔥 ${this._userStreak}x ON FIRE!`;
      streakClass = 'streak-fire';
    } else if (this._userStreak >= 5) {
      streakText = `🔥 ${this._userStreak}x Streak!`;
      streakClass = 'streak-hot';
    } else {
      streakText = `✨ ${this._userStreak}x Streak`;
      streakClass = 'streak-warm';
    }

    const toast = document.createElement('div');
    toast.className = `battle-streak-toast ${streakClass}`;
    toast.textContent = streakText;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 1200);
  },

  // ═══════════════════════════════════════════
  //  RIVAL SIMULATION & POLLING
  // ═══════════════════════════════════════════

  _simulateCurrentRival() {
    if (!this._state) return;
    const q = this._state.questions[this._state.currentIdx];
    const diff = q.difficulty || 'medium';
    RivalEngine.simulateRivalAnswer(this._state.currentIdx, diff);
  },

  _startRivalPoll() {
    // Poll every 2-4 seconds (randomized, NOT every second)
    const poll = () => {
      if (!this._state) return;
      const updates = RivalEngine.consumePendingUpdates();
      if (updates.length > 0) {
        const latest = updates[updates.length - 1]; // Show only latest
        this._showRivalUpdate(latest);
        this._updateScoreBar();
      }
      // Randomize next poll (2-4s)
      const nextDelay = 2000 + Math.random() * 2000;
      this._rivalPollInterval = setTimeout(poll, nextDelay);
    };
    this._rivalPollInterval = setTimeout(poll, 2500 + Math.random() * 1500);
  },

  _showRivalUpdate(update) {
    const rivalName = this._state.rival.name.split(' ')[0];
    const toast = document.getElementById('rival-toast');
    if (!toast) return;

    const text = update.correct
      ? `${rivalName} answered correctly ✓`
      : `${rivalName} missed this one ✗`;

    toast.textContent = text;
    toast.className = `rival-status-toast ${update.correct ? 'rival-correct' : 'rival-wrong'} show`;
    setTimeout(() => toast.classList.remove('show'), 2000);
  },

  // ═══════════════════════════════════════════
  //  SCORE BAR UPDATE
  // ═══════════════════════════════════════════

  _updateScoreBar() {
    const total = this._state.questions.length;
    const rivalStatus = RivalEngine.getRivalStatus();

    const userScoreEl = document.getElementById('user-score');
    const rivalScoreEl = document.getElementById('rival-score');
    if (userScoreEl) userScoreEl.textContent = `${this._userScore}/${total}`;
    if (rivalScoreEl) rivalScoreEl.textContent = `${rivalStatus ? rivalStatus.score : 0}/${total}`;

    // Re-render score bar for streak badges
    const bar = document.getElementById('battle-score-bar');
    if (bar) {
      const rs = rivalStatus || { score: 0, streak: 0, name: 'Rival', emoji: '👨' };
      bar.innerHTML = `
        <div class="battle-score-user">
          <span class="bsu-emoji">🧑</span>
          <span class="bsu-label">YOU</span>
          <span class="bsu-score">${this._userScore}/${total}</span>
          ${this._userStreak >= 3 ? `<span class="bsu-streak">🔥${this._userStreak}</span>` : ''}
        </div>
        <div class="battle-vs">VS</div>
        <div class="battle-score-rival">
          <span class="bsr-score">${rs.score}/${total}</span>
          <span class="bsr-label">${rs.name.split(' ')[0]}</span>
          <span class="bsr-emoji">${rs.emoji}</span>
          ${rs.streak >= 3 ? `<span class="bsr-streak">🔥${rs.streak}</span>` : ''}
        </div>
      `;
    }
  },

  // ═══════════════════════════════════════════
  //  TIMER
  // ═══════════════════════════════════════════

  _startTimer() {
    this._timerInterval = setInterval(() => {
      if (!this._state) { clearInterval(this._timerInterval); return; }
      this._state.timeRemaining--;

      const el = document.getElementById('battle-time-value');
      if (el) el.textContent = this._formatTime(this._state.timeRemaining);

      // Low time warning
      if (this._state.timeRemaining <= 30) {
        const timerEl = document.getElementById('battle-timer');
        if (timerEl) timerEl.classList.add('battle-timer-danger');
      }

      if (this._state.timeRemaining <= 0) {
        this._endBattle();
      }
    }, 1000);
  },

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  },

  // ═══════════════════════════════════════════
  //  END BATTLE
  // ═══════════════════════════════════════════

  _confirmEndBattle() {
    if (confirm('End battle early? Your current progress will be scored.')) {
      this._endBattle();
    }
  },

  _endBattle() {
    // Stop all intervals
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this._rivalPollInterval) clearTimeout(this._rivalPollInterval);

    if (!this._state) return;

    // Get final rival result
    const battleResult = RivalEngine.finishBattle(this._userScore, this._state.questions.length);
    if (battleResult) {
      battleResult.userMaxStreak = this._userMaxStreak;
    }

    // Save battle data
    this._renderBattleResult(battleResult);

    // Save to daily progress
    if (typeof DailySystem !== 'undefined') {
      DailySystem.recordProgress({
        accuracy: battleResult ? battleResult.userAccuracy : 0,
        correct: this._userScore,
        wrong: this._answered - this._userScore,
        totalQuestions: this._state.questions.length,
        timeTaken: Math.round((Date.now() - this._state.startTime) / 1000),
        subjectWise: {},
        config: { examId: 'battle-mode' }
      });
    }

    // Cleanup
    RivalEngine.destroy();
  },

  // ═══════════════════════════════════════════
  //  BATTLE RESULT SCREEN
  // ═══════════════════════════════════════════

  _renderBattleResult(battleResult) {
    if (!battleResult) return;

    const isWin = battleResult.winner === 'user';
    const isDraw = battleResult.winner === 'draw';
    const total = battleResult.totalQuestions;

    // Coins earned (simple: base + win bonus)
    let coinsEarned = 10; // base
    if (isWin) coinsEarned += 15;
    if (battleResult.userAccuracy >= 90) coinsEarned += 10;
    if (battleResult.userMaxStreak >= 5) coinsEarned += 5;
    let xpEarned = 20 + (this._userScore * 3);

    const resultHTML = `
      <div class="battle-result page-enter">
        <div class="battle-result-card animate-scaleIn">
          <!-- Winner Banner -->
          <div class="br-banner ${isWin ? 'br-win' : isDraw ? 'br-draw' : 'br-lose'}">
            <div class="br-banner-emoji">${isWin ? '🏆' : isDraw ? '🤝' : '💪'}</div>
            <div class="br-banner-text">${isWin ? 'Victory!' : isDraw ? 'Draw!' : 'Close Battle!'}</div>
            <div class="br-banner-sub">${isWin ? 'You defeated ' + battleResult.rival.name : isDraw ? 'Evenly matched!' : 'Try again against another rival'}</div>
          </div>

          <!-- Score Comparison -->
          <div class="br-comparison">
            <div class="br-player br-you">
              <div class="br-player-emoji">🧑</div>
              <div class="br-player-name">You</div>
              <div class="br-player-score">${battleResult.userScore}/${total}</div>
              <div class="br-player-acc">${battleResult.userAccuracy}%</div>
              <div class="br-player-streak">🔥 ${battleResult.userMaxStreak}x best streak</div>
            </div>
            <div class="br-vs-divider">VS</div>
            <div class="br-player br-rival">
              <div class="br-player-emoji">${battleResult.rival.emoji}</div>
              <div class="br-player-name">${battleResult.rival.name}</div>
              <div class="br-player-score">${battleResult.rivalScore}/${total}</div>
              <div class="br-player-acc">${battleResult.rivalAccuracy}%</div>
              <div class="br-player-streak">🔥 ${battleResult.rivalMaxStreak}x best streak</div>
            </div>
          </div>

          <!-- Rewards -->
          <div class="br-rewards">
            <div class="br-reward-item">
              <span>💰</span>
              <span>+${coinsEarned} Coins</span>
            </div>
            <div class="br-reward-item">
              <span>⚡</span>
              <span>+${xpEarned} XP</span>
            </div>
            ${battleResult.userMaxStreak >= 5 ? `
              <div class="br-reward-item br-streak-bonus">
                <span>🔥</span>
                <span>${battleResult.userMaxStreak}x Streak Bonus!</span>
              </div>
            ` : ''}
          </div>

          <!-- Actions -->
          <div class="br-actions">
            <button class="btn btn-primary btn-lg" onclick="App.navigate('battle')" style="flex:1;">⚔️ Battle Again</button>
            <button class="btn btn-secondary btn-lg" onclick="App.navigate('home')" style="flex:1;">🏠 Home</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('app').innerHTML = resultHTML;
  },

  // ═══════════════════════════════════════════
  //  LIFECYCLE
  // ═══════════════════════════════════════════

  afterRender() {
    // Nothing needed for setup screen
  },

  destroy() {
    if (this._timerInterval) clearInterval(this._timerInterval);
    if (this._rivalPollInterval) clearTimeout(this._rivalPollInterval);
    RivalEngine.destroy();
    this._state = null;
  }
};
