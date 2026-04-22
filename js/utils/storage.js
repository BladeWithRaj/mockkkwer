// ============================================
// STORAGE — Only for test history & settings
// Questions come from DB via window.QUESTION_BANK
// NO local question storage. NO getQuestionBank.
// ============================================

const Storage = {
  KEYS: {
    HISTORY: 'mocktest_history',
    SETTINGS: 'mocktest_settings',
    CURRENT_TEST: 'mocktest_current',
  },

  // ── Test History ──
  getHistory() {
    const stored = localStorage.getItem(this.KEYS.HISTORY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  saveTestResult(result) {
    const history = this.getHistory();
    result.id = Helpers.generateId();
    result.date = new Date().toISOString();
    history.unshift(result);
    if (history.length > 50) history.length = 50;
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
    return result;
  },

  // ── Current Test State (for resume) ──
  saveCurrentTest(testState) {
    localStorage.setItem(this.KEYS.CURRENT_TEST, JSON.stringify(testState));
  },

  getCurrentTest() {
    const stored = localStorage.getItem(this.KEYS.CURRENT_TEST);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  },

  clearCurrentTest() {
    localStorage.removeItem(this.KEYS.CURRENT_TEST);
  },

  // ── Settings ──
  getSettings() {
    const stored = localStorage.getItem(this.KEYS.SETTINGS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return {};
      }
    }
    return {};
  },

  saveSettings(settings) {
    localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
  },

  // ── Stats ──
  getStats() {
    const history = this.getHistory();
    const questions = window.QUESTION_BANK || [];
    return {
      totalQuestions: questions.length,
      testsTaken: history.length,
      avgAccuracy: history.length > 0
        ? Math.round(history.reduce((sum, t) => sum + (t.accuracy || 0), 0) / history.length)
        : 0,
      totalTimePracticed: history.reduce((sum, t) => sum + (t.timeTaken || 0), 0)
    };
  }
};
