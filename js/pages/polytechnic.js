// ============================================
// POLYTECHNIC PAGE — BTEUP Sample Paper Generator v9
// Only Sample Paper generation — no PYQ/Practice options
// Paper generates instantly with real BTEUP pattern
// ============================================

const PolytechnicPage = {
  _selectedBranch: 'Mechanical Engineering',
  _selectedSemester: '3',
  _selectedSubject: '',
  _selectedMode: 'online',
  _generatedPaper: null,
  _isGenerating: false,

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
      { id: 1,  name: 'Mathematics-I',                     code: '4101' },
      { id: 2,  name: 'Applied Physics-I',                 code: '4102' },
      { id: 3,  name: 'Applied Chemistry',                 code: '4103' },
      { id: 4,  name: 'Communication Skills in English',   code: '4104' },
      { id: 5,  name: 'Engineering Drawing',               code: '4105' }
    ],
    '2': [
      { id: 6,  name: 'Applied Mathematics-II',            code: '4201' },
      { id: 7,  name: 'Applied Physics-II',                code: '4202' },
      { id: 8,  name: 'Engineering Drawing',               code: '4203' },
      { id: 9,  name: 'Computer Fundamentals',             code: '4204' }
    ],
    '3': [
      { id: 10, name: 'Applied Mathematics-III',           code: '3001' },
      { id: 11, name: 'Applied Mechanics',                 code: '3002' },
      { id: 12, name: 'Material Science',                  code: '3003' },
      { id: 13, name: 'Manufacturing Technology',          code: '3004' },
      { id: 14, name: 'Thermodynamics',                    code: '3005' }
    ],
    '4': [
      { id: 15, name: 'Strength of Materials',             code: '4001' },
      { id: 16, name: 'Thermal Engineering',               code: '4002' },
      { id: 17, name: 'Fluid Mechanics',                   code: '4003' },
      { id: 18, name: 'Theory of Machines',                code: '4004' }
    ],
    '5': [
      { id: 19, name: 'Machine Design',                    code: '5001' },
      { id: 20, name: 'CAD/CAM',                           code: '5002' },
      { id: 21, name: 'Industrial Engineering',            code: '5003' }
    ],
    '6': [
      { id: 22, name: 'Production Management',             code: '6001' },
      { id: 23, name: 'Project Work',                      code: '6002' }
    ]
  },

  // ── Question bank per subject (sample questions) ──
  _questionBank: {
    'Mathematics-I': {
      secA: [
        { q: 'Define limit of a function.', h: 'फलन की सीमा परिभाषित कीजिए।' },
        { q: 'Find dy/dx if y = sin(3x).', h: 'y = sin(3x) हो तो dy/dx ज्ञात कीजिए।' },
        { q: 'Evaluate: ∫ cos(x) dx', h: 'मान ज्ञात कीजिए: ∫ cos(x) dx' },
        { q: 'Find the derivative of y = log(x).', h: 'y = log(x) का अवकलज ज्ञात कीजिए।' },
        { q: 'State the Rolle\'s theorem.', h: 'रोले प्रमेय का कथन लिखिए।' },
        { q: 'Evaluate: lim(x→0) (sin x / x)', h: 'मान ज्ञात करें: lim(x→0) (sin x / x)' },
        { q: 'Find the order and degree of d²y/dx² + y = 0.', h: 'd²y/dx² + y = 0 की कोटि और घात बताइए।' },
        { q: 'Evaluate: ∫ x·eˣ dx', h: 'मान ज्ञात कीजिए: ∫ x·eˣ dx' },
        { q: 'Define continuity of a function at a point.', h: 'किसी बिंदु पर फलन की संतत्ता परिभाषित कीजिए।' },
        { q: 'If y = x³ + 2x, find dy/dx at x = 1.', h: 'y = x³ + 2x हो तो x = 1 पर dy/dx ज्ञात करें।' }
      ],
      secB: [
        { q: 'Differentiate y = (x² + 1)·sin(x) using product rule.', h: 'गुणनफल नियम से y = (x² + 1)·sin(x) का अवकलन कीजिए।' },
        { q: 'Evaluate: ∫₀¹ x² dx', h: 'मान ज्ञात कीजिए: ∫₀¹ x² dx' },
        { q: 'Find the maxima and minima of f(x) = x³ – 3x.', h: 'f(x) = x³ – 3x के महत्तम और न्यूनतम ज्ञात कीजिए।' },
        { q: 'Solve: dy/dx = y/x', h: 'हल कीजिए: dy/dx = y/x' },
        { q: 'Expand e^x using Maclaurin\'s series up to 4 terms.', h: 'मैक्लॉरिन श्रेणी से e^x को 4 पद तक प्रसारित कीजिए।' }
      ],
      secC: [
        { q: 'Solve the differential equation: d²y/dx² – 5(dy/dx) + 6y = 0', h: 'अवकल समीकरण हल करें: d²y/dx² – 5(dy/dx) + 6y = 0' },
        { q: 'Using integration find the area bounded by y = x², x-axis, x = 0 and x = 2.', h: 'समाकलन से y = x², x-अक्ष, x = 0 और x = 2 से घिरा क्षेत्रफल ज्ञात करें।' },
        { q: 'Find the values of A, B, C by partial fractions: (2x+3)/((x+1)(x²+1))', h: 'आंशिक भिन्न से A, B, C ज्ञात करें: (2x+3)/((x+1)(x²+1))' }
      ]
    },
    'Applied Mathematics-II': {
      secA: [
        { q: 'Define eigen values of a matrix.', h: 'आव्यूह के आइगन मान परिभाषित कीजिए।' },
        { q: 'Find the rank of a 2×2 identity matrix.', h: '2×2 इकाई आव्यूह की कोटि ज्ञात करें।' },
        { q: 'State Cayley-Hamilton theorem.', h: 'केले-हेमिल्टन प्रमेय का कथन लिखिए।' },
        { q: 'Write the formula for Fourier series coefficient aₙ.', h: 'फूरियर श्रेणी गुणांक aₙ का सूत्र लिखिए।' },
        { q: 'Define Laplace transform of f(t).', h: 'f(t) का लाप्लास रूपांतरण परिभाषित करें।' },
        { q: 'Find L{sin(at)}.', h: 'L{sin(at)} ज्ञात करें।' },
        { q: 'What is a singular matrix?', h: 'व्युत्क्रमणीय आव्यूह क्या होती है?' },
        { q: 'Evaluate the determinant of [[1,2],[3,4]].', h: '[[1,2],[3,4]] का सारणिक ज्ञात करें।' },
        { q: 'Define half-range Fourier cosine series.', h: 'अर्ध-परिसर फूरियर कोसाइन श्रेणी परिभाषित करें।' },
        { q: 'Find the inverse Laplace transform of 1/s.', h: '1/s का व्युत्क्रम लाप्लास रूपांतरण ज्ञात करें।' }
      ],
      secB: [
        { q: 'Find the eigen values and eigen vectors of [[2,1],[1,2]].', h: '[[2,1],[1,2]] के आइगन मान और आइगन सदिश ज्ञात करें।' },
        { q: 'Find the Fourier series of f(x) = x in (–π, π).', h: '(–π, π) में f(x) = x की फूरियर श्रेणी ज्ञात करें।' },
        { q: 'Solve using Laplace transform: y\' + 2y = e^(–t), y(0) = 0', h: 'लाप्लास से हल करें: y\' + 2y = e^(–t), y(0) = 0' },
        { q: 'Apply Cramer\'s rule to solve: 2x + 3y = 8, x – y = 1', h: 'क्रेमर नियम से हल: 2x + 3y = 8, x – y = 1' },
        { q: 'Find the rank of matrix [[1,2,3],[4,5,6],[7,8,9]].', h: 'आव्यूह [[1,2,3],[4,5,6],[7,8,9]] की कोटि ज्ञात करें।' }
      ],
      secC: [
        { q: 'Diagonalize the matrix [[4,1],[2,3]] and verify Cayley-Hamilton theorem.', h: 'आव्यूह [[4,1],[2,3]] को विकर्णीय करें और केले-हेमिल्टन सिद्ध करें।' },
        { q: 'Expand f(x) = x² in Fourier series in interval (0, 2π).', h: '(0, 2π) में f(x) = x² की फूरियर श्रेणी प्रसारित करें।' },
        { q: 'Solve the system 3x + 2y – z = 8, x – y + z = 2, 2x + y – 3z = 1 using matrix method.', h: 'आव्यूह विधि से हल: 3x + 2y – z = 8, x – y + z = 2, 2x + y – 3z = 1' }
      ]
    },
    'Applied Mechanics': {
      secA: [
        { q: 'State Newton\'s First Law of Motion.', h: 'न्यूटन का गति का प्रथम नियम लिखिए।' },
        { q: 'Define moment of a force.', h: 'बल का आघूर्ण परिभाषित कीजिए।' },
        { q: 'What is the unit of work done?', h: 'किए गए कार्य की SI इकाई क्या है?' },
        { q: 'State Lami\'s theorem.', h: 'लामी का प्रमेय लिखिए।' },
        { q: 'Define coefficient of friction.', h: 'घर्षण गुणांक परिभाषित करें।' },
        { q: 'What is centre of gravity?', h: 'गुरुत्व केन्द्र क्या है?' },
        { q: 'Define kinetic energy.', h: 'गतिज ऊर्जा परिभाषित करें।' },
        { q: 'What is a couple?', h: 'युग्म क्या होता है?' },
        { q: 'State the parallelogram law of forces.', h: 'बलों का समांतर चतुर्भुज नियम लिखिए।' },
        { q: 'Define angle of friction.', h: 'घर्षण कोण परिभाषित करें।' }
      ],
      secB: [
        { q: 'Two forces of 100 N and 150 N act at a point. The angle between them is 60°. Find the resultant.', h: '100 N व 150 N के बीच 60° का कोण है। परिणामी ज्ञात करें।' },
        { q: 'Find the centroid of a triangle with vertices at (0,0), (4,0) and (0,3).', h: '(0,0), (4,0) और (0,3) शीर्ष वाले त्रिभुज का केन्द्रक ज्ञात करें।' },
        { q: 'A body of mass 10 kg is placed on a rough surface with μ = 0.3. Find the force to move it.', h: '10 kg की वस्तु पर μ = 0.3 है। उसे खींचने की बल ज्ञात करें।' },
        { q: 'State and prove the Varignon\'s theorem.', h: 'वेरिग्नन का प्रमेय सिद्ध करें।' },
        { q: 'A particle moves with velocity v = 3t² + 2t. Find acceleration at t = 2 sec.', h: 'v = 3t² + 2t हो तो t = 2 पर त्वरण ज्ञात करें।' }
      ],
      secC: [
        { q: 'A beam AB of 6 m is simply supported at ends. It carries UDL of 10 kN/m over entire span. Find reactions and draw SFD and BMD.', h: '6 m का सिंपल बीम 10 kN/m UDL वहन करता है। प्रतिक्रिया, SFD और BMD बनाएं।' },
        { q: 'Derive the expression for moment of inertia of a rectangle about its centroidal axis.', h: 'आयत का उसके केन्द्रीय अक्ष के सापेक्ष जड़त्व आघूर्ण का सूत्र व्युत्पन्न करें।' },
        { q: 'A block of weight 200 N rests on an inclined plane of 30°. Find minimum force to prevent sliding. μ = 0.25.', h: '200 N का ब्लॉक 30° झुके तल पर है। फिसलने से रोकने के लिए न्यूनतम बल ज्ञात करें।' }
      ]
    },
    'default': {
      secA: [
        { q: 'Define the fundamental concept of this subject.', h: 'इस विषय की मूल अवधारणा को परिभाषित करें।' },
        { q: 'State the basic theorem related to this topic.', h: 'इस विषय से संबंधित मूल प्रमेय लिखिए।' },
        { q: 'What is the SI unit of the primary quantity?', h: 'मुख्य राशि की SI इकाई क्या है?' },
        { q: 'Write the formula for the primary relationship.', h: 'मुख्य संबंध का सूत्र लिखें।' },
        { q: 'Define the key term used in this chapter.', h: 'इस अध्याय में प्रयुक्त मुख्य शब्द परिभाषित करें।' },
        { q: 'What are the applications of this concept in engineering?', h: 'इंजीनियरिंग में इस अवधारणा के अनुप्रयोग क्या हैं?' },
        { q: 'State two properties of the system studied.', h: 'अध्ययन किए गए तंत्र के दो गुण लिखिए।' },
        { q: 'What is the difference between type A and type B?', h: 'प्रकार A और प्रकार B में क्या अंतर है?' },
        { q: 'Give one practical example of this principle.', h: 'इस सिद्धांत का एक व्यावहारिक उदाहरण दीजिए।' },
        { q: 'State the law of conservation applicable here.', h: 'यहाँ लागू संरक्षण के नियम का कथन लिखिए।' }
      ],
      secB: [
        { q: 'Derive the expression and explain with diagram.', h: 'सूत्र व्युत्पन्न करें और आरेख सहित समझाएं।' },
        { q: 'Solve the numerical problem: A = 40, B = 60, find C using the standard formula.', h: 'संख्यात्मक हल करें: A = 40, B = 60, C ज्ञात करें।' },
        { q: 'Compare and contrast the two methods with merits and demerits.', h: 'दोनों विधियों की तुलना करें — गुण और दोष।' },
        { q: 'Explain the working principle with neat sketch.', h: 'साफ चित्र सहित कार्य सिद्धांत समझाइए।' },
        { q: 'Solve: Given P = 200 units, find the required output Q.', h: 'हल करें: P = 200 इकाई दिए हैं, Q ज्ञात करें।' }
      ],
      secC: [
        { q: 'Describe the complete process step by step. Draw a labeled diagram.', h: 'चरण दर चरण पूरी प्रक्रिया वर्णित करें। नामांकित चित्र बनाएं।' },
        { q: 'A system has input X = 120 and efficiency η = 0.75. Calculate the useful output and losses.', h: 'X = 120 और η = 0.75 है। उपयोगी आउटपुट और हानि ज्ञात करें।' },
        { q: 'Derive and prove the main theorem. Apply it to a real-world problem.', h: 'मुख्य प्रमेय सिद्ध करें और वास्तविक समस्या पर लागू करें।' }
      ]
    }
  },

  render(params) {
    if (params?.branch) this._selectedBranch = params.branch === 'cs' ? 'Computer Science & Engineering' : params.branch.charAt(0).toUpperCase() + params.branch.slice(1) + ' Engineering';
    if (params?.semester) this._selectedSemester = params.semester;

    const subjects = this._subjects[this._selectedSemester] || [];
    if (subjects.length > 0 && !this._selectedSubject) {
      this._selectedSubject = subjects[0].name;
    }

    return `
      <div class="page-enter" style="max-width: 1100px; margin: 0 auto; padding: 24px 16px;">

        <!-- Header -->
        <div style="margin-bottom: 28px;">
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); margin-bottom: 10px;">
            <a href="#home" style="color: var(--primary); text-decoration: none;">Home</a>
            <span>›</span>
            <span>Polytechnic</span>
          </div>
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
            <div>
              <h1 style="font-size: 26px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px; letter-spacing:-0.02em;">📄 BTEUP Sample Paper Generator</h1>
              <p style="color: var(--text-secondary); font-size: 13.5px; margin: 0;">Select Branch, Semester & Subject — generate an authentic BTEUP pattern sample paper instantly</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.2); border-radius:100px; padding:6px 14px;">
              <span style="width:7px;height:7px;background:#10B981;border-radius:50%;display:inline-block;animation:pulse-green 1.5s ease infinite;"></span>
              <span style="font-size:12px; font-weight:600; color:#10B981;">Free · Instant · No Login</span>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start;" class="poly-grid">

          <!-- ── Left Column ── -->
          <div style="display: flex; flex-direction: column; gap: 20px;">

            <!-- Config Card -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 18px; padding: 24px;">
              <h2 style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 22px; display: flex; align-items: center; gap: 8px; letter-spacing:-0.01em;">
                ⚙️ Configure Your Paper
              </h2>

              <!-- Branch + Semester -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing:0.06em;">Branch / Course</label>
                  <select id="poly-branch-select" onchange="PolytechnicPage.onBranchChange(this.value)"
                          style="background: var(--bg-elevated); border: 1.5px solid var(--border-color); border-radius: 10px; padding: 10px 12px; color: var(--text-primary); font-size: 13px; width: 100%; outline:none; transition:border-color 0.2s;"
                          onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'">
                    ${this._branches.map(b => `<option value="${b}" ${b === this._selectedBranch ? 'selected' : ''}>${b}</option>`).join('')}
                  </select>
                </div>

                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing:0.06em;">Semester</label>
                  <select id="poly-semester-select" onchange="PolytechnicPage.onSemesterChange(this.value)"
                          style="background: var(--bg-elevated); border: 1.5px solid var(--border-color); border-radius: 10px; padding: 10px 12px; color: var(--text-primary); font-size: 13px; width: 100%; outline:none; transition:border-color 0.2s;"
                          onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'">
                    ${Object.keys(this._subjects).map(s => `<option value="${s}" ${s === this._selectedSemester ? 'selected' : ''}>Semester ${s}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- Subject -->
              <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 24px;">
                <label style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing:0.06em;">Subject</label>
                <select id="poly-subject-select" onchange="PolytechnicPage.onSubjectChange(this.value)"
                        style="background: var(--bg-elevated); border: 1.5px solid var(--border-color); border-radius: 10px; padding: 10px 12px; color: var(--text-primary); font-size: 13px; width: 100%; outline:none; transition:border-color 0.2s;"
                        onfocus="this.style.borderColor='var(--primary)'" onblur="this.style.borderColor='var(--border-color)'">
                  ${subjects.map(s => `<option value="${s.name}" ${s.name === this._selectedSubject ? 'selected' : ''}>${s.name}  (Code: ${s.code})</option>`).join('')}
                </select>
              </div>

              <!-- Paper Info Banner -->
              <div style="background:rgba(99,102,241,0.07); border:1px solid rgba(99,102,241,0.18); border-radius:12px; padding:14px 16px; margin-bottom:22px; display:flex; gap:16px; flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-secondary);">
                  <span style="font-size:16px;">📋</span> <span><b style="color:var(--text-primary);">Pattern:</b> BTEUP Official</span>
                </div>
                <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-secondary);">
                  <span style="font-size:16px;">⏱️</span> <span><b style="color:var(--text-primary);">Time:</b> 3 Hours</span>
                </div>
                <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-secondary);">
                  <span style="font-size:16px;">📊</span> <span><b style="color:var(--text-primary);">Total Marks:</b> 100</span>
                </div>
                <div style="display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--text-secondary);">
                  <span style="font-size:16px;">❓</span> <span><b style="color:var(--text-primary);">Sections:</b> A + B + C</span>
                </div>
              </div>

              <!-- Generate Button -->
              <button id="poly-gen-btn" onclick="PolytechnicPage.generate()"
                      style="background: linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%); border: none; border-radius: 12px; padding: 15px; color: white; font-weight: 700; font-size: 15px; width: 100%; cursor:pointer; display: flex; align-items: center; justify-content: center; gap: 10px; letter-spacing:-0.01em; transition:opacity 0.2s, transform 0.15s;"
                      onmouseover="this.style.opacity='0.9';this.style.transform='translateY(-1px)'" onmouseout="this.style.opacity='1';this.style.transform=''">
                <span style="font-size:18px;">🚀</span> Generate Sample Paper
              </button>
            </div>

            <!-- Generated Paper Preview -->
            <div id="poly-preview-container">
              ${this._renderWelcome()}
            </div>
          </div>

          <!-- ── Right Sidebar ── -->
          <div style="display: flex; flex-direction: column; gap: 20px;" class="poly-sidebar">

            <!-- How it works -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px;">
              <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 16px; letter-spacing:-0.01em;">📌 How It Works</h3>
              <div style="display:flex;flex-direction:column;gap:12px;">
                ${[
                  ['1', 'Select your Branch, Semester & Subject', '#4F46E5'],
                  ['2', 'Click "Generate Sample Paper"', '#10B981'],
                  ['3', 'Get instant BTEUP-pattern paper', '#F59E0B'],
                  ['4', 'Solve online or download PDF', '#EC4899']
                ].map(([n, t, c]) => `
                  <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:26px;height:26px;border-radius:50%;background:${c};color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${n}</div>
                    <span style="font-size:13px;color:var(--text-secondary);line-height:1.4;">${t}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Paper Structure -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px;">
              <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 16px;">📐 Paper Structure</h3>
              <div style="display:flex;flex-direction:column;gap:10px;">
                ${[
                  { sec:'Section A', desc:'10 Very Short Answer Questions', marks:'10 × 2 = 20 Marks', clr:'#4F46E5' },
                  { sec:'Section B', desc:'5 Short Answer Questions', marks:'5 × 8 = 40 Marks', clr:'#10B981' },
                  { sec:'Section C', desc:'3 Long Answer Questions', marks:'3 × 10 = 30 Marks', clr:'#F59E0B' },
                  { sec:'Internal', desc:'Attendance + Sessionals', marks:'10 Marks', clr:'#94A3B8' }
                ].map(s => `
                  <div style="background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:10px;padding:12px 14px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                      <span style="font-size:13px;font-weight:700;color:${s.clr};">${s.sec}</span>
                      <span style="font-size:11px;font-weight:700;color:var(--text-muted);">${s.marks}</span>
                    </div>
                    <div style="font-size:12px;color:var(--text-secondary);">${s.desc}</div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Stats -->
            <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 16px; padding: 20px;">
              <h3 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 16px;">📈 Stats</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                ${[
                  { val:'12,400+', label:'Papers Generated' },
                  { val:'7 Branches', label:'Covered' },
                  { val:'6 Sems', label:'All Semesters' },
                  { val:'100%', label:'Free Forever' }
                ].map(s => `
                  <div style="text-align:center;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:10px;padding:14px 10px;">
                    <div style="font-size:17px;font-weight:800;color:var(--primary);letter-spacing:-0.02em;">${s.val}</div>
                    <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;margin-top:3px;">${s.label}</div>
                  </div>
                `).join('')}
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  },

  _renderWelcome() {
    return `
      <div style="background:var(--bg-secondary);border:2px dashed var(--border-color);border-radius:18px;padding:48px 24px;text-align:center;">
        <div style="font-size:56px;margin-bottom:16px;">📄</div>
        <h3 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0 0 8px;">Your Sample Paper Will Appear Here</h3>
        <p style="font-size:14px;color:var(--text-secondary);margin:0 0 6px;">Select branch, semester, and subject above</p>
        <p style="font-size:13px;color:var(--text-muted);margin:0;">Then click <b style="color:var(--primary);">Generate Sample Paper</b> 🚀</p>
      </div>
    `;
  },

  _renderPreview() {
    if (!this._generatedPaper) return this._renderWelcome();
    const p = this._generatedPaper;

    const renderSection = (title, subtitle, questions, secLetter, color) => `
      <div style="margin-bottom:28px;">
        <div style="background:${color}18;border-left:4px solid ${color};border-radius:0 8px 8px 0;padding:10px 16px;margin-bottom:16px;">
          <div style="font-size:13px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:0.06em;">${title}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${subtitle}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;">
          ${questions.map((q, i) => `
            <div style="padding:14px 16px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:12px;">
              <div style="font-size:14px;color:var(--text-primary);font-weight:500;margin-bottom:5px;line-height:1.5;">
                <span style="font-weight:800;color:${color};">Q${i+1}.</span> ${q.q}
              </div>
              <div style="font-size:12px;color:var(--text-muted);font-style:italic;">${q.h}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    return `
      <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:18px;overflow:hidden;animation:fadeInUp 0.4s ease;">

        <!-- Paper Header -->
        <div style="background:linear-gradient(135deg,rgba(99,102,241,0.12) 0%,rgba(139,92,246,0.08) 100%);border-bottom:1px solid var(--border-color);padding:24px 24px 20px;">
          <div style="text-align:center;margin-bottom:16px;">
            <div style="font-size:13px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Board of Technical Education Uttar Pradesh</div>
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">राजकीय पॉलिटेक्निक · BTEUP Affiliated</div>
            <h2 style="font-size:18px;font-weight:800;color:var(--text-primary);margin:0 0 6px;letter-spacing:-0.02em;">📄 Sample Paper</h2>
            <div style="font-size:15px;font-weight:700;color:var(--primary);">${p.subject}</div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;">
            ${[
              { label:'Branch', value: p.branch.replace(' Engineering','') },
              { label:'Semester', value: p.semester },
              { label:'Max Marks', value: '100' },
              { label:'Time', value: '3 Hours' },
              { label:'Paper Type', value: 'Sample Paper' }
            ].map(item => `
              <div style="text-align:center;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:10px;padding:10px 8px;">
                <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;font-weight:700;letter-spacing:0.05em;">${item.label}</div>
                <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-top:3px;">${item.value}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Instructions -->
        <div style="padding:14px 24px;background:rgba(245,158,11,0.06);border-bottom:1px solid var(--border-color);">
          <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.7;">
            <b style="color:#D97706;">📌 Instructions:</b> All questions are compulsory. 
            Section A: attempt all 10 (2 marks each). 
            Section B: attempt any 4 out of 5 (8 marks each). 
            Section C: attempt any 2 out of 3 (10 marks each). 
            Draw diagrams wherever necessary.
          </div>
        </div>

        <!-- Questions -->
        <div style="padding:24px;">
          ${renderSection('Section A — Very Short Answer', 'Attempt all 10 questions  |  2 × 10 = 20 Marks', p.secA, 'A', '#4F46E5')}
          ${renderSection('Section B — Short Answer', 'Attempt any 4 questions  |  8 × 4 = 32 Marks (attempt 5, best 4 counted)', p.secB, 'B', '#10B981')}
          ${renderSection('Section C — Long Answer', 'Attempt any 2 questions  |  10 × 2 = 20 Marks (attempt 3, best 2 counted)', p.secC, 'C', '#F59E0B')}
        </div>

        <!-- Actions -->
        <div style="padding:0 24px 24px;display:flex;gap:12px;flex-wrap:wrap;">
          <button onclick="PolytechnicPage.startSolving()"
                  style="flex:1;min-width:140px;background:linear-gradient(135deg,var(--primary),#7C3AED);border:none;border-radius:12px;padding:13px;color:white;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.2s;"
                  onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
            💻 Solve Online
          </button>
          <button onclick="PolytechnicPage.downloadPDF()"
                  style="flex:1;min-width:140px;background:transparent;border:1.5px solid var(--border-color);border-radius:12px;padding:13px;color:var(--text-primary);font-weight:600;font-size:14px;cursor:pointer;transition:border-color 0.2s;"
                  onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
            📥 Download PDF
          </button>
          <button onclick="PolytechnicPage.generate()"
                  style="background:transparent;border:1.5px solid var(--border-color);border-radius:12px;padding:13px 18px;color:var(--text-secondary);font-weight:600;font-size:14px;cursor:pointer;transition:border-color 0.2s;"
                  onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
            🔄 Regenerate
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
    this._generatedPaper = null;
    this.refresh();
  },

  onSubjectChange(value) {
    this._selectedSubject = value;
  },

  onModeChange(value) {
    this._selectedMode = value;
    this.refresh();
  },

  generate() {
    if (this._isGenerating) return;
    this._isGenerating = true;

    // Show loading state
    const btn = document.getElementById('poly-gen-btn');
    if (btn) {
      btn.innerHTML = '<span style="font-size:18px;">⏳</span> Generating...';
      btn.style.opacity = '0.7';
      btn.disabled = true;
    }

    const previewEl = document.getElementById('poly-preview-container');
    if (previewEl) {
      previewEl.innerHTML = `
        <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:18px;padding:48px 24px;text-align:center;">
          <div style="font-size:40px;margin-bottom:16px;animation:spin 1s linear infinite;display:inline-block;">⚙️</div>
          <p style="font-size:15px;font-weight:600;color:var(--text-primary);margin:0 0 6px;">Generating your sample paper...</p>
          <p style="font-size:13px;color:var(--text-muted);margin:0;">BTEUP pattern · ${this._selectedSubject}</p>
        </div>`;
    }

    setTimeout(() => {
      const subject = this._selectedSubject;
      const bank = this._questionBank[subject] || this._questionBank['default'];

      // Shuffle helper
      const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

      this._generatedPaper = {
        title: `Sample Paper — ${subject}`,
        branch: this._selectedBranch,
        semester: `${this._selectedSemester}${['','st','nd','rd','th','th','th'][+this._selectedSemester] || 'th'} Semester`,
        marks: '100 Marks',
        subject: subject,
        secA: shuffle(bank.secA).slice(0, 10),
        secB: shuffle(bank.secB).slice(0, 5),
        secC: shuffle(bank.secC).slice(0, 3)
      };

      // Reset button
      if (btn) {
        btn.innerHTML = '<span style="font-size:18px;">🚀</span> Generate Sample Paper';
        btn.style.opacity = '1';
        btn.disabled = false;
      }

      this._isGenerating = false;
      window.Helpers?.showToast?.('✅ Sample paper generated!', 'success');

      // Update only preview
      if (previewEl) previewEl.innerHTML = this._renderPreview();
    }, 1000);
  },

  startSolving() {
    window.Helpers?.showToast?.('Launching Online Exam Mode...', 'success');
    App.navigate('setup', { preset: 'polytechnic-test' });
  },

  downloadPDF() {
    window.Helpers?.showToast?.('Preparing PDF... please wait', 'info');
    setTimeout(() => window.print(), 600);
  },

  refresh() {
    const container = document.getElementById('app');
    if (container && App.currentPage === 'polytechnic') {
      const footer = App._renderFooter ? App._renderFooter() : '';
      container.innerHTML = App._renderHeader('polytechnic') + this.render() + footer;
    }
  },

  afterRender() {
    // nothing needed
  },

  destroy() {}
};

window.PolytechnicPage = PolytechnicPage;
