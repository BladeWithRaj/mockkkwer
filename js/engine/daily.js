// ============================================
// DAILY CHALLENGE + STREAK SYSTEM
// Retention engine: daily tests, streak
// tracking, progress over time
// ============================================

const DailySystem = {

  KEYS: {
    STREAK: 'mocktest_streak',
    DAILY_DONE: 'mocktest_daily_done',
    PROGRESS: 'mocktest_progress'
  },

  // ═══════════════════════════════════════════
  //  STREAK TRACKING
  // ═══════════════════════════════════════════

  /** Get current streak data */
  getStreak() {
    try {
      const raw = localStorage.getItem(this.KEYS.STREAK);
      if (!raw) return { current: 0, best: 0, lastDate: null };
      return JSON.parse(raw);
    } catch {
      return { current: 0, best: 0, lastDate: null };
    }
  },

  /** Record a test completion (updates streak) */
  recordTestDone() {
    const streak = this.getStreak();
    const today = this._todayKey();
    const yesterday = this._dateKey(-1);

    if (streak.lastDate === today) {
      // Already counted today
      return streak;
    }

    if (streak.lastDate === yesterday) {
      // Continuing streak
      streak.current += 1;
    } else if (streak.lastDate === null || streak.lastDate !== today) {
      // Streak broken — restart
      streak.current = 1;
    }

    streak.lastDate = today;
    streak.best = Math.max(streak.best, streak.current);
    localStorage.setItem(this.KEYS.STREAK, JSON.stringify(streak));
    return streak;
  },

  /** Check if streak is alive (did test today or yesterday) */
  isStreakAlive() {
    const streak = this.getStreak();
    if (!streak.lastDate) return false;
    const today = this._todayKey();
    const yesterday = this._dateKey(-1);
    return streak.lastDate === today || streak.lastDate === yesterday;
  },

  /** Check if user has done any test today */
  hasDoneToday() {
    const streak = this.getStreak();
    return streak.lastDate === this._todayKey();
  },

  // ═══════════════════════════════════════════
  //  DAILY CHALLENGE
  // ═══════════════════════════════════════════

  /** Check if daily challenge is done today */
  isDailyDone() {
    const done = localStorage.getItem(this.KEYS.DAILY_DONE);
    return done === this._todayKey();
  },

  /** Mark daily challenge as done */
  markDailyDone() {
    localStorage.setItem(this.KEYS.DAILY_DONE, this._todayKey());
    this.recordTestDone();
  },

  /** Get today's daily challenge seed (consistent per day) */
  getDailySeed() {
    const today = this._todayKey();
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      const char = today.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  },

  /** Get daily challenge config */
  getDailyConfig() {
    const preset = ExamPresets.get('daily-challenge');
    if (!preset) return null;

    return {
      ...ExamPresets.buildConfig('daily-challenge'),
      isDaily: true,
      dailySeed: this.getDailySeed()
    };
  },

  // ═══════════════════════════════════════════
  //  PROGRESS TRACKING (over time)
  // ═══════════════════════════════════════════

  /** Save a test result to progress history */
  recordProgress(result) {
    const progress = this.getProgress();
    const entry = {
      date: this._todayKey(),
      timestamp: Date.now(),
      accuracy: result.accuracy || 0,
      correct: result.correct || 0,
      wrong: result.wrong || 0,
      total: result.totalQuestions || 0,
      timeTaken: result.timeTaken || 0,
      subjects: result.subjectWise || {},
      weakTopics: (result.weakTopics || []).slice(0, 3),
      examId: result.config?.examId || 'custom'
    };

    progress.push(entry);
    // Keep last 100 entries
    if (progress.length > 100) progress.splice(0, progress.length - 100);
    localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(progress));

    // Update streak
    this.recordTestDone();

    return entry;
  },

  /** Get all progress entries */
  getProgress() {
    try {
      const raw = localStorage.getItem(this.KEYS.PROGRESS);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  /** Get last N test results for trend */
  getRecentProgress(n = 7) {
    return this.getProgress().slice(-n);
  },

  /** Get topic-wise heatmap data (aggregated over all tests) */
  getTopicHeatmap() {
    const progress = this.getProgress();
    const heatmap = {};

    progress.forEach(entry => {
      if (!entry.subjects) return;
      Object.entries(entry.subjects).forEach(([subject, data]) => {
        if (!heatmap[subject]) {
          heatmap[subject] = { total: 0, correct: 0, wrong: 0, skipped: 0, tests: 0 };
        }
        heatmap[subject].total += data.total || 0;
        heatmap[subject].correct += data.correct || 0;
        heatmap[subject].wrong += data.wrong || 0;
        heatmap[subject].skipped += data.skipped || 0;
        heatmap[subject].tests += 1;
      });
    });

    // Calculate accuracy percentages
    return Object.entries(heatmap)
      .map(([subject, data]) => ({
        subject,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        total: data.total,
        correct: data.correct,
        wrong: data.wrong,
        tests: data.tests
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  },

  /** Detect mistake patterns */
  getMistakePatterns() {
    const progress = this.getRecentProgress(10);
    const patterns = [];

    // Pattern 1: Rushing easy questions
    let totalFastWrong = 0;
    let totalAttempted = 0;
    progress.forEach(entry => {
      totalAttempted += (entry.total - (entry.total - entry.correct - entry.wrong));
    });

    // Pattern 2: Low attempt rate
    const avgAttemptRate = progress.length > 0
      ? Math.round(progress.reduce((sum, e) => sum + ((e.correct + e.wrong) / Math.max(1, e.total)) * 100, 0) / progress.length)
      : 0;

    if (avgAttemptRate < 70 && progress.length >= 3) {
      patterns.push({
        type: 'low_attempt',
        icon: '⏭️',
        title: 'You skip too many questions',
        desc: `Average attempt rate: ${avgAttemptRate}%. Try to attempt at least 80%.`,
        severity: avgAttemptRate < 50 ? 'high' : 'medium'
      });
    }

    // Pattern 3: Accuracy trending down
    if (progress.length >= 5) {
      const recent3 = progress.slice(-3);
      const older3 = progress.slice(-6, -3);
      const recentAvg = Math.round(recent3.reduce((s, e) => s + e.accuracy, 0) / recent3.length);
      const olderAvg = older3.length > 0 ? Math.round(older3.reduce((s, e) => s + e.accuracy, 0) / older3.length) : recentAvg;

      if (recentAvg < olderAvg - 5) {
        patterns.push({
          type: 'declining',
          icon: '📉',
          title: 'Accuracy is declining',
          desc: `Dropped from ${olderAvg}% to ${recentAvg}% in recent tests. Take a break and revise basics.`,
          severity: 'high'
        });
      } else if (recentAvg > olderAvg + 5) {
        patterns.push({
          type: 'improving',
          icon: '📈',
          title: 'You are improving!',
          desc: `Went from ${olderAvg}% to ${recentAvg}%. Keep going!`,
          severity: 'positive'
        });
      }
    }

    // Pattern 4: Weak subject detected
    const heatmap = this.getTopicHeatmap();
    const weakSubjects = heatmap.filter(s => s.accuracy < 40 && s.tests >= 2);
    if (weakSubjects.length > 0) {
      patterns.push({
        type: 'weak_subject',
        icon: '⚠️',
        title: `Weak in: ${weakSubjects.map(s => s.subject).join(', ')}`,
        desc: `Below 40% accuracy. Focus practice sessions on ${weakSubjects[0].subject}.`,
        severity: 'high'
      });
    }

    // Pattern 5: Speed issue
    const avgTimePer = progress.length > 0
      ? Math.round(progress.reduce((sum, e) => sum + (e.total > 0 ? e.timeTaken / e.total : 0), 0) / progress.length)
      : 0;

    if (avgTimePer > 90 && progress.length >= 3) {
      patterns.push({
        type: 'slow_speed',
        icon: '🐌',
        title: 'You\'re too slow',
        desc: `Averaging ${avgTimePer}s per question. Target: under 60s for most exams.`,
        severity: 'medium'
      });
    }

    return patterns;
  },

  /** Get daily goal status */
  getDailyGoal() {
    const today = this._todayKey();
    const progress = this.getProgress();
    const todayTests = progress.filter(e => e.date === today);

    return {
      testsToday: todayTests.length,
      target: 3,
      dailyDone: this.isDailyDone(),
      questionsToday: todayTests.reduce((sum, e) => sum + e.total, 0),
      accuracyToday: todayTests.length > 0
        ? Math.round(todayTests.reduce((sum, e) => sum + e.accuracy, 0) / todayTests.length)
        : 0
    };
  },

  // ═══════════════════════════════════════════
  //  PRIVATE HELPERS
  // ═══════════════════════════════════════════

  _todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  _dateKey(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
};
