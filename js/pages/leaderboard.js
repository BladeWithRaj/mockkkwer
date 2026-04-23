// ============================================
// LEADERBOARD PAGE v3 — Seasonal Competition
// Podium, animated table, pagination, user rank,
// seasonal tabs, "under review" status
// ============================================

const LeaderboardPage = {
  _data: null,
  _loading: true,
  _error: null,
  _page: 1,
  _limit: 20,
  _season: "alltime",

  render() {
    return `
      <div class="leaderboard-page page-enter">
        <section class="container">
          <!-- Header -->
          <div class="lb-header animate-fadeInDown">
            <div class="lb-title-row">
              <h1 class="lb-title">
                <span class="lb-icon">🏆</span>
                <span>Leader<span class="gradient-text">board</span></span>
              </h1>
              <div class="lb-badge">
                <span class="dot"></span>
                <span>Live Rankings</span>
              </div>
            </div>
            <p class="lb-subtitle">Top performers across all tests. Minimum 10 tests to qualify. Median-based scoring.</p>
          </div>

          <!-- Season Tabs -->
          <div class="lb-season-tabs animate-fadeInUp stagger-1" id="lb-season-tabs">
            <button class="lb-season-tab ${this._season === 'weekly' ? 'active' : ''}" onclick="LeaderboardPage._setSeason('weekly')">
              📅 This Week
            </button>
            <button class="lb-season-tab ${this._season === 'monthly' ? 'active' : ''}" onclick="LeaderboardPage._setSeason('monthly')">
              🗓️ This Month
            </button>
            <button class="lb-season-tab ${this._season === 'alltime' ? 'active' : ''}" onclick="LeaderboardPage._setSeason('alltime')">
              🌍 All Time
            </button>
          </div>

          <!-- Your Rank Card -->
          <div id="lb-my-rank" class="animate-fadeInUp stagger-2"></div>

          <!-- Leaderboard Table -->
          <div id="lb-table-wrap" class="animate-fadeInUp stagger-3">
            <div class="lb-loading">
              <div class="splash-spinner" style="width:36px;height:36px;border:3px solid var(--bg-glass);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite;"></div>
              <p style="color:var(--text-secondary);margin-top:var(--space-3);">Loading rankings...</p>
            </div>
          </div>
        </section>
      </div>
    `;
  },

  async afterRender() {
    this._page = 1;
    await this._fetchAndRender();
  },

  async _setSeason(season) {
    this._season = season;
    this._page = 1;

    // Update tab UI immediately
    document.querySelectorAll('.lb-season-tab').forEach(tab => tab.classList.remove('active'));
    const tabs = document.querySelectorAll('.lb-season-tab');
    const idx = { weekly: 0, monthly: 1, alltime: 2 }[season];
    if (tabs[idx]) tabs[idx].classList.add('active');

    // Show loading
    const wrap = document.getElementById("lb-table-wrap");
    if (wrap) {
      wrap.innerHTML = `
        <div class="lb-loading">
          <div class="splash-spinner" style="width:28px;height:28px;border:2px solid var(--bg-glass);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite;"></div>
        </div>
      `;
    }

    await this._fetchAndRender();
  },

  async _fetchAndRender() {
    try {
      const headers = { "Content-Type": "application/json" };
      try {
        const { data: { session } } = await client.auth.getSession();
        if (session?.access_token) {
          headers["Authorization"] = "Bearer " + session.access_token;
        }
      } catch (_) {}

      const resp = await fetch(
        `/api/leaderboard?page=${this._page}&limit=${this._limit}&season=${this._season}`,
        { headers }
      );
      if (!resp.ok) throw new Error("Failed to load leaderboard");

      this._data = await resp.json();
      this._loading = false;
      this._renderData();

    } catch (err) {
      this._error = err.message;
      this._loading = false;
      this._renderError();
    }
  },

  _renderData() {
    const { leaderboard, myRank, myStatus, pagination, minTestsRequired, season } = this._data;

    // ── Your Rank Card ──
    const myRankEl = document.getElementById("lb-my-rank");
    if (myRankEl) {
      if (myRank && myRank.status === "ranked") {
        myRankEl.innerHTML = `
          <div class="lb-my-rank-card">
            <div class="lb-my-rank-left">
              <div class="lb-my-rank-position">#${myRank.rank}</div>
              <div class="lb-my-rank-info">
                <div class="lb-my-rank-label">Your Rank</div>
                <div class="lb-my-rank-detail">
                  Score: ${myRank.adjustedScore}% · Median: ${myRank.medianScore}% · Best: ${myRank.bestScore}% · ${myRank.totalTests} tests
                </div>
              </div>
            </div>
            <div class="lb-my-rank-score">${myRank.adjustedScore}<span style="font-size:var(--text-sm);color:var(--text-muted);">%</span></div>
          </div>
        `;
      } else if (myRank && myRank.status === "under_review") {
        myRankEl.innerHTML = `
          <div class="lb-my-rank-card lb-flagged">
            <div class="lb-my-rank-left">
              <div class="lb-my-rank-position">⚠️</div>
              <div class="lb-my-rank-info">
                <div class="lb-my-rank-label">Under Review</div>
                <div class="lb-my-rank-detail">${myRank.message}</div>
              </div>
            </div>
            <div class="lb-my-rank-score" style="color:var(--warning);">${myRank.adjustedScore}<span style="font-size:var(--text-sm);color:var(--text-muted);">%</span></div>
          </div>
        `;
      } else {
        myRankEl.innerHTML = `
          <div class="lb-my-rank-card lb-unranked">
            <div class="lb-my-rank-left">
              <div class="lb-my-rank-position">—</div>
              <div class="lb-my-rank-info">
                <div class="lb-my-rank-label">Not Ranked Yet</div>
                <div class="lb-my-rank-detail">Complete at least ${minTestsRequired} tests to appear on the leaderboard</div>
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="App.navigate('setup')">Take a Test</button>
          </div>
        `;
      }
    }

    // ── Table ──
    const wrap = document.getElementById("lb-table-wrap");
    if (!wrap) return;

    const seasonLabel = { weekly: "This Week", monthly: "This Month", alltime: "All Time" }[season] || season;

    if (leaderboard.length === 0 && pagination.page === 1) {
      wrap.innerHTML = `
        <div class="lb-empty">
          <div style="font-size:48px;margin-bottom:var(--space-4);">🏅</div>
          <h3 style="color:var(--text-primary);margin-bottom:var(--space-2);">No Rankings for ${seasonLabel}</h3>
          <p style="color:var(--text-muted);">Be the first to qualify! Complete ${minTestsRequired} tests to appear here.</p>
          <button class="btn btn-primary" onclick="App.navigate('setup')" style="margin-top:var(--space-4);">Start Testing</button>
        </div>
      `;
      return;
    }

    wrap.innerHTML = `
      <div class="lb-stats-bar">
        <span>${pagination.totalQualified} qualified · ${seasonLabel}</span>
        <span>Median scoring · Min ${minTestsRequired} tests</span>
      </div>

      ${pagination.page === 1 && leaderboard.length >= 3 ? this._renderPodium(leaderboard.slice(0, 3)) : ''}

      <div class="lb-table">
        <div class="lb-table-header">
          <span class="lb-col-rank">Rank</span>
          <span class="lb-col-user">Player</span>
          <span class="lb-col-score">Score</span>
          <span class="lb-col-tests">Tests</span>
          <span class="lb-col-best">Best</span>
        </div>
        ${leaderboard.map((entry, i) => this._renderRow(entry, i)).join('')}
      </div>

      ${pagination.totalPages > 1 ? this._renderPagination(pagination) : ''}
    `;
  },

  _renderPodium(top3) {
    const medals = ['🥇', '🥈', '🥉'];
    const heights = ['140px', '110px', '90px'];
    const order = [1, 0, 2];

    return `
      <div class="lb-podium">
        ${order.map(idx => {
          const e = top3[idx];
          if (!e) return '';
          return `
            <div class="lb-podium-item lb-podium-${idx + 1}">
              <div class="lb-podium-medal">${medals[idx]}</div>
              <div class="lb-podium-avatar">${this._getAvatar(e.user_id)}</div>
              <div class="lb-podium-name">${this._getDisplayName(e.user_id)}</div>
              <div class="lb-podium-score">${e.adjustedScore}%</div>
              <div class="lb-podium-tests">${e.totalTests} tests</div>
              <div class="lb-podium-bar" style="height:${heights[idx]};"></div>
              <div class="lb-podium-rank">#${e.rank}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  _renderRow(entry, index) {
    const isMe = Auth.getUser() && Auth.getUser().id === entry.user_id;
    const medal = entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : '';

    return `
      <div class="lb-row ${isMe ? 'lb-row-me' : ''} animate-fadeInUp" style="animation-delay:${index * 50}ms;">
        <span class="lb-col-rank">
          ${medal ? `<span class="lb-medal">${medal}</span>` : `<span class="lb-rank-num">${entry.rank}</span>`}
        </span>
        <span class="lb-col-user">
          <span class="lb-user-avatar">${this._getAvatar(entry.user_id)}</span>
          <span class="lb-user-name">${isMe ? '⭐ You' : this._getDisplayName(entry.user_id)}</span>
        </span>
        <span class="lb-col-score lb-score-value">${entry.adjustedScore}%</span>
        <span class="lb-col-tests">${entry.totalTests}</span>
        <span class="lb-col-best">${entry.bestScore}%</span>
      </div>
    `;
  },

  _renderPagination(p) {
    return `
      <div class="lb-pagination">
        <button class="btn btn-ghost btn-sm" ${p.page <= 1 ? 'disabled' : ''}
                onclick="LeaderboardPage._goToPage(${p.page - 1})">← Prev</button>
        <span class="lb-page-info">Page ${p.page} of ${p.totalPages}</span>
        <button class="btn btn-ghost btn-sm" ${p.page >= p.totalPages ? 'disabled' : ''}
                onclick="LeaderboardPage._goToPage(${p.page + 1})">Next →</button>
      </div>
    `;
  },

  async _goToPage(page) {
    this._page = page;
    const wrap = document.getElementById("lb-table-wrap");
    if (wrap) {
      wrap.innerHTML = `
        <div class="lb-loading">
          <div class="splash-spinner" style="width:28px;height:28px;border:2px solid var(--bg-glass);border-top-color:var(--primary);border-radius:50%;animation:spin .8s linear infinite;"></div>
        </div>
      `;
    }
    await this._fetchAndRender();
  },

  _getAvatar(uid) {
    const emojis = ['🦊', '🐯', '🦁', '🐺', '🦅', '🐉', '🦈', '🐬', '🦉', '🐝', '🦋', '🐢', '🦩', '🐙', '🦎', '🐧'];
    const hash = uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return emojis[hash % emojis.length];
  },

  _getDisplayName(uid) {
    if (Auth.getUser() && Auth.getUser().id === uid && Auth.getUser().email) {
      return Auth.getUser().email.split("@")[0];
    }
    const adjectives = ['Swift', 'Bold', 'Sharp', 'Quick', 'Keen', 'Wise', 'Cool', 'Ace', 'Pro', 'Top'];
    const nouns = ['Fox', 'Hawk', 'Tiger', 'Wolf', 'Eagle', 'Bear', 'Lion', 'Owl', 'Shark', 'Lynx'];
    const hash = uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return adjectives[hash % adjectives.length] + nouns[(hash >> 3) % nouns.length];
  },

  _renderError() {
    const wrap = document.getElementById("lb-table-wrap");
    if (wrap) {
      wrap.innerHTML = `
        <div class="lb-empty">
          <div style="font-size:48px;margin-bottom:var(--space-4);">⚠️</div>
          <h3 style="color:var(--text-primary);margin-bottom:var(--space-2);">Failed to Load</h3>
          <p style="color:var(--text-muted);">${this._error}</p>
          <button class="btn btn-primary" onclick="App.navigate('leaderboard')" style="margin-top:var(--space-4);">Retry</button>
        </div>
      `;
    }
  }
};
