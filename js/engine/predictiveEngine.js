// ============================================
// PREDICTIVE INTELLIGENCE ENGINE — Doc 22
// Mock24hr's first PROACTIVE engine.
// Predicts future, doesn't just react to past.
//
// Every prediction follows IESCP:
//   I = Input (data consumed)
//   E = Evidence (patterns found)
//   S = Score (numerical prediction)
//   C = Confidence (low/medium/high)
//   P = Prediction + Recommendation + Expected Outcome
//
// Math: linear regression, exponential decay,
// Monte Carlo simulation — all client-side.
// ============================================

const PredictiveEngine = {

  STORAGE_KEY: 'mtp_predictions',

  // Minimum data points for predictions
  MIN_DATA: 3,

  // Rank estimation constants (configurable per exam)
  RANK_TABLE: [
    { accuracy: 95, percentile: 1,  rank: 130 },
    { accuracy: 90, percentile: 3,  rank: 390 },
    { accuracy: 85, percentile: 7,  rank: 910 },
    { accuracy: 80, percentile: 15, rank: 1950 },
    { accuracy: 75, percentile: 25, rank: 3250 },
    { accuracy: 70, percentile: 35, rank: 4550 },
    { accuracy: 65, percentile: 50, rank: 6500 },
    { accuracy: 60, percentile: 65, rank: 8450 },
    { accuracy: 50, percentile: 80, rank: 10400 },
    { accuracy: 40, percentile: 90, rank: 11700 },
    { accuracy: 30, percentile: 95, rank: 12350 },
    { accuracy: 0,  percentile: 100,rank: 13000 }
  ],

  // Weather conditions
  WEATHER: {
    excellent: { icon: '☀️', label: 'Excellent Learning Day', color: '#10B981', advice: 'Best day for a full mock test.' },
    good:      { icon: '🌤️', label: 'Good Learning Day',      color: '#3B82F6', advice: 'Good for focused practice.' },
    moderate:  { icon: '⛅', label: 'Moderate',               color: '#F59E0B', advice: 'Mix practice with revision.' },
    recovery:  { icon: '🌧️', label: 'Recovery Day',           color: '#EF4444', advice: 'Revision only. Skip new tests.' },
    unknown:   { icon: '❓', label: 'Building Forecast',       color: '#6B7280', advice: 'Take more tests for weather data.' }
  },


  // ═══════════════════════════════════════════
  // §1 TOPIC DECAY PREDICTION
  // "GK will drop 25% in 7 days"
  // Exponential decay from revision gaps.
  // ═══════════════════════════════════════════

  predictTopicDecay() {
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    if (!profile || !profile.subjectProfiles) return { ready: false, decays: [] };

    const now = Date.now();
    const ONE_DAY = 86400000;
    const decays = [];

    Object.values(profile.subjectProfiles).forEach(sp => {
      if (sp.attempts < 5) return;

      const lastAttempted = sp.lastAttempted ? new Date(sp.lastAttempted).getTime() : now;
      const daysSince = Math.max(0, Math.floor((now - lastAttempted) / ONE_DAY));

      // Exponential decay: accuracy × e^(-λt)
      // λ = 0.03 for strong topics, 0.06 for weak topics
      const lambda = sp.accuracy >= 70 ? 0.03 : sp.accuracy >= 50 ? 0.05 : 0.07;

      const predictions = [7, 14, 21].map(days => {
        const totalDays = daysSince + days;
        const decayFactor = Math.exp(-lambda * totalDays);
        const predicted = Math.round(sp.accuracy * decayFactor);
        const drop = sp.accuracy - predicted;
        return { days, predicted: Math.max(0, predicted), drop };
      });

      const urgency = predictions[0].drop >= 15 ? 'critical'
        : predictions[0].drop >= 8 ? 'high'
        : predictions[0].drop >= 3 ? 'medium' : 'low';

      decays.push({
        subject: sp.subject,
        currentAccuracy: sp.accuracy,
        daysSinceRevision: daysSince,
        predictions,
        urgency,
        trend: sp.trend,
        insight: urgency === 'critical' || urgency === 'high'
          ? `${sp.subject} will drop to ${predictions[0].predicted}% in 7 days without revision.`
          : `${sp.subject} is holding steady. Next revision recommended in ${Math.max(1, 14 - daysSince)} days.`
      });
    });

    return {
      ready: decays.length > 0,
      decays: decays.sort((a, b) => {
        const urgOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return (urgOrder[a.urgency] || 3) - (urgOrder[b.urgency] || 3);
      })
    };
  },


  // ═══════════════════════════════════════════
  // §2 SCORE FORECAST
  // "Tomorrow: 146 ±5"
  // Linear regression + confidence interval.
  // ═══════════════════════════════════════════

  predictNextScore() {
    const progress = typeof DailySystem !== 'undefined' ? DailySystem.getProgress() : [];
    if (progress.length < this.MIN_DATA) {
      return { ready: false, prediction: null, insight: 'Take more tests to enable score prediction.' };
    }

    const scores = progress.map((p, i) => ({ x: i, y: p.accuracy }));
    const reg = this._linearRegression(scores);
    const nextX = scores.length;
    const predicted = Math.round(Math.max(0, Math.min(100, reg.slope * nextX + reg.intercept)));

    // Confidence interval from residual std dev
    const residuals = scores.map(s => s.y - (reg.slope * s.x + reg.intercept));
    const stdErr = this._stdDev(residuals.map(r => r));
    const margin = Math.round(stdErr * 1.3); // ~80% CI

    const trend = reg.slope > 0.5 ? 'improving' : reg.slope < -0.5 ? 'declining' : 'stable';
    const confidence = scores.length >= 10 ? 'high' : scores.length >= 5 ? 'medium' : 'low';

    return {
      ready: true,
      prediction: {
        score: predicted,
        margin,
        low: Math.max(0, predicted - margin),
        high: Math.min(100, predicted + margin),
        trend,
        slope: Math.round(reg.slope * 100) / 100
      },
      confidence,
      dataPoints: scores.length,
      insight: trend === 'improving'
        ? `Your scores are trending up (+${Math.round(reg.slope * 10) / 10}% per test). Next test: ~${predicted}% (±${margin}).`
        : trend === 'declining'
          ? `Scores are declining. Without correction, next test: ~${predicted}%. Focus on revision today.`
          : `Scores are stable around ${predicted}% (±${margin}).`
    };
  },


  // ═══════════════════════════════════════════
  // §3 IMPROVEMENT SIMULATION
  // "Fix Reading +20% → +11 marks, 83% prob"
  // ═══════════════════════════════════════════

  simulateImprovement(cause, improvementPct) {
    // Delegate to CIE simulator if available, with prediction enrichment
    if (typeof CorrectionEngine !== 'undefined') {
      const sim = CorrectionEngine.simulateCorrection(cause, improvementPct);
      if (sim) {
        // Enrich with predictive confidence from history
        const selfEval = this._getModelAccuracy(cause);
        if (selfEval.samples > 0) {
          sim.expectedOutcome.adjustedProbability = Math.round(
            sim.expectedOutcome.probability * (selfEval.accuracy / 100)
          );
        }
        return sim;
      }
    }
    return null;
  },


  // ═══════════════════════════════════════════
  // §4 PRIORITY ADVISOR
  // "Study GK today, not English"
  // ═══════════════════════════════════════════

  getTodaysPriority() {
    const decay = this.predictTopicDecay();
    if (!decay.ready) return { ready: false };

    const urgent = decay.decays.filter(d => d.urgency === 'critical' || d.urgency === 'high');
    const stable = decay.decays.filter(d => d.urgency === 'low');

    if (urgent.length === 0) {
      return {
        ready: true,
        study: decay.decays[0]?.subject || null,
        skip: null,
        reason: 'All topics are healthy. Continue your regular schedule.',
        urgency: 'low'
      };
    }

    const studySubject = urgent[0].subject;
    const skipSubject = stable.length > 0 ? stable[stable.length - 1].subject : null;

    return {
      ready: true,
      study: studySubject,
      skip: skipSubject,
      reason: `${studySubject} is about to drop ${urgent[0].predictions[0].drop}% in 7 days.${skipSubject ? ` ${skipSubject} is stable — skip it today.` : ''}`,
      urgency: urgent[0].urgency,
      decayDetails: urgent[0]
    };
  },


  // ═══════════════════════════════════════════
  // §5 RANK ESTIMATOR
  // "Current ~5400 → Possible 1900 in 21 days"
  // ═══════════════════════════════════════════

  estimateRank() {
    const forecast = this.predictNextScore();
    if (!forecast.ready) return { ready: false };

    const currentAcc = forecast.prediction.score;
    const currentRank = this._accuracyToRank(currentAcc);

    // Project improvement over 7/14/21 days based on slope
    const slope = forecast.prediction.slope;
    const projections = [7, 14, 21].map(days => {
      // Estimate tests in that period (avg ~1 test per 2 days)
      const estTests = Math.round(days / 2);
      const projectedAcc = Math.min(100, Math.max(0, Math.round(currentAcc + slope * estTests)));
      return {
        days,
        accuracy: projectedAcc,
        rank: this._accuracyToRank(projectedAcc)
      };
    });

    const bestProjection = projections.reduce((best, p) =>
      p.rank < best.rank ? p : best, projections[0]);

    return {
      ready: true,
      currentAccuracy: currentAcc,
      currentRank,
      projections,
      bestPossible: bestProjection,
      insight: slope > 0
        ? `Current estimated rank: ~${currentRank}. If you maintain this improvement, possible rank: ~${bestProjection.rank} in ${bestProjection.days} days.`
        : `Current estimated rank: ~${currentRank}. Focus on correction plans to improve.`,
      confidence: forecast.confidence
    };
  },

  _accuracyToRank(accuracy) {
    for (let i = 0; i < this.RANK_TABLE.length; i++) {
      if (accuracy >= this.RANK_TABLE[i].accuracy) {
        return this.RANK_TABLE[i].rank;
      }
    }
    return this.RANK_TABLE[this.RANK_TABLE.length - 1].rank;
  },


  // ═══════════════════════════════════════════
  // §6 CHURN PREDICTION
  // "Student will break streak in 3 days"
  // ═══════════════════════════════════════════

  predictChurn() {
    const streak = typeof DailySystem !== 'undefined' ? DailySystem.getStreak() : { current: 0, best: 0 };
    const progress = typeof DailySystem !== 'undefined' ? DailySystem.getProgress() : [];

    if (progress.length < this.MIN_DATA) return { ready: false, risk: 'unknown' };

    // Calculate gaps between tests
    const dates = progress.map(p => new Date(p.timestamp || p.date).getTime()).sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < dates.length; i++) {
      gaps.push(Math.round((dates[i] - dates[i - 1]) / 86400000));
    }
    const avgGap = gaps.length > 0 ? gaps.reduce((s, g) => s + g, 0) / gaps.length : 2;
    const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;

    // Days since last activity
    const lastActivity = dates[dates.length - 1] || Date.now();
    const daysSinceLastTest = Math.floor((Date.now() - lastActivity) / 86400000);

    // Risk scoring
    let risk = 'low';
    let daysToBreak = 7;
    const signals = [];

    if (daysSinceLastTest >= 5) {
      risk = 'critical';
      daysToBreak = 0;
      signals.push(`No test for ${daysSinceLastTest} days — streak already at risk.`);
    } else if (daysSinceLastTest >= 3) {
      risk = 'high';
      daysToBreak = Math.max(1, 5 - daysSinceLastTest);
      signals.push(`${daysSinceLastTest} days since last test — engagement dropping.`);
    } else if (avgGap >= 3) {
      risk = 'medium';
      daysToBreak = Math.round(avgGap);
      signals.push(`Average gap between tests: ${Math.round(avgGap)} days — inconsistent pattern.`);
    }

    // Accuracy decline adds risk
    if (progress.length >= 3) {
      const last3 = progress.slice(-3).map(p => p.accuracy);
      const avg3 = last3.reduce((s, v) => s + v, 0) / 3;
      if (avg3 < 50) {
        if (risk === 'low') risk = 'medium';
        signals.push(`Recent accuracy ${Math.round(avg3)}% — low scores reduce motivation.`);
      }
    }

    return {
      ready: true,
      risk,
      daysToBreak,
      currentStreak: streak.current,
      bestStreak: streak.best,
      daysSinceLastTest,
      avgGap: Math.round(avgGap * 10) / 10,
      signals,
      insight: risk === 'critical' || risk === 'high'
        ? `Churn risk: ${risk}. A quick 10-question practice today can save your streak.`
        : `Engagement looks healthy. Keep your ${streak.current}-day streak going!`
    };
  },


  // ═══════════════════════════════════════════
  // §7 ACTIVITY ADVISOR
  // "Revision today (+9) > Mock (-3)"
  // ═══════════════════════════════════════════

  recommendActivity() {
    const decay = this.predictTopicDecay();
    const forecast = this.predictNextScore();
    const churn = this.predictChurn();

    if (!forecast.ready) return { ready: false };

    const trend = forecast.prediction.trend;
    const urgentDecay = decay.ready ? decay.decays.filter(d => d.urgency === 'critical' || d.urgency === 'high') : [];

    // Calculate expected value of each activity
    let mockExpected = 0;
    let revisionExpected = 0;

    if (trend === 'declining') {
      mockExpected = -3; // Mock while declining = frustration
      revisionExpected = 6; // Revision addresses root cause
    } else if (urgentDecay.length >= 2) {
      mockExpected = 2; // Mock still useful but revision more urgent
      revisionExpected = 9; // Multiple decays need revision
    } else if (trend === 'improving') {
      mockExpected = 7; // Riding momentum
      revisionExpected = 4; // Revision still helps
    } else {
      mockExpected = 5; // Stable
      revisionExpected = 5;
    }

    // Churn override
    if (churn.ready && churn.risk === 'critical') {
      mockExpected = 3; // Easy test for engagement
      revisionExpected = 2;
    }

    const recommendation = mockExpected >= revisionExpected ? 'mock' : 'revision';

    return {
      ready: true,
      recommendation,
      mock: { expectedGain: mockExpected, reason: trend === 'improving' ? 'Momentum is up — test to lock in gains.' : 'Practice maintains baseline.' },
      revision: { expectedGain: revisionExpected, reason: urgentDecay.length > 0 ? `${urgentDecay.length} topic(s) decaying — revision prevents loss.` : 'Strengthens weak areas.' },
      insight: recommendation === 'revision'
        ? `Today: Revision (+${revisionExpected} expected) > Mock (+${mockExpected} expected). ${urgentDecay.length > 0 ? urgentDecay[0].subject + ' needs attention.' : ''}`
        : `Today: Mock (+${mockExpected} expected). Your momentum is up — test to lock in gains.`
    };
  },


  // ═══════════════════════════════════════════
  // §8 PREDICTIVE REVISION
  // "SI revision: 87% benefit vs Ratio: 14%"
  // ═══════════════════════════════════════════

  getOptimalRevision() {
    const decay = this.predictTopicDecay();
    if (!decay.ready) return { ready: false };

    const ranked = decay.decays.map(d => {
      // Benefit = current drop risk × topic importance × recovery probability
      const dropRisk = d.predictions[0].drop;
      const importance = d.currentAccuracy < 60 ? 1.5 : d.currentAccuracy < 75 ? 1.2 : 1.0;
      const benefit = Math.round(dropRisk * importance * 3.5);

      return {
        subject: d.subject,
        benefit: Math.min(100, benefit),
        currentAccuracy: d.currentAccuracy,
        predictedDrop: d.predictions[0].drop,
        daysSinceRevision: d.daysSinceRevision,
        urgency: d.urgency
      };
    }).sort((a, b) => b.benefit - a.benefit);

    return {
      ready: ranked.length > 0,
      rankings: ranked,
      topPick: ranked[0] || null,
      insight: ranked[0]
        ? `Revise ${ranked[0].subject} today (${ranked[0].benefit}% benefit). It'll drop ${ranked[0].predictedDrop}% in a week without revision.`
        : 'All topics are healthy.'
    };
  },


  // ═══════════════════════════════════════════
  // §9 STUDY TIME PREDICTOR
  // "Morning 83% vs Evening 71%"
  // ═══════════════════════════════════════════

  predictBestStudyTime() {
    const progress = typeof DailySystem !== 'undefined' ? DailySystem.getProgress() : [];
    if (progress.length < this.MIN_DATA) return { ready: false };

    const buckets = { morning: [], afternoon: [], evening: [], night: [] };

    progress.forEach(p => {
      const hour = new Date(p.timestamp || p.date).getHours();
      if (hour >= 5 && hour < 12) buckets.morning.push(p.accuracy);
      else if (hour >= 12 && hour < 17) buckets.afternoon.push(p.accuracy);
      else if (hour >= 17 && hour < 21) buckets.evening.push(p.accuracy);
      else buckets.night.push(p.accuracy);
    });

    const stats = Object.entries(buckets)
      .filter(([, accs]) => accs.length >= 1)
      .map(([period, accs]) => ({
        period,
        label: period.charAt(0).toUpperCase() + period.slice(1),
        avgAccuracy: Math.round(accs.reduce((s, v) => s + v, 0) / accs.length),
        testCount: accs.length,
        icon: period === 'morning' ? '🌅' : period === 'afternoon' ? '☀️' : period === 'evening' ? '🌆' : '🌙'
      }))
      .sort((a, b) => b.avgAccuracy - a.avgAccuracy);

    const best = stats[0];
    const worst = stats[stats.length - 1];

    return {
      ready: stats.length >= 2,
      stats,
      bestTime: best,
      worstTime: worst,
      insight: stats.length >= 2
        ? `${best.icon} ${best.label}: ${best.avgAccuracy}% avg accuracy vs ${worst.icon} ${worst.label}: ${worst.avgAccuracy}%. Schedule important tests in the ${best.period}.`
        : 'Take tests at different times to build your study time profile.'
    };
  },


  // ═══════════════════════════════════════════
  // §10 RECOVERY FORECAST
  // "Current 62% → 91% in 12 days"
  // ═══════════════════════════════════════════

  forecastRecovery() {
    if (typeof CorrectionEngine === 'undefined') return { ready: false };

    const passport = CorrectionEngine.getRecoveryPassport();
    if (!passport.ready) return { ready: false };

    const active = passport.active.length;
    const total = passport.totalWeaknesses;
    const score = passport.correctionScore;

    // Current recovery rate
    const currentRate = total > 0 ? Math.round(((total - active) / total) * 100) : 0;

    // Forecast based on correction velocity
    const longTerm = CorrectionEngine.getLongTermRecovery();
    const recentMonths = longTerm.months.slice(-3);
    const avgRecoveryPerMonth = recentMonths.length > 0
      ? recentMonths.reduce((s, m) => s + m.recovered, 0) / recentMonths.length
      : 0.5;

    // Project recovery
    const daysToFull = active > 0 && avgRecoveryPerMonth > 0
      ? Math.round((active / avgRecoveryPerMonth) * 30)
      : null;

    const projections = [7, 14, 30].map(days => {
      const expectedRecoveries = Math.round(avgRecoveryPerMonth * (days / 30));
      const projected = Math.min(100, currentRate + Math.round((expectedRecoveries / Math.max(1, total)) * 100));
      return { days, rate: projected };
    });

    return {
      ready: true,
      currentRate,
      activeWeaknesses: active,
      totalTracked: total,
      projections,
      daysToFull,
      insight: daysToFull
        ? `Recovery: ${currentRate}% → estimated ${projections[1].rate}% in 14 days. Full recovery in ~${daysToFull} days.`
        : `Recovery at ${currentRate}%. Continue correction plans to improve.`
    };
  },


  // ═══════════════════════════════════════════
  // §11 INTERACTIVE SCORE SIMULATOR
  // Slider → live score recalculation
  // ═══════════════════════════════════════════

  liveScoreSimulator(adjustments) {
    // adjustments: { reading: +20, calculation: +10, concept: -5, ... }
    if (typeof MistakeDNA === 'undefined') return { ready: false };

    const snaps = MistakeDNA._getSnapshots();
    if (snaps.length === 0) return { ready: false };

    const latest = snaps[snaps.length - 1];
    const baseScore = latest.accuracy || 0;
    let adjustedScore = baseScore;

    const details = [];
    Object.entries(adjustments || {}).forEach(([cause, pct]) => {
      const causeData = (latest.causeBreakdown || {})[cause];
      const count = causeData ? (causeData.count || 0) : 0;
      const impact = Math.round(count * (pct / 100) * 0.8); // Each error ~0.8 marks
      adjustedScore += impact;

      if (count > 0) {
        details.push({
          cause,
          label: MistakeDNA.CAUSE_META[cause]?.label || cause,
          currentErrors: count,
          adjustment: pct,
          marksGained: impact
        });
      }
    });

    return {
      ready: true,
      baseScore,
      adjustedScore: Math.min(100, Math.max(0, Math.round(adjustedScore))),
      delta: Math.round(adjustedScore - baseScore),
      details
    };
  },


  // ═══════════════════════════════════════════
  // §12 FUTURE HEATMAP
  // "GK: today 72% → 7d 61% → 14d 43%"
  // ═══════════════════════════════════════════

  predictFutureHeatmap() {
    const decay = this.predictTopicDecay();
    if (!decay.ready) return { ready: false };

    return {
      ready: true,
      subjects: decay.decays.map(d => ({
        subject: d.subject,
        today: d.currentAccuracy,
        day7: d.predictions[0]?.predicted || d.currentAccuracy,
        day14: d.predictions[1]?.predicted || d.currentAccuracy,
        day21: d.predictions[2]?.predicted || d.currentAccuracy,
        urgency: d.urgency,
        trend: d.trend
      }))
    };
  },


  // ═══════════════════════════════════════════
  // §13 EXAM READINESS FORECAST
  // "Current 72% → 14d 81% → 30d 89%"
  // ═══════════════════════════════════════════

  forecastExamReadiness() {
    const forecast = this.predictNextScore();
    if (!forecast.ready) return { ready: false };

    const current = forecast.prediction.score;
    const slope = forecast.prediction.slope;

    // Project readiness over time
    const projections = [7, 14, 21, 30, 45, 60].map(days => {
      const estTests = Math.round(days / 2);
      const projected = Math.min(100, Math.max(0, Math.round(current + slope * estTests)));
      // Diminishing returns after a point
      const adjusted = Math.min(100, Math.round(projected * (1 - 0.002 * days))); // slight plateau
      return { days, readiness: Math.max(current, adjusted) };
    });

    // Readiness level
    const readiness = current >= 85 ? 'exam_ready'
      : current >= 70 ? 'on_track'
      : current >= 55 ? 'needs_work'
      : 'not_ready';

    const readinessLabels = {
      exam_ready: { label: 'Exam Ready', color: '#10B981', icon: '✅' },
      on_track: { label: 'On Track', color: '#3B82F6', icon: '📈' },
      needs_work: { label: 'Needs Work', color: '#F59E0B', icon: '⚠️' },
      not_ready: { label: 'Not Ready', color: '#EF4444', icon: '🔴' }
    };

    return {
      ready: true,
      currentReadiness: current,
      readinessLevel: readinessLabels[readiness],
      projections,
      insight: slope > 0
        ? `You're improving at ${Math.round(slope * 10) / 10}% per test. At this rate, ${projections[2].readiness}% readiness in 21 days.`
        : `Current readiness: ${current}%. Focus on correction plans to improve trajectory.`
    };
  },


  // ═══════════════════════════════════════════
  // §14 MONTE CARLO SIMULATION
  // 1,000 runs → "Most likely: 148, P: 68%"
  // ═══════════════════════════════════════════

  monteCarloSimulation(runs) {
    runs = runs || 1000;
    const progress = typeof DailySystem !== 'undefined' ? DailySystem.getProgress() : [];
    if (progress.length < this.MIN_DATA) return { ready: false };

    const scores = progress.map(p => p.accuracy);
    const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
    const std = this._stdDev(scores);

    // Run simulations
    const results = [];
    for (let i = 0; i < runs; i++) {
      // Box-Muller for normal distribution
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const simulated = Math.round(Math.max(0, Math.min(100, mean + z * std)));
      results.push(simulated);
    }

    results.sort((a, b) => a - b);

    // Find mode (most common 5-point bucket)
    const buckets = {};
    results.forEach(r => {
      const bucket = Math.round(r / 5) * 5;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    const modeBucket = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
    const mostLikely = parseInt(modeBucket[0]);
    const mostLikelyProb = Math.round((modeBucket[1] / runs) * 100);

    // Percentiles
    const p10 = results[Math.floor(runs * 0.10)];
    const p25 = results[Math.floor(runs * 0.25)];
    const p50 = results[Math.floor(runs * 0.50)];
    const p75 = results[Math.floor(runs * 0.75)];
    const p90 = results[Math.floor(runs * 0.90)];

    return {
      ready: true,
      runs,
      mean: Math.round(mean),
      std: Math.round(std * 10) / 10,
      mostLikely,
      mostLikelyProb,
      percentiles: { p10, p25, p50, p75, p90 },
      distribution: Object.entries(buckets)
        .map(([score, count]) => ({ score: parseInt(score), count, pct: Math.round((count / runs) * 100) }))
        .sort((a, b) => a.score - b.score),
      insight: `${runs} simulations: most likely score ${mostLikely}% (probability ${mostLikelyProb}%). Range: ${p10}% to ${p90}%.`
    };
  },


  // ═══════════════════════════════════════════
  // §15 LEARNING WEATHER
  // "☀️ Excellent Learning Day" or "🌧️ Recovery Day"
  // Pure history-based, not motivational.
  // ═══════════════════════════════════════════

  getLearningWeather() {
    const progress = typeof DailySystem !== 'undefined' ? DailySystem.getProgress() : [];
    const streak = typeof DailySystem !== 'undefined' ? DailySystem.getStreak() : { current: 0 };

    if (progress.length < this.MIN_DATA) {
      return { ...this.WEATHER.unknown, ready: false, factors: {} };
    }

    // Factor 1: Streak health (0-100)
    const streakScore = Math.min(100, streak.current * 15);

    // Factor 2: Recent accuracy trend (0-100)
    const recent3 = progress.slice(-3).map(p => p.accuracy);
    const avgRecent = recent3.reduce((s, v) => s + v, 0) / recent3.length;
    const trendScore = Math.min(100, Math.round(avgRecent * 1.1));

    // Factor 3: Time since last test (freshness, 0-100)
    const lastTimestamp = progress[progress.length - 1]?.timestamp || Date.now();
    const hoursSince = Math.max(0, (Date.now() - lastTimestamp) / 3600000);
    const freshnessScore = hoursSince <= 24 ? 90 : hoursSince <= 48 ? 70 : hoursSince <= 72 ? 40 : 15;

    // Factor 4: Revision health (0-100)
    let revisionScore = 70; // default
    if (typeof LearningProfile !== 'undefined') {
      const profile = LearningProfile.get();
      const revDue = profile.revisionQueue?.length || 0;
      revisionScore = revDue === 0 ? 95 : revDue <= 2 ? 70 : revDue <= 4 ? 40 : 15;
    }

    // Factor 5: Behaviour score (0-100)
    let behaviourScore = 70;
    if (typeof BehaviourEngine !== 'undefined') {
      const dna = BehaviourEngine.getBehaviourDNA?.();
      if (dna?.ready && dna.behaviourScore != null) {
        behaviourScore = dna.behaviourScore;
      }
    }

    // Composite weather score
    const composite = Math.round(
      streakScore * 0.15 +
      trendScore * 0.30 +
      freshnessScore * 0.20 +
      revisionScore * 0.15 +
      behaviourScore * 0.20
    );

    // Determine weather
    let condition;
    if (composite >= 80) condition = 'excellent';
    else if (composite >= 60) condition = 'good';
    else if (composite >= 40) condition = 'moderate';
    else condition = 'recovery';

    const weather = this.WEATHER[condition];

    return {
      ready: true,
      condition,
      ...weather,
      composite,
      factors: {
        streak:    { score: streakScore,    label: 'Streak',     icon: '🔥' },
        trend:     { score: trendScore,     label: 'Accuracy',   icon: '📈' },
        freshness: { score: freshnessScore, label: 'Freshness',  icon: '⏱️' },
        revision:  { score: revisionScore,  label: 'Revision',   icon: '📖' },
        behaviour: { score: behaviourScore, label: 'Focus',      icon: '🧠' }
      },
      insight: `${weather.icon} ${weather.label}. ${weather.advice}`
    };
  },


  // ═══════════════════════════════════════════
  // §16 SELF-EVALUATION FRAMEWORK
  // Compare past predictions vs actual outcomes.
  // ═══════════════════════════════════════════

  /**
   * Called after every test to compare predictions with reality.
   */
  evaluatePredictions(result) {
    if (!result) return;

    const data = this._getData();
    if (!data.predictions) data.predictions = [];

    // Get the last prediction (made before this test)
    const lastPrediction = data.lastScorePrediction;
    if (lastPrediction) {
      const actual = result.accuracy || 0;
      const predicted = lastPrediction.score;
      const error = Math.abs(actual - predicted);
      const withinCI = actual >= lastPrediction.low && actual <= lastPrediction.high;

      data.evaluations = data.evaluations || [];
      data.evaluations.push({
        date: new Date().toISOString(),
        predicted,
        actual,
        error,
        withinCI,
        margin: lastPrediction.margin
      });

      // Keep last 20 evaluations
      if (data.evaluations.length > 20) data.evaluations = data.evaluations.slice(-20);
    }

    // Store current prediction for next evaluation
    const nextPrediction = this.predictNextScore();
    if (nextPrediction.ready) {
      data.lastScorePrediction = nextPrediction.prediction;
    }

    data.updatedAt = new Date().toISOString();
    this._saveData(data);
  },

  /**
   * Get model accuracy metrics.
   */
  getModelAccuracy() {
    const data = this._getData();
    const evals = data.evaluations || [];

    if (evals.length === 0) return { ready: false, accuracy: 0, samples: 0 };

    const avgError = evals.reduce((s, e) => s + e.error, 0) / evals.length;
    const withinCI = evals.filter(e => e.withinCI).length;
    const ciRate = Math.round((withinCI / evals.length) * 100);
    const accuracy = Math.round(Math.max(0, 100 - avgError));

    return {
      ready: true,
      accuracy,
      avgError: Math.round(avgError * 10) / 10,
      ciRate,
      samples: evals.length,
      insight: `Prediction accuracy: ${accuracy}%. ${ciRate}% of actual scores fell within predicted range (${evals.length} samples).`
    };
  },

  _getModelAccuracy(cause) {
    // Per-cause accuracy (simplified — uses overall model accuracy)
    return this.getModelAccuracy();
  },


  // ═══════════════════════════════════════════
  // MASTER: getFullForecast()
  // ═══════════════════════════════════════════

  getFullForecast() {
    return {
      weather: this.getLearningWeather(),
      scoreForecast: this.predictNextScore(),
      topicDecay: this.predictTopicDecay(),
      priority: this.getTodaysPriority(),
      activity: this.recommendActivity(),
      churn: this.predictChurn(),
      rank: this.estimateRank(),
      readiness: this.forecastExamReadiness(),
      recovery: this.forecastRecovery(),
      studyTime: this.predictBestStudyTime(),
      monteCarlo: this.monteCarloSimulation(),
      futureHeatmap: this.predictFutureHeatmap(),
      modelAccuracy: this.getModelAccuracy()
    };
  },


  // ═══════════════════════════════════════════
  // MATH HELPERS
  // ═══════════════════════════════════════════

  /**
   * Simple linear regression: y = mx + b
   * @param {Array<{x, y}>} points
   * @returns {{ slope, intercept, r2 }}
   */
  _linearRegression(points) {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: points[0]?.y || 0, r2: 0 };

    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    points.forEach(p => {
      sumX += p.x; sumY += p.y;
      sumXY += p.x * p.y; sumXX += p.x * p.x; sumYY += p.y * p.y;
    });

    const denom = n * sumXX - sumX * sumX;
    if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    // R² coefficient of determination
    const yMean = sumY / n;
    const ssTotal = points.reduce((s, p) => s + Math.pow(p.y - yMean, 2), 0);
    const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
    const r2 = ssTotal > 0 ? Math.round((1 - ssRes / ssTotal) * 100) / 100 : 0;

    return { slope, intercept, r2 };
  },

  /**
   * Standard deviation
   */
  _stdDev(arr) {
    if (!arr || arr.length < 2) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    const variance = arr.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (arr.length - 1);
    return Math.sqrt(variance);
  },


  // ═══════════════════════════════════════════
  // STORAGE HELPERS
  // ═══════════════════════════════════════════

  _getData() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw ? JSON.parse(raw) : { predictions: [], evaluations: [], lastScorePrediction: null, updatedAt: null };
    } catch { return { predictions: [], evaluations: [], lastScorePrediction: null, updatedAt: null }; }
  },

  _saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('[PIE] Save error:', e.message);
    }
  },

  // ═══════════════════════════════════════════
  // Doc 23: COMMON ENGINE INTERFACE (IESCP)
  // ═══════════════════════════════════════════
  getStandardReport() {
    const forecast = this.predictNextScore();
    const ma = this.getModelAccuracy();
    const weather = this.getLearningWeather();

    if (!forecast.ready) {
      return {
        engineName: 'PredictiveEngine',
        input: 'No data',
        evidence: 'No predictive records initialized.',
        score: 0,
        confidence: 'low',
        prediction: 'Requires multiple tests to calibrate predictions.',
        recommendation: 'Complete test history.',
        expectedOutcome: 'Score prediction modeling.',
        actualOutcome: 'Awaiting mock.',
        selfEvaluation: 'No history.'
      };
    }

    const p = forecast.prediction;

    return {
      engineName: 'PredictiveEngine',
      input: `Progress entries containing ${forecast.dataPoints || 0} historic test points.`,
      evidence: `Regression trend: ${p.trend} (slope: ${p.slope} accuracy/test). Weather index: ${weather.composite || 50}%`,
      score: p.score,
      confidence: forecast.confidence,
      prediction: `Forecast score for next test session is predicted at ${p.score}% (Margin: ±${p.margin}%).`,
      recommendation: weather.condition === 'recovery' ? 'Rest/Revision day. Skip new mock tests.' : 'Attempt practice session.',
      expectedOutcome: `Actual score expected to fall within ${p.low}% and ${p.high}% bounds.`,
      actualOutcome: ma.ready ? ma.insight : 'Awaiting evaluations.',
      selfEvaluation: ma.ready ? `Average absolute prediction error is ${ma.avgError}%, CI hit rate is ${ma.ciRate}%` : 'No evaluations recorded.'
    };
  }
};

window.PredictiveEngine = PredictiveEngine;
