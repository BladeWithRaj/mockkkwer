// ============================================
// COGNITIVE BEHAVIOUR ENGINE — Doc 19 (CBE)
// Understands HOW a student thinks, not just WHAT they score.
//
// NO API. NO LLM. Pure computation from signals the
// test flow already captures:
//   - result.questionResults[].timeSpent
//   - result.questionResults[].isCorrect / isSkipped / selectedAnswer
//   - question order / position
//   - Storage confidence log
//
// Every conclusion carries: Evidence → Reason → Confidence → Recommendation (§19).
//
// ── DEFERRED (needs live-test instrumentation in test.js) ──
//   §4 Reading Behaviour  — first-click latency, scroll, option-switching
//   §3 full Decision types — click-level (option changed, re-read)
//   §6 careless-vs-knowledge split — "correct concept, wrong option clicked"
// These are approximated from timing where possible and flagged inline.
// ============================================

const CognitiveBehaviour = {

  STORAGE_KEY: 'mtp_behaviour',


  // ═══════════════════════════════════════════
  // §7: RISK BEHAVIOUR
  // ═══════════════════════════════════════════

  /**
   * Risk Index from skip rate, guess rate, and negative marks taken.
   * @param {object} result
   * @returns {{ riskIndex, type, skipRate, guessRate, evidence, recommendation }}
   */
  analyzeRisk(result) {
    if (!result || !result.questionResults || result.questionResults.length === 0) {
      return { riskIndex: 0, type: 'unknown', skipRate: 0, guessRate: 0, evidence: '', recommendation: '' };
    }

    const qr = result.questionResults;
    const total = qr.length;
    const skipped = qr.filter(q => q.isSkipped).length;
    // Guess proxy: answered in under 5s (no time to reason) — timing-based (§3 approximation)
    const guesses = qr.filter(q => !q.isSkipped && (q.timeSpent || 0) < 5).length;
    const wrongAnswered = qr.filter(q => !q.isSkipped && !q.isCorrect).length;

    const skipRate = Math.round((skipped / total) * 100);
    const guessRate = Math.round((guesses / total) * 100);
    const wrongRate = Math.round((wrongAnswered / total) * 100);

    // Risk rises with guessing + answering-into-wrong (esp. under negative marking)
    const negWeight = result.negativeMarking ? 1.3 : 1;
    const riskIndex = this._clamp(Math.round((guessRate * 1.5 + wrongRate * negWeight - skipRate * 0.3)));

    const type = riskIndex >= 65 ? 'Very Aggressive' :
                 riskIndex >= 45 ? 'Aggressive' :
                 riskIndex >= 25 ? 'Balanced' : 'Safe';

    const evidence = `${guessRate}% rapid-guess answers, ${wrongRate}% wrong attempts, ${skipRate}% skipped${result.negativeMarking ? ' (negative marking on)' : ''}.`;

    let recommendation;
    if (type === 'Very Aggressive' || type === 'Aggressive') {
      recommendation = result.negativeMarking
        ? 'You attempt too many uncertain questions under negative marking. Skip when you can\'t eliminate at least two options.'
        : 'You guess frequently. Since there\'s no penalty here that\'s fine, but build the habit of eliminating options first.';
    } else if (type === 'Safe' && skipRate > 30) {
      recommendation = 'You play very safe and skip a lot. Try attempting questions where you can eliminate two options — you\'re leaving marks on the table.';
    } else {
      recommendation = 'Your risk-taking is well balanced. Keep attempting where you can eliminate options and skipping blind guesses.';
    }

    return { riskIndex, type, skipRate, guessRate, wrongRate, evidence, recommendation };
  },


  // ═══════════════════════════════════════════
  // §8: ATTENTION DRIFT
  // ═══════════════════════════════════════════

  /**
   * Accuracy per 5-question block — detect focus collapse.
   * @param {object} result
   * @returns {{ blocks[], collapseAt, hasDrift, evidence, recommendation }}
   */
  analyzeAttentionDrift(result) {
    if (!result || !result.questionResults || result.questionResults.length < 10) {
      return { blocks: [], collapseAt: null, hasDrift: false, evidence: '', recommendation: '' };
    }

    const qr = result.questionResults;
    const blockSize = 5;
    const blocks = [];
    for (let i = 0; i < qr.length; i += blockSize) {
      const slice = qr.slice(i, i + blockSize);
      blocks.push({
        from: i + 1,
        to: Math.min(i + blockSize, qr.length),
        accuracy: this._accuracy(slice)
      });
    }

    // Find first sustained drop (>=20 pts below the peak, in the back half)
    const peak = Math.max(...blocks.map(b => b.accuracy));
    let collapseAt = null;
    for (let i = 1; i < blocks.length; i++) {
      if (peak - blocks[i].accuracy >= 20 && i >= Math.floor(blocks.length / 2)) {
        collapseAt = blocks[i].from;
        break;
      }
    }

    const hasDrift = collapseAt !== null;
    const first = blocks[0]?.accuracy ?? 0;
    const last = blocks[blocks.length - 1]?.accuracy ?? 0;

    const evidence = `Accuracy by block: ${blocks.map(b => `${b.from}-${b.to}: ${b.accuracy}%`).join(', ')}.`;
    const recommendation = hasDrift
      ? `Your focus dropped noticeably from question ${collapseAt}. Take a 20-second reset at the halfway point, or split long mocks into two sittings.`
      : `Focus held steady (${first}% → ${last}%). Strong sustained attention.`;

    return { blocks, collapseAt, hasDrift, first, last, evidence, recommendation };
  },


  // ═══════════════════════════════════════════
  // §9: MENTAL FATIGUE  (delegates to §19 fatigue in LearningIntelligence)
  // ═══════════════════════════════════════════

  analyzeFatigue(result) {
    if (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.analyzeSubjectFatigue) {
      return LearningIntelligence.analyzeSubjectFatigue(result);
    }
    return { fatigueIndex: 0, dropAfterQuestion: null, insight: '' };
  },


  // ═══════════════════════════════════════════
  // §10: RECOVERY ENGINE
  // Do they bounce back after a mistake, or spiral?
  // ═══════════════════════════════════════════

  /**
   * Measure how often a wrong answer is followed by a correct one.
   * @param {object} result
   * @returns {{ recoveryRate, spiralRate, type, evidence, recommendation }}
   */
  analyzeRecovery(result) {
    if (!result || !result.questionResults || result.questionResults.length < 6) {
      return { recoveryRate: 0, spiralRate: 0, type: 'unknown', evidence: '', recommendation: '' };
    }

    const qr = result.questionResults.filter(q => !q.isSkipped);
    let mistakes = 0, recovered = 0, spiraled = 0;

    for (let i = 0; i < qr.length - 1; i++) {
      if (!qr[i].isCorrect) {
        mistakes++;
        if (qr[i + 1].isCorrect) recovered++;
        else spiraled++;
      }
    }

    if (mistakes === 0) {
      return { recoveryRate: 100, spiralRate: 0, type: 'steady', mistakes: 0,
        evidence: 'No wrong answers to recover from — clean run.',
        recommendation: 'No mistake-recovery pattern to coach. Excellent control.' };
    }

    const recoveryRate = Math.round((recovered / mistakes) * 100);
    const spiralRate = Math.round((spiraled / mistakes) * 100);
    const type = recoveryRate >= 65 ? 'resilient' :
                 recoveryRate >= 40 ? 'mixed' : 'fragile';

    const evidence = `After ${mistakes} wrong answer${mistakes > 1 ? 's' : ''}, you got the next one right ${recovered} time${recovered !== 1 ? 's' : ''} (${recoveryRate}%).`;
    const recommendation = type === 'fragile'
      ? 'A single mistake tends to drag the next few answers down. When you get one wrong, take a breath and reset — don\'t let it snowball.'
      : type === 'mixed'
      ? 'Your recovery after mistakes is inconsistent. A quick mental reset after a wrong answer will steady the questions that follow.'
      : 'You bounce back well after mistakes — a wrong answer rarely rattles you. That resilience is a real asset under exam pressure.';

    return { recoveryRate, spiralRate, type, mistakes, evidence, recommendation };
  },


  // ═══════════════════════════════════════════
  // §11: PANIC DETECTION  (never shame — nudge)
  // ═══════════════════════════════════════════

  /**
   * Detect a panic cluster: rapid guessing + accuracy collapse toward the end.
   * @param {object} result
   * @returns {{ detected, atQuestion, evidence, nudge }}
   */
  detectPanic(result) {
    if (!result || !result.questionResults || result.questionResults.length < 12) {
      return { detected: false, atQuestion: null, evidence: '', nudge: '' };
    }

    const qr = result.questionResults;
    const tail = qr.slice(Math.floor(qr.length * 0.66)); // last third
    const tailRapid = tail.filter(q => !q.isSkipped && (q.timeSpent || 0) < 5).length;
    const tailAcc = this._accuracy(tail);
    const headAcc = this._accuracy(qr.slice(0, Math.floor(qr.length / 2)));

    // Panic = end-of-test rapid guessing AND a clear accuracy collapse
    const rapidShare = tail.length > 0 ? tailRapid / tail.length : 0;
    const detected = rapidShare >= 0.35 && (headAcc - tailAcc) >= 20;

    if (!detected) {
      return { detected: false, atQuestion: null, evidence: '', nudge: '' };
    }

    const atQuestion = Math.floor(qr.length * 0.66) + 1;
    const evidence = `In the final stretch you answered ${Math.round(rapidShare * 100)}% of questions in under 5 seconds and accuracy fell from ${headAcc}% to ${tailAcc}%.`;
    const nudge = 'Looks like time pressure hit near the end. Next time, when you feel the rush: pause, take 30 seconds, and answer the remaining questions one at a time. You know more than the clock lets you show.';

    return { detected, atQuestion, headAcc, tailAcc, evidence, nudge };
  },


  // ═══════════════════════════════════════════
  // §3: DECISION CLASSIFICATION (timing-based; click-level deferred)
  // ═══════════════════════════════════════════

  /**
   * Classify each decision from timing + correctness signals.
   * NOTE: 'Lucky Guess' vs 'Educated Guess' and careless splits are
   * approximated from time only — full fidelity needs option-switch capture (§3/§6, deferred).
   * @param {object} result
   * @returns {{ counts:{}, total, quality, evidence }}
   */
  classifyDecisions(result) {
    if (!result || !result.questionResults) return { counts: {}, total: 0, quality: 0, evidence: '' };

    const qr = result.questionResults;
    const times = qr.filter(q => !q.isSkipped).map(q => q.timeSpent || 0);
    const median = this._median(times);

    const counts = {
      confidentCorrect: 0, luckyGuess: 0, educatedGuess: 0,
      carelessError: 0, knowledgeError: 0, timePressureError: 0, panicSkip: 0
    };

    qr.forEach(q => {
      const t = q.timeSpent || 0;
      if (q.isSkipped) {
        counts.panicSkip += t < 3 ? 1 : 0; // rushed skip; considered skips aren't panic
        return;
      }
      const ratio = median > 0 ? t / median : 1;
      if (q.isCorrect) {
        if (t < 5) counts.luckyGuess++;             // right but no time to reason
        else if (ratio < 0.5) counts.educatedGuess++;
        else counts.confidentCorrect++;
      } else {
        if (t < 5) counts.carelessError++;           // fast wrong → careless (approx of §6)
        else if (ratio > 2.0) counts.knowledgeError++; // long + wrong → genuine gap
        else if (ratio > 1.3) counts.timePressureError++;
        else counts.carelessError++;
      }
    });

    const answered = qr.filter(q => !q.isSkipped).length;
    // Decision quality: good decisions / answered
    const good = counts.confidentCorrect + counts.educatedGuess;
    const quality = answered > 0 ? Math.round((good / answered) * 100) : 0;

    const evidence = `${counts.confidentCorrect} confident-correct, ${counts.educatedGuess} educated guesses, ${counts.carelessError} careless, ${counts.knowledgeError} knowledge gaps.`;

    return { counts, total: qr.length, quality, evidence };
  },


  // ═══════════════════════════════════════════
  // §5: CONFIDENCE CALIBRATION
  // (from confidence log; requires wasCorrect backfill to be fully accurate)
  // ═══════════════════════════════════════════

  /**
   * Calibration = how well stated confidence matches correctness.
   * @returns {{ calibration, overconfident, underconfident, total, evidence, recommendation, ready }}
   */
  getCalibration() {
    if (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.getConfidenceMatrix) {
      const m = LearningIntelligence.getConfidenceMatrix();
      if (!m.total || m.total < 8) {
        return { calibration: null, ready: false, total: m.total || 0, evidence: 'Rate your confidence during tests to unlock calibration.', recommendation: '' };
      }
      // Calibration score: 100 minus miscalibration share
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


  // ═══════════════════════════════════════════
  // §13: BEHAVIOUR SCORE (composite)
  // ═══════════════════════════════════════════

  /**
   * Composite behaviour score for a single test.
   *   Decision 30 · Focus 20 · Confidence 15 · Consistency 15 · Recovery 10 · Patience 10
   * @param {object} result
   * @returns {{ score, components, evidence }}
   */
  getBehaviourScore(result) {
    if (!result || !result.questionResults || result.questionResults.length === 0) {
      return { score: 0, components: {}, evidence: '' };
    }

    const decisions = this.classifyDecisions(result);
    const drift = this.analyzeAttentionDrift(result);
    const recovery = this.analyzeRecovery(result);
    const calibration = this.getCalibration();

    // Focus from LearningIntelligence focus score
    const focus = (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.calculateFocusScore)
      ? LearningIntelligence.calculateFocusScore(result).score : 50;

    // Consistency: inverse of attention-drift spread
    const blockAccs = drift.blocks.map(b => b.accuracy);
    const consistency = blockAccs.length >= 2
      ? this._clamp(100 - this._stdDev(blockAccs)) : 50;

    // Patience: share of questions given adequate time (not rushed)
    const qr = result.questionResults.filter(q => !q.isSkipped);
    const patient = qr.filter(q => (q.timeSpent || 0) >= 5).length;
    const patience = qr.length > 0 ? Math.round((patient / qr.length) * 100) : 50;

    const confidenceScore = calibration.ready ? calibration.calibration : 50;
    const recoveryScore = recovery.type === 'unknown' ? 50 : recovery.recoveryRate;

    const components = {
      decision:    { score: decisions.quality, weight: 30, label: 'Decision Quality' },
      focus:       { score: focus,             weight: 20, label: 'Focus' },
      confidence:  { score: confidenceScore,   weight: 15, label: 'Confidence Calibration' },
      consistency: { score: consistency,       weight: 15, label: 'Consistency' },
      recovery:    { score: recoveryScore,     weight: 10, label: 'Recovery' },
      patience:    { score: patience,          weight: 10, label: 'Patience' }
    };

    const score = Math.round(
      decisions.quality * 0.30 +
      focus * 0.20 +
      confidenceScore * 0.15 +
      consistency * 0.15 +
      recoveryScore * 0.10 +
      patience * 0.10
    );

    const evidence = `Decision ${decisions.quality}, Focus ${focus}, Calibration ${confidenceScore}, Consistency ${consistency}, Recovery ${recoveryScore}, Patience ${patience}.`;

    return { score, components, evidence };
  },


  // ═══════════════════════════════════════════
  // §14: BEHAVIOUR DNA (cross-test tags)
  // ═══════════════════════════════════════════

  /**
   * Behavioural tag set from persisted snapshots + learning profile.
   * @returns {{ tags[], ready }}
   */
  getBehaviourDNA() {
    const snaps = this._getSnapshots();
    if (snaps.length === 0) return { tags: [], ready: false };

    const avg = (key) => {
      const vals = snaps.map(s => s[key]).filter(v => typeof v === 'number');
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    };

    const tags = [];

    // Speed (from learning profile avg speed)
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    const sps = profile?.subjectProfiles ? Object.values(profile.subjectProfiles).filter(s => s.avgSpeed > 0) : [];
    if (sps.length) {
      const avgSpeed = sps.reduce((a, s) => a + s.avgSpeed, 0) / sps.length;
      tags.push(avgSpeed < 45 ? 'Fast' : avgSpeed > 75 ? 'Deliberate' : 'Steady-Paced');
    }

    const behScore = avg('behaviourScore');
    const focus = avg('focusScore');
    if (focus !== null) tags.push(focus >= 70 ? 'Focused' : focus < 45 ? 'Distraction-Prone' : 'Moderately Focused');

    const risk = avg('riskIndex');
    if (risk !== null) tags.push(risk >= 55 ? 'High Risk' : risk <= 25 ? 'Risk-Averse' : 'Balanced Risk');

    const recovery = avg('recoveryRate');
    if (recovery !== null) tags.push(recovery >= 65 ? 'Good Recovery' : recovery < 40 ? 'Fragile Recovery' : 'Mixed Recovery');

    // Time-of-day from LearningIntelligence
    if (typeof LearningIntelligence !== 'undefined') {
      const ti = LearningIntelligence.getTimeIntelligence();
      if (ti.bestTime) {
        const map = { morning: 'Morning Learner', afternoon: 'Afternoon Learner', evening: 'Evening Learner', night: 'Night Learner' };
        tags.push(map[ti.bestTime] || null);
      }
    }

    return { tags: tags.filter(Boolean), ready: true, behaviourScore: behScore !== null ? Math.round(behScore) : null };
  },


  // ═══════════════════════════════════════════
  // §2 / §15: BEHAVIOUR TIMELINE + CHANGES
  // ═══════════════════════════════════════════

  /** Chronological behaviour snapshots (compare to past self, §17). */
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
   * Detect a meaningful behaviour change vs. the earlier baseline (§15).
   * @returns {Array<{ metric, from, to, reason, recommendation }>}
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
      if (Math.abs(delta) < 8) return; // ignore noise

      // For risk, a rise is bad; for others, a drop is bad
      const worse = m.invert ? delta > 0 : delta < 0;
      changes.push({
        metric: m.label,
        from: Math.round(from),
        to: Math.round(to),
        direction: worse ? 'declined' : 'improved',
        reason: this._changeReason(m.label, worse),
        recommendation: this._changeRecommendation(m.label, worse)
      });
    });

    // Most significant first
    return changes.sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from));
  },


  // ═══════════════════════════════════════════
  // §18: BEHAVIOUR PREDICTION (each with confidence)
  // ═══════════════════════════════════════════

  /**
   * Forecast likely behavioural risks on the next mock.
   * @returns {Array<{ risk, likelihood, confidence, evidence }>}
   */
  predictBehaviour() {
    const snaps = this._getSnapshots();
    if (snaps.length < 2) return [];

    const preds = [];
    const share = (fn) => snaps.filter(fn).length / snaps.length;
    const conf = snaps.length >= 5 ? 'high' : snaps.length >= 3 ? 'medium' : 'low';

    // Careless mistakes
    const carelessShare = share(s => s.dominantMistake === 'careless' || s.dominantMistake === 'guess');
    if (carelessShare >= 0.4) {
      preds.push({ risk: 'Careless mistakes', likelihood: Math.round(carelessShare * 100), confidence: conf,
        evidence: `Careless/guess was your dominant error in ${Math.round(carelessShare * 100)}% of recent tests.` });
    }

    // Panic / pressure collapse
    const collapseShare = share(s => s.pressure?.hasPressureCollapse);
    if (collapseShare >= 0.3) {
      preds.push({ risk: 'End-of-test panic', likelihood: Math.round(collapseShare * 100), confidence: conf,
        evidence: `Accuracy collapsed in the second half in ${Math.round(collapseShare * 100)}% of recent tests.` });
    }

    // Fatigue
    const lowFocusShare = share(s => (s.focusScore ?? 100) < 55);
    if (lowFocusShare >= 0.4) {
      preds.push({ risk: 'Focus / fatigue drop', likelihood: Math.round(lowFocusShare * 100), confidence: conf,
        evidence: `Focus score was below 55 in ${Math.round(lowFocusShare * 100)}% of recent tests.` });
    }

    // Streak break (from LearningIntelligence predictions)
    if (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.getPredictions) {
      const sr = LearningIntelligence.getPredictions().streakRisk;
      if (sr && sr.risk !== 'low') {
        preds.push({ risk: 'Streak break', likelihood: sr.risk === 'high' ? 75 : 50, confidence: sr.confidence || 'medium',
          evidence: sr.message });
      }
    }

    return preds;
  },


  // ═══════════════════════════════════════════
  // FULL ANALYSIS (for result page) + PERSIST
  // ═══════════════════════════════════════════

  /** One call — everything for a single test result. */
  getFullBehaviourAnalysis(result) {
    return {
      score:      this.getBehaviourScore(result),
      risk:       this.analyzeRisk(result),
      drift:      this.analyzeAttentionDrift(result),
      recovery:   this.analyzeRecovery(result),
      panic:      this.detectPanic(result),
      decisions:  this.classifyDecisions(result),
      fatigue:    this.analyzeFatigue(result),
      calibration:this.getCalibration()
    };
  },

  /**
   * Persist a behaviour snapshot. Called from test.js submit hook.
   * @param {object} result
   */
  processResult(result) {
    if (!result || !result.questionResults) return;
    try {
      const score = this.getBehaviourScore(result);
      const risk = this.analyzeRisk(result);
      const recovery = this.analyzeRecovery(result);
      const panic = this.detectPanic(result);
      const decisions = this.classifyDecisions(result);
      const focus = (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.calculateFocusScore)
        ? LearningIntelligence.calculateFocusScore(result).score : null;
      const pressure = (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.analyzePressure)
        ? LearningIntelligence.analyzePressure(result) : null;
      const mistakes = (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.classifyAllMistakes)
        ? LearningIntelligence.classifyAllMistakes(result) : { dominant: null };

      const raw = localStorage.getItem(this.STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : { snapshots: [] };
      if (!Array.isArray(data.snapshots)) data.snapshots = [];

      data.snapshots.push({
        date: new Date().toISOString(),
        accuracy: result.accuracy,
        behaviourScore: score.score,
        focusScore: focus,
        riskIndex: risk.riskIndex,
        recoveryRate: recovery.recoveryRate,
        decisionQuality: decisions.quality,
        panic: panic.detected,
        pressure,
        dominantMistake: mistakes.dominant
      });

      if (data.snapshots.length > 30) data.snapshots = data.snapshots.slice(-30);
      data.updatedAt = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[CognitiveBehaviour] Snapshot save error:', e.message);
    }
  },


  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  _getSnapshots() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      return Array.isArray(data?.snapshots) ? data.snapshots : [];
    } catch (e) {
      return [];
    }
  },

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

  _stdDev(arr) {
    if (arr.length === 0) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length;
    return Math.sqrt(variance);
  },

  _clamp(n) {
    return Math.max(0, Math.min(100, Math.round(n)));
  },

  _changeReason(label, worse) {
    const reasons = {
      'Focus':          worse ? 'Recent tests show more rapid guessing and long pauses — a sign of divided attention or late-night study.' : 'Fewer rapid guesses and steadier timing recently.',
      'Behaviour Score':worse ? 'Several behaviour components softened together across recent tests.' : 'Your decision-making and focus improved together recently.',
      'Risk':           worse ? 'You\'ve been attempting more uncertain questions lately.' : 'You\'ve become more selective about which questions to attempt.',
      'Recovery':       worse ? 'Mistakes have been snowballing more than before.' : 'You\'re bouncing back from mistakes better than before.'
    };
    return reasons[label] || '';
  },

  _changeRecommendation(label, worse) {
    if (!worse) return 'Keep doing what changed — it\'s working.';
    const recs = {
      'Focus':          'Try studying earlier in the day and take a short break at the halfway mark of long mocks.',
      'Behaviour Score':'Pick one component — usually Focus or Recovery — and target it for the next three mocks.',
      'Risk':           'Tighten your attempt rule: only answer when you can eliminate at least two options.',
      'Recovery':       'After a wrong answer, pause for one breath before the next question to stop the spiral.'
    };
    return recs[label] || '';
  }
};

window.CognitiveBehaviour = CognitiveBehaviour;
