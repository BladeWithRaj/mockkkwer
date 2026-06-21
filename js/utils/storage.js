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
  },

  // ── Mistake Book (Bookmarked incorrect/skipped questions) ──
  getMistakeBook() {
    try {
      const stored = localStorage.getItem('mocktest_mistake_book');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  isQuestionInMistakeBook(questionId) {
    if (!questionId) return false;
    const book = this.getMistakeBook();
    return book.some(q => q.id === questionId);
  },

  saveMistakesToBook(questions) {
    if (!Array.isArray(questions) || questions.length === 0) return 0;
    try {
      const book = this.getMistakeBook();
      const bookIds = new Set(book.map(q => q.id));
      let addedCount = 0;
      questions.forEach(q => {
        if (!bookIds.has(q.id)) {
          book.push(q);
          addedCount++;
        }
      });
      localStorage.setItem('mocktest_mistake_book', JSON.stringify(book));
      return addedCount;
    } catch(e) {
      console.error("Could not save to mistake book:", e);
      return 0;
    }
  },

  addSingleMistake(question) {
    if (!question || !question.id) return false;
    try {
      const book = this.getMistakeBook();
      const exists = book.some(q => q.id === question.id);
      if (!exists) {
        book.push(question);
        localStorage.setItem('mocktest_mistake_book', JSON.stringify(book));
        return true;
      }
      return false;
    } catch(e) {
      console.error("Could not save single mistake:", e);
      return false;
    }
  },

  removeSingleMistake(questionId) {
    if (!questionId) return false;
    try {
      const book = this.getMistakeBook();
      const filtered = book.filter(q => q.id !== questionId);
      if (filtered.length !== book.length) {
        localStorage.setItem('mocktest_mistake_book', JSON.stringify(filtered));
        return true;
      }
      return false;
    } catch(e) {
      console.error("Could not remove mistake:", e);
      return false;
    }
  },

  clearMistakeBook() {
    localStorage.removeItem('mocktest_mistake_book');
  },

  // ── Cleanup methods (used by Auth logout) ──

  clearHistory() {
    localStorage.removeItem(this.KEYS.HISTORY);
  },

  clearAll() {
    // Clear everything managed by Storage
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    localStorage.removeItem('mocktest_seen_questions');
    localStorage.removeItem('upgradePromptDismissed');
  }
};
