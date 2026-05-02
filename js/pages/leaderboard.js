// ============================================
// LEADERBOARD PAGE — Direct Supabase
// No API route needed, queries DB directly
// ============================================

const LeaderboardPage = {
  render() {
    return `
      <div class="leaderboard-page page-enter">
        <div class="leaderboard-header">
          <h1 class="animate-fadeInDown">🏆 ${Lang.t('nav_leaderboard')}</h1>
          <p class="animate-fadeInDown stagger-1" style="color: var(--text-secondary); margin-top: var(--space-2);">
            Best scores from all players. Can you reach the top?
          </p>
        </div>

        <div id="leaderboard-content" style="margin-top: 30px; max-width: 600px; margin-left: auto; margin-right: auto;">
          <div style="text-align: center; padding: 40px;">
            <div class="splash-spinner" style="width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.1); border-top-color: var(--primary, #6366f1); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;"></div>
            <p style="color: var(--text-secondary); margin-top: 15px;">Loading ranks...</p>
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    const container = document.getElementById('leaderboard-content');
    try {
      let leaderboard = [];

      // Try direct Supabase fetch first (faster, no server needed)
      if (window.fetchLeaderboard) {
        leaderboard = await window.fetchLeaderboard();
      } else {
        // Fallback to API route
        const resp = await fetch("/api/leaderboard");
        const data = await resp.json();
        if (data.success) leaderboard = data.leaderboard || [];
      }

      if (!leaderboard || leaderboard.length === 0) {
        container.innerHTML = `
          <div style="text-align:center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🏆</div>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">No scores yet. Take a test to be the first!</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">Start a Test</button>
          </div>
        `;
        return;
      }

      const myUsername = Storage.getUsername();
      const myRank = leaderboard.find(u => u.username === myUsername);

      let html = '';

      // My rank card (if found)
      if (myRank) {
        html += `
          <div class="card animate-fadeInUp" style="margin-bottom: 20px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(59, 130, 246, 0.1)); border: 1px solid rgba(99, 102, 241, 0.3);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">YOUR RANK</div>
                <div style="font-size: 28px; font-weight: 800; color: var(--primary-light);">#${myRank.rank}</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">BEST SCORE</div>
                <div style="font-size: 28px; font-weight: 800; color: var(--success-light);">${Math.round(myRank.best_score)}%</div>
              </div>
            </div>
          </div>
        `;
      }

      // Leaderboard list
      html += '<div class="animate-fadeInUp stagger-2" style="background: var(--bg-card); border-radius: 14px; border: 1px solid var(--border-color); overflow: hidden;">';

      leaderboard.forEach(user => {
        const isMe = user.username === myUsername;
        let rankDisplay = `<span style="font-weight: 700; color: var(--text-muted);">${user.rank}</span>`;
        if (user.rank === 1) rankDisplay = '🥇';
        if (user.rank === 2) rankDisplay = '🥈';
        if (user.rank === 3) rankDisplay = '🥉';

        const scoreColor = user.best_score >= 80 ? 'var(--success-light)' :
                          user.best_score >= 60 ? 'var(--warning)' : 'var(--danger-light)';

        html += `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); ${isMe ? 'background: rgba(99, 102, 241, 0.08);' : ''}">
            <div style="display: flex; align-items: center; gap: 14px;">
              <div style="width: 32px; font-size: 18px; text-align: center;">${rankDisplay}</div>
              <div>
                <div style="font-size: 14px; color: ${isMe ? 'var(--primary-light)' : 'var(--text-primary)'}; font-weight: ${isMe ? '700' : '500'};">
                  ${user.username} ${isMe ? '<span style="font-size: 11px; background: rgba(99,102,241,0.2); padding: 1px 6px; border-radius: 4px; color: var(--primary-light);">YOU</span>' : ''}
                </div>
              </div>
            </div>
            <div style="font-size: 15px; color: ${scoreColor}; font-weight: 700;">
              ${Math.round(user.best_score)}%
            </div>
          </div>
        `;
      });
      html += '</div>';
      container.innerHTML = html;

    } catch (err) {
      container.innerHTML = `
        <div style="text-align:center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
          <p style="color: var(--text-secondary);">Failed to load leaderboard.</p>
          <button class="btn btn-secondary" onclick="LeaderboardPage.afterRender()" style="margin-top: 12px;">Retry</button>
        </div>
      `;
      console.error("Leaderboard error:", err);
    }
  }
};
