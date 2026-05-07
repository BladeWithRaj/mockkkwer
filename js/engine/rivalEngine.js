// ============================================
// RIVAL ENGINE — AI Opponent Simulation
// Weighted probabilities, humanized timing,
// personality-driven behavior, anti-robotic
// ============================================

const RivalEngine = {

  // Difficulty → accuracy tables (per question difficulty)
  ACCURACY: {
    beginner: { easy: 0.60, medium: 0.30, hard: 0.10 },
    medium:   { easy: 0.85, medium: 0.70, hard: 0.50 },
    expert:   { easy: 0.98, medium: 0.90, hard: 0.80 }
  },

  // Battle state
  _battle: null,

  /**
   * Initialize a new battle
   */
  createBattle(rival, totalQuestions) {
    this._battle = {
      rival,
      totalQuestions,
      rivalScore: 0,
      rivalAnswered: 0,
      rivalStreak: 0,
      rivalMaxStreak: 0,
      rivalResults: [],   // { correct, delay, questionIdx }
      pendingUpdates: [], // queued rival answers to show
      questionIdx: 0,
      startTime: Date.now(),
      _timers: [],
      finished: false
    };
    return this._battle;
  },

  /**
   * Simulate rival answering a question
   * Called when user sees a new question — rival starts "thinking"
   */
  simulateRivalAnswer(questionIdx, questionDifficulty) {
    if (!this._battle || this._battle.finished) return;

    const rival = this._battle.rival;
    const diff = questionDifficulty || 'medium';
    const accuracyTable = this.ACCURACY[rival.difficulty] || this.ACCURACY.medium;

    // Base accuracy for this question difficulty
    let baseAccuracy = accuracyTable[diff] || accuracyTable.medium;

    // Personality modifiers
    baseAccuracy = this._applyPersonality(baseAccuracy, questionIdx);

    // Anti-robotic: add noise (±5%)
    const noise = (Math.random() - 0.5) * 0.10;
    let finalAccuracy = Math.max(0.05, Math.min(0.99, baseAccuracy + noise));

    // Occasionally fail easy questions (human behavior)
    if (diff === 'easy' && Math.random() < 0.08) {
      finalAccuracy = 0.3; // surprise miss
    }

    // Decide if rival gets it correct
    const isCorrect = Math.random() < finalAccuracy;

    // Calculate answer delay
    const speed = RivalPool.SPEED_PROFILES[rival.speedProfile] || RivalPool.SPEED_PROFILES.normal;
    let delay = speed.min + Math.random() * (speed.max - speed.min);

    // Personality speed adjustments
    if (rival.personality === 'aggressive') delay *= 0.8;
    if (rival.personality === 'cautious') delay *= 1.3;
    if (rival.personality === 'clutch' && questionIdx > this._battle.totalQuestions * 0.6) delay *= 0.7;
    if (rival.personality === 'shaky' && questionIdx > this._battle.totalQuestions * 0.7) delay *= 1.2;

    // Add human variation (±20%)
    delay *= 0.8 + Math.random() * 0.4;
    delay = Math.max(1.2, Math.round(delay * 10) / 10);

    // Convert to ms
    const delayMs = Math.round(delay * 1000);

    // Schedule the rival's answer
    const timer = setTimeout(() => {
      if (!this._battle || this._battle.finished) return;

      this._battle.rivalAnswered++;
      if (isCorrect) {
        this._battle.rivalScore++;
        this._battle.rivalStreak++;
        this._battle.rivalMaxStreak = Math.max(this._battle.rivalMaxStreak, this._battle.rivalStreak);
      } else {
        this._battle.rivalStreak = 0;
      }

      this._battle.rivalResults.push({
        questionIdx,
        correct: isCorrect,
        delay: delayMs
      });

      // Queue update for UI (shown at randomized intervals)
      this._battle.pendingUpdates.push({
        correct: isCorrect,
        rivalScore: this._battle.rivalScore,
        rivalAnswered: this._battle.rivalAnswered,
        rivalStreak: this._battle.rivalStreak
      });

    }, delayMs);

    this._battle._timers.push(timer);
  },

  /**
   * Apply personality-based accuracy modifier
   */
  _applyPersonality(baseAcc, questionIdx) {
    if (!this._battle) return baseAcc;
    const total = this._battle.totalQuestions;
    const progress = questionIdx / total;

    switch (this._battle.rival.personality) {
      case 'aggressive':
        // Slightly lower accuracy (rushing)
        return baseAcc * 0.92;

      case 'steady':
        // No change — consistent
        return baseAcc;

      case 'cautious':
        // Higher accuracy but slower (already handled in speed)
        return Math.min(0.98, baseAcc * 1.05);

      case 'clutch':
        // Starts weak, finishes strong
        if (progress < 0.3) return baseAcc * 0.85;
        if (progress > 0.7) return Math.min(0.98, baseAcc * 1.1);
        return baseAcc;

      case 'shaky':
        // Starts strong, accuracy drops
        if (progress < 0.3) return Math.min(0.98, baseAcc * 1.08);
        if (progress > 0.6) return baseAcc * 0.8;
        return baseAcc;

      default:
        return baseAcc;
    }
  },

  /**
   * Get pending rival updates (call periodically from UI)
   * Returns updates and clears the queue
   */
  consumePendingUpdates() {
    if (!this._battle) return [];
    const updates = [...this._battle.pendingUpdates];
    this._battle.pendingUpdates = [];
    return updates;
  },

  /**
   * Get current rival status
   */
  getRivalStatus() {
    if (!this._battle) return null;
    return {
      name: this._battle.rival.name,
      emoji: this._battle.rival.emoji,
      score: this._battle.rivalScore,
      answered: this._battle.rivalAnswered,
      total: this._battle.totalQuestions,
      streak: this._battle.rivalStreak,
      maxStreak: this._battle.rivalMaxStreak,
      difficulty: this._battle.rival.difficulty,
      personality: this._battle.rival.personality
    };
  },

  /**
   * Finish battle — get final results
   */
  finishBattle(userScore, userTotal) {
    if (!this._battle) return null;
    this._battle.finished = true;

    // Clear all pending timers
    this._battle._timers.forEach(t => clearTimeout(t));

    // Fast-forward any unanswered questions
    while (this._battle.rivalAnswered < this._battle.totalQuestions) {
      const accuracyTable = this.ACCURACY[this._battle.rival.difficulty] || this.ACCURACY.medium;
      const isCorrect = Math.random() < accuracyTable.medium;
      this._battle.rivalAnswered++;
      if (isCorrect) this._battle.rivalScore++;
    }

    const rivalScore = this._battle.rivalScore;
    const rivalAccuracy = this._battle.totalQuestions > 0
      ? Math.round((rivalScore / this._battle.totalQuestions) * 100) : 0;
    const userAccuracy = userTotal > 0 ? Math.round((userScore / userTotal) * 100) : 0;

    let winner;
    if (userScore > rivalScore) winner = 'user';
    else if (rivalScore > userScore) winner = 'rival';
    else winner = 'draw';

    const result = {
      rival: this._battle.rival,
      userScore,
      rivalScore,
      userAccuracy,
      rivalAccuracy,
      totalQuestions: this._battle.totalQuestions,
      winner,
      userMaxStreak: 0, // filled by battle mode
      rivalMaxStreak: this._battle.rivalMaxStreak,
      duration: Math.round((Date.now() - this._battle.startTime) / 1000)
    };

    return result;
  },

  /**
   * Destroy battle state
   */
  destroy() {
    if (this._battle) {
      this._battle._timers.forEach(t => clearTimeout(t));
      this._battle = null;
    }
  }
};
