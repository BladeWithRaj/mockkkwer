// ============================================
// MOCK TEST PLATFORM — Test Engine
// Handles question selection, timer, scoring
// ============================================

const TestEngine = {
  // Current test state
  state: null,

  /**
   * Initialize a new test
   */
  createTest(config) {
    const {
      questions = [],
      timePerQuestion = 60, // seconds
      totalTime = null, // if set, overrides timePerQuestion
      negativeMarking = false,
      negativeValue = 0.25,
      marksPerQuestion = 1,
      isDaily = false,
      dailyQuestions = null
    } = config;

    let selected = [];

    if (isDaily && dailyQuestions && Array.isArray(dailyQuestions)) {
      // ── Daily Challenge Mode ──
      selected = dailyQuestions;
      if (selected.length === 0) return { error: 'Failed to load daily questions.' };
    } else {
      // ── Normal Mode ──
      selected = questions;
      
      if (!selected || selected.length === 0) {
        return { error: 'No questions found for the selected filters.' };
      }
    }

    // Calculate total time
    const calculatedTime = totalTime || (timePerQuestion * selected.length);

    // Create test state
    this.state = {
      id: Helpers.generateId(),
      config: { ...config, actualQuestions: selected.length },
      questions: selected,
      answers: {},
      markedForReview: new Array(selected.length).fill(false),
      timePerQuestion: new Array(selected.length).fill(0),
      currentQuestion: 0,
      totalTime: calculatedTime,
      timeRemaining: calculatedTime,
      negativeMarking,
      negativeValue,
      marksPerQuestion,
      startTime: Date.now(),
      questionStartTime: Date.now(),
      isActive: true,
      isSubmitted: false
    };

    // Save state for resume
    Storage.saveCurrentTest(this.state);

    if (window.trackEvent) {
      window.trackEvent("test_start", {
        mode: isDaily ? "daily" : "full"
      });
    }

    return { success: true, questionCount: selected.length, totalTime: calculatedTime };
  },

  /**
   * Get current question
   */
  getCurrentQuestion() {
    if (!this.state) return null;
    const idx = this.state.currentQuestion;
    const q = this.state.questions[idx];
    return {
      index: idx,
      total: this.state.questions.length,
      question: q,
      selectedAnswer: this.state.answers[q.id] !== undefined ? this.state.answers[q.id] : null,
      isMarkedForReview: this.state.markedForReview[idx]
    };
  },

  /**
   * Select answer for current question
   */
  selectAnswer(optionIndex) {
    if (!this.state || this.state.isSubmitted) return;
    const qId = this.state.questions[this.state.currentQuestion].id;
    this.state.answers[qId] = optionIndex;
    Storage.saveCurrentTest(this.state);
  },

  /**
   * Clear answer for current question
   */
  clearAnswer() {
    if (!this.state || this.state.isSubmitted) return;
    const qId = this.state.questions[this.state.currentQuestion].id;
    delete this.state.answers[qId];
    Storage.saveCurrentTest(this.state);
  },

  /**
   * Toggle mark for review
   */
  toggleReview() {
    if (!this.state || this.state.isSubmitted) return;
    const idx = this.state.currentQuestion;
    this.state.markedForReview[idx] = !this.state.markedForReview[idx];
    Storage.saveCurrentTest(this.state);
    return this.state.markedForReview[idx];
  },

  /**
   * Navigate to question
   */
  goToQuestion(index) {
    if (!this.state || this.state.isSubmitted) return;
    if (index < 0 || index >= this.state.questions.length) return;

    // Track time spent on current question
    const now = Date.now();
    const timeSpent = Math.round((now - this.state.questionStartTime) / 1000);
    this.state.timePerQuestion[this.state.currentQuestion] += timeSpent;

    // Navigate
    this.state.currentQuestion = index;
    this.state.questionStartTime = now;
    Storage.saveCurrentTest(this.state);
  },

  /**
   * Next question
   */
  nextQuestion() {
    if (!this.state) return;
    if (this.state.currentQuestion < this.state.questions.length - 1) {
      this.goToQuestion(this.state.currentQuestion + 1);
    }
  },

  /**
   * Previous question
   */
  prevQuestion() {
    if (!this.state) return;
    if (this.state.currentQuestion > 0) {
      this.goToQuestion(this.state.currentQuestion - 1);
    }
  },

  /**
   * Update timer (call every second)
   */
  tick() {
    if (!this.state || !this.state.isActive || this.state.isSubmitted) return null;

    this.state.timeRemaining--;

    if (this.state.timeRemaining <= 0) {
      this.state.timeRemaining = 0;
      return 'timeout';
    }

    return this.state.timeRemaining;
  },

  /**
   * Submit the test
   */
  submit() {
    console.log("🔥 SUBMIT TRIGGERED");
    if (!this.state || this.state.isSubmitted) return null;

    // Track final question time
    const now = Date.now();
    const timeSpent = Math.round((now - this.state.questionStartTime) / 1000);
    this.state.timePerQuestion[this.state.currentQuestion] += timeSpent;

    this.state.isActive = false;
    this.state.isSubmitted = true;
    this.state.endTime = Date.now();

    // Calculate results
    const result = this.calculateResult();


    // ── SUPABASE SAVE SYSTEM ──

    if (window.saveResultToDB) {
      window.saveResultToDB(result);
    }

    // Save to local history as well for immediate UI access
    Storage.saveTestResult(result);
    Storage.clearCurrentTest();

    return result;
  },

  /**
   * Calculate result
   */
  calculateResult() {
    if (!this.state) return null;

    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let totalMarks = 0;
    const maxMarks = this.state.questions.length * this.state.marksPerQuestion;
    const subjectWise = {};
    const topicWise = {};
    const questionResults = [];

    this.state.questions.forEach((q, idx) => {
      const answer = this.state.answers[q.id];
      const isCorrect = answer !== undefined && answer !== null && answer === q.correct;
      const isSkipped = answer === undefined || answer === null;
      const timeSpent = this.state.timePerQuestion[idx];

      // Track subject-wise
      if (!subjectWise[q.subject]) {
        subjectWise[q.subject] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
      }
      subjectWise[q.subject].total++;

      // Track topic-wise
      const topicKey = `${q.subject} - ${q.topic}`;
      if (!topicWise[topicKey]) {
        topicWise[topicKey] = { total: 0, correct: 0, wrong: 0, subject: q.subject, topic: q.topic };
      }
      topicWise[topicKey].total++;

      if (isSkipped) {
        skipped++;
        subjectWise[q.subject].skipped++;
        topicWise[topicKey].wrong++; // count as wrong for weak detection
      } else if (isCorrect) {
        correct++;
        totalMarks += this.state.marksPerQuestion;
        subjectWise[q.subject].correct++;
        topicWise[topicKey].correct++;
      } else {
        wrong++;
        if (this.state.negativeMarking) {
          totalMarks -= this.state.negativeValue;
        }
        subjectWise[q.subject].wrong++;
        topicWise[topicKey].wrong++;
      }

      questionResults.push({
        question: q,
        selectedAnswer: answer,
        isCorrect,
        isSkipped,
        timeSpent
      });
    });

    const totalTime = this.state.totalTime - this.state.timeRemaining;
    const accuracy = this.state.questions.length > 0
      ? Math.round((correct / this.state.questions.length) * 100)
      : 0;

    // Find weak topics (accuracy < 50%)
    const weakTopics = Object.entries(topicWise)
      .filter(([_, data]) => {
        const acc = data.total > 0 ? (data.correct / data.total) * 100 : 0;
        return acc < 50 && data.total >= 1;
      })
      .map(([key, data]) => ({
        name: key,
        subject: data.subject,
        topic: data.topic,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        total: data.total,
        correct: data.correct
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    return {
      totalQuestions: this.state.questions.length,
      correct,
      wrong,
      skipped,
      totalMarks: Math.max(0, parseFloat(totalMarks.toFixed(2))),
      maxMarks,
      accuracy,
      timeTaken: totalTime,
      avgTimePerQuestion: this.state.questions.length > 0
        ? Math.round(totalTime / this.state.questions.length)
        : 0,
      subjectWise,
      topicWise,
      weakTopics,
      questionResults,
      config: this.state.config,
      negativeMarking: this.state.negativeMarking,
      negativeValue: this.state.negativeValue
    };
  },

  /**
   * Get navigation status for all questions
   */
  getNavStatus() {
    if (!this.state) return [];
    return this.state.questions.map((q, idx) => ({
      index: idx,
      answered: this.state.answers[q.id] !== undefined && this.state.answers[q.id] !== null,
      review: this.state.markedForReview[idx],
      current: idx === this.state.currentQuestion
    }));
  },

  /**
   * Get test summary (for submit confirmation)
   */
  getSummary() {
    if (!this.state) return null;
    const answered = Object.keys(this.state.answers).length;
    const reviewed = this.state.markedForReview.filter(r => r).length;
    const unanswered = this.state.questions.length - answered;
    return { answered, unanswered, reviewed, total: this.state.questions.length };
  },

  /**
   * Reset test state
   */
  reset() {
    this.state = null;
    Storage.clearCurrentTest();
  }
};
