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
            <div class="empty-state-title">No Results Available</div>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">Take a test to see your results</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">Start a Test</button>
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

          <div class="result-stats">
            <div class="result-stat">
              <div class="result-stat-value correct" id="correct-count">0</div>
              <div class="result-stat-label">Correct</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value wrong" id="wrong-count">0</div>
              <div class="result-stat-label">Wrong</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value skipped" id="skipped-count">0</div>
              <div class="result-stat-label">Skipped</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value time">${Helpers.formatDuration(result.timeTaken)}</div>
              <div class="result-stat-label">Time Taken</div>
            </div>
          </div>

          ${result.negativeMarking ? `
            <div style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border-color);">
              <p style="font-size: var(--text-sm); color: var(--text-muted);">
                Negative marking: -${result.negativeValue} per wrong answer
                (Total deduction: -${(result.wrong * result.negativeValue).toFixed(2)})
              </p>
            </div>
          ` : ''}ed</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="result-actions animate-fadeInUp stagger-5">
          <div style="display: flex; gap: var(--space-3); width: 100%;">
            <button class="btn btn-secondary btn-lg" style="flex: 1;" onclick="ResultPage.retrySameTest()" id="retry-same-btn">
              🔄 Retry Same
            </button>
            <button class="btn btn-secondary btn-lg" style="flex: 1;" onclick="App.navigate('setup')" id="retry-new-btn">
              🆕 New Test
            </button>
          </div>
          <button class="btn btn-ghost" onclick="App.navigate('home')">
            🏠 Back to Home
          </button>
        </div>
      </div>
    `;
  },

  // Retry with same config (new random from same filters)
  retrySameTest() {
    const config = App.lastTestConfig;
    if (!config) {
      Helpers.showToast('No previous test config found', 'error');
      App.navigate('setup');
      return;
    }

    const result = TestEngine.createTest({
      subject: config.subject || 'all',
      exam: config.exam || 'all',
      difficulty: config.difficulty || 'all',
      numQuestions: config.numQuestions || config.actualQuestions || 10,
      timePerQuestion: 60,
      totalTime: null,
      negativeMarking: config.negativeMarking || false,
      negativeValue: config.negativeValue || 0.25
    });

    if (result.error) {
      Helpers.showToast(result.error, 'error');
      return;
    }

    Helpers.showToast(`Retry! ${result.questionCount} questions`, 'success');
    App.navigate('test');
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
      const correctEl = document.getElementById('correct-count');
      const wrongEl = document.getElementById('wrong-count');
      const skippedEl = document.getElementById('skipped-count');

      if (scoreEl) Helpers.animateCounter(scoreEl, result.totalMarks, 1200);
      if (correctEl) Helpers.animateCounter(correctEl, result.correct, 800);
      if (wrongEl) Helpers.animateCounter(wrongEl, result.wrong, 800);
      if (skippedEl) Helpers.animateCounter(skippedEl, result.skipped, 800);
    }, 400);

    // Animate accuracy bar
    setTimeout(() => {
      const bar = document.getElementById('accuracy-bar');
      if (bar) bar.style.width = bar.dataset.target + '%';
    }, 600);


  }
};
