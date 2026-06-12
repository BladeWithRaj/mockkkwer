/**
 * ═══════════════════════════════════════════════
 * Mock24hr — Guest Tracking System
 * Zero-login user tracking via localStorage + Supabase
 * ═══════════════════════════════════════════════
 */

const SUPABASE_URL = 'https://ygzqmcmiroomjajoxezt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlnenFtY21pcm9vbWpham94ZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4Mjc0OTUsImV4cCI6MjA5MjQwMzQ5NX0.DqVHJJQqhdYb25P3TYM5do_5y5PuWYxQ55ZBIbR6sdc';
const GUEST_STORAGE_KEY = 'm24_guest';
const RECOVERY_STORAGE_KEY = 'm24_recovery';

// ─── Supabase REST helper ───
async function sbRequest(table, method = 'GET', body = null, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : 
              method === 'PATCH' ? 'return=representation' : undefined
  };
  // Remove undefined headers
  Object.keys(headers).forEach(k => headers[k] === undefined && delete headers[k]);

  try {
    const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[GuestTracker] ${method} ${table} failed:`, err);
      return null;
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch (e) {
    console.error(`[GuestTracker] Network error:`, e);
    return null;
  }
}

// ─── Phase 1: Anonymous Identity ───

function generateGuestId() {
  const chars = 'abcdef0123456789';
  let id = 'guest_';
  for (let i = 0; i < 16; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

function generateRecoveryCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0,O,I,1 confusion
  let code = 'M24-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getDeviceType() {
  const w = window.innerWidth;
  if (w <= 640) return 'mobile';
  if (w <= 1024) return 'tablet';
  return 'desktop';
}

function getBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return 'Other';
}

// ─── Guest Manager (Singleton) ───

const GuestTracker = {
  _guestId: null,
  _recoveryCode: null,
  _initialized: false,

  /**
   * Initialize guest tracking — call once on page load.
   * Creates or loads guest identity from localStorage.
   */
  async init() {
    if (this._initialized) return this._guestId;

    // Try loading from localStorage
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this._guestId = data.guest_id;
        this._recoveryCode = data.recovery_code;
      } catch (e) {
        // Corrupt data, regenerate
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
    }

    // Generate new guest if none exists
    if (!this._guestId) {
      this._guestId = generateGuestId();
      this._recoveryCode = generateRecoveryCode();

      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({
        guest_id: this._guestId,
        recovery_code: this._recoveryCode,
        created_at: new Date().toISOString()
      }));

      // Register in Supabase
      await sbRequest('guest_users', 'POST', {
        guest_id: this._guestId,
        recovery_code: this._recoveryCode,
        device_type: getDeviceType(),
        browser: getBrowser()
      });

      console.log('[GuestTracker] New guest registered:', this._guestId);
    } else {
      // Update last_seen
      await sbRequest('guest_users', 'PATCH', 
        { last_seen_at: new Date().toISOString() },
        `?guest_id=eq.${this._guestId}`
      );
    }

    this._initialized = true;
    return this._guestId;
  },

  /** Get current guest ID */
  getGuestId() {
    return this._guestId;
  },

  /** Get recovery code for cross-device sync */
  getRecoveryCode() {
    return this._recoveryCode;
  },

  // ─── Phase 2: Attempt Tracking ───

  /**
   * Record a completed test attempt.
   * @param {Object} result - Test result data
   * @param {string} result.examSlug - e.g. 'ssc-cgl'
   * @param {string} result.stageSlug - e.g. 'tier-1'
   * @param {string} result.mode - 'mock' | 'practice' | 'pyq' | 'topic'
   * @param {number} result.totalQuestions
   * @param {number} result.attempted
   * @param {number} result.correct
   * @param {number} result.wrong
   * @param {number} result.skipped
   * @param {number} result.score
   * @param {number} result.accuracy
   * @param {number} result.timeTaken - seconds
   * @param {Object} result.subjectStats - { "math": {correct:5, wrong:2}, ... }
   * @param {Array}  result.weakTopics - ["percentage", "ratio"]
   */
  async recordAttempt(result) {
    if (!this._guestId) await this.init();

    const attempt = {
      guest_id: this._guestId,
      exam_slug: result.examSlug,
      stage_slug: result.stageSlug || null,
      mode: result.mode || 'mock',
      total_questions: result.totalQuestions || 0,
      attempted: result.attempted || 0,
      correct: result.correct || 0,
      wrong: result.wrong || 0,
      skipped: result.skipped || 0,
      score: result.score || 0,
      accuracy: result.accuracy || 0,
      time_taken: result.timeTaken || 0,
      subject_stats: result.subjectStats || null,
      weak_topics: result.weakTopics || null
    };

    const res = await sbRequest('guest_attempts', 'POST', attempt);

    // Update guest_users.tests_given
    if (res) {
      await sbRequest('guest_users', 'PATCH',
        { tests_given: undefined }, // Will use RPC below
        `?guest_id=eq.${this._guestId}`
      );
      // Increment tests_given via raw update
      await sbRequest('rpc/increment_guest_tests', 'POST', {
        p_guest_id: this._guestId
      });
    }

    // Update progress
    await this._updateProgress(result);

    // Update topic stats
    if (result.subjectStats) {
      await this._updateTopicStats(result.examSlug, result.subjectStats);
    }

    // Track event
    await this.trackEvent('test_completed', {
      exam: result.examSlug,
      stage: result.stageSlug,
      score: result.score,
      accuracy: result.accuracy
    });

    return res;
  },

  // ─── Phase 3: Progress Tracking ───

  async _updateProgress(result) {
    const examSlug = result.examSlug;
    const stageSlug = result.stageSlug || '__all__';

    // Check if progress row exists
    const existing = await sbRequest('guest_progress', 'GET', null,
      `?guest_id=eq.${this._guestId}&exam_slug=eq.${examSlug}&stage_slug=eq.${stageSlug}&select=*`
    );

    if (existing && existing.length > 0) {
      const p = existing[0];
      const newAttempts = p.total_attempts + 1;
      const newQuestionsAttempted = p.questions_attempted + (result.attempted || 0);
      const newBestScore = Math.max(p.best_score, result.score || 0);
      const newAvgScore = ((p.avg_score * p.total_attempts) + (result.score || 0)) / newAttempts;
      const newAvgAccuracy = ((p.avg_accuracy * p.total_attempts) + (result.accuracy || 0)) / newAttempts;
      const newAvgTime = Math.round(((p.avg_time * p.total_attempts) + (result.timeTaken || 0)) / newAttempts);

      await sbRequest('guest_progress', 'PATCH', {
        total_attempts: newAttempts,
        questions_attempted: newQuestionsAttempted,
        best_score: newBestScore,
        avg_score: Math.round(newAvgScore * 100) / 100,
        avg_accuracy: Math.round(newAvgAccuracy * 100) / 100,
        avg_time: newAvgTime,
        last_activity: new Date().toISOString()
      }, `?id=eq.${p.id}`);
    } else {
      await sbRequest('guest_progress', 'POST', {
        guest_id: this._guestId,
        exam_slug: examSlug,
        stage_slug: stageSlug,
        total_attempts: 1,
        questions_attempted: result.attempted || 0,
        best_score: result.score || 0,
        avg_score: result.score || 0,
        avg_accuracy: result.accuracy || 0,
        avg_time: result.timeTaken || 0,
        last_activity: new Date().toISOString()
      });
    }
  },

  // ─── Phase 4: Weak Topic Tracking ───

  async _updateTopicStats(examSlug, subjectStats) {
    for (const [topic, stats] of Object.entries(subjectStats)) {
      const topicSlug = topic.toLowerCase().replace(/\s+/g, '-');
      const correct = stats.correct || 0;
      const wrong = stats.wrong || 0;
      const total = correct + wrong;

      // Check existing
      const existing = await sbRequest('guest_topic_stats', 'GET', null,
        `?guest_id=eq.${this._guestId}&exam_slug=eq.${examSlug}&topic_slug=eq.${topicSlug}&select=*`
      );

      if (existing && existing.length > 0) {
        const t = existing[0];
        const newCorrect = t.correct + correct;
        const newWrong = t.wrong + wrong;
        const newTotal = newCorrect + newWrong;
        const newAccuracy = newTotal > 0 ? Math.round((newCorrect / newTotal) * 10000) / 100 : 0;

        await sbRequest('guest_topic_stats', 'PATCH', {
          correct: newCorrect,
          wrong: newWrong,
          total: newTotal,
          accuracy: newAccuracy,
          last_updated: new Date().toISOString()
        }, `?id=eq.${t.id}`);
      } else {
        const accuracy = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;
        await sbRequest('guest_topic_stats', 'POST', {
          guest_id: this._guestId,
          exam_slug: examSlug,
          topic_slug: topicSlug,
          correct,
          wrong,
          total,
          accuracy
        });
      }
    }
  },

  // ─── Phase 5: Cross-Device Recovery ───

  /**
   * Restore guest data from a recovery code.
   * @param {string} code - Recovery code like 'M24-7F2K9A'
   * @returns {Object|null} Guest data if found
   */
  async restoreFromCode(code) {
    const normalized = code.toUpperCase().trim();
    const result = await sbRequest('guest_users', 'GET', null,
      `?recovery_code=eq.${normalized}&select=*`
    );

    if (result && result.length > 0) {
      const guest = result[0];

      // Save to localStorage
      this._guestId = guest.guest_id;
      this._recoveryCode = guest.recovery_code;
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({
        guest_id: guest.guest_id,
        recovery_code: guest.recovery_code,
        restored_at: new Date().toISOString()
      }));

      // Update last_seen
      await sbRequest('guest_users', 'PATCH',
        { last_seen_at: new Date().toISOString(), device_type: getDeviceType(), browser: getBrowser() },
        `?guest_id=eq.${guest.guest_id}`
      );

      this._initialized = true;
      console.log('[GuestTracker] Restored from code:', normalized);
      return guest;
    }

    return null;
  },

  // ─── Phase 6: Analytics Events ───

  /**
   * Track a behavioral event.
   * @param {string} eventName - e.g. 'home_visit', 'ssc_cgl_click'
   * @param {Object} eventData - Additional data
   */
  async trackEvent(eventName, eventData = null) {
    // Fire and forget — don't block UI
    sbRequest('guest_events', 'POST', {
      guest_id: this._guestId || 'anonymous',
      event_name: eventName,
      event_data: eventData,
      page_url: window.location.pathname
    }).catch(() => {}); // Silently fail
  },

  // ─── Data Retrieval ───

  /** Get all attempts for current guest */
  async getAttempts(examSlug = null) {
    if (!this._guestId) return [];
    let query = `?guest_id=eq.${this._guestId}&order=created_at.desc&select=*`;
    if (examSlug) query += `&exam_slug=eq.${examSlug}`;
    return await sbRequest('guest_attempts', 'GET', null, query) || [];
  },

  /** Get progress summary for current guest */
  async getProgress(examSlug = null) {
    if (!this._guestId) return [];
    let query = `?guest_id=eq.${this._guestId}&select=*`;
    if (examSlug) query += `&exam_slug=eq.${examSlug}`;
    return await sbRequest('guest_progress', 'GET', null, query) || [];
  },

  /** Get weak topics (sorted by accuracy, ascending) */
  async getWeakTopics(examSlug, limit = 10) {
    if (!this._guestId) return [];
    return await sbRequest('guest_topic_stats', 'GET', null,
      `?guest_id=eq.${this._guestId}&exam_slug=eq.${examSlug}&total=gte.3&order=accuracy.asc&limit=${limit}&select=*`
    ) || [];
  },

  /** Get strong topics (sorted by accuracy, descending) */
  async getStrongTopics(examSlug, limit = 10) {
    if (!this._guestId) return [];
    return await sbRequest('guest_topic_stats', 'GET', null,
      `?guest_id=eq.${this._guestId}&exam_slug=eq.${examSlug}&total=gte.3&order=accuracy.desc&limit=${limit}&select=*`
    ) || [];
  },

  /** Get full dashboard data for a guest */
  async getDashboard() {
    if (!this._guestId) return null;

    const [progress, attempts, user] = await Promise.all([
      this.getProgress(),
      this.getAttempts(),
      sbRequest('guest_users', 'GET', null, `?guest_id=eq.${this._guestId}&select=*`)
    ]);

    return {
      guestId: this._guestId,
      recoveryCode: this._recoveryCode,
      user: user?.[0] || null,
      progress: progress || [],
      recentAttempts: (attempts || []).slice(0, 10),
      totalTests: user?.[0]?.tests_given || 0
    };
  }
};

// ─── Auto-initialize on page load ───
if (typeof window !== 'undefined') {
  window.GuestTracker = GuestTracker;
  
  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GuestTracker.init());
  } else {
    GuestTracker.init();
  }
}

export default GuestTracker;
