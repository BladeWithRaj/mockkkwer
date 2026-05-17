// ============================================
// PROGRESS ENGINE — Personal Growth Tracker
// "Improve yourself daily" — not "beat strangers"
// ============================================

const ProgressEngine = {
  _storageKey: 'mtp_progress',
  _historyKey: 'mtp_test_history',

  // ── Get or initialize user progress ──
  getProgress() {
    try {
      const raw = localStorage.getItem(this._storageKey);
      return raw ? JSON.parse(raw) : this._defaultProgress();
    } catch { return this._defaultProgress(); }
  },

  _defaultProgress() {
    return {
      totalTests: 0,
      avgAccuracy: 0,
      avgScore: 0,
      bestScore: 0,
      bestAccuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastTestDate: null,
      strongestSubject: null,
      weakestSubject: null,
      subjectHistory: {},
      badges: [],
      dailyGoal: { testsToday: 0, goalMet: false, lastDate: null },
      totalCorrect: 0,
      totalAttempted: 0,
      updatedAt: null
    };
  },

  // ── Get test history (last 20 tests) ──
  getHistory() {
    try {
      const raw = localStorage.getItem(this._historyKey);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  // ── Record a new test result ──
  recordResult(result) {
    if (!result) return;

    const progress = this.getProgress();
    const history = this.getHistory();
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Update totals
    progress.totalTests++;
    progress.totalCorrect += result.correct || 0;
    progress.totalAttempted += (result.correct + result.wrong) || 0;

    // Running average accuracy
    const prevTotal = progress.avgAccuracy * (progress.totalTests - 1);
    progress.avgAccuracy = Math.round((prevTotal + (result.accuracy || 0)) / progress.totalTests);

    // Running average score
    const prevScoreTotal = progress.avgScore * (progress.totalTests - 1);
    progress.avgScore = Math.round(((prevScoreTotal + (result.totalMarks || 0)) / progress.totalTests) * 10) / 10;

    // Best scores
    if ((result.totalMarks || 0) > progress.bestScore) progress.bestScore = result.totalMarks;
    if ((result.accuracy || 0) > progress.bestAccuracy) progress.bestAccuracy = result.accuracy;

    // Streak tracking
    if (progress.lastTestDate) {
      const lastDate = new Date(progress.lastTestDate);
      const daysDiff = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        // Same day or consecutive day
        if (progress.lastTestDate !== today) {
          progress.currentStreak++;
        }
      } else {
        progress.currentStreak = 1; // Reset
      }
    } else {
      progress.currentStreak = 1;
    }
    if (progress.currentStreak > progress.longestStreak) {
      progress.longestStreak = progress.currentStreak;
    }
    progress.lastTestDate = today;

    // Daily goal tracking
    if (progress.dailyGoal.lastDate !== today) {
      progress.dailyGoal.testsToday = 0;
      progress.dailyGoal.goalMet = false;
    }
    progress.dailyGoal.testsToday++;
    progress.dailyGoal.lastDate = today;
    if (progress.dailyGoal.testsToday >= 1 && (result.accuracy || 0) >= 50) {
      progress.dailyGoal.goalMet = true;
    }

    // Subject-wise tracking
    if (result.subjectWise) {
      Object.entries(result.subjectWise).forEach(([subject, data]) => {
        if (!progress.subjectHistory[subject]) {
          progress.subjectHistory[subject] = { totalCorrect: 0, totalAttempted: 0, totalQuestions: 0, tests: 0 };
        }
        const sh = progress.subjectHistory[subject];
        sh.totalCorrect += data.correct || 0;
        sh.totalAttempted += (data.correct + data.wrong) || 0;
        sh.totalQuestions += data.total || 0;
        sh.tests++;
      });

      // Determine strongest/weakest
      const subjects = Object.entries(progress.subjectHistory)
        .map(([name, data]) => ({
          name,
          accuracy: data.totalQuestions > 0 ? Math.round((data.totalCorrect / data.totalQuestions) * 100) : 0
        }))
        .filter(s => s.accuracy > 0)
        .sort((a, b) => b.accuracy - a.accuracy);

      if (subjects.length > 0) {
        progress.strongestSubject = subjects[0].name;
        progress.weakestSubject = subjects[subjects.length - 1].name;
      }
    }

    // Badge check
    this._checkBadges(progress, result);

    progress.updatedAt = now.toISOString();

    // Save progress
    try { localStorage.setItem(this._storageKey, JSON.stringify(progress)); } catch {}

    // Save to history (keep last 20)
    const historyEntry = {
      date: now.toISOString(),
      accuracy: result.accuracy || 0,
      score: result.totalMarks || 0,
      maxScore: result.maxMarks || 0,
      correct: result.correct || 0,
      wrong: result.wrong || 0,
      skipped: result.skipped || 0,
      total: result.correct + result.wrong + result.skipped,
      examName: result.examName || 'Mock Test',
      subjectStats: {}
    };

    // Per-subject accuracy for this attempt
    if (result.subjectWise) {
      Object.entries(result.subjectWise).forEach(([subject, data]) => {
        historyEntry.subjectStats[subject] = {
          accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
          correct: data.correct,
          total: data.total
        };
      });
    }

    history.push(historyEntry);
    if (history.length > 20) history.shift();
    try { localStorage.setItem(this._historyKey, JSON.stringify(history)); } catch {}

    return progress;
  },

  // ── Calculate pseudo-percentile ──
  // Based on user's test history (self-percentile until server-side is ready)
  calculatePercentile(currentAccuracy) {
    const history = this.getHistory();
    if (history.length < 2) return null;

    // Count how many past tests had lower accuracy
    const lowerCount = history.filter(h => h.accuracy < currentAccuracy).length;
    return Math.round((lowerCount / history.length) * 100);
  },

  // ── Get improvement vs last test ──
  getImprovement(currentResult) {
    const history = this.getHistory();
    if (history.length < 2) return null;

    const prev = history[history.length - 2]; // Previous test
    if (!prev) return null;

    return {
      accuracyDelta: (currentResult.accuracy || 0) - prev.accuracy,
      scoreDelta: (currentResult.totalMarks || 0) - prev.score,
      prevAccuracy: prev.accuracy,
      prevScore: prev.score,
      trend: (currentResult.accuracy || 0) > prev.accuracy ? 'up' : (currentResult.accuracy || 0) < prev.accuracy ? 'down' : 'same'
    };
  },

  // ── Get accuracy timeline (last N tests) ──
  getTimeline(count = 10) {
    const history = this.getHistory();
    return history.slice(-count).map((h, i) => ({
      index: i + 1,
      accuracy: h.accuracy,
      score: h.score,
      date: h.date,
      examName: h.examName
    }));
  },

  // ── Get weak subjects from aggregate data ──
  getWeakSubjects() {
    const progress = this.getProgress();
    return Object.entries(progress.subjectHistory)
      .map(([name, data]) => ({
        name,
        accuracy: data.totalQuestions > 0 ? Math.round((data.totalCorrect / data.totalQuestions) * 100) : 0,
        correct: data.totalCorrect,
        total: data.totalQuestions,
        tests: data.tests
      }))
      .filter(s => s.total >= 5) // Only include if tested enough
      .sort((a, b) => a.accuracy - b.accuracy);
  },

  // ── Badge system ──
  _checkBadges(progress, result) {
    const newBadges = [];

    // First Test
    if (progress.totalTests === 1 && !progress.badges.includes('first_test')) {
      newBadges.push({ id: 'first_test', icon: '🎯', name: 'First Step', desc: 'Completed your first test' });
    }

    // 10 Tests
    if (progress.totalTests >= 10 && !progress.badges.includes('test_10')) {
      newBadges.push({ id: 'test_10', icon: '🔟', name: 'Dedicated', desc: 'Completed 10 tests' });
    }

    // 50 Tests
    if (progress.totalTests >= 50 && !progress.badges.includes('test_50')) {
      newBadges.push({ id: 'test_50', icon: '🏅', name: 'Veteran', desc: 'Completed 50 tests' });
    }

    // Speed Demon (< 30 sec avg)
    const avgTime = result.timeTaken ? result.timeTaken / (result.correct + result.wrong + result.skipped) : 0;
    if (avgTime > 0 && avgTime < 30 && !progress.badges.includes('speed_demon')) {
      newBadges.push({ id: 'speed_demon', icon: '⚡', name: 'Speed Demon', desc: 'Under 30s average per question' });
    }

    // Accuracy Master (>= 90%)
    if ((result.accuracy || 0) >= 90 && !progress.badges.includes('accuracy_master')) {
      newBadges.push({ id: 'accuracy_master', icon: '🎯', name: 'Accuracy Master', desc: '90%+ accuracy in a test' });
    }

    // Perfect Score
    if ((result.accuracy || 0) === 100 && !progress.badges.includes('perfect')) {
      newBadges.push({ id: 'perfect', icon: '💯', name: 'Perfect!', desc: '100% accuracy' });
    }

    // Streak badges
    if (progress.currentStreak >= 7 && !progress.badges.includes('streak_7')) {
      newBadges.push({ id: 'streak_7', icon: '🔥', name: '7-Day Streak', desc: '7 consecutive days of practice' });
    }
    if (progress.currentStreak >= 30 && !progress.badges.includes('streak_30')) {
      newBadges.push({ id: 'streak_30', icon: '🏆', name: 'Monthly Champion', desc: '30-day streak!' });
    }

    // Improvement
    const improvement = this.getImprovement(result);
    if (improvement && improvement.accuracyDelta >= 10 && !progress.badges.includes('improver')) {
      newBadges.push({ id: 'improver', icon: '📈', name: 'Rising Star', desc: '10%+ accuracy improvement' });
    }

    newBadges.forEach(b => progress.badges.push(b.id));

    // Show badge toast
    if (newBadges.length > 0 && typeof Helpers !== 'undefined') {
      newBadges.forEach(b => {
        setTimeout(() => {
          Helpers.showToast(`${b.icon} Badge Unlocked: ${b.name}`, 'success');
        }, 1500);
      });
    }

    return newBadges;
  },

  // ── Get all earned badges with details ──
  getBadges() {
    const progress = this.getProgress();
    const allBadges = [
      { id: 'first_test', icon: '🎯', name: 'First Step', desc: 'Completed your first test' },
      { id: 'test_10', icon: '🔟', name: 'Dedicated', desc: 'Completed 10 tests' },
      { id: 'test_50', icon: '🏅', name: 'Veteran', desc: 'Completed 50 tests' },
      { id: 'speed_demon', icon: '⚡', name: 'Speed Demon', desc: 'Under 30s per question' },
      { id: 'accuracy_master', icon: '🎯', name: 'Accuracy Master', desc: '90%+ accuracy' },
      { id: 'perfect', icon: '💯', name: 'Perfect!', desc: '100% accuracy' },
      { id: 'streak_7', icon: '🔥', name: '7-Day Streak', desc: '7 days in a row' },
      { id: 'streak_30', icon: '🏆', name: 'Monthly Champion', desc: '30-day streak' },
      { id: 'improver', icon: '📈', name: 'Rising Star', desc: '10%+ improvement' }
    ];

    return allBadges.map(b => ({
      ...b,
      earned: progress.badges.includes(b.id)
    }));
  },

  // ── Daily goals status ──
  getDailyGoals(result) {
    const progress = this.getProgress();
    const today = new Date().toISOString().split('T')[0];
    const testsToday = progress.dailyGoal.lastDate === today ? progress.dailyGoal.testsToday : 0;

    return [
      {
        text: 'Complete 1 Mock Test',
        done: testsToday >= 1,
        icon: '📝'
      },
      {
        text: 'Score above 50% accuracy',
        done: result ? (result.accuracy || 0) >= 50 : false,
        icon: '🎯'
      },
      {
        text: 'Answer 50+ questions',
        done: result ? (result.correct + result.wrong) >= 50 : false,
        icon: '💪'
      }
    ];
  }
};
