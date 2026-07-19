// ============================================
// FEATURE FLAGS — Doc 9 §27D
// Premium plan gating + contextual upgrade prompts.
// No payment provider dependency.
// ============================================

const FeatureFlags = {

  STORAGE_KEY: 'mtp_user_plan',

  // ═══════════════════════════════════════════
  // PLAN DEFINITIONS (Doc 9 §15–17)
  // ═══════════════════════════════════════════
  PLANS: {
    FREE: 'free',
    PLUS: 'plus',
    PRO:  'pro'
  },

  // Feature matrix — which plan gets what
  FEATURES: {
    // Free features (Doc 9 §15)
    DAILY_MOCKS:          { free: true,  plus: true,  pro: true },
    BASIC_ANALYTICS:      { free: true,  plus: true,  pro: true },
    DASHBOARD:            { free: true,  plus: true,  pro: true },
    AI_BRIEFING:          { free: true,  plus: true,  pro: true },
    BTEUP_BASIC:          { free: true,  plus: true,  pro: true },
    BASIC_FLASHCARDS:     { free: true,  plus: true,  pro: true },   // Limited to 50 cards

    // Plus features (Doc 9 §16)
    ADAPTIVE_PRACTICE:    { free: false, plus: true,  pro: true },
    ADVANCED_AI_INSIGHTS: { free: false, plus: true,  pro: true },
    UNLIMITED_FLASHCARDS: { free: false, plus: true,  pro: true },
    SMART_REVISION:       { free: false, plus: true,  pro: true },
    WEEKLY_AI_REPORT:     { free: false, plus: true,  pro: true },
    EXTENDED_HISTORY:     { free: false, plus: true,  pro: true },
    ADVANCED_ANALYTICS:   { free: false, plus: true,  pro: true },

    // Pro features (Doc 9 §17)
    PRIORITY_AI:          { free: false, plus: false, pro: true },
    LONG_TERM_TRENDS:     { free: false, plus: false, pro: true },
    FULL_EXPORT:          { free: false, plus: false, pro: true },
    MULTI_DEVICE:         { free: false, plus: false, pro: true },
    EARLY_ACCESS:         { free: false, plus: false, pro: true }
  },

  // Feature display names + descriptions for UI
  FEATURE_META: {
    ADAPTIVE_PRACTICE:    { name: 'Adaptive Practice',     desc: 'AI-powered tests that focus on your weak areas',         icon: '🎯' },
    ADVANCED_AI_INSIGHTS: { name: 'Advanced AI Insights',   desc: 'Deep analysis of your learning patterns',               icon: '▲' },
    UNLIMITED_FLASHCARDS: { name: 'Unlimited Flashcards',   desc: 'No limit on auto-generated revision cards',             icon: '🃏' },
    SMART_REVISION:       { name: 'Smart Revision Planner', desc: 'AI organizes your revision queue by priority',          icon: '📋' },
    WEEKLY_AI_REPORT:     { name: 'Weekly AI Report',       desc: 'Personalized progress summary every week',              icon: '📊' },
    EXTENDED_HISTORY:     { name: 'Extended History',        desc: 'Access your complete test history without limits',      icon: '◈' },
    ADVANCED_ANALYTICS:   { name: 'Advanced Analytics',      desc: 'Subject-wise trends, time analysis, accuracy patterns', icon: '📈' },
    PRIORITY_AI:          { name: 'Priority AI',             desc: 'Faster AI processing and detailed explanations',        icon: '⚡' },
    LONG_TERM_TRENDS:     { name: 'Long-term Trends',        desc: 'Track your progress over months with detailed charts',  icon: '📉' },
    FULL_EXPORT:          { name: 'Full Export',              desc: 'Download your complete test data and analytics',         icon: '💾' },
    MULTI_DEVICE:         { name: 'Multi-device Sync',       desc: 'Seamless progress sync across all your devices',        icon: '🔄' },
    EARLY_ACCESS:         { name: 'Early Access',             desc: 'Be the first to try new features and exam patterns',   icon: '🚀' }
  },


  // ═══════════════════════════════════════════
  // CORE API
  // ═══════════════════════════════════════════

  /** Check if current plan allows a feature */
  can(featureId) {
    const plan = this.getPlan();
    const feature = this.FEATURES[featureId];
    if (!feature) return true; // Unknown feature → allow
    return feature[plan] === true;
  },

  /** Get current plan */
  getPlan() {
    try {
      return localStorage.getItem(this.STORAGE_KEY) || this.PLANS.FREE;
    } catch (e) {
      return this.PLANS.FREE;
    }
  },

  /** Set plan (called after server confirms subscription) */
  setPlan(plan) {
    try {
      localStorage.setItem(this.STORAGE_KEY, plan);
    } catch (e) {}
  },

  /** Is user on paid plan? */
  isPremium() {
    const plan = this.getPlan();
    return plan === this.PLANS.PLUS || plan === this.PLANS.PRO;
  },

  /** Is user on Pro? */
  isPro() {
    return this.getPlan() === this.PLANS.PRO;
  },

  // ═══════════════════════════════════════════
  // FREE LIMITS
  // ═══════════════════════════════════════════
  FREE_LIMITS: {
    FLASHCARDS: 50,
    HISTORY: 20,
    INSIGHTS: 1
  },

  /** Check if free limit is reached */
  isLimitReached(limitKey) {
    if (this.isPremium()) return false;
    switch (limitKey) {
      case 'FLASHCARDS':
        return (typeof Flashcards !== 'undefined') && Flashcards.getAll().length >= this.FREE_LIMITS.FLASHCARDS;
      case 'HISTORY':
        return (Storage.getHistory?.() || []).length > this.FREE_LIMITS.HISTORY;
      case 'INSIGHTS':
        return true; // Always gated for free
      default:
        return false;
    }
  },


  // ═══════════════════════════════════════════
  // UPGRADE PROMPTS (Doc 9 §19, §20)
  // ═══════════════════════════════════════════

  /** Show contextual upgrade prompt — NEVER during a test (Doc 9 §19) */
  showUpgradePrompt(featureId, context = {}) {
    if (this.can(featureId)) return; // Already has access

    const meta = this.FEATURE_META[featureId] || {};
    const prompt = this._buildPromptHTML(featureId, meta, context);
    this._renderPrompt(prompt);
  },

  /** Get AI preview teaser text (Doc 9 §20) */
  getAIPreviewTeaser(lockedCount) {
    if (this.isPremium()) return '';
    return `AI detected ${lockedCount} insight${lockedCount !== 1 ? 's' : ''}. <a href="#pricing" style="color:var(--primary);font-weight:700;text-decoration:none">Upgrade to Plus</a> to receive personalized recommendations.`;
  },

  /** Good moments to show upgrade (Doc 9 §19) */
  getUpgradeMoments() {
    return [
      'after_result',         // After test results
      'after_revision',       // After completing revision
      'weekly_report',        // In weekly report
      'adaptive_preview',     // When trying adaptive practice
      'insights_locked'       // When insights are gated
    ];
  },

  /** Build prompt HTML (non-intrusive banner, not modal) */
  _buildPromptHTML(featureId, meta, context) {
    const contextLine = context.teaser || `Unlock ${meta.name || 'this feature'} with Mock24hr Plus.`;

    return `
      <div id="upgrade-prompt" style="
        position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        max-width:460px;width:calc(100% - 32px);
        background:var(--bg-card);border:1.5px solid var(--primary);
        border-radius:var(--radius-lg);padding:16px 20px;
        box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:9500;
        animation:te-fadeUp 0.25s ease both;font-family:var(--font-display)">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <span style="font-size:24px;flex-shrink:0">${meta.icon || '⭐'}</span>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:4px">${meta.name || 'Premium Feature'}</div>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.5;margin:0 0 12px">${contextLine}</p>
            <div style="display:flex;gap:8px;align-items:center">
              <a href="#pricing" style="
                padding:7px 18px;background:var(--primary);color:#fff;
                border-radius:var(--radius-md);font-size:13px;font-weight:700;
                text-decoration:none;display:inline-block">
                View Plans
              </a>
              <button onclick="document.getElementById('upgrade-prompt').remove()"
                style="padding:7px 14px;background:none;border:1px solid var(--border-color);
                border-radius:var(--radius-md);font-size:12px;color:var(--text-muted);
                cursor:pointer;font-weight:600">
                Later
              </button>
            </div>
          </div>
          <button onclick="document.getElementById('upgrade-prompt').remove()"
            style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;padding:0;line-height:1">&times;</button>
        </div>
      </div>
    `;
  },

  _renderPrompt(html) {
    // Remove existing prompt
    const existing = document.getElementById('upgrade-prompt');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    // Auto-dismiss after 12 seconds
    setTimeout(() => {
      const el = document.getElementById('upgrade-prompt');
      if (el) el.remove();
    }, 12000);
  }
};

window.FeatureFlags = FeatureFlags;
