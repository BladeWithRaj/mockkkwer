// ============================================
// MISSION ENGINE — Doc 9 §6, §7, §8
// Daily missions (max 3), weekly challenge,
// monthly journey phases, churn detection.
// Template-driven, not hardcoded.
// ============================================

const MissionEngine = {
  STORAGE_KEY: 'mtp_missions',

  // ═══════════════════════════════════════════
  // MISSION TEMPLATES (Doc 9 §6)
  // ═══════════════════════════════════════════
  DAILY_TEMPLATES: [
    { id: 'complete_mock',     trigger: 'mock_completed',       target: 1, label: 'Complete a Mock Test',           icon: '📝', xp: 100, category: 'practice' },
    { id: 'complete_2_mocks',  trigger: 'mock_completed',       target: 2, label: 'Complete 2 Mock Tests',          icon: '📝', xp: 150, category: 'practice' },
    { id: 'review_flashcards', trigger: 'flashcard_reviewed',   target: 10,label: 'Review 10 Flashcards',           icon: '🃏', xp: 40,  category: 'revision' },
    { id: 'review_20_cards',   trigger: 'flashcard_reviewed',   target: 20,label: 'Review 20 Flashcards',           icon: '🃏', xp: 60,  category: 'revision' },
    { id: 'revision_session',  trigger: 'revision_completed',   target: 1, label: 'Complete a Revision Session',    icon: '📖', xp: 80,  category: 'revision' },
    { id: 'score_70',          trigger: 'mock_completed',       target: 1, label: 'Score 70%+ in a Mock',           icon: '🎯', xp: 120, category: 'performance', condition: d => d.accuracy >= 70 },
    { id: 'score_80',          trigger: 'mock_completed',       target: 1, label: 'Score 80%+ in a Mock',           icon: '🎯', xp: 150, category: 'performance', condition: d => d.accuracy >= 80 },
    { id: 'generate_paper',    trigger: 'paper_generated',      target: 1, label: 'Generate a BTEUP Paper',         icon: '📄', xp: 30,  category: 'bteup' },
    { id: 'weak_topic_focus',  trigger: 'mock_completed',       target: 1, label: 'Practice Your Weakest Subject',  icon: '🔍', xp: 100, category: 'revision',  dynamic: true }
  ],

  WEEKLY_TEMPLATES: [
    { id: 'weekly_4_mocks',    trigger: 'mock_completed',       target: 4, label: 'Complete 4 Mock Tests',          icon: '📝', category: 'practice' },
    { id: 'weekly_accuracy',   trigger: 'mock_completed',       target: 3, label: 'Score 75%+ in 3 Mocks',          icon: '🎯', category: 'performance', condition: d => d.accuracy >= 75 },
    { id: 'weekly_revision',   trigger: 'revision_completed',   target: 3, label: 'Complete 3 Revision Sessions',   icon: '📖', category: 'revision' }
  ],

  // ═══════════════════════════════════════════
  // MONTHLY JOURNEY PHASES (Doc 9 §8)
  // ═══════════════════════════════════════════
  MONTHLY_PHASES: [
    { week: 1, name: 'Foundation',  desc: 'Build your baseline — take 3+ mocks, identify weak areas',  icon: '🧱' },
    { week: 2, name: 'Practice',    desc: 'Focus on weak subjects — revision sessions + flashcards',   icon: '📚' },
    { week: 3, name: 'Improvement', desc: 'Push accuracy up — revision + mock combos',                icon: '📈' },
    { week: 4, name: 'Mastery',     desc: 'Full-length mocks + clear flashcard queue',                 icon: '🏆' }
  ],


  // ═══════════════════════════════════════════
  // INITIALIZE (subscribe to EventBus)
  // ═══════════════════════════════════════════
  init() {
    if (typeof EventBus === 'undefined') return;

    // Listen for all mission-relevant events
    EventBus.on('mock_completed',     (d) => this._onEvent('mock_completed', d));
    EventBus.on('flashcard_reviewed', (d) => this._onEvent('flashcard_reviewed', d));
    EventBus.on('revision_completed', (d) => this._onEvent('revision_completed', d));
    EventBus.on('paper_generated',    (d) => this._onEvent('paper_generated', d));
  },


  // ═══════════════════════════════════════════
  // GET TODAY'S MISSIONS (max 3)
  // ═══════════════════════════════════════════
  getDailyMissions() {
    const state = this._getState();
    const today = this._today();

    // If missions are stale (different day), regenerate
    if (state.dailyDate !== today) {
      state.dailyMissions = this._generateDailyMissions();
      state.dailyDate = today;
      this._saveState(state);
    }

    return state.dailyMissions;
  },

  // ═══════════════════════════════════════════
  // GET WEEKLY CHALLENGE
  // ═══════════════════════════════════════════
  getWeeklyChallenge() {
    const state = this._getState();
    const weekId = this._weekId();

    if (state.weeklyId !== weekId) {
      state.weeklyMissions = this.WEEKLY_TEMPLATES.map(t => ({
        ...t,
        progress: 0,
        done: false
      }));
      state.weeklyId = weekId;
      state.weeklyAllDone = false;
      this._saveState(state);
    }

    return {
      missions: state.weeklyMissions,
      allDone: state.weeklyAllDone || false,
      weekId
    };
  },

  // ═══════════════════════════════════════════
  // GET MONTHLY PHASE
  // ═══════════════════════════════════════════
  getMonthlyPhase() {
    const dayOfMonth = new Date().getDate();
    const weekNum = Math.min(4, Math.ceil(dayOfMonth / 7));
    return this.MONTHLY_PHASES[weekNum - 1] || this.MONTHLY_PHASES[0];
  },

  // ═══════════════════════════════════════════
  // MISSION STATS
  // ═══════════════════════════════════════════
  getStats() {
    const daily = this.getDailyMissions();
    const weekly = this.getWeeklyChallenge();
    const completed = daily.filter(m => m.done).length;
    const totalXP = daily.filter(m => m.done).reduce((s, m) => s + (m.xp || 0), 0);

    return {
      dailyCompleted: completed,
      dailyTotal: daily.length,
      dailyAllDone: completed === daily.length,
      weeklyProgress: weekly.missions.filter(m => m.done).length,
      weeklyTotal: weekly.missions.length,
      weeklyAllDone: weekly.allDone,
      totalXPToday: totalXP,
      monthlyPhase: this.getMonthlyPhase()
    };
  },


  // ═══════════════════════════════════════════
  // CHURN DETECTION (Doc 9 §25)
  // ═══════════════════════════════════════════
  getChurnSignals() {
    const signals = [];
    const history = Storage.getHistory?.() || [];
    const now = Date.now();
    const ONE_DAY = 86400000;

    // Signal: No test for 7+ days
    if (history.length > 0) {
      const lastTest = history[history.length - 1];
      const lastDate = lastTest.date ? new Date(lastTest.date).getTime() : 0;
      const daysSince = Math.floor((now - lastDate) / ONE_DAY);
      if (daysSince >= 7) {
        signals.push({
          type: 'no_test',
          days: daysSince,
          message: `You haven't taken a test in ${daysSince} days. A quick 10-question practice can help you get back on track.`,
          action: { page: 'setup', label: 'Quick Practice' },
          severity: daysSince >= 14 ? 'high' : 'medium'
        });
      }
    }

    // Signal: Revision queue ignored 3+ days
    if (typeof Flashcards !== 'undefined') {
      const due = Flashcards.getDue();
      if (due.length >= 10) {
        signals.push({
          type: 'revision_ignored',
          count: due.length,
          message: `You have ${due.length} flashcards waiting for review. 5 minutes of review now will strengthen your memory.`,
          action: { page: 'coach', params: { tab: 'flashcards' }, label: 'Review Cards' },
          severity: due.length >= 20 ? 'high' : 'medium'
        });
      }
    }

    // Signal: Streak broken recently
    const streak = typeof DailySystem !== 'undefined' ? DailySystem.getStreak() : { current: 0, best: 0 };
    if (streak.current === 0 && streak.best >= 5) {
      signals.push({
        type: 'streak_broken',
        bestStreak: streak.best,
        message: `Your ${streak.best}-day streak ended. Start a new one today — every journey begins with one step.`,
        action: { page: 'setup', label: 'Start New Streak' },
        severity: 'low'
      });
    }

    return signals;
  },


  // ═══════════════════════════════════════════
  // PRIVATE — Generate daily missions
  // ═══════════════════════════════════════════
  _generateDailyMissions() {
    const pool = [...this.DAILY_TEMPLATES];
    const selected = [];
    const MAX = 3;

    // Priority 0 (Doc 21): Correction-driven mission from CIE
    if (typeof CorrectionEngine !== 'undefined') {
      const cieMission = CorrectionEngine.generateCorrectionMissions();
      if (cieMission) {
        selected.push(cieMission);
      }
    }

    // Priority 0.5 (Doc 22): Churn prevention from PIE
    if (selected.length < MAX && typeof PredictiveEngine !== 'undefined') {
      const churn = PredictiveEngine.predictChurn();
      if (churn.ready && (churn.risk === 'high' || churn.risk === 'critical')) {
        selected.push({
          id: 'pie_churn_prevention',
          trigger: 'mock_completed',
          target: 1,
          label: '⚡ Quick 10-Question Practice (Save Your Streak!)',
          icon: '⚡',
          xp: 80,
          category: 'engagement',
          progress: 0,
          done: false,
          source: 'PredictiveEngine'
        });
      }
    }

    // Priority 1: weakness-based mission
    if (typeof LearningProfile !== 'undefined') {
      const weak = LearningProfile.getWeaknessRanking();
      if (weak.length > 0) {
        const weakSubject = weak[0].subject;
        const dynamicMission = pool.find(t => t.dynamic);
        if (dynamicMission) {
          selected.push({
            ...dynamicMission,
            id: `weak_${weakSubject.toLowerCase().replace(/\s/g, '_')}`,
            label: `Practice ${weakSubject}`,
            subject: weakSubject,
            progress: 0,
            done: false
          });
        }
      }
    }

    // Priority 2: fill remaining from pool (seeded by day for consistency)
    const seed = this._dayHash();
    const shuffled = pool
      .filter(t => !t.dynamic)
      .sort((a, b) => this._hashStr(a.id + seed) - this._hashStr(b.id + seed));

    for (const t of shuffled) {
      if (selected.length >= MAX) break;
      if (selected.find(s => s.trigger === t.trigger && s.category === t.category)) continue;
      selected.push({
        ...t,
        progress: 0,
        done: false
      });
    }

    return selected.slice(0, MAX);
  },

  // ═══════════════════════════════════════════
  // PRIVATE — Handle event and update progress
  // ═══════════════════════════════════════════
  _onEvent(eventName, data) {
    const state = this._getState();
    const today = this._today();

    // Ensure missions are for today
    if (state.dailyDate !== today) return;

    let changed = false;

    // Update daily missions
    state.dailyMissions.forEach(m => {
      if (m.done) return;
      if (m.trigger !== eventName) return;
      // Check conditional (e.g., score >= 70)
      if (m.condition && typeof m.condition === 'function' && !m.condition(data)) return;
      // Check subject match for dynamic missions
      if (m.subject && data.subject && m.subject !== data.subject) return;

      m.progress = (m.progress || 0) + 1;
      if (m.progress >= m.target) {
        m.done = true;
        m.completedAt = new Date().toISOString();
        changed = true;

        // Emit mission done event
        EventBus.emit(EventBus.EVENTS.DAILY_MISSION_DONE, {
          missionId: m.id,
          label: m.label,
          xp: m.xp
        });

        // Award XP locally (display only — backend is source of truth)
        EventBus.emit(EventBus.EVENTS.XP_EARNED, {
          amount: m.xp,
          reason: m.label,
          source: 'daily_mission'
        });
      }
    });

    // Update weekly missions
    const weekId = this._weekId();
    if (state.weeklyId === weekId && state.weeklyMissions) {
      state.weeklyMissions.forEach(m => {
        if (m.done) return;
        if (m.trigger !== eventName) return;
        if (m.condition && typeof m.condition === 'function' && !m.condition(data)) return;

        m.progress = (m.progress || 0) + 1;
        if (m.progress >= m.target) {
          m.done = true;
          changed = true;
        }
      });

      // Check if all weekly done
      if (state.weeklyMissions.every(m => m.done) && !state.weeklyAllDone) {
        state.weeklyAllDone = true;
        EventBus.emit(EventBus.EVENTS.WEEKLY_CHALLENGE_DONE, {});
        EventBus.emit(EventBus.EVENTS.ACHIEVEMENT_UNLOCKED, {
          id: 'weekly_challenge',
          title: 'Weekly Challenge Complete',
          category: 'consistency'
        });
      }
    }

    if (changed) this._saveState(state);
  },


  // ═══════════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════════
  _getState() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : { dailyMissions: [], dailyDate: '', weeklyMissions: [], weeklyId: '' };
    } catch (e) {
      return { dailyMissions: [], dailyDate: '', weeklyMissions: [], weeklyId: '' };
    }
  },

  _saveState(state) {
    try {
      // Strip non-serializable condition functions before saving
      const clean = JSON.parse(JSON.stringify(state, (key, val) => typeof val === 'function' ? undefined : val));
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(clean));
    } catch (e) {}
  },

  _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  _weekId() {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${weekNum}`;
  },

  _dayHash() {
    const d = new Date();
    return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
  },

  _hashStr(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }
};

window.MissionEngine = MissionEngine;
