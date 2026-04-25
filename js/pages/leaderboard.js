// ============================================
// LEADERBOARD PAGE
// Simple UI showing top 50 users by best score
// ============================================

const LeaderboardPage = {
  render() {
    return `
      <div class="leaderboard-page page-enter">
        <div class="leaderboard-header">
          <h1 class="animate-fadeInDown">🏆 Top Scorers</h1>
          <p class="animate-fadeInDown stagger-1" style="color: var(--text-secondary); margin-top: var(--space-2);">
            Compete and see where you stand!
          </p>
        </div>

        <div id="leaderboard-content" style="margin-top: 30px;">
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
      const resp = await fetch("/api/leaderboard");
      const data = await resp.json();
      
      if (!data.success) throw new Error(data.error);

      if (!data.leaderboard || data.leaderboard.length === 0) {
         container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-secondary);">No scores yet. Take a test to be the first!</div>`;
         return;
      }

      const myUsername = Storage.getUsername();

      let html = '<div class="leaderboard-list animate-fadeInUp stagger-2" style="background: var(--bg-surface); border-radius: 12px; border: 1px solid var(--border-light); overflow: hidden;">';
      
      data.leaderboard.forEach(user => {
         const isMe = user.username === myUsername;
         let rankMedal = user.rank;
         if (user.rank === 1) rankMedal = '🥇';
         if (user.rank === 2) rankMedal = '🥈';
         if (user.rank === 3) rankMedal = '🥉';

         html += `
           <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border-light); ${isMe ? 'background: rgba(99, 102, 241, 0.1);' : ''}">
             <div style="display: flex; align-items: center; gap: 15px;">
               <div style="width: 30px; font-size: 18px; text-align: center; color: var(--text-secondary); font-weight: bold;">${rankMedal}</div>
               <div style="font-size: 16px; color: ${isMe ? 'var(--primary)' : 'var(--text-primary)'}; font-weight: ${isMe ? 'bold' : 'normal'};">
                 ${user.username} ${isMe ? '(You)' : ''}
               </div>
             </div>
             <div style="font-size: 16px; color: var(--primary); font-weight: bold;">
               ${Math.round(user.best_score)}%
             </div>
           </div>
         `;
      });
      html += '</div>';
      container.innerHTML = html;
      
    } catch (err) {
      container.innerHTML = `<div style="text-align:center; padding: 40px; color: var(--text-error);">Failed to load leaderboard. Please try again.</div>`;
      console.error(err);
    }
  }
};
