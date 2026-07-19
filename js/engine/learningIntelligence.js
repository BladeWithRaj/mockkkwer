// ============================================
// LEARNING INTELLIGENCE ENGINE — Doc 18
// The Brain of Mock24hr.
//
// NO API. NO LLM. Pure computation from
// user's own localStorage history data.
//
// Every insight has a formula.
// Every recommendation has evidence.
// Nothing is hallucinated.
// ============================================

const LearningIntelligence = {

  STORAGE_KEY: 'mtp_intelligence',


  // ═══════════════════════════════════════════
  // §6: STUDENT STATE DETECTION
  // ═══════════════════════════════════════════

  /**
   * Detect student's cognitive state during a test.
   * @param {object} result - TestEngine result object
   * @returns {{ state, confidence, signals[] }}
   */
  detectState(result) {
    if (!result || !result.questionResults) {
      return { state: 'unknown', confidence: 0, signals: [] };
    }

    const qr = result.questionResults;
    const signals = [];
    const total = qr.length;
    if (total < 5) return { state: 'unknown', confidence: 0, signals: [] };

    // Split into halves
    const firstHalf = qr.slice(0, Math.floor(total / 2));
    const lastHalf = qr.slice(Math.floor(total / 2));

    const firstAcc = this._accuracy(firstHalf);
    const lastAcc = this._accuracy(lastHalf);

    // Rapid answers (<5s) = guessing
    const rapidCount = qr.filter(q => q.timeSpent < 5 && !q.isSkipped).length;
    const rapidPct = (rapidCount / total) * 100;

    // Very slow answers (>120s) = overthinking
    const slowCount = qr.filter(q => q.timeSpent > 120).length;

    // Fast + wrong = careless
    const fastWrong = qr.filter(q => q.timeSpent < 15 && !q.isCorrect && !q.isSkipped).length;
    const fastWrongPct = total > 0 ? (fastWrong / total) * 100 : 0;

    // Accuracy consistency (std dev of sliding window)
    const windowAccs = this._slidingWindowAccuracy(qr, 10);
    const accVariance = this._stdDev(windowAccs);

    // Determine state with priority
    let state = 'focused';
    let confidence = 70;

    if (rapidPct > 30) {
      state = 'guessing';
      confidence = 85;
      signals.push(`${rapidCount} questions answered in under 5 seconds (${Math.round(rapidPct)}%)`);
    } else if (firstAcc - lastAcc > 20) {
      state = 'fatigued';
      confidence = 80;
      signals.push(`Accuracy dropped from ${firstAcc}% to ${lastAcc}% in the second half`);
    } else if (fastWrongPct > 20) {
      state = 'careless';
      confidence = 75;
      signals.push(`${fastWrong} fast answers were wrong — indicates rushing`);
    } else if (accVariance > 25) {
      state = 'confused';
      confidence = 65;
      signals.push(`Accuracy varied wildly across the test (±${Math.round(accVariance)}%)`);
    } else if (lastAcc > firstAcc + 10) {
      state = 'improving';
      confidence = 75;
      signals.push(`Started at ${firstAcc}% and improved to ${lastAcc}% — warmed up over time`);
    } else if (result.accuracy > 70 && accVariance < 10) {
      state = 'focused';
      confidence = 85;
      signals.push('Consistent accuracy throughout — strong focus');
    } else if (Math.abs(firstAcc - lastAcc) < 5 && result.accuracy < 50) {
      state = 'plateau';
      confidence = 60;
      signals.push('Accuracy stayed flat but low — needs concept work, not more practice');
    }

    // Additional signals
    if (slowCount > 3) {
      signals.push(`${slowCount} questions took over 2 minutes — possible overthinking`);
    }

    return { state, confidence, signals };
  },


  // ═══════════════════════════════════════════
  // §9: AUTO MISTAKE CLASSIFICATION
  // ═══════════════════════════════════════════

  /**
   * Classify a wrong answer based on timing signals.
   * @param {object} qResult - Single questionResult from TestEngine
   * @param {number} medianTime - Median time for all questions in this test
   * @returns {string} mistake type
   */
  classifyMistake(qResult, medianTime) {
    if (!qResult || qResult.isCorrect || qResult.isSkipped) return null;

    const time = qResult.timeSpent || 0;
    const ratio = medianTime > 0 ? time / medianTime : 1;

    // Very fast + wrong → guess (under 5 seconds)
    if (time < 5) return 'guess';

    // Fast + wrong → careless (under 40% of median time)
    if (ratio < 0.4) return 'careless';

    // Very slow + wrong → concept error (over 2x median)
    if (ratio > 2.0) return 'concept';

    // Slow + wrong → calculation or overthinking (1.3x-2x median)
    if (ratio > 1.3) return 'calculation';

    // Near time limit → time pressure
    if (time < 3 && medianTime > 15) return 'timePressure';

    // Medium speed + wrong → reading error (default)
    return 'reading';
  },

  /**
   * Classify all mistakes in a result and return distribution.
   * @param {object} result - Full test result
   * @returns {{ types: {}, total: number, dominant: string, dominantPct: number }}
   */
  classifyAllMistakes(result) {
    if (!result || !result.questionResults) return { types: {}, total: 0, dominant: null, dominantPct: 0 };

    const wrong = result.questionResults.filter(q => !q.isCorrect && !q.isSkipped);
    if (wrong.length === 0) return { types: {}, total: 0, dominant: null, dominantPct: 0 };

    // Calculate median time
    const times = result.questionResults.filter(q => !q.isSkipped).map(q => q.timeSpent);
    const medianTime = this._median(times);

    const types = {};
    wrong.forEach(q => {
      const type = this.classifyMistake(q, medianTime);
      types[type] = (types[type] || 0) + 1;
    });

    // Find dominant type
    let dominant = null, max = 0;
    Object.entries(types).forEach(([type, count]) => {
      if (count > max) { max = count; dominant = type; }
    });

    return {
      types,
      total: wrong.length,
      dominant,
      dominantPct: wrong.length > 0 ? Math.round((max / wrong.length) * 100) : 0
    };
  },


  // ═══════════════════════════════════════════
  // §10: MISTAKE DNA
  // ═══════════════════════════════════════════

  /**
   * Get cumulative mistake DNA across all subjects.
   * @returns {{ [type]: number (percentage) }}
   */
  getMistakeDNA() {
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    if (!profile || !profile.subjectProfiles) return {};

    const totals = { concept: 0, calculation: 0, reading: 0, guess: 0, timePressure: 0, careless: 0 };

    Object.values(profile.subjectProfiles).forEach(sp => {
      if (sp.mistakeTypes) {
        Object.entries(sp.mistakeTypes).forEach(([type, count]) => {
          if (totals.hasOwnProperty(type)) totals[type] += count;
        });
      }
    });

    const grand = Object.values(totals).reduce((s, v) => s + v, 0);
    if (grand === 0) return {};

    const dna = {};
    Object.entries(totals).forEach(([type, count]) => {
      dna[type] = Math.round((count / grand) * 100);
    });

    return dna;
  },


  // ═══════════════════════════════════════════
  // §11: CONFIDENCE MATRIX
  // ═══════════════════════════════════════════

  /**
   * Analyze confidence calibration from log.
   * @returns {{ overconfident, underconfident, calibrated, total, insights[] }}
   */
  getConfidenceMatrix() {
    const log = typeof Storage !== 'undefined' ? Storage.getConfidenceLog() : [];
    if (log.length === 0) return { overconfident: 0, underconfident: 0, calibrated: 0, total: 0, insights: [] };

    let overconfident = 0, underconfident = 0, calibrated = 0;

    log.forEach(entry => {
      const isConfident = entry.confidence === 'confident';
      const isUnsure = entry.confidence === 'unsure' || entry.confidence === 'guess';

      if (isConfident && !entry.wasCorrect) overconfident++;
      else if (isUnsure && entry.wasCorrect) underconfident++;
      else calibrated++;
    });

    const total = log.length;
    const insights = [];

    const overPct = Math.round((overconfident / total) * 100);
    const underPct = Math.round((underconfident / total) * 100);

    if (overPct > 20) {
      insights.push(`${overPct}% of your confident answers were wrong — this signals concept gaps, not carelessness.`);
    }
    if (underPct > 25) {
      insights.push(`${underPct}% of answers you doubted were actually correct — trust your preparation more.`);
    }
    if (overPct <= 10 && underPct <= 10) {
      insights.push('Your confidence is well-calibrated — you know what you know.');
    }

    return { overconfident, underconfident, calibrated, total, overPct, underPct, insights };
  },


  // ═══════════════════════════════════════════
  // §12: PRESSURE ENGINE
  // ═══════════════════════════════════════════

  /**
   * Analyze pressure performance in a test result.
   * @param {object} result
   * @returns {{ firstHalf, lastHalf, pressureDrop, hasPressureCollapse, insight }}
   */
  analyzePressure(result) {
    if (!result || !result.questionResults || result.questionResults.length < 10) {
      return { firstHalf: 0, lastHalf: 0, pressureDrop: 0, hasPressureCollapse: false, insight: '' };
    }

    const qr = result.questionResults;
    const mid = Math.floor(qr.length / 2);
    const firstHalf = this._accuracy(qr.slice(0, mid));
    const lastHalf = this._accuracy(qr.slice(mid));
    const pressureDrop = firstHalf - lastHalf;
    const hasPressureCollapse = pressureDrop > 15;

    let insight = '';
    if (hasPressureCollapse) {
      insight = `Your accuracy dropped from ${firstHalf}% to ${lastHalf}% in the second half. This is a classic pressure pattern. Practice timed 15-question sections to build stamina.`;
    } else if (pressureDrop > 5) {
      insight = `Slight accuracy dip from ${firstHalf}% to ${lastHalf}% toward the end. Minor fatigue — take a 30-second breather at the halfway mark.`;
    } else if (pressureDrop < -10) {
      insight = `You actually improved from ${firstHalf}% to ${lastHalf}% as the test progressed. You're a slow starter — consider doing 5 warm-up questions before real mocks.`;
    } else {
      insight = `Consistent ${firstHalf}%-${lastHalf}% accuracy throughout. Strong mental stamina.`;
    }

    return { firstHalf, lastHalf, pressureDrop, hasPressureCollapse, insight };
  },


  // ═══════════════════════════════════════════
  // §13: FOCUS SCORE
  // ═══════════════════════════════════════════

  /**
   * Calculate focus score 0-100 from test result.
   * @param {object} result
   * @returns {{ score, rapidGuesses, longPauses, insight }}
   */
  calculateFocusScore(result) {
    if (!result || !result.questionResults) return { score: 50, rapidGuesses: 0, longPauses: 0, insight: '' };

    const qr = result.questionResults.filter(q => !q.isSkipped);
    if (qr.length === 0) return { score: 50, rapidGuesses: 0, longPauses: 0, insight: '' };

    const rapidGuesses = qr.filter(q => q.timeSpent < 5).length;
    const longPauses = qr.filter(q => q.timeSpent > 120).length;
    const totalAnswered = qr.length;

    // Penalties
    const rapidPenalty = Math.min(40, (rapidGuesses / totalAnswered) * 80);
    const pausePenalty = Math.min(20, (longPauses / totalAnswered) * 40);

    // Consistency bonus (low time variance = focused)
    const times = qr.map(q => q.timeSpent);
    const timeStdDev = this._stdDev(times);
    const medianTime = this._median(times);
    const cv = medianTime > 0 ? timeStdDev / medianTime : 1;
    const consistencyBonus = Math.max(0, 20 - cv * 20);

    const score = Math.round(Math.max(0, Math.min(100, 100 - rapidPenalty - pausePenalty + consistencyBonus)));

    let insight = '';
    if (score >= 80) insight = 'Strong focus throughout the test.';
    else if (score >= 60) insight = `Decent focus. ${rapidGuesses > 0 ? `${rapidGuesses} rapid guesses detected.` : ''}`;
    else if (score >= 40) insight = `Focus dropped. ${rapidGuesses} rapid guesses and ${longPauses} long pauses detected. Try the Pomodoro technique.`;
    else insight = `Low focus score. Heavy guessing pattern detected — quality over quantity matters more.`;

    return { score, rapidGuesses, longPauses, insight };
  },


  // ═══════════════════════════════════════════
  // §8: LEARNING VELOCITY
  // ═══════════════════════════════════════════

  /**
   * Compute learning velocity per subject.
   * @returns {Array<{ subject, velocity, trend, currentMastery, prevMastery }>}
   */
  getLearningVelocity() {
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    if (!profile || !profile.subjectProfiles) return [];

    return Object.entries(profile.subjectProfiles)
      .filter(([_, sp]) => sp.accuracyHistory && sp.accuracyHistory.length >= 3)
      .map(([subject, sp]) => {
        const hist = sp.accuracyHistory;
        const recent = hist.slice(-3);
        const older = hist.slice(-6, -3);

        const currentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
        const prevAvg = older.length > 0
          ? older.reduce((s, v) => s + v, 0) / older.length
          : recent[0];

        const velocity = Math.round((currentAvg - prevAvg) * 10) / 10;
        const trend = velocity > 3 ? 'accelerating' :
                      velocity > 0 ? 'improving' :
                      velocity > -3 ? 'stable' :
                      'declining';

        return {
          subject,
          velocity,
          trend,
          currentMastery: Math.round(currentAvg),
          prevMastery: Math.round(prevAvg)
        };
      })
      .sort((a, b) => b.velocity - a.velocity);
  },


  // ═══════════════════════════════════════════
  // §15: FORGETTING CURVE
  // ═══════════════════════════════════════════

  /**
   * Estimate days to forget each subject based on revision intervals.
   * @returns {Array<{ subject, daysToForget, lastRevised, urgency }>}
   */
  getForgettingCurve() {
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    if (!profile || !profile.subjectProfiles) return [];

    const today = new Date().toISOString().slice(0, 10);

    return Object.entries(profile.subjectProfiles)
      .filter(([_, sp]) => sp.attempts >= 3)
      .map(([subject, sp]) => {
        const rs = sp.revisionSchedule || {};

        // Estimate forgetting based on accuracy trend + revision interval
        // Higher accuracy + longer intervals = slower forgetting
        const baseDecay = sp.accuracy >= 80 ? 21 :
                          sp.accuracy >= 60 ? 14 :
                          sp.accuracy >= 40 ? 7 : 3;

        // Revision discipline bonus
        const intervalBonus = (rs.intervalDays || 1) >= 7 ? 7 :
                              (rs.intervalDays || 1) >= 3 ? 3 : 0;

        const daysToForget = baseDecay + intervalBonus;

        // Days since last attempt
        const daysSinceAttempt = sp.lastAttempted
          ? Math.floor((new Date(today) - new Date(sp.lastAttempted)) / 86400000)
          : 999;

        const urgency = daysSinceAttempt >= daysToForget ? 'critical' :
                        daysSinceAttempt >= daysToForget * 0.7 ? 'high' :
                        daysSinceAttempt >= daysToForget * 0.4 ? 'medium' : 'low';

        return {
          subject,
          daysToForget,
          daysSinceAttempt,
          lastRevised: rs.lastRevised || sp.lastAttempted || null,
          urgency
        };
      })
      .sort((a, b) => {
        const urgOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (urgOrder[a.urgency] || 4) - (urgOrder[b.urgency] || 4);
      });
  },


  // ═══════════════════════════════════════════
  // §18: TIME INTELLIGENCE
  // ═══════════════════════════════════════════

  /**
   * Analyze performance by time of day.
   * @returns {{ bestTime, worstTime, timeSlots: { morning, afternoon, evening, night } }}
   */
  getTimeIntelligence() {
    const history = typeof Storage !== 'undefined' ? Storage.getHistory() : [];
    if (history.length < 3) return { bestTime: null, worstTime: null, timeSlots: {} };

    const slots = {
      morning:   { tests: 0, totalAcc: 0, label: 'Morning (6-12)', hours: [6,7,8,9,10,11] },
      afternoon: { tests: 0, totalAcc: 0, label: 'Afternoon (12-17)', hours: [12,13,14,15,16] },
      evening:   { tests: 0, totalAcc: 0, label: 'Evening (17-21)', hours: [17,18,19,20] },
      night:     { tests: 0, totalAcc: 0, label: 'Night (21-6)', hours: [21,22,23,0,1,2,3,4,5] }
    };

    history.forEach(test => {
      if (!test.date || !test.accuracy) return;
      const hour = new Date(test.date).getHours();

      Object.entries(slots).forEach(([key, slot]) => {
        if (slot.hours.includes(hour)) {
          slot.tests++;
          slot.totalAcc += test.accuracy;
        }
      });
    });

    // Calculate averages
    const timeSlots = {};
    Object.entries(slots).forEach(([key, slot]) => {
      if (slot.tests > 0) {
        timeSlots[key] = {
          avgAccuracy: Math.round(slot.totalAcc / slot.tests),
          tests: slot.tests,
          label: slot.label
        };
      }
    });

    // Find best/worst
    let bestTime = null, worstTime = null, bestAcc = -1, worstAcc = 101;
    Object.entries(timeSlots).forEach(([key, data]) => {
      if (data.tests >= 2) {
        if (data.avgAccuracy > bestAcc) { bestAcc = data.avgAccuracy; bestTime = key; }
        if (data.avgAccuracy < worstAcc) { worstAcc = data.avgAccuracy; worstTime = key; }
      }
    });

    return { bestTime, worstTime, timeSlots };
  },


  // ═══════════════════════════════════════════
  // §19: SUBJECT FATIGUE ANALYSIS
  // ═══════════════════════════════════════════

  /**
   * Detect accuracy drop across question positions.
   * @param {object} result
   * @returns {{ fatigueIndex, dropAfterQuestion, insight }}
   */
  analyzeSubjectFatigue(result) {
    if (!result || !result.questionResults || result.questionResults.length < 15) {
      return { fatigueIndex: 0, dropAfterQuestion: null, insight: 'Not enough questions to measure fatigue.' };
    }

    const qr = result.questionResults;
    const windowSize = Math.max(5, Math.floor(qr.length / 5));

    // Sliding window accuracy
    const windows = this._slidingWindowAccuracy(qr, windowSize);
    if (windows.length < 3) return { fatigueIndex: 0, dropAfterQuestion: null, insight: '' };

    // Find biggest drop
    let maxDrop = 0, dropAt = 0;
    for (let i = 1; i < windows.length; i++) {
      const drop = windows[i - 1] - windows[i];
      if (drop > maxDrop) {
        maxDrop = drop;
        dropAt = i * windowSize;
      }
    }

    const fatigueIndex = Math.round(Math.min(100, maxDrop * 2));

    let insight = '';
    if (fatigueIndex > 40) {
      insight = `Significant accuracy drop after question ${dropAt}. Consider breaking long mocks into 2 sessions.`;
    } else if (fatigueIndex > 20) {
      insight = `Mild fatigue detected around question ${dropAt}. A 30-second pause at the halfway mark helps.`;
    } else {
      insight = 'No significant fatigue detected — strong endurance.';
    }

    return { fatigueIndex, dropAfterQuestion: dropAt, insight };
  },


  // ═══════════════════════════════════════════
  // §24: DAILY INTELLIGENCE REPORT
  // ═══════════════════════════════════════════

  /**
   * Generate a full daily intelligence report.
   * Looks like AI-generated. Is actually pure math.
   * @returns {{ sections[], generatedAt, studentState }}
   */
  generateDailyReport() {
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    const history = typeof Storage !== 'undefined' ? Storage.getHistory() : [];
    const streak = typeof DailySystem !== 'undefined' ? DailySystem.getStreak() : { current: 0 };
    const velocity = this.getLearningVelocity();
    const forgetting = this.getForgettingCurve();
    const mistakeDNA = this.getMistakeDNA();
    const confidenceMatrix = this.getConfidenceMatrix();
    const timeIntel = this.getTimeIntelligence();

    const sections = [];

    // ── 1. Learning Summary ──
    const todayTests = history.filter(t => t.date && t.date.slice(0, 10) === new Date().toISOString().slice(0, 10));
    const weekTests = history.filter(t => {
      if (!t.date) return false;
      return (Date.now() - new Date(t.date).getTime()) < 7 * 86400000;
    });

    if (todayTests.length > 0) {
      const avgAcc = Math.round(todayTests.reduce((s, t) => s + (t.accuracy || 0), 0) / todayTests.length);
      sections.push({
        icon: '📊', title: 'Today\'s Summary',
        body: `You completed ${todayTests.length} test${todayTests.length > 1 ? 's' : ''} today with ${avgAcc}% average accuracy. ${weekTests.length} tests this week total.`
      });
    } else {
      sections.push({
        icon: '📊', title: 'Learning Summary',
        body: `${weekTests.length} tests this week. ${history.length} total tests taken. ${streak.current > 0 ? `${streak.current}-day streak active.` : 'Start today to build a streak.'}`
      });
    }

    // ── 2. Biggest Improvement ──
    const improving = velocity.filter(v => v.velocity > 0).sort((a, b) => b.velocity - a.velocity);
    if (improving.length > 0) {
      const top = improving[0];
      sections.push({
        icon: '📈', title: 'Biggest Improvement',
        body: `${top.subject} improved by +${top.velocity} points (${top.prevMastery}% → ${top.currentMastery}%). ${improving.length > 1 ? `Also improving: ${improving.slice(1, 3).map(v => v.subject).join(', ')}.` : 'Keep this momentum going.'}`
      });
    }

    // ── 3. Biggest Concern ──
    const declining = velocity.filter(v => v.velocity < -3).sort((a, b) => a.velocity - b.velocity);
    const critical = forgetting.filter(f => f.urgency === 'critical');

    if (declining.length > 0) {
      const worst = declining[0];
      sections.push({
        icon: '⚠️', title: 'Needs Attention',
        body: `${worst.subject} dropped by ${Math.abs(worst.velocity)} points recently (${worst.prevMastery}% → ${worst.currentMastery}%). A focused 15-question session will reverse this trend.`,
        actionLabel: `Practice ${worst.subject}`,
        actionSubject: worst.subject
      });
    } else if (critical.length > 0) {
      sections.push({
        icon: '⚠️', title: 'Forgetting Risk',
        body: `${critical.map(c => c.subject).join(', ')} ${critical.length === 1 ? 'hasn\'t' : 'haven\'t'} been practiced in ${critical[0].daysSinceAttempt}+ days. Memory fades fast without revision.`,
        actionLabel: `Revise ${critical[0].subject}`,
        actionSubject: critical[0].subject
      });
    }

    // ── 4. Mistake DNA ──
    if (Object.keys(mistakeDNA).length > 0) {
      const sorted = Object.entries(mistakeDNA).sort((a, b) => b[1] - a[1]);
      const top = sorted[0];
      const labels = { concept: 'Concept Errors', calculation: 'Calculation Mistakes', reading: 'Reading Errors', guess: 'Guessing', timePressure: 'Time Pressure', careless: 'Carelessness' };

      sections.push({
        icon: '🧬', title: 'Mistake DNA',
        body: `Your #1 mistake pattern: **${labels[top[0]] || top[0]}** (${top[1]}%). ${this._getMistakeAdvice(top[0])}`
      });
    }

    // ── 5. Confidence Insight ──
    if (confidenceMatrix.total > 10) {
      if (confidenceMatrix.insights.length > 0) {
        sections.push({
          icon: '🎯', title: 'Confidence Check',
          body: confidenceMatrix.insights[0]
        });
      }
    }

    // ── 6. Time Intelligence ──
    if (timeIntel.bestTime && timeIntel.worstTime && timeIntel.bestTime !== timeIntel.worstTime) {
      const best = timeIntel.timeSlots[timeIntel.bestTime];
      const worst = timeIntel.timeSlots[timeIntel.worstTime];
      sections.push({
        icon: '🕐', title: 'Optimal Study Time',
        body: `You perform best in the ${timeIntel.bestTime} (${best.avgAccuracy}% avg) and worst at ${timeIntel.worstTime} (${worst.avgAccuracy}% avg). Schedule important practice in the ${timeIntel.bestTime}.`
      });
    }

    // ── 7. Tomorrow's Mission ──
    const focus = typeof RecommendationEngine !== 'undefined' ? RecommendationEngine.getDailyFocus() : null;
    if (focus && focus.subject !== 'General') {
      sections.push({
        icon: '🎯', title: 'Tomorrow\'s Focus',
        body: `Priority: ${focus.subject}. ${focus.reason}`,
        actionLabel: `Start ${focus.subject} Practice`,
        actionSubject: focus.subject
      });
    }

    return {
      sections,
      generatedAt: new Date().toISOString(),
      testsAnalyzed: history.length,
      dataPoints: profile ? profile.totalQuestionsAnswered : 0
    };
  },


  // ═══════════════════════════════════════════
  // PROCESS RESULT (called after every test)
  // ═══════════════════════════════════════════

  /**
   * Process a test result and auto-classify mistakes.
   * Called from test.js after submitTest().
   * @param {object} result
   */
  processResult(result) {
    if (!result || !result.questionResults) return;

    // 1. Auto-classify all mistakes
    const classification = this.classifyAllMistakes(result);

    // 2. Record classified mistakes into LearningProfile
    if (typeof LearningProfile !== 'undefined' && classification.total > 0) {
      result.questionResults.forEach(qr => {
        if (!qr.isCorrect && !qr.isSkipped && qr.question) {
          const medianTime = this._median(
            result.questionResults.filter(q => !q.isSkipped).map(q => q.timeSpent)
          );
          const type = this.classifyMistake(qr, medianTime);
          if (type) {
            LearningProfile.recordMistakeType(qr.question.id, type, qr.question.subject);
          }
        }
      });
    }

    // 3. Store intelligence snapshot
    this._saveSnapshot(result, classification);
  },

  /** Save intelligence snapshot for this test */
  _saveSnapshot(result, classification) {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : { snapshots: [] };

      data.snapshots.push({
        date: new Date().toISOString(),
        accuracy: result.accuracy,
        state: this.detectState(result).state,
        focusScore: this.calculateFocusScore(result).score,
        pressure: this.analyzePressure(result),
        mistakeTypes: classification.types,
        dominantMistake: classification.dominant
      });

      // Keep last 30 snapshots
      if (data.snapshots.length > 30) data.snapshots = data.snapshots.slice(-30);

      // Persist snapshots first so genome/weekly recompute against fresh data
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

      // Cache long-term genome + weekly report (recomputed from the updated data)
      data.genome = this.getGenome();
      data.weeklyReport = this.generateWeeklyReport();
      data.updatedAt = new Date().toISOString();

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[LearningIntelligence] Snapshot save error:', e.message);
    }
  },


  // ═══════════════════════════════════════════
  // FULL ANALYSIS (for Result Page)
  // ═══════════════════════════════════════════

  /**
   * Get complete intelligence analysis for a test result.
   * This is what powers the "AI-looking" result page.
   * @param {object} result
   * @returns {object} Full analysis with all engines
   */
  getFullAnalysis(result) {
    return {
      state: this.detectState(result),
      pressure: this.analyzePressure(result),
      focus: this.calculateFocusScore(result),
      mistakes: this.classifyAllMistakes(result),
      fatigue: this.analyzeSubjectFatigue(result),
      mistakeDNA: this.getMistakeDNA(),
      velocity: this.getLearningVelocity(),
      confidence: this.getConfidenceMatrix(),
      forgetting: this.getForgettingCurve(),
      timeIntel: this.getTimeIntelligence()
    };
  },


  // ═══════════════════════════════════════════
  // §26: LEARNING GENOME
  // Long-term profile — dozens of evolving 0-100 indicators.
  // Aggregates existing sub-engines; nothing hallucinated.
  // ═══════════════════════════════════════════

  /**
   * Build the student's Learning Genome — a persistent, ever-richer profile.
   * @returns {{ indicators: Array<{key,label,score,evidence}>, overall:number, dataPoints:number }}
   */
  getGenome() {
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    const subjectProfiles = profile?.subjectProfiles || {};
    const sps = Object.values(subjectProfiles).filter(sp => sp.attempts > 0);
    const snapshots = this._getSnapshots();

    // Not enough data yet — return an explicit empty genome
    if (sps.length === 0 && snapshots.length === 0) {
      return { indicators: [], overall: 0, dataPoints: 0, ready: false };
    }

    const velocity   = this.getLearningVelocity();
    const forgetting = this.getForgettingCurve();
    const dna        = this.getMistakeDNA();
    const confMatrix = this.getConfidenceMatrix();
    const timeIntel  = this.getTimeIntelligence();

    // ── 1. Accuracy — mean subject accuracy weighted by attempts ──
    const totAttempts = sps.reduce((s, sp) => s + sp.attempts, 0);
    const accuracy = totAttempts > 0
      ? Math.round(sps.reduce((s, sp) => s + sp.accuracy * sp.attempts, 0) / totAttempts)
      : 0;

    // ── 2. Speed — faster than 90s/q = better, cap at 120s ──
    const speeds = sps.map(sp => sp.avgSpeed).filter(v => v > 0);
    const avgSpeed = speeds.length ? speeds.reduce((s, v) => s + v, 0) / speeds.length : 0;
    const speed = avgSpeed > 0 ? this._clamp(Math.round(120 - avgSpeed)) : 50;

    // ── 3. Confidence calibration — low overconfidence = high score ──
    const confidence = confMatrix.total > 0 ? this._clamp(100 - (confMatrix.overPct || 0) * 2) : 50;

    // ── 4. Memory stability — fewer critical-forgetting subjects = higher ──
    const criticalCount = forgetting.filter(f => f.urgency === 'critical' || f.urgency === 'high').length;
    const memoryStability = forgetting.length > 0
      ? this._clamp(Math.round(100 - (criticalCount / forgetting.length) * 100))
      : 50;

    // ── 5. Revision discipline — longer spaced intervals = disciplined ──
    const intervals = sps.map(sp => sp.revisionSchedule?.intervalDays || 1);
    const avgInterval = intervals.length ? intervals.reduce((s, v) => s + v, 0) / intervals.length : 1;
    const revisionDiscipline = this._clamp(Math.round((Math.min(avgInterval, 30) / 30) * 100));

    // ── 6. Pressure tolerance — from snapshot pressure drops ──
    const drops = snapshots.map(s => s.pressure?.pressureDrop).filter(v => typeof v === 'number');
    const avgDrop = drops.length ? drops.reduce((s, v) => s + v, 0) / drops.length : 0;
    const pressureTolerance = drops.length ? this._clamp(Math.round(100 - avgDrop * 3)) : 50;

    // ── 7. Focus — mean of recorded focus scores ──
    const focusScores = snapshots.map(s => s.focusScore).filter(v => typeof v === 'number');
    const focus = focusScores.length
      ? Math.round(focusScores.reduce((s, v) => s + v, 0) / focusScores.length)
      : 50;

    // ── 8. Carelessness (inverted → "care") — from mistake DNA ──
    const carelessShare = (dna.careless || 0) + (dna.guess || 0);
    const care = this._clamp(100 - carelessShare);

    // ── 9. Learning velocity — normalized around 0 (±10 pts → 0-100) ──
    const avgVel = velocity.length
      ? velocity.reduce((s, v) => s + v.velocity, 0) / velocity.length
      : 0;
    const velocityScore = this._clamp(Math.round(50 + avgVel * 5));

    // ── 10. Improvement rate — overall trend flag ──
    const improvementRate = profile?.overallTrend === 'up' ? 80 :
                            profile?.overallTrend === 'down' ? 30 : 55;

    // ── 11. Topic coverage — subjects practiced (8 = full breadth) ──
    const topicCoverage = this._clamp(Math.round((sps.length / 8) * 100));

    // ── 12. Consistency — low variance across accuracy history ──
    const allHist = sps.flatMap(sp => (sp.accuracyHistory || []).slice(-5));
    const consistency = allHist.length >= 3
      ? this._clamp(Math.round((1 - this._stdDev(allHist) / 50) * 100))
      : 50;

    // ── 13. Endurance (inverse fatigue) — from snapshot pressure collapse ──
    const collapses = snapshots.filter(s => s.pressure?.hasPressureCollapse).length;
    const endurance = snapshots.length
      ? this._clamp(Math.round(100 - (collapses / snapshots.length) * 100))
      : 50;

    // ── 14. Time optimization — how much better the best slot is ──
    let timeOptimization = 50;
    if (timeIntel.bestTime && timeIntel.timeSlots[timeIntel.bestTime]) {
      timeOptimization = this._clamp(timeIntel.timeSlots[timeIntel.bestTime].avgAccuracy);
    }

    const indicators = [
      { key: 'accuracy',          label: 'Accuracy',           score: accuracy,          evidence: `${accuracy}% across ${sps.length} subjects` },
      { key: 'speed',             label: 'Speed',              score: speed,             evidence: avgSpeed > 0 ? `${Math.round(avgSpeed)}s per question avg` : 'Not enough timing data' },
      { key: 'confidence',        label: 'Confidence',         score: confidence,        evidence: confMatrix.total > 0 ? `${confMatrix.overPct || 0}% overconfident answers` : 'Rate confidence in tests to unlock' },
      { key: 'memoryStability',   label: 'Memory Stability',   score: memoryStability,   evidence: `${criticalCount} subject${criticalCount!==1?'s':''} at forgetting risk` },
      { key: 'revisionDiscipline',label: 'Revision Discipline',score: revisionDiscipline,evidence: `${avgInterval.toFixed(1)}-day avg revision interval` },
      { key: 'pressureTolerance', label: 'Pressure Tolerance', score: pressureTolerance, evidence: drops.length ? `${avgDrop > 0 ? '-' : '+'}${Math.abs(Math.round(avgDrop))}% 2nd-half shift` : 'Take a 10+ question mock' },
      { key: 'focus',             label: 'Focus',              score: focus,             evidence: focusScores.length ? `${focusScores.length} tests measured` : 'Take a test to measure' },
      { key: 'care',              label: 'Carefulness',        score: care,              evidence: carelessShare > 0 ? `${carelessShare}% careless/guess mistakes` : 'Few careless errors' },
      { key: 'velocity',          label: 'Learning Velocity',  score: velocityScore,     evidence: velocity.length ? `${avgVel >= 0 ? '+' : ''}${avgVel.toFixed(1)} pts recent trend` : 'Needs 3+ tests per subject' },
      { key: 'improvementRate',   label: 'Improvement Rate',   score: improvementRate,   evidence: `Overall trend: ${profile?.overallTrend || 'stable'}` },
      { key: 'topicCoverage',     label: 'Topic Coverage',     score: topicCoverage,     evidence: `${sps.length} of ~8 core subjects practiced` },
      { key: 'consistency',       label: 'Consistency',        score: consistency,       evidence: allHist.length >= 3 ? `±${Math.round(this._stdDev(allHist))}% accuracy swing` : 'Needs more history' },
      { key: 'endurance',         label: 'Endurance',          score: endurance,         evidence: snapshots.length ? `${collapses} pressure collapse${collapses!==1?'s':''}` : 'Take a full mock' },
      { key: 'timeOptimization',  label: 'Time-of-Day',        score: timeOptimization,  evidence: timeIntel.bestTime ? `Best in the ${timeIntel.bestTime}` : 'Take tests at different times' }
    ];

    const overall = Math.round(indicators.reduce((s, i) => s + i.score, 0) / indicators.length);

    return {
      indicators,
      overall,
      dataPoints: profile?.totalQuestionsAnswered || 0,
      testsAnalyzed: snapshots.length,
      ready: true
    };
  },


  // ═══════════════════════════════════════════
  // §14: MEMORY ENGINE
  // Per-subject Learned → Revised → Forgotten → Recovered state.
  // ═══════════════════════════════════════════

  /**
   * Estimate the memory state of each practiced subject.
   * @returns {Array<{ subject, state, accuracy, daysSinceAttempt, retention }>}
   */
  getMemoryState() {
    const forgetting = this.getForgettingCurve();
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    if (!profile?.subjectProfiles) return [];

    return forgetting.map(f => {
      const sp = profile.subjectProfiles[f.subject] || {};
      const rs = sp.revisionSchedule || {};
      const hasRevised = !!rs.lastRevised && (rs.intervalDays || 1) > 1;

      // Retention estimate: decays from 100 as daysSinceAttempt → daysToForget
      const retention = f.daysToForget > 0
        ? this._clamp(Math.round(100 - (f.daysSinceAttempt / f.daysToForget) * 100))
        : 50;

      let state;
      if (f.urgency === 'critical') state = 'forgotten';
      else if (f.urgency === 'high') state = hasRevised ? 'recovered' : 'forgetting';
      else if (hasRevised) state = 'revised';
      else state = 'learned';

      return {
        subject: f.subject,
        state,
        accuracy: sp.accuracy || 0,
        daysSinceAttempt: f.daysSinceAttempt,
        daysToForget: f.daysToForget,
        retention
      };
    });
  },


  // ═══════════════════════════════════════════
  // §17: LEARNING STYLE DETECTION
  // Behavioural, not personality. Drives study recommendations.
  // ═══════════════════════════════════════════

  /**
   * Classify the student's learning behaviour from speed/accuracy/confidence.
   * @returns {{ style, label, description, evidence[] }}
   */
  getLearningStyle() {
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    const sps = profile?.subjectProfiles ? Object.values(profile.subjectProfiles).filter(sp => sp.attempts >= 3) : [];
    const snapshots = this._getSnapshots();

    if (sps.length === 0) {
      return { style: 'unknown', label: 'Building Profile', description: 'Complete a few more tests to reveal your learning style.', evidence: [] };
    }

    const totAttempts = sps.reduce((s, sp) => s + sp.attempts, 0);
    const accuracy = Math.round(sps.reduce((s, sp) => s + sp.accuracy * sp.attempts, 0) / totAttempts);
    const speeds = sps.map(sp => sp.avgSpeed).filter(v => v > 0);
    const avgSpeed = speeds.length ? speeds.reduce((s, v) => s + v, 0) / speeds.length : 60;
    const isFast = avgSpeed > 0 && avgSpeed < 45;
    const isAccurate = accuracy >= 65;

    const confMatrix = this.getConfidenceMatrix();
    const dna = this.getMistakeDNA();
    const guessShare = (dna.guess || 0) + (dna.careless || 0);
    const revisionHeavy = sps.filter(sp => (sp.revisionSchedule?.intervalDays || 1) > 3).length >= Math.ceil(sps.length / 2);

    const evidence = [
      `${accuracy}% overall accuracy`,
      avgSpeed > 0 ? `${Math.round(avgSpeed)}s per question` : 'timing still being learned'
    ];

    let style, label, description;
    if (guessShare > 35) {
      style = 'fast_guesser';   label = 'Fast Guesser';
      description = 'You move quickly but lean on guessing. Slow down on unfamiliar questions and skip rather than gamble against negative marking.';
      evidence.push(`${guessShare}% guess/careless mistakes`);
    } else if (isFast && isAccurate) {
      style = 'fast_accurate';  label = 'Fast & Accurate';
      description = 'You answer quickly and correctly — an exam-ready profile. Use saved time to double-check flagged questions.';
    } else if (!isFast && isAccurate) {
      style = 'slow_thinker';   label = 'Slow & Accurate';
      description = 'You are accurate but deliberate. Practise timed speed drills so accuracy translates into a completed paper.';
    } else if (revisionHeavy) {
      style = 'revision_driven'; label = 'Revision-Driven';
      description = 'Your gains come from disciplined revision. Keep the spaced-repetition rhythm and layer in fresh mocks for breadth.';
      evidence.push('consistent spaced-revision intervals');
    } else if (confMatrix.underPct > 25) {
      style = 'underconfident';  label = 'Underconfident';
      description = 'You doubt correct answers often. Trust your preparation — review the "doubted-but-correct" pattern to build conviction.';
      evidence.push(`${confMatrix.underPct}% doubted-but-correct`);
    } else {
      style = 'developing';      label = 'Developing All-Rounder';
      description = 'No single pattern dominates yet. Keep a balanced mix of practice, revision, and full mocks to sharpen a strength.';
    }

    return { style, label, description, evidence };
  },


  // ═══════════════════════════════════════════
  // §22: PREDICTION ENGINE
  // Every prediction carries a confidence level.
  // ═══════════════════════════════════════════

  /**
   * Forward-looking predictions derived from history variance.
   * @returns {{ scoreRange, weakForecast, streakRisk, completionProbability }}
   */
  getPredictions() {
    const history = typeof Storage !== 'undefined' ? Storage.getHistory() : [];
    const streak  = typeof DailySystem !== 'undefined' ? DailySystem.getStreak() : { current: 0 };

    // ── Expected score range (mean ± std dev of recent accuracy) ──
    const recentAcc = history.slice(0, 8).map(t => t.accuracy).filter(v => typeof v === 'number');
    let scoreRange = null;
    if (recentAcc.length >= 3) {
      const mean = recentAcc.reduce((s, v) => s + v, 0) / recentAcc.length;
      const sd = this._stdDev(recentAcc);
      scoreRange = {
        low:  this._clamp(Math.round(mean - sd)),
        high: this._clamp(Math.round(mean + sd)),
        expected: Math.round(mean),
        confidence: this._confidenceLevel(recentAcc.length, sd)
      };
    }

    // ── Weak-topic forecast (which subjects will still be weak) ──
    const weakForecast = (typeof RecommendationEngine !== 'undefined'
      ? RecommendationEngine.getWeakTopics(3)
      : []).map(t => ({
        subject: t.subject,
        accuracy: t.accuracy,
        // Improving trend lowers the risk it stays weak
        risk: t.trend === 'up' ? 'easing' : t.trend === 'down' ? 'worsening' : 'persistent'
      }));

    // ── Streak-break risk ──
    const hasDoneToday = typeof DailySystem !== 'undefined' ? DailySystem.hasDoneToday() : false;
    let streakRisk = null;
    if ((streak.current || 0) > 0) {
      const risk = hasDoneToday ? 'low' : streak.current >= 7 ? 'high' : 'medium';
      streakRisk = {
        current: streak.current,
        risk,
        message: hasDoneToday
          ? `Today is logged — your ${streak.current}-day streak is safe.`
          : `Practise today to protect your ${streak.current}-day streak.`,
        confidence: 'high'
      };
    }

    // ── Mock completion probability (from focus + endurance history) ──
    const snapshots = this._getSnapshots();
    const collapses = snapshots.filter(s => s.pressure?.hasPressureCollapse).length;
    const focusAvg = snapshots.length
      ? snapshots.map(s => s.focusScore || 50).reduce((s, v) => s + v, 0) / snapshots.length
      : 50;
    const completionProbability = snapshots.length >= 2 ? {
      probability: this._clamp(Math.round(focusAvg - (collapses / snapshots.length) * 30)),
      confidence: this._confidenceLevel(snapshots.length, 0)
    } : null;

    return { scoreRange, weakForecast, streakRisk, completionProbability };
  },


  // ═══════════════════════════════════════════
  // §25: WEEKLY INTELLIGENCE REPORT
  // ═══════════════════════════════════════════

  /**
   * Generate a weekly report: velocity, mastery shift, mistake-DNA, readiness.
   * @returns {{ sections[], generatedAt, testsThisWeek }}
   */
  generateWeeklyReport() {
    const history = typeof Storage !== 'undefined' ? Storage.getHistory() : [];
    const weekTests = history.filter(t => t.date && (Date.now() - new Date(t.date).getTime()) < 7 * 86400000);
    const velocity = this.getLearningVelocity();
    const genome = this.getGenome();
    const style = this.getLearningStyle();
    const predictions = this.getPredictions();
    const readiness = typeof RecommendationEngine !== 'undefined' ? RecommendationEngine.getReadiness() : null;

    const sections = [];

    // 1. Week at a glance
    const weekAcc = weekTests.length
      ? Math.round(weekTests.reduce((s, t) => s + (t.accuracy || 0), 0) / weekTests.length)
      : 0;
    sections.push({
      icon: '🗓️', title: 'Week at a Glance',
      body: weekTests.length > 0
        ? `${weekTests.length} test${weekTests.length > 1 ? 's' : ''} this week at ${weekAcc}% average accuracy.`
        : 'No tests logged this week yet. A single mock unlocks your weekly intelligence.'
    });

    // 2. Learning velocity
    const accelerating = velocity.filter(v => v.velocity > 0).sort((a, b) => b.velocity - a.velocity);
    const slowing = velocity.filter(v => v.velocity < -3).sort((a, b) => a.velocity - b.velocity);
    if (accelerating.length || slowing.length) {
      const up = accelerating.slice(0, 2).map(v => `${v.subject} (+${v.velocity})`).join(', ');
      const down = slowing.slice(0, 2).map(v => `${v.subject} (${v.velocity})`).join(', ');
      sections.push({
        icon: '⚡', title: 'Learning Velocity',
        body: [up && `Rising: ${up}.`, down && `Slipping: ${down}.`].filter(Boolean).join(' ')
      });
    }

    // 3. Mastery / genome snapshot
    if (genome.ready) {
      const top = [...genome.indicators].sort((a, b) => b.score - a.score)[0];
      const low = [...genome.indicators].sort((a, b) => a.score - b.score)[0];
      sections.push({
        icon: '🧬', title: 'Learning Genome',
        body: `Overall genome strength ${genome.overall}/100. Strongest trait: ${top.label} (${top.score}). Focus area: ${low.label} (${low.score}).`
      });
    }

    // 4. Learning style
    if (style.style !== 'unknown') {
      sections.push({ icon: '🎓', title: `Style: ${style.label}`, body: style.description });
    }

    // 5. Predicted readiness
    if (readiness) {
      sections.push({
        icon: '🎯', title: 'Predicted Readiness',
        body: `${readiness.overall}/100 — ${readiness.level}.${predictions.scoreRange ? ` Expected next-mock score ${predictions.scoreRange.low}–${predictions.scoreRange.high}% (${predictions.scoreRange.confidence} confidence).` : ''}`
      });
    }

    return {
      sections,
      generatedAt: new Date().toISOString(),
      testsThisWeek: weekTests.length
    };
  },


  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  _accuracy(questionResults) {
    const answered = questionResults.filter(q => !q.isSkipped);
    if (answered.length === 0) return 0;
    const correct = answered.filter(q => q.isCorrect).length;
    return Math.round((correct / answered.length) * 100);
  },

  _median(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  /** Clamp a number to the 0-100 range. */
  _clamp(n) {
    return Math.max(0, Math.min(100, Math.round(n)));
  },

  /** Confidence label from sample size + variance. More data / less noise = higher. */
  _confidenceLevel(sampleSize, stdDev) {
    if (sampleSize >= 6 && stdDev < 15) return 'high';
    if (sampleSize >= 4) return 'medium';
    return 'low';
  },

  /** Read persisted intelligence snapshots (safe). */
  _getSnapshots() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      return Array.isArray(data?.snapshots) ? data.snapshots : [];
    } catch (e) {
      return [];
    }
  },

  _stdDev(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  },

  _slidingWindowAccuracy(questionResults, windowSize) {
    const accs = [];
    for (let i = 0; i <= questionResults.length - windowSize; i += Math.floor(windowSize / 2)) {
      const window = questionResults.slice(i, i + windowSize);
      accs.push(this._accuracy(window));
    }
    return accs;
  },

  _getMistakeAdvice(type) {
    const advice = {
      concept: 'Review the underlying theory before practicing more questions.',
      calculation: 'Slow down on numerical questions and double-check your math.',
      reading: 'Read the full question before looking at options. Underline key words.',
      guess: 'Skip confidently rather than guessing — negative marking costs more.',
      timePressure: 'Practice speed drills: 10 questions in 8 minutes.',
      careless: 'Use the last 5 minutes to review flagged and fast answers.'
    };
    return advice[type] || 'Review your wrong answers carefully.';
  },

  // ═══════════════════════════════════════════
  // Doc 23: COMMON ENGINE INTERFACE (IESCP)
  // ═══════════════════════════════════════════
  getStandardReport() {
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    if (!profile) {
      return {
        engineName: 'LearningIntelligence',
        input: 'No data',
        evidence: 'No learning profile initialized.',
        score: 0,
        confidence: 'low',
        prediction: 'Requires mock test completions.',
        recommendation: 'Start first mock test.',
        expectedOutcome: 'Initialization of cognitive state.',
        actualOutcome: 'Awaiting mock.',
        selfEvaluation: 'No history.'
      };
    }

    const weakRank = typeof LearningProfile !== 'undefined' ? LearningProfile.getWeaknessRanking() : [];
    const topWeak = weakRank[0] ? weakRank[0].subject : 'None';
    
    return {
      engineName: 'LearningIntelligence',
      input: `Learning profile with ${profile.totalTestsTaken || 0} tests taken and ${profile.totalQuestionsAnswered || 0} questions answered.`,
      evidence: `Weakest subject: ${profile.weakestSubject || 'Unknown'}, Strongest subject: ${profile.strongestSubject || 'Unknown'}`,
      score: profile.totalTestsTaken > 0 ? Math.round(profile.totalQuestionsAnswered / Math.max(1, profile.totalTestsTaken)) : 0,
      confidence: profile.totalTestsTaken >= 5 ? 'high' : profile.totalTestsTaken >= 2 ? 'medium' : 'low',
      prediction: `Student trend is estimated to be ${profile.overallTrend || 'stable'}.`,
      recommendation: topWeak !== 'None' ? `Revise concepts and attempt drills in ${topWeak}.` : 'Maintain current testing frequency.',
      expectedOutcome: topWeak !== 'None' ? `Expected to recover accuracy in ${topWeak} to above 60%.` : 'Maintain stable performance.',
      actualOutcome: 'Self-evaluation tracking active in localStorage.',
      selfEvaluation: 'Accuracy of cognitive state predictions is evaluated against test session results.'
    };
  }
};

window.LearningIntelligence = LearningIntelligence;
