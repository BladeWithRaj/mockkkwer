// ============================================
// MOCK TEST PLATFORM — Storage Utilities
// ============================================

const Storage = {
  KEYS: {
    QUESTIONS: 'mocktest_questions',
    HISTORY: 'mocktest_history',
    SETTINGS: 'mocktest_settings',
    CURRENT_TEST: 'mocktest_current',
  },

  // ── Question Bank ──
  getQuestionBank() {
    const stored = localStorage.getItem(this.KEYS.QUESTIONS);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Merge with default questions (avoid duplicates by ID)
        const defaultIds = new Set(QUESTION_BANK.map(q => q.id));
        const customQuestions = parsed.filter(q => !defaultIds.has(q.id));
        return [...QUESTION_BANK, ...customQuestions];
      } catch (e) {
        return [...QUESTION_BANK];
      }
    }
    return [...QUESTION_BANK];
  },

  getCustomQuestions() {
    const stored = localStorage.getItem(this.KEYS.QUESTIONS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  saveCustomQuestions(questions) {
    localStorage.setItem(this.KEYS.QUESTIONS, JSON.stringify(questions));
  },

  addQuestion(question) {
    const custom = this.getCustomQuestions();
    custom.push(question);
    this.saveCustomQuestions(custom);
  },

  updateQuestion(id, updatedQuestion) {
    // Check if it's a default question — can't edit defaults, but we override
    const custom = this.getCustomQuestions();
    const idx = custom.findIndex(q => q.id === id);
    if (idx !== -1) {
      custom[idx] = { ...custom[idx], ...updatedQuestion };
    } else {
      // It's a default question being overridden
      custom.push({ ...updatedQuestion, id });
    }
    this.saveCustomQuestions(custom);
  },

  deleteQuestion(id) {
    const custom = this.getCustomQuestions();
    const filtered = custom.filter(q => q.id !== id);
    this.saveCustomQuestions(filtered);
    // Note: can't delete default questions, only custom ones
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
    history.unshift(result); // newest first
    // Keep only last 50 results
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
    const questions = this.getQuestionBank();
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
