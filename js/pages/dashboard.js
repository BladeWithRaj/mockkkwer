// ============================================
// DASHBOARD PAGE V2 — Pro Analytics
// Topic Heatmap, Progress Graph, Mistake
// Patterns, Streak, all from DailySystem
// + Supabase analytics
// ============================================

const DashboardPage = {
  _isRendering: false,

  async render() {
    // Show loading state first since we fetch from Supabase
    setTimeout(this._renderLoading.bind(this), 0);

    try {
      const stats = await Analytics.loadDashboardStats();
      this._renderContent(stats);

      // Initialize real-time listener
      if (window.subscribeToResults) {
        window.subscribeToResults(this._handleRealtimeUpdate.bind(this));
      }
    } catch (err) {
      console.error("Dashboard render error:", err);
      const appEl = document.getElementById('app');
      appEl.innerHTML = `
        <div class="test-container" style="justify-content: center; align-items: center; min-height: 100vh;">
          <div class="card" style="text-align: center;">
            <div style="font-size: var(--text-4xl); margin-bottom: var(--space-4);">⚠️</div>
            <h2 style="color: var(--danger); margin-bottom: var(--space-2);">Failed to load Dashboard</h2>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">${err.message}</p>
            <button class="btn btn-primary" onclick="App.navigate('home')">Go Home</button>
          </div>
        </div>
      `;
    }
  },

  async _handleRealtimeUpdate() {
    if (this._isRendering) return;
    this._isRendering = true;
    try {
      console.log("♻️ Silent background refresh of dashboard...");
      const stats = await Analytics.loadDashboardStats(true);
      if (document.getElementById('dashboard-trend-chart')) {
         this._renderContent(stats);
      }
    } catch (err) {
      console.error("Realtime refresh failed:", err);
    } finally {
      this._isRendering = false;
    }
  },

  _renderLoading() {
    const appEl = document.getElementById('app');
    appEl.innerHTML = `
      <div class="test-container" style="min-height: 100vh; padding-top: var(--space-12);">
        <header class="app-header">
          <div class="logo" onclick="App.navigate('home')" style="cursor: pointer;">
            <div class="logo-icon"></div>
            <div class="logo-text">MockTestPro</div>
          </div>
        </header>
        <div class="content-wrapper" style="max-width: 1000px; margin: 0 auto; width: 100%; text-align: center; margin-top: var(--space-12);">
          <div class="spinner" style="margin: 0 auto var(--space-4);"></div>
          <p style="color: var(--text-muted);">Loading your analytics...</p>
        </div>
      </div>
    `;
  },

  _renderContent(stats) {
    const appEl = document.getElementById('app');

    // Get DailySystem data
    const streak = typeof DailySystem !== 'undefined' ? DailySystem.getStreak() : { current: 0, best: 0 };
    const goal = typeof DailySystem !== 'undefined' ? DailySystem.getDailyGoal() : { testsToday: 0, target: 3 };
    const heatmap = typeof DailySystem !== 'undefined' ? DailySystem.getTopicHeatmap() : [];
    const patterns = typeof DailySystem !== 'undefined' ? DailySystem.getMistakePatterns() : [];
    const recentProgress = typeof DailySystem !== 'undefined' ? DailySystem.getRecentProgress(7) : [];

    if (!stats && recentProgress.length === 0) {
      // Empty state
      appEl.innerHTML = `
        <div class="test-container" style="min-height: 100vh; padding-top: var(--space-12);">
          <header class="app-header">
            <div class="logo" onclick="App.navigate('home')" style="cursor: pointer;">
              <div class="logo-icon"></div>
              <div class="logo-text">MockTestPro</div>
            </div>
          </header>
          <div class="content-wrapper" style="max-width: 1000px; margin: 0 auto; width: 100%; text-align: center; margin-top: var(--space-12);">
            <div class="card animate-fadeInUp">
              <div style="font-size: var(--text-4xl); margin-bottom: var(--space-4);">📊</div>
              <h2 style="margin-bottom: var(--space-2);">No Tests Taken Yet</h2>
              <p style="color: var(--text-muted); margin-bottom: var(--space-6);">Take your first mock test to see your performance dashboard.</p>
              <button class="btn btn-primary" onclick="App.navigate('setup')">Start First Test</button>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Compute trends
    const impRate = stats ? stats.improvementRate : 0;
    const trendIcon = impRate > 0 ? '↗️' : (impRate < 0 ? '↘️' : '→');
    const trendColor = impRate > 0 ? 'var(--success)' : (impRate < 0 ? 'var(--danger)' : 'var(--warning)');
    const trendText = impRate > 0 ? `+${impRate}% in last 5 tests` : (impRate < 0 ? `${impRate}% in last 5 tests` : 'No recent change');

    const html = `
      <div class="test-container" style="min-height: 100vh; padding-top: var(--space-12);">

        <header class="app-header">
          <div class="logo" onclick="App.navigate('home')" style="cursor: pointer;">
            <div class="logo-icon"></div>
            <div class="logo-text">MockTestPro</div>
          </div>
          <div class="desktop-only" style="gap: var(--space-4);">
            <button class="btn btn-outline" onclick="App.navigate('setup')">New Test</button>
          </div>
        </header>

        <div class="content-wrapper animate-fadeInUp" style="max-width: 1000px; margin: 0 auto; width: 100%;">

          <div style="margin-bottom: var(--space-6);">
            <h1 style="font-size: var(--text-2xl); font-weight: var(--font-bold);">📊 Performance Dashboard</h1>
          </div>

          <!-- ROW 1: Streak + Quick Stats -->
          <div style="display: grid; grid-template-columns: auto 1fr; gap: var(--space-4); margin-bottom: var(--space-6);">

            <!-- Streak Card -->
            <div class="card" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 140px; padding: var(--space-6);">
              <div style="font-size: 36px; margin-bottom: 6px;">${streak.current > 0 ? '🔥' : '❄️'}</div>
              <div style="font-size: 28px; font-weight: 800;">${streak.current}</div>
              <div style="font-size: 11px; color: var(--text-muted);">day streak</div>
              ${streak.best > 1 ? `<div style="font-size: 10px; color: var(--warning); margin-top: 4px;">Best: ${streak.best}🏆</div>` : ''}
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 6px;">${goal.testsToday}/${goal.target} today</div>
            </div>

            <!-- Quick Stats Grid -->
            <div class="insights-grid">
              <div class="insight-item">
                <div class="insight-icon" style="background: rgba(59, 130, 246, 0.15); color: #60A5FA;">📝</div>
                <div>
                  <div class="insight-label">Tests Done</div>
                  <div class="insight-value">${stats ? stats.totalTests : recentProgress.length}</div>
                </div>
              </div>
              <div class="insight-item">
                <div class="insight-icon" style="background: rgba(16, 185, 129, 0.15); color: #34D399;">🎯</div>
                <div>
                  <div class="insight-label">Avg Score</div>
                  <div class="insight-value">${stats ? stats.avgScore : (recentProgress.length > 0 ? Math.round(recentProgress.reduce((s,e) => s + e.accuracy, 0) / recentProgress.length) : 0)}%</div>
                </div>
              </div>
              <div class="insight-item">
                <div class="insight-icon" style="background: rgba(245, 158, 11, 0.15); color: #FBBF24;">🏆</div>
                <div>
                  <div class="insight-label">Best Score</div>
                  <div class="insight-value">${stats ? stats.bestScore : (recentProgress.length > 0 ? Math.max(...recentProgress.map(e => e.accuracy)) : 0)}%</div>
                </div>
              </div>
              <div class="insight-item">
                <div class="insight-icon" style="background: rgba(239, 68, 68, 0.15); color: #F87171;">⚠️</div>
                <div>
                  <div class="insight-label">Weak Area</div>
                  <div class="insight-value">${stats ? stats.weakArea : (heatmap.length > 0 ? heatmap[0].subject : 'N/A')}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ROW 2: Progress Chart -->
          ${stats && stats.trendData && stats.trendData.length > 1 ? `
          <div class="card" style="margin-bottom: var(--space-6);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4);">
              <h3 style="font-size: var(--text-lg);">📈 Accuracy Trend</h3>
              <div style="font-size: var(--text-sm); font-weight: var(--font-semibold); color: ${trendColor};">
                ${trendIcon} ${trendText}
              </div>
            </div>
            <div style="height: 250px; position: relative;">
              <canvas id="dashboard-trend-chart" width="800" height="250" style="width: 100%; height: 100%; display: block;"></canvas>
            </div>
          </div>
          ` : ''}

          <!-- ROW 3: Topic Heatmap + Mistake Patterns -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-6);">

            <!-- Topic Heatmap -->
            <div class="card">
              <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-4);">🗺️ Topic Heatmap</h3>
              ${heatmap.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                  ${heatmap.map(t => `
                    <div>
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: var(--text-sm); font-weight: 600; text-transform: capitalize;">${t.subject}</span>
                        <span style="font-size: var(--text-sm); font-weight: 700; color: ${t.accuracy >= 70 ? 'var(--success-light)' : t.accuracy >= 40 ? 'var(--warning)' : 'var(--danger-light)'};">
                          ${t.accuracy}%
                        </span>
                      </div>
                      <div style="height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden;">
                        <div style="height: 100%; width: ${t.accuracy}%; border-radius: 4px; transition: width 0.6s ease;
                          background: ${t.accuracy >= 70 ? 'var(--success)' : t.accuracy >= 40 ? 'var(--warning)' : 'var(--danger)'};">
                        </div>
                      </div>
                      <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">${t.correct}/${t.total} correct · ${t.tests} tests</div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p style="color: var(--text-muted); font-size: var(--text-sm);">Take some tests to see your topic breakdown.</p>
              `}
            </div>

            <!-- Mistake Patterns -->
            <div class="card">
              <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-4);">🧠 Mistake Patterns</h3>
              ${patterns.length > 0 ? `
                <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                  ${patterns.map(p => `
                    <div style="padding: var(--space-3); border-radius: var(--radius-md); border-left: 3px solid ${p.severity === 'high' ? 'var(--danger)' : p.severity === 'positive' ? 'var(--success)' : 'var(--warning)'}; background: ${p.severity === 'positive' ? 'rgba(16, 185, 129, 0.06)' : 'rgba(239, 68, 68, 0.04)'};">
                      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span style="font-size: 16px;">${p.icon}</span>
                        <span style="font-weight: 700; font-size: var(--text-sm);">${p.title}</span>
                      </div>
                      <div style="font-size: 12px; color: var(--text-muted);">${p.desc}</div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div style="padding: var(--space-4); text-align: center;">
                  <p style="color: var(--text-muted); font-size: var(--text-sm);">Take 3+ tests to unlock pattern analysis.</p>
                </div>
              `}
            </div>
          </div>

          <!-- ROW 4: Server-side Topic Accuracy (from Supabase) -->
          ${stats && stats.topics && stats.topics.length > 0 ? `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: var(--space-6); margin-bottom: var(--space-6);">

            <div class="card">
              <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-4);">📊 Topic Accuracy (Server)</h3>
              <div style="display: flex; flex-direction: column; gap: var(--space-3);">
                ${stats.topics.map(t => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-3); background: var(--bg-glass); border-radius: var(--radius-md);">
                    <div>
                      <div style="font-weight: var(--font-semibold);">${t.topic}</div>
                      <div style="font-size: var(--text-xs); color: var(--text-muted);">${t.tests} tests</div>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: var(--font-bold); color: ${t.accuracy >= 70 ? 'var(--success)' : (t.accuracy >= 50 ? 'var(--warning)' : 'var(--danger)')};">
                        ${t.accuracy}% ${t.accuracy >= 70 ? '🟢' : (t.accuracy >= 50 ? '🟡' : '🔴')}
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Recommendations -->
            <div class="card" style="background: linear-gradient(145deg, rgba(30,41,59,0.7), rgba(15,23,42,0.9)); border: 1px solid rgba(99,102,241,0.2);">
              <h3 style="font-size: var(--text-lg); margin-bottom: var(--space-4); color: #C4B5FD;">🎯 Smart Recommendations</h3>
              <div style="display: flex; flex-direction: column; gap: var(--space-4);">

                ${stats.weakTopic ? `
                <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
                  <div style="font-size: 20px;">1️⃣</div>
                  <div>
                    <div style="font-weight: var(--font-semibold); margin-bottom: 2px;">Focus on ${stats.weakTopic.topic}</div>
                    <div style="font-size: var(--text-sm); color: var(--text-muted);">Lowest accuracy: ${stats.weakTopic.accuracy}%</div>
                  </div>
                </div>
                ` : ''}

                ${stats.slowTopic && stats.slowTopic.avgTimePerQ > 50 ? `
                <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
                  <div style="font-size: 20px;">2️⃣</div>
                  <div>
                    <div style="font-weight: var(--font-semibold); margin-bottom: 2px;">Speed up in ${stats.slowTopic.topic}</div>
                    <div style="font-size: var(--text-sm); color: var(--text-muted);">Taking ${stats.slowTopic.avgTimePerQ}s per question. Try to reduce this.</div>
                  </div>
                </div>
                ` : ''}

                <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
                  <div style="font-size: 20px;">3️⃣</div>
                  <div>
                    <div style="font-weight: var(--font-semibold); margin-bottom: 2px;">Maintain Consistency</div>
                    <div style="font-size: var(--text-sm); color: var(--text-muted);">Current streak: ${streak.current} days. Target: 1 test daily.</div>
                  </div>
                </div>

              </div>
              <div style="margin-top: var(--space-5);">
                <button class="btn btn-primary" style="width: 100%;" onclick="App.navigate('setup')">Start Practice Session</button>
              </div>
            </div>

          </div>
          ` : ''}

        </div>
      </div>
    `;

    appEl.innerHTML = html;

    // Draw Chart
    const canvas = document.getElementById('dashboard-trend-chart');
    if (canvas && stats && stats.trendData && stats.trendData.length > 0) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);

      Analytics.drawLineChart(canvas, stats.trendData, { centerText: '' });
    }
  }
};
