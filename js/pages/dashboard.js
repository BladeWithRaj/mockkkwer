// ============================================
// DASHBOARD PAGE v3 — Premium Design
// Profile card, stat cards with micro-animations,
// progress chart, topic heatmap, smart insights
// ============================================

const DashboardPage = {
  _isRendering: false,

  render() {
    // Return loading HTML synchronously
    return `
      <div class="dash-page page-enter">
        <div class="dash-loading">
          <div class="splash-spinner" style="width: 36px; height: 36px; border: 2px solid rgba(255,255,255,0.08); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <p>Loading your analytics...</p>
        </div>
      </div>
    `;
  },

  async afterRender() {
    try {
      const stats = await Analytics.loadDashboardStats();
      this._renderContent(stats);

      // Initialize real-time listener
      if (window.subscribeToResults) {
        window.subscribeToResults(this._handleRealtimeUpdate.bind(this));
      }
    } catch (err) {
      console.error("Dashboard render error:", err);
      const container = document.querySelector('.dash-page');
      if (container) {
        container.innerHTML = `
          <div class="dash-error">
            <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
            <h2>Failed to load Dashboard</h2>
            <p>${err.message}</p>
            <button class="btn btn-primary" onclick="App.navigate('home')">Go Home</button>
          </div>
        `;
      }
    }
  },

  async _handleRealtimeUpdate() {
    if (this._isRendering) return;
    this._isRendering = true;
    try {
      const stats = await Analytics.loadDashboardStats(true);
      if (document.querySelector('.dash-page')) {
        this._renderContent(stats);
      }
    } catch (err) {
      console.error("Realtime refresh failed:", err);
    } finally {
      this._isRendering = false;
    }
  },

  _renderContent(stats) {
    const container = document.querySelector('.dash-page');
    if (!container) return;

    // Get DailySystem data
    const streak = typeof DailySystem !== 'undefined' ? DailySystem.getStreak() : { current: 0, best: 0 };
    const goal = typeof DailySystem !== 'undefined' ? DailySystem.getDailyGoal() : { testsToday: 0, target: 3, questionsToday: 0, accuracyToday: 0 };
    const heatmap = typeof DailySystem !== 'undefined' ? DailySystem.getTopicHeatmap() : [];
    const patterns = typeof DailySystem !== 'undefined' ? DailySystem.getMistakePatterns() : [];
    const recentProgress = typeof DailySystem !== 'undefined' ? DailySystem.getRecentProgress(7) : [];
    const streakAlive = typeof DailySystem !== 'undefined' ? DailySystem.isStreakAlive() : false;

    const username = Storage.getUsername() || 'Student';
    const avatar = localStorage.getItem('mocktest_avatar') || 'default';
    const avatarMap = {
      default: '👤', boy1: '👦', boy2: '🧑', boy3: '👨',
      girl1: '👧', girl2: '👩', girl3: '👱‍♀️',
      ninja: '🥷', astronaut: '🧑‍🚀', robot: '🤖',
      cat: '🐱', dog: '🐶', panda: '🐼', fox: '🦊'
    };
    const avatarEmoji = avatarMap[avatar] || '👤';

    if (!stats && recentProgress.length === 0) {
      container.innerHTML = `
        <div class="dash-empty animate-fadeInUp">
          <div style="font-size: 72px; margin-bottom: 20px;">📊</div>
          <h2>No Tests Taken Yet</h2>
          <p>Take your first mock test to unlock your performance dashboard.</p>
          <button class="btn btn-primary btn-lg" onclick="App.navigate('setup')" style="margin-top: 16px;">🚀 Start First Test</button>
        </div>
      `;
      return;
    }

    // Stats calculations
    const totalTests = stats ? stats.totalTests : recentProgress.length;
    const avgScore = stats ? stats.avgScore : (recentProgress.length > 0 ? Math.round(recentProgress.reduce((s, e) => s + e.accuracy, 0) / recentProgress.length) : 0);
    const bestScore = stats ? stats.bestScore : (recentProgress.length > 0 ? Math.max(...recentProgress.map(e => e.accuracy)) : 0);
    const weakArea = stats ? stats.weakArea : (heatmap.length > 0 ? heatmap[0].subject : '—');

    // Improvement trend
    const impRate = stats ? stats.improvementRate : 0;
    const trendIcon = impRate > 0 ? '📈' : (impRate < 0 ? '📉' : '➡️');
    const trendColor = impRate > 0 ? 'var(--success)' : (impRate < 0 ? 'var(--danger)' : 'var(--warning)');
    const trendText = impRate > 0 ? `+${impRate}%` : (impRate < 0 ? `${impRate}%` : '0%');

    // Score grade
    const getGrade = (score) => {
      if (score >= 90) return { label: 'A+', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' };
      if (score >= 80) return { label: 'A', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)' };
      if (score >= 70) return { label: 'B+', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)' };
      if (score >= 60) return { label: 'B', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' };
      if (score >= 40) return { label: 'C', color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)' };
      return { label: 'D', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' };
    };
    const grade = getGrade(avgScore);

    // Goal progress %
    const goalPct = Math.min(100, Math.round((goal.testsToday / goal.target) * 100));

    container.innerHTML = `
      <!-- Profile + Greeting -->
      <div class="dash-profile animate-fadeInUp">
        <div class="dash-profile-left">
          <div class="dash-avatar">${avatarEmoji}</div>
          <div class="dash-greeting">
            <h2>Hey, ${username}! 👋</h2>
            <p>${this._getGreeting()}</p>
          </div>
        </div>
        <div class="dash-streak-badge ${streakAlive ? 'alive' : 'dead'}">
          <span class="dash-streak-fire">${streakAlive ? '🔥' : '❄️'}</span>
          <div>
            <div class="dash-streak-num">${streak.current}</div>
            <div class="dash-streak-label">day streak</div>
          </div>
        </div>
      </div>

      <!-- Quick Stats Cards -->
      <div class="dash-stats-grid animate-fadeInUp stagger-1">
        <div class="dash-stat-card">
          <div class="dash-stat-icon" style="background: rgba(59, 130, 246, 0.12); color: #60A5FA;">📝</div>
          <div class="dash-stat-info">
            <div class="dash-stat-value">${totalTests}</div>
            <div class="dash-stat-label">Tests Done</div>
          </div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon" style="background: ${grade.bg}; color: ${grade.color};">${grade.label}</div>
          <div class="dash-stat-info">
            <div class="dash-stat-value">${avgScore}%</div>
            <div class="dash-stat-label">Avg Score</div>
          </div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon" style="background: rgba(245, 158, 11, 0.12); color: #FBBF24;">🏆</div>
          <div class="dash-stat-info">
            <div class="dash-stat-value">${bestScore}%</div>
            <div class="dash-stat-label">Best Score</div>
          </div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon" style="background: rgba(239, 68, 68, 0.12); color: #F87171;">⚠️</div>
          <div class="dash-stat-info">
            <div class="dash-stat-value" style="font-size: 14px; text-transform: capitalize;">${weakArea}</div>
            <div class="dash-stat-label">Weak Area</div>
          </div>
        </div>
      </div>

      <!-- Today's Progress + Trend Row -->
      <div class="dash-row-2 animate-fadeInUp stagger-2">
        <!-- Today's Goal -->
        <div class="dash-today-card">
          <div class="dash-today-header">
            <span>📅 Today's Progress</span>
            <span class="dash-today-pct">${goalPct}%</span>
          </div>
          <div class="dash-goal-bar-wrap">
            <div class="dash-goal-bar" style="width: ${goalPct}%; background: ${goalPct >= 100 ? 'var(--success)' : 'var(--primary)'};"></div>
          </div>
          <div class="dash-today-stats">
            <div class="dash-today-stat">
              <span class="dash-ts-num">${goal.testsToday}</span>
              <span class="dash-ts-label">/ ${goal.target} tests</span>
            </div>
            <div class="dash-today-stat">
              <span class="dash-ts-num">${goal.questionsToday}</span>
              <span class="dash-ts-label">questions</span>
            </div>
            <div class="dash-today-stat">
              <span class="dash-ts-num">${goal.accuracyToday || 0}%</span>
              <span class="dash-ts-label">accuracy</span>
            </div>
          </div>
        </div>

        <!-- Trend Card -->
        <div class="dash-trend-card">
          <div class="dash-trend-header">
            <span>${trendIcon} Performance Trend</span>
            <span class="dash-trend-change" style="color: ${trendColor};">${trendText}</span>
          </div>
          ${stats && stats.trendData && stats.trendData.length > 1 ? `
            <div class="dash-chart-wrap">
              <canvas id="dashboard-trend-chart" width="800" height="200" style="width: 100%; height: 100%; display: block;"></canvas>
            </div>
          ` : `
            <div class="dash-no-chart">
              <p>Take 2+ tests to see your accuracy trend graph</p>
            </div>
          `}
        </div>
      </div>

      <!-- Topic Heatmap + Patterns Row -->
      <div class="dash-row-3 animate-fadeInUp stagger-3">
        <!-- Topic Heatmap -->
        <div class="dash-heatmap-card">
          <h3>🗺️ Topic Strength</h3>
          ${heatmap.length > 0 ? `
            <div class="dash-topics">
              ${heatmap.map(t => {
                const barColor = t.accuracy >= 70 ? '#10B981' : t.accuracy >= 40 ? '#F59E0B' : '#EF4444';
                const emoji = t.accuracy >= 70 ? '🟢' : t.accuracy >= 40 ? '🟡' : '🔴';
                return `
                  <div class="dash-topic-row">
                    <div class="dash-topic-head">
                      <span class="dash-topic-name">${emoji} ${t.subject}</span>
                      <span class="dash-topic-acc" style="color: ${barColor};">${t.accuracy}%</span>
                    </div>
                    <div class="dash-topic-bar-bg">
                      <div class="dash-topic-bar" style="width: ${t.accuracy}%; background: ${barColor};"></div>
                    </div>
                    <div class="dash-topic-meta">${t.correct}/${t.total} correct · ${t.tests} tests</div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="dash-empty-section">
              <p>Take some tests to see topic breakdown</p>
            </div>
          `}
        </div>

        <!-- Mistake Patterns -->
        <div class="dash-patterns-card">
          <h3>🧠 Smart Insights</h3>
          ${patterns.length > 0 ? `
            <div class="dash-patterns">
              ${patterns.map(p => {
                const borderColor = p.severity === 'high' ? 'var(--danger)' : p.severity === 'positive' ? 'var(--success)' : 'var(--warning)';
                const bgColor = p.severity === 'positive' ? 'rgba(16, 185, 129, 0.06)' : p.severity === 'high' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(245, 158, 11, 0.06)';
                return `
                  <div class="dash-pattern-item" style="border-left-color: ${borderColor}; background: ${bgColor};">
                    <div class="dash-pattern-head">
                      <span>${p.icon}</span>
                      <span class="dash-pattern-title">${p.title}</span>
                    </div>
                    <div class="dash-pattern-desc">${p.desc}</div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="dash-empty-section">
              <p>Take 3+ tests to unlock pattern analysis</p>
            </div>
          `}

          <!-- Quick Actions -->
          <div class="dash-quick-actions">
            <button class="btn btn-primary" onclick="App.navigate('setup')" style="width: 100%;">🚀 Start Practice</button>
            <button class="btn btn-outline" onclick="App.navigate('leaderboard')" style="width: 100%;">🏆 Leaderboard</button>
          </div>
        </div>
      </div>

      ${streak.best > 1 ? `
      <!-- Streak History -->
      <div class="dash-streak-history animate-fadeInUp stagger-4">
        <div class="dash-streak-best">
          <span>🏅 Best Streak: <strong>${streak.best} days</strong></span>
          <span style="color: var(--text-muted); font-size: 12px;">Current: ${streak.current} days</span>
        </div>
      </div>
      ` : ''}
    `;

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
  },

  _getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning! Ready for practice? ☀️';
    if (hour < 17) return 'Good afternoon! Keep the momentum going 💪';
    if (hour < 21) return 'Good evening! Perfect time for a test 🌙';
    return 'Night owl mode! 🦉 Stay focused!';
  }
};
