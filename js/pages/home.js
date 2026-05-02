// ============================================
// HOME PAGE V3 — Product-First
// Daily Challenge, Streak, Exam Presets,
// Clean/Minimal, Performance-Optimized
// ============================================

const HomePage = {
  _expandedCategory: null,

  render() {
    const streak = DailySystem.getStreak();
    const dailyDone = DailySystem.isDailyDone();
    const goal = DailySystem.getDailyGoal();
    const streakAlive = DailySystem.isStreakAlive();

    // A/B test
    let variant = localStorage.getItem("variant");
    if (!variant) {
      variant = Math.random() < 0.5 ? "A" : "B";
      localStorage.setItem("variant", variant);
    }

    const headline = variant === "A"
      ? Lang.t('hero_title_a')
      : Lang.t('hero_title_b');

    // Exam categories from presets
    const categories = [
      { id: 'SSC', icon: '📋', color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.25)' },
      { id: 'Railway', icon: '🚂', color: '#10B981', glow: 'rgba(16, 185, 129, 0.25)' },
      { id: 'Banking', icon: '🏦', color: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.25)' },
      { id: 'State', icon: '🏛️', color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.25)' },
      { id: 'Defence', icon: '⚔️', color: '#EF4444', glow: 'rgba(239, 68, 68, 0.25)' },
      { id: 'Teaching', icon: '📚', color: '#06B6D4', glow: 'rgba(6, 182, 212, 0.25)' },
      { id: 'UPSC', icon: '⚖️', color: '#D946EF', glow: 'rgba(217, 70, 239, 0.25)' }
    ];

    return `
      <div class="page-enter">

        <!-- 1. HERO — Minimal -->
        <section class="home-hero container text-center">
          <h1 class="hero-title animate-fadeInUp">
            ${headline}
          </h1>
          <p class="hero-subtitle animate-fadeInUp stagger-1">
            ${Lang.t('hero_subtitle')}
          </p>

          <div class="hero-cta animate-fadeInUp stagger-2">
            <div class="hero-cta-btns">
              <button class="btn btn-primary btn-lg" onclick="App.navigate('setup');" id="hero-start-btn">
                🚀 ${Lang.t('cta_full_test')}
              </button>
            </div>

            ${Storage.getCurrentTest() ? `
              <button class="resume-test-btn" onclick="App.navigate('test')">
                <span class="resume-pulse"></span>
                ${Lang.t('resume_test')}
              </button>
            ` : ''}
          </div>
        </section>

        <!-- 2. DAILY CHALLENGE + STREAK BAR -->
        <section class="container">
          <div class="daily-streak-bar animate-fadeInUp stagger-2">

            <!-- Streak -->
            <div class="streak-section">
              <div class="streak-fire ${streakAlive ? 'alive' : 'dead'}">
                ${streakAlive ? '🔥' : '❄️'}
              </div>
              <div class="streak-info">
                <div class="streak-count">${streak.current} day${streak.current !== 1 ? 's' : ''}</div>
                <div class="streak-label">${streakAlive ? 'streak alive!' : 'streak broken'}</div>
              </div>
              ${streak.best > 1 ? `<div class="streak-best">Best: ${streak.best}🏆</div>` : ''}
            </div>

            <!-- Daily Challenge -->
            <div class="daily-challenge-section" onclick="${dailyDone ? '' : 'HomePage.startDailyChallenge()'}">
              ${dailyDone ? `
                <div class="daily-done">
                  <span class="daily-done-icon">✅</span>
                  <span>Daily Done!</span>
                </div>
              ` : `
                <div class="daily-cta">
                  <span class="daily-fire-icon">🔥</span>
                  <div>
                    <div class="daily-cta-title">Daily Challenge</div>
                    <div class="daily-cta-sub">15 Q · 10 min · Beat your streak</div>
                  </div>
                  <div class="daily-go-btn">GO →</div>
                </div>
              `}
            </div>

            <!-- Today's Goal -->
            <div class="today-goal-section">
              <div class="goal-progress-ring">
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>
                  <circle cx="20" cy="20" r="16" fill="none" stroke="${goal.testsToday >= goal.target ? '#10B981' : '#3B82F6'}"
                          stroke-width="3" stroke-linecap="round"
                          stroke-dasharray="${2 * Math.PI * 16}"
                          stroke-dashoffset="${2 * Math.PI * 16 * (1 - Math.min(goal.testsToday / goal.target, 1))}"
                          transform="rotate(-90 20 20)"
                          style="transition: stroke-dashoffset 0.6s ease;"/>
                </svg>
                <span class="goal-count">${goal.testsToday}</span>
              </div>
              <div class="goal-info">
                <div class="goal-text">${goal.testsToday}/${goal.target} tests today</div>
                <div class="goal-sub">${goal.questionsToday} questions solved</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. EXAM CATEGORIES -->
        <section class="exam-section container" id="exam-section">
          <h2 class="section-title-compact animate-fadeInUp">🎯 ${Lang.t('choose_exam') || 'Choose Your Exam'}</h2>

          <div class="exam-categories-grid" id="exam-categories">
            ${categories.map((cat, i) => {
              const presets = ExamPresets.getByCategory(cat.id);
              return this._renderCategoryCard(cat, presets, i);
            }).join('')}
          </div>

          <div id="sub-exam-area" class="sub-exam-area"></div>
        </section>

        <!-- 4. QUICK MODES -->
        <section class="container quick-modes-section animate-fadeInUp">
          <h2 class="section-title-compact">⚡ Quick Practice</h2>
          <div class="quick-modes-grid">
            <div class="quick-mode-card" onclick="HomePage.startQuickMode('quick-10')">
              <span class="qm-icon">⚡</span>
              <div class="qm-info">
                <div class="qm-title">Quick 10</div>
                <div class="qm-sub">10 Q · 5 min · Mixed</div>
              </div>
            </div>
            <div class="quick-mode-card" onclick="App.navigate('setup')">
              <span class="qm-icon">🎲</span>
              <div class="qm-info">
                <div class="qm-title">Custom Test</div>
                <div class="qm-sub">Your rules · Your pace</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 5. MINIMAL HOW IT WORKS -->
        <section class="container how-section-compact">
          <div class="how-steps">
            <div class="how-step">
              <span class="how-num">1</span>
              <span>Pick exam</span>
            </div>
            <span class="how-arrow">→</span>
            <div class="how-step">
              <span class="how-num">2</span>
              <span>Take test</span>
            </div>
            <span class="how-arrow">→</span>
            <div class="how-step">
              <span class="how-num">3</span>
              <span>Get insights</span>
            </div>
          </div>
        </section>
      </div>
    `;
  },

  _renderCategoryCard(cat, presets, index) {
    return `
      <div class="exam-category-card animate-fadeInUp stagger-${index + 1}"
           style="--cat-color: ${cat.color}; --cat-glow: ${cat.glow};"
           onclick="HomePage.expandCategory('${cat.id}')"
           id="cat-${cat.id}">
        <div class="cat-icon-wrap">
          <span class="cat-icon">${cat.icon}</span>
        </div>
        <div class="cat-info">
          <h3 class="cat-name">${cat.id}</h3>
          <span class="cat-count">${presets.length} exams</span>
        </div>
        <div class="cat-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </div>
      </div>
    `;
  },

  expandCategory(catId) {
    const presets = ExamPresets.getByCategory(catId);
    if (!presets || presets.length === 0) return;

    // Toggle collapse
    if (this._expandedCategory === catId) {
      this._expandedCategory = null;
      const area = document.getElementById('sub-exam-area');
      if (area) {
        area.classList.remove('open');
        setTimeout(() => { area.innerHTML = ''; }, 300);
      }
      document.querySelectorAll('.exam-category-card').forEach(c => c.classList.remove('expanded'));
      return;
    }

    this._expandedCategory = catId;

    // Active state
    document.querySelectorAll('.exam-category-card').forEach(c => c.classList.remove('expanded'));
    const card = document.getElementById('cat-' + catId);
    if (card) card.classList.add('expanded');

    const area = document.getElementById('sub-exam-area');
    if (!area) return;

    // Find category meta
    const catMeta = { SSC: { icon: '📋', color: '#3B82F6' }, Railway: { icon: '🚂', color: '#10B981' }, Banking: { icon: '🏦', color: '#8B5CF6' }, State: { icon: '🏛️', color: '#F59E0B' } };
    const meta = catMeta[catId] || { icon: '📋', color: '#3B82F6' };

    area.innerHTML = `
      <div class="sub-exam-panel" style="--cat-color: ${meta.color};">
        <div class="sub-exam-header">
          <h3>${meta.icon} ${catId} Exams</h3>
          <button class="close-sub-btn" onclick="HomePage.expandCategory('${catId}')">✕</button>
        </div>
        <div class="preset-exam-list">
          ${presets.map((preset, i) => `
            <div class="preset-exam-card" style="animation-delay: ${i * 50}ms;">
              <div class="preset-left">
                <span class="preset-icon">${preset.icon}</span>
                <div class="preset-info">
                  <h4>${preset.name}</h4>
                  <span class="preset-full">${preset.fullName}</span>
                </div>
              </div>
              <div class="preset-meta">
                <span class="preset-tag">${preset.totalQuestions}Q</span>
                <span class="preset-tag">${ExamPresets.formatTime(preset.totalTime)}</span>
                <span class="preset-tag ${preset.negativeMarking ? 'neg' : 'no-neg'}">${ExamPresets.formatNeg(preset)}</span>
              </div>
              <div class="preset-sections">
                ${preset.sections.map(s => `<span class="section-pill">${Helpers.getSubjectIcon(s.subject)} ${s.name} (${s.questions})</span>`).join('')}
              </div>
              <button class="btn btn-primary btn-sm preset-start-btn" onclick="event.stopPropagation(); HomePage.startPresetExam('${preset.id}')">
                Start Test →
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    requestAnimationFrame(() => area.classList.add('open'));

    setTimeout(() => {
      area.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  },

  /** Start a test with exam preset config */
  async startPresetExam(presetId) {
    const config = ExamPresets.buildConfig(presetId);
    if (!config) {
      Helpers.showToast('Exam preset not found', 'error');
      return;
    }

    // Navigate to setup page with preset pre-filled
    App.navigate('setup', {
      preset: presetId,
      exam: config.examName,
      subjects: config.subjects.join(','),
      questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0
    });
  },

  /** Start daily challenge */
  async startDailyChallenge() {
    if (DailySystem.isDailyDone()) {
      Helpers.showToast('Daily challenge already completed today! 🎉', 'info');
      return;
    }

    const config = DailySystem.getDailyConfig();
    if (!config) {
      Helpers.showToast('Could not load daily challenge config', 'error');
      return;
    }

    // Navigate to setup with daily preset
    App.navigate('setup', {
      preset: 'daily-challenge',
      exam: 'Daily Challenge',
      subjects: config.subjects.join(','),
      questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0,
      daily: '1'
    });
  },

  /** Start quick mode */
  async startQuickMode(modeId) {
    const config = ExamPresets.buildConfig(modeId);
    if (!config) {
      Helpers.showToast('Mode not found', 'error');
      return;
    }

    App.navigate('setup', {
      preset: modeId,
      exam: config.examName,
      subjects: config.subjects.join(','),
      questions: config.numQuestions,
      time: Math.round(config.totalTime / 60),
      neg: config.negativeMarking ? config.negativeValue : 0
    });
  },

  afterRender() {
    const variant = localStorage.getItem("variant") || "A";
    if (window.trackEvent) window.trackEvent("page_view", { variant });

    // Bounce tracking
    if (!HomePage._bounceAttached) {
      let engaged = false;
      ["click", "scroll", "keydown"].forEach(evt => {
        window.addEventListener(evt, () => { engaged = true; });
      });
      setTimeout(() => {
        if (!engaged && window.trackEvent) window.trackEvent("bounce");
      }, 5000);
      HomePage._bounceAttached = true;
    }
  }
};
