// ============================================
// ADMIN PANEL — App Controller
// ============================================

const AdminApp = {
  currentSection: 'dashboard',
  editingQuestion: null,
  sidebarOpen: false,
  searchQuery: '',
  filterSubject: 'all',
  filterDifficulty: 'all',
  filterExam: 'all',

  sections: ['dashboard', 'questions', 'add', 'bulk-upload', 'analytics'],

  async init() {
    // Role-based Auth Check
    if (window.Auth) {
      await window.Auth.init();
      const user = window.Auth.getUser();
      if (!window.Auth.isVerified() || !user) {
        window.location.href = "index.html";
        return;
      }

      const isAdmin = window.checkAdminRole ? await window.checkAdminRole(user.id) : false;
      if (!isAdmin) {
        alert("Unauthorized: Administrator access required.");
        window.location.href = "index.html";
        return;
      }
    }

    // Show loading state
    const mainEl = document.getElementById('admin-main');
    if (mainEl) {
      mainEl.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 20px;">
          <div style="width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--primary, #6366f1); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
          <p style="color: var(--text-secondary, #94a3b8); font-size: 16px;">Loading questions from database...</p>
        </div>
      `;
    }

    // Fetch questions from Supabase
    try {
      console.log("Admin: Fetching questions...");
      const data = await window.fetchAdminQuestions();
      if (data && data.length > 0) {
        window.QUESTION_BANK = window.mapDBToUI(data);
        console.log("Admin:", window.QUESTION_BANK.length, "questions loaded");
      } else {
        window.QUESTION_BANK = [];
        console.warn("Admin: No questions found");
      }
    } catch (err) {
      console.error("Admin: Failed:", err);
      window.QUESTION_BANK = [];
    }

    const hash = window.location.hash.slice(1) || 'dashboard';
    this.navigateTo(hash);

    window.addEventListener('hashchange', () => {
      const h = window.location.hash.slice(1) || 'dashboard';
      this.navigateTo(h, false);
    });
  },

  navigateTo(section, updateHash = true) {
    this.currentSection = section;
    this.editingQuestion = null;
    if (updateHash) window.location.hash = section;

    this.render();
    this.closeSidebar();
  },

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    document.querySelector('.admin-sidebar').classList.toggle('open', this.sidebarOpen);
    document.querySelector('.admin-sidebar-overlay').classList.toggle('active', this.sidebarOpen);
  },

  closeSidebar() {
    this.sidebarOpen = false;
    const sidebar = document.querySelector('.admin-sidebar');
    const overlay = document.querySelector('.admin-sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
  },

  render() {
    const mainEl = document.getElementById('admin-main');
    if (!mainEl) return;

    let content = '';
    switch (this.currentSection) {
      case 'dashboard': content = this.renderDashboard(); break;
      case 'questions': content = this.renderQuestions(); break;
      case 'add': content = this.renderAddQuestion(); break;
      case 'bulk-upload': content = this.renderBulkUpload(); break;
      case 'analytics': content = this.renderAnalytics(); break;
      default: content = this.renderDashboard();
    }

    mainEl.innerHTML = content;

    // Update active nav
    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.section === this.currentSection);
    });

    // After render
    if (this.currentSection === 'dashboard') this.afterDashboardRender();
    if (this.currentSection === 'analytics') this.afterAnalyticsRender();
  },

  // ═══════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════
  renderDashboard() {
    const questions = window.QUESTION_BANK || [];
    const history = Storage.getHistory();
    const stats = Storage.getStats();

    const subjectCounts = {};
    const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
    const examCounts = {};

    questions.forEach(q => {
      subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
      difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
      (q.exam || []).forEach(e => {
        examCounts[e] = (examCounts[e] || 0) + 1;
      });
    });

    return `
      <div class="page-enter">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">Dashboard</h1>
            <p class="admin-page-subtitle">Overview of your question bank and test analytics</p>
          </div>
          <button class="btn btn-primary" onclick="AdminApp.navigateTo('add')">
            ➕ Add Question
          </button>
        </div>

        <!-- Stats Grid -->
        <div class="admin-stats-grid">
          <div class="admin-stat-card animate-fadeInUp">
            <div class="admin-stat-icon blue">📋</div>
            <div class="admin-stat-info">
              <div class="admin-stat-value">${questions.length}</div>
              <div class="admin-stat-label">Total Questions</div>
            </div>
          </div>
          <div class="admin-stat-card animate-fadeInUp stagger-1">
            <div class="admin-stat-icon green">🗄️</div>
            <div class="admin-stat-info">
              <div class="admin-stat-value">${questions.length}</div>
              <div class="admin-stat-label">DB Questions</div>
            </div>
          </div>
          <div class="admin-stat-card animate-fadeInUp stagger-2">
            <div class="admin-stat-icon purple">📝</div>
            <div class="admin-stat-info">
              <div class="admin-stat-value">${history.length}</div>
              <div class="admin-stat-label">Tests Taken</div>
            </div>
          </div>
          <div class="admin-stat-card animate-fadeInUp stagger-3">
            <div class="admin-stat-icon orange">🎯</div>
            <div class="admin-stat-info">
              <div class="admin-stat-value">${stats.avgAccuracy}%</div>
              <div class="admin-stat-label">Avg Accuracy</div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-bottom: var(--space-6);">
          <div class="card animate-fadeInUp stagger-4">
            <h3 style="font-size: var(--text-base); margin-bottom: var(--space-4);">Questions by Subject</h3>
            <canvas id="admin-subject-chart" width="300" height="300" style="margin: 0 auto; display: block;"></canvas>
            <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-3); margin-top: var(--space-3);">
              ${Object.entries(subjectCounts).map(([s, c]) => `
                <span class="legend-item">
                  <span class="legend-dot" style="background: ${Helpers.getSubjectColor(s)};"></span>
                  ${s} (${c})
                </span>
              `).join('')}
            </div>
          </div>
          <div class="card animate-fadeInUp stagger-5">
            <h3 style="font-size: var(--text-base); margin-bottom: var(--space-4);">Questions by Difficulty</h3>
            <canvas id="admin-difficulty-chart" width="300" height="300" style="margin: 0 auto; display: block;"></canvas>
            <div style="display: flex; justify-content: center; gap: var(--space-4); margin-top: var(--space-3);">
              <span class="legend-item"><span class="legend-dot" style="background: #10B981;"></span> Easy (${difficultyCounts.easy})</span>
              <span class="legend-item"><span class="legend-dot" style="background: #F59E0B;"></span> Medium (${difficultyCounts.medium})</span>
              <span class="legend-item"><span class="legend-dot" style="background: #EF4444;"></span> Hard (${difficultyCounts.hard})</span>
            </div>
          </div>
        </div>

        <!-- Exam Distribution -->
        <div class="card animate-fadeInUp stagger-6">
          <h3 style="font-size: var(--text-base); margin-bottom: var(--space-4);">Questions by Exam</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-3);">
            ${Object.entries(examCounts).map(([exam, count]) => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); background: var(--bg-glass); border-radius: var(--radius-md);">
                <span style="font-size: var(--text-sm); font-weight: var(--font-medium);">${exam}</span>
                <span class="chip chip-primary">${count}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  afterDashboardRender() {
    const questions = window.QUESTION_BANK || [];
    const subjectCounts = {};
    const difficultyCounts = { easy: 0, medium: 0, hard: 0 };

    questions.forEach(q => {
      subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
      difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
    });

    // Subject donut
    const subjectCanvas = document.getElementById('admin-subject-chart');
    if (subjectCanvas) {
      Analytics.drawDonutChart(subjectCanvas, Object.entries(subjectCounts).map(([s, c]) => ({
        label: s, value: c, color: Helpers.getSubjectColor(s)
      })), { centerText: String(questions.length), centerSubText: 'Questions' });
    }

    // Difficulty donut
    const diffCanvas = document.getElementById('admin-difficulty-chart');
    if (diffCanvas) {
      Analytics.drawDonutChart(diffCanvas, [
        { label: 'Easy', value: difficultyCounts.easy, color: '#10B981' },
        { label: 'Medium', value: difficultyCounts.medium, color: '#F59E0B' },
        { label: 'Hard', value: difficultyCounts.hard, color: '#EF4444' }
      ], { centerText: '3', centerSubText: 'Levels' });
    }
  },

  // ═══════════════════════════════════════
  // QUESTION MANAGER
  // ═══════════════════════════════════════
  renderQuestions() {
    let questions = [...(window.QUESTION_BANK || [])];
    const subjects = [...new Set(questions.map(q => q.subject))];
    const exams = [...new Set(questions.flatMap(q => q.exam || []))];

    // Apply filters
    if (this.filterSubject !== 'all') {
      questions = questions.filter(q => q.subject === this.filterSubject);
    }
    if (this.filterDifficulty !== 'all') {
      questions = questions.filter(q => q.difficulty === this.filterDifficulty);
    }
    if (this.filterExam !== 'all') {
      questions = questions.filter(q => q.exam && q.exam.includes(this.filterExam));
    }
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      questions = questions.filter(q => q.question.toLowerCase().includes(query) || q.topic.toLowerCase().includes(query));
    }

    const labels = ['A', 'B', 'C', 'D'];

    return `
      <div class="page-enter">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">Question Manager</h1>
            <p class="admin-page-subtitle">Manage your question bank (${questions.length} questions)</p>
          </div>
          <div style="display: flex; gap: var(--space-3);">
            <button class="btn btn-secondary btn-sm" onclick="AdminApp.exportQuestions()">
              📥 Export JSON
            </button>
            <button class="btn btn-primary btn-sm" onclick="AdminApp.navigateTo('add')">
              ➕ Add Question
            </button>
          </div>
        </div>

        <!-- Filters -->
        <div class="question-filters">
          <input type="text" class="input question-search" placeholder="🔍 Search questions..."
                 value="${this.searchQuery}"
                 oninput="AdminApp.searchQuery = this.value; AdminApp.render();"
                 id="question-search">
          <select class="select" onchange="AdminApp.filterSubject = this.value; AdminApp.render();" id="filter-subject">
            <option value="all" ${this.filterSubject === 'all' ? 'selected' : ''}>All Subjects</option>
            ${subjects.map(s => `<option value="${s}" ${this.filterSubject === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <select class="select" onchange="AdminApp.filterDifficulty = this.value; AdminApp.render();" id="filter-difficulty">
            <option value="all" ${this.filterDifficulty === 'all' ? 'selected' : ''}>All Difficulty</option>
            <option value="easy" ${this.filterDifficulty === 'easy' ? 'selected' : ''}>Easy</option>
            <option value="medium" ${this.filterDifficulty === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="hard" ${this.filterDifficulty === 'hard' ? 'selected' : ''}>Hard</option>
          </select>
          <select class="select" onchange="AdminApp.filterExam = this.value; AdminApp.render();" id="filter-exam">
            <option value="all" ${this.filterExam === 'all' ? 'selected' : ''}>All Exams</option>
            ${exams.map(e => `<option value="${e}" ${this.filterExam === e ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </div>

        <!-- Question List -->
        <div id="question-list">
          ${questions.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📋</div>
              <div class="empty-state-title">No questions found</div>
              <p style="color: var(--text-muted);">Try adjusting your filters or add new questions</p>
            </div>
          ` : ''}
          ${questions.map((q, i) => `
            <div class="question-list-item animate-fadeInUp" style="animation-delay: ${Math.min(i * 30, 300)}ms;">
              <div class="question-list-content">
                <div class="question-list-text">${q.question}</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: var(--space-2);">
                  Answer: <strong style="color: var(--success);">${labels[q.correct]} - ${q.options[q.correct]}</strong>
                </div>
                <div class="question-list-meta">
                  <span class="chip chip-primary">${q.subject}</span>
                  <span class="chip">${q.topic}</span>
                  <span class="chip ${Helpers.getDifficultyClass(q.difficulty)}">${q.difficulty}</span>
                  ${(q.exam || []).map(e => `<span class="chip">${e}</span>`).join('')}
                  ${q.pyq ? `<span class="chip chip-warning">PYQ${q.year ? ' ' + q.year : ''}</span>` : ''}
                </div>
              </div>
              <div class="question-list-actions">
                <button class="btn btn-ghost btn-icon" onclick="AdminApp.editQuestion('${q.id}')" title="Edit">✏️</button>
                <button class="btn btn-ghost btn-icon" onclick="AdminApp.deleteQuestion('${q.id}')" title="Delete">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════
  // ADD / EDIT QUESTION
  // ═══════════════════════════════════════
  renderAddQuestion() {
    const q = this.editingQuestion || {
      question: '', options: ['', '', '', ''], correct: 0,
      subject: 'Math', difficulty: 'medium', exam: []
    };
    const isEdit = !!this.editingQuestion;
    const labels = ['A', 'B', 'C', 'D'];

    return `
      <div class="page-enter">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">${isEdit ? 'Edit Question' : 'Add Question'}</h1>
            <p class="admin-page-subtitle">${isEdit ? 'Update question details' : 'Add a new question to the database'}</p>
          </div>
          <button class="btn btn-ghost" onclick="AdminApp.navigateTo('questions')">← Back to Questions</button>
        </div>

        <div class="question-form">
          <!-- Question Text -->
          <div class="input-group">
            <label class="input-label">Question *</label>
            <textarea class="textarea" id="q-text" rows="3" placeholder="Enter question text...">${q.question}</textarea>
          </div>

          <!-- Options -->
          <div class="input-group">
            <label class="input-label">Options *</label>
            <div class="options-form-grid">
              ${q.options.map((opt, i) => `
                <div class="option-input-wrap">
                  <span class="option-input-label">${labels[i]}</span>
                  <input type="text" class="input" id="q-opt-${i}" value="${opt}" placeholder="Option ${labels[i]}..." style="flex:1;">
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Correct Answer -->
          <div class="input-group">
            <label class="input-label">Correct Answer *</label>
            <div class="toggle-group" id="correct-answer-group">
              ${labels.map((l, i) => `
                <button class="toggle-btn ${q.correct === i ? 'active' : ''}"
                        onclick="AdminApp._setCorrect(${i})"
                        id="correct-btn-${i}">${l}</button>
              `).join('')}
            </div>
          </div>

          <!-- Subject & Difficulty -->
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">Subject *</label>
              <select class="select" id="q-subject">
                ${['Math', 'GK', 'Reasoning', 'English', 'Hindi'].map(s =>
      `<option value="${s}" ${q.subject === s ? 'selected' : ''}>${s}</option>`
    ).join('')}
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Difficulty *</label>
              <select class="select" id="q-difficulty">
                <option value="easy" ${q.difficulty === 'easy' ? 'selected' : ''}>Easy</option>
                <option value="medium" ${q.difficulty === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="hard" ${q.difficulty === 'hard' ? 'selected' : ''}>Hard</option>
              </select>
            </div>
          </div>

          <!-- Exam -->
          <div class="input-group">
            <label class="input-label">Exam</label>
            <input type="text" class="input" id="q-exam" value="${(q.exam || []).join(', ')}" placeholder="SSC, Railway, Police">
          </div>

          <!-- Submit -->
          <div style="display: flex; gap: var(--space-4); padding-top: var(--space-4);">
            <button class="btn btn-primary btn-lg" onclick="AdminApp.saveQuestion()" id="save-question-btn">
              ${isEdit ? '💾 Update Question' : '➕ Add Question'}
            </button>
            <button class="btn btn-secondary btn-lg" onclick="AdminApp.navigateTo('questions')">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
  },

  _selectedCorrect: 0,

  _setCorrect(idx) {
    this._selectedCorrect = idx;
    document.querySelectorAll('#correct-answer-group .toggle-btn').forEach((btn, i) => {
      btn.classList.toggle('active', i === idx);
    });
  },

  async saveQuestion() {
    const question = document.getElementById('q-text').value.trim();
    const options = [
      document.getElementById('q-opt-0').value.trim(),
      document.getElementById('q-opt-1').value.trim(),
      document.getElementById('q-opt-2').value.trim(),
      document.getElementById('q-opt-3').value.trim()
    ];
    const correct = this._selectedCorrect;
    const subject = document.getElementById('q-subject').value;
    const difficulty = document.getElementById('q-difficulty').value;
    const examStr = document.getElementById('q-exam').value;
    const exam = examStr ? examStr.split(',').map(e => e.trim()).filter(Boolean).join(',') : '';

    // Validate
    if (!question) { Helpers.showToast('Question text is required', 'error'); return; }
    if (options.some(o => !o)) { Helpers.showToast('All 4 options are required', 'error'); return; }

    // Build DB row — correct_answer = actual option text
    const dbRow = {
      question: question,
      option_a: options[0],
      option_b: options[1],
      option_c: options[2],
      option_d: options[3],
      correct_answer: options[correct],
      subject: subject,
      exam: exam,
      difficulty: difficulty
    };

    // Validate: correct_answer must match one option
    if (!options.includes(dbRow.correct_answer)) {
      Helpers.showToast('Correct answer must match an option', 'error');
      return;
    }

    // Save to DB
    const saveBtn = document.getElementById('save-question-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving...'; }

    const result = await addQuestionToDB(dbRow);

    if (!result.success) {
      Helpers.showToast(`Failed: ${result.error}`, 'error');
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '➕ Add Question'; }
      return;
    }

    Helpers.showToast('Question added to database!', 'success');

    // Reload questions from DB
    await this._reloadQuestions();
    this.editingQuestion = null;
    this.navigateTo('questions');
  },

  editQuestion(id) {
    const questions = window.QUESTION_BANK || [];
    const q = questions.find(q => String(q.id) === String(id));
    if (q) {
      this.editingQuestion = { ...q };
      this._selectedCorrect = q.correct;
      this.navigateTo('add');
    }
  },

  async deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;

    const result = await deleteQuestionFromDB(id);

    if (!result.success) {
      Helpers.showToast(`Delete failed: ${result.error}`, 'error');
      return;
    }

    Helpers.showToast('Question deleted from database', 'success');
    await this._reloadQuestions();
    this.render();
  },

  exportQuestions() {
    const questions = window.QUESTION_BANK || [];
    Helpers.exportQuestionsJSON(questions);
    Helpers.showToast(`Exported ${questions.length} questions`, 'success');
  },

  // ═══════════════════════════════════════
  // BULK UPLOAD
  // ═══════════════════════════════════════
  renderBulkUpload() {
    return `
      <div class="page-enter">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">Bulk Upload</h1>
            <p class="admin-page-subtitle">Upload questions from a CSV file</p>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="AdminApp.downloadTemplate()">
            📄 Download CSV Template
          </button>
        </div>

        <!-- Upload Zone -->
        <div class="upload-zone" id="upload-zone"
             onclick="document.getElementById('csv-file').click()"
             ondragover="event.preventDefault(); this.classList.add('dragover')"
             ondragleave="this.classList.remove('dragover')"
             ondrop="event.preventDefault(); this.classList.remove('dragover'); AdminApp.handleFileDrop(event)">
          <div class="upload-icon">📁</div>
          <div class="upload-text">Click to upload or drag & drop</div>
          <div class="upload-hint">Supports CSV files only</div>
          <input type="file" id="csv-file" accept=".csv" style="display:none" onchange="AdminApp.handleFileSelect(event)">
        </div>

        <!-- CSV Format Guide -->
        <div class="card" style="margin-top: var(--space-6);">
          <h3 style="font-size: var(--text-base); margin-bottom: var(--space-4);">📋 CSV Format Guide</h3>
          <div class="table-wrapper">
            <table class="table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Required</th>
                  <th>Description</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>question</td><td>✅</td><td>Question text</td><td>What is 2+2?</td></tr>
                <tr><td>option_a</td><td>✅</td><td>Option A text</td><td>3</td></tr>
                <tr><td>option_b</td><td>✅</td><td>Option B text</td><td>4</td></tr>
                <tr><td>option_c</td><td>✅</td><td>Option C text</td><td>5</td></tr>
                <tr><td>option_d</td><td>✅</td><td>Option D text</td><td>6</td></tr>
                <tr><td>correct</td><td>✅</td><td>Correct answer (A/B/C/D)</td><td>B</td></tr>
                <tr><td>subject</td><td>✅</td><td>Subject name</td><td>Math</td></tr>
                <tr><td>topic</td><td></td><td>Topic name</td><td>Arithmetic</td></tr>
                <tr><td>difficulty</td><td></td><td>easy/medium/hard</td><td>easy</td></tr>
                <tr><td>exam</td><td></td><td>Exam tags (semicolon sep)</td><td>SSC;Railway</td></tr>
                <tr><td>explanation</td><td></td><td>Answer explanation</td><td>2+2=4</td></tr>
                <tr><td>pyq</td><td></td><td>true/false</td><td>false</td></tr>
                <tr><td>year</td><td></td><td>PYQ year</td><td>2023</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Upload Preview -->
        <div id="upload-preview"></div>
      </div>
    `;
  },

  downloadTemplate() {
    const template = Helpers.getCSVTemplate();
    Helpers.downloadFile(template, 'question_template.csv');
    Helpers.showToast('Template downloaded!', 'success');
  },

  handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) this.processCSV(file);
  },

  handleFileDrop(event) {
    const file = event.dataTransfer.files[0];
    if (file) this.processCSV(file);
  },

  processCSV(file) {
    if (!file.name.endsWith('.csv')) {
      Helpers.showToast('Please upload a CSV file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = Helpers.parseCSV(e.target.result);
      this.showUploadPreview(result);
    };
    reader.readAsText(file);
  },

  showUploadPreview(result) {
    const previewEl = document.getElementById('upload-preview');
    if (!previewEl) return;

    const labels = ['A', 'B', 'C', 'D'];

    previewEl.innerHTML = `
      <div class="upload-preview" style="margin-top: var(--space-6);">
        <div class="upload-preview-header">
          <h3 style="font-size: var(--text-base);">Preview (${result.questions.length} questions parsed)</h3>
          ${result.questions.length > 0 ? `
            <button class="btn btn-success btn-sm" onclick="AdminApp.confirmUpload()" id="confirm-upload-btn">
              ✅ Upload ${result.questions.length} Questions
            </button>
          ` : ''}
        </div>

        ${result.errors.length > 0 ? `
          <div style="background: var(--danger-bg); border: 1px solid rgba(239,68,68,0.3); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4);">
            <strong style="color: var(--danger); font-size: var(--text-sm);">⚠️ Errors:</strong>
            <ul style="margin-top: var(--space-2); padding-left: var(--space-4);">
              ${result.errors.map(e => `<li style="font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: var(--space-1);">${e}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${result.questions.map((q, i) => `
          <div class="question-list-item" style="animation-delay: ${i * 30}ms;">
            <div class="question-list-content">
              <div class="question-list-text">${q.question}</div>
              <div style="font-size: 12px; color: var(--text-muted); margin-bottom: var(--space-2);">
                Answer: <strong style="color: var(--success);">${labels[q.correct]} - ${q.options[q.correct]}</strong>
              </div>
              <div class="question-list-meta">
                <span class="chip chip-primary">${q.subject}</span>
                <span class="chip">${q.topic}</span>
                <span class="chip ${Helpers.getDifficultyClass(q.difficulty)}">${q.difficulty}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this._pendingUpload = result.questions;
  },

  _pendingUpload: [],

  async confirmUpload() {
    if (this._pendingUpload.length === 0) return;

    // Convert UI format → DB format for bulk insert
    const dbRows = this._pendingUpload.map(q => ({
      question: q.question,
      option_a: q.options[0],
      option_b: q.options[1],
      option_c: q.options[2],
      option_d: q.options[3],
      correct_answer: q.options[q.correct],
      subject: q.subject || 'General',
      exam: (q.exam || []).join(','),
      difficulty: q.difficulty || 'medium'
    }));

    const result = await bulkInsertQuestions(dbRows);

    if (!result.success) {
      Helpers.showToast(`Upload failed: ${result.error}`, 'error');
      return;
    }

    Helpers.showToast(`✅ ${dbRows.length} questions uploaded to database!`, 'success');
    this._pendingUpload = [];
    await this._reloadQuestions();
    this.navigateTo('questions');
  },

  // ═══════════════════════════════════════
  // ANALYTICS
  // ═══════════════════════════════════════
  renderAnalytics() {
    const history = Storage.getHistory();
    const overallStats = Analytics.getOverallStats();
    const subjectPerf = Analytics.getSubjectPerformance();

    return `
      <div class="page-enter">
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">Analytics</h1>
            <p class="admin-page-subtitle">Test performance insights and trends</p>
          </div>
        </div>

        ${history.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <div class="empty-state-title">No test data yet</div>
            <p style="color: var(--text-muted);">Take some tests to see analytics here</p>
          </div>
        ` : `
          <!-- Overall Stats -->
          <div class="admin-stats-grid">
            <div class="admin-stat-card">
              <div class="admin-stat-icon blue">📝</div>
              <div class="admin-stat-info">
                <div class="admin-stat-value">${overallStats.totalTests}</div>
                <div class="admin-stat-label">Total Tests</div>
              </div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon green">🎯</div>
              <div class="admin-stat-info">
                <div class="admin-stat-value">${overallStats.avgAccuracy}%</div>
                <div class="admin-stat-label">Avg Accuracy</div>
              </div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon purple">🏆</div>
              <div class="admin-stat-info">
                <div class="admin-stat-value">${overallStats.bestScore}%</div>
                <div class="admin-stat-label">Best Score</div>
              </div>
            </div>
            <div class="admin-stat-card">
              <div class="admin-stat-icon orange">⏱️</div>
              <div class="admin-stat-info">
                <div class="admin-stat-value">${Helpers.formatDuration(overallStats.totalTime)}</div>
                <div class="admin-stat-label">Total Practice Time</div>
              </div>
            </div>
          </div>

          <!-- Charts -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-bottom: var(--space-6);">
            <div class="card">
              <h3 style="font-size: var(--text-base); margin-bottom: var(--space-4);">📈 Performance Trend</h3>
              <canvas id="analytics-trend-chart" width="400" height="250" style="width: 100%;"></canvas>
            </div>
            <div class="card">
              <h3 style="font-size: var(--text-base); margin-bottom: var(--space-4);">📊 Subject Performance</h3>
              <canvas id="analytics-subject-chart" width="400" height="250" style="width: 100%;"></canvas>
            </div>
          </div>

          <!-- Recent Tests -->
          <div class="card">
            <h3 style="font-size: var(--text-base); margin-bottom: var(--space-4);">📝 Recent Tests</h3>
            <div class="table-wrapper">
              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Questions</th>
                    <th>Score</th>
                    <th>Accuracy</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  ${history.slice(0, 10).map(t => `
                    <tr>
                      <td>${new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>${t.totalQuestions}</td>
                      <td>${t.totalMarks}/${t.maxMarks}</td>
                      <td>
                        <span class="chip ${t.accuracy >= 70 ? 'chip-success' : t.accuracy >= 40 ? 'chip-warning' : 'chip-danger'}">
                          ${t.accuracy}%
                        </span>
                      </td>
                      <td>${Helpers.formatDuration(t.timeTaken)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `}
      </div>
    `;
  },

  afterAnalyticsRender() {
    const history = Storage.getHistory();
    if (history.length === 0) return;

    // Trend chart
    const trendCanvas = document.getElementById('analytics-trend-chart');
    if (trendCanvas) {
      const trendData = history.slice(0, 10).reverse().map((t, i) => ({
        label: `T${i + 1}`,
        value: t.accuracy || 0
      }));
      trendCanvas.width = trendCanvas.offsetWidth * 2;
      trendCanvas.height = 500;
      Analytics.drawLineChart(trendCanvas, trendData);
    }

    // Subject chart
    const subjectCanvas = document.getElementById('analytics-subject-chart');
    if (subjectCanvas) {
      const subjectPerf = Analytics.getSubjectPerformance();
      subjectCanvas.width = subjectCanvas.offsetWidth * 2;
      subjectCanvas.height = 500;
      Analytics.drawBarChart(subjectCanvas, subjectPerf.map(s => ({
        label: s.name,
        value: s.accuracy,
        color: s.color
      })));
    }
  },

  // ── Reload questions from DB after mutations ──
  async _reloadQuestions() {
    const data = await window.fetchQuestions();
    if (data && data.length > 0) {
      window.QUESTION_BANK = window.mapDBToUI(data);
      console.log("Reloaded:", window.QUESTION_BANK.length, "questions");
    }
  }
};

// Init (async)
document.addEventListener('DOMContentLoaded', async () => await AdminApp.init());
