// ============================================
// RECOMMENDATION ENGINE — Doc 10 §19 + Doc 12 §5-§9, §19, §24E
// Single source of truth for ALL recommendations.
//
// Doc 12 upgrades:
//   - Priority scoring (§6)
//   - Weakness formula (§7)
//   - Topic mastery (§8)
//   - Adaptive practice mix (§9)
//   - Readiness engine (§19)
//   - Reason codes (§24E)
//
// Consumers: Dashboard, AI Coach, Mission Engine,
//            Result Page, Pricing Page.
//
// No page should build recommendations independently.
// ============================================

const RecommendationEngine = {

  // ── REASON CODES (Doc 12 §24E) ──
  REASONS: {
    WEAK_TOPIC:             'WEAK_TOPIC',
    OVERDUE_REVISION:       'OVERDUE_REVISION',
    RECENT_DECLINE:         'RECENT_DECLINE',
    HIGH_CONFIDENCE_ERROR:  'HIGH_CONFIDENCE_ERROR',
    NEW_CONCEPT:            'NEW_CONCEPT',
    STREAK_BUILDER:         'STREAK_BUILDER',
    DAILY_MISSION:          'DAILY_MISSION',
    ROOT_CAUSE_LEAK:        'ROOT_CAUSE_LEAK',
    GENERAL:                'GENERAL'
  },


  // ═══════════════════════════════════════════
  // CONTEXT GATHERING
  // ═══════════════════════════════════════════

  /** Gather all available context into one object */
  _gatherContext() {
    const history    = Storage.getHistory?.() || [];
    const profile    = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    const streak     = typeof DailySystem !== 'undefined' ? DailySystem.getStreak() : { current: 0, best: 0 };
    const flashcards = typeof Flashcards !== 'undefined'
      ? { due: Flashcards.getDue(), all: Flashcards.getAll(), stats: Flashcards.getStats() }
      : { due: [], all: [], stats: {} };
    const missions   = typeof MissionEngine !== 'undefined' ? MissionEngine.getStats() : null;
    const hasDoneToday = typeof DailySystem !== 'undefined' ? DailySystem.hasDoneToday() : false;

    // Subject heatmap from recent tests
    const heatmap  = this._buildHeatmap(history);
    const weakArea = heatmap.length > 0 ? heatmap.reduce((a, b) => a.accuracy < b.accuracy ? a : b) : null;

    // Doc 20: MistakeDNA persistent weaknesses + recovery score
    const mistakeDNARepeats = typeof MistakeDNA !== 'undefined' ? MistakeDNA.getRepeatMistakes() : [];
    const mistakeDNARecovery = typeof MistakeDNA !== 'undefined' ? MistakeDNA.getRecoveryScore() : { ready: false };
    const mistakeDNARevision = typeof MistakeDNA !== 'undefined' ? MistakeDNA.getRevisionPriority() : [];

    return { history, profile, streak, flashcards, missions, heatmap, weakArea, hasDoneToday, mistakeDNARepeats, mistakeDNARecovery, mistakeDNARevision };
  },


  // ═══════════════════════════════════════════
  // PRIORITY SCORING (Doc 12 §6)
  // ═══════════════════════════════════════════

  /**
   * Score a topic for recommendation priority.
   * Higher = more urgent.
   *
   * Formula:
   *   weakness + overdueRevision + recentDecline + confidencePenalty - alreadyPracticedToday
   */
  _scoreTopic(subjectProfile, hasDoneToday) {
    if (!subjectProfile) return 0;
    const sp = subjectProfile;

    // Weakness component (0-40)
    const wrongPct = sp.attempts > 0 ? (sp.wrong / sp.attempts) : 0;
    const weakness = Math.round(wrongPct * 40);

    // Overdue revision component (0-25)
    let overdueRevision = 0;
    if (sp.revisionSchedule?.nextRevision) {
      const today = new Date().toISOString().slice(0, 10);
      const daysOverdue = Math.floor(
        (new Date(today) - new Date(sp.revisionSchedule.nextRevision)) / 86400000
      );
      overdueRevision = Math.min(25, Math.max(0, daysOverdue * 5));
    }

    // Recent decline component (0-20)
    let recentDecline = 0;
    if (sp.accuracyHistory?.length >= 2) {
      const last = sp.accuracyHistory[sp.accuracyHistory.length - 1];
      const prev = sp.accuracyHistory[sp.accuracyHistory.length - 2];
      if (last < prev) {
        recentDecline = Math.min(20, Math.round((prev - last) * 0.4));
      }
    }

    // Confidence penalty — being wrong while confident (0-15)
    const confPenalty = Math.round((sp.confidenceWrong || 0) * 15);

    // Already practiced today discount (-10)
    const todayDiscount = hasDoneToday ? 10 : 0;

    // Doc 20: Persistent root-cause leak boost (0-20)
    let rootCauseBoost = 0;
    if (typeof MistakeDNA !== 'undefined') {
      const repeats = MistakeDNA.getRepeatMistakes();
      const subjectRepeats = repeats.filter(r => r.subject === subjectProfile.subject);
      rootCauseBoost = Math.min(20, subjectRepeats.length * 7);
    }

    return Math.max(0, weakness + overdueRevision + recentDecline + confPenalty + rootCauseBoost - todayDiscount);
  },

  /**
   * Determine the primary reason code for a subject.
   */
  _getReasonCode(subjectProfile) {
    if (!subjectProfile) return this.REASONS.GENERAL;
    const sp = subjectProfile;

    // Priority: confidence error > decline > overdue revision > weakness > general
    if ((sp.confidenceWrong || 0) > 0.15) return this.REASONS.HIGH_CONFIDENCE_ERROR;

    if (sp.trend === 'down') return this.REASONS.RECENT_DECLINE;

    if (sp.revisionSchedule?.nextRevision) {
      const today = new Date().toISOString().slice(0, 10);
      if (sp.revisionSchedule.nextRevision <= today) return this.REASONS.OVERDUE_REVISION;
    }

    if (sp.attempts > 0 && sp.accuracy < 55) return this.REASONS.WEAK_TOPIC;

    // Doc 20: check persistent root-cause leaks
    if (typeof MistakeDNA !== 'undefined') {
      const repeats = MistakeDNA.getRepeatMistakes();
      if (repeats.some(r => r.subject === sp.subject && r.count >= 3)) return this.REASONS.ROOT_CAUSE_LEAK;
    }

    if (sp.attempts < 5) return this.REASONS.NEW_CONCEPT;

    return this.REASONS.GENERAL;
  },


  // ═══════════════════════════════════════════
  // RECOMMENDATION OUTPUTS
  // ═══════════════════════════════════════════

  /** Next mock recommendation with priority scoring and reason codes */
  getNextMock() {
    const ctx = this._gatherContext();
    const { history, heatmap, weakArea, profile, hasDoneToday } = ctx;

    // Default
    let rec = {
      name: 'SSC CGL Full Mock',
      questions: 100,
      minutes: 60,
      difficulty: 'Medium',
      reason: 'Most popular mock for your level.',
      reasonCode: this.REASONS.GENERAL,
      score: 0,
      subject: null
    };

    // Use LearningProfile subject profiles if available (richer data)
    if (profile?.subjectProfiles && Object.keys(profile.subjectProfiles).length > 0) {
      const scored = Object.entries(profile.subjectProfiles)
        .map(([sub, sp]) => ({
          subject: sub,
          score: this._scoreTopic(sp, hasDoneToday),
          reasonCode: this._getReasonCode(sp),
          accuracy: sp.accuracy,
          sp
        }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        const top = scored[0];
        rec = {
          name: `${top.subject} Focus Mock`,
          questions: 50,
          minutes: 35,
          difficulty: top.accuracy < 40 ? 'Easy (build confidence)' : 'Medium',
          reason: this._buildReasonText(top.reasonCode, top.subject, top.accuracy, top.sp),
          reasonCode: top.reasonCode,
          score: top.score,
          subject: top.subject
        };
      }
    } else {
      // Fallback: heatmap-based (no LearningProfile yet)
      const recentTests = history.slice(-3);
      const catScores = {};
      recentTests.forEach(t => {
        if (t.subjectScores) {
          Object.entries(t.subjectScores).forEach(([sub, d]) => {
            if (!catScores[sub]) catScores[sub] = { total: 0, correct: 0 };
            catScores[sub].total   += d.total   || 0;
            catScores[sub].correct += d.correct || 0;
          });
        }
      });

      let lowestPct = 100;
      Object.entries(catScores).forEach(([sub, d]) => {
        const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 100;
        if (pct < lowestPct) {
          lowestPct = pct;
          rec = {
            name: `${sub} Focus Mock`,
            questions: 50,
            minutes: 35,
            difficulty: pct < 40 ? 'Easy (build confidence)' : 'Medium',
            reason: `Your ${sub} accuracy is ${pct}% in recent tests.`,
            reasonCode: this.REASONS.WEAK_TOPIC,
            score: 100 - pct,
            subject: sub
          };
        }
      });

      if (lowestPct === 100 && weakArea) {
        rec = {
          name: `${weakArea.subject} Practice Mock`,
          questions: 50, minutes: 35, difficulty: 'Medium',
          reason: `${weakArea.subject} is your weakest area at ${weakArea.accuracy}%.`,
          reasonCode: this.REASONS.WEAK_TOPIC,
          score: 100 - weakArea.accuracy,
          subject: weakArea.subject
        };
      }
    }

    return rec;
  },


  /** Build human-readable reason text from code */
  _buildReasonText(code, subject, accuracy, sp) {
    switch (code) {
      case this.REASONS.HIGH_CONFIDENCE_ERROR:
        return `You're getting ${subject} questions wrong even when confident. This signals a concept gap that focused practice can fix.`;
      case this.REASONS.RECENT_DECLINE:
        return `Your ${subject} accuracy dropped recently. A focused session will reverse this trend.`;
      case this.REASONS.OVERDUE_REVISION:
        return `${subject} revision is overdue. Revisiting now prevents forgetting.`;
      case this.REASONS.WEAK_TOPIC:
        return `${subject} is at ${accuracy}% accuracy. Targeted practice will improve it fastest.`;
      case this.REASONS.ROOT_CAUSE_LEAK:
        return `${subject} has a persistent root-cause leak repeating across multiple tests. Fixing the specific mistake pattern will improve scores fastest.`;
      case this.REASONS.NEW_CONCEPT:
        return `You haven't practiced ${subject} enough yet. Build your baseline.`;
      default:
        return 'Most popular mock for your level.';
    }
  },


  /** Daily focus subject */
  getDailyFocus() {
    const ctx = this._gatherContext();
    const { profile, weakArea, streak } = ctx;

    if (profile?.subjectProfiles && Object.keys(profile.subjectProfiles).length > 0) {
      // Use priority scoring to pick focus
      const scored = Object.entries(profile.subjectProfiles)
        .map(([sub, sp]) => ({ subject: sub, score: this._scoreTopic(sp, false), accuracy: sp.accuracy, reasonCode: this._getReasonCode(sp) }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score);

      if (scored.length > 0) {
        return {
          subject: scored[0].subject,
          reason: this._buildReasonText(scored[0].reasonCode, scored[0].subject, scored[0].accuracy),
          reasonCode: scored[0].reasonCode,
          score: scored[0].score
        };
      }
    }

    if (weakArea) {
      return {
        subject: weakArea.subject,
        reason: `Lowest accuracy at ${weakArea.accuracy}%`,
        reasonCode: this.REASONS.WEAK_TOPIC,
        score: 100 - weakArea.accuracy
      };
    }

    return { subject: 'General', reason: 'Take a mock to discover your focus area', reasonCode: this.REASONS.GENERAL, score: 0 };
  },


  /** Weak topics ranked by priority score */
  getWeakTopics(limit = 5) {
    const ctx = this._gatherContext();

    if (ctx.profile?.subjectProfiles) {
      return Object.entries(ctx.profile.subjectProfiles)
        .map(([sub, sp]) => ({
          subject: sub,
          accuracy: sp.accuracy,
          score: this._scoreTopic(sp, false),
          reasonCode: this._getReasonCode(sp),
          trend: sp.trend,
          mastery: this._calcMastery(sp)
        }))
        .filter(t => t.accuracy < 70)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    }

    return ctx.heatmap
      .filter(t => t.accuracy < 70)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, limit)
      .map(t => ({ ...t, reasonCode: this.REASONS.WEAK_TOPIC, score: 100 - t.accuracy }));
  },


  /** Flashcard revision priority */
  getRevisionPriority(limit = 20) {
    const ctx = this._gatherContext();
    const due = ctx.flashcards.due || [];

    return due
      .sort((a, b) => {
        const aOverdue = (Date.now() - (a.nextReviewAt || 0)) / 86400000;
        const bOverdue = (Date.now() - (b.nextReviewAt || 0)) / 86400000;
        if (Math.abs(aOverdue - bOverdue) > 1) return bOverdue - aOverdue;
        return (a.correctCount || 0) - (b.correctCount || 0);
      })
      .slice(0, limit);
  },


  /** Upgrade teaser for premium prompts */
  getUpgradeTeaser() {
    if (typeof FeatureFlags !== 'undefined' && FeatureFlags.isPremium()) return null;

    const ctx = this._gatherContext();
    const weakCount = ctx.heatmap.filter(t => t.accuracy < 50).length;
    const dueCards = ctx.flashcards.due?.length || 0;

    if (weakCount >= 2) {
      return {
        feature: 'ADAPTIVE_PRACTICE',
        message: `AI detected ${weakCount} weak topics. Unlock Plus for adaptive practice that targets your gaps.`,
        reasonCode: this.REASONS.WEAK_TOPIC
      };
    }

    if (dueCards >= 20) {
      return {
        feature: 'SMART_REVISION',
        message: `You have ${dueCards} cards waiting. Smart Revision in Plus auto-prioritizes them.`,
        reasonCode: this.REASONS.OVERDUE_REVISION
      };
    }

    return {
      feature: 'WEEKLY_AI_REPORT',
      message: 'Get a personalized weekly progress report with Plus.',
      reasonCode: this.REASONS.GENERAL
    };
  },


  /** Re-engagement suggestion */
  getReEngagement() {
    if (typeof MissionEngine !== 'undefined') {
      const signals = MissionEngine.getChurnSignals();
      if (signals.length > 0) {
        return signals.sort((a, b) => {
          const sev = { high: 3, medium: 2, low: 1 };
          return (sev[b.severity] || 0) - (sev[a.severity] || 0);
        })[0];
      }
    }
    return null;
  },


  // ═══════════════════════════════════════════
  // TOPIC MASTERY (Doc 12 §8)
  // ═══════════════════════════════════════════

  /** Calculate mastery score 0-100 for a subject profile */
  _calcMastery(sp) {
    if (!sp || sp.attempts === 0) return 0;

    // Weighted components:
    //   accuracy (40%) + speed_norm (15%) + confidence (15%) + revision (15%) + consistency (15%)
    const accScore  = sp.accuracy || 0;                                        // 0-100
    const speedNorm = sp.avgSpeed > 0 ? Math.min(100, Math.max(0, 120 - sp.avgSpeed)) : 50;  // faster=better, cap at 120s
    const confScore = Math.round(((sp.confidenceCorrect || 0) * 100));          // % of confident-correct
    const revScore  = sp.revisionSchedule?.intervalDays > 7 ? 100 :            // long interval = mastered
                      sp.revisionSchedule?.intervalDays > 3 ? 70 :
                      sp.revisionSchedule?.intervalDays > 1 ? 40 : 20;
    const consistency = sp.accuracyHistory?.length >= 3
      ? (1 - this._stdDev(sp.accuracyHistory.slice(-5)) / 50) * 100   // low variance = consistent
      : 50;

    return Math.round(
      accScore  * 0.40 +
      speedNorm * 0.15 +
      confScore * 0.15 +
      Math.min(100, revScore)  * 0.15 +
      Math.max(0, Math.min(100, consistency)) * 0.15
    );
  },

  /** Standard deviation helper */
  _stdDev(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  },

  /** Get mastery scores for all topics */
  getTopicMastery() {
    const ctx = this._gatherContext();
    if (!ctx.profile?.subjectProfiles) return [];

    return Object.entries(ctx.profile.subjectProfiles)
      .map(([sub, sp]) => ({
        subject: sub,
        mastery: this._calcMastery(sp),
        accuracy: sp.accuracy,
        attempts: sp.attempts,
        trend: sp.trend,
        level: this._calcMastery(sp) >= 80 ? 'mastered' :
               this._calcMastery(sp) >= 60 ? 'proficient' :
               this._calcMastery(sp) >= 40 ? 'developing' :
               this._calcMastery(sp) >= 20 ? 'beginner' : 'new'
      }))
      .sort((a, b) => b.mastery - a.mastery);
  },


  // ═══════════════════════════════════════════
  // ADAPTIVE PRACTICE MIX (Doc 12 §9)
  // ═══════════════════════════════════════════

  /** Calculate question distribution for adaptive practice */
  getAdaptiveMix() {
    const mastery = this.getTopicMastery();
    if (mastery.length === 0) {
      return { weak: 0, average: 0, strong: 0, new: 100, distribution: [] };
    }

    const weak   = mastery.filter(t => t.mastery < 40);
    const avg    = mastery.filter(t => t.mastery >= 40 && t.mastery < 70);
    const strong = mastery.filter(t => t.mastery >= 70);
    const total  = mastery.length;

    // Target: 40% weak, 30% average, 20% strong, 10% new concepts
    const mix = {
      weak:    Math.round(Math.min(40, (weak.length / total) * 60)),
      average: Math.round(Math.min(30, (avg.length / total) * 50)),
      strong:  Math.round(Math.min(20, (strong.length / total) * 40)),
      new:     10,
      distribution: mastery.map(t => ({
        subject: t.subject,
        mastery: t.mastery,
        level: t.level,
        // Higher weight for weaker topics
        weight: t.mastery < 40 ? 3 :
                t.mastery < 70 ? 2 : 1
      }))
    };

    // Normalize to 100%
    const sum = mix.weak + mix.average + mix.strong + mix.new;
    if (sum !== 100 && sum > 0) {
      const scale = 100 / sum;
      mix.weak    = Math.round(mix.weak * scale);
      mix.average = Math.round(mix.average * scale);
      mix.strong  = Math.round(mix.strong * scale);
      mix.new     = 100 - mix.weak - mix.average - mix.strong;
    }

    return mix;
  },


  // ═══════════════════════════════════════════
  // READINESS ENGINE (Doc 12 §19)
  // ═══════════════════════════════════════════

  /** Exam readiness score (0-100) with component breakdown */
  getReadiness() {
    const ctx = this._gatherContext();
    const { profile, streak, flashcards, heatmap, history } = ctx;

    // Foundation: tests taken + topics covered (0-100)
    const testCount = profile?.totalTestsTaken || history.length || 0;
    const topicCount = heatmap.length;
    const foundation = Math.min(100,
      Math.round((testCount / 20) * 50 + (topicCount / 8) * 50) // 20 tests + 8 topics = 100
    );

    // Practice: recent accuracy average (0-100)
    const recentAcc = heatmap.length > 0
      ? Math.round(heatmap.reduce((s, t) => s + t.accuracy, 0) / heatmap.length)
      : 0;
    const practice = recentAcc;

    // Consistency: streak + daily rate (0-100)
    const streakScore = Math.min(50, (streak.current || 0) * 5);    // 10 days = 50
    const dailyRate = testCount > 0 && history.length > 0
      ? Math.min(50, Math.round((testCount / Math.max(1, this._daysSinceFirst(history))) * 50))
      : 0;
    const consistency = streakScore + dailyRate;

    // Revision: completion rate (0-100)
    const totalDue = flashcards.due?.length || 0;
    const totalAll = flashcards.all?.length || 0;
    const revision = totalAll > 0
      ? Math.round(((totalAll - totalDue) / totalAll) * 100)
      : (testCount > 0 ? 30 : 0); // partial credit if no flashcards but tests taken

    // Confidence: low misconception rate (0-100)
    let confidence = 50; // default
    if (profile?.subjectProfiles) {
      const sps = Object.values(profile.subjectProfiles).filter(sp => sp.attempts > 0);
      if (sps.length > 0) {
        const avgConfWrong = sps.reduce((s, sp) => s + (sp.confidenceWrong || 0), 0) / sps.length;
        confidence = Math.round((1 - avgConfWrong) * 100);
      }
    }

    // Composite: weighted average
    const overall = Math.round(
      foundation  * 0.20 +
      practice    * 0.30 +
      consistency * 0.20 +
      revision    * 0.15 +
      confidence  * 0.15
    );

    const level = overall >= 80 ? 'Exam Ready' :
                  overall >= 60 ? 'On Track' :
                  overall >= 40 ? 'Building Up' :
                  overall >= 20 ? 'Getting Started' : 'Just Beginning';

    return {
      overall,
      level,
      components: {
        foundation:  { score: foundation,  weight: 20, label: 'Test Coverage' },
        practice:    { score: practice,    weight: 30, label: 'Accuracy' },
        consistency: { score: consistency, weight: 20, label: 'Consistency' },
        revision:    { score: revision,    weight: 15, label: 'Revision' },
        confidence:  { score: confidence,  weight: 15, label: 'Confidence' }
      }
    };
  },

  /** Days since first test */
  _daysSinceFirst(history) {
    if (history.length === 0) return 1;
    const oldest = history[history.length - 1];
    const date = oldest.date || oldest.timestamp;
    if (!date) return 1;
    return Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / 86400000));
  },


  // ═══════════════════════════════════════════
  // MASTER: ALL RECOMMENDATIONS
  // ═══════════════════════════════════════════

  /** All recommendations in one call */
  getAll() {
    return {
      nextMock:           this.getNextMock(),
      dailyFocus:         this.getDailyFocus(),
      weakTopics:         this.getWeakTopics(),
      revisionPriority:   this.getRevisionPriority(),
      upgradeTeaser:      this.getUpgradeTeaser(),
      reEngagement:       this.getReEngagement(),
      topicMastery:       this.getTopicMastery(),
      adaptiveMix:        this.getAdaptiveMix(),
      readiness:          this.getReadiness(),
      behaviourCoaching:  typeof AICoach !== 'undefined' ? AICoach.getBehaviourCoaching() : [],
      mistakeDNA:         typeof MistakeDNA !== 'undefined' ? {
        repeats: MistakeDNA.getRepeatMistakes(),
        recovery: MistakeDNA.getRecoveryScore(),
        timeline: MistakeDNA.getMistakeTimeline(),
        revisionPriority: MistakeDNA.getRevisionPriority()
      } : null
    };
  },


  // ═══════════════════════════════════════════
  // INTERNAL: HEATMAP BUILDER
  // ═══════════════════════════════════════════

  /** Build subject heatmap from history (last 10 tests) */
  _buildHeatmap(history) {
    const last = history.slice(0, 10);
    const subjects = {};

    last.forEach(t => {
      if (t.subjectScores) {
        Object.entries(t.subjectScores).forEach(([sub, d]) => {
          if (!subjects[sub]) subjects[sub] = { subject: sub, total: 0, correct: 0 };
          subjects[sub].total   += d.total || 0;
          subjects[sub].correct += d.correct || 0;
        });
      }
    });

    return Object.values(subjects)
      .map(s => ({
        subject: s.subject,
        accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
        total: s.total
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }
};

window.RecommendationEngine = RecommendationEngine;
