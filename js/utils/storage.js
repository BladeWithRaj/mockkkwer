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
    USER_ID: 'user_id',
    USERNAME: 'username',
    FALLBACK_QUEUE: 'mocktest_fallback_queue'
  },

  // ── User Identity ──
  getUserId() {
    let id = localStorage.getItem(this.KEYS.USER_ID);
    if (!id) {
      // Create a persistent unique UUID for this browser
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "user_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
      localStorage.setItem(this.KEYS.USER_ID, id);
    }
    return id;
  },

  getUsername() {
    return localStorage.getItem(this.KEYS.USERNAME);
  },

  setUsername(name) {
    localStorage.setItem(this.KEYS.USERNAME, name);
  },

  // ── Fallback Queue (Offline Support) ──
  addToFallbackQueue(result) {
    const queue = this.getFallbackQueue();
    queue.push(result);
    localStorage.setItem(this.KEYS.FALLBACK_QUEUE, JSON.stringify(queue));
    console.log("Added result to fallback queue. Total pending:", queue.length);
  },

  getFallbackQueue() {
    const stored = localStorage.getItem(this.KEYS.FALLBACK_QUEUE);
    return stored ? JSON.parse(stored) : [];
  },

  clearFallbackQueue() {
    localStorage.removeItem(this.KEYS.FALLBACK_QUEUE);
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
  },

  // ── Smart Question Tracking ──
  getSeenQuestions() {
    try {
      return JSON.parse(localStorage.getItem('mocktest_seen_questions')) || [];
    } catch {
      return [];
    }
  },

  addSeenQuestions(ids) {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      let seen = this.getSeenQuestions();
      // Add new ids, keeping only unique
      const seenSet = new Set([...seen, ...ids]);
      // Cap at last 500 to prevent localstorage bloat
      seen = Array.from(seenSet).slice(-500);
      localStorage.setItem('mocktest_seen_questions', JSON.stringify(seen));
    } catch(e) {
      console.error("Could not save seen questions:", e);
    }
  }
};
