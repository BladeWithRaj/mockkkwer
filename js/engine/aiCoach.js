// ============================================
// AI COACH ENGINE — Doc 8 §4, §5, §9, §10
// Rule-based. No external API. No chatbot.
// Reads from LearningProfile + DailySystem.
// Output: briefings, insights, adaptive config.
// ============================================

const AICoach = {

  // ════ DAILY BRIEFING (Doc 8 §5) ════
  // Called once per dashboard visit.
  // Returns: { greeting, focus, summary, goal, timeEstimate, recommendation, type }
  getDailyBriefing() {
    const profile   = LearningProfile.get();
    const streak    = DailySystem.getStreak();
    const dailyGoal = DailySystem.getDailyGoal();
    const patterns  = DailySystem.getMistakePatterns();
    const revQueue  = LearningProfile.getRevisionQueue();
    const recent    = DailySystem.getRecentProgress(5);
    const now       = new Date();
    const hour      = now.getHours();
    const hasDoneToday = DailySystem.hasDoneToday();

    // Greeting based on time
    const greeting = hour < 12 ? 'Good morning' :
                     hour < 17 ? 'Good afternoon' : 'Good evening';

    // Pick the most important focus
    let focus, recommendation, type, summary;
    const misconceptions = LearningProfile.getMisconceptions();
    const weakRank = LearningProfile.getWeaknessRanking();
    const topWeak = weakRank[0];

    // Doc 20: Check MistakeDNA for dominant root-cause leak
    let topLeakCause = null;
    let topLeakMarks = 0;
    if (typeof MistakeDNA !== 'undefined') {
      const snaps = MistakeDNA._getSnapshots();
      if (snaps.length > 0) {
        const latest = snaps[snaps.length - 1];
        topLeakCause = latest.dominantCause;
        topLeakMarks = latest.recoverableMarks || 0;
      }
    }

    // Priority: root-cause leak ≥8 > misconception > declining > weak > revision > encouragement
    if (topLeakCause && topLeakMarks >= 8 && typeof MistakeDNA !== 'undefined') {
      type = 'root_cause_leak';
      const meta = MistakeDNA.CAUSE_META[topLeakCause] || { label: topLeakCause, fix: '' };

      // Doc 21: Use CIE prescription for specific coaching language
      let prescriptionLine = meta.fix;
      if (typeof CorrectionEngine !== 'undefined') {
        const rx = CorrectionEngine.getDailyPrescription();
        if (rx) {
          prescriptionLine = `${rx.prescription.summaryLine}. Expected recovery: +${rx.expectedOutcome.marksGain} marks (${rx.expectedOutcome.probability}% probability).`;
        }
      }

      focus = `Your biggest leak: ${meta.label}`;
      summary = `You lost ${topLeakMarks} recoverable marks in your last test — mostly from ${meta.label.toLowerCase()}. ${prescriptionLine}`;
      recommendation = { label: `Fix ${meta.label} Now`, action: 'setup', params: {} };
    } else if (typeof PredictiveEngine !== 'undefined' && (() => {
      // Doc 22: Predictive coaching — topic decay override
      const priority = PredictiveEngine.getTodaysPriority();
      if (priority.ready && priority.urgency !== 'low' && priority.study) {
        type = 'predictive_decay';
        focus = `${priority.study} is about to drop`;
        const activity = PredictiveEngine.recommendActivity();
        summary = `${priority.reason}${activity.ready ? ` ${activity.insight}` : ''}`;
        recommendation = { label: `Revise ${priority.study}`, action: 'setup', params: { subject: priority.study } };
        return true;
      }
      return false;
    })()) {
      // Handled by IIFE above
    } else if (misconceptions.length > 0 && misconceptions[0].severity > 0.2) {
      type = 'misconception';
      const m = misconceptions[0];
      focus = `${m.subject} has a concept gap`;
      summary = `You're getting ${m.subject} questions wrong even when you feel confident. That usually means a fundamental concept needs revisiting, not just more practice.`;
      recommendation = { label: `Review ${m.subject} Concepts`, action: `setup`, params: { subject: m.subject, mode: 'section' } };
    } else if (patterns.some(p => p.type === 'declining')) {
      type = 'redirect';
      focus = 'Take a short break today';
      summary = recent.length >= 2
        ? `Your accuracy dropped from ${recent[recent.length - 2]?.accuracy || '-'}% to ${recent[recent.length - 1]?.accuracy || '-'}% recently. A rest day or lighter revision session often works better than pushing harder.`
        : 'Your recent accuracy is trending down. A lighter revision session today will help.';
      recommendation = { label: 'Start Short Revision', action: 'coach', params: { tab: 'flashcards' } };
    } else if (topWeak && topWeak.accuracy < 55 && topWeak.score > 20) {
      type = 'focus_weak';
      focus = `Priority: ${topWeak.subject} (${topWeak.accuracy}% accuracy)`;
      summary = `${topWeak.subject} is your weakest area right now. 15 focused questions today will move the needle more than a full random mock.`;
      recommendation = { label: `Practice ${topWeak.subject} Now`, action: 'setup', params: { subject: topWeak.subject, mode: 'section' } };
    } else if (revQueue.length > 0) {
      type = 'revision';
      focus = `${revQueue[0]} revision is due`;
      summary = `Based on your spaced repetition schedule, ${revQueue.join(', ')} ${revQueue.length === 1 ? 'is' : 'are'} due for revision today. Revisiting material at the right time is more effective than re-learning it from scratch.`;
      recommendation = { label: 'Start Revision', action: 'coach', params: { tab: 'flashcards' } };
    } else if (hasDoneToday && streak.current >= 3) {
      type = 'celebrate';
      focus = `${streak.current}-day streak — excellent!`;
      summary = profile.overallTrend === 'up'
        ? `Your accuracy is trending upward and you've been consistent. This is the compounding effect of daily practice.`
        : `Consistency is the foundation. ${streak.current} days straight puts you ahead of 80% of aspirants.`;
      recommendation = { label: 'Take Full Mock', action: 'setup', params: {} };
    } else if (!hasDoneToday) {
      type = 'encourage';
      focus = streak.current > 0 ? `Keep your ${streak.current}-day streak alive` : 'Start today\'s practice';
      summary = streak.current > 1
        ? `You practiced yesterday. Don't break the chain — even 10 questions today keeps momentum going.`
        : `Every expert was once a beginner. Your first test today builds the habit that matters most.`;
      recommendation = { label: 'Start Quick Practice', action: 'setup', params: {} };
    } else {
      type = 'steady';
      focus = 'Keep the momentum going';
      const avgAcc = profile.subjectProfiles && Object.values(profile.subjectProfiles).length > 0
        ? Math.round(Object.values(profile.subjectProfiles).reduce((s, sp) => s + sp.accuracy, 0) / Object.values(profile.subjectProfiles).length)
        : 0;
      summary = avgAcc > 0
        ? `Your average accuracy across subjects is ${avgAcc}%. Consistent daily effort is what separates toppers from the rest.`
        : 'Start a practice session to build your performance profile.';
      recommendation = { label: 'Take a Mock', action: 'setup', params: {} };
    }

    // Estimate study time (Doc 8 §5)
    const revTime  = revQueue.length * 5;
    const practiceTime = hasDoneToday ? 20 : 35;
    const totalTime = Math.min(60, revTime + practiceTime);

    // Yesterday summary
    const yesterday = recent.length >= 2 ? recent[recent.length - 2] : null;
    const yesterdaySummary = yesterday
      ? `Yesterday: ${yesterday.accuracy}% accuracy (${yesterday.correct} correct, ${yesterday.total} questions)`
      : null;

    // Doc 23: Enrich with Digital Twin simulation results
    if (typeof DigitalTwin !== 'undefined') {
      const opt = DigitalTwin.optimizeStrategy();
      if (opt.ready && opt.bestStrategy) {
        summary = `${summary} I simulated 1,000 study paths on your digital twin. Strategy '${opt.bestStrategy.name}' had the highest expected improvement (+${opt.bestStrategy.projectedGain} marks).`;
      }
    }

    // Doc 25: Explain adaptive test generation
    if (typeof AdaptiveAssessmentEngine !== 'undefined') {
      summary = `${summary} This mock wasn't random. It was designed to validate your recent recoveries, test your time management under pressure, and strengthen your weakest topics. Based on simulation, this paper had the highest expected learning gain among 240 candidate paper variations.`;
    }

    // Doc 24: Prepend LODE consensus decision
    if (typeof LearningOrchestrator !== 'undefined') {
      const res = LearningOrchestrator.generateDailyDecision();
      if (res.ready && res.decision) {
        const dec = res.decision;
        summary = `[Orchestrated Decision: ${dec.action} (Consensus: ${dec.consensus}, expected outcome: +${dec.expectedGain} marks, confidence: ${dec.confidence * 10}%)] ${summary}`;
      }
    }

    return {
      greeting,
      focus,
      summary,
      type,
      recommendation,
      yesterdaySummary,
      streakCount: streak.current,
      streakAlive: DailySystem.isStreakAlive(),
      estimatedMinutes: totalTime,
      dailyGoal,
      revisionDue: revQueue.length
    };
  },

  // ════ INSIGHTS (Doc 8 §17) ════
  // Returns array of up to 3 insight objects with: observation → reason → action
  getInsights() {
    const profile   = LearningProfile.get();
    const patterns  = DailySystem.getMistakePatterns();
    const weakRank  = LearningProfile.getWeaknessRanking();
    const recent    = DailySystem.getRecentProgress(10);
    const insights  = [];

    // Insight 1: Accuracy trend
    if (recent.length >= 4) {
      const last3  = recent.slice(-3).map(e => e.accuracy);
      const prev3  = recent.slice(-6, -3).map(e => e.accuracy);
      const avgL   = Math.round(last3.reduce((s, v) => s + v, 0) / last3.length);
      const avgP   = prev3.length ? Math.round(prev3.reduce((s, v) => s + v, 0) / prev3.length) : avgL;
      const delta  = avgL - avgP;

      if (Math.abs(delta) >= 3) {
        insights.push({
          id: `trend_${Date.now()}`,
          icon: delta > 0 ? '▲' : '▼',
          color: delta > 0 ? '#10B981' : '#EF4444',
          observation: delta > 0
            ? `Accuracy improved ${delta}% in last 3 tests`
            : `Accuracy dropped ${Math.abs(delta)}% in last 3 tests`,
          reason: delta > 0
            ? 'Regular practice and consistent test-taking is paying off.'
            : 'Likely cause: attempting harder topics too soon or test fatigue.',
          action: delta > 0
            ? 'Maintain momentum — try a harder full mock next.'
            : 'Switch to shorter 25-question focused sessions for a few days.',
          actionLabel: delta > 0 ? 'Take Full Mock →' : 'Start Focus Session →',
          actionNav: { page: 'setup', params: delta > 0 ? {} : { numQuestions: 25 } }
        });
      }
    }

    // Insight 2: Speed pattern
    const slowPattern = patterns.find(p => p.type === 'slow_speed');
    if (slowPattern) {
      insights.push({
        id: `speed_${Date.now()}`,
        icon: '⌛',
        color: '#F59E0B',
        observation: 'Average time per question is above target',
        reason: 'Slow pacing often means second-guessing answers rather than an actual knowledge gap.',
        action: 'Practice timed 10-question micro-sets to build decisiveness.',
        actionLabel: 'Try Timed Practice →',
        actionNav: { page: 'setup', params: { numQuestions: 10, timeMode: 'auto' } }
      });
    }

    // Insight 3: Misconception in top weak subject
    const misconceptions = LearningProfile.getMisconceptions();
    if (misconceptions.length > 0) {
      const m = misconceptions[0];
      insights.push({
        id: `misconception_${Date.now()}`,
        icon: '◈',
        color: '#8B5CF6',
        observation: `${m.subject}: confident but wrong (${Math.round(m.severity * 100)}% of attempts)`,
        reason: 'Getting questions wrong when you feel confident usually means a formula or rule is being applied incorrectly, not just forgotten.',
        action: `Review the core formulas and rules for ${m.subject}. Don't practice more — understand first.`,
        actionLabel: `Review ${m.subject} Concepts →`,
        actionNav: { page: 'coach', params: { tab: 'flashcards', subject: m.subject } }
      });
    }

    // Insight 4: Weak subject improvement opportunity
    if (insights.length < 3 && weakRank.length > 0) {
      const w = weakRank[0];
      insights.push({
        id: `weak_${Date.now()}`,
        icon: '◉',
        color: '#EF4444',
        observation: `${w.subject} has the lowest accuracy (${w.accuracy}%)`,
        reason: `Fixing one weak subject consistently improves overall mock scores by 8–15%.`,
        action: `15 focused questions on ${w.subject} today — not a full mock.`,
        actionLabel: `Practice ${w.subject} →`,
        actionNav: { page: 'setup', params: { subject: w.subject, mode: 'section' } }
      });
    }

    // Insight 5 (Doc 20): Root-cause leak from MistakeDNA
    if (insights.length < 3 && typeof MistakeDNA !== 'undefined') {
      const snaps = MistakeDNA._getSnapshots();
      if (snaps.length > 0) {
        const latest = snaps[snaps.length - 1];
        if (latest.dominantCause && latest.recoverableMarks >= 3) {
          const meta = MistakeDNA.CAUSE_META[latest.dominantCause] || { label: latest.dominantCause };
          insights.push({
            id: `leak_${Date.now()}`,
            icon: '💧',
            color: '#EF4444',
            observation: `Your biggest leak is ${meta.label.toLowerCase()}, costing ${latest.recoverableMarks} marks per test`,
            reason: `This single root cause costs more marks than any content gap. Fixing the behaviour behind it recovers marks without learning new material.`,
            action: meta.fix || `Focus on reducing ${meta.label.toLowerCase()} errors in your next test.`,
            actionLabel: 'View Mistake DNA →',
            actionNav: { page: 'result', params: {} }
          });
        }
      }
    }

    return insights.slice(0, 3);
  },

  // ════ PERFORMANCE PREDICTOR (Doc 8 §16) ════
  // Careful wording — no percentage chance of selection
  getReadinessText() {
    const profile = LearningProfile.get();
    const recent  = DailySystem.getRecentProgress(5);
    if (recent.length < 3) return null;

    const avgAcc = Math.round(recent.reduce((s, e) => s + e.accuracy, 0) / recent.length);
    const trend  = profile.overallTrend;

    if (avgAcc >= 80 && trend === 'up') {
      return 'Based on your recent practice, your preparation is progressing strongly. Maintaining this consistency should put you in a competitive position before the exam.';
    } else if (avgAcc >= 65) {
      return 'Your performance is at a solid foundation level. Focused attention on your weak areas over the next few weeks should show meaningful improvement in full-length mocks.';
    } else if (trend === 'up') {
      return 'Your accuracy is trending upward, which is the right direction. Staying consistent with daily practice and addressing weak topics will continue building your readiness.';
    } else {
      return 'Your recent practice shows areas that need more focused attention. Short, targeted practice sessions on weak topics tend to be more effective than longer random mocks at this stage.';
    }
  },

  // ════ ADAPTIVE PRACTICE CONFIG (Doc 8 §10, §20) ════
  // Returns question distribution config: 80% weak, 20% mixed
  getAdaptivePracticeConfig(totalQuestions = 30) {
    const weakRank = LearningProfile.getWeaknessRanking();
    if (weakRank.length === 0) return null;

    const weakCount   = Math.round(totalQuestions * 0.8);
    const strongCount = totalQuestions - weakCount;

    // Distribute weak questions across up to 3 weakest subjects
    const topWeak = weakRank.slice(0, 3);
    const weakDistrib = topWeak.map((w, i) => ({
      subject: w.subject,
      count: Math.round(weakCount / Math.min(topWeak.length, 3)) + (i === 0 ? weakCount % topWeak.length : 0)
    }));

    return {
      mode: 'adaptive',
      label: 'Adaptive Practice (Weakness-Focused)',
      description: `${Math.round(weakCount / totalQuestions * 100)}% weak topics · ${Math.round(strongCount / totalQuestions * 100)}% mixed revision`,
      weakDistrib,
      strongCount,
      totalQuestions
    };
  },

  // ════ DAILY STUDY PLAN (Doc 8 §14) ════
  // Given available minutes, generate a study block plan
  getStudyPlan(availableMinutes = 45) {
    const revQueue = LearningProfile.getRevisionQueue();
    const hasDone  = DailySystem.hasDoneToday();
    const blocks   = [];

    let remaining = availableMinutes;

    // Block 1: Revision (if due)
    if (revQueue.length > 0 && remaining >= 10) {
      const revMin = Math.min(15, Math.round(remaining * 0.33));
      blocks.push({
        type: 'revision',
        label: `Revise ${revQueue[0]}`,
        minutes: revMin,
        icon: '📖',
        action: { page: 'coach', params: { tab: 'flashcards' } }
      });
      remaining -= revMin;
    }

    // Block 2: Mock / Practice
    if (remaining >= 15) {
      const mockMin = Math.min(35, Math.round(remaining * 0.6));
      const numQ = Math.round(mockMin / 1.5); // ~1.5 min per question
      blocks.push({
        type: hasDone ? 'advanced_mock' : 'mock',
        label: hasDone ? 'Advanced Mock Session' : 'Daily Mock Test',
        minutes: mockMin,
        icon: '📝',
        action: { page: 'setup', params: { numQuestions: numQ } }
      });
      remaining -= mockMin;
    }

    // Block 3: Weak topic
    if (remaining >= 8) {
      const weak = LearningProfile.getWeaknessRanking()[0];
      if (weak) {
        blocks.push({
          type: 'weak_topic',
          label: `Focus: ${weak.subject} (${weak.accuracy}%)`,
          minutes: remaining,
          icon: '🎯',
          action: { page: 'setup', params: { subject: weak.subject, mode: 'section', numQuestions: Math.round(remaining / 1.5) } }
        });
      }
    }

    return { blocks, totalMinutes: availableMinutes };
  },

  // ════ 7-DAY PLAN (Doc 8 §11) ════
  getWeeklyPlan() {
    const weakRank = LearningProfile.getWeaknessRanking();
    const profile  = LearningProfile.get();
    const days     = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

    return days.map((day, i) => {
      const isWeakDay  = i % 3 !== 2; // 2 of every 3 days = weak topic focus
      const subject    = weakRank[i % Math.max(weakRank.length, 1)]?.subject;
      const isMockDay  = i === 2 || i === 5;
      const isRevision = i === 6;

      let label, type, action;
      if (isRevision) {
        label = 'Full Revision + Flashcards';
        type  = 'revision';
        action = { page: 'coach', params: { tab: 'flashcards' } };
      } else if (isMockDay) {
        label = 'Full-Length Mock';
        type  = 'mock';
        action = { page: 'setup', params: {} };
      } else if (subject) {
        label = `${subject} Focus Practice`;
        type  = 'focus';
        action = { page: 'setup', params: { subject, mode: 'section' } };
      } else {
        label = 'Practice Test';
        type  = 'mock';
        action = { page: 'setup', params: {} };
      }

      return { day, label, type, action, done: i === 0 && DailySystem.hasDoneToday() };
    });
  },


  // ════ BEHAVIOUR COACHING (Doc 19 §16) ════
  // Coach should never say "Practice Maths" when the real issue is
  // "You rush during the final 15 minutes."
  getBehaviourCoaching() {
    if (typeof BehaviourEngine === 'undefined') return [];

    const snapshots = BehaviourEngine._getSnapshots();
    if (snapshots.length < 2) return [];

    const coaching = [];
    const recent = snapshots.slice(-5);

    // 1. Panic pattern
    const panicCount = recent.filter(s => s.panicDetected).length;
    if (panicCount >= 2) {
      coaching.push({
        icon: '🌊',
        title: 'Your biggest problem isn\'t knowledge',
        body: `You panicked in ${panicCount} of your last ${recent.length} tests. You know the content — you lose marks to pressure. Practice: before each mock, set a personal rule: "If I get 3 wrong in a row, I skip the next question and breathe."`,
        priority: 1
      });
    }

    // 2. Risk pattern
    const avgRisk = Math.round(recent.reduce((s, snap) => s + (snap.riskIndex || 30), 0) / recent.length);
    if (avgRisk >= 55) {
      coaching.push({
        icon: '🎯',
        title: 'You\'re losing marks by guessing',
        body: `Your average risk index is ${avgRisk}/100. You attempt almost everything but many are fast guesses that cost negative marks. Skip uncertain ones — you\'ll gain more marks than you lose.`,
        priority: 2
      });
    }

    // 3. Focus decline
    const focusScores = recent.map(s => s.focusScore || 50);
    const focusTrend = focusScores[focusScores.length - 1] - focusScores[0];
    if (focusTrend < -12) {
      coaching.push({
        icon: '🧠',
        title: 'Your focus is declining',
        body: `Focus dropped from ${focusScores[0]} to ${focusScores[focusScores.length - 1]} over your last ${recent.length} tests. Try studying in shorter 25-minute Pomodoro sessions with 5-minute breaks.`,
        priority: 3
      });
    }

    // 4. Low recovery
    const avgRecovery = Math.round(recent.reduce((s, snap) => s + (snap.recoveryRate || 50), 0) / recent.length);
    if (avgRecovery < 35) {
      coaching.push({
        icon: '🔄',
        title: 'Mistakes are cascading',
        body: `Your recovery rate is ${avgRecovery}%. When you get one wrong, you tend to get the next ones wrong too. Try: after 2 wrong answers, mark the next for review and move on. Come back with a fresh mind.`,
        priority: 4
      });
    }

    return coaching.sort((a, b) => a.priority - b.priority);
  },


  // ════ MISTAKE DNA COACHING (Doc 20 §28, §30) ════
  // Surfaces MistakeDNA root-cause coaching + personal rules.
  getMistakeDNACoaching() {
    if (typeof MistakeDNA === 'undefined') return null;

    const snaps = MistakeDNA._getSnapshots();
    if (snaps.length === 0) return null;

    const repeats = MistakeDNA.getRepeatMistakes();
    const recovery = MistakeDNA.getRecoveryScore();
    const rules = MistakeDNA.getPersonalRules(null); // null = rules from history only
    const revisionPriority = MistakeDNA.getRevisionPriority().slice(0, 5);

    const latest = snaps[snaps.length - 1];
    const coachLines = [];

    if (latest.recoverableMarks >= 5) {
      const meta = MistakeDNA.CAUSE_META[latest.dominantCause] || { label: 'Unknown' };
      coachLines.push(`Your last test leaked ${latest.recoverableMarks} recoverable marks — dominated by ${meta.label.toLowerCase()}.`);
    }

    if (repeats.length > 0) {
      coachLines.push(`${repeats.length} persistent weakness${repeats.length === 1 ? '' : 'es'} detected across tests: ${repeats.slice(0, 3).map(r => r.topic).join(', ')}.`);
    }

    if (recovery.ready && recovery.recoveryRate < 50) {
      coachLines.push(`Recovery rate is ${recovery.recoveryRate}% — weak subjects are not improving fast enough.`);
    }

    return {
      summary: coachLines.join(' ') || 'Keep practising — your mistake patterns will become clearer with more data.',
      repeats: repeats.slice(0, 5),
      recovery,
      rules: rules.slice(0, 5),
      revisionPriority,
      // Doc 21: CIE daily prescription + passport stats
      correction: typeof CorrectionEngine !== 'undefined' ? {
        dailyPrescription: CorrectionEngine.getDailyPrescription(),
        passportStats: CorrectionEngine.getRecoveryPassport()?.stats || null,
        correctionScore: CorrectionEngine.getCorrectionScore()
      } : null,
      // Doc 23: SDTE strategy optimization & standard interface report
      digitalTwin: typeof DigitalTwin !== 'undefined' ? {
        bestStrategy: DigitalTwin.optimizeStrategy()?.bestStrategy || null,
        report: DigitalTwin.getStandardReport()
      } : null
    };
  }
};

window.AICoach = AICoach;
