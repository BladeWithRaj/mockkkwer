// ============================================
// GAMIFICATION ENGINE v2 — Display-Only Mode
// Backend is the SINGLE SOURCE OF TRUTH.
// Frontend only: displays, caches, animates.
// ============================================

const Gamification = {

  // ═══════════════════════════════════════════
  //  5-TIER SYSTEM (replaces 20 levels)
  // ═══════════════════════════════════════════

  TIERS: [
    { level: 1, title: 'Beginner', xpRequired: 0,     icon: '🌱' },
    { level: 2, title: 'Learner',  xpRequired: 500,   icon: '📖' },
    { level: 3, title: 'Skilled',  xpRequired: 2000,  icon: '⚡' },
    { level: 4, title: 'Advanced', xpRequired: 5000,  icon: '🔥' },
    { level: 5, title: 'Elite',    xpRequired: 12000, icon: '👑' }
  ],

  // Badge definitions (kept to 12, no explosion)
  BADGE_DEFS: [
    { id: 'streak_3', title: '🔥 3 Day Warrior', desc: '3 day streak' },
    { id: 'streak_7', title: '🏅 Week Champion', desc: '7 day streak' },
    { id: 'streak_15', title: '💎 Fortnight King', desc: '15 day streak' },
    { id: 'streak_30', title: '👑 Monthly Legend', desc: '30 day streak' },
    { id: 'tests_5', title: '📝 5 Tests Done', desc: 'Complete 5 tests' },
    { id: 'tests_25', title: '🎯 25 Tests Done', desc: 'Complete 25 tests' },
    { id: 'tests_100', title: '🏆 Century Club', desc: 'Complete 100 tests' },
    { id: 'perfect', title: '💯 Perfect Score', desc: '100% in any test' },
    { id: 'speed_demon', title: '⚡ Speed Demon', desc: 'Finish test in <50% time' },
    { id: 'combo_10', title: '🔥 Combo Master', desc: '10 correct in a row' },
    { id: 'tier_3', title: '⚡ Skilled Tier', desc: 'Reach Skilled tier' },
    { id: 'tier_5', title: '👑 Elite Tier', desc: 'Reach Elite tier' }
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
      icon: tier.icon,
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

    // Show level-up popup if leveled up
    if (gam.leveledUp) {
      const tier = this.getTier();
      this._showLevelUpPopup(tier);
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
        icon: '⚠️',
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
          icon: '📉',
          title: 'Accuracy Declining',
          desc: `Dropped from ${olderAvg}% to ${recentAvg}% — Revise basics`,
          priority: 'high'
        });
      } else if (recentAvg > olderAvg + 5) {
        recommendations.push({
          type: 'improving',
          icon: '📈',
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
        icon: '💪',
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

    if (combo >= 10) return { emoji: '🔥🔥🔥', msg: `${combo}x COMBO! Unstoppable!`, type: 'fire' };
    if (combo >= 7) return { emoji: '🔥🔥', msg: `${combo}x Combo! On fire!`, type: 'fire' };
    if (combo >= 5) return { emoji: '🔥', msg: `${combo}x Combo streak!`, type: 'combo' };

    if (progress >= 90) return { emoji: '🏁', msg: 'Almost done! Finish strong!', type: 'finish' };
    if (progress >= 75) return { emoji: '💪', msg: '75% done! Keep pushing!', type: 'progress' };
    if (progress >= 50) return { emoji: '⚡', msg: 'Halfway there!', type: 'milestone' };
    if (progress >= 25) return { emoji: '🎯', msg: 'Great start! Keep going!', type: 'encourage' };

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
    popup.innerHTML = `<span class="coin-icon">💰</span> +${amount} <span class="coin-reason">${reason}</span>`;
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
          <button class="btn btn-primary" onclick="document.getElementById('level-modal').remove()">Let's Go! 🚀</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  _showGraceDayPopup() {
    const html = `
      <div class="modal-backdrop" id="grace-modal" onclick="if(event.target===this)this.remove()" style="z-index:10000;">
        <div class="level-up-modal" style="max-width:340px;">
          <div class="level-up-icon">🛡️</div>
          <h3 class="level-up-title">Grace Day Used!</h3>
          <div class="level-up-name" style="font-size:14px;color:var(--text-muted);">
            You missed yesterday, but your grace day saved your streak!
          </div>
          <button class="btn btn-primary" onclick="document.getElementById('grace-modal').remove()" style="margin-top:16px;">Awesome! 🎉</button>
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
          ${reward.coins ? `<div class="reward-coins">+${reward.coins} 💰</div>` : ''}
          <button class="btn btn-primary" onclick="document.getElementById('reward-modal').remove()">Awesome! 🎉</button>
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
