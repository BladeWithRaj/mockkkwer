// ============================================
// RESULT PAGE — Game Changer Analysis
// Weak topics, time wasted, easy mistakes,
// speed analysis, subject radar
// ============================================

const ResultPage = {
  render() {
    const result = App.lastResult;
    if (!result) {
      return `
        <div class="setup-page page-enter text-center" style="padding-top: var(--space-16);">
          <div class="empty-state">
            <div class="empty-state-icon">${Icons.get('barChart', 40)}</div>
            <div class="empty-state-title">${Lang.t('result_title')}</div>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">${Lang.t('dash_no_tests')}</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">${Lang.t('nav_new_test')}</button>
          </div>
        </div>
      `;
    }

    const circumference = 2 * Math.PI * 72;
    const offset = circumference - (result.accuracy / 100) * circumference;

    // Performance band
    let band, bandClass, bandIcon, bandMsg;
    if (result.accuracy >= 80) { band = 'Excellent!'; bandClass = 'excellent'; bandIcon = 'trophy'; bandMsg = 'You\'re exam ready!'; }
    else if (result.accuracy >= 60) { band = 'Good Effort!'; bandClass = 'good'; bandIcon = 'trendingUp'; bandMsg = 'Almost there, keep pushing!'; }
    else if (result.accuracy >= 40) { band = 'Keep Going!'; bandClass = 'average'; bandIcon = 'flame'; bandMsg = 'Focus on weak areas below'; }
    else { band = 'Needs Practice'; bandClass = 'weak'; bandIcon = 'bookOpen'; bandMsg = 'Daily practice will help a lot'; }

    // Strong/weak subjects
    const subjectEntries = Object.entries(result.subjectWise);
    let strongArea = null, weakArea = null;
    if (subjectEntries.length > 0) {
      const sorted = subjectEntries
        .map(([name, data]) => ({ name, acc: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0, ...data }))
        .sort((a, b) => b.acc - a.acc);
      strongArea = sorted[0];
      weakArea = sorted.length > 1 ? sorted[sorted.length - 1] : null;
    }

    const scoreColor = result.accuracy >= 70 ? 'var(--success)' :
                       result.accuracy >= 40 ? 'var(--warning)' : 'var(--danger)';

    // === SMART INSIGHTS ===
    const insights = this._calculateInsights(result);

    return `
      <div class="result-page page-enter">
        <!-- Performance Band -->
        <div class="result-header animate-fadeInDown">
          <div class="result-band ${bandClass}">
            <span class="result-band-emoji">${Icons.get(bandIcon, 24)}</span>
            <div>
              <span class="result-band-text">${band}</span>
              <span class="result-band-msg">${bandMsg}</span>
            </div>
          </div>
        </div>

        <!-- Score Card -->
        <div class="result-score-card animate-scaleIn">
          <svg width="0" height="0">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color: #3B82F6"/>
                <stop offset="100%" style="stop-color: #8B5CF6"/>
              </linearGradient>
            </defs>
          </svg>

          <div class="score-circle-wrap">
            <svg class="score-circle" viewBox="0 0 160 160">
              <circle class="score-circle-bg" cx="80" cy="80" r="72"/>
              <circle class="score-circle-fill" cx="80" cy="80" r="72"
                      stroke-dasharray="${circumference}"
                      stroke-dashoffset="${circumference}"
                      id="score-circle-fill"
                      data-target="${offset}"/>
            </svg>
            <div class="score-inner-text">
              <div class="score-value" id="score-value">0</div>
              <div class="score-total">out of ${result.maxMarks}</div>
            </div>
          </div>

          <!-- Accuracy -->
          <div class="result-accuracy-wrap">
            <div class="result-accuracy-value" style="color: ${scoreColor};" id="accuracy-value">0</div>
            <div class="result-accuracy-label">Accuracy</div>
          </div>

          <div class="result-stats">
            <div class="result-stat">
              <div class="result-stat-value correct" id="correct-count">0</div>
              <div class="result-stat-label">${Lang.t('result_correct')}</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value wrong" id="wrong-count">0</div>
              <div class="result-stat-label">${Lang.t('result_wrong')}</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value skipped" id="skipped-count">0</div>
              <div class="result-stat-label">${Lang.t('result_skipped')}</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value time">${Helpers.formatDuration(result.timeTaken)}</div>
              <div class="result-stat-label">${Lang.t('result_time')}</div>
            </div>
          </div>

          ${result.negativeMarking ? `
            <div class="scoring-breakdown">
              <div class="scoring-breakdown-title">${Icons.get('barChart', 16)} Score Breakdown</div>
              <div class="scoring-breakdown-rows">
                <div class="scoring-row correct-row">
                  <span>✓ Correct: ${result.correct} × +${result.marksPerQuestion || 1}</span>
                  <span class="scoring-row-value">+${result.positiveScore || (result.correct * (result.marksPerQuestion || 1))}</span>
                </div>
                <div class="scoring-row wrong-row">
                  <span>✗ Wrong: ${result.wrong} × -${result.negativeValue}</span>
                  <span class="scoring-row-value">-${result.negativeDeduction || (result.wrong * result.negativeValue).toFixed(2)}</span>
                </div>
                <div class="scoring-row skipped-row">
                  <span>⊘ Skipped: ${result.skipped}</span>
                  <span>0</span>
                </div>
                <div class="scoring-row total-row">
                  <span>Final Score</span>
                  <span>${result.totalMarks} / ${result.maxMarks}</span>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Progress Psychology -->
        ${this._renderProgressSection(result)}

        <!-- Daily Goals -->
        ${this._renderDailyGoals(result)}

        <!-- Badges -->
        ${this._renderBadges()}

        <!-- Gamification Rewards (rival-battle only) -->
        ${(result._isRivalBattle || window._currentTestMode === 'rival-battle') ? this._renderRewardsSummary(result) : ''}

        <!-- Smart Insights -->
        <div class="insights-section animate-fadeInUp stagger-2">
          <h3 class="insight-section-title">${Icons.get('brain', 18)} Smart Insights</h3>

          <div class="insights-cards-grid">
            <!-- Speed Analysis -->
            <div class="insight-card speed-card">
              <div class="insight-card-icon">${Icons.get('zap', 20)}</div>
              <div class="insight-card-body">
                <div class="insight-card-label">Avg Speed</div>
                <div class="insight-card-value">${insights.avgSpeed}s <span class="insight-sub">per question</span></div>
                <div class="insight-card-verdict ${insights.speedVerdict.cls}">${insights.speedVerdict.text}</div>
              </div>
            </div>

            <!-- Accuracy Rate -->
            <div class="insight-card accuracy-card">
              <div class="insight-card-icon">${Icons.get('target', 20)}</div>
              <div class="insight-card-body">
                <div class="insight-card-label">Attempt Rate</div>
                <div class="insight-card-value">${insights.attemptRate}%</div>
                <div class="insight-card-verdict ${insights.attemptVerdict.cls}">${insights.attemptVerdict.text}</div>
              </div>
            </div>

            <!-- Time Wasted -->
            <div class="insight-card timewaste-card">
              <div class="insight-card-icon">${Icons.get('clock', 20)}</div>
              <div class="insight-card-body">
                <div class="insight-card-label">Time Wasted</div>
                <div class="insight-card-value">${insights.timeWasted} <span class="insight-sub">on wrong answers</span></div>
                <div class="insight-card-verdict ${insights.timeWasteVerdict.cls}">${insights.timeWasteVerdict.text}</div>
              </div>
            </div>

            <!-- Easy Mistakes -->
            <div class="insight-card mistake-card">
              <div class="insight-card-icon">${Icons.get('alertTriangle', 20)}</div>
              <div class="insight-card-body">
                <div class="insight-card-label">Easy Mistakes</div>
                <div class="insight-card-value">${insights.easyMistakes} <span class="insight-sub">questions</span></div>
                <div class="insight-card-verdict ${insights.easyMistakeVerdict.cls}">${insights.easyMistakeVerdict.text}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Weak Topics -->
        ${insights.weakTopics.length > 0 ? `
        <div class="weak-section animate-fadeInUp stagger-3">
          <h3 class="insight-section-title">${Icons.get('alertCircle', 18)} Weak Topics — Focus Here</h3>
          <div class="weak-topics-grid">
            ${insights.weakTopics.map(wt => `
              <div class="weak-topic-card">
                <div class="weak-topic-left">
                  <span class="weak-topic-icon">${Helpers.getSubjectIcon(wt.subject)}</span>
                  <div>
                    <div class="weak-topic-name">${wt.name}</div>
                    <div class="weak-topic-detail">${wt.correct}/${wt.total} correct</div>
                  </div>
                </div>
                <div class="weak-topic-right">
                  <div class="weak-topic-acc" style="color: var(--danger);">${wt.accuracy}%</div>
                  <div class="weak-topic-bar">
                    <div class="weak-topic-bar-fill" style="width: ${wt.accuracy}%; background: var(--danger);"></div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Time Wasted Questions -->
        ${insights.slowestQuestions.length > 0 ? `
        <div class="timewaste-section animate-fadeInUp stagger-4">
          <h3 class="insight-section-title">${Icons.get('timer', 18)} Slowest Questions — Time Wasted</h3>
          <div class="slow-questions-list">
            ${insights.slowestQuestions.map((sq, i) => `
              <div class="slow-question-item">
                <div class="slow-q-rank">#${i + 1}</div>
                <div class="slow-q-info">
                  <div class="slow-q-text">${(sq.question.question || '').substring(0, 80)}...</div>
                  <div class="slow-q-meta">
                    <span class="chip ${sq.isCorrect ? 'chip-success' : sq.isSkipped ? '' : 'chip-danger'}">${sq.isCorrect ? 'Correct' : sq.isSkipped ? 'Skipped' : 'Wrong'}</span>
                    <span class="chip chip-primary">${sq.question.subject}</span>
                  </div>
                </div>
                <div class="slow-q-time">${sq.timeSpent}s</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Strong / Weak Areas -->
        ${subjectEntries.length > 0 ? `
        <div class="strength-weakness-grid animate-fadeInUp stagger-4">
          ${strongArea ? `
          <div class="area-card strong">
            <div class="area-card-icon">${Icons.get('trendingUp', 20)}</div>
            <div class="area-card-label">Strongest</div>
            <div class="area-card-name">${strongArea.name}</div>
            <div class="area-card-pct strong">${strongArea.acc}%</div>
          </div>
          ` : ''}
          ${weakArea && weakArea.name !== (strongArea && strongArea.name) ? `
          <div class="area-card weak">
            <div class="area-card-icon">${Icons.get('trendingDown', 20)}</div>
            <div class="area-card-label">Weakest</div>
            <div class="area-card-name">${weakArea.name}</div>
            <div class="area-card-pct weak">${weakArea.acc}%</div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- Subject-wise Breakdown -->
        ${subjectEntries.length > 0 ? `
        <div class="subject-breakdown-card animate-fadeInUp stagger-5">
          <h3 class="subject-breakdown-title">${Icons.get('barChart', 18)} Subject-wise Breakdown</h3>
          <div class="subject-breakdown-list">
            ${subjectEntries.map(([subject, data]) => {
              const subjectAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              const barColor = subjectAcc >= 70 ? 'var(--success)' : subjectAcc >= 40 ? 'var(--warning)' : 'var(--danger)';
              return `
                <div>
                  <div class="subject-row-header">
                    <span class="subject-row-name">${Helpers.getSubjectIcon(subject)} ${subject}</span>
                    <span class="subject-row-pct" style="color: ${barColor};">${subjectAcc}% <span class="subject-row-ratio">(${data.correct}/${data.total})</span></span>
                  </div>
                  <div class="subject-row-bar">
                    <div class="accuracy-bar-anim" style="height: 100%; width: 0%; background: ${barColor}; border-radius: var(--radius-full); transition: width 0.8s ease-out;" data-target="${subjectAcc}"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}

        <!-- View Analysis Button -->
        <div class="result-analysis-btn animate-fadeInUp stagger-6">
          <button class="btn btn-secondary btn-lg btn-block" onclick="App.navigate('analysis')">
            ${Lang.t('result_analysis')}
          </button>
        </div>

        <!-- Actions -->
        <div class="result-actions animate-fadeInUp stagger-7">
          <div class="result-actions-row">
            <button class="btn btn-secondary btn-lg" onclick="ResultPage.retrySameTest()" id="retry-same-btn">
              ${Lang.t('result_retry')}
            </button>
            <button class="btn btn-secondary btn-lg" onclick="App.navigate('setup')" id="retry-new-btn">
              ${Lang.t('result_new')}
            </button>
          </div>
          <button class="btn btn-ghost" onclick="App.navigate('home')">
            ${Lang.t('result_home')}
          </button>
        </div>
      </div>
    `;
  },

  // === SMART INSIGHTS CALCULATOR ===
  _calculateInsights(result) {
    const qr = result.questionResults || [];
    const total = qr.length;

    // Average speed
    const totalTimeSpent = qr.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
    const avgSpeed = total > 0 ? Math.round(totalTimeSpent / total) : 0;

    // Speed verdict
    let speedVerdict;
    if (avgSpeed <= 30) speedVerdict = { text: 'Great speed!', cls: 'verdict-good' };
    else if (avgSpeed <= 60) speedVerdict = { text: 'Good pace', cls: 'verdict-ok' };
    else if (avgSpeed <= 90) speedVerdict = { text: 'A bit slow — practice more', cls: 'verdict-warn' };
    else speedVerdict = { text: 'Too slow — work on speed', cls: 'verdict-bad' };

    // Attempt rate
    const attempted = total - result.skipped;
    const attemptRate = total > 0 ? Math.round((attempted / total) * 100) : 0;
    let attemptVerdict;
    if (attemptRate >= 90) attemptVerdict = { text: 'Great coverage!', cls: 'verdict-good' };
    else if (attemptRate >= 70) attemptVerdict = { text: 'Good, attempt more', cls: 'verdict-ok' };
    else attemptVerdict = { text: 'Too many skipped', cls: 'verdict-warn' };

    // Time wasted on wrong answers
    const wrongQuestions = qr.filter(q => !q.isCorrect && !q.isSkipped);
    const timeOnWrong = wrongQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
    const timeWasted = Helpers.formatDuration(timeOnWrong);
    let timeWasteVerdict;
    const wasteRatio = totalTimeSpent > 0 ? timeOnWrong / totalTimeSpent : 0;
    if (wasteRatio <= 0.2) timeWasteVerdict = { text: 'Efficient!', cls: 'verdict-good' };
    else if (wasteRatio <= 0.4) timeWasteVerdict = { text: 'Some waste — review', cls: 'verdict-ok' };
    else timeWasteVerdict = { text: 'Too much time lost!', cls: 'verdict-bad' };

    // Easy mistakes (answered wrong but spent < 30 seconds — likely careless)
    const easyMistakes = wrongQuestions.filter(q => (q.timeSpent || 0) < 30).length;
    let easyMistakeVerdict;
    if (easyMistakes === 0) easyMistakeVerdict = { text: 'No careless errors!', cls: 'verdict-good' };
    else if (easyMistakes <= 3) easyMistakeVerdict = { text: 'A few — read carefully', cls: 'verdict-ok' };
    else easyMistakeVerdict = { text: 'Too many! Slow down', cls: 'verdict-bad' };

    // Weak topics
    const weakTopics = (result.weakTopics || []).slice(0, 5);

    // Slowest questions (top 5 by time spent)
    const slowestQuestions = [...qr]
      .filter(q => q.timeSpent > 0)
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, 5);

    return {
      avgSpeed,
      speedVerdict,
      attemptRate,
      attemptVerdict,
      timeWasted,
      timeWasteVerdict,
      easyMistakes,
      easyMistakeVerdict,
      weakTopics,
      slowestQuestions
    };
  },

  _renderRewardsSummary(result) {
    const gam = result._gamification;
    if (!gam || !window.Gamification) return '';

    return `
      <div class="rewards-summary animate-fadeInUp stagger-1">
        <div class="rewards-summary-title">${Icons.get('award', 18)} Rewards Earned</div>
        ${gam.rewards.map(r => `
          <div class="reward-line">
            <div class="reward-line-left">
              <span>${r.icon}</span>
              <span>${r.label}</span>
            </div>
            <div class="reward-line-right">
              <span class="reward-coins-badge">${Icons.get('coins', 12)} +${r.coins}</span>
              <span class="reward-xp-badge">+${r.xp} XP</span>
            </div>
          </div>
        `).join('')}
        <div class="rewards-total">
          <span>Total Earned</span>
          <div style="display:flex;gap:var(--space-4);">
            <span class="rewards-total-coins">${Icons.get('coins', 14)} +${gam.totalCoins}</span>
            <span class="rewards-total-xp">${Icons.get('zap', 14)} +${gam.totalXP} XP</span>
          </div>
        </div>
        ${gam.combo >= 5 ? `
          <div style="margin-top:var(--space-3);text-align:center;font-size:var(--text-sm);color:var(--text-secondary);">
            ${Icons.get('flame', 14)} Best Combo: ${gam.combo}x in a row!
          </div>
        ` : ''}
        <div style="margin-top:var(--space-3);text-align:center;">
          <span class="xp-level-badge">${Icons.get('star', 14)} ${gam.level.title} — Tier ${gam.level.level}/5</span>
          <div class="xp-bar-wrap" style="margin-top:var(--space-2);width:100%;">
            <div class="xp-bar-fill" style="width:${gam.level.progress}%"></div>
          </div>
        </div>
      </div>
    `;
  },

  // Retry with same config (fetch fresh questions from API)
  async retrySameTest() {
    const config = App.lastTestConfig;
    if (!config) {
      Helpers.showToast('No previous test config found', 'error');
      App.navigate('setup');
      return;
    }

    const btn = document.getElementById('retry-same-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;"></span> Loading...'; }

    try {
      const questions = await window.fetchRandomQuestions({
        limit: config.numQuestions || config.actualQuestions || 10,
        subjects: config.subjects || []
      });

      if (!questions || questions.length === 0) throw new Error('No questions found for these filters');

      const result = TestEngine.createTest({
        questions,
        timePerQuestion: 60,
        totalTime: config.totalTime || null,
        negativeMarking: config.negativeMarking || false,
        negativeValue: config.negativeValue || 0.25
      });

      if (result.error) throw new Error(result.error);

      Helpers.showToast(`Retry! ${result.questionCount} questions`, 'success');
      App.navigate('test');
    } catch (err) {
      Helpers.showToast(err.message, 'error');
      if (btn) { btn.disabled = false; btn.innerHTML = Icons.get('refresh', 14) + ' Retry Same'; }
    }
  },

  afterRender() {
    const result = App.lastResult;
    if (!result) return;

    // Animate score circle
    setTimeout(() => {
      const circle = document.getElementById('score-circle-fill');
      if (circle) circle.style.strokeDashoffset = circle.dataset.target;
    }, 300);

    // Animate counters
    setTimeout(() => {
      const scoreEl = document.getElementById('score-value');
      const accuracyEl = document.getElementById('accuracy-value');
      const correctEl = document.getElementById('correct-count');
      const wrongEl = document.getElementById('wrong-count');
      const skippedEl = document.getElementById('skipped-count');

      if (scoreEl) Helpers.animateCounter(scoreEl, result.totalMarks, 1200);
      if (accuracyEl) {
        Helpers.animateCounter(accuracyEl, result.accuracy, 1200);
        setTimeout(() => { if (accuracyEl) accuracyEl.textContent = result.accuracy + '%'; }, 1300);
      }
      if (correctEl) Helpers.animateCounter(correctEl, result.correct, 800);
      if (wrongEl) Helpers.animateCounter(wrongEl, result.wrong, 800);
      if (skippedEl) Helpers.animateCounter(skippedEl, result.skipped, 800);
    }, 400);

    // Animate subject accuracy bars
    setTimeout(() => {
      document.querySelectorAll('.accuracy-bar-anim').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 600);

    // Record result in progress engine
    if (typeof ProgressEngine !== 'undefined') {
      ProgressEngine.recordResult(result);
    }

    // Animate timeline bars if present
    setTimeout(() => {
      document.querySelectorAll('.timeline-bar-fill').forEach(bar => {
        bar.style.height = bar.dataset.target + '%';
      });
    }, 800);
  },

  // ── PROGRESS SECTION: Percentile + Improvement ──
  _renderProgressSection(result) {
    if (typeof ProgressEngine === 'undefined') return '';

    const improvement = ProgressEngine.getImprovement(result);
    const percentile = ProgressEngine.calculatePercentile(result.accuracy || 0);
    const progress = ProgressEngine.getProgress();
    const timeline = ProgressEngine.getTimeline(8);

    // No progress data yet (first test)
    if (progress.totalTests <= 0 && !improvement) return '';

    const trendIcon = improvement
      ? improvement.trend === 'up' ? Icons.get('trendingUp', 14) : improvement.trend === 'down' ? Icons.get('trendingDown', 14) : Icons.get('arrowRight', 14)
      : Icons.get('sparkles', 14);
    const trendColor = improvement
      ? improvement.trend === 'up' ? 'var(--success)' : improvement.trend === 'down' ? 'var(--danger)' : 'var(--text-muted)'
      : 'var(--primary)';
    const deltaSign = improvement && improvement.accuracyDelta > 0 ? '+' : '';

    return `
      <div class="progress-section animate-fadeInUp stagger-1">
        <div class="progress-section-inner">
          <h3 class="progress-section-title">
            ${Icons.get('activity', 18)} Your Progress
            <span class="test-num">Test #${progress.totalTests + 1}</span>
          </h3>

          <div class="progress-stats-grid">
            ${percentile !== null ? `
            <div class="progress-stat-card percentile">
              <div class="progress-stat-val" style="color: var(--primary-light);">${percentile}%</div>
              <div class="progress-stat-label">Percentile</div>
            </div>
            ` : ''}

            ${improvement ? `
            <div class="progress-stat-card ${improvement.trend === 'up' ? 'trend-up' : improvement.trend === 'down' ? 'trend-down' : 'trend-flat'}">
              <div class="progress-stat-val" style="color: ${trendColor};">
                ${trendIcon} ${deltaSign}${improvement.accuracyDelta}%
              </div>
              <div class="progress-stat-label">vs Last Test</div>
            </div>
            ` : ''}

            <div class="progress-stat-card streak">
              <div class="progress-stat-val" style="color: var(--warning-light);">
                ${Icons.get('flame', 16)} ${progress.currentStreak}
              </div>
              <div class="progress-stat-label">Day Streak</div>
            </div>

            <div class="progress-stat-card best-accuracy">
              <div class="progress-stat-val" style="color: var(--success-light);">
                ${progress.bestAccuracy}%
              </div>
              <div class="progress-stat-label">Best Accuracy</div>
            </div>
          </div>

          ${timeline.length >= 2 ? `
          <div class="timeline-section">
            <div class="timeline-label">Accuracy Timeline</div>
            <div class="timeline-bars">
              ${timeline.map((t, i) => {
                const barColor = t.accuracy >= 70 ? 'var(--success)' : t.accuracy >= 40 ? 'var(--warning)' : 'var(--danger)';
                const isLast = i === timeline.length - 1;
                return `
                  <div class="timeline-bar-col">
                    <span class="timeline-bar-pct ${isLast ? 'current' : ''}">${t.accuracy}%</span>
                    <div class="timeline-bar-track">
                      <div class="timeline-bar-fill" data-target="${t.accuracy}" style="width:100%; height:0%; background: ${barColor}; border-radius: 3px; transition: height 0.8s ease-out ${i * 80}ms;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  // ── DAILY GOALS ──
  _renderDailyGoals(result) {
    if (typeof ProgressEngine === 'undefined') return '';
    const goals = ProgressEngine.getDailyGoals(result);
    const allDone = goals.every(g => g.done);

    return `
      <div class="daily-goals-section animate-fadeInUp stagger-1">
        <div class="daily-goals-inner">
          <h3 class="daily-goals-title">
            ${Icons.get('target', 18)} Today's Goals ${allDone ? '<span style="color: var(--success); font-size: var(--text-xs);">All Complete!</span>' : ''}
          </h3>
          <div class="daily-goals-list">
            ${goals.map(g => `
              <div class="daily-goal-item ${g.done ? 'done' : ''}">
                <span class="daily-goal-check">${g.done ? Icons.get('checkCircle', 14) : Icons.get('target', 14)}</span>
                <span class="daily-goal-text">${g.icon} ${g.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  // ── BADGES ──
  _renderBadges() {
    if (typeof ProgressEngine === 'undefined') return '';
    const badges = ProgressEngine.getBadges();
    const earned = badges.filter(b => b.earned);
    if (earned.length === 0) return '';

    return `
      <div class="badges-section animate-fadeInUp stagger-2">
        <div class="badges-inner">
          <h3 class="badges-title">${Icons.get('award', 18)} Badges Earned</h3>
          <div class="badges-grid">
            ${earned.map(b => `
              <div class="badge-pill">
                <span>${b.icon}</span>
                <span>${b.name}</span>
              </div>
            `).join('')}
          </div>
          ${badges.filter(b => !b.earned).length > 0 ? `
            <div class="badges-remaining">
              ${badges.filter(b => !b.earned).length} more badges to unlock
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
};
