// ============================================
// POLYTECHNIC PAGE — BTEUP Paper Generator
// Blue/Purple Premium Design — SPA version
// Converted from standalone polytechnic/index.html
// ============================================

const PolytechnicPage = {
  _selectedSubject: '',
  _generatedPaper: null,
  _isGenerating: false,

  render(params) {
    return `
      <div class="page-enter" style="min-height:100vh;">

        <!-- Injected Scoped Styles -->
        <style>
          .poly-page {
            --poly-bg: #0a0a1a;
            --poly-surface: #12122a;
            --poly-surface2: #1a1a3e;
            --poly-accent: #6c5ce7;
            --poly-accent-glow: rgba(108, 92, 231, 0.3);
            --poly-text: #e4e4f0;
            --poly-text-dim: #8888aa;
            --poly-border: #2a2a4a;
            --poly-success: #00d68f;
            --poly-warn: #ffa726;
            --poly-danger: #ff5252;
            --poly-radius: 12px;
            font-family: 'Inter', sans-serif;
            color: var(--poly-text);
          }
          .poly-header {
            background: linear-gradient(135deg, #0f0f2e 0%, #1a1a4e 50%, #0a0a2a 100%);
            border-bottom: 1px solid var(--poly-border);
            padding: 24px 32px;
            border-radius: 18px;
            margin-bottom: 28px;
          }
          .poly-header h1 {
            font-size: 1.6rem;
            font-weight: 800;
            background: linear-gradient(135deg, #a78bfa, #6c5ce7);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0 0 4px;
          }
          .poly-header p { color: var(--poly-text-dim); font-size: 0.9rem; margin: 0; }

          .poly-card {
            background: var(--poly-surface);
            border: 1px solid var(--poly-border);
            border-radius: var(--poly-radius);
            padding: 24px;
            margin-bottom: 24px;
          }
          .poly-card-title {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--poly-text);
          }

          .poly-stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          @media (max-width: 600px) { .poly-stats-row { grid-template-columns: repeat(2, 1fr); } }
          .poly-stat-card {
            background: var(--poly-surface);
            border: 1px solid var(--poly-border);
            border-radius: 10px;
            padding: 16px;
            text-align: center;
          }
          .poly-stat-value {
            font-size: 1.8rem;
            font-weight: 800;
            background: linear-gradient(135deg, #6c5ce7, #00d68f);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .poly-stat-label { font-size: 0.75rem; color: var(--poly-text-dim); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }

          .poly-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          @media (max-width: 600px) { .poly-form-grid { grid-template-columns: 1fr; } }
          .poly-form-group { display: flex; flex-direction: column; }
          .poly-form-group label {
            font-size: 0.8rem;
            font-weight: 600;
            color: var(--poly-text-dim);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
          }
          .poly-form-group select,
          .poly-form-group input {
            background: var(--poly-surface2);
            border: 1px solid var(--poly-border);
            border-radius: 8px;
            padding: 10px 14px;
            color: var(--poly-text);
            font-size: 0.95rem;
            font-family: inherit;
            transition: border 0.2s;
            outline: none;
          }
          .poly-form-group select:focus,
          .poly-form-group input:focus {
            border-color: var(--poly-accent);
            box-shadow: 0 0 0 3px var(--poly-accent-glow);
          }

          .poly-btn-primary {
            background: linear-gradient(135deg, #6c5ce7, #a78bfa);
            color: #fff;
            border: none;
            padding: 14px 32px;
            border-radius: 10px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            width: 100%;
            margin-top: 16px;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
          }
          .poly-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px var(--poly-accent-glow); }
          .poly-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

          .poly-btn-secondary {
            background: var(--poly-surface2);
            color: var(--poly-text);
            border: 1px solid var(--poly-border);
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }
          .poly-btn-secondary:hover { border-color: var(--poly-accent); background: rgba(108, 92, 231, 0.1); }

          .poly-section-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 14px;
            background: var(--poly-surface2);
            border-radius: 8px;
            margin-bottom: 6px;
            font-size: 0.9rem;
          }
          .poly-section-row .section-name { font-weight: 600; color: var(--poly-text); }
          .poly-section-row .section-meta { color: var(--poly-text-dim); font-size: 0.8rem; }

          .poly-syllabus-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
          }
          .poly-syllabus-chip {
            background: var(--poly-surface2);
            border: 1px solid var(--poly-border);
            border-radius: 20px;
            padding: 6px 14px;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 6px;
            color: var(--poly-text);
          }
          .poly-chip-weight {
            background: var(--poly-accent);
            color: #fff;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.7rem;
            font-weight: 700;
          }

          .poly-result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 16px;
          }
          .poly-result-actions { display: flex; gap: 8px; flex-wrap: wrap; }

          .poly-loading {
            text-align: center;
            padding: 40px;
          }
          .poly-spinner {
            width: 48px;
            height: 48px;
            border: 4px solid var(--poly-border);
            border-top: 4px solid var(--poly-accent);
            border-radius: 50%;
            animation: polySpin 0.8s linear infinite;
            margin: 0 auto 16px;
          }
          @keyframes polySpin { to { transform: rotate(360deg); } }
        </style>

        <div class="poly-page" style="max-width:900px;margin:0 auto;padding:24px 16px 80px;">

          <!-- Header -->
          <div class="poly-header">
            <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--poly-text-dim);margin-bottom:8px;">
              <a href="#home" style="color:var(--poly-accent);text-decoration:none;">Home</a>
              <span>›</span><span>Polytechnic</span>
            </div>
            <h1>📄 Polytechnic Paper Generator</h1>
            <p>Generate weighted, balanced BTEUP exam papers with bilingual support</p>
          </div>

          <!-- Stats -->
          <div class="poly-stats-row">
            <div class="poly-stat-card">
              <div class="poly-stat-value">16</div>
              <div class="poly-stat-label">Subjects</div>
            </div>
            <div class="poly-stat-card">
              <div class="poly-stat-value">500+</div>
              <div class="poly-stat-label">Questions</div>
            </div>
            <div class="poly-stat-card">
              <div class="poly-stat-value">7</div>
              <div class="poly-stat-label">Branches</div>
            </div>
            <div class="poly-stat-card">
              <div class="poly-stat-value">6</div>
              <div class="poly-stat-label">Semesters</div>
            </div>
          </div>

          <!-- Generator Form -->
          <div class="poly-card">
            <div class="poly-card-title">🎯 Paper Configuration</div>
            <div class="poly-form-grid">
              <div class="poly-form-group">
                <label>Branch</label>
                <select id="poly-branch" onchange="PolytechnicPage.onBranchChange(this.value)">
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Electronics Engineering">Electronics Engineering</option>
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Chemical Engineering">Chemical Engineering</option>
                </select>
              </div>
              <div class="poly-form-group">
                <label>Semester</label>
                <select id="poly-semester" onchange="PolytechnicPage.onSemChange(this.value)">
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3" selected>Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                </select>
              </div>
              <div class="poly-form-group">
                <label>Subject</label>
                <select id="poly-subject">
                  <option value="">Select Subject...</option>
                </select>
              </div>
              <div class="poly-form-group">
                <label>Language</label>
                <select id="poly-language">
                  <option value="bilingual">Bilingual (EN + HI)</option>
                  <option value="en">English Only</option>
                  <option value="hi">Hindi Only</option>
                </select>
              </div>
              <div class="poly-form-group">
                <label>Paper Title (Optional)</label>
                <input type="text" id="poly-title" placeholder="Auto-generated if empty">
              </div>
              <div class="poly-form-group">
                <label>Watermark</label>
                <input type="text" id="poly-watermark" placeholder="e.g., PRACTICE ONLY">
              </div>
            </div>

            <!-- Syllabus preview -->
            <div id="poly-syllabus-preview" style="margin-top:16px;display:none;">
              <div class="poly-card-title" style="font-size:0.9rem">📚 Syllabus Weightage</div>
              <div class="poly-syllabus-chips" id="poly-syllabus-chips"></div>
            </div>

            <!-- Pattern preview -->
            <div id="poly-pattern-preview" style="margin-top:16px;display:none;">
              <div class="poly-card-title" style="font-size:0.9rem">📋 Paper Structure</div>
              <div id="poly-sections-preview"></div>
            </div>

            <button class="poly-btn-primary" id="poly-gen-btn" onclick="PolytechnicPage.generate()">
              ⚡ Generate Paper
            </button>
          </div>

          <!-- Loading -->
          <div id="poly-loading" style="display:none;">
            <div class="poly-loading">
              <div class="poly-spinner"></div>
              <div style="font-weight:600;color:var(--poly-text);">Generating balanced paper...</div>
              <div style="color:var(--poly-text-dim);margin-top:4px;font-size:0.85rem;">Applying unit weightage, difficulty balancing, and anti-repetition</div>
            </div>
          </div>

          <!-- Result -->
          <div id="poly-result" style="display:none;">
            <div class="poly-card">
              <div class="poly-result-header">
                <div>
                  <div class="poly-card-title">✅ Paper Generated</div>
                  <div style="color:var(--poly-text-dim);font-size:0.85rem;" id="poly-result-meta"></div>
                </div>
                <div class="poly-result-actions">
                  <button class="poly-btn-secondary" onclick="PolytechnicPage.printPaper()">🖨️ Print / Preview</button>
                  <button class="poly-btn-secondary" onclick="PolytechnicPage.generate()">🔄 Generate Another</button>
                </div>
              </div>
              <div id="poly-sections-summary"></div>
            </div>
          </div>

          <!-- Info Card -->
          <div class="poly-card" style="border-color:rgba(108,92,231,0.3);">
            <div class="poly-card-title">💡 About This Generator</div>
            <div style="font-size:0.9rem;color:var(--poly-text-dim);line-height:1.7;">
              <p style="margin-bottom:8px;">BTEUP pattern ke hisaab se balanced question papers generate karta hai — unit weightage, difficulty mixing, aur bilingual (English + Hindi) support ke saath.</p>
              <p style="margin:0;">Question bank abhi build ho raha hai. Jaise-jaise questions add honge, papers aur accurate honge.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  onBranchChange(val) {
    // Placeholder — will be wired to actual data later
    window.Helpers?.showToast?.('Branch changed: ' + val, 'info');
  },

  onSemChange(val) {
    window.Helpers?.showToast?.('Semester changed: ' + val, 'info');
  },

  generate() {
    if (this._isGenerating) return;
    this._isGenerating = true;

    const btn = document.getElementById('poly-gen-btn');
    const loading = document.getElementById('poly-loading');
    const result = document.getElementById('poly-result');

    if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating...'; }
    if (loading) loading.style.display = 'block';
    if (result) result.style.display = 'none';

    setTimeout(() => {
      this._isGenerating = false;
      if (btn) { btn.disabled = false; btn.textContent = '⚡ Generate Paper'; }
      if (loading) loading.style.display = 'none';

      // Show placeholder result
      if (result) {
        result.style.display = 'block';
        const meta = document.getElementById('poly-result-meta');
        if (meta) meta.textContent = 'Question bank under construction — full generation coming soon.';
      }

      window.Helpers?.showToast?.('Paper generation system under construction!', 'info');
    }, 1500);
  },

  printPaper() {
    window.Helpers?.showToast?.('Print feature coming soon!', 'info');
  },

  refresh() {
    const app = document.getElementById('app');
    if (app && typeof App !== 'undefined' && App.currentPage === 'polytechnic') {
      const footer = App._renderFooter ? App._renderFooter() : '';
      app.innerHTML = App._renderHeader('polytechnic') + this.render() + footer;
    }
  },

  afterRender() {},
  destroy() {}
};

window.PolytechnicPage = PolytechnicPage;
