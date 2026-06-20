// ============================================
// LEADERBOARD PAGE v2 — Premium Design
// Ranking badges, streaks, avatars, filters
// Daily / Weekly / All-time modes
// ============================================

const AVATAR_EMOJIS = {
  default: null, boy1: null, boy2: null, boy3: null,
  girl1: null, girl2: null, girl3: null,
  ninja: null, astronaut: null, robot: null,
  cat: null, dog: null, panda: null, fox: null,
  _get(key) { return Icons.get('user', 20); }
};

const RANK_BADGES = {
  1: { icon: 'crown', label: 'Champion', color: '#FFD700', glow: 'rgba(255, 215, 0, 0.3)' },
  2: { icon: 'award', label: 'Runner Up', color: '#C0C0C0', glow: 'rgba(192, 192, 192, 0.3)' },
  3: { icon: 'medal', label: 'Bronze', color: '#CD7F32', glow: 'rgba(205, 127, 50, 0.3)' }
};

const LeaderboardPage = {
  _currentMode: 'alltime',

  render() {
    return `
      <div class="leaderboard-page page-enter">
        <div class="leaderboard-header">
          <h1 class="animate-fadeInDown">${Icons.get('trophy', 24)} ${Lang.t('nav_leaderboard')}</h1>
          <p class="animate-fadeInDown stagger-1" style="color: var(--text-secondary); margin-top: var(--space-2);">
            Compete with all players. Can you reach the top?
          </p>
        </div>

        <!-- Filter Tabs -->
        <div class="leaderboard-filters animate-fadeInUp stagger-1" style="display: flex; gap: 8px; justify-content: center; margin-top: 20px;">
          <button class="lb-filter-btn ${this._currentMode === 'alltime' ? 'active' : ''}" onclick="LeaderboardPage.switchMode('alltime', this)">
            ${Icons.get('star', 14)} All Time
          </button>
          <button class="lb-filter-btn ${this._currentMode === 'weekly' ? 'active' : ''}" onclick="LeaderboardPage.switchMode('weekly', this)">
            ${Icons.get('calendar', 14)} This Week
          </button>
          <button class="lb-filter-btn ${this._currentMode === 'daily' ? 'active' : ''}" onclick="LeaderboardPage.switchMode('daily', this)">
            ${Icons.get('zap', 14)} Today
          </button>
        </div>

        <div id="leaderboard-content" style="margin-top: 24px; max-width: 640px; margin-left: auto; margin-right: auto;">
          <div style="text-align: center; padding: 40px;">
            <div class="splash-spinner" style="width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.1); border-top-color: var(--primary, #6366f1); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;"></div>
            <p style="color: var(--text-secondary); margin-top: 15px;">Loading ranks...</p>
          </div>
        </div>
      </div>
    `;
  },

  switchMode(mode, btnEl) {
    this._currentMode = mode;
    // Update active button
    document.querySelectorAll('.lb-filter-btn').forEach(btn => btn.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    // Reload
    this.afterRender();
  },

  async afterRender() {
    const container = document.getElementById('leaderboard-content');
    if (!container) return;

    // Show loading
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <div class="splash-spinner" style="width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.1); border-top-color: var(--primary, #6366f1); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;"></div>
        <p style="color: var(--text-secondary); margin-top: 15px;">Loading ranks...</p>
      </div>
    `;

    try {
      const mode = this._currentMode;
      let leaderboard = [];

      // Direct Supabase fetch (test_attempts + users)
      if (window.fetchLeaderboard) {
        try {
          leaderboard = await window.fetchLeaderboard(mode);
        } catch (err) {
          console.error("Leaderboard fetch failed:", err.message);
        }
      }

      if (!leaderboard || leaderboard.length === 0) {
        const modeLabel = mode === 'daily' ? 'today' : mode === 'weekly' ? 'this week' : 'yet';
        container.innerHTML = `
          <div style="text-align:center; padding: 40px;">
            <div style="font-size: 64px; margin-bottom: 16px;">${Icons.get('trophy', 48)}</div>
            <p style="color: var(--text-secondary); margin-bottom: 8px; font-size: 16px; font-weight: 600;">No scores ${modeLabel}</p>
            <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 13px;">Take a test to be the first on the board!</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">${Icons.get('rocket', 14)} Start a Test</button>
          </div>
        `;
        return;
      }

      const user = Auth.getUser();
      const myUsername = user?.username || Storage.getUsername();
      const myEntry = leaderboard.find(u => u.username === myUsername);

      let html = '';

      // ── Top 3 Podium ──
      if (leaderboard.length >= 3) {
        const top3 = leaderboard.slice(0, 3);
        html += `<div class="podium-section animate-fadeInUp">`;
        // Display order: 2nd, 1st, 3rd
        const podiumOrder = [top3[1], top3[0], top3[2]];
        const podiumClasses = ['podium-second', 'podium-first', 'podium-third'];

        html += '<div class="podium-grid">';
        podiumOrder.forEach((user, idx) => {
          if (!user) return;
          const badge = RANK_BADGES[user.rank];
          const avatarIcon = Icons.get('user', 20);
          const isMe = user.username === myUsername;

          html += `
            <div class="podium-card ${podiumClasses[idx]} ${isMe ? 'podium-me' : ''}">
              <div class="podium-rank-badge" style="color: ${badge.color};">${Icons.get(badge.icon, 28)}</div>
              <div class="podium-avatar">${avatarIcon}</div>
              <div class="podium-name ${isMe ? 'is-me' : ''}">${user.username}${isMe ? ' (You)' : ''}</div>
              <div class="podium-score" style="color: ${badge.color};">${Math.round(user.best_score)}%</div>
              ${user.streak > 0 ? `<div class="podium-streak">${Icons.get('flame', 12)} ${user.streak}d streak</div>` : ''}
              <div class="podium-tests">${user.total_tests || 0} tests</div>
            </div>
          `;
        });
        html += '</div></div>';
      }

      // ── My Rank Card (if not in top 3) ──
      if (myEntry && myEntry.rank > 3) {
        html += `
          <div class="my-rank-card animate-fadeInUp stagger-2">
            <div class="my-rank-left">
              <div class="my-rank-badge">#${myEntry.rank}</div>
              <div>
                <div class="my-rank-label">YOUR RANK</div>
                <div class="my-rank-name">${myEntry.username}</div>
              </div>
            </div>
            <div class="my-rank-right">
              <div class="my-rank-score">${Math.round(myEntry.best_score)}%</div>
              ${myEntry.streak > 0 ? `<div class="my-rank-streak">${Icons.get('flame', 12)} ${myEntry.streak}d</div>` : ''}
            </div>
          </div>
        `;
      }

      // ── Full Leaderboard List (skip top 3 in podium, or show all if < 3 entries) ──
      const listStart = leaderboard.length >= 3 ? 3 : 0;
      if (leaderboard.length > listStart) {
        html += '<div class="lb-list animate-fadeInUp stagger-3">';

        leaderboard.slice(listStart).forEach(user => {
          const isMe = user.username === myUsername;
          const avatarIcon = Icons.get('user', 18);
          const scoreColor = user.best_score >= 80 ? 'var(--success-light)' :
            user.best_score >= 60 ? 'var(--warning)' : 'var(--danger-light)';

          // Rank-based tier styling
          let tierClass = '';
          if (user.rank <= 5) tierClass = 'lb-tier-gold';
          else if (user.rank <= 10) tierClass = 'lb-tier-silver';
          else if (user.rank <= 20) tierClass = 'lb-tier-bronze';

          html += `
            <div class="lb-row ${isMe ? 'lb-row-me' : ''} ${tierClass}">
              <div class="lb-row-left">
                <div class="lb-rank">${user.rank}</div>
                <div class="lb-avatar">${avatarIcon}</div>
                <div class="lb-info">
                  <div class="lb-name">
                    ${user.username}
                    ${isMe ? '<span class="lb-you-tag">YOU</span>' : ''}
                  </div>
                  <div class="lb-meta">
                    ${user.total_tests || 0} tests
                    ${user.streak > 0 ? `· ${Icons.get('flame', 10)}${user.streak}d` : ''}
                  </div>
                </div>
              </div>
              <div class="lb-score" style="color: ${scoreColor};">
                ${Math.round(user.best_score)}%
              </div>
            </div>
          `;
        });

        html += '</div>';
      }

      container.innerHTML = html;

    } catch (err) {
      container.innerHTML = `
        <div style="text-align:center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">${Icons.get('alertTriangle', 40)}</div>
          <p style="color: var(--text-secondary);">Failed to load leaderboard.</p>
          <button class="btn btn-secondary" onclick="LeaderboardPage.afterRender()" style="margin-top: 12px;">Retry</button>
        </div>
      `;
      console.error("Leaderboard error:", err);
    }
  }
};
