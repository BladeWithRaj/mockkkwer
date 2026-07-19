// ============================================
// COGNITIVE BEHAVIOUR ENGINE — Doc 19
// Understanding How Students Think, Not Just
// What They Score.
//
// Extends LearningIntelligence (Doc 18) with:
//   - Decision classification (9 types)
//   - Risk profiling
//   - Recovery detection
//   - Panic detection
//   - Attention drift (5-question windows)
//   - Behaviour Score (composite 0-100)
//   - Behaviour DNA (natural language traits)
//   - Behaviour prediction
//
// NO API. NO LLM. Pure computation.
// Every conclusion includes evidence.
// ============================================

const BehaviourEngine = {

  STORAGE_KEY: 'mtp_behaviour',


  // ═══════════════════════════════════════════
  // §3: DECISION ENGINE
  // 9 decision types per answer
  // ═══════════════════════════════════════════

  DECISION_TYPES: {
    CONFIDENT_CORRECT:   'confident_correct',
    LUCKY_GUESS:         'lucky_guess',
    EDUCATED_GUESS:      'educated_guess',
    RANDOM_GUESS:        'random_guess',
    CARELESS_ERROR:      'careless_error',
    KNOWLEDGE_ERROR:     'knowledge_error',
    TIME_PRESSURE_ERROR: 'time_pressure_error',
    PANIC_SKIP:          'panic_skip',
    RECOVERED_ANSWER:    'recovered_answer'
  },

  /**
   * Classify every answer into a decision type.
   * @param {object} result - TestEngine result
   * @returns {Array<{ index, decision, evidence }>}
   */
  classifyDecisions(result) {
    if (!result || !result.questionResults) return [];

    const qr = result.questionResults;
    const times = qr.filter(q => !q.isSkipped).map(q => q.timeSpent);
    const medianTime = this._median(times);
    const avgTime = times.length > 0 ? times.reduce((s, v) => s + v, 0) / times.length : 30;

    // Track consecutive wrong for recovery detection
    let consecutiveWrong = 0;

    return qr.map((q, idx) => {
      const t = q.timeSpent || 0;
      const ratio = medianTime > 0 ? t / medianTime : 1;
      let decision, evidence;

      if (q.isSkipped) {
        // Skipped — was it panic or strategic?
        if (t < 3) {
          decision = this.DECISION_TYPES.PANIC_SKIP;
          evidence = `Skipped in ${t}s without reading — panic response`;
        } else {
          decision = this.DECISION_TYPES.PANIC_SKIP;
          evidence = `Skipped after ${t}s — strategic skip or unsure`;
        }
        consecutiveWrong++;
      } else if (q.isCorrect) {
        if (consecutiveWrong >= 3) {
          decision = this.DECISION_TYPES.RECOVERED_ANSWER;
          evidence = `Correct after ${consecutiveWrong} consecutive wrong — recovery`;
          consecutiveWrong = 0;
        } else if (t < 5) {
          decision = this.DECISION_TYPES.LUCKY_GUESS;
          evidence = `Correct in only ${t}s — likely lucky guess`;
        } else if (ratio < 0.5 && t < 10) {
          decision = this.DECISION_TYPES.EDUCATED_GUESS;
          evidence = `Correct in ${t}s (${Math.round(ratio * 100)}% of median) — fast but correct`;
        } else {
          decision = this.DECISION_TYPES.CONFIDENT_CORRECT;
          evidence = `Correct in ${t}s — confident knowledge`;
        }
        consecutiveWrong = 0;
      } else {
        // Wrong answer
        consecutiveWrong++;

        if (t < 5) {
          decision = this.DECISION_TYPES.RANDOM_GUESS;
          evidence = `Wrong in ${t}s — random guess`;
        } else if (ratio < 0.4) {
          decision = this.DECISION_TYPES.CARELESS_ERROR;
          evidence = `Wrong in ${t}s (very fast) — likely carelessness`;
        } else if (ratio > 2.0) {
          decision = this.DECISION_TYPES.KNOWLEDGE_ERROR;
          evidence = `Wrong after ${t}s of thinking — concept gap`;
        } else if (idx > qr.length * 0.7 && t < avgTime * 0.6) {
          decision = this.DECISION_TYPES.TIME_PRESSURE_ERROR;
          evidence = `Wrong in last 30% of test, rushed (${t}s) — time pressure`;
        } else if (ratio < 0.6) {
          decision = this.DECISION_TYPES.CARELESS_ERROR;
          evidence = `Wrong at ${Math.round(ratio * 100)}% of median speed — rushed`;
        } else {
          decision = this.DECISION_TYPES.KNOWLEDGE_ERROR;
          evidence = `Wrong after ${t}s — needs concept review`;
        }
      }

      return { index: idx, decision, evidence, timeSpent: t, isCorrect: q.isCorrect, isSkipped: q.isSkipped };
    });
  },

  /**
   * Get decision type distribution from classified decisions.
   * @param {Array} decisions - from classifyDecisions()
   * @returns {{ [type]: { count, pct } }}
   */
  getDecisionDistribution(decisions) {
    if (!decisions || decisions.length === 0) return {};

    const dist = {};
    const total = decisions.length;

    decisions.forEach(d => {
      if (!dist[d.decision]) dist[d.decision] = { count: 0, pct: 0 };
      dist[d.decision].count++;
    });

    Object.keys(dist).forEach(type => {
      dist[type].pct = Math.round((dist[type].count / total) * 100);
    });

    return dist;
  },


  // ═══════════════════════════════════════════
  // §7: RISK BEHAVIOUR
  // ═══════════════════════════════════════════

  /**
   * Calculate risk profile from test result.
   * @param {object} result
   * @returns {{ riskIndex, skipRate, guessRate, negativeImpact, riskType, insight }}
   */
  analyzeRisk(result) {
    if (!result || !result.questionResults) {
      return { riskIndex: 0, skipRate: 0, guessRate: 0, negativeImpact: 0, riskType: 'unknown', insight: '' };
    }

    const total = result.totalQuestions || result.questionResults.length;
    const skipped = result.skipped || 0;
    const wrong = result.wrong || 0;

    // Skip rate (0-100)
    const skipRate = Math.round((skipped / total) * 100);

    // Guess rate: fast wrong answers (<8s)
    const fastWrong = result.questionResults.filter(q => !q.isCorrect && !q.isSkipped && q.timeSpent < 8).length;
    const guessRate = total > 0 ? Math.round((fastWrong / total) * 100) : 0;

    // Negative marking impact
    const negativeImpact = result.negativeDeduction || 0;
    const negPct = result.maxMarks > 0 ? Math.round((negativeImpact / result.maxMarks) * 100) : 0;

    // Risk index (0-100) — higher = more aggressive
    const riskIndex = Math.round(
      (100 - skipRate) * 0.3 +      // Attempting everything = risky
      guessRate * 0.35 +             // Guessing = risky
      negPct * 0.35                  // Losing to negative = risky
    );

    // Risk type
    const riskType = riskIndex >= 70 ? 'very_aggressive' :
                     riskIndex >= 50 ? 'aggressive' :
                     riskIndex >= 30 ? 'balanced' : 'safe';

    const riskLabels = { very_aggressive: 'Very Aggressive', aggressive: 'Aggressive', balanced: 'Balanced', safe: 'Safe' };

    let insight = '';
    if (riskType === 'very_aggressive') {
      insight = `Risk Index ${riskIndex}/100 — Very Aggressive. You attempt almost everything but ${fastWrong} were fast guesses. Skip uncertain ones to protect your score.`;
    } else if (riskType === 'aggressive') {
      insight = `Risk Index ${riskIndex}/100 — Aggressive. ${negativeImpact > 0 ? `You lost ${negativeImpact} marks to negative marking.` : ''} Consider strategic skipping.`;
    } else if (riskType === 'safe') {
      insight = `Risk Index ${riskIndex}/100 — Safe. You skipped ${skipped} questions. Try attempting more — even educated guesses boost scores.`;
    } else {
      insight = `Risk Index ${riskIndex}/100 — Balanced. Good risk management.`;
    }

    return { riskIndex, skipRate, guessRate, negativeImpact, negPct, riskType, riskLabel: riskLabels[riskType], insight };
  },


  // ═══════════════════════════════════════════
  // §8: ATTENTION DRIFT (5-question windows)
  // ═══════════════════════════════════════════

  /**
   * Analyze attention drift in 5-question windows.
   * @param {object} result
   * @returns {{ windows[], driftDetected, collapseAt, insight }}
   */
  analyzeAttentionDrift(result) {
    if (!result || !result.questionResults || result.questionResults.length < 10) {
      return { windows: [], driftDetected: false, collapseAt: null, insight: '' };
    }

    const qr = result.questionResults;
    const windowSize = 5;
    const windows = [];

    for (let i = 0; i <= qr.length - windowSize; i += windowSize) {
      const window = qr.slice(i, i + windowSize);
      const answered = window.filter(q => !q.isSkipped);
      const correct = answered.filter(q => q.isCorrect).length;
      const acc = answered.length > 0 ? Math.round((correct / answered.length) * 100) : 0;
      const avgTime = answered.length > 0
        ? Math.round(answered.reduce((s, q) => s + q.timeSpent, 0) / answered.length)
        : 0;

      windows.push({
        range: `${i + 1}–${Math.min(i + windowSize, qr.length)}`,
        accuracy: acc,
        avgTime,
        questions: answered.length
      });
    }

    // Detect collapse: >20% drop from best window
    let bestAcc = 0, collapseAt = null, driftDetected = false;
    windows.forEach((w, idx) => {
      if (w.accuracy > bestAcc) bestAcc = w.accuracy;
      if (idx > 0 && bestAcc - w.accuracy > 20 && !collapseAt) {
        collapseAt = w.range;
        driftDetected = true;
      }
    });

    let insight = '';
    if (driftDetected) {
      insight = `Focus collapsed at questions ${collapseAt}. Accuracy dropped from ${bestAcc}% peak. Take a mental pause every 15 questions.`;
    } else if (windows.length >= 3) {
      const last = windows[windows.length - 1];
      const first = windows[0];
      if (last.accuracy >= first.accuracy) {
        insight = 'Attention held steady or improved throughout. Strong mental stamina.';
      } else {
        insight = `Mild attention drift toward the end. First window: ${first.accuracy}%, Last: ${last.accuracy}%.`;
      }
    }

    return { windows, driftDetected, collapseAt, insight };
  },


  // ═══════════════════════════════════════════
  // §10: RECOVERY ENGINE
  // ═══════════════════════════════════════════

  /**
   * Analyze recovery patterns after mistakes.
   * @param {object} result
   * @returns {{ recoveryRate, longestSlump, longestStreak, bouncebacks, insight }}
   */
  analyzeRecovery(result) {
    if (!result || !result.questionResults || result.questionResults.length < 5) {
      return { recoveryRate: 0, longestSlump: 0, longestStreak: 0, bouncebacks: 0, insight: '' };
    }

    const qr = result.questionResults.filter(q => !q.isSkipped);
    if (qr.length < 5) return { recoveryRate: 0, longestSlump: 0, longestStreak: 0, bouncebacks: 0, insight: '' };

    let currentSlump = 0, longestSlump = 0;
    let currentStreak = 0, longestStreak = 0;
    let bouncebacks = 0; // wrong → correct transitions
    let slumpEnds = 0;   // how many slumps ended with recovery

    for (let i = 0; i < qr.length; i++) {
      if (qr[i].isCorrect) {
        if (currentSlump >= 2) {
          bouncebacks++;
          slumpEnds++;
        }
        currentSlump = 0;
        currentStreak++;
        if (currentStreak > longestStreak) longestStreak = currentStreak;
      } else {
        if (currentSlump === 0 && i > 0) {
          // Starting a new slump
        }
        currentSlump++;
        currentStreak = 0;
        if (currentSlump > longestSlump) longestSlump = currentSlump;
      }
    }

    // Recovery rate: how often do slumps end with bouncebacks?
    const totalSlumps = this._countSlumps(qr);
    const recoveryRate = totalSlumps > 0 ? Math.round((slumpEnds / totalSlumps) * 100) : 100;

    let insight = '';
    if (recoveryRate >= 80) {
      insight = `Excellent recovery — ${recoveryRate}% of mistake streaks ended with a bounceback. You don't let errors compound.`;
    } else if (recoveryRate >= 50) {
      insight = `Moderate recovery (${recoveryRate}%). When you hit a rough patch, you recover about half the time. Pause after 2 wrong answers to reset.`;
    } else {
      insight = `Low recovery (${recoveryRate}%). Mistakes tend to cascade (longest slump: ${longestSlump} wrong in a row). Try the "2-wrong pause" technique: after 2 consecutive wrong, skip one and come back.`;
    }

    return { recoveryRate, longestSlump, longestStreak, bouncebacks, insight };
  },

  _countSlumps(qr) {
    let slumps = 0, inSlump = false;
    for (let i = 0; i < qr.length; i++) {
      if (!qr[i].isCorrect) {
        if (!inSlump) { slumps++; inSlump = true; }
      } else {
        inSlump = false;
      }
    }
    return slumps;
  },


  // ═══════════════════════════════════════════
  // §11: PANIC DETECTION
  // ═══════════════════════════════════════════

  /**
   * Detect panic episodes during a test.
   * @param {object} result
   * @returns {{ panicDetected, panicAt, panicLength, indicators[], insight }}
   */
  detectPanic(result) {
    if (!result || !result.questionResults || result.questionResults.length < 10) {
      return { panicDetected: false, panicAt: null, panicLength: 0, indicators: [], insight: '' };
    }

    const qr = result.questionResults;
    const indicators = [];

    // Scan for panic windows: 5+ consecutive rapid (<8s) wrong/skipped answers
    let panicStart = null, panicLen = 0, maxPanicLen = 0, maxPanicAt = null;

    for (let i = 0; i < qr.length; i++) {
      const isRapidBad = (qr[i].timeSpent < 8 && !qr[i].isCorrect) || qr[i].isSkipped;
      if (isRapidBad) {
        if (panicStart === null) panicStart = i + 1;
        panicLen++;
      } else {
        if (panicLen > maxPanicLen) {
          maxPanicLen = panicLen;
          maxPanicAt = panicStart;
        }
        panicStart = null;
        panicLen = 0;
      }
    }
    if (panicLen > maxPanicLen) { maxPanicLen = panicLen; maxPanicAt = panicStart; }

    const panicDetected = maxPanicLen >= 4;

    if (panicDetected) {
      indicators.push(`${maxPanicLen} consecutive rapid wrong/skipped answers starting at Q${maxPanicAt}`);

      // Check for accuracy collapse in that region
      const panicWindow = qr.slice(maxPanicAt - 1, maxPanicAt - 1 + maxPanicLen);
      const panicAcc = panicWindow.filter(q => q.isCorrect).length / panicWindow.length;
      if (panicAcc < 0.2) indicators.push(`Accuracy in panic window: ${Math.round(panicAcc * 100)}%`);
    }

    // Check for end-of-test rushing
    const lastQuarter = qr.slice(Math.floor(qr.length * 0.75));
    const lastQAvgTime = lastQuarter.reduce((s, q) => s + q.timeSpent, 0) / lastQuarter.length;
    const overallAvgTime = qr.reduce((s, q) => s + q.timeSpent, 0) / qr.length;
    if (lastQAvgTime < overallAvgTime * 0.4 && lastQuarter.filter(q => q.isCorrect).length < lastQuarter.length * 0.3) {
      indicators.push('End-of-test rushing detected — last quarter speed doubled but accuracy collapsed');
    }

    let insight = '';
    if (panicDetected) {
      insight = `Panic episode detected at Q${maxPanicAt}–Q${maxPanicAt + maxPanicLen - 1}. When you feel this happening: pause, take 3 deep breaths, skip to an easier question, then come back. This alone can recover 5-8 marks.`;
    } else if (indicators.length > 0) {
      insight = indicators[0] + '. Practice mock exams with a timer to build composure.';
    } else {
      insight = 'No panic detected. You maintained composure throughout the test.';
    }

    return { panicDetected, panicAt: maxPanicAt, panicLength: maxPanicLen, indicators, insight };
  },


  // ═══════════════════════════════════════════
  // §13: BEHAVIOUR SCORE (0-100)
  // ═══════════════════════════════════════════

  /**
   * Calculate composite behaviour score.
   * Weights: Decision 30%, Focus 20%, Confidence 15%,
   *          Consistency 15%, Recovery 10%, Patience 10%
   * @param {object} result
   * @returns {{ score, level, components, insight }}
   */
  calculateBehaviourScore(result) {
    if (!result || !result.questionResults || result.questionResults.length < 5) {
      return { score: 0, level: 'Unknown', components: {}, insight: '' };
    }

    // 1. Decision Quality (30%) — confident_correct ratio
    const decisions = this.classifyDecisions(result);
    const confCorrect = decisions.filter(d => d.decision === this.DECISION_TYPES.CONFIDENT_CORRECT).length;
    const decisionScore = Math.round((confCorrect / Math.max(1, decisions.length)) * 100);

    // 2. Focus (20%) — from LearningIntelligence
    const focus = typeof LearningIntelligence !== 'undefined'
      ? LearningIntelligence.calculateFocusScore(result)
      : { score: 50 };
    const focusScore = focus.score;

    // 3. Confidence Calibration (15%)
    const confMatrix = typeof LearningIntelligence !== 'undefined'
      ? LearningIntelligence.getConfidenceMatrix()
      : { overPct: 0, underPct: 0 };
    const confScore = Math.round(100 - (confMatrix.overPct || 0) - (confMatrix.underPct || 0) * 0.5);

    // 4. Consistency (15%) — accuracy variance across 5-question windows
    const drift = this.analyzeAttentionDrift(result);
    const windowAccs = drift.windows.map(w => w.accuracy);
    const accStdDev = windowAccs.length > 1 ? this._stdDev(windowAccs) : 0;
    const consistencyScore = Math.round(Math.max(0, 100 - accStdDev * 2));

    // 5. Recovery (10%)
    const recovery = this.analyzeRecovery(result);
    const recoveryScore = recovery.recoveryRate;

    // 6. Patience (10%) — inverse of skip rate + not rushing
    const risk = this.analyzeRisk(result);
    const patienceScore = Math.round(100 - risk.guessRate - risk.skipRate * 0.5);

    // Composite
    const score = Math.round(
      decisionScore * 0.30 +
      focusScore * 0.20 +
      Math.max(0, confScore) * 0.15 +
      consistencyScore * 0.15 +
      recoveryScore * 0.10 +
      Math.max(0, patienceScore) * 0.10
    );

    const level = score >= 85 ? 'Excellent' :
                  score >= 70 ? 'Strong' :
                  score >= 55 ? 'Developing' :
                  score >= 40 ? 'Needs Work' : 'Beginner';

    const components = {
      decision:    { score: decisionScore, weight: 30, label: 'Decision Quality' },
      focus:       { score: focusScore, weight: 20, label: 'Focus' },
      confidence:  { score: Math.max(0, confScore), weight: 15, label: 'Confidence' },
      consistency: { score: consistencyScore, weight: 15, label: 'Consistency' },
      recovery:    { score: recoveryScore, weight: 10, label: 'Recovery' },
      patience:    { score: Math.max(0, patienceScore), weight: 10, label: 'Patience' }
    };

    // Find weakest component
    const weakest = Object.entries(components).sort((a, b) => a[1].score - b[1].score)[0];
    const insight = `Behaviour Score: ${score}/100 (${level}). Weakest area: ${weakest[1].label} (${weakest[1].score}/100). Improving this will have the biggest impact on your overall performance.`;

    return { score, level, components, insight };
  },


  // ═══════════════════════════════════════════
  // §14: BEHAVIOUR DNA
  // ═══════════════════════════════════════════

  /**
   * Generate natural language behaviour DNA traits.
   * @param {object} result
   * @returns {Array<{ trait, value, description }>}
   */
  getBehaviourDNA(result) {
    const traits = [];

    if (!result || !result.questionResults) return traits;

    const qr = result.questionResults;
    const answered = qr.filter(q => !q.isSkipped);
    const times = answered.map(q => q.timeSpent);
    const avgTime = times.length > 0 ? times.reduce((s, v) => s + v, 0) / times.length : 30;
    const acc = result.accuracy || 0;

    // Speed trait
    if (avgTime < 20) traits.push({ trait: 'Speed', value: 'Fast', description: `${Math.round(avgTime)}s avg — quick decision maker` });
    else if (avgTime > 50) traits.push({ trait: 'Speed', value: 'Methodical', description: `${Math.round(avgTime)}s avg — thinks through each question` });
    else traits.push({ trait: 'Speed', value: 'Balanced', description: `${Math.round(avgTime)}s avg — steady pace` });

    // Accuracy trait
    if (acc >= 80) traits.push({ trait: 'Accuracy', value: 'Sharp', description: `${acc}% — high precision` });
    else if (acc >= 60) traits.push({ trait: 'Accuracy', value: 'Developing', description: `${acc}% — building knowledge` });
    else traits.push({ trait: 'Accuracy', value: 'Learning', description: `${acc}% — focus on fundamentals` });

    // Risk trait
    const risk = this.analyzeRisk(result);
    traits.push({ trait: 'Risk', value: risk.riskLabel, description: `Risk Index ${risk.riskIndex} — ${risk.riskType === 'safe' ? 'strategic skipper' : risk.riskType === 'very_aggressive' ? 'attempts everything' : 'balanced approach'}` });

    // Recovery trait
    const recovery = this.analyzeRecovery(result);
    if (recovery.recoveryRate >= 70) traits.push({ trait: 'Recovery', value: 'Resilient', description: `${recovery.recoveryRate}% recovery — bounces back from mistakes` });
    else if (recovery.recoveryRate >= 40) traits.push({ trait: 'Recovery', value: 'Moderate', description: `${recovery.recoveryRate}% recovery — sometimes affected by errors` });
    else traits.push({ trait: 'Recovery', value: 'Fragile', description: `${recovery.recoveryRate}% recovery — mistakes cascade` });

    // Focus trait
    const focus = typeof LearningIntelligence !== 'undefined' ? LearningIntelligence.calculateFocusScore(result) : { score: 50 };
    if (focus.score >= 75) traits.push({ trait: 'Focus', value: 'Laser', description: `Focus ${focus.score}/100 — sustained attention` });
    else if (focus.score >= 50) traits.push({ trait: 'Focus', value: 'Moderate', description: `Focus ${focus.score}/100 — some drift` });
    else traits.push({ trait: 'Focus', value: 'Scattered', description: `Focus ${focus.score}/100 — needs attention training` });

    // Time of day trait
    const timeIntel = typeof LearningIntelligence !== 'undefined' ? LearningIntelligence.getTimeIntelligence() : { bestTime: null };
    if (timeIntel.bestTime) {
      const labels = { morning: 'Morning Learner', afternoon: 'Afternoon Learner', evening: 'Evening Learner', night: 'Night Owl' };
      traits.push({ trait: 'Timing', value: labels[timeIntel.bestTime] || timeIntel.bestTime, description: `Best accuracy during ${timeIntel.bestTime} sessions` });
    }

    // Stamina trait (pressure)
    const pressure = typeof LearningIntelligence !== 'undefined' ? LearningIntelligence.analyzePressure(result) : { pressureDrop: 0 };
    if (pressure.pressureDrop < 5) traits.push({ trait: 'Stamina', value: 'Iron', description: 'No drop-off — consistent throughout' });
    else if (pressure.pressureDrop < 15) traits.push({ trait: 'Stamina', value: 'Good', description: `${pressure.pressureDrop}% drop — minor fatigue` });
    else traits.push({ trait: 'Stamina', value: 'Needs Work', description: `${pressure.pressureDrop}% drop in second half — stamina training needed` });

    return traits;
  },


  // ═══════════════════════════════════════════
  // §15: BEHAVIOUR CHANGES
  // ═══════════════════════════════════════════

  /**
   * Compare current behaviour with historical snapshots.
   * @param {object} currentResult
   * @returns {Array<{ metric, old, current, direction, insight }>}
   */
  detectBehaviourChanges(currentResult) {
    const changes = [];
    const snapshots = this._getSnapshots();
    if (snapshots.length < 2 || !currentResult) return changes;

    // Current scores
    const currentFocus = typeof LearningIntelligence !== 'undefined'
      ? LearningIntelligence.calculateFocusScore(currentResult).score : 50;
    const currentRisk = this.analyzeRisk(currentResult).riskIndex;
    const currentRecovery = this.analyzeRecovery(currentResult).recoveryRate;
    const currentBehaviour = this.calculateBehaviourScore(currentResult).score;

    // Average of last 5 snapshots
    const recent = snapshots.slice(-5);
    const avgFocus = Math.round(recent.reduce((s, snap) => s + (snap.focusScore || 50), 0) / recent.length);
    const avgRisk = Math.round(recent.reduce((s, snap) => s + (snap.riskIndex || 30), 0) / recent.length);
    const avgRecovery = Math.round(recent.reduce((s, snap) => s + (snap.recoveryRate || 50), 0) / recent.length);
    const avgBehaviour = Math.round(recent.reduce((s, snap) => s + (snap.behaviourScore || 50), 0) / recent.length);

    // Compare
    const diff = (curr, avg, label) => {
      const delta = curr - avg;
      if (Math.abs(delta) < 5) return null;
      return {
        metric: label,
        old: avg,
        current: curr,
        direction: delta > 0 ? 'up' : 'down',
        delta: Math.abs(delta),
        insight: `${label}: ${avg} → ${curr} (${delta > 0 ? '+' : ''}${delta})`
      };
    };

    [
      diff(currentFocus, avgFocus, 'Focus'),
      diff(currentRisk, avgRisk, 'Risk'),
      diff(currentRecovery, avgRecovery, 'Recovery'),
      diff(currentBehaviour, avgBehaviour, 'Behaviour Score')
    ].filter(Boolean).forEach(c => changes.push(c));

    return changes;
  },


  // ═══════════════════════════════════════════
  // §18: BEHAVIOUR PREDICTION
  // ═══════════════════════════════════════════

  /**
   * Predict likely issues in the next test.
   * @returns {Array<{ prediction, probability, evidence, prevention }>}
   */
  getPredictions() {
    const snapshots = this._getSnapshots();
    const predictions = [];

    if (snapshots.length < 3) return predictions;

    const recent = snapshots.slice(-5);

    // 1. Predict carelessness
    const avgCareless = recent.reduce((s, snap) => {
      const types = snap.decisionDist || {};
      return s + (types.careless_error?.pct || 0);
    }, 0) / recent.length;

    if (avgCareless > 15) {
      predictions.push({
        prediction: 'Likely careless mistakes',
        probability: Math.min(90, Math.round(avgCareless + 20)),
        evidence: `${Math.round(avgCareless)}% careless errors in last ${recent.length} tests`,
        prevention: 'Double-check fast answers. Use the last 5 minutes for review.'
      });
    }

    // 2. Predict panic
    const panicCount = recent.filter(snap => snap.panicDetected).length;
    if (panicCount >= 2) {
      predictions.push({
        prediction: 'Likely panic episode',
        probability: Math.round((panicCount / recent.length) * 100),
        evidence: `Panic detected in ${panicCount} of last ${recent.length} tests`,
        prevention: 'Practice timed mocks. When panic starts: pause, breathe, skip to easy questions.'
      });
    }

    // 3. Predict fatigue
    const avgFatigue = recent.reduce((s, snap) => s + (snap.fatigueIndex || 0), 0) / recent.length;
    if (avgFatigue > 25) {
      predictions.push({
        prediction: 'Likely fatigue in second half',
        probability: Math.min(85, Math.round(avgFatigue + 15)),
        evidence: `Average fatigue index: ${Math.round(avgFatigue)}/100`,
        prevention: 'Break mock into two 30-minute sessions with a 2-minute rest.'
      });
    }

    // 4. Predict confidence drop
    const recentFocus = recent.map(s => s.focusScore || 50);
    if (recentFocus.length >= 3) {
      const trend = recentFocus[recentFocus.length - 1] - recentFocus[0];
      if (trend < -10) {
        predictions.push({
          prediction: 'Declining focus trend',
          probability: Math.min(75, Math.round(Math.abs(trend) + 20)),
          evidence: `Focus dropped from ${recentFocus[0]} to ${recentFocus[recentFocus.length - 1]} over ${recent.length} tests`,
          prevention: 'Study in shorter sessions. Switch subjects after 30 minutes.'
        });
      }
    }

    return predictions.sort((a, b) => b.probability - a.probability);
  },


  // ═══════════════════════════════════════════
  // §20: FULL BEHAVIOUR ANALYSIS (for Result)
  // ═══════════════════════════════════════════

  /**
   * Get complete behaviour analysis for result page.
   * @param {object} result
   * @returns {object}
   */
  getFullBehaviourAnalysis(result) {
    const decisions = this.classifyDecisions(result);
    const decisionDist = this.getDecisionDistribution(decisions);
    const risk = this.analyzeRisk(result);
    const drift = this.analyzeAttentionDrift(result);
    const recovery = this.analyzeRecovery(result);
    const panic = this.detectPanic(result);
    const behaviourScore = this.calculateBehaviourScore(result);
    const dna = this.getBehaviourDNA(result);
    const changes = this.detectBehaviourChanges(result);
    const predictions = this.getPredictions();

    return {
      decisions, decisionDist, risk, drift, recovery,
      panic, behaviourScore, dna, changes, predictions
    };
  },


  // ═══════════════════════════════════════════
  // PROCESS & STORE (called after every test)
  // ═══════════════════════════════════════════

  /**
   * Process test result and save behaviour snapshot.
   * Called from test.js after submitTest().
   * @param {object} result
   */
  processResult(result) {
    if (!result || !result.questionResults) return;

    try {
      const decisions = this.classifyDecisions(result);
      const decisionDist = this.getDecisionDistribution(decisions);
      const risk = this.analyzeRisk(result);
      const recovery = this.analyzeRecovery(result);
      const panic = this.detectPanic(result);
      const behaviourScore = this.calculateBehaviourScore(result);
      const focus = typeof LearningIntelligence !== 'undefined'
        ? LearningIntelligence.calculateFocusScore(result) : { score: 50 };
      const fatigue = typeof LearningIntelligence !== 'undefined'
        ? LearningIntelligence.analyzeSubjectFatigue(result) : { fatigueIndex: 0 };

      const snapshot = {
        date: new Date().toISOString(),
        accuracy: result.accuracy,
        behaviourScore: behaviourScore.score,
        focusScore: focus.score,
        riskIndex: risk.riskIndex,
        riskType: risk.riskType,
        recoveryRate: recovery.recoveryRate,
        panicDetected: panic.panicDetected,
        fatigueIndex: fatigue.fatigueIndex,
        decisionDist
      };

      const raw = localStorage.getItem(this.STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : { snapshots: [] };
      data.snapshots.push(snapshot);
      if (data.snapshots.length > 30) data.snapshots = data.snapshots.slice(-30);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

      // ── Emit behaviour events (Doc 19 §21) ──
      if (typeof EventBus !== 'undefined') {
        EventBus.emit(EventBus.EVENTS.BEHAVIOUR_ANALYZED, {
          behaviourScore: behaviourScore.score,
          riskType: risk.riskType,
          recoveryRate: recovery.recoveryRate,
          focusScore: focus.score
        });

        if (panic.panicDetected) {
          EventBus.emit(EventBus.EVENTS.PANIC_DETECTED, {
            panicAt: panic.panicAt,
            panicLength: panic.panicLength
          });
        }

        if (fatigue.fatigueIndex > 40) {
          EventBus.emit(EventBus.EVENTS.FOCUS_COLLAPSED, {
            fatigueIndex: fatigue.fatigueIndex,
            dropAfterQuestion: fatigue.dropAfterQuestion
          });
        }

        if (recovery.bouncebacks >= 2) {
          EventBus.emit(EventBus.EVENTS.RECOVERY_DETECTED, {
            recoveryRate: recovery.recoveryRate,
            bouncebacks: recovery.bouncebacks
          });
        }
      }
    } catch (e) {
      console.warn('[BehaviourEngine] Snapshot save error:', e.message);
    }
  },


  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  _getSnapshots() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : { snapshots: [] };
      return data.snapshots || [];
    } catch { return []; }
  },

  _median(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  _stdDev(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  },

  _clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(v))); },


  // ═══════════════════════════════════════════
  // COMPATIBILITY LAYER
  // Zero-arg methods used by dashboard.js
  // and aiCoachPage.js (match old CognitiveBehaviour API)
  // ═══════════════════════════════════════════

  /**
   * §5: Confidence Calibration score.
   * @returns {{ calibration, overconfident, underconfident, total, evidence, recommendation, ready }}
   */
  getCalibration() {
    if (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.getConfidenceMatrix) {
      const m = LearningIntelligence.getConfidenceMatrix();
      if (!m.total || m.total < 8) {
        return { calibration: null, ready: false, total: m.total || 0, evidence: 'Rate your confidence during tests to unlock calibration.', recommendation: '' };
      }
      const miscalibrated = (m.overPct || 0) + (m.underPct || 0);
      const calibration = this._clamp(100 - miscalibrated);
      const evidence = `${m.overPct || 0}% confident-but-wrong, ${m.underPct || 0}% doubted-but-right across ${m.total} rated answers.`;
      const recommendation = (m.overPct || 0) > (m.underPct || 0)
        ? 'You trust wrong answers too often. When you feel sure, do one quick sanity check before locking it in.'
        : (m.underPct || 0) > 15
        ? 'You doubt correct answers. Your preparation is better than your gut says — commit to your first read more often.'
        : 'Your confidence is well-calibrated: what you feel sure about, you usually get right.';
      return { calibration, overconfident: m.overconfident, underconfident: m.underconfident, total: m.total, evidence, recommendation, ready: true };
    }
    return { calibration: null, ready: false, total: 0, evidence: '', recommendation: '' };
  },

  /**
   * §14: Zero-arg Behaviour DNA from snapshots (for dashboard/coach page).
   * Returns { tags[], ready, behaviourScore }.
   */
  getBehaviourDNAFromHistory() {
    const snaps = this._getSnapshots();
    if (snaps.length === 0) return { tags: [], ready: false, behaviourScore: null };

    const avg = (key) => {
      const vals = snaps.map(s => s[key]).filter(v => typeof v === 'number');
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    const tags = [];

    // Speed from learning profile
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    const sps = profile?.subjectProfiles ? Object.values(profile.subjectProfiles).filter(s => s.avgSpeed > 0) : [];
    if (sps.length) {
      const avgSpeed = sps.reduce((a, s) => a + s.avgSpeed, 0) / sps.length;
      tags.push(avgSpeed < 45 ? 'Fast' : avgSpeed > 75 ? 'Deliberate' : 'Steady-Paced');
    }

    const focus = avg('focusScore');
    if (focus !== null) tags.push(focus >= 70 ? 'Focused' : focus < 45 ? 'Distraction-Prone' : 'Moderately Focused');

    const risk = avg('riskIndex');
    if (risk !== null) tags.push(risk >= 55 ? 'High Risk' : risk <= 25 ? 'Risk-Averse' : 'Balanced Risk');

    const recovery = avg('recoveryRate');
    if (recovery !== null) tags.push(recovery >= 65 ? 'Good Recovery' : recovery < 40 ? 'Fragile Recovery' : 'Mixed Recovery');

    // Time-of-day
    if (typeof LearningIntelligence !== 'undefined') {
      const ti = LearningIntelligence.getTimeIntelligence();
      if (ti.bestTime) {
        const map = { morning: 'Morning Learner', afternoon: 'Afternoon Learner', evening: 'Evening Learner', night: 'Night Learner' };
        tags.push(map[ti.bestTime] || null);
      }
    }

    const behScore = avg('behaviourScore');
    return { tags: tags.filter(Boolean), ready: true, behaviourScore: behScore !== null ? Math.round(behScore) : null };
  },

  /**
   * §2: Behaviour Timeline from snapshots.
   * @param {number} limit
   */
  getBehaviourTimeline(limit = 20) {
    return this._getSnapshots().slice(-limit).map(s => ({
      date: s.date,
      behaviourScore: s.behaviourScore ?? null,
      focusScore: s.focusScore ?? null,
      riskIndex: s.riskIndex ?? null,
      recoveryRate: s.recoveryRate ?? null,
      accuracy: s.accuracy ?? null
    }));
  },

  /**
   * §15: Behaviour changes from historical snapshots (for dashboard/coach).
   * @returns {Array<{ metric, from, to, direction, reason, recommendation }>}
   */
  getBehaviourChanges() {
    const snaps = this._getSnapshots();
    if (snaps.length < 4) return [];

    const half = Math.floor(snaps.length / 2);
    const older = snaps.slice(0, half);
    const recent = snaps.slice(half);
    const mean = (arr, k) => {
      const v = arr.map(s => s[k]).filter(x => typeof x === 'number');
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };

    const metrics = [
      { key: 'focusScore', label: 'Focus' },
      { key: 'behaviourScore', label: 'Behaviour Score' },
      { key: 'riskIndex', label: 'Risk', invert: true },
      { key: 'recoveryRate', label: 'Recovery' }
    ];

    const changes = [];
    metrics.forEach(m => {
      const from = mean(older, m.key);
      const to = mean(recent, m.key);
      if (from === null || to === null) return;
      const delta = to - from;
      if (Math.abs(delta) < 8) return;

      const worse = m.invert ? delta > 0 : delta < 0;
      changes.push({
        metric: m.label,
        from: Math.round(from),
        to: Math.round(to),
        direction: worse ? 'declined' : 'improved',
        reason: worse ? `${m.label} has been declining over recent tests` : `${m.label} improved through consistent practice`,
        recommendation: worse
          ? `Focus on improving your ${m.label.toLowerCase()} — try shorter, focused practice sessions.`
          : `Great progress on ${m.label.toLowerCase()} — keep this momentum going.`
      });
    });

    return changes.sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from));
  },

  /**
   * §18: Behaviour predictions from historical snapshots (for dashboard/coach).
   * @returns {Array<{ risk, likelihood, confidence, evidence }>}
   */
  predictBehaviour() {
    const snaps = this._getSnapshots();
    if (snaps.length < 2) return [];

    const preds = [];
    const share = (fn) => snaps.filter(fn).length / snaps.length;
    const conf = snaps.length >= 5 ? 'high' : snaps.length >= 3 ? 'medium' : 'low';

    // Careless mistakes
    const carelessShare = share(s => {
      const dist = s.decisionDist || {};
      return (dist.careless_error?.pct || 0) > 20 || (dist.random_guess?.pct || 0) > 15;
    });
    if (carelessShare >= 0.3) {
      preds.push({ risk: 'Careless mistakes', likelihood: Math.round(carelessShare * 100), confidence: conf,
        evidence: `Careless/guess errors were significant in ${Math.round(carelessShare * 100)}% of recent tests.` });
    }

    // Panic
    const panicShare = share(s => s.panicDetected);
    if (panicShare >= 0.3) {
      preds.push({ risk: 'End-of-test panic', likelihood: Math.round(panicShare * 100), confidence: conf,
        evidence: `Panic detected in ${Math.round(panicShare * 100)}% of recent tests.` });
    }

    // Fatigue
    const lowFocusShare = share(s => (s.focusScore ?? 100) < 55);
    if (lowFocusShare >= 0.4) {
      preds.push({ risk: 'Focus / fatigue drop', likelihood: Math.round(lowFocusShare * 100), confidence: conf,
        evidence: `Focus score was below 55 in ${Math.round(lowFocusShare * 100)}% of recent tests.` });
    }

    return preds;
  },

  // ═══════════════════════════════════════════
  // Doc 23: COMMON ENGINE INTERFACE (IESCP)
  // ═══════════════════════════════════════════
  getStandardReport() {
    const snaps = this._getSnapshots() || [];
    const dna = this.getBehaviourDNA?.() || { ready: false };

    if (!dna.ready || snaps.length === 0) {
      return {
        engineName: 'BehaviourEngine',
        input: 'No data',
        evidence: 'No behaviour snapshots recorded.',
        score: 70,
        confidence: 'low',
        prediction: 'Requires test sessions for cognitive analysis.',
        recommendation: 'Complete test to evaluate decision patterns.',
        expectedOutcome: 'Calibration of panic and fatigue risks.',
        actualOutcome: 'Awaiting mock.',
        selfEvaluation: 'No history.'
      };
    }

    const scoreVal = dna.behaviourScore || 70;
    const focus = snaps[snaps.length - 1]?.focusScore ?? 75;
    const panic = snaps[snaps.length - 1]?.panicDetected ? 'Yes' : 'No';

    return {
      engineName: 'BehaviourEngine',
      input: `Behaviour snapshots containing ${snaps.length} recent test sessions.`,
      evidence: `Focus score: ${focus}%, Panic detected: ${panic}, Behaviour DNA tags: ${dna.tags?.join(', ') || 'none'}`,
      score: scoreVal,
      confidence: snaps.length >= 5 ? 'high' : snaps.length >= 2 ? 'medium' : 'low',
      prediction: panic === 'Yes' ? 'Student is likely to panic skip under time pressure.' : 'Rhythm is stable.',
      recommendation: focus < 60 ? 'Schedule rest cooldown. High fatigue detected.' : 'Rhythm is optimal. Proceed with standard plan.',
      expectedOutcome: focus < 60 ? 'Expected recovery of focus score to above 75% after a recovery break.' : 'Maintained focus rate.',
      actualOutcome: 'Self-evaluation tracking active in localStorage.',
      selfEvaluation: 'Accuracy of panic/fatigue triggers is cross-validated against next session response times.'
    };
  }
};

window.BehaviourEngine = BehaviourEngine;

// ── Backward compatibility alias ──
// Dashboard.js and aiCoachPage.js reference CognitiveBehaviour.
// Route all calls to BehaviourEngine.
window.CognitiveBehaviour = {
  // Proxy: zero-arg methods used by dashboard/coach
  getBehaviourDNA: () => BehaviourEngine.getBehaviourDNAFromHistory(),
  getBehaviourChanges: () => BehaviourEngine.getBehaviourChanges(),
  predictBehaviour: () => BehaviourEngine.predictBehaviour(),
  getCalibration: () => BehaviourEngine.getCalibration(),
  getBehaviourTimeline: (limit) => BehaviourEngine.getBehaviourTimeline(limit),
  // Proxy: result-based methods
  getFullBehaviourAnalysis: (result) => BehaviourEngine.getFullBehaviourAnalysis(result),
  processResult: (result) => BehaviourEngine.processResult(result),
  analyzeRisk: (result) => BehaviourEngine.analyzeRisk(result),
  classifyDecisions: (result) => BehaviourEngine.classifyDecisions(result)
};

