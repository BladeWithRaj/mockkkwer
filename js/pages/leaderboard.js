// ============================================
// LEADERBOARD PAGE — DEPRECATED
// This page has been removed. All navigation
// to 'leaderboard' is redirected to 'dashboard'
// via App.navigate() redirect in app.js
// ============================================

const LeaderboardPage = {
  render() {
    // Immediately redirect to dashboard
    requestAnimationFrame(() => App.navigate('dashboard'));
    return '<div style="display:none"></div>';
  },
  afterRender() {}
};

window.LeaderboardPage = LeaderboardPage;
