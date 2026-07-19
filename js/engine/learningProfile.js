// ============================================
// LEARNING PROFILE ENGINE — Doc 8 §28A
// Single source of truth per student.
// Aggregates: accuracy, speed, confidence,
// mistake types, revision schedule, trends.
// Local-first — backend sync hook is a TODO.
// ============================================

const LearningProfile = {

  VERSION: 1,

  // ── GET / INIT ──
  get() {
    const stored = Storage.getLearningProfile();
    if (stored && stored.version === this.VERSION) return stored;
    return this._defaultProfile();
  },

  _defaultProfile() {
    return {
      version: this.VERSION,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      subjectProfiles: {},
      overallTrend: 'stable',   // 'up' | 'down' | 'stable'
      weakestSubject: null,
      strongestSubject: null,
      totalQuestionsAnswered: 0,
      totalTestsTaken: 0,
      coachMessage: null,       // { text, type, generatedAt }
      revisionQueue: [],        // subjects due for revision today
      // TODO: backend sync hook — POST /api/learning-profile when online
    };
  },

  // ── SUBJECT PROFILE DEFAULT ──
  _defaultSubjectProfile(subject) {
    return {
      subject,
      attempts: 0,
      correct: 0,
      wrong: 0,
      accuracy: 0,
      avgSpeed: 0,            // avg seconds per question
      trend: 'stable',        // 'up' | 'down' | 'stable'
      confidenceCorrect: 0,   // fraction: correct + confident
      confidenceWrong: 0,     // fraction: wrong + confident → misconception
      mistakeTypes: {
        concept: 0,
        calculation: 0,
        reading: 0,
        guess: 0,
        timePressure: 0,
        careless: 0
      },
      accuracyHistory: [],    // last 10 test accuracies for this subject
      lastAttempted: null,
      revisionSchedule: {
        nextRevision: null,
        intervalDays: 1,
        lastRevised: null
      },
      weaknessScore: 0        // compound score from §7 formula
    };
  },

  // ════ UPDATE AFTER TEST (Doc 8 §6) ════
  updateAfterTest(result) {
    if (!result) return;
    const profile = this.get();
    const subjectWise = result.subjectWise || {};
    const today = this._today();

    profile.totalTestsTaken += 1;
    profile.totalQuestionsAnswered += (result.correct || 0) + (result.wrong || 0) + (result.skipped || 0);

    // Update per-subject profiles
    Object.entries(subjectWise).forEach(([subject, data]) => {
      if (!profile.subjectProfiles[subject]) {
        profile.subjectProfiles[subject] = this._defaultSubjectProfile(subject);
      }
      const sp = profile.subjectProfiles[subject];
      const attempted = (data.correct || 0) + (data.wrong || 0);
      const prevAttempts = sp.attempts;

      sp.attempts += attempted;
      sp.correct  += data.correct || 0;
      sp.wrong    += data.wrong   || 0;

      // Running accuracy
      const newAcc = sp.attempts > 0 ? Math.round((sp.correct / sp.attempts) * 100) : 0;
      const prevAcc = sp.accuracy;
      sp.trend = newAcc > prevAcc + 2 ? 'up' : newAcc < prevAcc - 2 ? 'down' : 'stable';
      sp.accuracy = newAcc;

      // Accuracy history (keep last 10)
      sp.accuracyHistory.push(newAcc);
      if (sp.accuracyHistory.length > 10) sp.accuracyHistory.shift();

      // Speed estimate (weighted avg)
      if (data.timeTaken && attempted > 0) {
        const thisSpeed = Math.round(data.timeTaken / attempted);
        sp.avgSpeed = prevAttempts > 0
          ? Math.round((sp.avgSpeed * prevAttempts + thisSpeed * attempted) / sp.attempts)
          : thisSpeed;
      }

      sp.lastAttempted = today;

      // Revision schedule — if accuracy < 60%, schedule for tomorrow
      if (newAcc < 60 && !sp.revisionSchedule.nextRevision) {
        sp.revisionSchedule.nextRevision = this._addDays(today, 1);
        sp.revisionSchedule.intervalDays = 1;
      }

      // Weakness score (Doc 8 §7)
      sp.weaknessScore = this._calcWeaknessScore(sp);
    });

    // Identify weakest/strongest
    const subjects = Object.values(profile.subjectProfiles)
      .filter(sp => sp.attempts >= 5)
      .sort((a, b) => a.accuracy - b.accuracy);

    if (subjects.length > 0) {
      profile.weakestSubject   = subjects[0].subject;
      profile.strongestSubject = subjects[subjects.length - 1].subject;
    }

    // Overall trend: compare last 3 vs prev 3 test accuracies from DailySystem
    const recent = DailySystem.getRecentProgress(6);
    if (recent.length >= 4) {
      const last3  = recent.slice(-3).map(e => e.accuracy);
      const prev3  = recent.slice(-6, -3).map(e => e.accuracy);
      const avgL   = last3.reduce((s, v) => s + v, 0) / last3.length;
      const avgP   = prev3.length ? prev3.reduce((s, v) => s + v, 0) / prev3.length : avgL;
      profile.overallTrend = avgL > avgP + 3 ? 'up' : avgL < avgP - 3 ? 'down' : 'stable';
    }

    // Revision queue — subjects whose nextRevision <= today
    profile.revisionQueue = Object.values(profile.subjectProfiles)
      .filter(sp => sp.revisionSchedule.nextRevision && sp.revisionSchedule.nextRevision <= today)
      .map(sp => sp.subject);

    profile.updatedAt = new Date().toISOString();
    Storage.saveLearningProfile(profile);
    return profile;
  },

  // ════ WEAKNESS SCORE (Doc 8 §7) ════
  // Formula: wrong% × difficultyFactor × recencyFactor × (1 + confidentWrong)
  _calcWeaknessScore(sp) {
    const wrongPct = sp.attempts > 0 ? sp.wrong / sp.attempts : 0;
    const difficultyFactor = 1.2;  // All exams similar difficulty for now
    const recencyFactor = sp.accuracyHistory.length > 0
      ? Math.max(0.5, 1 - (sp.accuracyHistory[sp.accuracyHistory.length - 1] / 100))
      : 0.5;
    const confidentWrongBonus = sp.confidenceWrong * 0.5;
    return Math.round(wrongPct * difficultyFactor * recencyFactor * (1 + confidentWrongBonus) * 100);
  },

  // ════ CONFIDENCE TRACKING (Doc 8 §9) ════
  recordConfidence(qId, confidence, wasCorrect, subject) {
    // confidence: 'guess' | 'unsure' | 'confident'
    Storage.addConfidenceEntry({ qId, confidence, wasCorrect, subject, ts: Date.now() });

    // Update subject profile confidence fractions
    const profile = this.get();
    if (subject && profile.subjectProfiles[subject]) {
      const sp = profile.subjectProfiles[subject];
      const log = Storage.getConfidenceLog()
        .filter(e => e.subject === subject);
      const total = log.length;
      if (total > 0) {
        sp.confidenceCorrect = log.filter(e => e.wasCorrect && e.confidence === 'confident').length / total;
        sp.confidenceWrong   = log.filter(e => !e.wasCorrect && e.confidence === 'confident').length / total;
      }
      sp.weaknessScore = this._calcWeaknessScore(sp);
      Storage.saveLearningProfile(profile);
    }
  },

  // ════ MISTAKE CLASSIFICATION (Doc 8 §8) ════
  recordMistakeType(qId, type, subject) {
    // type: 'concept' | 'calculation' | 'reading' | 'guess' | 'timePressure' | 'careless'
    const profile = this.get();
    if (subject && profile.subjectProfiles[subject]) {
      const mt = profile.subjectProfiles[subject].mistakeTypes;
      if (mt.hasOwnProperty(type)) {
        mt[type] = (mt[type] || 0) + 1;
        Storage.saveLearningProfile(profile);
      }
    }
  },

  // ════ REVISION QUEUE (Doc 8 §11) ════
  getRevisionQueue() {
    const profile = this.get();
    const today = this._today();
    return Object.values(profile.subjectProfiles)
      .filter(sp => sp.revisionSchedule.nextRevision && sp.revisionSchedule.nextRevision <= today)
      .sort((a, b) => b.weaknessScore - a.weaknessScore)
      .map(sp => ({
        subject: sp.subject,
        accuracy: sp.accuracy,
        weaknessScore: sp.weaknessScore,
        nextRevision: sp.revisionSchedule.nextRevision
      }));
  },

  // Mark revision done — advance interval
  markRevisionDone(subject) {
    const profile = this.get();
    if (!profile.subjectProfiles[subject]) return;
    const rs = profile.subjectProfiles[subject].revisionSchedule;
    const today = this._today();
    rs.lastRevised = today;
    // Spaced repetition: 1 → 3 → 7 → 14 → 30
    const intervals = [1, 3, 7, 14, 30];
    const nextIdx = Math.min(intervals.indexOf(rs.intervalDays) + 1, intervals.length - 1);
    rs.intervalDays = intervals[nextIdx];
    rs.nextRevision = this._addDays(today, rs.intervalDays);
    Storage.saveLearningProfile(profile);
  },

  // ════ WEAKNESS RANK (for adaptive mock) ════
  getWeaknessRanking() {
    const profile = this.get();
    return Object.values(profile.subjectProfiles)
      .filter(sp => sp.attempts >= 3)
      .sort((a, b) => b.weaknessScore - a.weaknessScore)
      .map(sp => ({ subject: sp.subject, score: sp.weaknessScore, accuracy: sp.accuracy }));
  },

  // ════ MISCONCEPTION DETECT (Doc 8 §9) ════
  getMisconceptions() {
    // Confident + Wrong → subject has a misconception
    const profile = this.get();
    return Object.values(profile.subjectProfiles)
      .filter(sp => sp.confidenceWrong > 0.15 && sp.attempts >= 5)
      .sort((a, b) => b.confidenceWrong - a.confidenceWrong)
      .map(sp => ({ subject: sp.subject, severity: sp.confidenceWrong }));
  },

  // ════ HELPERS ════
  _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  _addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
};

window.LearningProfile = LearningProfile;
