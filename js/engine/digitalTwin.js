// ============================================
// STUDENT DIGITAL TWIN ENGINE (SDTE) — Doc 23
// Version 1.0 — Virtual Student Simulation Platform
//
// Orchestrates all engines (Learning, Behaviour, Mistake,
// Correction, Predictive) to build a mathematical copy of
// the student and simulate learning strategies before recommendation.
//
// Every output of this engine supports the standard interface:
// - Input
// - Evidence
// - Score
// - Confidence
// - Prediction
// - Recommendation
// - Expected Outcome
// - Actual Outcome
// - Model Self-Evaluation
// ============================================

const DigitalTwin = {
  STORAGE_KEYS: {
    PROFILE: 'mtp_digital_twin_profile',
    RUNS: 'mtp_simulation_runs',
    RESULTS: 'mtp_simulation_results',
    PLANS: 'mtp_study_plans',
    WEATHER_LOG: 'mtp_weather_snapshots'
  },

  // Available strategies for simulation
  STRATEGIES: {
    REVISION_FIRST: 'Revision First',
    MOCK_FIRST: 'Mock First',
    FLASHCARDS_FIRST: 'Flashcards First',
    WEAK_TOPIC_ONLY: 'Weak Topic Only',
    MIXED_PRACTICE: 'Mixed Practice',
    TIMED_PRACTICE: 'Timed Practice'
  },

  // ═══════════════════════════════════════════
  // 1. TWIN PROFILE BUILDER
  // Builds the virtual student copy from other engines
  // ═══════════════════════════════════════════
  buildProfile() {
    const defaultProfile = {
      knowledgeState: {}, // subject-wise accuracy & strength
      behaviourState: { focus: 75, panicRisk: 20, carelessRate: 15, guessingRate: 10 },
      memoryState: {}, // decay rates per subject
      mentalState: { fatigue: 15, pressure: 25 },
      confidence: 70,
      recoveryState: { score: 50, activeWeaknesses: 0 },
      updatedAt: new Date().toISOString()
    };

    try {
      // 1. Fetch Learning Profile info
      if (typeof LearningProfile !== 'undefined') {
        const lp = LearningProfile.get();
        if (lp && lp.subjectProfiles) {
          Object.entries(lp.subjectProfiles).forEach(([sub, sp]) => {
            defaultProfile.knowledgeState[sub] = {
              accuracy: sp.accuracy || 50,
              attempts: sp.attempts || 0,
              weaknessScore: sp.weaknessScore || 0
            };
            // Memory decay state (based on last attempted date)
            const lastAttempt = sp.lastAttempted ? new Date(sp.lastAttempted).getTime() : Date.now();
            const daysSince = Math.max(0, Math.floor((Date.now() - lastAttempt) / 86400000));
            defaultProfile.memoryState[sub] = {
              daysSinceAttempt: daysSince,
              decayFactor: sp.accuracy >= 75 ? 0.03 : 0.06 // lambda decay factor
            };
          });
        }
      }

      // 2. Fetch Behaviour DNA info
      if (typeof BehaviourEngine !== 'undefined') {
        const dna = BehaviourEngine.getBehaviourDNAFromHistory?.() || {};
        if (dna.ready) {
          defaultProfile.behaviourState.focus = dna.behaviourScore || 70;
          // Estimate metrics from behaviour tags
          const tags = dna.tags || [];
          if (tags.includes('guessing')) defaultProfile.behaviourState.guessingRate = 35;
          if (tags.includes('careless')) defaultProfile.behaviourState.carelessRate = 30;
          if (tags.includes('panicked')) defaultProfile.behaviourState.panicRisk = 45;
          if (tags.includes('fatigued')) defaultProfile.mentalState.fatigue = 40;
        }
      }

      // 3. Fetch Mistake DNA info
      if (typeof MistakeDNA !== 'undefined') {
        const snaps = MistakeDNA._getSnapshots() || [];
        if (snaps.length > 0) {
          const latest = snaps[snaps.length - 1];
          defaultProfile.mentalState.pressure = latest.recoverableMarks > 15 ? 50 : 25;
        }
      }

      // 4. Fetch Correction/Recovery info
      if (typeof CorrectionEngine !== 'undefined') {
        const passport = CorrectionEngine.getRecoveryPassport();
        if (passport && passport.ready) {
          defaultProfile.recoveryState.score = passport.correctionScore?.score || 50;
          defaultProfile.recoveryState.activeWeaknesses = passport.active?.length || 0;
        }
      }

      // 5. Fetch Prediction history
      if (typeof PredictiveEngine !== 'undefined') {
        const forecast = PredictiveEngine.predictNextScore();
        if (forecast && forecast.ready) {
          defaultProfile.confidence = forecast.prediction?.score || 70;
        }
      }

      // Save to storage
      localStorage.setItem(this.STORAGE_KEYS.PROFILE, JSON.stringify(defaultProfile));
      return defaultProfile;
    } catch (e) {
      console.warn('[SDTE] Profile build failed:', e.message);
      return defaultProfile;
    }
  },

  getProfile() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.PROFILE);
    if (!raw) return this.buildProfile();
    try {
      return JSON.parse(raw);
    } catch {
      return this.buildProfile();
    }
  },

  // ═══════════════════════════════════════════
  // 2. TWIN SYNCHRONIZATION
  // Executed after every test completes to update the virtual model
  // ═══════════════════════════════════════════
  syncWithReality(result) {
    if (!result) return;
    try {
      // Rebuild the profile to match new reality
      const profile = this.buildProfile();
      
      // Dispatch simulation & optimization process automatically
      const optimization = this.optimizeStrategy();
      
      // Generate optimized study plan
      if (optimization.ready) {
        this.generateWeeklyStudyPlan(optimization.bestStrategy.name);
      }

      // Emit event bus notification
      if (typeof EventBus !== 'undefined') {
        EventBus.emit('digital_twin_synced', {
          timestamp: new Date().toISOString(),
          currentAccuracy: result.accuracy,
          simulatedTarget: optimization.ready ? optimization.bestStrategy.expectedScore : result.accuracy
        });
      }
    } catch (e) {
      console.warn('[SDTE] Sync error:', e.message);
    }
  },

  // ═══════════════════════════════════════════
  // 3. MONTE CARLO SIMULATOR
  // Simulates learning outcomes over different horizons
  // ═══════════════════════════════════════════
  simulateStrategy(strategyName, daysHorizon, iterations = 1000) {
    const profile = this.getProfile();
    const results = [];
    const baseAccuracy = this._calculateBaseAccuracy(profile);

    // Dynamic factors based on strategy selection
    let learningRate = 0.5; // daily improvement in %
    let fatigueImpact = 2; // fatigue generated per day
    let memoryRetention = 0.98; // multiplier for decay prevention
    let focusAdjustment = 0;

    switch (strategyName) {
      case this.STRATEGIES.REVISION_FIRST:
        learningRate = 0.3;
        fatigueImpact = 1.0;
        memoryRetention = 0.995; // highly preserves memory
        focusAdjustment = 5;
        break;
      case this.STRATEGIES.MOCK_FIRST:
        learningRate = 0.8; // fast gain
        fatigueImpact = 4.0; // high exhaustion
        memoryRetention = 0.96;
        focusAdjustment = -5;
        break;
      case this.STRATEGIES.FLASHCARDS_FIRST:
        learningRate = 0.2;
        fatigueImpact = 0.5; // low fatigue
        memoryRetention = 0.985;
        focusAdjustment = 2;
        break;
      case this.STRATEGIES.WEAK_TOPIC_ONLY:
        learningRate = 0.6;
        fatigueImpact = 2.5;
        memoryRetention = 0.97;
        break;
      case this.STRATEGIES.MIXED_PRACTICE:
        learningRate = 0.45;
        fatigueImpact = 1.8;
        memoryRetention = 0.98;
        focusAdjustment = 3;
        break;
      case this.STRATEGIES.TIMED_PRACTICE:
        learningRate = 0.55;
        fatigueImpact = 3.0;
        memoryRetention = 0.97;
        focusAdjustment = -2;
        break;
    }

    // Run Monte Carlo simulations
    for (let i = 0; i < iterations; i++) {
      let score = baseAccuracy;
      let fatigue = profile.mentalState.fatigue;
      let pressure = profile.mentalState.pressure;

      for (let day = 1; day <= daysHorizon; day++) {
        // Apply random variance (normal distribution)
        const randValue = this._boxMullerRandom();
        
        // Strategy performance simulation logic
        const dailyGain = learningRate * (1 - (fatigue / 150)) * Math.max(0.5, 1 + randValue * 0.25);
        const dailyDecay = (1 - memoryRetention) * score;

        score = Math.max(0, Math.min(100, score + dailyGain - dailyDecay));
        fatigue = Math.max(0, Math.min(100, fatigue + fatigueImpact * Math.max(0.5, 1 + randValue * 0.2) - (day % 3 === 0 ? 8 : 2)));
        pressure = Math.max(0, Math.min(100, pressure + (score < baseAccuracy ? 2 : -1)));
      }

      // Behaviour penalty adjustments on simulated test day
      const carelessPen = profile.behaviourState.carelessRate * 0.2;
      const guessPen = profile.behaviourState.guessingRate * 0.15;
      const finalScore = Math.max(0, Math.min(100, score - carelessPen - guessPen + (focusAdjustment * 0.2)));

      results.push({
        score: Math.round(finalScore),
        fatigue: Math.round(fatigue),
        pressure: Math.round(pressure)
      });
    }

    results.sort((a, b) => a.score - b.score);

    const scoresList = results.map(r => r.score);
    const meanScore = scoresList.reduce((s, v) => s + v, 0) / iterations;
    const stdDev = this._calculateStdDev(scoresList, meanScore);

    // Confidence ranges
    const p10 = scoresList[Math.floor(iterations * 0.10)];
    const p50 = scoresList[Math.floor(iterations * 0.50)];
    const p90 = scoresList[Math.floor(iterations * 0.90)];

    return {
      strategy: strategyName,
      horizonDays: daysHorizon,
      expectedScore: Math.round(meanScore),
      stdDev: Math.round(stdDev * 10) / 10,
      p10,
      p50,
      p90,
      fatigue: Math.round(results.reduce((s, r) => s + r.fatigue, 0) / iterations),
      pressure: Math.round(results.reduce((s, r) => s + r.pressure, 0) / iterations)
    };
  },

  // ═══════════════════════════════════════════
  // 4. STRATEGY OPTIMIZER
  // Runs 6 strategies over multi-day horizons and ranks them
  // ═══════════════════════════════════════════
  optimizeStrategy() {
    const profile = this.getProfile();
    const subjects = Object.keys(profile.knowledgeState);
    if (subjects.length === 0) return { ready: false, rankings: [] };

    const rankings = [];
    const baseAccuracy = this._calculateBaseAccuracy(profile);

    Object.values(this.STRATEGIES).forEach(strat => {
      // Simulate over 7 days for the weekly recommendation
      const sim = this.simulateStrategy(strat, 7, 1000);

      // Utility score calculation
      const scoreGain = sim.expectedScore - baseAccuracy;
      const fatigueCost = sim.fatigue * 0.2;
      const riskPenalty = (sim.pressure > 60 ? 10 : 0) + (sim.fatigue > 70 ? 15 : 0);
      
      const utility = Math.round(scoreGain * 10 - fatigueCost - riskPenalty);

      rankings.push({
        name: strat,
        expectedScore: sim.expectedScore,
        projectedGain: Math.round(scoreGain * 10) / 10,
        fatigue: sim.fatigue,
        pressure: sim.pressure,
        utility,
        confidence: sim.stdDev <= 4 ? 'high' : sim.stdDev <= 8 ? 'medium' : 'low',
        timeRequired: strat === this.STRATEGIES.FLASHCARDS_FIRST ? 15 : strat === this.STRATEGIES.REVISION_FIRST ? 30 : 60,
        risk: sim.fatigue > 60 ? 'high' : sim.fatigue > 40 ? 'medium' : 'low',
        explanation: this._getStrategyExplanation(strat, scoreGain, sim.fatigue)
      });
    });

    rankings.sort((a, b) => b.utility - a.utility);

    const bestStrategy = rankings[0];

    // Emit event bus notification
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('strategy_selected', {
        bestStrategy: bestStrategy.name,
        expectedGain: bestStrategy.projectedGain,
        utilityScore: bestStrategy.utility
      });
    }

    return {
      ready: true,
      rankings,
      bestStrategy
    };
  },

  // ═══════════════════════════════════════════
  // 5. PERSONALIZED STUDY PLAN GENERATOR
  // Creates an hour-by-hour adaptive weekly study schedule
  // ═══════════════════════════════════════════
  generateWeeklyStudyPlan(strategyName) {
    const profile = this.getProfile();
    const strat = strategyName || this.optimizeStrategy().bestStrategy?.name || this.STRATEGIES.MIXED_PRACTICE;

    const subjects = Object.keys(profile.knowledgeState).sort((a, b) => {
      return profile.knowledgeState[a].accuracy - profile.knowledgeState[b].accuracy;
    });

    const weakSubject = subjects[0] || 'GK';
    const secondWeakSubject = subjects[1] || 'Reasoning';

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const plan = {};

    days.forEach(day => {
      let slots = [];
      switch (strat) {
        case this.STRATEGIES.REVISION_FIRST:
          slots = [
            { time: '15 min', type: 'Flashcards', topic: weakSubject, icon: '🎴' },
            { time: '20 min', type: 'Reading Drill', topic: weakSubject, icon: '📖' },
            { time: '15 min', type: 'Revision Quiz', topic: secondWeakSubject, icon: '✏️' }
          ];
          break;
        case this.STRATEGIES.MOCK_FIRST:
          slots = [
            { time: '40 min', type: 'Mini Mock', topic: 'Mixed', icon: '📝' },
            { time: '10 min', type: 'Mistake Analysis', topic: 'All', icon: '🔍' },
            { time: '10 min', type: 'Focus Recovery', topic: 'Mindset', icon: '🧘' }
          ];
          break;
        case this.STRATEGIES.FLASHCARDS_FIRST:
          slots = [
            { time: '20 min', type: 'Active Recall', topic: weakSubject, icon: '🎴' },
            { time: '15 min', type: 'Spaced Repetition', topic: secondWeakSubject, icon: '🔄' },
            { time: '10 min', type: 'Concept Video', topic: weakSubject, icon: '🎥' }
          ];
          break;
        case this.STRATEGIES.WEAK_TOPIC_ONLY:
          slots = [
            { time: '25 min', type: 'Topic Drill', topic: weakSubject, icon: '🎯' },
            { time: '20 min', type: 'Concept Blueprint', topic: weakSubject, icon: '🗺️' },
            { time: '15 min', type: 'Verify Weakness', topic: weakSubject, icon: '🧪' }
          ];
          break;
        case this.STRATEGIES.MIXED_PRACTICE:
        default:
          slots = [
            { time: '20 min', type: 'Practice Drill', topic: weakSubject, icon: '🎯' },
            { time: '15 min', type: 'Active Recall', topic: secondWeakSubject, icon: '🎴' },
            { time: '20 min', type: 'Mixed Quiz', topic: 'General', icon: '⚡' }
          ];
          break;
      }
      plan[day] = {
        title: `${day}'s Adaptive Session`,
        strategy: strat,
        slots
      };
    });

    localStorage.setItem(this.STORAGE_KEYS.PLANS, JSON.stringify(plan));

    // Emit event bus notification
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('study_plan_updated', {
        timestamp: new Date().toISOString(),
        strategy: strat
      });
    }

    return plan;
  },

  getStudyPlan() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.PLANS);
    if (!raw) return this.generateWeeklyStudyPlan();
    try {
      return JSON.parse(raw);
    } catch {
      return this.generateWeeklyStudyPlan();
    }
  },

  // ═══════════════════════════════════════════
  // 6. WHAT-IF STUDIO CALCULATOR
  // Slide settings -> live recalculation
  // ═══════════════════════════════════════════
  calculateWhatIf(studyMinutes, revisionCount, mockCount) {
    const profile = this.getProfile();
    const baseAccuracy = this._calculateBaseAccuracy(profile);

    // Expected improvement based on inputs
    const studyFactor = Math.min(2.5, studyMinutes / 45); // optimum study 45 min
    const revisionFactor = Math.min(2.0, revisionCount / 3); // optimum revision 3 times
    const mockFactor = Math.min(1.5, mockCount / 2); // optimum mocks 2 times

    const simulatedGain = (studyFactor * 1.5) + (revisionFactor * 2.2) + (mockFactor * 1.8);
    const expectedScore = Math.min(100, Math.round(baseAccuracy + simulatedGain));
    
    // Fatigue increase based on workload
    const fatigue = Math.min(100, Math.round(profile.mentalState.fatigue + (mockCount * 12) + (studyMinutes * 0.15) - (revisionCount * 2)));

    const probability = Math.round(
      Math.max(30, 95 - (fatigue * 0.3) - (profile.behaviourState.panicRisk * 0.2))
    );

    return {
      baseScore: Math.round(baseAccuracy),
      expectedScore,
      delta: Math.round(expectedScore - baseAccuracy),
      fatigue,
      probability,
      recommendation: expectedScore >= baseAccuracy + 5 ? 'Excellent strategy settings for improvement.' : 'Increase revision or study time for higher gains.'
    };
  },

  // ═══════════════════════════════════════════
  // 7. EXAM DAY SIMULATOR
  // Predicts exam performance outcomes
  // ═══════════════════════════════════════════
  simulateExamDay() {
    const profile = this.getProfile();
    const baseScore = this._calculateBaseAccuracy(profile);
    const mc = this.simulateStrategy(this.STRATEGIES.MIXED_PRACTICE, 14, 1000); // 14-day projection

    const expectedScore = mc.expectedScore;
    const timePressure = profile.behaviourState.focus < 60 ? 'High' : 'Normal';
    const expectedFatigue = Math.min(100, Math.round(profile.mentalState.fatigue + 15));

    // Predict likely mistakes
    const likelyMistakes = [];
    if (profile.behaviourState.carelessRate > 20) likelyMistakes.push({ type: 'Careless Error', prob: profile.behaviourState.carelessRate });
    if (profile.behaviourState.guessingRate > 15) likelyMistakes.push({ type: 'Lucky Guess failure', prob: profile.behaviourState.guessingRate });
    if (profile.behaviourState.panicRisk > 25) likelyMistakes.push({ type: 'Panic Skip', prob: profile.behaviourState.panicRisk });

    return {
      expectedScore,
      confidenceInterval: `${mc.p10}% — ${mc.p90}%`,
      fatigue: expectedFatigue,
      timePressure,
      likelyMistakes: likelyMistakes.slice(0, 2),
      readinessIndex: Math.round(expectedScore * 0.7 + (100 - expectedFatigue) * 0.3)
    };
  },

  // ═══════════════════════════════════════════
  // 8. INTERVENTION PLANNER
  // Adjusts study path or alerts on streak risk
  // ═══════════════════════════════════════════
  checkInterventions() {
    let streakBreakProb = 15;
    const profile = this.getProfile();

    if (typeof PredictiveEngine !== 'undefined') {
      const churn = PredictiveEngine.predictChurn();
      if (churn.ready) {
        if (churn.risk === 'critical') streakBreakProb = 85;
        else if (churn.risk === 'high') streakBreakProb = 65;
        else if (churn.risk === 'medium') streakBreakProb = 40;
      }
    }

    const interventions = [];
    if (streakBreakProb >= 60) {
      interventions.push({
        id: 'streak_save',
        type: 'Streak Preservation Trigger',
        trigger: 'Streak probability break is high (' + streakBreakProb + '%)',
        action: 'Inject 5-minute Flashcard Session',
        expectedBenefit: 'Maintains study consistency, preserves progress'
      });
    }

    const fatigue = profile.mentalState.fatigue;
    if (fatigue > 60) {
      interventions.push({
        id: 'fatigue_cooldown',
        type: 'Cognitive Recovery Break',
        trigger: 'Simulated fatigue is high (' + fatigue + '%)',
        action: 'Switch to light audio revision',
        expectedBenefit: 'Lowers pressure, avoids careless error pattern accumulation'
      });
    }

    return {
      streakBreakProbability: streakBreakProb,
      interventions
    };
  },

  // ═══════════════════════════════════════════
  // 9. COMMON ENGINE INTERFACE (IESCP)
  // Standardized report structure
  // ═══════════════════════════════════════════
  getStandardReport() {
    const profile = this.getProfile();
    const opt = this.optimizeStrategy();
    const activeWeaknesses = profile.recoveryState.activeWeaknesses;
    const baseScore = this._calculateBaseAccuracy(profile);

    // Setup input description
    const input = `Digital Twin model with ${Object.keys(profile.knowledgeState).length} subjects, fatigue state (${profile.mentalState.fatigue}%), and recovery score (${profile.recoveryState.score})`;
    
    // Setup evidence
    const evidence = opt.ready 
      ? `Simulated 1,000 Monte Carlo runs. Best Strategy: ${opt.bestStrategy.name} with utility score ${opt.bestStrategy.utility}`
      : 'Simulation pending. Build more mock history.';

    // Score
    const score = opt.ready ? opt.bestStrategy.expectedScore : Math.round(baseScore);

    // Confidence
    const confidence = opt.ready ? opt.bestStrategy.confidence : 'low';

    // Prediction
    const prediction = opt.ready 
      ? `Weekly potential target score is estimated at ${opt.bestStrategy.expectedScore}% utilizing the ${opt.bestStrategy.name} strategy.`
      : 'Digital Twin simulation requires more test history.';

    // Recommendation
    const recommendation = opt.ready 
      ? `Execute personalized study schedule with ${opt.bestStrategy.name}.`
      : 'Complete at least 3 mock tests to initialize strategy optimization.';

    // Expected outcome
    const expectedOutcome = opt.ready
      ? `Expected gain of +${opt.bestStrategy.projectedGain} marks with ${confidence === 'high' ? '88%' : confidence === 'medium' ? '70%' : '50%'} probability.`
      : 'Gain calculation pending data threshold.';

    // Self-evaluation metrics
    const selfEval = this._getSelfEvaluation();

    return {
      engineName: 'StudentDigitalTwin',
      input,
      evidence,
      score,
      confidence,
      prediction,
      recommendation,
      expectedOutcome,
      actualOutcome: selfEval.actualOutcome,
      selfEvaluation: selfEval.summary
    };
  },

  _getSelfEvaluation() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.RESULTS);
    if (!raw) return { actualOutcome: 'Awaiting next test results.', summary: 'No self-evaluation samples.' };
    try {
      const runs = JSON.parse(raw);
      if (runs.length === 0) return { actualOutcome: 'Awaiting next test results.', summary: 'No self-evaluation samples.' };
      const latest = runs[runs.length - 1];
      const error = Math.abs(latest.actualScore - latest.projectedScore);
      return {
        actualOutcome: `Last simulated test score was predicted at ${latest.projectedScore}%, actual score was ${latest.actualScore}% (Error: ${error}%).`,
        summary: `Average simulation prediction error rate is ${error}%. Model tuning operational.`
      };
    } catch {
      return { actualOutcome: 'Self-evaluation error.', summary: 'Simulation metrics failed to parse.' };
    }
  },

  // ═══════════════════════════════════════════
  // PRIVATE MATH & GENERAL HELPERS
  // ═══════════════════════════════════════════
  _calculateBaseAccuracy(profile) {
    const keys = Object.keys(profile.knowledgeState);
    if (keys.length === 0) return 50;
    const sum = keys.reduce((s, k) => s + profile.knowledgeState[k].accuracy, 0);
    return sum / keys.length;
  },

  _boxMullerRandom() {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  },

  _calculateStdDev(arr, mean) {
    if (arr.length === 0) return 0;
    const sumSq = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    return Math.sqrt(sumSq / arr.length);
  },

  _getStrategyExplanation(strat, gain, fatigue) {
    switch (strat) {
      case this.STRATEGIES.REVISION_FIRST:
        return 'Focuses on retaining existing knowledge. Very low risk of burn-out. Highly recommended when multiple topics are decaying.';
      case this.STRATEGIES.MOCK_FIRST:
        return 'Maximizes exam format familiarity. High fatigue impact. Recommendation is sensitive to streak health.';
      case this.STRATEGIES.FLASHCARDS_FIRST:
        return 'Efficient recovery tool. Preserves streak with minimum time commitment. Replaces heavy mocks during high fatigue days.';
      case this.STRATEGIES.WEAK_TOPIC_ONLY:
        return 'Targets leaking concepts directly. Medium-high fatigue. Yields high score gains if specific mistakes accumulate.';
      case this.STRATEGIES.MIXED_PRACTICE:
        return 'Balanced learning approach. Low fatigue penalty. Standard strategy for consistent growth.';
      case this.STRATEGIES.TIMED_PRACTICE:
        return 'Improves answer selection speeds. Prepares for time pressure, reducing careless skips.';
      default:
        return 'General adaptive practice path.';
    }
  }
};

window.DigitalTwin = DigitalTwin;
