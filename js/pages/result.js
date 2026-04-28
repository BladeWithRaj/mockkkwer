// ============================================
// RESULT PAGE — Full UX Upgrade
// Retry same/new, insights, performance bands,
// strong/weak areas, animated stats
// ============================================

const ResultPage = {
  render() {
    const result = App.lastResult;
    if (!result) {
      return `
        <div class="setup-page page-enter text-center" style="padding-top: var(--space-16);">
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
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
    let band, bandClass, bandEmoji;
    if (result.accuracy >= 80) { band = 'Excellent!'; bandClass = 'excellent'; bandEmoji = '🏆'; }
    else if (result.accuracy >= 60) { band = 'Good Effort!'; bandClass = 'good'; bandEmoji = '👍'; }
    else if (result.accuracy >= 40) { band = 'Keep Going!'; bandClass = 'average'; bandEmoji = '💪'; }
    else { band = 'Needs Practice'; bandClass = 'weak'; bandEmoji = '📚'; }

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

    return `
      <div class="result-page page-enter">
        <!-- Header with performance band -->
        <div class="result-header animate-fadeInDown">
          <div class="result-band ${bandClass}">
            <span class="result-band-emoji">${bandEmoji}</span>
            <span class="result-band-text">${band}</span>
          </div>
          <p style="color: var(--text-secondary); margin-top: var(--space-2);">
            Here's your performance breakdown
          </p>
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

          <!-- Accuracy % -->
          <div style="text-align: center; margin-top: var(--space-4);">
            <div style="font-size: var(--text-3xl); font-weight: var(--font-extrabold); color: ${scoreColor};" id="accuracy-value">0</div>
            <div style="font-size: var(--text-sm); color: var(--text-muted);">Accuracy</div>
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
            <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border-color);">
              <p style="font-size: var(--text-sm); color: var(--text-muted);">
                Negative marking: -${result.negativeValue} per wrong answer
                (Total deduction: -${(result.wrong * result.negativeValue).toFixed(2)})
              </p>
            </div>
          ` : ''}
        </div>

        <!-- Strong / Weak Areas -->
        ${subjectEntries.length > 0 ? `
        <div class="animate-fadeInUp stagger-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-top: var(--space-6);">
          ${strongArea ? `
          <div class="card" style="padding: var(--space-4); border-left: 3px solid var(--success);">
            <div style="font-size: 20px; margin-bottom: var(--space-2);">💪</div>
            <div style="font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-1);">Strongest</div>
            <div style="font-size: var(--text-base); font-weight: var(--font-bold); color: var(--text-primary);">${strongArea.name}</div>
            <div style="font-size: var(--text-sm); color: var(--success); font-weight: var(--font-semibold);">${strongArea.acc}%</div>
          </div>
          ` : ''}
          ${weakArea && weakArea.name !== (strongArea && strongArea.name) ? `
          <div class="card" style="padding: var(--space-4); border-left: 3px solid var(--danger);">
            <div style="font-size: 20px; margin-bottom: var(--space-2);">⚠️</div>
            <div style="font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-1);">Weakest</div>
            <div style="font-size: var(--text-base); font-weight: var(--font-bold); color: var(--text-primary);">${weakArea.name}</div>
            <div style="font-size: var(--text-sm); color: var(--danger); font-weight: var(--font-semibold);">${weakArea.acc}%</div>
          </div>
          ` : ''}
        </div>
        ` : ''}

        <!-- Subject-wise Breakdown -->
        ${subjectEntries.length > 0 ? `
        <div class="card animate-fadeInUp stagger-3" style="margin-top: var(--space-6);">
          <h3 style="font-size: var(--text-base); margin-bottom: var(--space-4);">📊 Subject-wise Breakdown</h3>
          <div style="display: flex; flex-direction: column; gap: var(--space-4);">
            ${subjectEntries.map(([subject, data]) => {
              const subjectAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              const barColor = subjectAcc >= 70 ? 'var(--success)' : subjectAcc >= 40 ? 'var(--warning)' : 'var(--danger)';
              return `
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-1); font-size: var(--text-sm);">
                    <span style="font-weight: var(--font-semibold);">${Helpers.getSubjectIcon(subject)} ${subject}</span>
                    <span style="color: ${barColor}; font-weight: var(--font-bold);">${subjectAcc}% <span style="color: var(--text-muted); font-weight: normal;">(${data.correct}/${data.total})</span></span>
                  </div>
                  <div style="height: 8px; background: var(--bg-glass); border-radius: var(--radius-full); overflow: hidden;">
                    <div class="accuracy-bar-anim" style="height: 100%; width: 0%; background: ${barColor}; border-radius: var(--radius-full); transition: width 0.8s ease-out;" data-target="${subjectAcc}"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}

        <!-- View Analysis Button -->
        <div class="animate-fadeInUp stagger-4" style="margin-top: var(--space-6);">
          <button class="btn btn-secondary btn-lg btn-block" onclick="App.navigate('analysis')" style="background: rgba(139, 92, 246, 0.1); color: var(--secondary-light); border: 1px solid rgba(139, 92, 246, 0.3);">
            ${Lang.t('result_analysis')}
          </button>
        </div>

        <!-- Actions -->
        <div class="result-actions animate-fadeInUp stagger-5">
          <div style="display: flex; gap: var(--space-3); width: 100%;">
            <button class="btn btn-secondary btn-lg" style="flex: 1;" onclick="ResultPage.retrySameTest()" id="retry-same-btn">
              ${Lang.t('result_retry')}
            </button>
            <button class="btn btn-secondary btn-lg" style="flex: 1;" onclick="App.navigate('setup')" id="retry-new-btn">
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

  // Retry with same config (fetch fresh questions from API)
  async retrySameTest() {
    const config = App.lastTestConfig;
    if (!config) {
      Helpers.showToast('No previous test config found', 'error');
      App.navigate('setup');
      return;
    }

    const btn = document.getElementById('retry-same-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Loading...'; }

    try {
      // Fetch fresh questions from API with same filters
      const questions = await window.fetchRandomQuestions({
        limit: config.numQuestions || config.actualQuestions || 10,
        subject: config.subject,
        difficulty: config.difficulty,
        exam: config.exam,
        seenIds: Storage.getSeenQuestions()
      });

      if (questions.error) throw new Error(questions.error);
      if (!questions || questions.length === 0) throw new Error('No questions found for these filters');

      Storage.addSeenQuestions(questions.map(q => q.id));

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
      if (btn) { btn.disabled = false; btn.innerHTML = '🔄 Retry Same'; }
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
        // Append % after animation
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
  }
};

