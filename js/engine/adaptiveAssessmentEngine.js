// ============================================
// ADAPTIVE ASSESSMENT ENGINE (AAE) — Doc 25
// Version 1.0 — Every Test Should Be Personal
//
// Dynamically constructs personalized blueprints and question selections
// based on cognitive gaps, mistake history, and Digital Twin projections.
// ============================================

const AdaptiveAssessmentEngine = {
  STORAGE_KEYS: {
    QUESTION_INTEL: 'mtp_question_intelligence',
    RELATIONSHIPS: 'mtp_question_relationships',
    SESSIONS: 'mtp_assessment_sessions',
    QUALITY: 'mtp_assessment_quality',
    GAIN_HISTORY: 'mtp_learning_gain_history',
    DIAGNOSTICS: 'mtp_diagnostic_questions',
    VERIFICATIONS: 'mtp_verification_attempts',
    BLUEPRINTS: 'mtp_adaptive_blueprints'
  },

  PAPER_TYPES: {
    RECOVERY: 'Recovery Test',
    REVISION: 'Revision Test',
    EXAM_SIMULATION: 'Exam Simulation',
    WEAK_DRILL: 'Weak Topic Drill',
    SPEED_TEST: 'Speed Test',
    CONFIDENCE_TEST: 'Confidence Test',
    MEMORY_TEST: 'Memory Test',
    DIAGNOSTIC: 'Diagnostic Test',
    READINESS: 'Readiness Test'
  },

  // ═══════════════════════════════════════════
  // 1. PAPER GENERATION & OPTIMIZATION
  // Intercepts raw questions pool and selects the best adaptive subset
  // ═══════════════════════════════════════════
  generateAdaptivePaper(candidateQuestions, config = {}) {
    const limit = config.limit || config.totalQuestions || 10;
    const paperType = config.paperType || this.PAPER_TYPES.READINESS;
    const durationMin = config.durationMinutes || (limit * 1.5); // standard 1.5 mins per question

    if (!candidateQuestions || candidateQuestions.length === 0) {
      return { success: false, questions: [], error: 'Empty candidate question pool.' };
    }

    const profile = typeof DigitalTwin !== 'undefined' ? DigitalTwin.buildProfile() : null;
    const baseAccuracy = profile ? this._calculateBaseAccuracy(profile) : 60;

    // Enrich and map all candidate questions with intelligence metadata
    const enriched = candidateQuestions.map(q => this.enrichQuestionProfile(q));

    // Dynamic Blueprint Generation based on Student Model
    const blueprint = this.generateAdaptiveBlueprint(paperType, limit, profile);

    // Calculate Expected Learning Gain for each candidate question
    const scoredQuestions = enriched.map(q => {
      const score = this.calculateExpectedLearningGain(q, profile, baseAccuracy);
      return { ...q, learningGainScore: score };
    });

    // Strategy-based and difficulty-based filtering
    let selected = [];
    const subjects = blueprint.subjects;

    // 1. Group scored questions by subject
    const bySubject = {};
    scoredQuestions.forEach(q => {
      const sub = q.subject ? q.subject.toUpperCase() : 'GENERAL';
      if (!bySubject[sub]) bySubject[sub] = [];
      bySubject[sub].push(q);
    });

    // 2. Select questions per subject according to blueprint distribution
    Object.entries(subjects).forEach(([sub, neededCount]) => {
      const candidates = bySubject[sub] || scoredQuestions.filter(q => !q.subject); // fallback to general
      // Sort candidates by learning gain score descending
      candidates.sort((a, b) => b.learningGainScore - a.learningGainScore);
      
      // Inject Diagnostic & Verification items specifically
      const subSelected = candidates.slice(0, neededCount);
      selected.push(...subSelected);
    });

    // If still short of limit, backfill from remaining high-scoring items
    if (selected.length < limit) {
      const selectedIds = selected.map(s => s.id);
      const remaining = scoredQuestions.filter(q => !selectedIds.includes(q.id));
      remaining.sort((a, b) => b.learningGainScore - a.learningGainScore);
      selected.push(...remaining.slice(0, limit - selected.length));
    }

    // Question Diversity Engine (prevent duplicate patterns & clusters)
    selected = this.enforceQuestionDiversity(selected);

    // Duplicate Prevention (avoid recently seen question ids)
    const used = JSON.parse(localStorage.getItem('used_ids') || '[]');
    const freshSelected = selected.filter(q => !used.includes(q.id));
    if (freshSelected.length >= limit) {
      selected = freshSelected;
    } else {
      const usedSelected = selected.filter(q => used.includes(q.id));
      selected = [...freshSelected, ...usedSelected].slice(0, limit);
    }

    // Diagnostic & Confidence Calibration question injection
    selected = this._injectSpecialtyQuestions(selected, paperType);

    // Predictive Validation (Digital Twin simulation quality check)
    const quality = this.evaluatePaperQuality(selected, paperType, profile);

    // If predicted gain is too low and we have backup candidates, rebuild/tweak
    if (quality.learningGain < 30 && scoredQuestions.length > limit * 2) {
      // Re-sort with a bias towards high mistake frequency topics
      scoredQuestions.sort((a, b) => (b.mistakeFrequency || 0) - (a.mistakeFrequency || 0));
      selected = scoredQuestions.slice(0, limit);
    }

    // Record session info
    const sessionObj = {
      sessionId: 'session_' + Date.now(),
      paperType,
      limit,
      qualityScore: quality.qualityScore,
      expectedLearningGain: quality.learningGain,
      evaluatedSkills: quality.evaluatedSkills,
      topicsToImprove: quality.topicsExpectedToImprove,
      timestamp: new Date().toISOString()
    };
    this._saveSession(sessionObj);

    return {
      success: true,
      questions: selected.slice(0, limit),
      session: sessionObj,
      quality
    };
  },

  // ═══════════════════════════════════════════
  // 2. QUESTION INTELLIGENCE MODEL
  // Generates cognitive and statistical metadata for questions
  // ═══════════════════════════════════════════
  enrichQuestionProfile(q) {
    const rawIntel = localStorage.getItem(this.STORAGE_KEYS.QUESTION_INTEL);
    const db = rawIntel ? JSON.parse(rawIntel) : {};

    if (db[q.id]) return { ...q, ...db[q.id] };

    // Standard static parameters based on topic & difficulty
    const isGK = (q.subject || '').toUpperCase() === 'GK';
    const isHard = (q.difficulty || '').toLowerCase() === 'hard';
    const isEasy = (q.difficulty || '').toLowerCase() === 'easy';

    const enriched = {
      ...q,
      bloomLevel: isHard ? 'Analyze' : isGK ? 'Remember' : 'Apply',
      estimatedSeconds: isHard ? 120 : isGK ? 30 : 60,
      guessRate: isGK ? 35 : 15,
      averageAccuracy: isHard ? 45 : isEasy ? 85 : 65,
      discriminationIndex: Math.round((0.3 + Math.random() * 0.4) * 100) / 100, // item response theory
      learningValue: isHard ? 80 : 40,
      examFrequency: isHard ? 65 : 45,
      mistakeFrequency: 0,
      similarClusterId: 'cluster_' + (q.topic || 'general').toLowerCase().replace(/\s/g, '_')
    };

    // Increment mistake history if student got it wrong previously
    if (typeof MistakeDNA !== 'undefined') {
      const snaps = MistakeDNA._getSnapshots();
      snaps.forEach(snap => {
        if (snap.topicCauses?.some(tc => tc.topic === q.topic)) {
          enriched.mistakeFrequency += 1;
        }
      });
    }

    db[q.id] = enriched;
    localStorage.setItem(this.STORAGE_KEYS.QUESTION_INTEL, JSON.stringify(db));
    return enriched;
  },

  // ═══════════════════════════════════════════
  // 3. LEARNING GAIN OPTIMIZER
  // Math: expected gain score for question selection
  // ═══════════════════════════════════════════
  calculateExpectedLearningGain(q, profile, baseAccuracy) {
    const sub = q.subject ? q.subject.toUpperCase() : 'GENERAL';
    const sp = profile?.knowledgeState[sub] || { accuracy: 60, attempts: 5, weaknessScore: 20 };

    const knowledgeGap = Math.max(10, 100 - sp.accuracy); // higher gap = higher gain
    const examImportance = q.examFrequency || 50;
    const mistakeFrequency = Math.min(5, q.mistakeFrequency || 0) * 15;
    const confidenceWeight = profile ? (100 - profile.confidence) / 100 : 0.3;
    const recoveryPotential = typeof CorrectionEngine !== 'undefined'
      ? (CorrectionEngine.getRecoveryPassport()?.stats?.treating || 1) * 20
      : 30;

    // expected gain = gap * importance * mistakes * recovery potential
    const score = Math.round(
      (knowledgeGap * 0.3) +
      (examImportance * 0.2) +
      (mistakeFrequency * 0.3) +
      (recoveryPotential * 0.2) +
      (confidenceWeight * 10)
    );

    return score;
  },

  // ═══════════════════════════════════════════
  // 4. ADAPTIVE BLUEPRINTS
  // Dynamic subject and topic distribution blueprints
  // ═══════════════════════════════════════════
  generateAdaptiveBlueprint(paperType, totalQuestions, profile) {
    const blueprint = {
      paperType,
      totalQuestions,
      subjects: {},
      updatedAt: new Date().toISOString()
    };

    const subs = profile ? Object.keys(profile.knowledgeState) : ['GK', 'ENGLISH', 'REASONING'];
    if (subs.length === 0) {
      subs.push('GK', 'ENGLISH', 'REASONING');
    }

    // Default equal distribution
    const baseCount = Math.floor(totalQuestions / subs.length);
    subs.forEach(s => {
      blueprint.subjects[s.toUpperCase()] = baseCount;
    });

    // Custom distributions based on Paper Type
    if (paperType === this.PAPER_TYPES.RECOVERY && profile) {
      // Over-weight weak subjects
      const weakRank = Object.entries(profile.knowledgeState).sort((a, b) => a[1].accuracy - b[1].accuracy);
      if (weakRank[0]) {
        const topWeak = weakRank[0][0].toUpperCase();
        blueprint.subjects[topWeak] = Math.ceil(totalQuestions * 0.6);
        
        // Distribute remainder
        const rem = totalQuestions - blueprint.subjects[topWeak];
        const otherSubs = subs.filter(s => s.toUpperCase() !== topWeak);
        if (otherSubs.length > 0) {
          const split = Math.floor(rem / otherSubs.length);
          otherSubs.forEach(s => {
            blueprint.subjects[s.toUpperCase()] = split;
          });
        }
      }
    } else if (paperType === this.PAPER_TYPES.DIAGNOSTIC) {
      // Broad coverage of all subjects to find new gaps
      const count = Math.floor(totalQuestions / subs.length);
      subs.forEach(s => {
        blueprint.subjects[s.toUpperCase()] = count;
      });
    }

    // Backfill rounding issues
    let sum = Object.values(blueprint.subjects).reduce((a, b) => a + b, 0);
    if (sum !== totalQuestions) {
      const diff = totalQuestions - sum;
      const first = subs[0].toUpperCase();
      blueprint.subjects[first] = (blueprint.subjects[first] || 0) + diff;
    }

    // Save blueprint
    const raw = localStorage.getItem(this.STORAGE_KEYS.BLUEPRINTS);
    const db = raw ? JSON.parse(raw) : [];
    db.unshift(blueprint);
    if (db.length > 20) db.length = 20;
    localStorage.setItem(this.STORAGE_KEYS.BLUEPRINTS, JSON.stringify(db));

    return blueprint;
  },

  // ═══════════════════════════════════════════
  // 5. QUESTION DIVERSITY & SECURITY GATES
  // Prevent duplicate patterns and ensure cognitive balance
  // ═══════════════════════════════════════════
  enforceQuestionDiversity(questions) {
    const selected = [];
    const seenClusters = new Set();
    const seenTopics = {};

    questions.forEach(q => {
      const cluster = q.similarClusterId || q.id;
      const topic = q.topic || 'general';

      // Diversity checks:
      // Allow max 1 question from same similar cluster
      // Allow max 3 questions from same topic
      const topicCount = seenTopics[topic] || 0;
      if (!seenClusters.has(cluster) && topicCount < 3) {
        selected.push(q);
        seenClusters.add(cluster);
        seenTopics[topic] = topicCount + 1;
      }
    });

    return selected;
  },

  evaluatePaperQuality(questions, paperType, profile) {
    if (!questions || questions.length === 0) {
      return {
        qualityScore: 0,
        learningGain: 0,
        difficultyBalance: 'N/A',
        evaluatedSkills: [],
        topicsExpectedToImprove: []
      };
    }
    const accuracyList = questions.map(q => q.averageAccuracy || 65);
    const meanAcc = accuracyList.reduce((s, v) => s + v, 0) / questions.length;
    const stdDev = this._calculateStdDev(accuracyList, meanAcc);

    // Expected Learning Gain average
    const gainList = questions.map(q => q.learningGainScore || 50);
    const meanGain = Math.round(gainList.reduce((s, v) => s + v, 0) / questions.length);

    // Calculate quality indicators
    const coverageScore = Math.min(100, Math.round(new Set(questions.map(q => q.topic)).size * 18));
    const difficultyScore = Math.max(10, Math.min(99, Math.round(100 - stdDev * 3)));
    
    // Evaluate skills list
    const evaluatedSkills = [...new Set(questions.map(q => q.bloomLevel || 'Apply'))];
    const topicsExpectedToImprove = [...new Set(questions.filter(q => (q.mistakeFrequency || 0) > 0).map(q => q.topic))];

    return {
      qualityScore: Math.round(coverageScore * 0.4 + difficultyScore * 0.3 + meanGain * 0.3),
      learningGain: meanGain,
      difficultyBalance: stdDev < 15 ? 'Balanced' : 'High Variance',
      evaluatedSkills: evaluatedSkills.slice(0, 3),
      topicsExpectedToImprove: topicsExpectedToImprove.slice(0, 3)
    };
  },

  // ═══════════════════════════════════════════
  // PRIVATE AND SPECIALTY HELPERS
  // ═══════════════════════════════════════════
  _injectSpecialtyQuestions(questions, paperType) {
    // Inject confidence detection questions
    // In local simulation, we tag 1-2 questions as specialty triggers
    if (questions.length < 3) return questions;

    const modified = [...questions];
    // Mark index 1 as confidence calibration item
    modified[1] = {
      ...modified[1],
      isConfidenceCalibration: true,
      calibrationType: 'guessDetect',
      expectedSeconds: 15 // fast response expectation
    };

    if (paperType === this.PAPER_TYPES.DIAGNOSTIC && modified[2]) {
      modified[2] = {
        ...modified[2],
        isDiagnosticItem: true,
        uncertaintyReductionVal: 85
      };
    }

    return modified;
  },

  _calculateBaseAccuracy(profile) {
    const keys = Object.keys(profile.knowledgeState);
    if (keys.length === 0) return 50;
    const sum = keys.reduce((s, k) => s + profile.knowledgeState[k].accuracy, 0);
    return sum / keys.length;
  },

  _calculateStdDev(arr, mean) {
    if (arr.length === 0) return 0;
    const sumSq = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    return Math.sqrt(sumSq / arr.length);
  },

  _saveSession(session) {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEYS.SESSIONS);
      const db = raw ? JSON.parse(raw) : [];
      db.unshift(session);
      if (db.length > 50) db.length = 50;
      localStorage.setItem(this.STORAGE_KEYS.SESSIONS, JSON.stringify(db));
    } catch (e) {
      console.warn('[AAE] Session logging failed:', e.message);
    }
  }
};

window.AdaptiveAssessmentEngine = AdaptiveAssessmentEngine;
