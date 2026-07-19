// ============================================
// CORRECTION INTELLIGENCE ENGINE — Doc 21
// Mission: Turn every mistake diagnosis into a
// specific treatment plan, track recovery lifecycle,
// and build a Recovery Passport.
//
// Every output follows DEPO:
//   D = Diagnosis (what's wrong)
//   E = Evidence (data behind it)
//   P = Prescription (what to do)
//   O = Expected Outcome (projected gain)
// ============================================

const CorrectionEngine = {

  STORAGE_KEY: 'mtp_correction',

  // ═══════════════════════════════════════════
  // §1 CORRECTION MAP
  // Each root cause → specific correction type.
  // ═══════════════════════════════════════════

  CORRECTION_MAP: {
    concept: {
      type: 'concept_lesson',
      label: 'Concept Lesson',
      icon: '📖',
      steps: ['Re-read the concept from notes or video (10 min)', 'Solve 10 targeted questions on this topic', 'Create 2 flashcards for the key rules', 'Take 1 mini quiz (5 Q) to confirm'],
      estimatedMinutes: 25,
      drillCount: 10,
      flashcardCount: 2,
      baseProbability: 61
    },
    calculation: {
      type: 'calculation_drill',
      label: 'Calculation Drill',
      icon: '🧮',
      steps: ['5 arithmetic-only warm-up drills', 'Solve 8 calculation-heavy questions slowly', 'Re-check each answer before submitting', 'Take 1 timed mini set (5 Q, 4 min)'],
      estimatedMinutes: 15,
      drillCount: 8,
      flashcardCount: 0,
      baseProbability: 83
    },
    reading: {
      type: 'reading_drill',
      label: 'Reading Drill',
      icon: '👁️',
      steps: ['Read 5 question stems — underline NOT/EXCEPT/units', 'Solve 8 negative-statement questions untimed', 'Mark which keyword you initially missed', 'Take 1 timed set focusing on stem reading'],
      estimatedMinutes: 12,
      drillCount: 8,
      flashcardCount: 1,
      baseProbability: 92
    },
    guess: {
      type: 'confidence_practice',
      label: 'Confidence Practice',
      icon: '🎯',
      steps: ['Review skip-vs-guess strategy for negative marking', 'Solve 10 questions — mark confidence before answering', 'Track which "unsure" answers were correct', 'Practice 1 timed set with deliberate skipping'],
      estimatedMinutes: 15,
      drillCount: 10,
      flashcardCount: 0,
      baseProbability: 83
    },
    timePressure: {
      type: 'timed_drill',
      label: 'Timed Drill',
      icon: '⏱️',
      steps: ['2 sectional timed sets (10 Q each, strict time)', 'Practice the skip-and-return strategy', 'Identify which question types take longest', 'Take 1 full timed mock'],
      estimatedMinutes: 30,
      drillCount: 20,
      flashcardCount: 0,
      baseProbability: 71
    },
    careless: {
      type: 'attention_drill',
      label: 'Attention Drill',
      icon: '🔍',
      steps: ['Solve 5 questions with mandatory re-check step', 'Before submitting, verify option matches your solution', 'Practice double-negative question detection', 'Take 1 untimed set — accuracy only'],
      estimatedMinutes: 10,
      drillCount: 5,
      flashcardCount: 0,
      baseProbability: 88
    },
    skipped: {
      type: 'attempt_practice',
      label: 'Attempt Practice',
      icon: '✍️',
      steps: ['Review which skipped questions were actually doable', 'Solve 5 "skip-worthy" questions with no time limit', 'Build a 60-second elimination strategy', 'Practice 1 timed set — attempt all, skip none'],
      estimatedMinutes: 12,
      drillCount: 5,
      flashcardCount: 0,
      baseProbability: 95
    }
  },

  // Recovery lifecycle states
  LIFECYCLE: {
    MISTAKE:    'mistake',
    TREATING:   'treating',
    RECOVERING: 'recovering',
    STABLE:     'stable',
    MASTERED:   'mastered',
    REMOVED:    'removed'
  },

  // Difficulty thresholds
  DIFFICULTY: {
    easy:      { maxRepeat: 1, maxSeverity: 'low',      label: 'Easy Fix',      color: '#10B981' },
    medium:    { maxRepeat: 2, maxSeverity: 'medium',   label: 'Moderate',      color: '#F59E0B' },
    hard:      { maxRepeat: 4, maxSeverity: 'high',     label: 'Hard',          color: '#EF4444' },
    permanent: { maxRepeat: 99, maxSeverity: 'critical', label: 'Deep Pattern',  color: '#7C3AED' }
  },


  // ═══════════════════════════════════════════
  // §2 CORRECTION DIFFICULTY
  // ═══════════════════════════════════════════

  getCorrectionDifficulty(cause, repeatCount, severity) {
    if (repeatCount >= 5 || severity === 'critical') {
      return { difficulty: 'permanent', ...this.DIFFICULTY.permanent };
    }
    if (repeatCount >= 3 || severity === 'high') {
      return { difficulty: 'hard', ...this.DIFFICULTY.hard };
    }
    if (repeatCount >= 2 || severity === 'medium') {
      return { difficulty: 'medium', ...this.DIFFICULTY.medium };
    }
    return { difficulty: 'easy', ...this.DIFFICULTY.easy };
  },


  // ═══════════════════════════════════════════
  // §3 RECOVERY PROBABILITY
  // ═══════════════════════════════════════════

  getRecoveryProbability() {
    const results = [];
    const data = this._getData();

    Object.entries(this.CORRECTION_MAP).forEach(([cause, map]) => {
      let probability = map.baseProbability;

      // Adjust from historical correction records
      const records = (data.corrections || []).filter(c => c.cause === cause);
      if (records.length > 0) {
        const recovered = records.filter(c =>
          c.lifecycle === this.LIFECYCLE.STABLE ||
          c.lifecycle === this.LIFECYCLE.MASTERED ||
          c.lifecycle === this.LIFECYCLE.REMOVED
        ).length;
        const historicalRate = Math.round((recovered / records.length) * 100);
        probability = Math.round(historicalRate * 0.6 + map.baseProbability * 0.4);
      }

      const meta = typeof MistakeDNA !== 'undefined' ? MistakeDNA.CAUSE_META[cause] : null;
      results.push({
        cause,
        label: meta ? meta.label : cause,
        probability: Math.min(99, Math.max(10, probability)),
        confidence: records.length >= 3 ? 'high' : records.length >= 1 ? 'medium' : 'low'
      });
    });

    return results.sort((a, b) => b.probability - a.probability);
  },


  // ═══════════════════════════════════════════
  // §4 MICRO LEARNING UNITS
  // "Read 2 min → Solve 5 Q → 1 Flashcard → Done"
  // ═══════════════════════════════════════════

  getMicroLearning(cause, topic, marksLost) {
    const map = this.CORRECTION_MAP[cause];
    if (!map) return null;

    const meta = typeof MistakeDNA !== 'undefined' ? MistakeDNA.CAUSE_META[cause] : { label: cause };

    return {
      diagnosis: `${meta.label} errors in ${topic || 'multiple topics'}`,
      evidence: `${marksLost || 0} marks lost to ${meta.label.toLowerCase()} across recent tests`,
      prescription: {
        type: map.type,
        label: map.label,
        icon: map.icon,
        steps: map.steps,
        drillCount: map.drillCount,
        flashcardCount: map.flashcardCount,
        estimatedMinutes: map.estimatedMinutes
      },
      expectedOutcome: {
        marksGain: Math.round((marksLost || 1) * (map.baseProbability / 100) * 0.7),
        probability: map.baseProbability,
        confidence: marksLost >= 5 ? 'high' : 'medium'
      }
    };
  },


  // ═══════════════════════════════════════════
  // §5 CORRECTION CHAIN
  // Drill → Quiz → Revision → Retest → Recovered
  // ═══════════════════════════════════════════

  getCorrectionChain(cause, topic) {
    const map = this.CORRECTION_MAP[cause];
    if (!map) return null;

    const meta = typeof MistakeDNA !== 'undefined' ? MistakeDNA.CAUSE_META[cause] : { label: cause };

    return {
      cause,
      topic: topic || 'General',
      label: meta.label,
      chain: [
        { step: 1, action: map.label,       status: 'pending', icon: map.icon,  desc: map.steps[0] },
        { step: 2, action: 'Mini Quiz',     status: 'pending', icon: '📝',      desc: `5 focused questions on ${topic || 'this topic'}` },
        { step: 3, action: 'Revision',      status: 'pending', icon: '📖',      desc: 'Review flashcards + mistakes from the drill' },
        { step: 4, action: 'Re-test',       status: 'pending', icon: '🎯',      desc: 'Take a short mock covering this topic' },
        { step: 5, action: 'Verification',  status: 'pending', icon: '✅',      desc: 'System checks: did accuracy improve?' }
      ],
      estimatedDays: cause === 'concept' ? 5 : 3,
      estimatedMinutes: map.estimatedMinutes + 15
    };
  },


  // ═══════════════════════════════════════════
  // §6 RECOVERY CONFIDENCE
  // ═══════════════════════════════════════════

  getRecoveryConfidence() {
    const data = this._getData();
    const active = (data.corrections || []).filter(c =>
      c.lifecycle !== this.LIFECYCLE.REMOVED
    );

    return active.map(c => {
      const stableTests = c.stableTestCount || 0;
      const confidence = Math.min(100, Math.round(
        (stableTests >= 5 ? 95 :
         stableTests >= 3 ? 80 :
         stableTests >= 2 ? 65 :
         stableTests >= 1 ? 40 : 15)
      ));

      return {
        topic: c.topic,
        cause: c.cause,
        label: c.label || c.cause,
        lifecycle: c.lifecycle,
        confidence,
        stableTests,
        insight: confidence >= 80
          ? `${c.topic} recovery is holding strong (${confidence}% confidence).`
          : confidence >= 50
            ? `${c.topic} is recovering but needs more practice (${confidence}% confidence).`
            : `${c.topic} recovery is fragile — continue the correction chain.`
      };
    }).sort((a, b) => a.confidence - b.confidence);
  },


  // ═══════════════════════════════════════════
  // §7 RECOVERY LIFECYCLE STATE MACHINE
  // Mistake → Treating → Recovering → Stable → Mastered → Removed
  // ═══════════════════════════════════════════

  getRecoveryLifecycle() {
    const data = this._getData();
    return (data.corrections || []).map(c => ({
      id: c.id,
      topic: c.topic,
      subject: c.subject,
      cause: c.cause,
      label: c.label,
      lifecycle: c.lifecycle,
      startedAt: c.startedAt,
      recoveredAt: c.recoveredAt,
      stableAt: c.stableAt,
      masteredAt: c.masteredAt,
      stableTestCount: c.stableTestCount || 0,
      daysSinceStart: c.startedAt
        ? Math.floor((Date.now() - new Date(c.startedAt).getTime()) / 86400000)
        : 0
    }));
  },

  _transitionLifecycle(record, newAccuracy, previousAccuracy) {
    const now = new Date().toISOString();

    switch (record.lifecycle) {
      case this.LIFECYCLE.MISTAKE:
        record.lifecycle = this.LIFECYCLE.TREATING;
        record.treatingAt = now;
        break;

      case this.LIFECYCLE.TREATING:
        if (newAccuracy > previousAccuracy && newAccuracy >= (previousAccuracy + 10)) {
          record.lifecycle = this.LIFECYCLE.RECOVERING;
          record.recoveredAt = now;
          record.stableTestCount = 1;
        }
        break;

      case this.LIFECYCLE.RECOVERING:
        if (newAccuracy >= previousAccuracy) {
          record.stableTestCount = (record.stableTestCount || 0) + 1;
          if (record.stableTestCount >= 2) {
            record.lifecycle = this.LIFECYCLE.STABLE;
            record.stableAt = now;
          }
        } else {
          record.lifecycle = this.LIFECYCLE.TREATING;
          record.stableTestCount = 0;
        }
        break;

      case this.LIFECYCLE.STABLE:
        if (record.stableAt) {
          const daysSinceStable = Math.floor(
            (Date.now() - new Date(record.stableAt).getTime()) / 86400000
          );
          if (daysSinceStable >= 90 && newAccuracy >= previousAccuracy) {
            record.lifecycle = this.LIFECYCLE.MASTERED;
            record.masteredAt = now;
          }
        }
        if (newAccuracy >= previousAccuracy) {
          record.stableTestCount = (record.stableTestCount || 0) + 1;
        } else if (newAccuracy < previousAccuracy - 10) {
          record.lifecycle = this.LIFECYCLE.RECOVERING;
          record.stableTestCount = 0;
        }
        break;

      case this.LIFECYCLE.MASTERED:
        if (newAccuracy < previousAccuracy - 20) {
          record.lifecycle = this.LIFECYCLE.RECOVERING;
          record.stableTestCount = 0;
          record.masteredAt = null;
        }
        break;
    }

    return record;
  },


  // ═══════════════════════════════════════════
  // §8 CORRECTION SCORE
  // Efficiency × Time × Recovery × Retention
  // ═══════════════════════════════════════════

  getCorrectionScore() {
    const data = this._getData();
    const corrections = data.corrections || [];
    if (corrections.length === 0) return { ready: false, score: 0, components: {} };

    const total = corrections.length;
    const recovered = corrections.filter(c =>
      [this.LIFECYCLE.STABLE, this.LIFECYCLE.MASTERED, this.LIFECYCLE.REMOVED].includes(c.lifecycle)
    ).length;
    const treating = corrections.filter(c => c.lifecycle === this.LIFECYCLE.TREATING).length;

    const efficiency = total > 0 ? Math.round((recovered / total) * 100) : 0;

    const recoveredRecords = corrections.filter(c => c.recoveredAt && c.startedAt);
    const avgDays = recoveredRecords.length > 0
      ? Math.round(recoveredRecords.reduce((s, c) =>
          s + Math.floor((new Date(c.recoveredAt).getTime() - new Date(c.startedAt).getTime()) / 86400000)
        , 0) / recoveredRecords.length)
      : 0;
    const timeScore = avgDays > 0 ? Math.min(100, Math.round((7 / avgDays) * 100)) : 0;

    const recoveryRate = total > 0 ? Math.round((recovered / total) * 100) : 0;

    const retained = corrections.filter(c =>
      [this.LIFECYCLE.STABLE, this.LIFECYCLE.MASTERED].includes(c.lifecycle)
    ).length;
    const retention = recovered > 0 ? Math.round((retained / recovered) * 100) : 0;

    const composite = Math.round(
      efficiency * 0.30 + timeScore * 0.20 + recoveryRate * 0.25 + retention * 0.25
    );

    return {
      ready: true,
      score: composite,
      components: {
        efficiency:  { score: efficiency,  weight: 30, label: 'Success Rate' },
        time:        { score: timeScore,   weight: 20, label: 'Speed', avgDays },
        recovery:    { score: recoveryRate, weight: 25, label: 'Recovery Rate' },
        retention:   { score: retention,   weight: 25, label: 'Retention' }
      },
      summary: { total, recovered, treating,
        mastered: corrections.filter(c => c.lifecycle === this.LIFECYCLE.MASTERED).length
      }
    };
  },


  // ═══════════════════════════════════════════
  // §9 DAILY PRESCRIPTION
  // "Today: 7 Reading Drills + 4 Percentage Q
  //  + 3 Flashcards = 8 min"
  // ═══════════════════════════════════════════

  getDailyPrescription() {
    if (typeof MistakeDNA === 'undefined') return null;

    const repeats = MistakeDNA.getRepeatMistakes();
    const priority = MistakeDNA.getRevisionPriority();
    if (priority.length === 0 && repeats.length === 0) return null;

    const top = priority.slice(0, 3);
    const tasks = [];
    let totalMinutes = 0;
    let totalDrills = 0;
    let totalFlashcards = 0;
    let expectedGain = 0;

    top.forEach(t => {
      const map = this.CORRECTION_MAP[t.cause];
      if (!map) return;

      const scale = t.priority >= 60 ? 1.0 : t.priority >= 40 ? 0.7 : 0.5;
      const drills = Math.max(2, Math.round(map.drillCount * scale));
      const cards = Math.max(0, Math.round(map.flashcardCount * scale));
      const mins = Math.round(map.estimatedMinutes * scale);

      tasks.push({
        topic: t.topic,
        cause: t.cause,
        label: t.label,
        color: t.color,
        drillCount: drills,
        flashcardCount: cards,
        estimatedMinutes: mins,
        icon: map.icon
      });

      totalMinutes += mins;
      totalDrills += drills;
      totalFlashcards += cards;
      expectedGain += Math.round(t.totalErrors * (map.baseProbability / 100) * 0.5);
    });

    if (tasks.length === 0) return null;

    const parts = [];
    if (totalDrills > 0) parts.push(`${totalDrills} practice questions`);
    if (totalFlashcards > 0) parts.push(`${totalFlashcards} flashcard${totalFlashcards === 1 ? '' : 's'}`);
    parts.push(`${totalMinutes} minutes`);

    return {
      diagnosis: `${tasks.length} weakness${tasks.length === 1 ? '' : 'es'} need correction today`,
      evidence: `Based on ${repeats.length} persistent mistake${repeats.length === 1 ? '' : 's'} across your recent tests`,
      prescription: {
        tasks,
        totalDrills,
        totalFlashcards,
        totalMinutes,
        summaryLine: `Today: ${parts.join(' + ')}`
      },
      expectedOutcome: {
        marksGain: Math.max(1, expectedGain),
        probability: Math.round(tasks.reduce((s, t) => s + (this.CORRECTION_MAP[t.cause]?.baseProbability || 50), 0) / tasks.length),
        confidence: tasks.length >= 2 ? 'high' : 'medium'
      }
    };
  },


  // ═══════════════════════════════════════════
  // §10 RECOVERY TIMELINE
  // 90-day stability tracking per weakness.
  // ═══════════════════════════════════════════

  getRecoveryTimeline() {
    const data = this._getData();
    const corrections = data.corrections || [];

    return corrections
      .filter(c => c.startedAt)
      .map(c => {
        const start = new Date(c.startedAt);
        const now = new Date();
        const daysSinceStart = Math.floor((now - start) / 86400000);
        const daysToStable = c.stableAt
          ? Math.floor((new Date(c.stableAt) - start) / 86400000)
          : null;
        const daysToMastery = c.masteredAt
          ? Math.floor((new Date(c.masteredAt) - start) / 86400000)
          : null;

        const daysRemaining = c.lifecycle === 'stable' && c.stableAt
          ? Math.max(0, 90 - Math.floor((now - new Date(c.stableAt)) / 86400000))
          : c.lifecycle === 'mastered' ? 0
          : null;

        return {
          id: c.id,
          topic: c.topic,
          cause: c.cause,
          label: c.label,
          lifecycle: c.lifecycle,
          daysSinceStart,
          daysToStable,
          daysToMastery,
          daysRemaining,
          progress: c.lifecycle === 'mastered' ? 100
            : c.lifecycle === 'stable' ? Math.min(95, Math.round(((90 - (daysRemaining || 90)) / 90) * 100))
            : c.lifecycle === 'recovering' ? 50
            : c.lifecycle === 'treating' ? 25
            : 10
        };
      })
      .sort((a, b) => b.progress - a.progress);
  },


  // ═══════════════════════════════════════════
  // §11 CORRECTION SIMULATOR
  // "If Reading improves 25% → +14 marks, P: 81%"
  // ═══════════════════════════════════════════

  simulateCorrection(cause, improvementPct) {
    if (typeof MistakeDNA === 'undefined') return null;

    const snaps = MistakeDNA._getSnapshots();
    if (snaps.length === 0) return null;

    const latest = snaps[snaps.length - 1];
    const marksLost = latest.recoverableMarks || 0;

    let causeMarks = 0;
    (latest.topicCauses || []).forEach(tc => {
      if (tc.cause === cause) causeMarks += (tc.count || 1);
    });

    const map = this.CORRECTION_MAP[cause];
    if (!map) return null;

    const meta = typeof MistakeDNA !== 'undefined' ? MistakeDNA.CAUSE_META[cause] : { label: cause };
    const recoverable = Math.round(causeMarks * (improvementPct / 100));
    const probability = Math.min(99, Math.round(
      map.baseProbability * (improvementPct <= 50 ? 1.1 : improvementPct <= 75 ? 0.95 : 0.8)
    ));

    return {
      diagnosis: `${meta.label} errors across ${causeMarks} question${causeMarks === 1 ? '' : 's'}`,
      evidence: `Last test: ${causeMarks} ${meta.label.toLowerCase()} errors, ${marksLost} total recoverable marks`,
      prescription: {
        type: map.type,
        label: map.label,
        improvementTarget: `Reduce ${meta.label.toLowerCase()} by ${improvementPct}%`,
        steps: map.steps
      },
      expectedOutcome: {
        marksGain: Math.max(1, recoverable),
        probability,
        confidence: causeMarks >= 3 ? 'high' : 'medium',
        insight: `If ${meta.label.toLowerCase()} errors reduce by ${improvementPct}%, expected gain: +${Math.max(1, recoverable)} marks (${probability}% probability).`
      }
    };
  },


  // ═══════════════════════════════════════════
  // §12 AUTO DAILY MISSIONS (MistakeDNA-driven)
  // ═══════════════════════════════════════════

  generateCorrectionMissions() {
    const prescription = this.getDailyPrescription();
    if (!prescription || !prescription.prescription.tasks.length) return null;

    const topTask = prescription.prescription.tasks[0];
    const map = this.CORRECTION_MAP[topTask.cause];
    if (!map) return null;

    return {
      id: `cie_${topTask.cause}_${topTask.topic.replace(/\s/g, '_').toLowerCase()}`,
      trigger: 'mock_completed',
      target: 1,
      label: `${map.icon} Fix: ${topTask.topic} (${topTask.label})`,
      icon: map.icon,
      xp: 150,
      category: 'correction',
      subject: topTask.topic,
      cause: topTask.cause,
      estimatedMinutes: topTask.estimatedMinutes,
      progress: 0,
      done: false,
      source: 'CorrectionEngine'
    };
  },


  // ═══════════════════════════════════════════
  // §13 RECOVERY ENGINE — processRecoveryCheck()
  // Called after every test to update lifecycle.
  // ═══════════════════════════════════════════

  processRecoveryCheck(result) {
    if (!result || !result.subjectWise) return;
    if (typeof MistakeDNA === 'undefined') return;

    const data = this._getData();
    if (!data.corrections) data.corrections = [];

    const snaps = MistakeDNA._getSnapshots();
    if (snaps.length < 2) return;

    const prev = snaps[snaps.length - 2];
    const curr = snaps[snaps.length - 1];

    // Create correction records for new repeat mistakes
    const repeats = MistakeDNA.getRepeatMistakes();
    repeats.forEach(r => {
      const existingId = `${r.topic}|${r.cause}`;
      if (!data.corrections.find(c => c.id === existingId)) {
        data.corrections.push({
          id: existingId,
          topic: r.topic,
          subject: r.subject || '',
          cause: r.cause,
          label: r.label,
          color: r.color,
          lifecycle: this.LIFECYCLE.MISTAKE,
          startedAt: new Date().toISOString(),
          recoveredAt: null,
          stableAt: null,
          masteredAt: null,
          stableTestCount: 0,
          initialAccuracy: curr.subjectAccuracy?.[r.subject] || curr.accuracy || 0
        });
      }
    });

    // Transition existing correction records
    data.corrections.forEach(c => {
      const subj = c.subject;
      const prevAcc = prev.subjectAccuracy?.[subj] ?? prev.accuracy ?? 0;
      const currAcc = curr.subjectAccuracy?.[subj] ?? curr.accuracy ?? 0;
      this._transitionLifecycle(c, currAcc, prevAcc);
    });

    // Cap at 50 records
    if (data.corrections.length > 50) {
      data.corrections.sort((a, b) => {
        const order = { removed: 0, mastered: 1, stable: 2, recovering: 3, treating: 4, mistake: 5 };
        return (order[a.lifecycle] || 5) - (order[b.lifecycle] || 5);
      });
      data.corrections = data.corrections.slice(-50);
    }

    // Update monthly recovery stats
    this._updateMonthlyRecovery(data, curr);

    data.updatedAt = new Date().toISOString();
    this._saveData(data);
  },


  // ═══════════════════════════════════════════
  // §14 LONG TERM SCORE RECOVERY
  // Monthly recovered marks: Jan +4, Feb +11…
  // ═══════════════════════════════════════════

  getLongTermRecovery() {
    const data = this._getData();
    const monthly = data.monthlyRecovery || {};

    const months = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, stats]) => ({
        month,
        label: this._formatMonth(month),
        recovered: stats.recovered || 0,
        newWeaknesses: stats.newWeaknesses || 0,
        netGain: (stats.recovered || 0) - (stats.newWeaknesses || 0),
        accuracyDelta: stats.accuracyDelta || 0
      }));

    let cumulative = 0;
    months.forEach(m => {
      cumulative += m.recovered;
      m.cumulative = cumulative;
    });

    return {
      ready: months.length >= 1,
      months,
      totalRecovered: cumulative,
      insight: months.length >= 2
        ? `You've recovered ${cumulative} weakness${cumulative === 1 ? '' : 'es'} since ${months[0].label}.`
        : months.length === 1
          ? `${months[0].recovered} recovery event${months[0].recovered === 1 ? '' : 's'} this month so far.`
          : 'Take more tests to start tracking long-term recovery.'
    };
  },

  _updateMonthlyRecovery(data, snapshot) {
    if (!data.monthlyRecovery) data.monthlyRecovery = {};
    const monthKey = new Date().toISOString().slice(0, 7);

    if (!data.monthlyRecovery[monthKey]) {
      data.monthlyRecovery[monthKey] = { recovered: 0, newWeaknesses: 0, accuracyDelta: 0 };
    }

    const corrections = data.corrections || [];
    const thisMonth = data.monthlyRecovery[monthKey];

    thisMonth.recovered = corrections.filter(c =>
      c.recoveredAt && c.recoveredAt.startsWith(monthKey)
    ).length;

    thisMonth.newWeaknesses = corrections.filter(c =>
      c.startedAt && c.startedAt.startsWith(monthKey) && c.lifecycle === this.LIFECYCLE.MISTAKE
    ).length;
  },

  _formatMonth(monthKey) {
    const [year, month] = monthKey.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(month) - 1]} ${year}`;
  },


  // ═══════════════════════════════════════════
  // §15 RECOVERY PASSPORT
  // Full weakness → treatment → recovery history.
  // ═══════════════════════════════════════════

  getRecoveryPassport() {
    const data = this._getData();
    const corrections = data.corrections || [];
    const score = this.getCorrectionScore();
    const longTerm = this.getLongTermRecovery();

    const passport = {
      ready: corrections.length > 0,
      totalWeaknesses: corrections.length,
      correctionScore: score,
      longTermRecovery: longTerm,

      active: corrections
        .filter(c => !['mastered', 'removed'].includes(c.lifecycle))
        .map(c => this._passportEntry(c))
        .sort((a, b) => {
          const order = { mistake: 0, treating: 1, recovering: 2, stable: 3 };
          return (order[a.lifecycle] || 4) - (order[b.lifecycle] || 4);
        }),

      completed: corrections
        .filter(c => ['mastered', 'removed'].includes(c.lifecycle))
        .map(c => this._passportEntry(c))
        .sort((a, b) => new Date(b.masteredAt || 0) - new Date(a.masteredAt || 0)),

      stats: {
        mistake: corrections.filter(c => c.lifecycle === 'mistake').length,
        treating: corrections.filter(c => c.lifecycle === 'treating').length,
        recovering: corrections.filter(c => c.lifecycle === 'recovering').length,
        stable: corrections.filter(c => c.lifecycle === 'stable').length,
        mastered: corrections.filter(c => c.lifecycle === 'mastered').length
      }
    };

    return passport;
  },

  _passportEntry(c) {
    const meta = typeof MistakeDNA !== 'undefined' ? MistakeDNA.CAUSE_META[c.cause] : null;
    const map = this.CORRECTION_MAP[c.cause];

    return {
      id: c.id,
      topic: c.topic,
      subject: c.subject,
      cause: c.cause,
      causeLabel: meta ? meta.label : c.cause,
      causeColor: meta ? meta.color : '#6B7280',
      lifecycle: c.lifecycle,
      lifecycleLabel: this._lifecycleLabel(c.lifecycle),
      lifecycleColor: this._lifecycleColor(c.lifecycle),
      correction: map ? map.label : 'General Practice',
      correctionIcon: map ? map.icon : '📝',
      startedAt: c.startedAt,
      recoveredAt: c.recoveredAt,
      stableAt: c.stableAt,
      masteredAt: c.masteredAt,
      stableTestCount: c.stableTestCount || 0,
      daysSinceStart: c.startedAt
        ? Math.floor((Date.now() - new Date(c.startedAt).getTime()) / 86400000)
        : 0
    };
  },

  _lifecycleLabel(state) {
    const labels = {
      mistake: 'Detected', treating: 'In Treatment', recovering: 'Recovering',
      stable: 'Stable', mastered: 'Mastered', removed: 'Resolved'
    };
    return labels[state] || state;
  },

  _lifecycleColor(state) {
    const colors = {
      mistake: '#EF4444', treating: '#F59E0B', recovering: '#3B82F6',
      stable: '#10B981', mastered: '#059669', removed: '#6B7280'
    };
    return colors[state] || '#6B7280';
  },


  // ═══════════════════════════════════════════
  // MASTER: getFullReport()
  // ═══════════════════════════════════════════

  getFullReport() {
    return {
      dailyPrescription: this.getDailyPrescription(),
      recoveryProbability: this.getRecoveryProbability(),
      recoveryConfidence: this.getRecoveryConfidence(),
      recoveryLifecycle: this.getRecoveryLifecycle(),
      recoveryTimeline: this.getRecoveryTimeline(),
      correctionScore: this.getCorrectionScore(),
      longTermRecovery: this.getLongTermRecovery(),
      passport: this.getRecoveryPassport()
    };
  },


  // ═══════════════════════════════════════════
  // STORAGE HELPERS
  // ═══════════════════════════════════════════

  _getData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : { corrections: [], monthlyRecovery: {}, updatedAt: null };
    } catch { return { corrections: [], monthlyRecovery: {}, updatedAt: null }; }
  },

  _saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[CIE] Save error:', e.message);
    }
  },

  // ═══════════════════════════════════════════
  // Doc 23: COMMON ENGINE INTERFACE (IESCP)
  // ═══════════════════════════════════════════
  getStandardReport() {
    const data = this._getData() || { corrections: [] };
    const passport = this.getRecoveryPassport();
    if (!passport.ready) {
      return {
        engineName: 'CorrectionEngine',
        input: 'No data',
        evidence: 'No recovery passport initialized.',
        score: 0,
        confidence: 'low',
        prediction: 'Requires active weakness corrections.',
        recommendation: 'Initialize correction pathways.',
        expectedOutcome: 'Recovery of lost marks.',
        actualOutcome: 'Awaiting mock.',
        selfEvaluation: 'No history.'
      };
    }

    const score = passport.correctionScore?.score || 50;
    const stats = passport.stats || { mistake: 0, treating: 0, recovering: 0, stable: 0, mastered: 0 };
    const rx = this.getDailyPrescription();

    return {
      engineName: 'CorrectionEngine',
      input: `Correction data containing ${data.corrections?.length || 0} tracked errors.`,
      evidence: `Active items: ${stats.treating || 0} treating, ${stats.recovering || 0} recovering. Mastered: ${stats.mastered || 0}`,
      score: score,
      confidence: (data.corrections?.length || 0) >= 5 ? 'high' : (data.corrections?.length || 0) >= 2 ? 'medium' : 'low',
      prediction: rx ? `Today's prescription will address top leak with estimated ${rx.expectedOutcome?.probability || 70}% success.` : 'No critical weaknesses active.',
      recommendation: rx ? `Perform ${rx.prescription?.summaryLine || 'daily prescription'}.` : 'No daily prescription necessary.',
      expectedOutcome: rx ? `Expected to recover +${rx.expectedOutcome?.marksGain || 0} marks.` : 'Stable state maintained.',
      actualOutcome: 'Self-evaluation tracking active in localStorage.',
      selfEvaluation: 'Confidence factors and recovery probabilities are evaluated against subsequent test sessions.'
    };
  }
};

window.CorrectionEngine = CorrectionEngine;
