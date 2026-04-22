// ============================================
// MOCK TEST PLATFORM — Home Page
// ============================================

const HomePage = {
  render() {
    const stats = Storage.getStats();
    const questions = window.QUESTION_BANK || [];

    // Count by exam
    const examCounts = {};
    questions.forEach(q => {
      (q.exam || []).forEach(e => {
        examCounts[e] = (examCounts[e] || 0) + 1;
      });
    });

    // Count by subject
    const subjectCounts = {};
    questions.forEach(q => {
      subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
    });

    return `
      <div class="page-enter">
        <!-- Hero Section -->
        <section class="home-hero container">
          <div class="hero-badge animate-fadeInDown">
            <span class="dot"></span>
            <span>Free Mock Test Platform</span>
          </div>

          <h1 class="hero-title animate-fadeInUp stagger-1">
            Practice Smart,<br>
            <span class="gradient-text">Score Higher</span>
          </h1>

          <p class="hero-subtitle animate-fadeInUp stagger-2">
            SSC, Railway, Police और Competitive Exams की तैयारी करें।
            ${stats.totalQuestions}+ questions के साथ अभ्यास करें।
          </p>

          <div class="hero-cta animate-fadeInUp stagger-3">
            <button class="btn btn-primary btn-lg" onclick="App.navigate('setup')" id="start-test-btn">
              🚀 Start Test
            </button>
            <button class="btn btn-secondary btn-lg" onclick="App.navigate('setup', {mode: 'daily'})" id="daily-quiz-btn">
              ⚡ Daily Quiz
            </button>
          </div>
        </section>

        <!-- Stats Row -->
        <section class="container">
          <div class="stats-row">
            <div class="card animate-fadeInUp stagger-2">
              <div class="stat">
                <div class="stat-value" data-counter="${stats.totalQuestions}">${stats.totalQuestions}</div>
                <div class="stat-label">Total Questions</div>
              </div>
            </div>
            <div class="card animate-fadeInUp stagger-3">
              <div class="stat">
                <div class="stat-value" data-counter="${Object.keys(subjectCounts).length}">${Object.keys(subjectCounts).length}</div>
                <div class="stat-label">Subjects</div>
              </div>
            </div>
            <div class="card animate-fadeInUp stagger-4">
              <div class="stat">
                <div class="stat-value" data-counter="${stats.testsTaken}">${stats.testsTaken}</div>
                <div class="stat-label">Tests Taken</div>
              </div>
            </div>
            <div class="card animate-fadeInUp stagger-5">
              <div class="stat">
                <div class="stat-value">${stats.avgAccuracy}%</div>
                <div class="stat-label">Avg Accuracy</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Exam Cards -->
        <section class="exam-section container">
          <h2 class="section-title animate-fadeInUp">Choose Your Exam</h2>
          <p class="section-subtitle animate-fadeInUp stagger-1">Select an exam to start a focused mock test</p>

          <div class="exam-grid">
            ${this._renderExamCard('SSC', '📋', examCounts['SSC'] || 0, 'Staff Selection Commission', 1)}
            ${this._renderExamCard('Railway', '🚂', examCounts['Railway'] || 0, 'RRB NTPC / Group D', 2)}
            ${this._renderExamCard('Police', '🛡️', examCounts['Police'] || 0, 'State Police Constable', 3)}
            ${this._renderExamCard('All', '🎯', stats.totalQuestions, 'All Questions Mixed', 4)}
          </div>
        </section>

        <!-- Subject Cards -->
        <section class="exam-section container">
          <h2 class="section-title animate-fadeInUp">Practice by Subject</h2>
          <p class="section-subtitle animate-fadeInUp stagger-1">Focus on specific subjects to improve</p>

          <div class="exam-grid">
            ${Object.entries(subjectCounts).map(([subject, count], i) =>
              this._renderSubjectCard(subject, count, i)
            ).join('')}
          </div>
        </section>

        <!-- Features -->
        <section class="container" style="padding-bottom: var(--space-16);">
          <h2 class="section-title text-center animate-fadeInUp">Why Choose Us</h2>
          <p class="section-subtitle text-center animate-fadeInUp stagger-1">Everything you need to crack your exam</p>

          <div class="features-grid">
            <div class="feature-card animate-fadeInUp stagger-2">
              <div class="feature-icon blue">⏱️</div>
              <h4 class="feature-title">Timed Tests</h4>
              <p class="feature-desc">Real exam experience with auto-submit timer and time tracking per question.</p>
            </div>
            <div class="feature-card animate-fadeInUp stagger-3">
              <div class="feature-icon purple">📊</div>
              <h4 class="feature-title">Deep Analysis</h4>
              <p class="feature-desc">Subject-wise breakdown, weak topic detection, and detailed explanations.</p>
            </div>
            <div class="feature-card animate-fadeInUp stagger-4">
              <div class="feature-icon green">🎯</div>
              <h4 class="feature-title">Negative Marking</h4>
              <p class="feature-desc">Configurable negative marking to simulate real exam scoring patterns.</p>
            </div>
            <div class="feature-card animate-fadeInUp stagger-5">
              <div class="feature-icon orange">📝</div>
              <h4 class="feature-title">PYQ Practice</h4>
              <p class="feature-desc">Practice with previous year questions from SSC, Railway, and Police exams.</p>
            </div>
          </div>
        </section>
      </div>
    `;
  },

  _renderExamCard(exam, icon, count, subtitle, stagger) {
    return `
      <div class="exam-card animate-fadeInUp stagger-${stagger}"
           onclick="App.navigate('setup', {exam: '${exam}'})"
           id="exam-card-${exam.toLowerCase()}">
        <div class="exam-card-icon">${icon}</div>
        <div class="exam-card-title">${exam}</div>
        <div class="exam-card-count">${count} Questions</div>
        <small style="color: var(--text-muted); font-size: 11px;">${subtitle}</small>
      </div>
    `;
  },

  _renderSubjectCard(subject, count, index) {
    return `
      <div class="exam-card animate-fadeInUp stagger-${index + 1}"
           onclick="App.navigate('setup', {subject: '${subject}'})"
           id="subject-card-${subject.toLowerCase()}">
        <div class="exam-card-icon">${Helpers.getSubjectIcon(subject)}</div>
        <div class="exam-card-title">${subject}</div>
        <div class="exam-card-count">${count} Questions</div>
      </div>
    `;
  },

  afterRender() {
    // Animate counters
    document.querySelectorAll('[data-counter]').forEach(el => {
      const target = parseInt(el.dataset.counter);
      if (target > 0) {
        Helpers.animateCounter(el, target, 1200);
      }
    });
  }
};
