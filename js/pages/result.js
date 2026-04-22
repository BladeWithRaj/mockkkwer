// ============================================
// MOCK TEST PLATFORM — Result Page
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
    const scoreColor = result.accuracy >= 70 ? 'var(--success)' :
                       result.accuracy >= 40 ? 'var(--warning)' : 'var(--danger)';

    return `
      <div class="result-page page-enter">
        <div class="result-header animate-fadeInDown">
          <h1>${result.accuracy >= 70 ? '🎉 Excellent!' : result.accuracy >= 40 ? '👍 Good Effort!' : '💪 Keep Practicing!'}</h1>
          <p style="color: var(--text-secondary); margin-top: var(--space-2);">
            Here's how you performed
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
          ` : ''}
        </div>

        <!-- Accuracy Bar -->
        <div class="card animate-fadeInUp stagger-2" style="margin-bottom: var(--space-6);">
          <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-3);">
            <span style="font-size: var(--text-sm); font-weight: var(--font-semibold);">Accuracy</span>
            <span style="font-size: var(--text-sm); font-weight: var(--font-bold); color: ${scoreColor};">${result.accuracy}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width: 0%; background: ${
              result.accuracy >= 70 ? 'linear-gradient(90deg, #10B981, #34D399)' :
              result.accuracy >= 40 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' :
              'linear-gradient(90deg, #EF4444, #F87171)'
            };" id="accuracy-bar" data-target="${result.accuracy}"></div>
          </div>
        </div>

        <!-- Subject Breakdown -->
        ${Object.keys(result.subjectWise).length > 1 ? `
          <div class="card animate-fadeInUp stagger-3" style="margin-bottom: var(--space-6);">
            <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-6);">Subject-wise Performance</h3>
            <div class="subject-breakdown">
              ${Object.entries(result.subjectWise).map(([subject, data]) => {
                const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                return `
                  <div class="subject-bar">
                    <span class="subject-name">${Helpers.getSubjectIcon(subject)} ${subject}</span>
                    <div class="subject-progress">
                      <div class="subject-progress-fill" style="width: ${acc}%; background: ${Helpers.getSubjectColor(subject)};" data-target="${acc}"></div>
                    </div>
                    <span class="subject-score">${data.correct}/${data.total}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Chart Area -->
        <div class="card animate-fadeInUp stagger-4" style="margin-bottom: var(--space-6);">
          <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-4);">Score Distribution</h3>
          <canvas id="result-donut-chart" width="280" height="280" style="margin: 0 auto; display: block;"></canvas>
          <div style="display: flex; justify-content: center; gap: var(--space-6); margin-top: var(--space-4);">
            <span class="legend-item"><span class="legend-dot" style="background: var(--success);"></span> Correct</span>
            <span class="legend-item"><span class="legend-dot" style="background: var(--danger);"></span> Wrong</span>
            <span class="legend-item"><span class="legend-dot" style="background: #475569;"></span> Skipped</span>
          </div>
        </div>

        <!-- Weak Topics -->
        ${result.weakTopics.length > 0 ? `
          <div class="card animate-fadeInUp stagger-5" style="margin-bottom: var(--space-6);">
            <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-4);">⚠️ Areas to Improve</h3>
            <div class="weak-topics-list">
              ${result.weakTopics.map(topic => `
                <div class="weak-topic-item">
                  <div class="weak-topic-info">
                    <div class="weak-topic-icon">${Helpers.getSubjectIcon(topic.subject)}</div>
                    <div>
                      <div class="weak-topic-name">${topic.topic}</div>
                      <div class="weak-topic-detail">${topic.subject} • ${topic.correct}/${topic.total} correct</div>
                    </div>
                  </div>
                  <span class="chip chip-danger">${topic.accuracy}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="result-actions animate-fadeInUp stagger-6">
          <button class="btn btn-primary btn-lg" onclick="App.navigate('analysis')" id="view-analysis-btn">
            📊 View Detailed Analysis
          </button>
          <button class="btn btn-secondary btn-lg" onclick="App.navigate('setup')" id="retake-btn">
            🔄 Take Another Test
          </button>
          <button class="btn btn-ghost" onclick="App.navigate('home')">
            🏠 Back to Home
          </button>
        </div>
      </div>
    `;
  },

  afterRender() {
    const result = App.lastResult;
    if (!result) return;

    // Animate score circle
    setTimeout(() => {
      const circle = document.getElementById('score-circle-fill');
      if (circle) {
        circle.style.strokeDashoffset = circle.dataset.target;
      }
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

    // Draw donut chart
    setTimeout(() => {
      const canvas = document.getElementById('result-donut-chart');
      if (canvas) {
        Analytics.drawDonutChart(canvas, [
          { label: 'Correct', value: result.correct, color: '#10B981' },
          { label: 'Wrong', value: result.wrong, color: '#EF4444' },
          { label: 'Skipped', value: result.skipped, color: '#475569' }
        ], {
          centerText: `${result.accuracy}%`,
          centerSubText: 'Accuracy'
        });
      }
    }, 500);
  }
};
