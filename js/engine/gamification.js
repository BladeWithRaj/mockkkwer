// ============================================
// GAMIFICATION ENGINE v2 — Display-Only Mode
// Backend is the SINGLE SOURCE OF TRUTH.
// Frontend only: displays, caches, animates.
// ============================================

const Gamification = {

  // ═══════════════════════════════════════════
  //  LEVEL SYSTEM (Doc 9 §4)
  //  Names reflect preparation maturity, not childish gamification.
  //  Backend stores tier 1–5; UI shows level 1–30 display.
  // ═══════════════════════════════════════════

  TIERS: [
    { level: 1, title: 'Explorer',           xpRequired: 0,     iconKey: 'sprout' },
    { level: 2, title: 'Consistent Learner',  xpRequired: 500,   iconKey: 'bookOpen' },
    { level: 3, title: 'Focused Aspirant',    xpRequired: 2000,  iconKey: 'zap' },
    { level: 4, title: 'Exam Strategist',     xpRequired: 5000,  iconKey: 'flame' },
    { level: 5, title: 'Elite Aspirant',      xpRequired: 12000, iconKey: 'crown' }
  ],

  // ═══════════════════════════════════════════
  //  ACHIEVEMENT CATEGORIES (Doc 9 §5)
  //  5 categories, 15 achievements total.
  //  category field enables grouped display in profile page.
  // ═══════════════════════════════════════════

  BADGE_DEFS: [
    // Practice
    { id: 'first_mock',   title: 'First Mock',       iconKey: 'fileText',    desc: 'Complete your first mock test',     category: 'practice' },
    { id: 'tests_10',     title: '10 Mocks',          iconKey: 'target',      desc: 'Complete 10 mock tests',            category: 'practice' },
    { id: 'tests_100',    title: '100 Mocks',         iconKey: 'trophy',      desc: 'Complete 100 mock tests',           category: 'practice' },
    // Consistency
    { id: 'streak_7',     title: '7-Day Streak',      iconKey: 'flame',       desc: '7 consecutive days of study',       category: 'consistency' },
    { id: 'streak_30',    title: '30-Day Streak',     iconKey: 'award',       desc: '30 consecutive days of study',      category: 'consistency' },
    { id: 'streak_100',   title: '100-Day Streak',    iconKey: 'crown',       desc: '100 consecutive days of study',     category: 'consistency' },
    // Revision
    { id: 'first_review', title: 'First Revision',    iconKey: 'bookOpen',    desc: 'Complete your first revision session', category: 'revision' },
    { id: 'cards_100',    title: '100 Flashcards',    iconKey: 'star',        desc: 'Review 100 flashcards',             category: 'revision' },
    // Performance
    { id: 'score_90',     title: '90% Accuracy',      iconKey: 'checkCircle', desc: 'Score 90%+ in any mock test',       category: 'performance' },
    { id: 'personal_best',title: 'Personal Best',     iconKey: 'trendingUp',  desc: 'Beat your previous best score',     category: 'performance' },
    { id: 'combo_10',     title: 'Combo Master',      iconKey: 'zap',         desc: '10 correct answers in a row',       category: 'performance' },
    { id: 'speed_demon',  title: 'Speed Demon',       iconKey: 'zap',         desc: 'Finish test in <50% allotted time', category: 'performance' },
    // BTEUP
    { id: 'first_paper',  title: 'First Paper',       iconKey: 'fileText',    desc: 'Generate your first BTEUP paper',   category: 'bteup' },
    { id: 'papers_50',    title: '50 Papers',          iconKey: 'trophy',      desc: 'Generate 50 BTEUP papers',          category: 'bteup' }
  ],

  KEYS: {
    CACHED_PROFILE: 'mtp_cached_profile',
    COMBO: 'mtp_combo'
  },

  // ═══════════════════════════════════════════
  //  CACHED PROFILE (from server)
  //  Source of truth = backend
  //  localStorage = cache only
  // ═══════════════════════════════════════════

  _cachedProfile: null,

  getCachedProfile() {
    if (this._cachedProfile) return this._cachedProfile;
    try {
      const raw = localStorage.getItem(this.KEYS.CACHED_PROFILE);
      return raw ? JSON.parse(raw) : this._defaultProfile();
    } catch { return this._defaultProfile(); }
  },

  _defaultProfile() {
    return {
      wallet: { coins: 0, totalEarned: 0, xp: 0, tier: 1 },
      streak: { current: 0, best: 0, graceDays: 0 },
      badges: [],
      stats: { totalTests: 0, avgScore: 0, bestScore: 0 },
      subjects: [],
      trends: []
    };
  },

  /** Update cached profile from server response */
  updateCachedProfile(serverData) {
    this._cachedProfile = serverData;
    try {
      localStorage.setItem(this.KEYS.CACHED_PROFILE, JSON.stringify(serverData));
    } catch(e) {}
    this._updateAllUI();
  },

  /** Fetch full profile from server */
  async loadProfileFromServer() {
    try {
      const user = Auth.getUser();
      if (!user?.id) return;

      const resp = await fetch('/api/profile-summary', {
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.id,
          'X-Username': user.username || ''
        }
      });

      if (!resp.ok) return;
      const data = await resp.json();
      if (data.success) {
        this.updateCachedProfile(data);
      }
    } catch(e) {
      console.warn('[GAMIFICATION] Server sync failed:', e.message);
    }
  },

  // ═══════════════════════════════════════════
  //  WALLET (display-only from cache)
  // ═══════════════════════════════════════════

  getCoins() {
    return this.getCachedProfile().wallet?.coins || 0;
  },

  getXP() {
    return this.getCachedProfile().wallet?.xp || 0;
  },

  // ═══════════════════════════════════════════
  //  TIER SYSTEM (replaces 20 levels)
  // ═══════════════════════════════════════════

  getTier() {
    const xp = this.getXP();
    const profile = this.getCachedProfile();
    const tierNum = profile.wallet?.tier || 1;
    const tier = this.TIERS[tierNum - 1] || this.TIERS[0];
    const nextTier = this.TIERS[tierNum] || tier;

    const progress = tierNum < 5
      ? ((xp - tier.xpRequired) / (nextTier.xpRequired - tier.xpRequired)) * 100
      : 100;

    return {
      level: tierNum,
      title: tier.title,
      icon: (typeof Icons !== 'undefined' ? Icons.get(tier.iconKey, 16) : ''),
      iconKey: tier.iconKey,
      xp,
      nextTierXP: nextTier.xpRequired,
      currentTierXP: tier.xpRequired,
      progress: Math.max(0, Math.min(100, progress))
    };
  },

  // ═══════════════════════════════════════════
  //  COMBO TRACKER (during test — client-side OK)
  //  Only tracks locally, backend validates rewards
  // ═══════════════════════════════════════════

  _combo: 0,
  _maxCombo: 0,

  resetCombo() {
    this._combo = 0;
    this._maxCombo = 0;
  },

  registerCorrect() {
    this._combo++;
    this._maxCombo = Math.max(this._maxCombo, this._combo);
    return this._combo;
  },

  registerWrong() {
    this._combo = 0;
  },

  getCombo() {
    return { current: this._combo, max: this._maxCombo };
  },

  // ═══════════════════════════════════════════
  //  PROCESS TEST COMPLETION
  //  Now: reads gamification from API response
  //  No more client-side coin/XP calculation
  // ═══════════════════════════════════════════

  processTestCompletion(apiResponse) {
    // apiResponse = { gamification, streak, result } from /api/submit
    const gam = apiResponse.gamification;
    const streak = apiResponse.streak;

    if (!gam) return null;

    // Update local cache with new wallet data
    const profile = this.getCachedProfile();
    const oldTier = profile.wallet?.tier || 1;
    if (gam.wallet) {
      profile.wallet = {
        coins: gam.wallet.coins,
        totalEarned: gam.wallet.coins, // server tracks this
        xp: gam.wallet.xp,
        tier: gam.wallet.tier || gam.newTier || profile.wallet.tier
      };
    }
    if (streak) {
      profile.streak = {
        current: streak.streak || 0,
        best: streak.best || 0,
        graceDays: streak.graceDays || 0
      };
    }
    this.updateCachedProfile(profile);

    // ── EventBus: emit mock_completed (Doc 9 §27B) ──
    if (typeof EventBus !== 'undefined') {
      EventBus.emit(EventBus.EVENTS.MOCK_COMPLETED, {
        accuracy: apiResponse.result?.accuracy || 0,
        examName: apiResponse.result?.examName || 'Mock Test',
        subject: apiResponse.result?.subject || '',
        xpEarned: gam.totalXP || 0
      });

      if (streak?.streak > 0) {
        EventBus.emit(EventBus.EVENTS.STREAK_EXTENDED, { count: streak.streak });
      }
    }

    // Show level-up popup if leveled up
    if (gam.leveledUp) {
      const tier = this.getTier();
      this._showLevelUpPopup(tier);

      // EventBus: emit level_up
      if (typeof EventBus !== 'undefined') {
        EventBus.emit(EventBus.EVENTS.LEVEL_UP, { tier: tier.level, title: tier.title });
      }
    }

    // Emit achievement events
    if (gam.rewards && gam.rewards.length > 0 && typeof EventBus !== 'undefined') {
      gam.rewards.forEach(r => {
        EventBus.emit(EventBus.EVENTS.ACHIEVEMENT_UNLOCKED, {
          id: r.id || r.title,
          title: r.title,
          category: r.category || 'general'
        });
      });
    }

    // Show grace day notification
    if (streak?.graceUsed) {
      this._showGraceDayPopup();
    }

    return {
      totalCoins: gam.totalCoins || 0,
      totalXP: gam.totalXP || 0,
      rewards: gam.rewards || [],
      combo: this._maxCombo,
      level: this.getTier()
    };
  },

  // ═══════════════════════════════════════════
  //  BADGES (from cache)
  // ═══════════════════════════════════════════

  getUnlockedBadges() {
    return this.getCachedProfile().badges || [];
  },

  // ═══════════════════════════════════════════
  //  SUBJECT ANALYTICS (from cache)
  // ═══════════════════════════════════════════

  getSubjectAnalytics() {
    return this.getCachedProfile().subjects || [];
  },

  getTrends() {
    return this.getCachedProfile().trends || [];
  },

  /** Get smart recommendations based on subject analytics */
  getRecommendations() {
    const subjects = this.getSubjectAnalytics();
    const trends = this.getTrends();
    const recommendations = [];

    // Weak subjects
    const weakSubjects = subjects.filter(s => s.accuracy < 50);
    weakSubjects.forEach(s => {
      recommendations.push({
        type: 'weak_subject',
        icon: Icons.get('alertTriangle', 14),
        title: `Weak in ${s.subject}`,
        desc: `${s.accuracy}% accuracy — Focus practice here`,
        priority: 'high',
        subject: s.subject
      });
    });

    // Declining trend
    if (trends.length >= 5) {
      const recent3 = trends.slice(-3).map(t => t.score_percent);
      const older3 = trends.slice(-6, -3).map(t => t.score_percent);
      const recentAvg = Math.round(recent3.reduce((a, b) => a + b, 0) / recent3.length);
      const olderAvg = older3.length > 0 ? Math.round(older3.reduce((a, b) => a + b, 0) / older3.length) : recentAvg;

      if (recentAvg < olderAvg - 5) {
        recommendations.push({
          type: 'declining',
          icon: Icons.get('trendingDown', 14),
          title: 'Accuracy Declining',
          desc: `Dropped from ${olderAvg}% to ${recentAvg}% — Revise basics`,
          priority: 'high'
        });
      } else if (recentAvg > olderAvg + 5) {
        recommendations.push({
          type: 'improving',
          icon: Icons.get('trendingUp', 14),
          title: 'You\'re Improving!',
          desc: `Up from ${olderAvg}% to ${recentAvg}% — Keep going!`,
          priority: 'positive'
        });
      }
    }

    // Strong subjects (celebrate)
    const strongSubjects = subjects.filter(s => s.accuracy >= 80);
    if (strongSubjects.length > 0) {
      recommendations.push({
        type: 'strong',
        icon: Icons.get('zap', 14),
        title: `Strong in ${strongSubjects.map(s => s.subject).join(', ')}`,
        desc: `${strongSubjects[0].accuracy}%+ accuracy — Great work!`,
        priority: 'positive'
      });
    }

    return recommendations;
  },

  // ═══════════════════════════════════════════
  //  MOTIVATIONAL MESSAGES (during test)
  // ═══════════════════════════════════════════

  getMotivation(context) {
    const { questionsAnswered, totalQuestions, combo } = context;
    const progress = (questionsAnswered / totalQuestions) * 100;

    if (combo >= 10) return { icon: 'flame', msg: `${combo}x COMBO! Unstoppable!`, type: 'fire' };
    if (combo >= 7) return { icon: 'flame', msg: `${combo}x Combo! On fire!`, type: 'fire' };
    if (combo >= 5) return { icon: 'flame', msg: `${combo}x Combo streak!`, type: 'combo' };

    if (progress >= 90) return { icon: 'checkCircle', msg: 'Almost done! Finish strong!', type: 'finish' };
    if (progress >= 75) return { icon: 'zap', msg: '75% done! Keep pushing!', type: 'progress' };
    if (progress >= 50) return { icon: 'zap', msg: 'Halfway there!', type: 'milestone' };
    if (progress >= 25) return { icon: 'target', msg: 'Great start! Keep going!', type: 'encourage' };

    return null;
  },

  // ═══════════════════════════════════════════
  //  PROFILE DATA (for profile page)
  // ═══════════════════════════════════════════

  getProfileData() {
    const profile = this.getCachedProfile();
    const tier = this.getTier();
    const streak = profile.streak || { current: 0, best: 0, graceDays: 0 };

    return {
      streak,
      level: tier,
      coins: profile.wallet?.coins || 0,
      rewards: profile.badges || [],
      totalTests: profile.stats?.totalTests || 0,
      avgAccuracy: profile.stats?.avgScore || 0,
      totalQuestions: 0, // filled from local progress if available
      totalTime: 0,
      graceDays: streak.graceDays || 0,
      rewardDefs: this.BADGE_DEFS,
      subjects: profile.subjects || [],
      trends: profile.trends || []
    };
  },

  // ═══════════════════════════════════════════
  //  UI POPUPS
  // ═══════════════════════════════════════════

  _showCoinPopup(amount, reason) {
    const popup = document.createElement('div');
    popup.className = 'coin-earn-popup';
    popup.innerHTML = `<span class="coin-icon">${Icons.get('coins', 16)}</span> +${amount} <span class="coin-reason">${reason}</span>`;
    document.body.appendChild(popup);
    setTimeout(() => popup.classList.add('show'), 10);
    setTimeout(() => { popup.classList.remove('show'); setTimeout(() => popup.remove(), 300); }, 2500);
  },

  _showLevelUpPopup(tier) {
    const html = `
      <div class="modal-backdrop level-modal-backdrop" id="level-modal" onclick="if(event.target===this)this.remove()">
        <div class="level-up-modal">
          <div class="level-up-glow"></div>
          <div class="level-up-icon">${tier.icon}</div>
          <h3 class="level-up-title">Tier Up!</h3>
          <div class="level-up-number">${tier.title}</div>
          <div class="level-up-name">Tier ${tier.level} of 5</div>
          <button class="btn btn-primary" onclick="document.getElementById('level-modal').remove()">${Icons.get('rocket', 14)} Let's Go!</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  _showGraceDayPopup() {
    const html = `
      <div class="modal-backdrop" id="grace-modal" onclick="if(event.target===this)this.remove()" style="z-index:10000;">
        <div class="level-up-modal" style="max-width:340px;">
          <div class="level-up-icon">${Icons.get('shield', 32)}</div>
          <h3 class="level-up-title">Grace Day Used!</h3>
          <div class="level-up-name" style="font-size:14px;color:var(--text-muted);">
            You missed yesterday, but your grace day saved your streak!
          </div>
          <button class="btn btn-primary" onclick="document.getElementById('grace-modal').remove()" style="margin-top:16px;">${Icons.get('sparkles', 14)} Awesome!</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  _showRewardPopup(reward) {
    const html = `
      <div class="modal-backdrop reward-modal-backdrop" id="reward-modal" onclick="if(event.target===this)this.remove()">
        <div class="reward-modal">
          <div class="reward-confetti"></div>
          <div class="reward-modal-icon">${reward.title.split(' ')[0]}</div>
          <h3 class="reward-modal-title">Reward Unlocked!</h3>
          <p class="reward-modal-name">${reward.title}</p>
          <p class="reward-modal-desc">${reward.desc}</p>
          ${reward.coins ? `<div class="reward-coins">+${reward.coins} ${Icons.get('coins', 14)}</div>` : ''}
          <button class="btn btn-primary" onclick="document.getElementById('reward-modal').remove()">${Icons.get('sparkles', 14)} Awesome!</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  _updateAllUI() {
    // Update coin displays
    const els = document.querySelectorAll('.coin-display-value');
    els.forEach(el => { el.textContent = this.getCoins(); });
    // Update tier displays
    const tierEls = document.querySelectorAll('.tier-display');
    const tier = this.getTier();
    tierEls.forEach(el => { el.textContent = `${tier.icon} ${tier.title}`; });
  }
};

window.Gamification = Gamification;
