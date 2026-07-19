// ============================================
// EVENT BUS — Doc 9 §27B
// Lightweight pub/sub. No dependencies.
// Decouples gamification, missions, celebrations.
// ============================================

const EventBus = {
  _listeners: {},
  _history: [],
  _maxHistory: 100,

  // ════ SUBSCRIBE ════
  on(event, callback, context) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push({ fn: callback, ctx: context || null });
    return () => this.off(event, callback); // unsubscribe handle
  },

  // ════ UNSUBSCRIBE ════
  off(event, callback) {
    if (!this._listeners[event]) return;
    this._listeners[event] = this._listeners[event].filter(l => l.fn !== callback);
  },

  // ════ EMIT ════
  emit(event, data = {}) {
    const entry = {
      event,
      data,
      timestamp: Date.now(),
      time: new Date().toISOString()
    };

    // Store in history for timeline (Doc 9 §27E)
    this._history.push(entry);
    if (this._history.length > this._maxHistory) {
      this._history = this._history.slice(-this._maxHistory);
    }

    // Persist timeline to localStorage
    this._persistTimeline(entry);

    // Debug log
    console.log(`[EventBus] ${event}`, data);

    // Notify listeners
    const listeners = this._listeners[event] || [];
    listeners.forEach(l => {
      try {
        l.fn.call(l.ctx, data);
      } catch (e) {
        console.warn(`[EventBus] Listener error on "${event}":`, e);
      }
    });

    // Wildcard listeners (listen to everything)
    const wildcards = this._listeners['*'] || [];
    wildcards.forEach(l => {
      try {
        l.fn.call(l.ctx, event, data);
      } catch (e) {}
    });
  },

  // ════ ONCE (auto-unsubscribe after first fire) ════
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  },

  // ════ TIMELINE — Progress Timeline (Doc 9 §27E) ════
  _persistTimeline(entry) {
    try {
      const key = 'mtp_event_timeline';
      const raw = localStorage.getItem(key);
      const timeline = raw ? JSON.parse(raw) : [];
      timeline.push({
        event: entry.event,
        data: this._summarize(entry.event, entry.data),
        time: entry.time,
        ts: entry.timestamp
      });
      // Keep last 200 entries
      const trimmed = timeline.slice(-200);
      localStorage.setItem(key, JSON.stringify(trimmed));
    } catch (e) {}
  },

  // Summarize event data for timeline display (only store minimal info)
  _summarize(event, data) {
    switch (event) {
      case 'mock_completed':
        return { accuracy: data.accuracy, examName: data.examName, subject: data.subject };
      case 'revision_completed':
        return { subject: data.subject, count: data.cardsReviewed };
      case 'flashcard_reviewed':
        return { wasCorrect: data.wasCorrect };
      case 'paper_generated':
        return { examType: data.examType };
      case 'achievement_unlocked':
        return { id: data.id, title: data.title, category: data.category };
      case 'daily_mission_done':
        return { label: data.label };
      case 'streak_extended':
        return { count: data.count };
      case 'level_up':
        return { tier: data.tier, title: data.title };
      // Doc 16 §4: AI Events
      case 'recommendation_viewed':
        return { type: data.type, count: data.count };
      case 'recommendation_clicked':
        return { type: data.type, topic: data.topic };
      case 'coach_opened':
        return { source: data.source };
      case 'ai_feedback_given':
        return { rating: data.rating, questionId: data.questionId };
      // Doc 16 §4: Commerce Events
      case 'pricing_opened':
        return { source: data.source };
      case 'plan_selected':
        return { plan: data.plan };
      case 'checkout_started':
        return { plan: data.plan };
      case 'payment_success':
        return { plan: data.plan, amount: data.amount };
      // Doc 16 §4: Content Events
      case 'topic_opened':
        return { topic: data.topic, exam: data.exam };
      case 'formula_viewed':
        return { topic: data.topic };
      case 'search_performed':
        return { query: (data.query || '').slice(0, 50) };
      // Doc 16 §11: Experiment Events
      case 'experiment_exposed':
        return { experimentId: data.experimentId, variant: data.variant };
      case 'experiment_converted':
        return { experimentId: data.experimentId, variant: data.variant };
      default:
        return {};
    }
  },

  // Get timeline for display
  getTimeline(limit = 30) {
    try {
      const raw = localStorage.getItem('mtp_event_timeline');
      const timeline = raw ? JSON.parse(raw) : [];
      return timeline.slice(-limit).reverse();
    } catch (e) {
      return [];
    }
  },

  // ════ EVENT NAMES (constants) ════
  // Doc 16 §3/§4: Complete event taxonomy
  EVENTS: {
    // Learning Events (Doc 9)
    MOCK_COMPLETED:         'mock_completed',
    REVISION_COMPLETED:     'revision_completed',
    FLASHCARD_REVIEWED:     'flashcard_reviewed',
    PAPER_GENERATED:        'paper_generated',
    ACHIEVEMENT_UNLOCKED:   'achievement_unlocked',
    DAILY_MISSION_DONE:     'daily_mission_done',
    WEEKLY_CHALLENGE_DONE:  'weekly_challenge_done',
    STREAK_EXTENDED:        'streak_extended',
    STREAK_BROKEN:          'streak_broken',
    LEVEL_UP:               'level_up',
    XP_EARNED:              'xp_earned',

    // AI Events (Doc 16 §4)
    RECOMMENDATION_VIEWED:  'recommendation_viewed',
    RECOMMENDATION_CLICKED: 'recommendation_clicked',
    COACH_OPENED:           'coach_opened',
    AI_FEEDBACK_GIVEN:      'ai_feedback_given',

    // Commerce Events (Doc 16 §4)
    PRICING_OPENED:         'pricing_opened',
    PLAN_SELECTED:          'plan_selected',
    CHECKOUT_STARTED:       'checkout_started',
    PAYMENT_SUCCESS:        'payment_success',

    // Content Events (Doc 16 §4)
    TOPIC_OPENED:           'topic_opened',
    FORMULA_VIEWED:         'formula_viewed',
    PYQ_VIEWED:             'pyq_viewed',
    SEARCH_PERFORMED:       'search_performed',

    // Experiment Events (Doc 16 §11)
    EXPERIMENT_EXPOSED:     'experiment_exposed',
    EXPERIMENT_CONVERTED:   'experiment_converted',

    // Platform Events (Doc 11/15)
    SYNC_COMPLETED:         'sync_completed',
    PROFILE_UPDATED:        'profile_updated',
    PLAN_CHANGED:           'plan_changed',

    // Behaviour Events (Doc 19)
    BEHAVIOUR_ANALYZED:     'behaviour_analyzed',
    PANIC_DETECTED:         'panic_detected',
    FOCUS_COLLAPSED:        'focus_collapsed',
    RECOVERY_DETECTED:      'recovery_detected'
  }
};

window.EventBus = EventBus;
