// ============================================
// RESULT PAGE v2 — Premium Analytics Dashboard
// Ultra-Black theme with glassmorphism & gradient accents
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
    if (result.accuracy >= 80) {
      band = 'Excellent!';
      bandClass = 'excellent';
      bandIcon = 'trophy';
      bandMsg = "You're exam ready! Keep maintaining this standard.";
    } else if (result.accuracy >= 60) {
      band = 'Good Effort!';
      bandClass = 'good';
      bandIcon = 'trendingUp';
      bandMsg = 'Almost there! Focus on the highlighted weak topics to boost your score.';
    } else if (result.accuracy >= 40) {
      band = 'Keep Going!';
      bandClass = 'average';
      bandIcon = 'flame';
      bandMsg = 'Consistent practice on target areas will bridge the gap.';
    } else {
      band = 'Needs Practice';
      bandClass = 'weak';
      bandIcon = 'bookOpen';
      bandMsg = 'Go through recommendations and review slow/incorrect responses.';
    }

    // Strong/weak subjects
    const subjectEntries = Object.entries(result.subjectWise || {});
    let strongArea = null, weakArea = null;
    if (subjectEntries.length > 0) {
      const sorted = subjectEntries
        .map(([name, data]) => ({ name, acc: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0, ...data }))
        .sort((a, b) => b.acc - a.acc);
      strongArea = sorted[0];
      weakArea = sorted.length > 1 ? sorted[sorted.length - 1] : null;
    }

    // === SMART INSIGHTS ===
    const insights = this._calculateInsights(result);

    // SWOT calculation
    const swot = this._calculateSWOT(result, insights, subjectEntries);

    // Benchmarks calculation
    const benchmarks = this._calculateBenchmarks(result, insights);

    return `
      <div class="result-page-v2 page-enter">
        <!-- Glowing background blobs -->
        <div class="rp-bg-glow primary"></div>
        <div class="rp-bg-glow secondary"></div>
        <div class="rp-bg-glow accent"></div>

        <!-- Performance Band Banner -->
        <div class="rp-banner ${bandClass} animate-fadeInDown">
          <div class="rp-banner-glass"></div>
          <div class="rp-banner-icon">${Icons.get(bandIcon, 28)}</div>
          <h2 class="rp-banner-title">${band}</h2>
          <p class="rp-banner-msg">${bandMsg}</p>
        </div>

        <!-- Overview Score Card -->
        <div class="rp-card animate-scaleIn">
          <div class="rp-card-header">
            <div class="rp-card-icon blue">${Icons.get('award', 18)}</div>
            <div>
              <h3 class="rp-card-title">Performance Summary</h3>
              <div class="rp-card-subtitle">Real-time scoring and accuracy metrics</div>
            </div>
          </div>

          <div class="rp-score-hero">
            <!-- Donut -->
            <div class="rp-donut-wrap">
              <svg viewBox="0 0 160 160">
                <defs>
                  <linearGradient id="rpScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#4F6EF7" />
                    <stop offset="100%" stop-color="#8B5CF6" />
                  </linearGradient>
                </defs>
                <circle class="rp-donut-bg" cx="80" cy="80" r="72"></circle>
                <circle class="rp-donut-fill" cx="80" cy="80" r="72"
                        stroke-dasharray="${circumference}"
                        stroke-dashoffset="${circumference}"
                        id="rp-donut-fill"
                        data-target="${offset}">
                </circle>
              </svg>
              <div class="rp-donut-center">
                <div class="rp-donut-score" id="rp-score-val">0</div>
                <div class="rp-donut-label">out of ${result.maxMarks}</div>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="rp-stats-side">
              <div class="rp-stat-box">
                <div class="rp-stat-num accuracy" id="rp-accuracy-val">0%</div>
                <div class="rp-stat-label">Accuracy</div>
              </div>
              <div class="rp-stat-box">
                <div class="rp-stat-num correct" id="rp-correct-val">0</div>
                <div class="rp-stat-label">${Lang.t('result_correct')}</div>
              </div>
              <div class="rp-stat-box">
                <div class="rp-stat-num wrong" id="rp-wrong-val">0</div>
                <div class="rp-stat-label">${Lang.t('result_wrong')}</div>
              </div>
              <div class="rp-stat-box">
                <div class="rp-stat-num skipped" id="rp-skipped-val">0</div>
                <div class="rp-stat-label">${Lang.t('result_skipped')}</div>
              </div>
            </div>
          </div>

          <!-- Scoring Breakdown table if negativeMarking -->
          ${result.negativeMarking ? `
            <div style="margin-top: var(--space-6);">
              <table class="rp-breakdown-table">
                <tbody>
                  <tr>
                    <td><span class="rp-dot green"></span>Correct Answers</td>
                    <td>${result.correct} × +${result.marksPerQuestion || 1}</td>
                    <td style="color: var(--success);">+${result.positiveScore || (result.correct * (result.marksPerQuestion || 1))}</td>
                  </tr>
                  <tr>
                    <td><span class="rp-dot red"></span>Negative Deductions</td>
                    <td>${result.wrong} × -${result.negativeValue}</td>
                    <td style="color: var(--danger);">-${result.negativeDeduction || (result.wrong * result.negativeValue).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td><span class="rp-dot gray"></span>Skipped / Unattempted</td>
                    <td>${result.skipped} × 0</td>
                    <td>0.00</td>
                  </tr>
                  <tr class="total-row">
                    <td><span class="rp-dot blue"></span>Final Score Earned</td>
                    <td>Accuracy: ${result.accuracy}%</td>
                    <td>${result.totalMarks} / ${result.maxMarks}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ` : ''}
        </div>

        <!-- Gamification Rewards (rival-battle only) -->
        ${(result._isRivalBattle || window._currentTestMode === 'rival-battle') ? this._renderRewardsSummary(result) : ''}

        <!-- Progress Psychology -->
        ${this._renderProgressSection(result)}

        <!-- Daily Goals -->
        ${this._renderDailyGoals(result)}

        <!-- Badges -->
        ${this._renderBadges()}

        <!-- Cognitive & Analytics Metrics Grid -->
        <div class="rp-card animate-fadeInUp stagger-2">
          <div class="rp-card-header">
            <div class="rp-card-icon orange">${Icons.get('brain', 18)}</div>
            <div>
              <h3 class="rp-card-title">Cognitive & Exam Insights</h3>
              <div class="rp-card-subtitle">AI-derived cognitive focus, pace, and mistake analysis</div>
            </div>
          </div>

          <div class="rp-metrics-grid">
            <!-- Attempt Rate -->
            <div class="rp-metric">
              <div class="rp-metric-icon" style="background: rgba(79,110,247,0.12); color: var(--primary-light);">
                ${Icons.get('target', 18)}
              </div>
              <div class="rp-metric-body">
                <div class="rp-metric-label">Attempt Coverage</div>
                <div class="rp-metric-value">${insights.attemptRate}%</div>
                <div class="rp-verdict ${insights.attemptVerdict.cls}">${insights.attemptVerdict.text}</div>
              </div>
            </div>

            <!-- Avg Speed -->
            <div class="rp-metric">
              <div class="rp-metric-icon" style="background: rgba(6,182,212,0.12); color: var(--info);">
                ${Icons.get('zap', 18)}
              </div>
              <div class="rp-metric-body">
                <div class="rp-metric-label">Average Pace</div>
                <div class="rp-metric-value">${insights.avgSpeed}s <span class="rp-metric-sub">/ question</span></div>
                <div class="rp-verdict ${insights.speedVerdict.cls}">${insights.speedVerdict.text}</div>
              </div>
            </div>

            <!-- Time Wasted -->
            <div class="rp-metric">
              <div class="rp-metric-icon" style="background: rgba(245,158,11,0.12); color: var(--warning);">
                ${Icons.get('clock', 18)}
              </div>
              <div class="rp-metric-body">
                <div class="rp-metric-label">Time Wasted</div>
                <div class="rp-metric-value">${insights.timeWasted}</div>
                <div class="rp-verdict ${insights.timeWasteVerdict.cls}">${insights.timeWasteVerdict.text}</div>
              </div>
            </div>

            <!-- Easy Mistakes -->
            <div class="rp-metric">
              <div class="rp-metric-icon" style="background: rgba(239,68,68,0.12); color: var(--danger);">
                ${Icons.get('alertTriangle', 18)}
              </div>
              <div class="rp-metric-body">
                <div class="rp-metric-label">Careless Errors</div>
                <div class="rp-metric-value">${insights.easyMistakes} <span class="rp-metric-sub">questions</span></div>
                <div class="rp-verdict ${insights.easyMistakeVerdict.cls}">${insights.easyMistakeVerdict.text}</div>
              </div>
            </div>

            <!-- Focus/Fatigue Factor -->
            <div class="rp-metric">
              <div class="rp-metric-icon" style="background: rgba(139,92,246,0.12); color: var(--secondary-light);">
                ${Icons.get('activity', 18)}
              </div>
              <div class="rp-metric-body">
                <div class="rp-metric-label">Cognitive Fatigue</div>
                <div class="rp-metric-value">${insights.fatigueValue}</div>
                <div class="rp-verdict ${insights.fatigueVerdict.cls}">${insights.fatigueVerdict.text}</div>
              </div>
            </div>

            <!-- Projected Exam Readiness -->
            <div class="rp-metric">
              <div class="rp-metric-icon" style="background: rgba(16,185,129,0.12); color: var(--success);">
                ${Icons.get('award', 18)}
              </div>
              <div class="rp-metric-body">
                <div class="rp-metric-label">Exam Readiness</div>
                <div class="rp-metric-value">${insights.readinessScore}%</div>
                <div class="rp-verdict ${insights.readinessVerdict.cls}">${insights.readinessVerdict.text}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Speed vs. Accuracy Quadrant Scatter Plot -->
        <div class="rp-card animate-fadeInUp stagger-2">
          <div class="rp-card-header">
            <div class="rp-card-icon blue">${Icons.get('layoutGrid', 18)}</div>
            <div>
              <h3 class="rp-card-title">Speed vs. Accuracy Scatter Matrix</h3>
              <div class="rp-card-subtitle">Visual quadrant of question pacing & correct/wrong status (Click points to review)</div>
            </div>
          </div>

          <div class="rp-scatter-legend">
            <div class="rp-slegend-item"><span class="rp-sdot green"></span>Correct</div>
            <div class="rp-slegend-item"><span class="rp-sdot red"></span>Incorrect</div>
            <div class="rp-slegend-item"><span class="rp-sdot gray"></span>Skipped</div>
          </div>

          <div class="rp-scatter-wrapper">
            <!-- Labels -->
            <div class="rp-quad-label top-left">SWEET SPOT<br><span>(Quick & Correct)</span></div>
            <div class="rp-quad-label top-right">HIGH MASTERY<br><span>(Slow & Correct)</span></div>
            <div class="rp-quad-label bottom-left">CARELESS ZONE<br><span>(Quick & Wrong)</span></div>
            <div class="rp-quad-label bottom-right">STRUGGLE ZONE<br><span>(Slow & Wrong)</span></div>

            <!-- SVG Grid & Points -->
            <svg viewBox="0 0 500 300" class="rp-scatter-svg">
              <!-- Grid Quadrant Dividers -->
              <line x1="250" y1="0" x2="250" y2="300" stroke="rgba(255,255,255,0.1)" stroke-dasharray="4 4" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.1)" stroke-dasharray="4 4" />

              <!-- X and Y axis arrows/ticks -->
              <text x="10" y="290" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)">Pace: Fast (0s)</text>
              <text x="400" y="290" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)">Slow (120s+)</text>

              <!-- Plot Points -->
              ${(result.questionResults || []).map((q, idx) => {
                const t = q.timeSpent || 0;
                // X coordinate maps 0s - 120s to 10 - 490 px
                const x = 15 + Math.min(470, Math.round((t / 120) * 470));
                
                // Y coordinate maps correctness & difficulty to 15 - 285 px
                let y = 150;
                if (q.isCorrect) {
                  // Correct answers are in the top half (0 to 140px)
                  y = q.question?.difficulty === 'hard' ? 30 : q.question?.difficulty === 'medium' ? 70 : 110;
                } else if (q.isSkipped) {
                  // Skipped are exactly on the middle horizontal line
                  y = 150;
                } else {
                  // Incorrect answers are in bottom half (160 to 270px)
                  y = q.question?.difficulty === 'easy' ? 190 : q.question?.difficulty === 'medium' ? 230 : 270;
                }
                
                // Jitter slightly to prevent exact overlaps
                const jitterX = (idx % 3 - 1) * 6;
                const jitterY = (idx % 2 - 0.5) * 8;
                
                const finalX = x + jitterX;
                const finalY = y + jitterY;
                
                const statusClass = q.isCorrect ? 'correct' : q.isSkipped ? 'skipped' : 'wrong';
                const statusColor = q.isCorrect ? 'var(--success)' : q.isSkipped ? '#a0a0a0' : 'var(--danger)';
                
                return `
                  <circle class="scatter-dot ${statusClass}" 
                          cx="${finalX}" 
                          cy="${finalY}" 
                          r="6" 
                          fill="${statusColor}"
                          data-index="${idx}"
                          style="animation-delay: ${idx * 40}ms;"
                          onclick="ResultPage.selectScatterQuestion(${idx})">
                    <title>Q${idx + 1}: ${t}s | ${q.question?.subject || ''} | ${statusClass.toUpperCase()}</title>
                  </circle>
                `;
              }).join('')}
            </svg>
          </div>

          <!-- Dynamic Scatter Detail Pane -->
          <div class="rp-scatter-detail-box" id="rp-scatter-detail-box" style="display: none;">
            <div class="rp-scatter-detail-placeholder">
              ${Icons.get('info', 16)} Click any question dot in the scatter matrix above to load real-time detailed performance insights.
            </div>
          </div>
        </div>

        <!-- Competitor Benchmarking -->
        <div class="rp-card animate-fadeInUp stagger-3">
          <div class="rp-card-header">
            <div class="rp-card-icon purple">${Icons.get('users', 18)}</div>
            <div>
              <h3 class="rp-card-title">Peer Benchmarking</h3>
              <div class="rp-card-subtitle">Comparison against Board Topper and average candidates</div>
            </div>
          </div>

          <div class="rp-benchmark-content">
            <!-- Score comparison bar -->
            <div class="rp-bench-row">
              <div class="rp-bench-meta">
                <span class="rp-bench-title">Mock Test Score</span>
                <span class="rp-bench-you font-mono">${result.totalMarks}/${result.maxMarks}</span>
              </div>
              <div class="rp-bench-tracks">
                <div class="rp-bench-bar topper" style="width: 94%;" title="Topper: 94%">
                  <span class="label">Topper</span>
                  <span class="val font-mono">${Math.round(result.maxMarks * 0.94)}</span>
                </div>
                <div class="rp-bench-bar you" style="width: ${benchmarks.youScorePct}%;" title="You: ${benchmarks.youScorePct}%">
                  <span class="label">You</span>
                  <span class="val font-mono">${result.totalMarks}</span>
                </div>
                <div class="rp-bench-bar avg" style="width: 62%;" title="Average: 62%">
                  <span class="label">Avg Candidate</span>
                  <span class="val font-mono">${Math.round(result.maxMarks * 0.62)}</span>
                </div>
              </div>
            </div>

            <!-- Accuracy comparison bar -->
            <div class="rp-bench-row">
              <div class="rp-bench-meta">
                <span class="rp-bench-title">Accuracy Rate</span>
                <span class="rp-bench-you font-mono" style="color: var(--success);">${result.accuracy}%</span>
              </div>
              <div class="rp-bench-tracks">
                <div class="rp-bench-bar topper" style="width: 96%;" title="Topper: 96% Accuracy">
                  <span class="label">Topper</span>
                  <span class="val font-mono">96%</span>
                </div>
                <div class="rp-bench-bar you" style="width: ${result.accuracy}%;" title="You: ${result.accuracy}% Accuracy">
                  <span class="label">You</span>
                  <span class="val font-mono">${result.accuracy}%</span>
                </div>
                <div class="rp-bench-bar avg" style="width: 70%;" title="Average: 70% Accuracy">
                  <span class="label">Avg Candidate</span>
                  <span class="val font-mono">70%</span>
                </div>
              </div>
            </div>

            <!-- Speed pace comparison bar -->
            <div class="rp-bench-row">
              <div class="rp-bench-meta">
                <span class="rp-bench-title">Pacing Speed (Average per Question)</span>
                <span class="rp-bench-you font-mono" style="color: var(--info);">${insights.avgSpeed}s</span>
              </div>
              <div class="rp-bench-tracks">
                <!-- Topper: smaller duration is better (wider bar representation = higher efficiency) -->
                <div class="rp-bench-bar topper" style="width: ${benchmarks.topperSpeedPct}%;" title="Topper: 22s/q">
                  <span class="label">Topper</span>
                  <span class="val font-mono">22s</span>
                </div>
                <div class="rp-bench-bar you" style="width: ${benchmarks.youSpeedPct}%;" title="You: ${insights.avgSpeed}s/q">
                  <span class="label">You</span>
                  <span class="val font-mono">${insights.avgSpeed}s</span>
                </div>
                <div class="rp-bench-bar avg" style="width: ${benchmarks.avgSpeedPct}%;" title="Average: 48s/q">
                  <span class="label">Avg Candidate</span>
                  <span class="val font-mono">48s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SWOT Analysis Dashboard -->
        <div class="rp-card animate-fadeInUp stagger-3">
          <div class="rp-card-header">
            <div class="rp-card-icon green">${Icons.get('activity', 18)}</div>
            <div>
              <h3 class="rp-card-title">SWOT Assessment</h3>
              <div class="rp-card-subtitle">AI-derived evaluation of your mock performance dynamics</div>
            </div>
          </div>

          <div class="rp-swot-grid">
            <div class="rp-swot-card strength">
              <div class="rp-swot-header">
                <span class="rp-swot-badge">S</span>
                <h4>Strengths</h4>
              </div>
              <div class="rp-swot-body">
                <ul class="rp-swot-list">
                  ${swot.strengths.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div class="rp-swot-card weakness">
              <div class="rp-swot-header">
                <span class="rp-swot-badge">W</span>
                <h4>Weaknesses</h4>
              </div>
              <div class="rp-swot-body">
                <ul class="rp-swot-list">
                  ${swot.weaknesses.map(w => `<li>${w}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div class="rp-swot-card opportunity">
              <div class="rp-swot-header">
                <span class="rp-swot-badge">O</span>
                <h4>Opportunities</h4>
              </div>
              <div class="rp-swot-body">
                <ul class="rp-swot-list">
                  ${swot.opportunities.map(o => `<li>${o}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div class="rp-swot-card threat">
              <div class="rp-swot-header">
                <span class="rp-swot-badge">T</span>
                <h4>Threats</h4>
              </div>
              <div class="rp-swot-body">
                <ul class="rp-swot-list">
                  ${swot.threats.map(t => `<li>${t}</li>`).join('')}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Mistake Book Playlist Creator -->
        <div class="rp-card mistake-book-result-card animate-fadeInUp stagger-3" style="border: 1px solid rgba(239, 68, 68, 0.15); background: linear-gradient(135deg, rgba(239, 68, 68, 0.03) 0%, rgba(0, 0, 0, 0) 100%);">
          <div class="rp-card-header">
            <div class="rp-card-icon red">${Icons.get('bookMarked', 18)}</div>
            <div>
              <h3 class="rp-card-title">Mistake Book Playlist Creator</h3>
              <div class="rp-card-subtitle">Automatically extract incorrect & skipped questions for targeted revision</div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--space-4);">
            <p style="margin: 0; font-size: var(--text-sm); color: var(--text-secondary); line-height: var(--leading-relaxed);">
              You have <strong>${result.wrong + result.skipped}</strong> incorrect or skipped questions in this mock test. Add them to your local <strong>Mistake Book</strong> to generate customized revision tests and strengthen your weak areas.
            </p>
            <div style="display: flex; gap: var(--space-3); flex-wrap: wrap;">
              <button class="btn btn-secondary btn-sm" onclick="ResultPage.saveAllMistakes()" id="save-mistakes-btn" style="border-color: rgba(239, 68, 68, 0.25); color: #f87171; background: rgba(239, 68, 68, 0.05); font-weight: var(--font-medium); height: 36px; display: inline-flex; align-items: center; gap: 8px;">
                ${Icons.get('plusCircle', 14)} Add Mistakes to Revision Playlist
              </button>
              
              <!-- Premium Drill / Export Actions -->
              <button class="btn btn-primary btn-sm" onclick="ResultPage.startMistakeDrill()" style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25); color: var(--secondary-light); font-weight: var(--font-medium); height: 36px; display: inline-flex; align-items: center; gap: 8px;">
                ${Icons.get('play', 14)} Start Revision Drill Now
              </button>

              <button class="btn btn-ghost btn-sm" onclick="ResultPage.exportMistakesCSV()" style="height: 36px; font-size: var(--text-xs); color: var(--text-muted);">
                ${Icons.get('download', 12)} Export CSV
              </button>
            </div>
          </div>
        </div>

        <!-- Subject Performance & Graphs -->
        ${subjectEntries.length > 0 ? `
        <div class="rp-card animate-fadeInUp stagger-3">
          <div class="rp-card-header">
            <div class="rp-card-icon purple">${Icons.get('barChart', 18)}</div>
            <div>
              <h3 class="rp-card-title">Subject Accuracy Breakdown</h3>
              <div class="rp-card-subtitle">Visual accuracy levels and subject details</div>
            </div>
          </div>

          <!-- CSS Bar Columns Chart -->
          <div class="rp-bar-chart" style="margin-bottom: var(--space-8);">
            ${subjectEntries.map(([subject, data]) => {
              const subjectAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              const barColor = subjectAcc >= 70 ? 'var(--success)' : subjectAcc >= 40 ? 'var(--warning)' : 'var(--danger)';
              return `
                <div class="rp-bar-col">
                  <span class="rp-bar-value">${subjectAcc}%</span>
                  <div class="rp-bar-track">
                    <div class="rp-bar-fill" style="height: 0%; background: ${barColor};" data-target="${subjectAcc}"></div>
                  </div>
                  <span class="rp-bar-label" title="${subject}">${subject}</span>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Subject list with horizontal growth tracks -->
          <div class="rp-subj-list">
            ${subjectEntries.map(([subject, data]) => {
              const subjectAcc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              const barColor = subjectAcc >= 70 ? 'var(--success)' : subjectAcc >= 40 ? 'var(--warning)' : 'var(--danger)';
              return `
                <div class="rp-subj-row">
                  <div class="rp-subj-icon">${Helpers.getSubjectIcon(subject)}</div>
                  <div class="rp-subj-name" title="${subject}">${subject}</div>
                  <div class="rp-subj-bar-track">
                    <div class="rp-subj-bar-fill" style="width: 0%; background: ${barColor};" data-target="${subjectAcc}"></div>
                  </div>
                  <div class="rp-subj-pct" style="color: ${barColor};">${subjectAcc}%</div>
                  <div class="rp-subj-ratio">(${data.correct}/${data.total})</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Response Time Distribution Timeline -->
        <div class="rp-card animate-fadeInUp stagger-4">
          <div class="rp-card-header">
            <div class="rp-card-icon blue">${Icons.get('clock', 18)}</div>
            <div>
              <h3 class="rp-card-title">Response Time Timeline</h3>
              <div class="rp-card-subtitle">Seconds spent per question (click bars to review in analysis)</div>
            </div>
          </div>

          <div class="rp-time-dist">
            ${(result.questionResults || []).map((q, idx) => {
              const timeSpent = q.timeSpent || 0;
              const maxTime = Math.max(...(result.questionResults || []).map(item => item.timeSpent || 0), 10);
              const heightPct = Math.min(100, Math.round((timeSpent / maxTime) * 100));
              const statusClass = q.isCorrect ? 'correct' : q.isSkipped ? 'skipped' : 'wrong';
              const tooltipText = `Q${idx + 1}: ${timeSpent}s (${q.isCorrect ? 'Correct' : q.isSkipped ? 'Skipped' : 'Incorrect'}) - ${q.question?.subject || ''}`;
              return `
                <div class="rp-time-bar ${statusClass}"
                     style="height: 0px;"
                     data-target="${heightPct}%"
                     title="${tooltipText}"
                     onclick="ResultPage.selectScatterQuestion(${idx});">
                </div>
              `;
            }).join('')}
          </div>

          <div class="rp-time-legend">
            <div class="rp-time-legend-item">
              <div class="rp-time-legend-dot" style="background: var(--success);"></div>
              <span>Correct</span>
            </div>
            <div class="rp-time-legend-item">
              <div class="rp-time-legend-dot" style="background: var(--danger);"></div>
              <span>Incorrect</span>
            </div>
            <div class="rp-time-legend-item">
              <div class="rp-time-legend-dot" style="background: rgba(255,255,255,0.15);"></div>
              <span>Skipped</span>
            </div>
          </div>
        </div>

        <!-- Strong/Weak Performance Margins -->
        ${subjectEntries.length > 0 ? `
        <div class="rp-card animate-fadeInUp stagger-4">
          <div class="rp-card-header">
            <div class="rp-card-icon green">${Icons.get('trendingUp', 18)}</div>
            <div>
              <h3 class="rp-card-title">Performance Margins</h3>
              <div class="rp-card-subtitle">Strongest and weakest subject areas</div>
            </div>
          </div>
          <div class="rp-areas-grid">
            ${strongArea ? `
            <div class="rp-area-box strong">
              <div class="rp-area-label">${Icons.get('checkCircle', 12)} Strongest Area</div>
              <div class="rp-area-name">${strongArea.name}</div>
              <div class="rp-area-pct">${strongArea.acc}%</div>
            </div>
            ` : ''}
            ${weakArea && weakArea.name !== (strongArea && strongArea.name) ? `
            <div class="rp-area-box weak">
              <div class="rp-area-label">${Icons.get('alertTriangle', 12)} Weakest Area</div>
              <div class="rp-area-name">${weakArea.name}</div>
              <div class="rp-area-pct">${weakArea.acc}%</div>
            </div>
            ` : ''}
          </div>
        </div>
        ` : ''}

        <!-- Actionable Smart Advice -->
        <div class="rp-card animate-fadeInUp stagger-5">
          <div class="rp-card-header">
            <div class="rp-card-icon cyan">${Icons.get('lightbulb', 18)}</div>
            <div>
              <h3 class="rp-card-title">Actionable Recommendations</h3>
              <div class="rp-card-subtitle">Custom guidelines for next steps</div>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: var(--space-4);">
            ${insights.recommendations.map(rec => `
              <div style="display: flex; gap: var(--space-3); background: rgba(255,255,255,0.01); border: 1px solid var(--border-light); padding: var(--space-4); border-radius: var(--radius-md); border-left: 3px solid ${rec.color};">
                <div style="color: ${rec.color}; margin-top: 2px;">${Icons.get(rec.icon, 18)}</div>
                <div>
                  <div style="font-weight: var(--font-semibold); font-size: var(--text-sm); color: var(--text-primary); margin-bottom: 2px;">${rec.title}</div>
                  <div style="font-size: var(--text-xs); color: var(--text-secondary); line-height: 1.4;">${rec.text}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Detailed Questions Review Table -->
        <div class="rp-card animate-fadeInUp stagger-6">
          <div class="rp-card-header">
            <div class="rp-card-icon blue">${Icons.get('listChecks', 18)}</div>
            <div>
              <h3 class="rp-card-title">Question Response Breakdown</h3>
              <div class="rp-card-subtitle">Click rows to review answers or solutions</div>
            </div>
          </div>
          <div style="max-height: 350px; overflow-y: auto; border: 1px solid var(--border-light); border-radius: var(--radius-lg); background: var(--bg-glass);">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="border-bottom: 1px solid var(--border-light); background: rgba(255,255,255,0.02);">
                  <th style="padding: var(--space-3) var(--space-4); font-size: var(--text-xs); color: var(--text-muted); font-weight: var(--font-semibold);">Q#</th>
                  <th style="padding: var(--space-3) var(--space-4); font-size: var(--text-xs); color: var(--text-muted); font-weight: var(--font-semibold);">Subject & Topic</th>
                  <th style="padding: var(--space-3) var(--space-4); font-size: var(--text-xs); color: var(--text-muted); font-weight: var(--font-semibold);">Status</th>
                  <th style="padding: var(--space-3) var(--space-4); font-size: var(--text-xs); color: var(--text-muted); font-weight: var(--font-semibold); text-align: right;">Time Spent</th>
                </tr>
              </thead>
              <tbody>
                ${(result.questionResults || []).map((q, idx) => {
                  const statusColor = q.isCorrect ? 'var(--success)' : q.isSkipped ? 'var(--text-muted)' : 'var(--danger)';
                  const statusLabel = q.isCorrect ? 'Correct' : q.isSkipped ? 'Skipped' : 'Incorrect';
                  return `
                    <tr style="border-bottom: 1px solid var(--border-light); transition: background var(--transition-fast); cursor: pointer;"
                        onclick="ResultPage.selectScatterQuestion(${idx});"
                        onmouseover="this.style.background='rgba(255,255,255,0.01)'"
                        onmouseout="this.style.background='transparent'">
                      <td style="padding: var(--space-3) var(--space-4); font-size: var(--text-sm); font-family: var(--font-mono); font-weight: var(--font-medium);">${idx + 1}</td>
                      <td style="padding: var(--space-3) var(--space-4); font-size: var(--text-sm);">
                        <div style="font-weight: var(--font-medium); color: var(--text-primary);">${q.question?.subject || 'Subject'}</div>
                        <div style="font-size: var(--text-xs); color: var(--text-muted); margin-top: 2px;">${q.question?.topic || 'General Topic'}</div>
                      </td>
                      <td style="padding: var(--space-3) var(--space-4); font-size: var(--text-xs);">
                        <span class="chip" style="background: rgba(255,255,255,0.01); border: 1px solid ${statusColor}; color: ${statusColor};">${statusLabel}</span>
                      </td>
                      <td style="padding: var(--space-3) var(--space-4); font-size: var(--text-sm); font-family: var(--font-mono); text-align: right; font-weight: var(--font-medium);">${q.timeSpent || 0}s</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- View Analysis Button -->
        <div class="result-analysis-btn animate-fadeInUp stagger-6" style="margin-top: var(--space-6);">
          <button class="btn btn-secondary btn-lg btn-block" onclick="App.navigate('analysis')">
            ${Icons.get('eye', 16)} ${Lang.t('result_analysis')}
          </button>
        </div>

        <!-- Actions -->
        <div class="rp-actions animate-fadeInUp stagger-7">
          <div class="rp-actions-row">
            <button class="btn btn-secondary btn-lg" onclick="ResultPage.retrySameTest()" id="retry-same-btn">
              ${Icons.get('refresh', 16)} ${Lang.t('result_retry')}
            </button>
            <button class="btn btn-primary btn-lg" onclick="App.navigate('setup')" id="retry-new-btn">
              ${Icons.get('play', 16)} ${Lang.t('result_new')}
            </button>
          </div>
          <button class="btn btn-ghost" onclick="App.navigate('home')">
            ${Icons.get('home', 16)} ${Lang.t('result_home')}
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
    if (avgSpeed <= 30) speedVerdict = { text: 'Outstanding pace', cls: 'good' };
    else if (avgSpeed <= 60) speedVerdict = { text: 'Optimal pace', cls: 'good' };
    else if (avgSpeed <= 90) speedVerdict = { text: 'Slightly slow', cls: 'ok' };
    else speedVerdict = { text: 'Critically slow', cls: 'bad' };

    // Attempt rate
    const attempted = total - result.skipped;
    const attemptRate = total > 0 ? Math.round((attempted / total) * 100) : 0;
    let attemptVerdict;
    if (attemptRate >= 90) attemptVerdict = { text: 'High attempt coverage', cls: 'good' };
    else if (attemptRate >= 70) attemptVerdict = { text: 'Balanced coverage', cls: 'good' };
    else attemptVerdict = { text: 'Low attempt coverage', cls: 'bad' };

    // Time wasted on wrong answers
    const wrongQuestions = qr.filter(q => !q.isCorrect && !q.isSkipped);
    const timeOnWrong = wrongQuestions.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
    const timeWasted = Helpers.formatDuration(timeOnWrong);
    let timeWasteVerdict;
    const wasteRatio = totalTimeSpent > 0 ? timeOnWrong / totalTimeSpent : 0;
    if (wasteRatio <= 0.2) timeWasteVerdict = { text: 'Highly efficient', cls: 'good' };
    else if (wasteRatio <= 0.4) timeWasteVerdict = { text: 'Moderate wastage', cls: 'ok' };
    else timeWasteVerdict = { text: 'Excessive wastage', cls: 'bad' };

    // Easy mistakes (wrong but spent < 30s)
    const easyMistakes = wrongQuestions.filter(q => (q.timeSpent || 0) < 30).length;
    let easyMistakeVerdict;
    if (easyMistakes === 0) easyMistakeVerdict = { text: 'Perfect accuracy focus', cls: 'good' };
    else if (easyMistakes <= 3) easyMistakeVerdict = { text: 'Minor careless errors', cls: 'ok' };
    else easyMistakeVerdict = { text: 'High carelessness', cls: 'bad' };

    // Cognitive Fatigue Factor
    const half = Math.ceil(total / 2);
    const firstHalf = qr.slice(0, half);
    const secondHalf = qr.slice(half);
    const acc1 = firstHalf.length > 0 ? (firstHalf.filter(q => q.isCorrect).length / firstHalf.length) * 100 : 0;
    const acc2 = secondHalf.length > 0 ? (secondHalf.filter(q => q.isCorrect).length / secondHalf.length) * 100 : 0;
    const fatigueVal = acc1 > acc2 ? Math.round(acc1 - acc2) : 0;
    
    let fatigueValue = `${fatigueVal}%`;
    let fatigueVerdict;
    if (fatigueVal <= 5) {
      fatigueVerdict = { text: 'High focus stability', cls: 'good' };
      fatigueValue = 'Minimal';
    } else if (fatigueVal <= 15) {
      fatigueVerdict = { text: 'Mild performance drop', cls: 'ok' };
    } else {
      fatigueVerdict = { text: 'High cognitive fatigue', cls: 'bad' };
    }

    // Exam Readiness Score
    const readinessScore = Math.max(10, Math.min(100, Math.round(
      (result.accuracy * 0.7) +
      (attemptRate * 0.15) +
      (Math.max(0, 100 - avgSpeed) * 0.15)
    )));
    let readinessVerdict;
    if (readinessScore >= 80) readinessVerdict = { text: 'Board ready!', cls: 'good' };
    else if (readinessScore >= 60) readinessVerdict = { text: 'Good progress', cls: 'ok' };
    else readinessVerdict = { text: 'Needs revision', cls: 'bad' };

    // Actionable Recommendations
    const recommendations = [];
    
    // Rec 1: Topic focus
    const weakTopics = (result.weakTopics || []).slice(0, 5);
    if (weakTopics.length > 0) {
      const topWeak = weakTopics[0];
      const topicDisplayName = topWeak.topic && topWeak.topic !== 'undefined' ? topWeak.topic : 'General';
      const subjectDisplayName = topWeak.subject || 'Subject';
      recommendations.push({
        title: `Prioritize ${topicDisplayName}`,
        text: `You scored ${topWeak.accuracy}% accuracy in this topic. Study the core concepts of ${topicDisplayName} (${subjectDisplayName}) before your next mock.`,
        icon: 'bookMarked',
        color: 'var(--danger)'
      });
    } else {
      recommendations.push({
        title: 'Concept reinforcement',
        text: 'Review the theoretical concepts of your weakest subject topics to keep a solid foundation.',
        icon: 'bookMarked',
        color: 'var(--primary)'
      });
    }

    // Rec 2: Speed / Time recommendation
    if (avgSpeed > 60) {
      recommendations.push({
        title: 'Time Management Strategy',
        text: `You spent an average of ${avgSpeed}s per question. Try using a strict skip strategy (max 45s per question) to cover the paper faster.`,
        icon: 'timer',
        color: 'var(--warning)'
      });
    } else if (easyMistakes > 2) {
      recommendations.push({
        title: 'Reduce Careless Errors',
        text: `You made ${easyMistakes} errors on questions where you spent under 30s. Double-check your calculations before choosing an answer.`,
        icon: 'alertTriangle',
        color: 'var(--warning)'
      });
    } else {
      recommendations.push({
        title: 'Pace Maintenance',
        text: 'Your current pace is excellent. Continue simulating tests under tight time conditions to build stamina.',
        icon: 'zap',
        color: 'var(--success)'
      });
    }

    // Rec 3: General advice based on fatigue
    if (fatigueVal > 10) {
      recommendations.push({
        title: 'Manage Focus Fatigue',
        text: `Your accuracy dropped by ${fatigueVal}% in the second half of the test. Practice deep-breathing cycles for 20 seconds during the exam.`,
        icon: 'activity',
        color: 'var(--info)'
      });
    } else {
      recommendations.push({
        title: 'Simulated Exam Stamina',
        text: 'Stamina is solid. Try taking back-to-back mini-tests to stretch your cognitive endurance.',
        icon: 'crown',
        color: 'var(--secondary-light)'
      });
    }

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
      fatigueValue,
      fatigueRaw: fatigueVal,
      fatigueVerdict,
      readinessScore,
      readinessVerdict,
      recommendations
    };
  },

  // === SWOT CALCULATOR ===
  _calculateSWOT(result, insights, subjectEntries) {
    const qr = result.questionResults || [];
    const strengths = [];
    const weaknesses = [];
    const opportunities = [];
    const threats = [];

    // 1. Strengths
    if (subjectEntries.length > 0) {
      const strongSubjects = subjectEntries
        .map(([name, data]) => ({ name, acc: data.total > 0 ? (data.correct / data.total) * 100 : 0 }))
        .filter(s => s.acc >= 75);
      
      if (strongSubjects.length > 0) {
        strongSubjects.forEach(s => {
          strengths.push(`Excellent mastery in <strong>${s.name}</strong> with ${Math.round(s.acc)}% accuracy.`);
        });
      } else {
        strengths.push("Establish strength by achieving &gt;75% accuracy in any subject.");
      }
    } else {
      strengths.push("No subject data available.");
    }
    
    // Streak/Accuracy bonus strength
    if (result.accuracy >= 80) {
      strengths.push("Elite-level overall accuracy: solid understanding of exam syllabus.");
    }
    if (insights.easyMistakes === 0) {
      strengths.push("Zero careless errors: highly precise option selection.");
    }

    // 2. Weaknesses
    if (subjectEntries.length > 0) {
      const weakSubjects = subjectEntries
        .map(([name, data]) => ({ name, acc: data.total > 0 ? (data.correct / data.total) * 100 : 0 }))
        .filter(s => s.acc < 50);
      
      if (weakSubjects.length > 0) {
        weakSubjects.forEach(s => {
          weaknesses.push(`Low performance in <strong>${s.name}</strong> (${Math.round(s.acc)}% accuracy). Re-study basics.`);
        });
      }
    }
    if (insights.easyMistakes > 2) {
      weaknesses.push(`Made ${insights.easyMistakes} careless mistakes on easy questions (spent &lt;30s).`);
    }
    if (insights.fatigueRaw > 12) {
      weaknesses.push(`Pacing fatigue drop identified in the second half of the exam.`);
    }
    if (weaknesses.length === 0) {
      weaknesses.push("No significant conceptual blind spots detected! Excellent.");
    }

    // 3. Opportunities
    // Easy / Medium questions that were skipped or wrong
    const missedEasyMedium = qr.filter(q => !q.isCorrect && (q.question?.difficulty === 'easy' || q.question?.difficulty === 'medium'));
    if (missedEasyMedium.length > 0) {
      opportunities.push(`Retrieve <strong>${missedEasyMedium.length} easy/medium marks</strong> by checking calculation errors.`);
    }
    // High accuracy topics that were skipped
    const skippedCount = result.skipped || 0;
    if (skippedCount > 0) {
      opportunities.push(`Convert <strong>${skippedCount} skipped items</strong> into marks through faster question triage.`);
    }
    opportunities.push("Improve mock pacing by practicing with 45-second timer boundaries.");

    // 4. Threats (Time Traps)
    // Questions where spent > 80s but got incorrect or skipped
    const timeTraps = qr.filter(q => !q.isCorrect && q.timeSpent > 80);
    if (timeTraps.length > 0) {
      threats.push(`<strong>${timeTraps.length} Time Traps</strong> triggered! Spent &gt;80s on questions and lost marks anyway.`);
    } else {
      threats.push("Well balanced time management: no major time-trap triggers.");
    }
    if (insights.avgSpeed > 75) {
      threats.push("Critical danger of running out of time on the final exam (average speed too slow).");
    }

    return { strengths, weaknesses, opportunities, threats };
  },

  // === BENCHMARK CALCULATOR ===
  _calculateBenchmarks(result, insights) {
    const youScorePct = Math.round((result.totalMarks / result.maxMarks) * 100);
    
    // Speed representation: Topper is 22s (mapped to 90% wide bar), Avg is 48s (mapped to 60% wide bar)
    // We map a range of 10s (100% width) to 120s (10% width)
    const getSpeedWidth = (s) => Math.max(10, Math.min(100, Math.round(100 - ((s - 10) / 110) * 90)));
    
    const topperSpeedPct = getSpeedWidth(22);
    const avgSpeedPct = getSpeedWidth(48);
    const youSpeedPct = getSpeedWidth(insights.avgSpeed);

    return {
      youScorePct,
      topperSpeedPct,
      avgSpeedPct,
      youSpeedPct
    };
  },

  // === SELECTION FOR SCATTER PLOT ===
  selectScatterQuestion(idx) {
    const result = App.lastResult;
    if (!result || !result.questionResults) return;
    const qRes = result.questionResults[idx];
    if (!qRes) return;
    
    // Highlight selected dot
    document.querySelectorAll('.scatter-dot').forEach(el => el.classList.remove('selected'));
    const selectedDot = document.querySelector(`.scatter-dot[data-index="${idx}"]`);
    if (selectedDot) selectedDot.classList.add('selected');
    
    const q = qRes.question;
    if (!q) {
      // No question data attached to this result entry
      const box = document.getElementById('rp-scatter-detail-box');
      if (box) {
        box.innerHTML = `<div class="rp-scatter-detail-placeholder">${Icons.get('info', 16)} Question data unavailable for Q${idx + 1}.</div>`;
        box.style.display = 'block';
      }
      return;
    }
    
    const statusLabel = qRes.isCorrect ? 'Correct' : qRes.isSkipped ? 'Skipped' : 'Incorrect';
    const chipClass = qRes.isCorrect ? 'chip-success' : qRes.isSkipped ? 'chip-primary' : 'chip-danger';
    const explanationText = q.explanation || 'No explanation available for this question.';
    const diffColor = (q.difficulty || 'medium') === 'easy' ? 'var(--success)' : (q.difficulty || 'medium') === 'hard' ? 'var(--danger)' : 'var(--warning)';
    const options = q.options || [];
    
    const box = document.getElementById('rp-scatter-detail-box');
    if (!box) return;
    
    box.innerHTML = `
      <div class="rp-sdetail-header">
        <div class="rp-sdetail-title-row">
          <span class="rp-sdetail-qnum">Question #${idx + 1}</span>
          <span class="chip ${chipClass}">${statusLabel}</span>
        </div>
        <div class="rp-sdetail-meta">
          <span>Subject: <strong>${q.subject || 'N/A'}</strong></span>
          <span>Topic: <strong>${q.topic || 'General'}</strong></span>
          <span>Difficulty: <strong style="color: ${diffColor}">${q.difficulty || 'medium'}</strong></span>
        </div>
      </div>
      <div class="rp-sdetail-body">
        <div class="rp-sdetail-question">${q.question || ''}</div>
        <div class="rp-sdetail-options">
          ${options.map((opt, i) => {
            const letter = ['A', 'B', 'C', 'D'][i];
            const isCorrectOpt = i === q.correct;
            const isSelectedOpt = qRes.userAnswer === i;
            let optClass = '';
            if (isCorrectOpt) optClass = 'correct';
            else if (isSelectedOpt) optClass = 'wrong';
            return `
              <div class="rp-sdetail-opt-item ${optClass}">
                <span class="rp-sdetail-opt-letter">${letter}</span>
                <span class="rp-sdetail-opt-text">${opt}</span>
                ${isCorrectOpt ? `<span class="rp-sdetail-opt-badge correct">Correct Answer</span>` : ''}
                ${isSelectedOpt && !isCorrectOpt ? `<span class="rp-sdetail-opt-badge wrong">Your Answer</span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
        <div class="rp-sdetail-time-row">
          <div class="rp-sdetail-time-metric">
            <span class="label">Your Time:</span>
            <span class="val font-mono">${qRes.timeSpent || 0}s</span>
          </div>
          <div class="rp-sdetail-time-metric">
            <span class="label">Avg Board Time:</span>
            <span class="val font-mono">${(q.difficulty || 'medium') === 'easy' ? '25s' : (q.difficulty || 'medium') === 'medium' ? '45s' : '75s'}</span>
          </div>
        </div>
        <div class="rp-sdetail-explanation">
          <h5 style="margin-bottom: var(--space-2); color: var(--text-primary); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.05em;">Explanation / Solution</h5>
          <p style="color: var(--text-secondary); font-size: var(--text-sm); line-height: 1.5; margin: 0;">${explanationText}</p>
        </div>
      </div>
    `;
    box.style.display = 'block';
    
    // Smooth scroll down to details if on mobile/small screen
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  _renderRewardsSummary(result) {
    const gam = result._gamification;
    if (!gam || !window.Gamification) return '';

    return `
      <div class="rp-card animate-fadeInUp stagger-1">
        <div class="rp-card-header">
          <div class="rp-card-icon green">${Icons.get('award', 18)}</div>
          <div>
            <h3 class="rp-card-title">Rewards Earned</h3>
            <div class="rp-card-subtitle">Battle XP and coin rewards breakdown</div>
          </div>
        </div>

        ${gam.rewards.map(r => `
          <div class="reward-line" style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) 0; border-bottom: 1px solid var(--border-light);">
            <div class="reward-line-left" style="display: flex; align-items: center; gap: var(--space-2);">
              <span>${r.icon}</span>
              <span style="font-size: var(--text-sm); font-weight: var(--font-medium);">${r.label}</span>
            </div>
            <div class="reward-line-right" style="display: flex; gap: var(--space-2); align-items: center;">
              <span class="reward-coins-badge" style="display: inline-flex; align-items: center; gap: 4px; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); color: var(--warning-light); font-size: var(--text-xs); padding: 2px 6px; border-radius: var(--radius-sm); font-family: var(--font-mono);">${Icons.get('coins', 12)} +${r.coins}</span>
              <span class="reward-xp-badge" style="background: rgba(79,110,247,0.1); border: 1px solid rgba(79,110,247,0.2); color: var(--primary-light); font-size: var(--text-xs); padding: 2px 6px; border-radius: var(--radius-sm); font-family: var(--font-mono);">+${r.xp} XP</span>
            </div>
          </div>
        `).join('')}

        <div class="rewards-total" style="display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-4); font-weight: bold; font-size: var(--text-sm);">
          <span>Total Earned</span>
          <div style="display:flex; gap:var(--space-2);">
            <span class="rewards-total-coins" style="color: var(--warning-light); display: flex; align-items: center; gap: 4px;">${Icons.get('coins', 14)} +${gam.totalCoins}</span>
            <span class="rewards-total-xp" style="color: var(--primary-light); display: flex; align-items: center; gap: 4px;">${Icons.get('zap', 14)} +${gam.totalXP} XP</span>
          </div>
        </div>

        ${gam.combo >= 5 ? `
          <div style="margin-top:var(--space-3); text-align:center; font-size:var(--text-sm); color:var(--text-secondary); display: flex; align-items: center; justify-content: center; gap: 6px;">
            ${Icons.get('flame', 14)} Best Combo: ${gam.combo}x in a row!
          </div>
        ` : ''}

        <div style="margin-top:var(--space-4); text-align:center; border-top: 1px solid var(--border-light); padding-top: var(--space-3);">
          <span class="xp-level-badge" style="display: inline-flex; align-items: center; gap: 6px; font-size: var(--text-xs); font-weight: var(--font-semibold); color: var(--success-light);">${Icons.get('star', 14)} ${gam.level.title} — Tier ${gam.level.level}/5</span>
          <div class="xp-bar-wrap" style="margin-top:var(--space-2); width:100%; height: 6px; background: rgba(255,255,255,0.04); border-radius: var(--radius-full); overflow: hidden;">
            <div class="xp-bar-fill" style="width:${gam.level.progress}%; height: 100%; background: var(--success); border-radius: var(--radius-full);"></div>
          </div>
        </div>
      </div>
    `;
  },

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
      <div class="rp-card animate-fadeInUp stagger-1">
        <div class="rp-card-header">
          <div class="rp-card-icon blue">${Icons.get('activity', 18)}</div>
          <div>
            <h3 class="rp-card-title">Your Progress</h3>
            <div class="rp-card-subtitle">Test #${progress.totalTests + 1} • Overall Journey</div>
          </div>
        </div>

        <div class="progress-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-6);">
          ${percentile !== null ? `
          <div class="rp-stat-box" style="background: rgba(255,255,255,0.01);">
            <div class="rp-stat-num" style="color: var(--primary-light); font-size: var(--text-lg);">${percentile}%</div>
            <div class="rp-stat-label">Percentile</div>
          </div>
          ` : ''}

          ${improvement ? `
          <div class="rp-stat-box" style="background: rgba(255,255,255,0.01);">
            <div class="rp-stat-num" style="color: ${trendColor}; font-size: var(--text-lg); display: flex; align-items: center; justify-content: center; gap: 4px;">
              ${trendIcon} ${deltaSign}${improvement.accuracyDelta}%
            </div>
            <div class="rp-stat-label">vs Last Test</div>
          </div>
          ` : ''}

          <div class="rp-stat-box" style="background: rgba(255,255,255,0.01);">
            <div class="rp-stat-num" style="color: var(--warning-light); font-size: var(--text-lg); display: flex; align-items: center; justify-content: center; gap: 4px;">
              ${Icons.get('flame', 16)} ${progress.currentStreak}
            </div>
            <div class="rp-stat-label">Day Streak</div>
          </div>

          <div class="rp-stat-box" style="background: rgba(255,255,255,0.01);">
            <div class="rp-stat-num" style="color: var(--success-light); font-size: var(--text-lg);">
              ${progress.bestAccuracy}%
            </div>
            <div class="rp-stat-label">Best Accuracy</div>
          </div>
        </div>

        ${timeline.length >= 2 ? `
        <div class="timeline-section" style="border-top: 1px solid var(--border-light); padding-top: var(--space-4);">
          <div class="rp-card-subtitle" style="margin-bottom: var(--space-4); text-transform: uppercase; letter-spacing: 0.05em; font-size: 11px;">Accuracy Timeline</div>
          <div class="timeline-bars" style="display: flex; align-items: flex-end; gap: var(--space-3); height: 100px; justify-content: space-around;">
            ${timeline.map((t, i) => {
              const barColor = t.accuracy >= 70 ? 'var(--success)' : t.accuracy >= 40 ? 'var(--warning)' : 'var(--danger)';
              const isLast = i === timeline.length - 1;
              return `
                <div class="timeline-bar-col" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: var(--space-2); height: 100%; justify-content: flex-end;">
                  <span class="timeline-bar-pct ${isLast ? 'current' : ''}" style="font-size: 10px; font-family: var(--font-mono); color: ${isLast ? 'var(--primary-light)' : 'var(--text-muted)'}; font-weight: ${isLast ? 'bold' : 'normal'};">${t.accuracy}%</span>
                  <div class="timeline-bar-track" style="width: 100%; max-width: 24px; background: rgba(255,255,255,0.03); border-radius: var(--radius-sm); flex: 1; display: flex; flex-direction: column; justify-content: flex-end; overflow: hidden;">
                    <div class="timeline-bar-fill" data-target="${t.accuracy}" style="width:100%; height:0%; background: ${barColor}; border-radius: var(--radius-sm); transition: height 0.8s ease-out ${i * 80}ms;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  },

  _renderDailyGoals(result) {
    if (typeof ProgressEngine === 'undefined') return '';
    const goals = ProgressEngine.getDailyGoals(result);
    const allDone = goals.every(g => g.done);

    return `
      <div class="rp-card animate-fadeInUp stagger-1">
        <div class="rp-card-header">
          <div class="rp-card-icon orange">${Icons.get('target', 18)}</div>
          <div>
            <h3 class="rp-card-title">Today's Goals</h3>
            <div class="rp-card-subtitle">${allDone ? '<span style="color: var(--success);">All Complete!</span>' : 'Complete goals to unlock premium bonus XP'}</div>
          </div>
        </div>
        <div class="daily-goals-list" style="display: flex; flex-direction: column; gap: var(--space-3);">
          ${goals.map(g => `
            <div class="daily-goal-item ${g.done ? 'done' : ''}" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.01); border: 1px solid var(--border-light); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); opacity: ${g.done ? 0.6 : 1};">
              <span class="daily-goal-text" style="font-size: var(--text-sm); font-weight: var(--font-medium);">${g.icon} ${g.text}</span>
              <span class="daily-goal-check" style="color: ${g.done ? 'var(--success)' : 'var(--text-muted)'};">${g.done ? Icons.get('checkCircle', 16) : Icons.get('target', 16)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  _renderBadges() {
    if (typeof ProgressEngine === 'undefined') return '';
    const badges = ProgressEngine.getBadges();
    const earned = badges.filter(b => b.earned);
    if (earned.length === 0) return '';

    return `
      <div class="rp-card animate-fadeInUp stagger-2">
        <div class="rp-card-header">
          <div class="rp-card-icon green">${Icons.get('award', 18)}</div>
          <div>
            <h3 class="rp-card-title">Badges Earned</h3>
            <div class="rp-card-subtitle">${earned.length} achievements unlocked in your career</div>
          </div>
        </div>
        <div class="badges-grid" style="display: flex; flex-wrap: wrap; gap: var(--space-2);">
          ${earned.map(b => `
            <div class="badge-pill" style="display: flex; align-items: center; gap: var(--space-2); background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.15); color: var(--success-light); padding: var(--space-2) var(--space-4); border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: var(--font-semibold);">
              <span>${Icons.get(b.iconKey || 'award', 14)}</span>
              <span>${b.name}</span>
            </div>
          `).join('')}
        </div>
        ${badges.filter(b => !b.earned).length > 0 ? `
          <div class="badges-remaining" style="margin-top: var(--space-4); font-size: var(--text-xs); color: var(--text-muted); text-align: center;">
            ${badges.filter(b => !b.earned).length} more badges to unlock
          </div>
        ` : ''}
      </div>
    `;
  },

  saveAllMistakes() {
    const result = App.lastResult;
    if (!result || !result.questionResults) return;

    // Filter incorrect or skipped questions
    const mistakes = result.questionResults
      .filter(qr => !qr.isCorrect)
      .map(qr => qr.question)
      .filter(Boolean);

    if (mistakes.length === 0) {
      Helpers.showToast('No mistakes or skipped questions to add!', 'info');
      return;
    }

    const added = Storage.saveMistakesToBook(mistakes);
    Helpers.showToast(`Saved ${added} questions to your Mistake Book!`, 'success');

    // Update button text to show success
    const btn = document.getElementById('save-mistakes-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `${Icons.get('check', 14)} Added to Mistake Book`;
      btn.style.borderColor = 'var(--success)';
      btn.style.color = 'var(--success-light)';
      btn.style.background = 'rgba(16, 185, 129, 0.04)';
    }
  },

  // Start a dynamic drill session from the mistake playlist
  startMistakeDrill() {
    const mistakes = Storage.getMistakeBook();
    if (mistakes.length === 0) {
      Helpers.showToast('No mistakes saved in your Mistake Book yet!', 'info');
      return;
    }
    
    // Create test using these mistake questions (shuffled, max 20 questions)
    const questionsToUse = Helpers.shuffleArray(mistakes).slice(0, 20);
    
    const result = TestEngine.createTest({
      questions: questionsToUse,
      timePerQuestion: 60,
      totalTime: null,
      negativeMarking: true,
      negativeValue: 0.25
    });
    
    if (result.error) {
      Helpers.showToast(result.error, 'error');
      return;
    }
    
    Helpers.showToast(`Started revision drill with ${result.questionCount} mistake questions!`, 'success');
    App.navigate('test');
  },

  exportMistakesCSV() {
    const book = Storage.getMistakeBook();
    if (book.length === 0) {
      Helpers.showToast('No mistakes saved to export!', 'info');
      return;
    }
    let csv = 'Question,Option A,Option B,Option C,Option D,Correct Option,Subject,Topic,Difficulty\n';
    book.forEach(q => {
      const correctLetter = ['A', 'B', 'C', 'D'][q.correct];
      const escape = (text) => `"${(text || '').replace(/"/g, '""')}"`;
      const opts = q.options || [];
      csv += `${escape(q.question)},${escape(opts[0])},${escape(opts[1])},${escape(opts[2])},${escape(opts[3])},${correctLetter},${escape(q.subject)},${escape(q.topic)},${escape(q.difficulty)}\n`;
    });
    Helpers.downloadFile(csv, 'my_mistakes_playlist.csv', 'text/csv');
    Helpers.showToast('Mistakes exported as CSV!', 'success');
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
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;"></span> Loading...';
    }

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
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = Icons.get('refresh', 14) + ' Retry Same';
      }
    }
  },

  afterRender() {
    const result = App.lastResult;
    if (!result) return;

    // Animate score donut circle
    setTimeout(() => {
      const circle = document.getElementById('rp-donut-fill');
      if (circle) circle.style.strokeDashoffset = circle.dataset.target;
    }, 300);

    // Animate score counters
    setTimeout(() => {
      const scoreEl = document.getElementById('rp-score-val');
      const accuracyEl = document.getElementById('rp-accuracy-val');
      const correctEl = document.getElementById('rp-correct-val');
      const wrongEl = document.getElementById('rp-wrong-val');
      const skippedEl = document.getElementById('rp-skipped-val');

      if (scoreEl) Helpers.animateCounter(scoreEl, result.totalMarks, 1200);
      if (accuracyEl) {
        Helpers.animateCounter(accuracyEl, result.accuracy, 1200);
        setTimeout(() => { if (accuracyEl) accuracyEl.textContent = result.accuracy + '%'; }, 1300);
      }
      if (correctEl) Helpers.animateCounter(correctEl, result.correct, 800);
      if (wrongEl) Helpers.animateCounter(wrongEl, result.wrong, 800);
      if (skippedEl) Helpers.animateCounter(skippedEl, result.skipped, 800);
    }, 400);

    // Animate subject accuracy column bars (vertical)
    setTimeout(() => {
      document.querySelectorAll('.rp-bar-fill').forEach(bar => {
        bar.style.height = bar.dataset.target + '%';
      });
    }, 600);

    // Animate subject detailed bars (horizontal)
    setTimeout(() => {
      document.querySelectorAll('.rp-subj-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 700);

    // Animate timeline bars (vertical progress)
    setTimeout(() => {
      document.querySelectorAll('.timeline-bar-fill').forEach(bar => {
        bar.style.height = bar.dataset.target + '%';
      });
    }, 800);

    // Animate response time timeline bars
    setTimeout(() => {
      document.querySelectorAll('.rp-time-bar').forEach(bar => {
        bar.style.height = bar.dataset.target;
      });
    }, 900);

    // Auto-select first question in scatter plot if present to introduce interactivity
    if (result.questionResults && result.questionResults.length > 0) {
      setTimeout(() => {
        this.selectScatterQuestion(0);
      }, 1000);
    }

    // Record result in progress engine
    if (typeof ProgressEngine !== 'undefined') {
      ProgressEngine.recordResult(result);
    }
  }
};

window.ResultPage = ResultPage;
