// ============================================
// PROFILE PAGE v2 — Tabbed Layout
// Overview | Badges | Wallet | Analytics
// Subject analytics, trends, recommendations
// ============================================

const ProfilePage = {
  _activeTab: 'overview',

  render() {
    const user = Auth.getUser();
    const data = Gamification.getProfileData();
    const userName = user?.username || user?.name || Storage.getUsername() || 'User';
    const tier = data.level;

    const avatarHTML = Icons.get('user', 32);

    return `
      <div class="profile-page container page-enter">

        <!-- Profile Header -->
        <div class="profile-header-card animate-fadeInUp">
          <div class="profile-avatar">${avatarHTML}</div>
          <div class="profile-name">${userName}</div>
          <div class="profile-level">${tier.icon} ${tier.title} — Tier ${tier.level}/5</div>

          <div class="profile-stats-grid">
            <div class="profile-stat">
              <div class="profile-stat-value">${data.streak.current}</div>
              <div class="profile-stat-label">${Icons.get('flame', 12)} Streak</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${data.coins}</div>
              <div class="profile-stat-label">${Icons.get('coins', 12)} Coins</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${data.totalTests}</div>
              <div class="profile-stat-label">${Icons.get('fileText', 12)} Tests</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${data.avgAccuracy}%</div>
              <div class="profile-stat-label">${Icons.get('target', 12)} Avg Acc.</div>
            </div>
          </div>
        </div>

        <!-- XP Progress -->
        <div class="xp-progress-section animate-fadeInUp stagger-1">
          <div class="xp-progress-header">
            <span style="font-weight:var(--font-semibold);color:var(--text-primary);">
              ${tier.icon} ${tier.title}
            </span>
            <span style="color:var(--text-muted);">
              ${tier.xp} / ${tier.nextTierXP} XP
            </span>
          </div>
          <div class="xp-progress-bar">
            <div class="xp-progress-fill" style="width:0%" id="xp-bar-fill" data-target="${tier.progress}"></div>
          </div>
          ${data.graceDays > 0 ? `
            <div style="margin-top:var(--space-2);font-size:var(--text-xs);color:var(--text-muted);">
              ${Icons.get('shield', 14)} ${data.graceDays} Grace Day${data.graceDays > 1 ? 's' : ''} available
            </div>
          ` : ''}
        </div>

        <!-- Tab Navigation -->
        <div class="profile-tabs animate-fadeInUp stagger-2" id="profile-tabs">
          <button class="profile-tab active" data-tab="overview" onclick="ProfilePage.switchTab('overview')">Overview</button>
          <button class="profile-tab" data-tab="badges" onclick="ProfilePage.switchTab('badges')">Badges</button>
          <button class="profile-tab" data-tab="wallet" onclick="ProfilePage.switchTab('wallet')">Wallet</button>
          <button class="profile-tab" data-tab="analytics" onclick="ProfilePage.switchTab('analytics')">Analytics</button>
        </div>

        <!-- Tab Content -->
        <div class="profile-tab-content animate-fadeInUp stagger-3" id="profile-tab-content">
          ${this._renderOverviewTab(data)}
        </div>

        <!-- Actions -->
        <div class="animate-fadeInUp stagger-5" style="display:flex;gap:var(--space-3);margin-top:var(--space-4);">
          <button class="btn btn-primary btn-lg" style="flex:1;" onclick="App.navigate('home')">${Icons.get('home', 16)} Home</button>
          <button class="btn btn-secondary btn-lg" style="flex:1;" onclick="App.navigate('dashboard')">${Icons.get('barChart', 16)} Dashboard</button>
        </div>
      </div>
    `;
  },

  switchTab(tab) {
    this._activeTab = tab;
    const data = Gamification.getProfileData();

    // Update tab buttons
    document.querySelectorAll('.profile-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Update tab content
    const content = document.getElementById('profile-tab-content');
    if (!content) return;

    switch (tab) {
      case 'overview': content.innerHTML = this._renderOverviewTab(data); break;
      case 'badges': content.innerHTML = this._renderBadgesTab(data); break;
      case 'wallet': content.innerHTML = this._renderWalletTab(data); break;
      case 'analytics': content.innerHTML = this._renderAnalyticsTab(data); break;
    }

    // Animate in
    content.style.opacity = '0';
    content.style.transform = 'translateY(8px)';
    requestAnimationFrame(() => {
      content.style.transition = 'opacity 0.3s, transform 0.3s';
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    });

    // Draw chart if analytics tab
    if (tab === 'analytics') {
      setTimeout(() => this._drawTrendChart(data), 100);
    }
  },

  // ── OVERVIEW TAB ──
  _renderOverviewTab(data) {
    const progress = typeof DailySystem !== 'undefined' ? DailySystem.getProgress() : [];
    const totalQuestions = progress.reduce((s, e) => s + (e.total || 0), 0);
    const totalTime = progress.reduce((s, e) => s + (e.timeTaken || 0), 0);

    // Quick subject summary
    const subjects = data.subjects || [];
    const weakSubjects = subjects.filter(s => s.accuracy < 50);
    const strongSubjects = subjects.filter(s => s.accuracy >= 70);

    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4);">
        <div class="card" style="padding:var(--space-4);text-align:center;">
          <div style="font-size:var(--text-2xl);font-weight:var(--font-extrabold);color:var(--text-primary);">${totalQuestions}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">Questions Solved</div>
        </div>
        <div class="card" style="padding:var(--space-4);text-align:center;">
          <div style="font-size:var(--text-2xl);font-weight:var(--font-extrabold);color:var(--text-primary);">${Helpers.formatDuration(totalTime)}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">Time Practiced</div>
        </div>
        <div class="card" style="padding:var(--space-4);text-align:center;">
          <div style="font-size:var(--text-2xl);font-weight:var(--font-extrabold);color:var(--text-primary);">${data.streak.best}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">${Icons.get('trophy', 12)} Best Streak</div>
        </div>
        <div class="card" style="padding:var(--space-4);text-align:center;">
          <div style="font-size:var(--text-2xl);font-weight:var(--font-extrabold);color:var(--text-primary);">${data.graceDays}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">${Icons.get('shield', 12)} Grace Days</div>
        </div>
      </div>

      ${weakSubjects.length > 0 ? `
        <div class="card" style="padding:var(--space-4);border-left:3px solid var(--danger);margin-bottom:var(--space-3);">
          <div style="font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--danger);margin-bottom:var(--space-1);">${Icons.get('alertTriangle', 14)} Needs Work</div>
          <div style="font-size:var(--text-sm);color:var(--text-muted);">${weakSubjects.map(s => `${s.subject} (${s.accuracy}%)`).join(', ')}</div>
        </div>
      ` : ''}

      ${strongSubjects.length > 0 ? `
        <div class="card" style="padding:var(--space-4);border-left:3px solid var(--success);">
          <div style="font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--success);margin-bottom:var(--space-1);">${Icons.get('zap', 14)} Strong Areas</div>
          <div style="font-size:var(--text-sm);color:var(--text-muted);">${strongSubjects.map(s => `${s.subject} (${s.accuracy}%)`).join(', ')}</div>
        </div>
      ` : ''}
    `;
  },

  // ── BADGES TAB ──
  _renderBadgesTab(data) {
    return `
      <div class="badges-grid">
        ${data.rewardDefs.map(r => {
          const unlocked = data.rewards.includes(r.id);
          return `
            <div class="badge-card ${unlocked ? 'unlocked' : 'locked'}">
              <div class="badge-icon">${Icons.get(r.iconKey, 28)}</div>
              <div class="badge-name">${r.title}</div>
              <div class="badge-desc">${r.desc}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // ── WALLET TAB ──
  _renderWalletTab(data) {
    const log = (typeof Gamification !== 'undefined' && Gamification.getCoinLog)
      ? (Gamification.getCoinLog ? Gamification.getCoinLog() : [])
      : [];

    // Use coin transactions from cached profile if available
    return `
      <div class="card" style="padding:var(--space-5);text-align:center;margin-bottom:var(--space-4);">
        <div style="font-size:40px;margin-bottom:var(--space-2);">${Icons.get('wallet', 40)}</div>
        <div style="font-size:var(--text-3xl);font-weight:var(--font-extrabold);color:var(--text-primary);">${data.coins}</div>
        <div style="font-size:var(--text-sm);color:var(--text-muted);">Current Balance</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-3);margin-bottom:var(--space-4);">
        <div class="card" style="padding:var(--space-4);text-align:center;">
          <div style="font-size:var(--text-xl);font-weight:var(--font-bold);color:var(--success);">${data.level.xp}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">Total XP</div>
        </div>
        <div class="card" style="padding:var(--space-4);text-align:center;">
          <div style="font-size:var(--text-xl);font-weight:var(--font-bold);color:var(--primary);">${data.level.level}/5</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">Current Tier</div>
        </div>
      </div>

      <h4 style="font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);margin-bottom:var(--space-3);">Recent Activity</h4>
      <div class="coin-log-list">
        ${this._renderCoinLog(data)}
      </div>
    `;
  },

  // ── ANALYTICS TAB ──
  _renderAnalyticsTab(data) {
    const subjects = data.subjects || [];
    const recommendations = Gamification.getRecommendations();
    const trends = data.trends || [];

    return `
      <!-- Trend Chart -->
      <div class="card" style="padding:var(--space-4);margin-bottom:var(--space-4);">
        <h4 style="font-size:var(--text-sm);font-weight:var(--font-semibold);margin-bottom:var(--space-3);">${Icons.get('trendingUp', 16)} Score Trend (Last 15 Tests)</h4>
        ${trends.length >= 2 ? `
          <div style="height:160px;position:relative;">
            <canvas id="profile-trend-chart" style="width:100%;height:100%;display:block;"></canvas>
          </div>
        ` : `
          <div style="text-align:center;padding:var(--space-6);color:var(--text-muted);font-size:var(--text-sm);">
            Take 2+ tests to see your trend graph
          </div>
        `}
      </div>

      <!-- Subject Breakdown -->
      ${subjects.length > 0 ? `
        <div class="card" style="padding:var(--space-4);margin-bottom:var(--space-4);">
          <h4 style="font-size:var(--text-sm);font-weight:var(--font-semibold);margin-bottom:var(--space-3);">${Icons.get('barChart', 16)} Subject Analytics</h4>
          <div style="display:flex;flex-direction:column;gap:var(--space-3);">
            ${subjects.map(s => {
              const barColor = s.accuracy >= 70 ? 'var(--success)' : s.accuracy >= 40 ? 'var(--warning)' : 'var(--danger)';
              const statusDot = s.accuracy >= 70 ? '●' : s.accuracy >= 40 ? '●' : '●';
              return `
                <div>
                  <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-1);font-size:var(--text-sm);">
                    <span style="font-weight:var(--font-semibold);"><span style="color:${barColor};font-size:10px;">${statusDot}</span> ${s.subject}</span>
                    <span style="color:${barColor};font-weight:var(--font-bold);">${s.accuracy}%
                      <span style="color:var(--text-muted);font-weight:normal;">(${s.correct}/${(s.correct || 0) + (s.wrong || 0)})</span>
                    </span>
                  </div>
                  <div style="height:6px;background:var(--bg-glass);border-radius:var(--radius-full);overflow:hidden;">
                    <div style="height:100%;width:${s.accuracy}%;background:${barColor};border-radius:var(--radius-full);transition:width 0.8s ease-out;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Smart Recommendations -->
      ${recommendations.length > 0 ? `
        <div class="card" style="padding:var(--space-4);">
          <h4 style="font-size:var(--text-sm);font-weight:var(--font-semibold);margin-bottom:var(--space-3);">${Icons.get('brain', 16)} Recommendations</h4>
          <div style="display:flex;flex-direction:column;gap:var(--space-3);">
            ${recommendations.map(r => {
              const borderColor = r.priority === 'high' ? 'var(--danger)' : r.priority === 'positive' ? 'var(--success)' : 'var(--warning)';
              return `
                <div style="padding:var(--space-3);border-left:3px solid ${borderColor};background:var(--bg-glass);border-radius:var(--radius-md);">
                  <div style="font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);">
                    ${r.icon} ${r.title}
                  </div>
                  <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--space-1);">${r.desc}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : `
        <div style="text-align:center;padding:var(--space-6);color:var(--text-muted);font-size:var(--text-sm);">
          Take more tests to unlock personalized recommendations
        </div>
      `}
    `;
  },

  _renderCoinLog(data) {
    // Try local log first, then server data
    let log = [];
    try {
      const raw = localStorage.getItem('mtp_coin_log');
      if (raw) log = JSON.parse(raw).slice(-10).reverse();
    } catch(e) {}

    if (log.length === 0) {
      return '<div style="text-align:center;padding:var(--space-6);color:var(--text-muted);font-size:var(--text-sm);">No coin activity yet. Complete a test to earn coins!</div>';
    }

    return log.map(entry => {
      const isPositive = entry.amount > 0;
      const timeAgo = this._timeAgo(entry.ts);
      return `
        <div class="coin-log-item">
          <div class="coin-log-reason">${entry.reason || entry.type}</div>
          <div style="display:flex;align-items:center;gap:var(--space-3);">
            <span style="font-size:var(--text-xs);color:var(--text-muted);">${timeAgo}</span>
            <span class="coin-log-amount ${isPositive ? 'positive' : 'negative'}">
              ${isPositive ? '+' : ''}${entry.amount} 💰
            </span>
          </div>
        </div>
      `;
    }).join('');
  },

  _timeAgo(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  },

  _drawTrendChart(data) {
    const canvas = document.getElementById('profile-trend-chart');
    if (!canvas) return;

    const trends = (data.trends || []).reverse(); // oldest first
    if (trends.length < 2) return;

    const scores = trends.map(t => t.score_percent);
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const w = rect.width, h = rect.height;
    const padding = { top: 10, right: 10, bottom: 20, left: 30 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxVal = Math.max(...scores, 100);
    const minVal = Math.min(...scores, 0);
    const range = maxVal - minVal || 1;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();

      // Label
      const val = Math.round(maxVal - (range / 4) * i);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(val + '%', padding.left - 5, y + 4);
    }

    // Plot line
    const points = scores.map((score, i) => ({
      x: padding.left + (chartW / (scores.length - 1)) * i,
      y: padding.top + chartH - ((score - minVal) / range) * chartH
    }));

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, h);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, h - padding.bottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.strokeStyle = '#6366F1';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Dots
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#6366F1';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    });
  },

  afterRender() {
    // Animate XP bar
    setTimeout(() => {
      const bar = document.getElementById('xp-bar-fill');
      if (bar) bar.style.width = bar.dataset.target + '%';
    }, 400);

    // Load fresh data from server
    if (typeof Gamification !== 'undefined' && Gamification.loadProfileFromServer) {
      Gamification.loadProfileFromServer().then(() => {
        // Refresh current tab with fresh data
        const data = Gamification.getProfileData();
        const content = document.getElementById('profile-tab-content');
        if (content && this._activeTab === 'overview') {
          content.innerHTML = this._renderOverviewTab(data);
        }
      });
    }
  }
};
