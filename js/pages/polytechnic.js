// ============================================
// POLYTECHNIC PAGE — BTEUP Paper Generator v8
// Dark Premium. Search-first. High-density.
// ============================================

const PolytechnicPage = {
  _selectedBranch: 'Mechanical Engineering',
  _selectedSemester: '3',
  _selectedSubject: '',
  _selectedType: 'pyq', // 'pyq', 'sample', 'practice'
  _selectedYear: '2022',
  _selectedMode: 'online', // 'online', 'pdf'
  _generatedPaper: null,

  _branches: [
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Electronics Engineering',
    'Computer Science & Engineering',
    'Information Technology',
    'Chemical Engineering'
  ],

  _subjects: {
    '1': [
      { id: 9, name: 'Mathematics-I', code: '4101' },
      { id: 10, name: 'Applied Physics-I', code: '4102' },
      { id: 11, name: 'Applied Chemistry', code: '4103' },
      { id: 12, name: 'Communication Skills in English', code: '4104' },
      { id: 13, name: 'Engineering Mechanics', code: '4105' }
    ],
    '2': [
      { id: 14, name: 'Applied Mathematics-II', code: '4201' },
      { id: 15, name: 'Applied Physics-II', code: '4202' }
    ],
    '3': [
      { id: 1, name: 'Applied Mathematics-II', code: '3001' },
      { id: 2, name: 'Applied Mechanics', code: '3002' },
      { id: 3, name: 'Engineering Drawing', code: '3003' },
      { id: 4, name: 'Manufacturing Technology', code: '3004' }
    ],
    '4': [
      { id: 5, name: 'Strength of Materials', code: '4001' },
      { id: 6, name: 'Thermal Engineering', code: '4002' }
    ],
    '5': [
      { id: 7, name: 'Theory of Machines', code: '5001' },
      { id: 8, name: 'Machine Design', code: '5002' }
    ],
    '6': [
      { id: 16, name: 'Industrial Engineering', code: '6001' }
    ]
  },

  _availablePapers: [
    { branch: 'Mechanical', sem: '3rd Sem', subject: 'Applied Math II', year: '2022', questions: '30 Qs' },
    { branch: 'Mechanical', sem: '3rd Sem', subject: 'Applied Math II', year: '2021', questions: '30 Qs' },
    { branch: 'Civil', sem: '2nd Sem', subject: 'Engineering Drawing', year: '2023', questions: '25 Qs' },
    { branch: 'CS', sem: '4th Sem', subject: 'Data Structures', year: '2022', questions: '30 Qs' },
    { branch: 'Electrical', sem: '5th Sem', subject: 'Power Systems', year: '2023', questions: '30 Qs' },
    { branch: 'Mechanical', sem: '1st Sem', subject: 'Applied Physics', year: '2023', questions: '30 Qs' },
    { branch: 'CS', sem: '6th Sem', subject: 'Software Engg', year: '2022', questions: '25 Qs' },
    { branch: 'Civil', sem: '4th Sem', subject: 'Structural Analysis', year: '2021', questions: '30 Qs' }
  ],

  render(params) {
    if (params?.branch) this._selectedBranch = params.branch === 'cs' ? 'Computer Science & Engineering' : params.branch.charAt(0).toUpperCase() + params.branch.slice(1) + ' Engineering';
    if (params?.semester) this._selectedSemester = params.semester;
    
    const subjects = this._subjects[this._selectedSemester] || [];
    if (subjects.length > 0 && !this._selectedSubject) {
      this._selectedSubject = subjects[0].name;
    }

    return `
      <div class="page-enter" style="max-width: 1200px; margin: 0 auto; padding: 24px;">
        <!-- Header -->
        <div style="margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); margin-bottom: 8px;">
            <a href="#home" style="color: var(--primary); text-decoration: none;">Home</a>
            <span>›</span>
            <span>Polytechnic</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px;">📄 BTEUP Paper Generator</h1>
          <p style="color: var(--text-secondary); font-size: 13px; margin: 0;">Generate authentic BTEUP Polytechnic question papers instantly · No login required</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start;" class="poly-grid">
          <!-- Left Column (60%) -->
          <div style="display: flex; flex-direction: column; gap: 24px;">
            <!-- Generator Config Card -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; padding: 24px;">
              <h2 style="font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 20px; display: flex; align-items: center; gap: 8px;">
                <span>⚙️</span> Generate New Paper
              </h2>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <!-- Branch -->
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Branch / Course</label>
                  <select id="poly-branch-select" onchange="PolytechnicPage.onBranchChange(this.value)" 
                          style="background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; color: var(--text-primary); font-size: 13px; width: 100%;">
                    ${this._branches.map(b => `<option value="${b}" ${b === this._selectedBranch ? 'selected' : ''}>${b}</option>`).join('')}
                  </select>
                </div>

                <!-- Semester -->
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Semester</label>
                  <select id="poly-semester-select" onchange="PolytechnicPage.onSemesterChange(this.value)"
                          style="background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; color: var(--text-primary); font-size: 13px; width: 100%;">
                    ${Object.keys(this._subjects).map(s => `<option value="${s}" ${s === this._selectedSemester ? 'selected' : ''}>Semester ${s}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 20px;">
                <!-- Subject -->
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Subject</label>
                  <select id="poly-subject-select" onchange="PolytechnicPage.onSubjectChange(this.value)"
                          style="background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px; color: var(--text-primary); font-size: 13px; width: 100%;">
                    ${subjects.map(s => `<option value="${s.name}" ${s.name === this._selectedSubject ? 'selected' : ''}>${s.name} (${s.code})</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- Paper Type Chips -->
              <div style="margin-bottom: 20px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 8px;">Paper Type</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  ${['pyq', 'sample', 'practice'].map(t => {
                    const label = t === 'pyq' ? 'Previous Year Paper' : t === 'sample' ? 'Sample Paper' : 'Practice Set';
                    const active = this._selectedType === t;
                    return `
                      <button onclick="PolytechnicPage.onTypeChange('${t}')"
                              style="background: ${active ? 'var(--primary-light)' : 'var(--bg-elevated)'}; border: 1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}; border-radius: 6px; padding: 8px 16px; color: ${active ? 'var(--text-primary)' : 'var(--text-secondary)'}; font-size: 13px; font-weight: 500;">
                        ${label}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>

              <!-- Conditional Year Select (only for PYQs) -->
              ${this._selectedType === 'pyq' ? `
                <div style="margin-bottom: 20px;">
                  <label style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 8px;">Year (for PYQ)</label>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${['2019', '2020', '2021', '2022', '2023'].map(y => {
                      const active = this._selectedYear === y;
                      return `
                        <button onclick="PolytechnicPage.onYearChange('${y}')"
                                style="background: ${active ? 'var(--primary-light)' : 'var(--bg-elevated)'}; border: 1px solid ${active ? 'var(--primary)' : 'var(--border-color)'}; border-radius: 6px; padding: 6px 12px; color: ${active ? 'var(--text-primary)' : 'var(--text-secondary)'}; font-size: 12px;">
                          ${y}
                        </button>
                      `;
                    }).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Mode Selection -->
              <div style="margin-bottom: 24px;">
                <label style="font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; display: block; margin-bottom: 8px;">Paper Mode</label>
                <div style="display: flex; gap: 8px;">
                  <button onclick="PolytechnicPage.onModeChange('online')"
                          style="flex: 1; background: ${this._selectedMode === 'online' ? 'var(--primary-light)' : 'var(--bg-elevated)'}; border: 1px solid ${this._selectedMode === 'online' ? 'var(--primary)' : 'var(--border-color)'}; border-radius: 6px; padding: 10px; color: var(--text-primary); font-size: 13px; font-weight: 500;">
                    💻 Solve Online
                  </button>
                  <button onclick="PolytechnicPage.onModeChange('pdf')"
                          style="flex: 1; background: ${this._selectedMode === 'pdf' ? 'var(--primary-light)' : 'var(--bg-elevated)'}; border: 1px solid ${this._selectedMode === 'pdf' ? 'var(--primary)' : 'var(--border-color)'}; border-radius: 6px; padding: 10px; color: var(--text-primary); font-size: 13px; font-weight: 500;">
                    📥 Download PDF
                  </button>
                </div>
              </div>

              <!-- Generate Button -->
              <button onclick="PolytechnicPage.generate()"
                      style="background: var(--primary); border: none; border-radius: 6px; padding: 14px; color: white; font-weight: 600; font-size: 14px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                Generate Predicted Paper →
              </button>
            </div>

            <!-- Preview Container -->
            <div id="poly-preview-container">
              ${this._renderPreview()}
            </div>
          </div>

          <!-- Right Column (40%) -->
          <div style="display: flex; flex-direction: column; gap: 24px;" class="poly-sidebar">
            <!-- Available Papers -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px;">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
                <h3 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; letter-spacing:-0.01em;">📄 Available Papers</h3>
                <span style="font-size:11px; background:rgba(99,102,241,0.12); color:#818CF8; padding:3px 10px; border-radius:100px; font-weight:600;">${this._availablePapers.length} papers</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                ${this._availablePapers.map(p => {
                  const branchIcons = { Mechanical:'⚙️', Civil:'🏗️', CS:'💻', Electrical:'⚡', Electronics:'📡' };
                  const branchColors = { Mechanical:'rgba(245,158,11,0.15)','#D97706', Civil:'rgba(16,185,129,0.15)','#10B981', CS:'rgba(99,102,241,0.15)','#818CF8', Electrical:'rgba(234,179,8,0.15)','#EAB308', Electronics:'rgba(236,72,153,0.15)','#EC4899' };
                  const icon = branchIcons[p.branch] || '📋';
                  const bgMap = { Mechanical:'rgba(245,158,11,0.14)', Civil:'rgba(16,185,129,0.14)', CS:'rgba(99,102,241,0.14)', Electrical:'rgba(234,179,8,0.14)', Electronics:'rgba(236,72,153,0.14)' };
                  const clrMap = { Mechanical:'#D97706', Civil:'#10B981', CS:'#818CF8', Electrical:'#EAB308', Electronics:'#EC4899' };
                  const bg = bgMap[p.branch] || 'rgba(99,102,241,0.12)';
                  const clr = clrMap[p.branch] || '#818CF8';
                  return `
                  <div onclick="PolytechnicPage.loadPredefined('${p.subject}', '${p.year}')" style="
                    display:flex; align-items:center; gap:14px;
                    padding:14px 16px;
                    background:var(--bg-elevated);
                    border:1.5px solid var(--border-color);
                    border-radius:14px;
                    cursor:pointer;
                    transition:all 200ms;
                    position:relative;
                    overflow:hidden;
                  " onmouseenter="this.style.borderColor='${clr}'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.2)';" onmouseleave="this.style.borderColor=''; this.style.transform=''; this.style.boxShadow='';">
                    <!-- Branch icon circle -->
                    <div style="
                      width:44px; height:44px;
                      border-radius:50%;
                      background:${bg};
                      display:flex; align-items:center; justify-content:center;
                      font-size:20px; flex-shrink:0;
                      border:1.5px solid rgba(255,255,255,0.06);
                    ">${icon}</div>
                    <!-- Text -->
                    <div style="flex:1; min-width:0;">
                      <div style="font-size:13px; font-weight:700; color:var(--text-primary); margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.branch} · ${p.sem}</div>
                      <div style="font-size:11px; color:var(--text-muted);">${p.subject} · ${p.questions}</div>
                    </div>
                    <!-- Year badge + Solve btn -->
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0;">
                      <span style="font-size:10px; font-weight:700; color:${clr}; background:${bg}; padding:2px 8px; border-radius:100px; letter-spacing:0.02em;">${p.year}</span>
                      <span style="font-size:11px; font-weight:600; color:${clr};">Solve →</span>
                    </div>
                  </div>`;
                }).join('')}
              </div>
            </div>

            <!-- Stats Card -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px;">
              <h3 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0 0 16px;">Generator Statistics</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); font-family: var(--font-mono);">1,247</div>
                  <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Generated Today</div>
                </div>
                <div>
                  <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); font-family: var(--font-mono);">8,432</div>
                  <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Total Papers</div>
                </div>
                <div>
                  <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); font-family: var(--font-mono);">23</div>
                  <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Branches Covered</div>
                </div>
                <div>
                  <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); font-family: var(--font-mono);">2019-2023</div>
                  <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase;">Year Coverage</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _renderPreview() {
    if (!this._generatedPaper) return '';

    return `
      <div class="animate-fadeInUp" style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 24px;">
        <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 16px;">
          <h3 style="font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px;">
            ${this._generatedPaper.title}
          </h3>
          <div style="font-size: 12px; color: var(--text-secondary); display: flex; gap: 16px; flex-wrap: wrap;">
            <span>Branch: ${this._generatedPaper.branch}</span>
            <span>Semester: ${this._generatedPaper.semester}</span>
            <span>Marks: ${this._generatedPaper.marks}</span>
            <span>Time: 3 Hours</span>
          </div>
        </div>

        <div style="background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 12px; color: var(--text-muted); line-height: 1.6;">
          <strong>Instructions:</strong> All questions are compulsory. In case of any discrepancy or translation variation, English version is official.
        </div>

        <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px;">
          <div>
            <div style="font-size: 13px; font-weight: 600; color: var(--primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Section A (Very Short Answer — 10 x 2 Marks)</div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="padding-bottom: 10px; border-bottom: 1px solid var(--border-light);">
                <div style="font-size: 13px; color: var(--text-primary); margin-bottom: 4px;">Q1. Solve the integration: ∫ x * e^x dx.</div>
                <div style="font-size: 11px; color: var(--text-muted);">समाकलन हल करें: ∫ x * e^x dx</div>
              </div>
              <div style="padding-bottom: 10px; border-bottom: 1px solid var(--border-light);">
                <div style="font-size: 13px; color: var(--text-primary); margin-bottom: 4px;">Q2. Differentiate log(sin x) with respect to x.</div>
                <div style="font-size: 11px; color: var(--text-muted);">x के सापेक्ष log(sin x) का अवकलन कीजिये।</div>
              </div>
              <div>
                <div style="font-size: 13px; color: var(--text-primary); margin-bottom: 4px;">Q3. Find the value of limit x -> 0 (sin x / x).</div>
                <div style="font-size: 11px; color: var(--text-muted);">सीमा का मान ज्ञात कीजिये: limit x -> 0 (sin x / x).</div>
              </div>
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 12px;">
          <button onclick="PolytechnicPage.startSolving()"
                  style="flex: 1; background: var(--primary); border: none; border-radius: 6px; padding: 12px; color: white; font-weight: 600; font-size: 13px; display: flex; align-items: center; justify-content: center;">
            Start Solving Online
          </button>
          <button onclick="PolytechnicPage.downloadPDF()"
                  style="background: transparent; border: 1px solid var(--border-color); border-radius: 6px; padding: 12px 20px; color: var(--text-primary); font-weight: 500; font-size: 13px;">
            Download PDF
          </button>
        </div>
      </div>
    `;
  },

  onBranchChange(value) {
    this._selectedBranch = value;
    this.refresh();
  },

  onSemesterChange(value) {
    this._selectedSemester = value;
    const subjects = this._subjects[value] || [];
    this._selectedSubject = subjects.length > 0 ? subjects[0].name : '';
    this.refresh();
  },

  onSubjectChange(value) {
    this._selectedSubject = value;
  },

  onTypeChange(value) {
    this._selectedType = value;
    this.refresh();
  },

  onYearChange(value) {
    this._selectedYear = value;
    this.refresh();
  },

  onModeChange(value) {
    this._selectedMode = value;
    this.refresh();
  },

  generate() {
    window.Helpers?.showToast?.('Generating predicted paper...', 'info');
    setTimeout(() => {
      this._generatedPaper = {
        title: `BTEUP Predicted Paper — ${this._selectedSubject}`,
        branch: this._selectedBranch,
        semester: `${this._selectedSemester} Semester`,
        marks: '50 Marks',
        subject: this._selectedSubject
      };
      window.Helpers?.showToast?.('Paper generated successfully!', 'success');
      this.refresh();
    }, 1200);
  },

  loadPredefined(subject, year) {
    window.Helpers?.showToast?.(`Loading ${subject} (${year})...`, 'info');
    this._selectedSubject = subject;
    this._selectedYear = year;
    this._selectedType = 'pyq';
    this.generate();
  },

  startSolving() {
    window.Helpers?.showToast?.('Launching Online Exam Mode...', 'success');
    App.navigate('setup', { preset: 'polytechnic-test' });
  },

  downloadPDF() {
    window.Helpers?.showToast?.('Downloading paper PDF...', 'info');
    window.open('/polytechnic/', '_blank');
  },

  refresh() {
    const container = document.getElementById('app');
    if (container && App.currentPage === 'polytechnic') {
      container.innerHTML = App._renderHeader('polytechnic') + this.render();
    }
  },

  afterRender() {
    // Responsive grid tweak if needed
  }
};

window.PolytechnicPage = PolytechnicPage;
