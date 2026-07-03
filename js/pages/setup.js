// ============================================
// TEST SETUP PAGE v2.0 — Scholar Design
// Centered card layout (max-width: 480px), full settings control, clean warnings
// ============================================

const SetupPage = {
  config: {
    subjects: [],
    numQuestions: 25,
    timeMode: 'auto',
    timePerQuestion: 60,
    totalTime: null,
    negativeMarking: false,
    negativeValue: 0.25,
    marksPerQuestion: 1,
    examId: null,
    examName: null,
    isDaily: false,
    language: 'both' // 'english', 'hindi', 'both'
  },

  render(params = {}) {
    // Reset config to defaults
    this.config = {
      subjects: [],
      numQuestions: 25,
      timeMode: 'auto',
      timePerQuestion: 60,
      totalTime: null,
      negativeMarking: false,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      examId: null,
      examName: null,
      isDaily: false,
      language: 'both'
    };

    // If preset is selected
    const allPresets = ExamPresets.getAll ? ExamPresets.getAll() : [];
    if (params.preset) {
      const preset = ExamPresets.get(params.preset);
      if (preset) {
        this.config.examId = preset.id;
        this.config.examName = preset.name;
        this.config.numQuestions = preset.totalQuestions;
        this.config.totalTime = preset.totalTime;
        this.config.timeMode = 'manual';
        this.config.negativeMarking = preset.negativeMarking;
        this.config.negativeValue = preset.negativeValue;
        this.config.marksPerQuestion = preset.marksPerQuestion || 1;
        this.config.subjects = ExamPresets.getSubjects(preset.id);
        this.config.isDaily = params.daily === '1';
      }
    }

    const currentPreset = this.config.examId ? ExamPresets.get(this.config.examId) : null;
    const isDaily = this.config.isDaily;

    // Neg markings warning string
    const negWarning = this.config.negativeMarking
      ? `Negative marking: -${this.config.negativeValue} per wrong answer`
      : 'No negative marking for this test';

    // Calculate time text
    const calculatedTimeSec = this.config.totalTime || (this.config.numQuestions * this.config.timePerQuestion);
    const calculatedTimeMin = Math.round(calculatedTimeSec / 60);

    return `
      <div class="setup-page page-enter" style="padding: 24px var(--sp-4) 80px;">
        <div class="sp-card" style="max-width: 480px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-md);">
          
          <div style="margin-bottom: 20px; text-align: center;">
            <h1 style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--text-primary); margin: 0 0 4px; font-family: var(--font-display);">
              ${isDaily ? 'Daily Challenge' : 'Test Configuration'}
            </h1>
            <p style="color: var(--text-secondary); font-size: var(--text-sm); margin: 0;">Confirm details before you begin</p>
          </div>

          <!-- Form Fields -->
          <div style="display: flex; flex-direction: column; gap: 16px;">
            
            <!-- Exam Type Select -->
            <div>
              <label style="display: block; font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 6px;">Exam Paper</label>
              <select class="form-select" onchange="SetupPage.onExamChanged(this.value)" style="width: 100%; height: 40px; background: var(--bg-input); border: 1px solid var(--border-color); border-radius: var(--radius); color: var(--text-primary); padding: 0 12px; font-size: var(--text-sm); outline: none;">
                <option value="">Custom Practice Test</option>
                ${allPresets.map(p => `
                  <option value="${p.id}" ${this.config.examId === p.id ? 'selected' : ''}>${p.name} (${p.category})</option>
                `).join('')}
              </select>
            </div>

            <!-- Number of Questions Slider/Presets -->
            <div>
              <label style="display: block; font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 8px;">Number of Questions</label>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;">
                ${[10, 25, 50, 100].map(val => `
                  <button type="button" class="btn ${this.config.numQuestions === val ? 'btn-primary' : 'btn-secondary'}" onclick="SetupPage.setQuestions(${val})" style="padding: 6px 0; font-size: var(--text-xs); font-weight: 600; border-radius: var(--radius-sm);">
                    ${val}
                  </button>
                `).join('')}
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <input type="range" min="5" max="100" step="5" value="${this.config.numQuestions}" oninput="SetupPage.onSliderInput(this.value)" style="flex: 1; margin-right: 12px;" />
                <span style="font-family: var(--font-mono); font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); min-width: 32px; text-align: right;">${this.config.numQuestions}</span>
              </div>
            </div>

            <!-- Language Toggle -->
            <div>
              <label style="display: block; font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 6px;">Test Language</label>
              <div style="display: flex; gap: 8px;">
                ${['english', 'hindi', 'both'].map(lang => `
                  <button type="button" class="btn ${this.config.language === lang ? 'btn-primary' : 'btn-secondary'}" onclick="SetupPage.setLanguage('${lang}')" style="flex: 1; padding: 8px 0; font-size: var(--text-xs); font-weight: 600; text-transform: capitalize; border-radius: var(--radius-sm);">
                    ${lang}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Time Limit Indicator -->
            <div style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 12px 14px;">
              <div>
                <div style="font-size: var(--text-xs); font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Duration</div>
                <div style="font-size: var(--text-base); font-weight: 700; color: var(--text-primary); margin-top: 2px;">${calculatedTimeMin} Minutes</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: var(--text-xs); font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Total Marks</div>
                <div style="font-size: var(--text-base); font-weight: 700; color: var(--text-primary); margin-top: 2px;">${this.config.numQuestions * this.config.marksPerQuestion} Marks</div>
              </div>
            </div>

            <!-- Warning Strip -->
            <div style="background: var(--warning-light); border: 1px solid var(--warning); border-radius: var(--radius); padding: 10px 14px; font-size: var(--text-xs); color: var(--warning); font-weight: 500; display: flex; align-items: center; gap: 8px;">
              <span>⚠️</span>
              <span>${negWarning}</span>
            </div>

            <!-- Start Button CTA -->
            <button class="btn btn-primary" onclick="SetupPage.startTest()" id="start-test-btn" style="width: 100%; padding: 12px 0; font-size: var(--text-base); font-weight: 600; font-family: var(--font-display); border-radius: var(--radius-md); margin-top: 8px;">
              Start Test →
            </button>

            <button class="btn btn-secondary" onclick="App.navigate('home')" style="width: 100%; padding: 10px 0; font-size: var(--text-sm); font-weight: 500; border-radius: var(--radius-md);">
              ← Cancel
            </button>
          </div>

        </div>
      </div>
    `;
  },

  onExamChanged(examId) {
    if (examId) {
      const preset = ExamPresets.get(examId);
      if (preset) {
        this.config.examId = preset.id;
        this.config.examName = preset.name;
        this.config.numQuestions = preset.totalQuestions;
        this.config.totalTime = preset.totalTime;
        this.config.timeMode = 'manual';
        this.config.negativeMarking = preset.negativeMarking;
        this.config.negativeValue = preset.negativeValue;
        this.config.marksPerQuestion = preset.marksPerQuestion || 1;
        this.config.subjects = ExamPresets.getSubjects(preset.id);
      }
    } else {
      this.config.examId = null;
      this.config.examName = 'Custom Practice Test';
      this.config.numQuestions = 25;
      this.config.totalTime = null;
      this.config.timeMode = 'auto';
      this.config.negativeMarking = false;
      this.config.subjects = ['math', 'gk', 'reasoning', 'english'];
    }
    // Re-render
    const params = this.config.examId ? { preset: this.config.examId } : {};
    App.renderPage('setup', params);
  },

  setQuestions(val) {
    this.config.numQuestions = val;
    if (this.config.examId) {
      // If choosing non-default question count for preset, disable preset standard timer
      this.config.totalTime = null;
      this.config.timeMode = 'auto';
    }
    App.renderPage('setup', this.config.examId ? { preset: this.config.examId } : {});
  },

  onSliderInput(val) {
    this.config.numQuestions = parseInt(val, 10);
    this.config.totalTime = null;
    this.config.timeMode = 'auto';
    // Update value span directly to avoid full redraw during drag
    const labels = document.querySelectorAll('span');
    labels.forEach(el => {
      if (el.textContent === String(this.config.numQuestions - 5) || el.textContent === String(this.config.numQuestions + 5)) {
        el.textContent = val;
      }
    });
  },

  setLanguage(lang) {
    this.config.language = lang;
    App.renderPage('setup', this.config.examId ? { preset: this.config.examId } : {});
  },

  async startTest() {
    const startBtn = document.getElementById('start-test-btn');
    if (!startBtn) return;

    const originalText = startBtn.innerHTML;
    startBtn.disabled = true;
    startBtn.innerHTML = `Loading...`;

    try {
      const timePerQuestion = this.config.timeMode === 'auto' ? 60 : 0;
      const totalTime = this.config.timeMode === 'none'
        ? 99999
        : this.config.timeMode === 'manual'
          ? (this.config.totalTime || 600)
          : (this.config.numQuestions * this.config.timePerQuestion);

      const preset = this.config.examId ? ExamPresets.get(this.config.examId) : null;
      let fetchedQuestions;

      if (preset && preset.sections && preset.sections.length > 0 && window.fetchSectionWiseQuestions) {
        fetchedQuestions = await window.fetchSectionWiseQuestions({
          sections: preset.sections,
          totalQuestions: this.config.numQuestions,
          subjects: this.config.subjects
        });
      } else {
        fetchedQuestions = await window.fetchRandomQuestions({
          limit: this.config.numQuestions,
          subjects: this.config.subjects
        });
      }

      if (!fetchedQuestions || fetchedQuestions.length === 0) {
        throw new Error('No questions found. Check database or connection.');
      }

      // Inject language selection override into the test engine questions structure
      const langOverride = this.config.language;
      const questionsWithLang = fetchedQuestions.map(q => ({
        ...q,
        languageMode: langOverride
      }));

      const result = TestEngine.createTest({
        ...this.config,
        questions: questionsWithLang,
        timePerQuestion,
        totalTime
      });

      if (result.error) {
        throw new Error(result.error);
      }

      Helpers.showToast('Test started! Solve now.', 'success');
      App.navigate('test');

    } catch (err) {
      Helpers.showToast(err.message, 'error');
      startBtn.disabled = false;
      startBtn.innerHTML = originalText;
    }
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent("page_view", { page: "setup_scholar" });
  }
};

window.SetupPage = SetupPage;
