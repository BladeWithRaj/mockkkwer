// ============================================
// LEARNING ORCHESTRATOR & DECISION ENGINE (LODE) — Doc 24
// Version 1.0 — The Brain Above All Brains
//
// Consolidates suggestions from all 6 intelligence engines,
// resolves conflicts, runs consensus math, manages action budgets,
// and enforces engine trust score evaluations dynamically.
// ============================================

const LearningOrchestrator = {
  STORAGE_KEYS: {
    HISTORY: 'mtp_decision_history',
    TRUST: 'mtp_engine_trust',
    LOGS: 'mtp_consensus_logs'
  },

  BUDGETS: {
    maxMinutes: 45,
    maxTopics: 2,
    maxMocks: 1
  },

  // ═══════════════════════════════════════════
  // 1. VOTING AGGREGATION & CONSENSUS ENGINE
  // Consolidates report data from all underlying brains
  // ═══════════════════════════════════════════
  generateDailyDecision() {
    const trustScores = this.getTrustScores();
    const votes = [];

    // 1. LearningIntelligence
    if (typeof LearningIntelligence !== 'undefined' && LearningIntelligence.getStandardReport) {
      const rep = LearningIntelligence.getStandardReport();
      votes.push(this._parseEngineVote('LearningIntelligence', rep, trustScores.LearningIntelligence));
    }
    // 2. BehaviourEngine
    if (typeof BehaviourEngine !== 'undefined' && BehaviourEngine.getStandardReport) {
      const rep = BehaviourEngine.getStandardReport();
      votes.push(this._parseEngineVote('BehaviourEngine', rep, trustScores.BehaviourEngine));
    }
    // 3. MistakeDNA
    if (typeof MistakeDNA !== 'undefined' && MistakeDNA.getStandardReport) {
      const rep = MistakeDNA.getStandardReport();
      votes.push(this._parseEngineVote('MistakeDNA', rep, trustScores.MistakeDNA));
    }
    // 4. CorrectionEngine
    if (typeof CorrectionEngine !== 'undefined' && CorrectionEngine.getStandardReport) {
      const rep = CorrectionEngine.getStandardReport();
      votes.push(this._parseEngineVote('CorrectionEngine', rep, trustScores.CorrectionEngine));
    }
    // 5. PredictiveEngine
    if (typeof PredictiveEngine !== 'undefined' && PredictiveEngine.getStandardReport) {
      const rep = PredictiveEngine.getStandardReport();
      votes.push(this._parseEngineVote('PredictiveEngine', rep, trustScores.PredictiveEngine));
    }
    // 6. DigitalTwin
    if (typeof DigitalTwin !== 'undefined' && DigitalTwin.getStandardReport) {
      const rep = DigitalTwin.getStandardReport();
      votes.push(this._parseEngineVote('StudentDigitalTwin', rep, trustScores.StudentDigitalTwin));
    }

    if (votes.length === 0) return { ready: false, decision: null };

    // Group votes by recommended action type
    const actionGroups = {};
    votes.forEach(v => {
      if (!v.actionType) return;
      if (!actionGroups[v.actionType]) {
        actionGroups[v.actionType] = {
          action: v.recommendation,
          votes: [],
          totalTrust: 0,
          maxScore: 0,
          expectedGain: 0,
          actionType: v.actionType,
          details: v
        };
      }
      actionGroups[v.actionType].votes.push(v.engineName);
      actionGroups[v.actionType].totalTrust += v.trust;
      actionGroups[v.actionType].maxScore = Math.max(actionGroups[v.actionType].maxScore, v.decisionScore);
      actionGroups[v.actionType].expectedGain = Math.max(actionGroups[v.actionType].expectedGain, v.expectedGain);
    });

    const rankedActions = Object.values(actionGroups).sort((a, b) => b.maxScore - a.maxScore);
    if (rankedActions.length === 0) return { ready: false, decision: null };

    // Select winning decision
    const winner = rankedActions[0];

    // Determine consensus type
    let consensusType = 'Split';
    const totalEngines = votes.filter(v => v.actionType).length;
    const voteCountForWinner = winner.votes.length;

    if (voteCountForWinner === totalEngines) {
      consensusType = 'Unanimous';
    } else if (voteCountForWinner >= Math.ceil(totalEngines / 2) + 1) {
      consensusType = 'Majority';
    } else if (voteCountForWinner === 1 && totalEngines > 1) {
      consensusType = 'Conflict';
    }

    // Resolve conflicts if split/conflict occurs
    if (consensusType === 'Conflict' || consensusType === 'Split') {
      if (typeof EventBus !== 'undefined') {
        EventBus.emit('engine_conflict', {
          actionGroups: Object.keys(actionGroups),
          resolvedTo: winner.actionType
        });
      }
    }

    // Enforce budgets on winning decision
    const budgetedAction = this._enforceActionBudget(winner);

    const decisionObj = {
      id: 'decision_' + Date.now(),
      action: budgetedAction.action,
      actionType: winner.actionType,
      targetSubject: winner.details.targetSubject,
      consensus: consensusType,
      confidence: Math.round(winner.maxScore / 10),
      expectedGain: winner.expectedGain,
      reason: this._generateExplainableText(winner, votes, consensusType),
      auditTrail: votes,
      budget: budgetedAction.budget,
      timestamp: new Date().toISOString(),
      status: 'pending' // pending | accepted | ignored | completed | failed
    };

    // Save decision to active queue
    this._saveDecisionToHistory(decisionObj);

    // Save consensus logs
    this._logConsensus(winner, votes, consensusType);

    // Emit event bus notification
    if (typeof EventBus !== 'undefined') {
      EventBus.emit('decision_generated', decisionObj);
      EventBus.emit('consensus_reached', { consensus: consensusType, winner: winner.actionType });
    }

    return {
      ready: true,
      decision: decisionObj
    };
  },

  // ═══════════════════════════════════════════
  // 2. TRUST SCORE MANAGER & FEEDBACK LOOP
  // Evaluates decision outcomes and adjusts trust scores
  // ═══════════════════════════════════════════
  getTrustScores() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.TRUST);
    if (!raw) {
      const defaultTrust = {
        LearningIntelligence: 90,
        BehaviourEngine: 85,
        MistakeDNA: 88,
        CorrectionEngine: 90,
        PredictiveEngine: 87,
        StudentDigitalTwin: 88,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(this.STORAGE_KEYS.TRUST, JSON.stringify(defaultTrust));
      return defaultTrust;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  recordUserAction(decisionId, status) {
    const history = this._getHistory();
    const idx = history.findIndex(d => d.id === decisionId);
    if (idx === -1) return;

    history[idx].status = status;
    history[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));

    // Emit EventBus notification
    if (typeof EventBus !== 'undefined') {
      EventBus.emit(`decision_${status}`, { decisionId });
    }
  },

  evaluateDecisions(result) {
    if (!result) return;
    const history = this._getHistory();
    const pendingDecision = history.find(d => d.status === 'accepted');

    if (!pendingDecision) return;

    const actualAccuracy = result.accuracy || 0;
    
    // Find expected gain vs actual gain
    // In our simplified logic: we verify if the accuracy increased matching the recommendation
    const predictedGain = pendingDecision.expectedGain || 0;
    
    // Get last historic score
    let baseScore = actualAccuracy - 2;
    if (typeof DailySystem !== 'undefined') {
      const progress = DailySystem.getProgress() || [];
      if (progress.length >= 2) {
        baseScore = progress[progress.length - 2].accuracy;
      }
    }

    const actualGain = Math.max(0, actualAccuracy - baseScore);
    const difference = Math.abs(actualGain - predictedGain);
    const success = actualGain >= Math.round(predictedGain * 0.7);

    // Update status
    pendingDecision.status = success ? 'completed' : 'failed';
    pendingDecision.actualOutcome = `Expected gain: +${predictedGain} marks. Actual gain: +${actualGain} marks (Accuracy: ${actualAccuracy}%).`;
    pendingDecision.updatedAt = new Date().toISOString();

    // Adjust engine trust scores
    const trust = this.getTrustScores();
    pendingDecision.auditTrail.forEach(vote => {
      const wasVoteCorrect = vote.actionType === pendingDecision.actionType;
      
      let change = 0;
      if (wasVoteCorrect && success) {
        change = 2; // minor reward
      } else if (!wasVoteCorrect && success) {
        change = -1; // minor penalty for recommending the wrong strategy
      } else if (wasVoteCorrect && !success) {
        change = -3; // penalty for recommending failed strategy
      } else {
        change = 1; // reward for recommending against the failed strategy
      }

      const currentScore = trust[vote.engineName] || 85;
      trust[vote.engineName] = Math.max(30, Math.min(99, currentScore + change));
    });

    trust.updatedAt = new Date().toISOString();
    localStorage.setItem(this.STORAGE_KEYS.TRUST, JSON.stringify(trust));
    localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  // ═══════════════════════════════════════════
  // PRIVATE AND PARSING HELPERS
  // ═══════════════════════════════════════════
  _parseEngineVote(engineName, report, trustScore) {
    let actionType = 'revision'; // revision | mock | flashcards | drill
    let recommendation = report.recommendation || '';
    let expectedGain = 3;
    let urgency = 50;
    let riskReduction = 40;

    // Detect action types from keywords
    const recLower = recommendation.toLowerCase();
    if (recLower.includes('mock') || recLower.includes('test')) {
      actionType = 'mock';
      expectedGain = 5;
    } else if (recLower.includes('flashcard') || recLower.includes('recall') || recLower.includes('repetition')) {
      actionType = 'flashcards';
      expectedGain = 2;
    } else if (recLower.includes('drill') || recLower.includes('practice')) {
      actionType = 'drill';
      expectedGain = 4;
    }

    // Resolve urgency & risk reduction from reports
    const evidenceLower = (report.evidence || '').toLowerCase();
    if (evidenceLower.includes('critical') || evidenceLower.includes('urgent') || evidenceLower.includes('drop')) {
      urgency = 85;
      riskReduction = 80;
    } else if (evidenceLower.includes('high') || evidenceLower.includes('fatigue')) {
      urgency = 70;
      riskReduction = 60;
    }

    // Parse numeric expected outcome if possible
    const matchOutcome = (report.expectedOutcome || '').match(/\+(\d+)/);
    if (matchOutcome && matchOutcome[1]) {
      expectedGain = parseInt(matchOutcome[1]);
    }

    // Parse target subject
    let targetSubject = 'General';
    ['GK', 'English', 'Reasoning', 'Math'].forEach(sub => {
      if (recLower.includes(sub.toLowerCase()) || evidenceLower.includes(sub.toLowerCase())) {
        targetSubject = sub;
      }
    });

    // Score = trust * confidenceWeight * expectedGain * urgency * riskReduction
    const confWeight = report.confidence === 'high' ? 1.0 : report.confidence === 'medium' ? 0.7 : 0.4;
    const decisionScore = Math.round(
      trustScore * confWeight * (expectedGain * 0.2) * (urgency / 50) * (riskReduction / 40)
    );

    return {
      engineName,
      actionType,
      recommendation,
      expectedGain,
      urgency,
      riskReduction,
      confidence: report.confidence,
      trust: trustScore,
      decisionScore,
      targetSubject
    };
  },

  _enforceActionBudget(winner) {
    let action = winner.action;
    const budget = { minutes: 30, limit: 1 };

    switch (winner.actionType) {
      case 'mock':
        action = `Attempt 1 Mini Mock session (${this.BUDGETS.maxMinutes} mins) in ${winner.details.targetSubject}`;
        budget.minutes = this.BUDGETS.maxMinutes;
        budget.limit = this.BUDGETS.maxMocks;
        break;
      case 'flashcards':
        action = `Review maximum 15 flashcards (15 mins) on ${winner.details.targetSubject}`;
        budget.minutes = 15;
        budget.limit = 15;
        break;
      case 'drill':
      case 'revision':
      default:
        action = `Complete 25-minute practice drill on ${winner.details.targetSubject}`;
        budget.minutes = 25;
        budget.limit = this.BUDGETS.maxTopics;
        break;
    }

    return { action, budget };
  },

  _generateExplainableText(winner, votes, consensusType) {
    const list = [];
    votes.forEach(v => {
      const active = v.actionType === winner.actionType;
      list.push(`• <strong>${v.engineName}</strong> recommended: <em>"${v.recommendation}"</em> (Confidence: ${v.confidence}, Trust score: ${v.trust}%)${active ? ' [Aligned]' : ''}`);
    });

    return `
      <strong>Orchestrator Consensus: ${consensusType}</strong><br>
      The Chief AI evaluated votes from ${votes.length} active engines and resolved conflict towards a ${winner.actionType} pathway:<br>
      <div style="margin-top:4px;font-size:11px;line-height:1.4">${list.join('<br>')}</div>
    `;
  },

  _saveDecisionToHistory(decision) {
    const history = this._getHistory();
    history.unshift(decision);
    if (history.length > 50) history.length = 50;
    localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));
  },

  _getHistory() {
    const raw = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  _logConsensus(winner, votes, consensusType) {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.LOGS);
      const logs = raw ? JSON.parse(raw) : [];
      logs.unshift({
        timestamp: new Date().toISOString(),
        consensus: consensusType,
        winnerType: winner.actionType,
        votes: votes.map(v => ({ engine: v.engineName, type: v.actionType, score: v.decisionScore }))
      });
      if (logs.length > 50) logs.length = 50;
      localStorage.setItem(this.STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('[LODE] Logging failed:', e.message);
    }
  }
};

window.LearningOrchestrator = LearningOrchestrator;
