// ============================================
// DASHBOARD PAGE v4.0 — Premium "Scholar" Design
// Hero greeting + 4 stat cards + performance chart
// Subject strength bars + smart insights + quick actions
// Matches homepage premium quality
// ============================================

const DashboardPage = {
  _isRendering: false,
  _chartCtx: null,

  render() {
    return `
      <div class="dp page-enter">
        <div class="dp-loading">
          <div class="dp-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    `;
  },

  async afterRender() {
    try {
      const stats = await Analytics.loadDashboardStats();
      this._buildUI(stats);
    } catch (err) {
      console.error('Dashboard error:', err);
      const el = document.querySelector('.dp');
      if (el) el.innerHTML = `
        <div class="dp-error">
          ${Icons.get('alertTriangle', 36)}
          <h2>Dashboard failed to load</h2>
          <p>${err.message}</p>
          <button class="dp-cta-btn dp-cta-btn--primary" onclick="App.navigate('home')">Go Home</button>
        </div>`;
    }
  },

  async _handleRealtimeUpdate() {
    if (this._isRendering) return;
    this._isRendering = true;
    try {
      const stats = await Analytics.loadDashboardStats(true);
      if (document.querySelector('.dp')) this._buildUI(stats);
    } catch (e) { console.error('Realtime update failed:', e); }
    finally { this._isRendering = false; }
  },

  _buildUI(stats) {
    const container = document.querySelector('.dp');
    if (!container) return;

    // ── Data ──
    const streak  = typeof DailySystem !== 'undefined' ? DailySystem.getStreak()          : { current: 0, best: 0 };
    const goal    = typeof DailySystem !== 'undefined' ? DailySystem.getDailyGoal()        : { testsToday: 0, target: 3, questionsToday: 0, accuracyToday: 0 };
    const heatmap = typeof DailySystem !== 'undefined' ? DailySystem.getTopicHeatmap()     : [];
    const patterns= typeof DailySystem !== 'undefined' ? DailySystem.getMistakePatterns()  : [];
    const recent  = typeof DailySystem !== 'undefined' ? DailySystem.getRecentProgress(7)  : [];
    const alive   = typeof DailySystem !== 'undefined' ? DailySystem.isStreakAlive()        : false;

    const username    = Storage.getUsername() || 'Student';
    const totalTests  = stats ? stats.totalTests  : recent.length;
    const avgScore    = stats ? stats.avgScore    : (recent.length ? Math.round(recent.reduce((s,e)=>s+e.accuracy,0)/recent.length) : 0);
    const bestScore   = stats ? stats.bestScore   : (recent.length ? Math.max(...recent.map(e=>e.accuracy)) : 0);
    const weakArea    = stats ? stats.weakArea    : (heatmap.length ? heatmap[0].subject : '—');
    const impRate     = stats ? stats.improvementRate : 0;
    const goalPct     = Math.min(100, Math.round((goal.testsToday / (goal.target || 3)) * 100));

    const grade = this._grade(avgScore);
    const hour  = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning! Ready to ace today?' :
                     hour < 17 ? 'Good afternoon! Keep the momentum.' :
                     hour < 21 ? 'Good evening! Perfect time for a test.' :
                                 'Night owl mode — stay sharp!';

    // Empty state
    if (!stats && recent.length === 0) {
      container.innerHTML = `
        <div class="dp-empty">
          <div class="dp-empty-icon">${Icons.get('barChart', 48)}</div>
          <h2>No tests taken yet</h2>
          <p>Complete your first mock test to unlock your personal performance dashboard with insights, trends, and subject analysis.</p>
          <div class="dp-empty-actions">
            <button class="dp-cta-btn dp-cta-btn--primary" onclick="App.navigate('setup')">${Icons.get('zap',16)} Start First Test</button>
            <button class="dp-cta-btn dp-cta-btn--outline" onclick="App.navigate('board')">${Icons.get('clipboard',16)} Browse Exams</button>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = `

      <!-- ═══ HERO GREETING ═══ -->
      <section class="dp-hero">
        <div class="dp-hero-left">
          <div class="dp-hero-badge">${alive ? '🔥' : '📊'} ${alive ? `${streak.current} Day Streak Active` : 'Your Dashboard'}</div>
          <h1 class="dp-hero-title">Hey, ${username}!</h1>
          <p class="dp-hero-sub">${greeting}</p>

          <!-- 4 inline hero stats -->
          <div class="dp-hero-chips">
            <div class="dp-hero-chip">
              <span class="dp-hero-chip-val">${totalTests}</span>
              <span class="dp-hero-chip-lbl">Tests Done</span>
            </div>
            <div class="dp-hero-chip">
              <span class="dp-hero-chip-val" style="color:${grade.color}">${avgScore}%</span>
              <span class="dp-hero-chip-lbl">Avg Score</span>
            </div>
            <div class="dp-hero-chip">
              <span class="dp-hero-chip-val">${bestScore}%</span>
              <span class="dp-hero-chip-lbl">Best Score</span>
            </div>
            <div class="dp-hero-chip">
              <span class="dp-hero-chip-val" style="color:${impRate>=0?'#10B981':'#EF4444'}">${impRate>=0?'+':''}${impRate}%</span>
              <span class="dp-hero-chip-lbl">Trend</span>
            </div>
          </div>

          <!-- CTA buttons -->
          <div class="dp-hero-ctas">
            <button class="dp-cta-btn dp-cta-btn--primary" onclick="App.navigate('setup')">${Icons.get('zap',16)} Start Practice</button>
            <button class="dp-cta-btn dp-cta-btn--outline" onclick="App.navigate('analytics')">${Icons.get('barChart',16)} Full Analytics</button>
          </div>
        </div>

        <!-- Study scene image (right side) -->
        <div class="dp-hero-right">
          <img src="assets/dashboard-bg.png" alt="Study desk" loading="eager" />
        </div>

        <!-- Today's goal ring (overlaid on right) -->
        <div class="dp-hero-goal">
          <div class="dp-goal-ring-wrap">
            <svg class="dp-goal-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="var(--dp-ring-bg)" stroke-width="10"/>
              <circle cx="60" cy="60" r="50" fill="none"
                stroke="${goalPct>=100?'#10B981':'#3B82F6'}"
                stroke-width="10"
                stroke-linecap="round"
                stroke-dasharray="${2*Math.PI*50}"
                stroke-dashoffset="${2*Math.PI*50 * (1 - goalPct/100)}"
                transform="rotate(-90 60 60)"
                style="transition: stroke-dashoffset 1s ease"/>
            </svg>
            <div class="dp-goal-center">
              <div class="dp-goal-pct">${goalPct}%</div>
              <div class="dp-goal-lbl">Goal</div>
            </div>
          </div>
          <div class="dp-goal-legend">
            <div class="dp-gl-item"><span>${goal.testsToday}/${goal.target}</span><small>Tests</small></div>
            <div class="dp-gl-item"><span>${goal.questionsToday}</span><small>Questions</small></div>
            <div class="dp-gl-item"><span>${goal.accuracyToday||0}%</span><small>Today's Acc.</small></div>
          </div>
        </div>
      </section>

      <!-- ═══ 4 STAT CARDS ═══ -->
      <section class="dp-section">
        <div class="dp-stats-grid">
          ${this._statCard(Icons.get('fileText',22), totalTests, 'Tests Taken', '#3B82F6', 'rgba(59,130,246,0.12)')}
          ${this._statCard(`<span style="font-size:18px;font-weight:800;color:${grade.color}">${grade.label}</span>`, avgScore+'%', 'Avg Accuracy', grade.color, grade.bg)}
          ${this._statCard(Icons.get('trophy',22), bestScore+'%', 'Best Score', '#F59E0B', 'rgba(245,158,11,0.12)')}
          ${this._statCard(Icons.get('alertTriangle',22), weakArea, 'Weak Subject', '#EF4444', 'rgba(239,68,68,0.12)', true)}
        </div>
      </section>

      <!-- ═══ CHART + STREAK ROW ═══ -->
      <section class="dp-section">
        <div class="dp-row-2">

          <!-- Performance Chart -->
          <div class="dp-card dp-chart-card">
            <div class="dp-card-header">
              <div class="dp-card-title">${Icons.get('trendingUp',18)} Performance Trend</div>
              <span class="dp-trend-badge" style="color:${impRate>=0?'#10B981':'#EF4444'};background:${impRate>=0?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)'}">
                ${impRate>=0?'↑':'↓'} ${Math.abs(impRate)}%
              </span>
            </div>
            ${stats && stats.trendData && stats.trendData.length > 1 ? `
              <div class="dp-chart-container">
                <canvas id="dp-trend-canvas"></canvas>
              </div>
            ` : `
              <div class="dp-chart-empty">
                <div class="dp-chart-empty-icon">${Icons.get('activity',32)}</div>
                <p>Take 2+ tests to see your accuracy trend</p>
                <button class="dp-cta-btn dp-cta-btn--primary dp-cta-btn--sm" onclick="App.navigate('setup')">${Icons.get('zap',14)} Take a Test Now</button>
              </div>
            `}
          </div>

          <!-- Streak + Recent -->
          <div class="dp-card dp-streak-card">
            <div class="dp-card-header">
              <div class="dp-card-title">${Icons.get('flame',18)} Streak</div>
              ${alive ? '<span class="dp-alive-dot"></span>' : ''}
            </div>
            <div class="dp-streak-hero">
              <div class="dp-streak-num ${alive?'alive':''}">${streak.current}</div>
              <div class="dp-streak-unit">day${streak.current!==1?'s':''}</div>
              ${alive ? '<div class="dp-streak-fire">🔥</div>' : ''}
            </div>
            <div class="dp-streak-meta">
              <div class="dp-sm-row">
                <span>Best Streak</span>
                <strong>${streak.best} days</strong>
              </div>
              <div class="dp-sm-row">
                <span>Status</span>
                <strong style="color:${alive?'#10B981':'#EF4444'}">${alive?'🟢 Active':'🔴 Broken'}</strong>
              </div>
            </div>
            <button class="dp-cta-btn dp-cta-btn--outline dp-cta-btn--full" onclick="HomePage._startDaily()">${Icons.get('zap',14)} Daily Challenge</button>
          </div>

        </div>
      </section>

      <!-- ═══ SUBJECT STRENGTH + INSIGHTS ROW ═══ -->
      <section class="dp-section">
        <div class="dp-row-2">

          <!-- Subject Strength Bars -->
          <div class="dp-card">
            <div class="dp-card-header">
              <div class="dp-card-title">${Icons.get('barChart',18)} Subject Strength</div>
            </div>
            ${heatmap.length > 0 ? `
              <div class="dp-subjects">
                ${heatmap.map(t => {
                  const c = t.accuracy >= 70 ? '#10B981' : t.accuracy >= 40 ? '#F59E0B' : '#EF4444';
                  const lbl = t.accuracy >= 70 ? 'Strong' : t.accuracy >= 40 ? 'Average' : 'Weak';
                  return `
                    <div class="dp-subj-row">
                      <div class="dp-subj-top">
                        <span class="dp-subj-name">${t.subject}</span>
                        <div style="display:flex;align-items:center;gap:8px">
                          <span class="dp-subj-tag" style="color:${c};background:${c}18">${lbl}</span>
                          <span class="dp-subj-pct" style="color:${c}">${t.accuracy}%</span>
                        </div>
                      </div>
                      <div class="dp-subj-bar-bg">
                        <div class="dp-subj-bar" style="width:${t.accuracy}%;background:${c}"></div>
                      </div>
                      <div class="dp-subj-meta">${t.correct}/${t.total} correct · ${t.tests} test${t.tests!==1?'s':''}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="dp-card-empty">
                ${Icons.get('clipboard',28)}
                <p>Take some tests to see subject breakdown</p>
              </div>
            `}
          </div>

          <!-- Smart Insights -->
          <div class="dp-card">
            <div class="dp-card-header">
              <div class="dp-card-title">${Icons.get('brain',18)} Smart Insights</div>
            </div>
            ${patterns.length > 0 ? `
              <div class="dp-insights">
                ${patterns.map(p => {
                  const border = p.severity==='high'?'#EF4444':p.severity==='positive'?'#10B981':'#F59E0B';
                  const bg     = p.severity==='high'?'rgba(239,68,68,0.06)':p.severity==='positive'?'rgba(16,185,129,0.06)':'rgba(245,158,11,0.06)';
                  return `
                    <div class="dp-insight-item" style="border-left-color:${border};background:${bg}">
                      <div class="dp-insight-head">
                        <span class="dp-insight-icon">${p.icon}</span>
                        <span class="dp-insight-title">${p.title}</span>
                      </div>
                      <p class="dp-insight-desc">${p.desc}</p>
                    </div>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="dp-card-empty">
                ${Icons.get('brain',28)}
                <p>Take 3+ tests to unlock AI-powered pattern analysis</p>
              </div>
            `}

            <!-- Quick action pair -->
            <div class="dp-quick-pair">
              <button class="dp-cta-btn dp-cta-btn--primary dp-cta-btn--full" onclick="App.navigate('setup')">${Icons.get('zap',15)} Start Practice</button>
              <button class="dp-cta-btn dp-cta-btn--outline dp-cta-btn--full" onclick="App.navigate('analytics')">${Icons.get('barChart',15)} Analytics</button>
            </div>
          </div>

        </div>
      </section>

    `;

    // Draw chart after DOM ready
    requestAnimationFrame(() => {
      const canvas = document.getElementById('dp-trend-canvas');
      if (canvas && stats && stats.trendData && stats.trendData.length > 0) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width  = rect.width  * dpr;
        canvas.height = rect.height * dpr;
        canvas.getContext('2d').scale(dpr, dpr);
        Analytics.drawLineChart(canvas, stats.trendData, { centerText: '' });
      }
    });
  },

  _statCard(icon, value, label, color, bg, small=false) {
    return `
      <div class="dp-stat-card" style="--sc-color:${color};--sc-bg:${bg}">
        <div class="dp-sc-icon">${icon}</div>
        <div class="dp-sc-val ${small?'dp-sc-val--sm':''}">${value}</div>
        <div class="dp-sc-lbl">${label}</div>
      </div>
    `;
  },

  _grade(score) {
    if (score >= 90) return { label:'A+', color:'#10B981', bg:'rgba(16,185,129,0.12)' };
    if (score >= 80) return { label:'A',  color:'#3B82F6', bg:'rgba(59,130,246,0.12)' };
    if (score >= 70) return { label:'B+', color:'#8B5CF6', bg:'rgba(139,92,246,0.12)' };
    if (score >= 60) return { label:'B',  color:'#F59E0B', bg:'rgba(245,158,11,0.12)' };
    if (score >= 40) return { label:'C',  color:'#F97316', bg:'rgba(249,115,22,0.12)' };
    return              { label:'D',  color:'#EF4444', bg:'rgba(239,68,68,0.12)' };
  }
};

window.DashboardPage = DashboardPage;
