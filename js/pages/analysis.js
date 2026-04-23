// ============================================
// MOCK TEST PLATFORM — Analysis Page
// ============================================

const AnalysisPage = {
  activeTab: 'all',

  render() {
    const result = App.lastResult;
    if (!result) {
      return `
        <div class="setup-page page-enter text-center" style="padding-top: var(--space-16);">
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-title">No Analysis Available</div>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">Complete a test to see detailed analysis</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">Start a Test</button>
          </div>
        </div>
      `;
    }

    // Filter questions based on active tab
    let filteredQuestions = result.questionResults;
    if (this.activeTab === 'correct') {
      filteredQuestions = result.questionResults.filter(q => q.isCorrect);
    } else if (this.activeTab === 'wrong') {
      filteredQuestions = result.questionResults.filter(q => !q.isCorrect && !q.isSkipped);
    } else if (this.activeTab === 'skipped') {
      filteredQuestions = result.questionResults.filter(q => q.isSkipped);
    }

    const labels = ['A', 'B', 'C', 'D'];

    return `
      <div class="analysis-page page-enter">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-4);">
          <div>
            <h1 class="animate-fadeInDown" style="font-size: var(--text-2xl);">Detailed Analysis</h1>
            <p class="animate-fadeInDown stagger-1" style="color: var(--text-secondary); font-size: var(--text-sm);">
              Score: ${result.totalMarks}/${result.maxMarks} • Accuracy: ${result.accuracy}%
            </p>
          </div>
          <div class="animate-fadeInDown stagger-2" style="display: flex; gap: var(--space-2);">
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('result')">← Results</button>
            <button class="btn btn-primary btn-sm" onclick="App.navigate('setup')">New Test</button>
          </div>
        </div>

        <!-- Time Analysis Card -->
        <div class="card animate-fadeInUp stagger-1" style="margin-bottom: var(--space-6);">
          <h3 style="font-size: var(--text-base); margin-bottom: var(--space-4);">⏱️ Time Analysis</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-4);">
            <div class="result-stat">
              <div class="result-stat-value time">${Helpers.formatDuration(result.timeTaken)}</div>
              <div class="result-stat-label">Total Time</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value" style="color: var(--primary-light);">${result.avgTimePerQuestion}s</div>
              <div class="result-stat-label">Avg per Question</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value" style="color: var(--success);">
                ${result.questionResults.length > 0 ? Math.min(...result.questionResults.map(q => q.timeSpent)) : 0}s
              </div>
              <div class="result-stat-label">Fastest</div>
            </div>
            <div class="result-stat">
              <div class="result-stat-value" style="color: var(--warning);">
                ${result.questionResults.length > 0 ? Math.max(...result.questionResults.map(q => q.timeSpent)) : 0}s
              </div>
              <div class="result-stat-label">Slowest</div>
            </div>
          </div>
        </div>

        <!-- Performance Trend -->
        ${this._renderTrendChart()}

        <!-- Tabs -->
        <div class="analysis-tabs animate-fadeInUp stagger-3">
          <button class="analysis-tab ${this.activeTab === 'all' ? 'active' : ''}"
                  onclick="AnalysisPage.setTab('all')">
            All (${result.questionResults.length})
          </button>
          <button class="analysis-tab ${this.activeTab === 'correct' ? 'active' : ''}"
                  onclick="AnalysisPage.setTab('correct')">
            ✅ Correct (${result.correct})
          </button>
          <button class="analysis-tab ${this.activeTab === 'wrong' ? 'active' : ''}"
                  onclick="AnalysisPage.setTab('wrong')">
            ❌ Wrong (${result.wrong})
          </button>
          <button class="analysis-tab ${this.activeTab === 'skipped' ? 'active' : ''}"
                  onclick="AnalysisPage.setTab('skipped')">
            ⏭️ Skipped (${result.skipped})
          </button>
        </div>

        <!-- Question Review Cards -->
        <div id="question-review-list">
          ${filteredQuestions.length === 0 ? `
            <div class="empty-state" style="padding: var(--space-8);">
              <div class="empty-state-icon">📝</div>
              <div class="empty-state-title">No questions in this category</div>
            </div>
          ` : ''}
          ${filteredQuestions.map((qr, i) => {
            const q = qr.question;
            const statusClass = qr.isCorrect ? 'correct-card' : qr.isSkipped ? 'skipped-card' : 'wrong-card';
            const statusIcon = qr.isCorrect ? '✅' : qr.isSkipped ? '⏭️' : '❌';
            const qIndex = result.questionResults.indexOf(qr);

            return `
              <div class="question-review-card ${statusClass} animate-fadeInUp" style="animation-delay: ${i * 50}ms;">
                <div class="review-question-header">
                  <span class="review-question-num">Q${qIndex + 1} ${statusIcon}</span>
                  <div style="display: flex; gap: var(--space-2);">
                    <span class="chip chip-primary">${q.subject}</span>
                    <span class="chip">${q.topic}</span>
                    <span class="chip" style="color: var(--text-muted);">${qr.timeSpent}s</span>
                  </div>
                </div>

                <p style="font-size: var(--text-sm); color: var(--text-primary); margin-bottom: var(--space-4); line-height: var(--leading-relaxed);">
                  ${q.question}
                </p>

                <div class="options-list" style="pointer-events: none;">
                  ${q.options.map((opt, oi) => {
                    let cls = '';
                    if (oi === q.correct) cls = 'correct';
                    else if (oi === qr.selectedAnswer && !qr.isCorrect) cls = 'wrong';
                    return `
                      <div class="option-btn ${cls}" style="padding: var(--space-2) var(--space-4); cursor: default;">
                        <span class="option-label" style="width: 26px; height: 26px; font-size: 11px;">${labels[oi]}</span>
                        <span class="option-text" style="font-size: var(--text-sm);">${opt}</span>
                      </div>
                    `;
                  }).join('')}
                </div>

                <div style="margin-top: var(--space-4);">
                  <button class="btn btn-secondary btn-sm" onclick="explainQuestion(this.dataset.question)" data-question="${q.question.replace(/"/g, '&quot;')}">
                    💡 Explain
                  </button>
                </div>

                ${q.explanation ? `
                  <div class="explanation-box">
                    <div class="explanation-title">💡 Explanation</div>
                    <div class="explanation-text">${q.explanation}</div>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <div style="text-align: center; padding: var(--space-8) 0;">
          <button class="btn btn-primary btn-lg" onclick="App.navigate('setup')">
            🔄 Take Another Test
          </button>
        </div>
      </div>
    `;
  },

  _renderTrendChart() {
    const history = Storage.getHistory();
    if (history.length < 2) return '';

    return `
      <div class="card animate-fadeInUp stagger-2" style="margin-bottom: var(--space-6);">
        <h3 style="font-size: var(--text-base); margin-bottom: var(--space-4);">📈 Performance Trend</h3>
        <canvas id="trend-chart" width="800" height="200" style="width: 100%; height: 200px;"></canvas>
      </div>
    `;
  },

  setTab(tab) {
    this.activeTab = tab;
    document.getElementById('app').innerHTML = this.render();
    this.afterRender();
  },

  afterRender() {
    // Draw trend chart
    const canvas = document.getElementById('trend-chart');
    if (canvas) {
      const history = Storage.getHistory();
      const trendData = history.slice(0, 10).reverse().map((t, i) => ({
        label: `T${i + 1}`,
        value: t.accuracy || 0
      }));
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = 400;
      Analytics.drawLineChart(canvas, trendData);
    }
  }
};

window.explainQuestion = async function(question) {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ question })
  });

  const data = await res.json();
  alert(data.explanation);
};
