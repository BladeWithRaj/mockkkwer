// ============================================
// STORAGE — Doc 10 §18, §29C
// Central storage service with namespace registry.
// Engines own their own STORAGE_KEY constants but
// Storage.ALL_KEYS knows about ALL of them for
// cleanup, diagnostics, and future sync.
// ============================================

const Storage = {

  // Schema version — bump when storage shape changes.
  // Future: run migrations between versions.
  SCHEMA_VERSION: 1,

  // ── Primary keys (owned by Storage) ──
  KEYS: {
    HISTORY: 'mocktest_history',
    SETTINGS: 'mocktest_settings',
    CURRENT_TEST: 'mocktest_current',
    USER_ID: 'user_id',
    USERNAME: 'username',
    FALLBACK_QUEUE: 'mocktest_fallback_queue'
  },

  // ── ALL known localStorage keys across the entire platform ──
  // Engines define their own STORAGE_KEY constant internally.
  // This list is the central registry for clearAll() + diagnostics.
  ALL_KEYS: [
    // Core (owned by Storage)
    'mocktest_history', 'mocktest_settings', 'mocktest_current',
    'user_id', 'username', 'mocktest_fallback_queue',
    // Question tracking
    'mocktest_seen_questions', 'mocktest_mistake_book',
    // Bookmarks & Flashcards (Doc 7, Doc 8)
    'mocktest_bookmarks', 'mocktest_flashcards',
    // Learning engine (Doc 8)
    'mocktest_learning_profile', 'mocktest_confidence_log', 'mocktest_insight_feedback',
    // Gamification (Doc 9)
    'mtp_cached_profile', 'mtp_missions', 'mtp_event_timeline', 'mtp_user_plan',
    // Daily/Streak system
    'mocktest_streak', 'mocktest_daily_done', 'mocktest_progress',
    // Misc engine state
    'question_reports', 'upgradePromptDismissed',
    // Doc 11: Sync state
    'used_ids', 'mtp_last_sync',
    // Schema version
    'mtp_schema_version',
    // Doc 18: Intelligence snapshots
    'mtp_intelligence',
    // Doc 19: Cognitive behaviour snapshots
    'mtp_behaviour',
    // Doc 20: Mistake DNA snapshots
    'mtp_mistake_dna',
    // Doc 21: Correction Intelligence records
    'mtp_correction',
    // Doc 22: Predictive Intelligence data
    'mtp_predictions',
    // Doc 23: Digital Twin records
    'mtp_digital_twin_profile',
    'mtp_simulation_runs',
    'mtp_simulation_results',
    'mtp_study_plans',
    'mtp_weather_snapshots',
    // Doc 24: Learning Orchestrator (LODE) records
    'mtp_decision_history',
    'mtp_engine_trust',
    'mtp_consensus_logs',
    // Doc 25: Adaptive Assessment Engine (AAE) records
    'mtp_question_intelligence',
    'mtp_question_relationships',
    'mtp_assessment_sessions',
    'mtp_assessment_quality',
    'mtp_learning_gain_history',
    'mtp_diagnostic_questions',
    'mtp_verification_attempts',
    'mtp_adaptive_blueprints'
  ],

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

  // ── Bookmarks (Doc 7 §13 — test-time bookmarks) ──
  getBookmarks() {
    try {
      const raw = localStorage.getItem('mocktest_bookmarks');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  },

  setBookmarks(bookmarks) {
    try {
      localStorage.setItem('mocktest_bookmarks', JSON.stringify(bookmarks || {}));
    } catch(e) { console.error('Could not save bookmarks:', e); }
  },

  // ── Flashcards (Doc 8 §12) ──
  getFlashcards() {
    try {
      const raw = localStorage.getItem('mocktest_flashcards');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  saveFlashcards(cards) {
    try {
      // Cap at 500 cards to prevent localStorage bloat
      const capped = Array.isArray(cards) ? cards.slice(-500) : [];
      localStorage.setItem('mocktest_flashcards', JSON.stringify(capped));
    } catch(e) { console.error('Could not save flashcards:', e); }
  },

  // ── Learning Profile (Doc 8 §28A) ──
  getLearningProfile() {
    try {
      const raw = localStorage.getItem('mocktest_learning_profile');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  saveLearningProfile(profile) {
    try {
      localStorage.setItem('mocktest_learning_profile', JSON.stringify(profile));
    } catch(e) { console.error('Could not save learning profile:', e); }
  },

  // ── Confidence Log (Doc 8 §9) ──
  getConfidenceLog() {
    try {
      const raw = localStorage.getItem('mocktest_confidence_log');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  },

  addConfidenceEntry(entry) {
    // entry: { qId, answer, confidence, wasCorrect, subject, ts }
    try {
      const log = this.getConfidenceLog();
      log.push({ ...entry, ts: entry.ts || Date.now() });
      // Keep last 1000 entries
      if (log.length > 1000) log.splice(0, log.length - 1000);
      localStorage.setItem('mocktest_confidence_log', JSON.stringify(log));
    } catch(e) { console.error('Could not save confidence entry:', e); }
  },

  // Backfill correctness onto confidence entries recorded during a test.
  // Confidence is logged mid-test with wasCorrect:null (correctness unknown
  // until submit). This joins the outcome back by qId so the Confidence Matrix
  // and Mistake DNA can distinguish high-confidence-wrong from calibrated.
  // correctnessById: { [qId]: boolean }. Only updates entries still null, so
  // re-running a review of an old test never clobbers a prior outcome.
  backfillConfidenceCorrectness(correctnessById) {
    if (!correctnessById || typeof correctnessById !== 'object') return 0;
    try {
      const log = this.getConfidenceLog();
      let updated = 0;
      for (let i = log.length - 1; i >= 0; i--) {
        const e = log[i];
        if (e && (e.wasCorrect === null || e.wasCorrect === undefined)
            && correctnessById.hasOwnProperty(e.qId)) {
          e.wasCorrect = !!correctnessById[e.qId];
          updated++;
        }
      }
      if (updated > 0) localStorage.setItem('mocktest_confidence_log', JSON.stringify(log));
      return updated;
    } catch(e) { console.warn('[Storage] Confidence backfill error:', e.message); return 0; }
  },

  // ── AI Insights Feedback (Doc 8 §28E) ──
  getInsightFeedback() {
    try {
      const raw = localStorage.getItem('mocktest_insight_feedback');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  },

  saveInsightFeedback(insightId, vote) {
    // vote: 'up' | 'down'
    try {
      const fb = this.getInsightFeedback();
      fb[insightId] = { vote, ts: Date.now() };
      localStorage.setItem('mocktest_insight_feedback', JSON.stringify(fb));
    } catch(e) { console.error('Could not save insight feedback:', e); }
  },

  // ── Cleanup methods (used by Auth logout) ──

  clearHistory() {
    localStorage.removeItem(this.KEYS.HISTORY);
  },

  /** Clear ALL known storage keys across the entire platform.
   *  Uses the central ALL_KEYS registry so no key is ever orphaned. */
  clearAll() {
    this.ALL_KEYS.forEach(key => {
      try { localStorage.removeItem(key); } catch(e) {}
    });
    console.log('[Storage] clearAll: removed', this.ALL_KEYS.length, 'keys');
  },


  // ── Diagnostics (Doc 10 §29D) ──

  /** Returns storage pressure stats for debugging */
  getDiagnostics() {
    const diag = { keys: [], totalBytes: 0, keyCount: 0 };
    this.ALL_KEYS.forEach(key => {
      try {
        const val = localStorage.getItem(key);
        if (val !== null) {
          const bytes = new Blob([val]).size;
          diag.keys.push({ key, bytes, chars: val.length });
          diag.totalBytes += bytes;
          diag.keyCount++;
        }
      } catch(e) {}
    });
    diag.keys.sort((a, b) => b.bytes - a.bytes);
    diag.totalKB = Math.round(diag.totalBytes / 1024 * 10) / 10;
    return diag;
  },


  // ── Schema Version (Doc 10 §29C) ──

  /** Check and set schema version. Future: run migrations. */
  checkSchema() {
    try {
      const stored = parseInt(localStorage.getItem('mtp_schema_version') || '0');
      if (stored < this.SCHEMA_VERSION) {
        // Future: run migrations for each version step
        // For now, just set the version
        localStorage.setItem('mtp_schema_version', String(this.SCHEMA_VERSION));
        console.log(`[Storage] Schema upgraded: v${stored} → v${this.SCHEMA_VERSION}`);
      }
    } catch(e) {}
  }
};

