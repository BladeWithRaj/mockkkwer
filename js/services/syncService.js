// ============================================
// SYNC SERVICE — Doc 11 §29B
// Bridge between localStorage (offline-first)
// and Supabase (cloud sync).
//
// Pattern:
//   Write locally first (instant) →
//   Queue sync to Supabase (async) →
//   On login, pull from server →
//   Merge (server wins for conflicts)
//
// Dependencies: supabaseClient.js (client),
//               storage.js (Storage),
//               auth.js (Auth)
// ============================================

const SyncService = {

  _syncQueue: [],
  _isSyncing: false,
  _initialized: false,

  // Doc 15 §29B: Sync health metrics
  _metrics: {
    totalSyncs: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSyncTime: null,
    lastSyncStatus: null,
    lastSyncDuration: null,
    retryCount: 0,
    totalEventsQueued: 0,
    totalEventsFlushed: 0
  },


  // ═══════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════

  init() {
    if (this._initialized) return;
    this._initialized = true;

    // Subscribe to EventBus for auto-sync triggers
    if (typeof EventBus !== 'undefined') {
      EventBus.on(EventBus.EVENTS.MOCK_COMPLETED, (data) => {
        this._queueEvent('mock_completed', data);
      });
      EventBus.on(EventBus.EVENTS.FLASHCARD_REVIEWED, (data) => {
        this._queueEvent('flashcard_reviewed', data);
      });
      EventBus.on(EventBus.EVENTS.ACHIEVEMENT_UNLOCKED, (data) => {
        this._queueEvent('achievement_unlocked', data);
      });
      EventBus.on(EventBus.EVENTS.REVISION_COMPLETED, (data) => {
        this._queueEvent('revision_completed', data);
      });
    }

    console.log('[SyncService] Initialized — offline-first mode');
  },


  // ═══════════════════════════════════════════
  // AUTH-GATED: Only sync when logged in
  // ═══════════════════════════════════════════

  _getUserId() {
    if (typeof Auth === 'undefined') return null;
    const user = Auth.getUser?.();
    return user?.id || null;
  },

  _isLoggedIn() {
    return !!this._getUserId();
  },


  // ═══════════════════════════════════════════
  // LEARNING PROFILE SYNC (§9)
  // ═══════════════════════════════════════════

  /** Push local learning profile to Supabase */
  async syncLearningProfile() {
    const userId = this._getUserId();
    if (!userId) return { synced: false, reason: 'not_logged_in' };

    try {
      const profile = Storage.getLearningProfile?.();
      if (!profile) return { synced: false, reason: 'no_local_profile' };

      const { error } = await client
        .from('learning_profiles')
        .upsert({
          user_id: userId,
          accuracy: profile.accuracy || 0,
          speed: profile.speed || 0,
          consistency: profile.consistency || 0,
          confidence: profile.confidence || 0,
          weak_topics: profile.weakTopics || [],
          strong_topics: profile.strongTopics || [],
          revision_score: profile.revisionScore || 0,
          subject_stats: profile.subjectStats || {},
          total_tests: profile.totalTests || 0,
          total_questions_seen: profile.totalQuestionsSeen || 0,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) {
        console.warn('[SyncService] Learning profile sync failed:', error.message);
        return { synced: false, reason: error.message };
      }

      console.log('[SyncService] Learning profile synced ✓');
      return { synced: true };
    } catch (e) {
      console.warn('[SyncService] Learning profile sync error:', e.message);
      return { synced: false, reason: e.message };
    }
  },

  /** Pull learning profile from Supabase → localStorage */
  async pullLearningProfile() {
    const userId = this._getUserId();
    if (!userId) return null;

    try {
      const { data, error } = await client
        .from('learning_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      // Convert DB schema → local schema
      const localProfile = {
        accuracy: data.accuracy,
        speed: data.speed,
        consistency: data.consistency,
        confidence: data.confidence,
        weakTopics: data.weak_topics || [],
        strongTopics: data.strong_topics || [],
        revisionScore: data.revision_score,
        subjectStats: data.subject_stats || {},
        totalTests: data.total_tests,
        totalQuestionsSeen: data.total_questions_seen,
        lastSyncedAt: data.updated_at
      };

      Storage.saveLearningProfile?.(localProfile);
      console.log('[SyncService] Learning profile pulled from cloud ✓');
      return localProfile;
    } catch (e) {
      console.warn('[SyncService] Pull learning profile error:', e.message);
      return null;
    }
  },


  // ═══════════════════════════════════════════
  // FLASHCARD SYNC (§14)
  // ═══════════════════════════════════════════

  /** Push local flashcards to Supabase (additive merge) */
  async syncFlashcards() {
    const userId = this._getUserId();
    if (!userId) return { synced: false, reason: 'not_logged_in' };

    try {
      const localCards = Storage.getFlashcards?.() || [];
      if (localCards.length === 0) return { synced: true, count: 0 };

      // Get existing cloud card IDs to avoid duplicates
      const { data: existing } = await client
        .from('student_flashcards')
        .select('question_id')
        .eq('user_id', userId);

      const existingIds = new Set((existing || []).map(e => e.question_id));

      // Only push new cards (not already in cloud)
      const newCards = localCards
        .filter(c => c.questionId && !existingIds.has(c.questionId))
        .map(c => ({
          user_id: userId,
          question_id: c.questionId,
          front: c.front || c.question || 'Flashcard',
          back: c.back || c.answer || '',
          subject: c.subject || '',
          ease_factor: c.easeFactor || 2.5,
          interval: c.interval || 1,
          review_count: c.reviewCount || 0,
          correct_count: c.correctCount || 0,
          next_review_at: c.nextReviewAt ? new Date(c.nextReviewAt).toISOString() : new Date().toISOString(),
          source: c.source || 'auto'
        }));

      if (newCards.length === 0) return { synced: true, count: 0 };

      const { error } = await client
        .from('student_flashcards')
        .insert(newCards);

      if (error) {
        console.warn('[SyncService] Flashcard sync failed:', error.message);
        return { synced: false, reason: error.message };
      }

      console.log(`[SyncService] ${newCards.length} flashcards synced ✓`);
      return { synced: true, count: newCards.length };
    } catch (e) {
      console.warn('[SyncService] Flashcard sync error:', e.message);
      return { synced: false, reason: e.message };
    }
  },


  // ═══════════════════════════════════════════
  // EVENT SYNC (§11)
  // ═══════════════════════════════════════════

  /** Queue an event for async sync */
  _queueEvent(event, data) {
    this._syncQueue.push({ event, data, time: Date.now() });

    // Auto-flush when queue hits 10 or after 30 seconds
    if (this._syncQueue.length >= 10) {
      this._flushEvents();
    } else if (!this._flushTimer) {
      this._flushTimer = setTimeout(() => {
        this._flushEvents();
        this._flushTimer = null;
      }, 30000);
    }
  },

  /** Flush queued events to Supabase */
  async _flushEvents() {
    const userId = this._getUserId();
    if (!userId || this._syncQueue.length === 0) return;

    if (this._isSyncing) return;
    this._isSyncing = true;

    try {
      const batch = this._syncQueue.splice(0, 50); // max 50 per batch
      const rows = batch.map(e => ({
        user_id: userId,
        event: e.event,
        data: e.data || {},
        session_id: sessionStorage.getItem('_cbt_attempt_id') || null,
        created_at: new Date(e.time).toISOString()
      }));

      const { error } = await client
        .from('student_events')
        .insert(rows);

      if (error) {
        // Put events back in queue on failure
        this._syncQueue.unshift(...batch);
        console.warn('[SyncService] Event flush failed:', error.message);
      } else {
        console.log(`[SyncService] ${rows.length} events flushed ✓`);
      }
    } catch (e) {
      console.warn('[SyncService] Event flush error:', e.message);
    } finally {
      this._isSyncing = false;
    }
  },


  // ═══════════════════════════════════════════
  // SUBSCRIPTION SYNC (§22)
  // ═══════════════════════════════════════════

  /** Pull subscription status from Supabase → FeatureFlags */
  async pullSubscription() {
    const userId = this._getUserId();
    if (!userId) return null;

    try {
      const { data, error } = await client
        .from('subscriptions')
        .select('plan, status, expires_at')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error || !data) {
        // No active subscription = free plan
        if (typeof FeatureFlags !== 'undefined') {
          FeatureFlags.setPlan('free');
        }
        return { plan: 'free' };
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        if (typeof FeatureFlags !== 'undefined') {
          FeatureFlags.setPlan('free');
        }
        return { plan: 'free', expired: true };
      }

      if (typeof FeatureFlags !== 'undefined') {
        FeatureFlags.setPlan(data.plan);
      }

      console.log(`[SyncService] Subscription: ${data.plan} ✓`);
      return { plan: data.plan };
    } catch (e) {
      console.warn('[SyncService] Subscription pull error:', e.message);
      return null;
    }
  },


  // ═══════════════════════════════════════════
  // FULL SYNC (called on login)
  // ═══════════════════════════════════════════

  /** Sync everything — called after login or on app start */
  async syncAll() {
    if (!this._isLoggedIn()) {
      console.log('[SyncService] Not logged in — skipping cloud sync');
      return { synced: false };
    }

    console.log('[SyncService] Starting full sync...');
    const startTime = Date.now();
    this._metrics.totalSyncs++;

    try {
      const results = {};

      // Pull from cloud first (server wins)
      results.subscription = await this.pullSubscription();
      results.learningProfile = await this.pullLearningProfile();

      // Push local data to cloud
      results.flashcards = await this.syncFlashcards();
      results.learningProfilePush = await this.syncLearningProfile();

      // Flush any queued events
      await this._flushEvents();

      // Doc 15 §29B: Update metrics
      this._metrics.successfulSyncs++;
      this._metrics.lastSyncTime = new Date().toISOString();
      this._metrics.lastSyncStatus = 'success';
      this._metrics.lastSyncDuration = Date.now() - startTime;

      console.log(`[SyncService] Full sync complete (${this._metrics.lastSyncDuration}ms):`, results);

      // Doc 12 §24A: Notify all consumers that sync is done
      if (typeof EventBus !== 'undefined') {
        EventBus.emit('sync_completed', results);
      }

      return { synced: true, results };
    } catch (err) {
      // Doc 15 §29B: Track failure
      this._metrics.failedSyncs++;
      this._metrics.lastSyncTime = new Date().toISOString();
      this._metrics.lastSyncStatus = 'failed';
      this._metrics.lastSyncDuration = Date.now() - startTime;
      this._metrics.retryCount++;

      console.warn(`[SyncService] Sync failed (${this._metrics.lastSyncDuration}ms):`, err.message);
      return { synced: false, error: err.message };
    }
  },


  // ═══════════════════════════════════════════
  // DIAGNOSTICS (Doc 15 §29B)
  // ═══════════════════════════════════════════

  /** Basic status check */
  getStatus() {
    return {
      initialized: this._initialized,
      loggedIn: this._isLoggedIn(),
      userId: this._getUserId(),
      queueLength: this._syncQueue.length,
      isSyncing: this._isSyncing
    };
  },

  /** Full health diagnostics (Doc 15 §29B) */
  getDiagnostics() {
    const status = this.getStatus();
    return {
      ...status,
      metrics: { ...this._metrics },
      health: this._getSyncHealth(),
      pendingEvents: this._syncQueue.length
    };
  },

  /** Compute sync health score (0-100) */
  _getSyncHealth() {
    const m = this._metrics;
    if (m.totalSyncs === 0) return { score: 100, status: 'idle', message: 'No syncs attempted yet' };

    const successRate = m.totalSyncs > 0 ? (m.successfulSyncs / m.totalSyncs) * 100 : 100;
    const score = Math.round(successRate);
    const hasRecentFailure = m.lastSyncStatus === 'failed';
    const highRetries = m.retryCount > 5;

    let status = 'healthy';
    let message = 'Sync operating normally';

    if (score < 50 || (hasRecentFailure && highRetries)) {
      status = 'critical';
      message = `Sync reliability low (${score}%). ${m.retryCount} retries.`;
    } else if (score < 80 || hasRecentFailure) {
      status = 'degraded';
      message = `Some sync failures detected (${m.failedSyncs}/${m.totalSyncs}).`;
    }

    return { score, status, message };
  }
};

window.SyncService = SyncService;
