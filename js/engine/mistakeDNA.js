// ============================================
// MISTAKE DNA ENGINE — Doc 20
// Every mistake has a root cause.
//
// NO API. NO LLM. Pure computation from the
// user's own test results + localStorage history.
//
// A wrong answer is not the problem — WHY the
// student got it wrong is. This engine assigns
// every mistake a root cause, measures how many
// marks each cause is leaking, and prescribes the
// smallest fix with the biggest score impact.
//
// Reuses the canonical 6-cause vocabulary shared
// with LearningProfile / LearningIntelligence:
//   concept | calculation | reading | guess |
//   timePressure | careless   (+ a 'skipped' bucket)
//
// Every finding carries evidence + a recommendation.
// Nothing is hallucinated.
// ============================================

const MistakeDNA = {

  STORAGE_KEY: 'mtp_mistake_dna',

  // Root-cause metadata — label, colour, and the single smallest fix.
  CAUSE_META: {
    concept:      { label: 'Concept Gap',   color: '#8B5CF6', fix: 'Relearn the underlying concept before doing more practice on it.' },
    calculation:  { label: 'Calculation',   color: '#F59E0B', fix: 'Slow down on the arithmetic step and verify the number before moving on.' },
    reading:      { label: 'Reading Error',  color: '#3B82F6', fix: 'Read the full stem; underline negatives (NOT / EXCEPT) and units.' },
    guess:        { label: 'Blind Guess',    color: '#EF4444', fix: 'If you are truly unsure and marking is negative, skip instead of guessing.' },
    timePressure: { label: 'Time Pressure',  color: '#EC4899', fix: 'Budget time per question so easy marks are not lost at the end.' },
    careless:     { label: 'Carelessness',   color: '#10B981', fix: 'Re-check that the option you clicked matches the one you actually solved.' },
    skipped:      { label: 'Skipped',        color: '#6B7280', fix: 'Attempt more — some of these skips were recoverable marks.' }
  },

  // §3 Level 2 sub-classification metadata
  CAUSE_LEVEL2: {
    concept:      ['conceptMissing', 'formulaMissing', 'ruleConfusion', 'exceptionUnknown'],
    calculation:  ['arithmeticSlip', 'unitConversion', 'decimalError', 'signError'],
    reading:      ['skippedKeyword', 'ignoredNot', 'misreadNumber', 'readTooFast'],
    guess:        ['educatedGuess', 'luckyGuess', 'blindGuess', 'strategicSkip', 'forcedGuess'],
    timePressure: ['ranOutOfTime', 'rushedEnd', 'tooSlowEarly'],
    careless:     ['wrongOption', 'transcriptionError', 'doubleNegative'],
    skipped:      ['deliberateSkip', 'ranOut']
  },

  // §6 Severity thresholds
  SEVERITY_THRESHOLDS: {
    critical: { minFreq: 5, minMarks: 8 },
    high:     { minFreq: 3, minMarks: 5 },
    medium:   { minFreq: 2, minMarks: 2 },
    low:      { minFreq: 0, minMarks: 0 }
  },

  ORDER: ['concept', 'calculation', 'reading', 'guess', 'timePressure', 'careless', 'skipped'],


  // ═══════════════════════════════════════════
  // §3 ROOT CAUSE ENGINE
  // ═══════════════════════════════════════════

  /**
   * Assign a single root cause to one question result.
   * Confidence overrides timing: a confident-but-wrong answer is a
   * misconception (concept), not a timing artefact — Doc 20 §9.
   * @param {object} qr - questionResult { question, isCorrect, isSkipped, timeSpent }
   * @param {number} medianTime - median timeSpent across attempted questions
   * @param {string|null} confidence - 'confident' | 'unsure' | 'guess' | null
   * @returns {string|null} cause key, or null if the answer was correct
   */
  rootCause(qr, medianTime, confidence) {
    if (!qr || qr.isCorrect) return null;
    if (qr.isSkipped) return 'skipped';

    // Confident + wrong → false mastery (§9). Highest-priority signal.
    if (confidence === 'confident') return 'concept';

    // Otherwise reuse the shared timing classifier so causes stay consistent
    // with LearningIntelligence / LearningProfile.
    if (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.classifyMistake) {
      return LearningIntelligence.classifyMistake(qr, medianTime) || 'reading';
    }
    return this._timingCause(qr, medianTime);
  },

  // Fallback timing classifier (mirrors LearningIntelligence.classifyMistake).
  _timingCause(qr, medianTime) {
    const time = qr.timeSpent || 0;
    const ratio = medianTime > 0 ? time / medianTime : 1;
    if (time < 5) return 'guess';
    if (ratio < 0.4) return 'careless';
    if (ratio > 2.0) return 'concept';
    if (ratio > 1.3) return 'calculation';
    if (time < 3 && medianTime > 15) return 'timePressure';
    return 'reading';
  },


  // ═══════════════════════════════════════════
  // §22 + §34 SCORE LEAKAGE MAP  (flagship)
  // "Where are my marks leaking, and what is the
  //  fastest way to recover them?"
  // ═══════════════════════════════════════════

  /**
   * Build the Score Leakage Map for a single test.
   * @param {object} result - TestEngine result
   * @returns {{
   *   ready, currentScore, maxMarks, potentialScore, recoverableMarks,
   *   leaks: [{ cause, label, color, marks, count, fix }],
   *   topLeak, insight
   * }}
   */
  getScoreLeakageMap(result) {
    if (!result || !result.questionResults || result.questionResults.length < 5) {
      return { ready: false, leaks: [] };
    }

    const qr = result.questionResults;
    const marksPerQ = result.marksPerQuestion || 1;
    const neg = result.negativeMarking ? (result.negativeValue || 0) : 0;
    const medianTime = this._median(qr.filter(q => !q.isSkipped).map(q => q.timeSpent));
    const confMap = this._confidenceMap(result);

    // marks + count per cause
    const buckets = {};
    qr.forEach(q => {
      const cause = this.rootCause(q, medianTime, confMap[this._qid(q)]);
      if (!cause) return; // correct answer — no leak
      // Wrong: you forfeit the mark AND eat the negative penalty.
      // Skipped: opportunity cost of the mark only (no penalty incurred).
      const leak = cause === 'skipped' ? marksPerQ : marksPerQ + neg;
      if (!buckets[cause]) buckets[cause] = { marks: 0, count: 0 };
      buckets[cause].marks += leak;
      buckets[cause].count += 1;
    });

    const leaks = Object.entries(buckets)
      .map(([cause, b]) => ({
        cause,
        label: this.CAUSE_META[cause].label,
        color: this.CAUSE_META[cause].color,
        fix: this.CAUSE_META[cause].fix,
        marks: Math.round(b.marks * 100) / 100,
        count: b.count
      }))
      .sort((a, b) => b.marks - a.marks);

    const currentScore = Math.round((result.totalMarks || 0) * 100) / 100;
    const maxMarks = result.maxMarks || (result.totalQuestions * marksPerQ);
    const recoverableMarks = Math.round(leaks.reduce((s, l) => s + l.marks, 0) * 100) / 100;
    const potentialScore = Math.min(maxMarks, Math.round((currentScore + recoverableMarks) * 100) / 100);

    const topLeak = leaks[0] || null;
    let insight = 'No marks leaking from a single dominant cause — a balanced performance.';
    if (topLeak) {
      insight = `Your biggest leak is ${topLeak.label.toLowerCase()} — ${topLeak.marks} mark${topLeak.marks === 1 ? '' : 's'} across ${topLeak.count} question${topLeak.count === 1 ? '' : 's'}. Fixing this alone recovers the most, fastest.`;
    }

    return { ready: true, currentScore, maxMarks, potentialScore, recoverableMarks, leaks, topLeak, insight };
  },


  // ═══════════════════════════════════════════
  // §9 §10 §17 CONFIDENCE MISTAKES
  // ═══════════════════════════════════════════

  /**
   * High-confidence-wrong (false mastery) + low-confidence-correct
   * (untrusted knowledge) for THIS test, plus the all-time matrix.
   * Depends on wasCorrect being backfilled at submit (see test.js).
   */
  analyzeConfidence(result) {
    const out = {
      ready: false,
      highConfWrong: [], lowConfCorrect: [],
      matrix: { highWrong: 0, highRight: 0, lowWrong: 0, lowRight: 0, total: 0 },
      insight: ''
    };
    if (!result || !result.questionResults) return out;

    const confMap = this._confidenceMap(result);
    const qr = result.questionResults;
    let tagged = 0;

    qr.forEach(q => {
      if (q.isSkipped) return;
      const c = confMap[this._qid(q)];
      if (!c) return;
      tagged++;
      const high = c === 'confident';
      if (high && !q.isCorrect) out.highConfWrong.push(this._topicOf(q));
      if (!high && q.isCorrect) out.lowConfCorrect.push(this._topicOf(q));
    });

    // All-time matrix from the (now backfilled) confidence log.
    const log = (typeof Storage !== 'undefined' && Storage.getConfidenceLog) ? Storage.getConfidenceLog() : [];
    log.forEach(e => {
      if (e.wasCorrect === null || e.wasCorrect === undefined) return;
      const high = e.confidence === 'confident';
      out.matrix.total++;
      if (high && e.wasCorrect) out.matrix.highRight++;
      else if (high && !e.wasCorrect) out.matrix.highWrong++;
      else if (!high && e.wasCorrect) out.matrix.lowRight++;
      else out.matrix.lowWrong++;
    });

    out.ready = tagged >= 3 || out.matrix.total >= 5;

    const parts = [];
    if (out.highConfWrong.length > 0) {
      parts.push(`${out.highConfWrong.length} answer${out.highConfWrong.length === 1 ? ' you were' : 's you were'} sure about ${out.highConfWrong.length === 1 ? 'was' : 'were'} wrong — this is false mastery, the most dangerous kind of gap. Review these first.`);
    }
    if (out.lowConfCorrect.length > 0) {
      parts.push(`${out.lowConfCorrect.length} answer${out.lowConfCorrect.length === 1 ? '' : 's'} you doubted turned out correct — trust your preparation more and stop second-guessing.`);
    }
    out.insight = parts.join(' ') || 'Your confidence is well-calibrated on this test.';
    return out;
  },


  // ═══════════════════════════════════════════
  // §23 ERROR CASCADE
  // A wrong answer followed by a run of wrongs =
  // a confidence collapse, not N independent gaps.
  // ═══════════════════════════════════════════

  detectErrorCascade(result) {
    const out = { detected: false, startIndex: -1, length: 0, insight: '' };
    if (!result || !result.questionResults || result.questionResults.length < 6) return out;

    const qr = result.questionResults;
    let runStart = -1, run = 0, best = 0, bestStart = -1;
    qr.forEach((q, i) => {
      const wrong = !q.isCorrect && !q.isSkipped;
      if (wrong) {
        if (run === 0) runStart = i;
        run++;
        if (run > best) { best = run; bestStart = runStart; }
      } else {
        run = 0;
      }
    });

    // A cascade is a slump of 3+ consecutive wrongs that starts after the
    // student had been answering (i.e. not the very first question).
    if (best >= 3 && bestStart > 0) {
      out.detected = true;
      out.startIndex = bestStart;
      out.length = best;
      out.insight = `Your accuracy collapsed after question ${bestStart + 1} — ${best} wrong in a row. That pattern is a confidence drop, not ${best} separate knowledge gaps. Take a 20-second reset after a hard question before continuing.`;
    }
    return out;
  },


  // ═══════════════════════════════════════════
  // §7 REPEAT / PERSISTENT WEAKNESS
  // Same topic + same cause, 3+ times across tests.
  // ═══════════════════════════════════════════

  getRepeatMistakes() {
    const snaps = this._getSnapshots();
    if (snaps.length < 2) return [];

    const tally = {}; // "topic|cause" -> { topic, subject, cause, count }
    snaps.forEach(s => {
      (s.topicCauses || []).forEach(tc => {
        const key = `${tc.topic}|${tc.cause}`;
        if (!tally[key]) tally[key] = { topic: tc.topic, subject: tc.subject, cause: tc.cause, count: 0 };
        tally[key].count += (tc.count || 1);
      });
    });

    return Object.values(tally)
      .filter(t => t.count >= 3 && t.cause !== 'skipped')
      .sort((a, b) => b.count - a.count)
      .map(t => ({
        ...t,
        label: this.CAUSE_META[t.cause].label,
        color: this.CAUSE_META[t.cause].color,
        insight: `${t.topic} — ${this.CAUSE_META[t.cause].label.toLowerCase()} has repeated ${t.count} times. This is a persistent weakness; ${this.CAUSE_META[t.cause].fix}`
      }));
  },


  // ═══════════════════════════════════════════
  // §18 §19 RECOVERY SCORE
  // Recovered / total, from subject-accuracy deltas
  // across snapshot history.
  // ═══════════════════════════════════════════

  getRecoveryScore() {
    const snaps = this._getSnapshots();
    if (snaps.length < 2) return { ready: false, recoveryRate: 0, recovered: 0, tracked: 0, subjects: [] };

    // For each subject: first accuracy where it was weak (<60) vs latest accuracy.
    const first = {}, latest = {};
    snaps.forEach(s => {
      Object.entries(s.subjectAccuracy || {}).forEach(([subj, acc]) => {
        if (first[subj] === undefined) first[subj] = acc;
        latest[subj] = acc;
      });
    });

    const subjects = [];
    let recovered = 0, tracked = 0;
    Object.keys(first).forEach(subj => {
      if (first[subj] < 60) {
        tracked++;
        const improved = latest[subj] - first[subj];
        const isRecovered = latest[subj] >= 60 || improved >= 15;
        if (isRecovered) recovered++;
        subjects.push({ subject: subj, from: first[subj], to: latest[subj], recovered: isRecovered });
      }
    });

    const recoveryRate = tracked > 0 ? Math.round((recovered / tracked) * 100) : 0;
    return { ready: tracked > 0, recoveryRate, recovered, tracked, subjects };
  },


  // ═══════════════════════════════════════════
  // §27 PERSONAL RULES ENGINE
  // Turns dominant patterns into a personal playbook.
  // ═══════════════════════════════════════════

  getPersonalRules(result) {
    const rules = [];
    const leak = this.getScoreLeakageMap(result);
    const conf = this.analyzeConfidence(result);
    const cascade = this.detectErrorCascade(result);
    const state = (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.detectState)
      ? LearningIntelligence.detectState(result) : { state: 'unknown' };

    const top = leak.topLeak;
    if (top && top.cause === 'reading') {
      rules.push({ id: 'reading', rule: 'Read every stem twice and underline NOT / EXCEPT / units before answering.', evidence: `Reading errors leaked ${top.marks} marks this test.` });
    }
    if (top && top.cause === 'careless') {
      rules.push({ id: 'careless', rule: 'Before locking an answer, confirm the option you clicked is the one you solved.', evidence: `Carelessness leaked ${top.marks} marks this test.` });
    }
    if (leak.leaks.some(l => l.cause === 'guess' && l.count >= 3)) {
      rules.push({ id: 'guess', rule: 'When genuinely unsure under negative marking, skip instead of guessing.', evidence: `${leak.leaks.find(l => l.cause === 'guess').count} blind guesses this test.` });
    }
    if (conf.highConfWrong.length >= 1) {
      rules.push({ id: 'falseMastery', rule: 'Re-verify topics you feel sure about — your confident answers are where hidden misconceptions live.', evidence: `${conf.highConfWrong.length} confident answer${conf.highConfWrong.length === 1 ? ' was' : 's were'} wrong.` });
    }
    if (cascade.detected) {
      rules.push({ id: 'reset', rule: 'After a hard question, take a 20-second reset before the next one.', evidence: `A ${cascade.length}-question slump started after Q${cascade.startIndex + 1}.` });
    }
    if (state.state === 'fatigued') {
      rules.push({ id: 'fatigue', rule: 'Your accuracy drops in the second half — practise full-length timed sets to build stamina.', evidence: 'Late-test accuracy fell noticeably.' });
    }
    return rules;
  },


  // ═══════════════════════════════════════════
  // §20 PERSONAL CORRECTION PLAN
  // One specific, small prescription — not "study more".
  // ═══════════════════════════════════════════

  getCorrectionPlan(result) {
    const leak = this.getScoreLeakageMap(result);
    if (!leak.ready || !leak.topLeak) return null;

    const cause = leak.topLeak.cause;
    const weakSubject = (typeof LearningProfile !== 'undefined')
      ? (LearningProfile.get().weakestSubject || result.weakTopics?.[0]?.subject)
      : result.weakTopics?.[0]?.subject;
    const weakTopic = result.weakTopics?.[0]?.topic || weakSubject || 'your weakest topic';

    const steps = [];
    if (cause === 'concept') {
      steps.push(`Relearn ${weakTopic} from notes/video (20 min)`);
      steps.push(`10 practice questions on ${weakTopic}`);
      steps.push('1 short timed set to confirm the fix');
    } else if (cause === 'reading' || cause === 'careless') {
      steps.push('5 reading-accuracy drills (mark NOT/EXCEPT/units)');
      steps.push(`10 mixed questions on ${weakTopic}, no time pressure`);
      steps.push('1 timed mock, re-reading each stem once');
    } else if (cause === 'timePressure' || cause === 'guess') {
      steps.push('2 sectional timed sets with a per-question time cap');
      steps.push('Practise the skip-and-return strategy');
      steps.push('1 full timed mock');
    } else {
      steps.push(`10 targeted questions on ${weakTopic}`);
      steps.push('Review each mistake\'s root cause');
      steps.push('1 short timed set');
    }

    return {
      cause,
      label: leak.topLeak.label,
      headline: `Fix your #1 leak (${leak.topLeak.label}) over the next 3 days:`,
      steps,
      expectedGain: leak.topLeak.marks
    };
  },


  // ═══════════════════════════════════════════
  // §28 AI COACH SUMMARY (one paragraph, specific)
  // ═══════════════════════════════════════════

  getCoachSummary(result) {
    const leak = this.getScoreLeakageMap(result);
    if (!leak.ready || leak.leaks.length === 0) {
      return 'No significant mark leakage this test — keep the momentum going.';
    }
    const top3 = leak.leaks.slice(0, 3)
      .map(l => `${l.marks} mark${l.marks === 1 ? '' : 's'} from ${l.label.toLowerCase()}`)
      .join(', ');
    const lead = leak.topLeak;
    return `You lost ${leak.recoverableMarks} recoverable mark${leak.recoverableMarks === 1 ? '' : 's'} this test — ${top3}. Fixing ${lead.label.toLowerCase()} alone is likely to lift your next mock by roughly ${Math.max(1, Math.round(lead.marks * 0.6))}–${Math.ceil(lead.marks)} marks.`;
  },


  // ═══════════════════════════════════════════
  // §3 LEVEL 2 SUB-CLASSIFICATION
  // ═══════════════════════════════════════════

  /**
   * Determine a Level 2 sub-cause from timing, confidence, and question metadata.
   * @param {object} qr - questionResult
   * @param {number} medianTime
   * @param {string|null} confidence
   * @param {string} level1Cause - already-determined Level 1 cause
   * @returns {string} Level 2 sub-cause key
   */
  rootCauseLevel2(qr, medianTime, confidence, level1Cause) {
    if (!level1Cause || !qr) return null;
    const time = qr.timeSpent || 0;
    const ratio = medianTime > 0 ? time / medianTime : 1;
    const q = qr.question || {};
    const stem = (q.question || '').toLowerCase();

    switch (level1Cause) {
      case 'concept':
        if (confidence === 'confident') return 'ruleConfusion';
        if (q.formula) return 'formulaMissing';
        if (stem.includes('except') || stem.includes('not applicable')) return 'exceptionUnknown';
        return 'conceptMissing';
      case 'calculation':
        if (stem.includes('%') || stem.includes('percent')) return 'arithmeticSlip';
        if (stem.includes('unit') || stem.includes('cm') || stem.includes('kg')) return 'unitConversion';
        if (stem.includes('.') || stem.includes('decimal')) return 'decimalError';
        return 'arithmeticSlip';
      case 'reading':
        if (stem.includes('not') || stem.includes('except') || stem.includes('false')) return 'ignoredNot';
        if (/\d/.test(stem) && ratio < 0.5) return 'misreadNumber';
        if (ratio < 0.4) return 'readTooFast';
        return 'skippedKeyword';
      case 'guess':
        return this._classifyGuessLevel2(qr, medianTime, confidence);
      case 'timePressure':
        if (ratio > 3.0) return 'tooSlowEarly';
        if (time < 5) return 'rushedEnd';
        return 'ranOutOfTime';
      case 'careless':
        if (confidence === 'confident') return 'wrongOption';
        if (stem.includes('not') && stem.includes('un')) return 'doubleNegative';
        return 'transcriptionError';
      case 'skipped':
        return time > 3 ? 'deliberateSkip' : 'ranOut';
      default:
        return null;
    }
  },


  // ═══════════════════════════════════════════
  // §6 MISTAKE SEVERITY
  // ═══════════════════════════════════════════

  /**
   * Assign severity label to a mistake cause based on its impact.
   * @param {number} frequency - how many times this cause appeared
   * @param {number} marksLost - total marks lost to this cause
   * @param {boolean} isRepeat - whether it repeats across tests
   * @param {boolean} isHighConfWrong - false mastery signal
   * @returns {string} 'critical' | 'high' | 'medium' | 'low'
   */
  getSeverity(frequency, marksLost, isRepeat, isHighConfWrong) {
    if (isHighConfWrong && marksLost >= 5) return 'critical';
    if (isRepeat && frequency >= this.SEVERITY_THRESHOLDS.critical.minFreq) return 'critical';
    if (marksLost >= this.SEVERITY_THRESHOLDS.critical.minMarks) return 'critical';
    if (isRepeat || frequency >= this.SEVERITY_THRESHOLDS.high.minFreq) return 'high';
    if (marksLost >= this.SEVERITY_THRESHOLDS.high.minMarks) return 'high';
    if (frequency >= this.SEVERITY_THRESHOLDS.medium.minFreq) return 'medium';
    return 'low';
  },

  /**
   * Get severity-tagged leakage map for a result.
   */
  getSeverityTaggedLeaks(result) {
    const leak = this.getScoreLeakageMap(result);
    if (!leak.ready) return leak;
    const repeats = this.getRepeatMistakes();
    const repeatCauses = new Set(repeats.map(r => r.cause));
    const conf = this.analyzeConfidence(result);
    const hasHighConfWrong = conf.highConfWrong.length > 0;

    leak.leaks = leak.leaks.map(l => ({
      ...l,
      severity: this.getSeverity(
        l.count,
        l.marks,
        repeatCauses.has(l.cause),
        hasHighConfWrong && l.cause === 'concept'
      )
    }));
    return leak;
  },


  // ═══════════════════════════════════════════
  // §11 GUESS INTELLIGENCE
  // ═══════════════════════════════════════════

  /**
   * Sub-classify a guess into 5 types.
   */
  _classifyGuessLevel2(qr, medianTime, confidence) {
    const time = qr.timeSpent || 0;
    const ratio = medianTime > 0 ? time / medianTime : 1;

    // Strategic skip: student deliberately skipped (time > 3s but marked skip)
    if (qr.isSkipped && time > 3) return 'strategicSkip';
    // Forced guess: very last questions, ran out of time
    if (ratio < 0.1 && time < 3) return 'forcedGuess';
    // Blind guess: almost no time spent
    if (time < 5 && confidence !== 'unsure') return 'blindGuess';
    // Educated guess: spent reasonable time + marked unsure
    if (confidence === 'unsure' && ratio >= 0.3) return 'educatedGuess';
    // Lucky guess: answered correctly by chance (would be filtered out by rootCause returning null for correct)
    // For wrong answers that feel like guesses:
    if (time < 8 && ratio < 0.5) return 'blindGuess';
    return 'educatedGuess';
  },

  /**
   * Get guess distribution for a test result.
   */
  getGuessAnalysis(result) {
    if (!result || !result.questionResults) return { ready: false, types: {} };
    const qr = result.questionResults;
    const medianTime = this._median(qr.filter(q => !q.isSkipped).map(q => q.timeSpent));
    const confMap = this._confidenceMap(result);
    const types = {};

    qr.forEach(q => {
      const cause = this.rootCause(q, medianTime, confMap[this._qid(q)]);
      if (cause !== 'guess' && cause !== 'skipped') return;
      const subType = this._classifyGuessLevel2(q, medianTime, confMap[this._qid(q)]);
      if (!types[subType]) types[subType] = 0;
      types[subType]++;
    });

    return { ready: Object.keys(types).length > 0, types };
  },


  // ═══════════════════════════════════════════
  // §13 FULL PATTERN DETECTOR
  // ═══════════════════════════════════════════

  /**
   * Find behavioural sequences: collapse, recovery, improving.
   */
  detectPatterns(result) {
    const patterns = [];
    if (!result || !result.questionResults || result.questionResults.length < 6) return patterns;
    const qr = result.questionResults;

    // Sliding window: detect 3+ wrong in a row (collapse)
    let run = 0, runStart = -1;
    qr.forEach((q, i) => {
      if (!q.isCorrect && !q.isSkipped) {
        if (run === 0) runStart = i;
        run++;
        if (run >= 3) {
          // Check if not already detected
          if (!patterns.find(p => p.type === 'collapse' && p.startIndex === runStart)) {
            patterns.push({
              type: 'collapse',
              startIndex: runStart,
              length: run,
              insight: `${run} wrong in a row from Q${runStart + 1} — confidence collapse.`
            });
          } else {
            // Update length
            const existing = patterns.find(p => p.type === 'collapse' && p.startIndex === runStart);
            if (existing) existing.length = run;
          }
        }
      } else {
        run = 0;
      }
    });

    // Detect Wrong → Review → Correct (learning works) across snapshots
    const snaps = this._getSnapshots();
    if (snaps.length >= 3) {
      const recent3 = snaps.slice(-3);
      recent3.forEach((snap, i) => {
        if (i < 2 && snap.accuracy < recent3[i + 1].accuracy) {
          const delta = recent3[i + 1].accuracy - snap.accuracy;
          if (delta >= 5) {
            patterns.push({
              type: 'recovery',
              improvement: delta,
              insight: `Accuracy improved by ${delta}% between recent tests — learning is working.`
            });
          }
        }
      });
    }

    // Detect improving streak (3+ tests with increasing accuracy)
    if (snaps.length >= 3) {
      const last3 = snaps.slice(-3).map(s => s.accuracy);
      if (last3[0] < last3[1] && last3[1] < last3[2]) {
        patterns.push({
          type: 'improving',
          streak: 3,
          insight: `3 consecutive tests with improving accuracy — strong upward trajectory.`
        });
      }
    }

    return patterns;
  },


  // ═══════════════════════════════════════════
  // §14 CHAPTER HEATMAP
  // ═══════════════════════════════════════════

  /**
   * Per-topic accuracy breakdown from current + historical data.
   * Returns [{topic, subject, correct, wrong, accuracy, cause}]
   */
  getChapterHeatmap(result) {
    const topics = {};

    // Current test
    if (result && result.questionResults) {
      const qr = result.questionResults;
      const medianTime = this._median(qr.filter(q => !q.isSkipped).map(q => q.timeSpent));
      const confMap = this._confidenceMap(result);

      qr.forEach(q => {
        if (q.isSkipped) return;
        const topic = this._topicOf(q);
        const subject = q.question ? q.question.subject : '';
        if (!topics[topic]) topics[topic] = { topic, subject, correct: 0, wrong: 0, dominantCause: {} };
        if (q.isCorrect) {
          topics[topic].correct++;
        } else {
          topics[topic].wrong++;
          const cause = this.rootCause(q, medianTime, confMap[this._qid(q)]);
          if (cause) {
            topics[topic].dominantCause[cause] = (topics[topic].dominantCause[cause] || 0) + 1;
          }
        }
      });
    }

    // Enrich from historical snapshots
    const snaps = this._getSnapshots();
    snaps.forEach(s => {
      (s.topicCauses || []).forEach(tc => {
        if (!topics[tc.topic]) topics[tc.topic] = { topic: tc.topic, subject: tc.subject || '', correct: 0, wrong: 0, dominantCause: {} };
        topics[tc.topic].dominantCause[tc.cause] = (topics[tc.topic].dominantCause[tc.cause] || 0) + (tc.count || 1);
      });
    });

    return Object.values(topics)
      .map(t => {
        const attempted = t.correct + t.wrong;
        const accuracy = attempted > 0 ? Math.round((t.correct / attempted) * 100) : 0;
        // Find dominant cause
        const causeSorted = Object.entries(t.dominantCause).sort((a, b) => b[1] - a[1]);
        const topCause = causeSorted[0] ? causeSorted[0][0] : null;
        return { ...t, accuracy, attempted, topCause, dominantCause: undefined };
      })
      .filter(t => t.attempted > 0)
      .sort((a, b) => a.accuracy - b.accuracy);
  },


  // ═══════════════════════════════════════════
  // §15 FORMULA WEAKNESS
  // ═══════════════════════════════════════════

  /**
   * Track formula-related weaknesses from concept-cause mistakes.
   */
  getFormulaWeakness() {
    const snaps = this._getSnapshots();
    const formulaTopics = {};

    snaps.forEach(s => {
      (s.topicCauses || []).forEach(tc => {
        if (tc.cause === 'concept' || tc.cause === 'calculation') {
          const key = tc.topic;
          if (!formulaTopics[key]) formulaTopics[key] = { topic: tc.topic, subject: tc.subject || '', count: 0, tests: 0 };
          formulaTopics[key].count += (tc.count || 1);
          formulaTopics[key].tests++;
        }
      });
    });

    return Object.values(formulaTopics)
      .filter(t => t.count >= 2)
      .sort((a, b) => b.count - a.count)
      .map(t => ({
        ...t,
        stage: t.count >= 5 ? 'neverApplied' :
               t.count >= 3 ? 'usedWrong' :
               t.tests >= 2 ? 'forgotten' : 'seen',
        insight: `${t.topic}: formula errors appeared ${t.count} times across ${t.tests} test${t.tests === 1 ? '' : 's'}.`
      }));
  },


  // ═══════════════════════════════════════════
  // §16 READING WEAKNESS
  // ═══════════════════════════════════════════

  /**
   * Categorize reading errors from historical data.
   */
  getReadingWeakness() {
    const snaps = this._getSnapshots();
    let readingTotal = 0;
    const byTopic = {};

    snaps.forEach(s => {
      (s.topicCauses || []).forEach(tc => {
        if (tc.cause === 'reading' || tc.cause === 'careless') {
          readingTotal += (tc.count || 1);
          const key = tc.topic;
          if (!byTopic[key]) byTopic[key] = { topic: tc.topic, subject: tc.subject || '', count: 0 };
          byTopic[key].count += (tc.count || 1);
        }
      });
    });

    const topTopics = Object.values(byTopic).sort((a, b) => b.count - a.count).slice(0, 5);

    return {
      totalReadingErrors: readingTotal,
      affectedTopics: topTopics,
      insight: readingTotal >= 10
        ? `You have made ${readingTotal} reading/careless errors across your tests. The most affected topic is ${topTopics[0]?.topic || 'unknown'}.`
        : readingTotal > 0
          ? `${readingTotal} reading/careless errors recorded so far — keep an eye on this.`
          : 'No significant reading errors detected yet.'
    };
  },


  // ═══════════════════════════════════════════
  // §21 MISTAKE SIMULATOR
  // "If reading errors reduce 20% → +X marks"
  // ═══════════════════════════════════════════

  /**
   * Predict score improvement if a cause is reduced by a percentage.
   * @param {object} result - current test result
   * @param {string} cause - root cause to simulate fixing
   * @param {number} reductionPct - 0-100, how much to reduce (e.g. 50 = fix half)
   * @returns {{ cause, label, currentMarksLost, reduction, expectedGain, newProjectedScore }}
   */
  simulateImprovement(result, cause, reductionPct) {
    const leak = this.getScoreLeakageMap(result);
    if (!leak.ready) return null;

    const leakItem = leak.leaks.find(l => l.cause === cause);
    if (!leakItem) return null;

    const reduction = Math.round((reductionPct / 100) * leakItem.marks * 100) / 100;
    const newProjectedScore = Math.min(leak.maxMarks, Math.round((leak.currentScore + reduction) * 100) / 100);

    return {
      cause,
      label: leakItem.label,
      currentMarksLost: leakItem.marks,
      reductionPct,
      expectedGain: reduction,
      newProjectedScore,
      insight: `If your ${leakItem.label.toLowerCase()} errors reduce by ${reductionPct}%, your expected score rises from ${leak.currentScore} to ${newProjectedScore} (+${reduction} marks).`
    };
  },

  /**
   * Get simulations for all causes at different reduction levels.
   */
  getSimulations(result) {
    const leak = this.getScoreLeakageMap(result);
    if (!leak.ready || leak.leaks.length === 0) return [];

    return leak.leaks
      .filter(l => l.cause !== 'skipped' && l.marks >= 1)
      .map(l => ({
        cause: l.cause,
        label: l.label,
        color: l.color,
        currentLost: l.marks,
        fix50: this.simulateImprovement(result, l.cause, 50),
        fix100: this.simulateImprovement(result, l.cause, 100)
      }));
  },


  // ═══════════════════════════════════════════
  // §24 MISTAKE TIMELINE
  // Per-cause trends across snapshots.
  // ═══════════════════════════════════════════

  /**
   * Returns per-cause counts over time from snapshot history.
   * @returns {{ dates: string[], causes: { [cause]: number[] }, dominantOverTime: string[] }}
   */
  getMistakeTimeline() {
    const snaps = this._getSnapshots();
    if (snaps.length < 2) return { ready: false, dates: [], causes: {}, dominantOverTime: [] };

    const dates = [];
    const causes = {};
    const dominantOverTime = [];

    this.ORDER.forEach(c => { causes[c] = []; });

    snaps.forEach(s => {
      dates.push(s.date ? s.date.slice(0, 10) : 'Unknown');
      dominantOverTime.push(s.dominantCause || 'none');

      // Tally causes from topicCauses
      const causeCounts = {};
      (s.topicCauses || []).forEach(tc => {
        causeCounts[tc.cause] = (causeCounts[tc.cause] || 0) + (tc.count || 1);
      });

      this.ORDER.forEach(c => {
        causes[c].push(causeCounts[c] || 0);
      });
    });

    return { ready: true, dates, causes, dominantOverTime };
  },


  // ═══════════════════════════════════════════
  // §25 TOPIC RECOVERY GRAPH
  // Week-by-week accuracy for a subject.
  // ═══════════════════════════════════════════

  /**
   * @param {string} subject - subject to track
   * @returns {{ ready, points: [{ date, accuracy }] }}
   */
  getTopicRecoveryGraph(subject) {
    const snaps = this._getSnapshots();
    if (snaps.length < 2) return { ready: false, points: [] };

    const points = [];
    snaps.forEach(s => {
      if (s.subjectAccuracy && s.subjectAccuracy[subject] !== undefined) {
        points.push({
          date: s.date ? s.date.slice(0, 10) : 'Unknown',
          accuracy: s.subjectAccuracy[subject]
        });
      }
    });

    return { ready: points.length >= 2, points, subject };
  },

  /**
   * Get recovery graphs for all tracked subjects.
   */
  getAllRecoveryGraphs() {
    const snaps = this._getSnapshots();
    if (snaps.length < 2) return [];

    // Collect all subjects that ever appeared
    const subjects = new Set();
    snaps.forEach(s => {
      Object.keys(s.subjectAccuracy || {}).forEach(sub => subjects.add(sub));
    });

    return Array.from(subjects)
      .map(sub => this.getTopicRecoveryGraph(sub))
      .filter(g => g.ready && g.points.length >= 2);
  },


  // ═══════════════════════════════════════════
  // §26 INTELLIGENT REVISION PRIORITY
  // Composite scoring for what to revise next.
  // ═══════════════════════════════════════════

  /**
   * Rank topics by revision urgency.
   * Priority = Frequency × Importance × Recency × RecoveryDifficulty × ConfidenceGap
   * @returns {Array} sorted by priority descending
   */
  getRevisionPriority() {
    const snaps = this._getSnapshots();
    if (snaps.length === 0) return [];

    // Gather per-topic stats
    const topics = {};
    snaps.forEach((s, snapIdx) => {
      (s.topicCauses || []).forEach(tc => {
        const key = tc.topic;
        if (!topics[key]) {
          topics[key] = {
            topic: tc.topic,
            subject: tc.subject || '',
            totalErrors: 0,
            firstSeen: snapIdx,
            lastSeen: snapIdx,
            cause: tc.cause,
            appearances: 0
          };
        }
        topics[key].totalErrors += (tc.count || 1);
        topics[key].lastSeen = snapIdx;
        topics[key].appearances++;
      });
    });

    const total = snaps.length;

    return Object.values(topics)
      .map(t => {
        // Frequency (0-1): how many errors
        const frequency = Math.min(1, t.totalErrors / 10);
        // Importance (0-1): concept gaps > reading > others
        const importanceMap = { concept: 1.0, calculation: 0.8, reading: 0.7, timePressure: 0.5, careless: 0.4, guess: 0.3, skipped: 0.2 };
        const importance = importanceMap[t.cause] || 0.5;
        // Recency (0-1): recent errors matter more
        const recency = total > 1 ? t.lastSeen / (total - 1) : 1;
        // Recovery difficulty (0-1): appeared in many tests = harder to fix
        const recoveryDifficulty = Math.min(1, t.appearances / Math.max(3, total));
        // Confidence gap (0-1): concept errors with confidence are worst
        const confidenceGap = t.cause === 'concept' ? 1.0 : 0.5;

        const priority = Math.round(
          (frequency * 30 + importance * 25 + recency * 20 + recoveryDifficulty * 15 + confidenceGap * 10)
        );

        return {
          ...t,
          priority,
          label: this.CAUSE_META[t.cause]?.label || t.cause,
          color: this.CAUSE_META[t.cause]?.color || '#6B7280'
        };
      })
      .filter(t => t.priority > 10)
      .sort((a, b) => b.priority - a.priority);
  },


  // ═══════════════════════════════════════════
  // FULL ANALYSIS (for Result Page)
  // ═══════════════════════════════════════════

  getFullAnalysis(result) {
    return {
      leakage: this.getSeverityTaggedLeaks(result),
      confidence: this.analyzeConfidence(result),
      cascade: this.detectErrorCascade(result),
      repeats: this.getRepeatMistakes(),
      recovery: this.getRecoveryScore(),
      rules: this.getPersonalRules(result),
      plan: this.getCorrectionPlan(result),
      coachSummary: this.getCoachSummary(result),
      chapterHeatmap: this.getChapterHeatmap(result),
      patterns: this.detectPatterns(result),
      simulations: this.getSimulations(result),
      timeline: this.getMistakeTimeline(),
      revisionPriority: this.getRevisionPriority(),
      guessAnalysis: this.getGuessAnalysis(result),
      formulaWeakness: this.getFormulaWeakness(),
      readingWeakness: this.getReadingWeakness()
    };
  },


  // ═══════════════════════════════════════════
  // PROCESS RESULT (called after every test)
  // ═══════════════════════════════════════════

  processResult(result) {
    if (!result || !result.questionResults) return;
    try {
      const qr = result.questionResults;
      const medianTime = this._median(qr.filter(q => !q.isSkipped).map(q => q.timeSpent));
      const confMap = this._confidenceMap(result);

      // Per-topic root-cause tally for repeat detection (§7).
      const tc = {}; // "topic|cause" -> {topic, subject, cause, count}
      qr.forEach(q => {
        const cause = this.rootCause(q, medianTime, confMap[this._qid(q)]);
        if (!cause) return;
        const topic = this._topicOf(q);
        const subject = q.question ? q.question.subject : '';
        const key = `${topic}|${cause}`;
        if (!tc[key]) tc[key] = { topic, subject, cause, count: 0 };
        tc[key].count++;
      });

      // Subject accuracy snapshot for recovery tracking (§18/§19).
      const subjectAccuracy = {};
      Object.entries(result.subjectWise || {}).forEach(([subj, d]) => {
        const attempted = (d.correct || 0) + (d.wrong || 0);
        subjectAccuracy[subj] = attempted > 0 ? Math.round((d.correct / attempted) * 100) : 0;
      });

      const leak = this.getScoreLeakageMap(result);

      const raw = localStorage.getItem(this.STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : { snapshots: [] };
      // Build cause breakdown for timeline (§24)
      const causeBreakdown = {};
      Object.values(tc).forEach(t => {
        causeBreakdown[t.cause] = (causeBreakdown[t.cause] || 0) + (t.count || 1);
      });

      data.snapshots.push({
        date: new Date().toISOString(),
        accuracy: result.accuracy,
        currentScore: leak.currentScore,
        recoverableMarks: leak.recoverableMarks,
        dominantCause: leak.topLeak ? leak.topLeak.cause : null,
        topicCauses: Object.values(tc),
        subjectAccuracy,
        causeBreakdown
      });
      if (data.snapshots.length > 30) data.snapshots = data.snapshots.slice(-30);
      data.updatedAt = new Date().toISOString();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));

      // Doc 21: Trigger Correction Intelligence recovery check
      if (typeof CorrectionEngine !== 'undefined' && CorrectionEngine.processRecoveryCheck) {
        try { CorrectionEngine.processRecoveryCheck(result); }
        catch (ce) { console.warn('[MistakeDNA] CIE hook error:', ce.message); }
      }

      // Doc 22: Trigger Predictive Intelligence self-evaluation
      if (typeof PredictiveEngine !== 'undefined' && PredictiveEngine.evaluatePredictions) {
        try { PredictiveEngine.evaluatePredictions(result); }
        catch (pe) { console.warn('[MistakeDNA] PIE hook error:', pe.message); }
      }

      // Doc 23: Trigger Student Digital Twin synchronization
      if (typeof DigitalTwin !== 'undefined' && DigitalTwin.syncWithReality) {
        try { DigitalTwin.syncWithReality(result); }
        catch (dt) { console.warn('[MistakeDNA] SDTE hook error:', dt.message); }
      }

      // Doc 24: Trigger Learning Orchestrator decision outcome evaluation
      if (typeof LearningOrchestrator !== 'undefined' && LearningOrchestrator.evaluateDecisions) {
        try { LearningOrchestrator.evaluateDecisions(result); }
        catch (lo) { console.warn('[MistakeDNA] LODE hook error:', lo.message); }
      }
    } catch (e) {
      console.warn('[MistakeDNA] Snapshot save error:', e.message);
    }
  },


  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  // Build { qId: confidence } for the questions in THIS result by joining the
  // confidence log. Uses the latest matching entry per question id.
  _confidenceMap(result) {
    const map = {};
    if (typeof Storage === 'undefined' || !Storage.getConfidenceLog) return map;
    const ids = new Set((result.questionResults || [])
      .map(q => this._qid(q)).filter(id => id != null));
    if (ids.size === 0) return map;
    const log = Storage.getConfidenceLog();
    // Walk oldest→newest so the newest entry for an id wins.
    log.forEach(e => { if (ids.has(e.qId)) map[e.qId] = e.confidence; });
    return map;
  },

  _qid(qr) { return qr && qr.question ? qr.question.id : null; },

  _topicOf(qr) {
    if (!qr || !qr.question) return 'Unknown';
    return qr.question.topic || qr.question.subject || 'Unknown';
  },

  _median(arr) {
    if (!arr || arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  },

  _getSnapshots() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : null;
      return data && Array.isArray(data.snapshots) ? data.snapshots : [];
    } catch { return []; }
  },

  // ═══════════════════════════════════════════
  // Doc 23: COMMON ENGINE INTERFACE (IESCP)
  // ═══════════════════════════════════════════
  getStandardReport() {
    const snaps = this._getSnapshots() || [];
    if (snaps.length === 0) {
      return {
        engineName: 'MistakeDNA',
        input: 'No data',
        evidence: 'No mistake DNA snapshots recorded.',
        score: 0,
        confidence: 'low',
        prediction: 'Requires incorrect answers to map mistake signature.',
        recommendation: 'Complete test to generate Mistake DNA.',
        expectedOutcome: 'Calibration of root cause leakages.',
        actualOutcome: 'Awaiting mock.',
        selfEvaluation: 'No history.'
      };
    }

    const latest = snaps[snaps.length - 1];
    const topCause = latest.dominantCause || 'none';
    const recMarks = latest.recoverableMarks || 0;
    const scoreVal = this.getRecoveryScore?.()?.recoveryRate || 50;

    return {
      engineName: 'MistakeDNA',
      input: `Mistake snapshots containing ${snaps.length} sessions.`,
      evidence: `Dominant cause: ${topCause}, Recoverable marks: ${recMarks}`,
      score: scoreVal,
      confidence: snaps.length >= 5 ? 'high' : snaps.length >= 2 ? 'medium' : 'low',
      prediction: topCause !== 'none' ? `Without intervention, student will leak ~${recMarks} marks from ${topCause} next test.` : 'No significant leakage predicted.',
      recommendation: topCause !== 'none' ? `Focus on fixing ${topCause} errors via correction pathways.` : 'Rhythm is stable.',
      expectedOutcome: topCause !== 'none' ? `Expected to recover up to ${recMarks} marks next session.` : 'Maintain stable performance.',
      actualOutcome: 'Self-evaluation tracking active in localStorage.',
      selfEvaluation: 'Accuracy of root cause prediction is cross-checked with next test error types.'
    };
  }
};

window.MistakeDNA = MistakeDNA;
