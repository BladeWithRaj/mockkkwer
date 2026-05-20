(function() {
  'use strict';

  const SUBJECTS_DB = {
    semester2: [
      {
        id: 1, name: 'Mathematics-II', code: '4201', renderer: 'PATTERN_MATH', marks: 60,
        topics: ['Determinants','Matrices','Differential Calculus','Integral Calculus','Differential Equations','Coordinate Geometry','Vector Algebra'],
        profile: { style: 'symbolic', keyVerbs: ['Find','Solve','Evaluate','Prove','Derive'], repetitionExpected: true },
        pattern: [
          { part: 'Part A', type: 'Objective (MCQ + Fill + True/False)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Part B', type: 'Very Short Answer (Numericals)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Part C', type: 'Short Answer (Derivations)', attempt: 'Attempt any 8 of 10', marks: '8 × 2½ = 20' },
          { part: 'Part D', type: 'Long Answer (Full Proofs/Problems)', attempt: 'Attempt any 4 of 6', marks: '4 × 5 = 20' }
        ],
        units: [
          { no: 1, name: 'Determinants & Matrices', weight: 22 },
          { no: 2, name: 'Differential Calculus-II', weight: 20 },
          { no: 3, name: 'Integral Calculus', weight: 22 },
          { no: 4, name: 'Differential Equations', weight: 20 },
          { no: 5, name: 'Coord. Geometry & Vectors', weight: 16 }
        ]
      },
      {
        id: 2, name: 'Fundamentals of Electrical & Electronics Engg.', code: '4209', renderer: 'PATTERN_FEEE', marks: 60,
        topics: ['DC Circuits','Kirchhoff Laws','Electromagnetic Induction','AC Circuits','Transformers','Induction Motors','PN Junction','MOSFET','Logic Gates','CRO'],
        profile: { style: 'descriptive', keyVerbs: ['Explain','Differentiate','Write notes on','State and explain','Describe'], repetitionExpected: true },
        pattern: [
          { part: 'Q.1', type: 'DC Circuits & Magnetic Circuits', attempt: 'Attempt any 2 of 3', marks: '2 × 10 = 20' },
          { part: 'Q.2', type: 'AC Circuits', attempt: 'Attempt any 2 of 3', marks: '2 × 10 = 20' },
          { part: 'Q.3', type: 'Electrical Machines', attempt: 'Attempt any 2 of 3', marks: '2 × 10 = 20' },
          { part: 'Q.4', type: 'Electronic Devices', attempt: 'Attempt any 2 of 3', marks: '2 × 10 = 20' },
          { part: 'Q.5', type: 'Digital Electronics & Instruments', attempt: 'Attempt any 2 of 3', marks: '2 × 10 = 20' },
          { part: 'Q.6', type: 'Short Notes (All Units)', attempt: 'Attempt any 4 of 5', marks: '4 × 2½ = 10' }
        ],
        units: [
          { no: 1, name: 'DC & Magnetic Circuits', weight: 20 },
          { no: 2, name: 'AC Circuits', weight: 18 },
          { no: 3, name: 'Electrical Machines', weight: 22 },
          { no: 4, name: 'Electronic Devices', weight: 22 },
          { no: 5, name: 'Digital Electronics', weight: 18 }
        ]
      }
    ]
  };

  const BRANCHES = [
    'Mechanical Engineering',
    'Mechanical Engineering (Automobile)',
    'Mechanical Engineering (Production)',
    'Civil Engineering',
    'Electrical Engineering',
    'Electronics Engineering',
    'Computer Science & Engineering',
    'Information Technology'
  ];

  const MODE_INFO = {
    important:      { label: 'Important Questions', hint: 'High-frequency PYQ concepts — most likely to repeat in board exam.' },
    board_pattern:  { label: 'Board Pattern',       hint: 'Strict official BTEUP wording. Closest to actual board paper style.' },
    pyq_weighted:   { label: 'PYQ Weighted',         hint: 'Topics ranked by 6-year repetition frequency from previous papers.' },
    pass_guaranteed:{ label: 'Pass-Guaranteed',      hint: 'Easy-to-medium questions focusing on minimum passing marks.' }
  };

  let selectedLanguage = 'english';
  let selectedMode     = 'important';
  let currentSubject   = null;
  let generatedPaperData = null;

  window.addEventListener('DOMContentLoaded', () => {
    populateBranches();
    populateSemesters();
    populateSubjects();
    bindEvents();
  });

  function populateBranches() {
    const sel = document.getElementById('branchSelect');
    if (!sel) return;
    BRANCHES.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b; opt.textContent = b;
      sel.appendChild(opt);
    });
  }

  function populateSemesters() {
    const sel = document.getElementById('semesterSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="2">2nd Semester</option>';
  }

  function populateSubjects() {
    const sel = document.getElementById('subjectSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Select Subject --</option>';
    const sem = document.getElementById('semesterSelect')?.value || '2';
    (SUBJECTS_DB[`semester${sem}`] || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.code}) — ${s.marks} Marks`;
      opt.dataset.subject = JSON.stringify(s);
      sel.appendChild(opt);
    });
  }

  function bindEvents() {
    // Language radios
    document.querySelectorAll('input[name="paperLang"]').forEach(r => {
      r.addEventListener('change', function() {
        selectedLanguage = this.value;
        updateModeInfo();
      });
    });

    // Mode radios
    document.querySelectorAll('input[name="genMode"]').forEach(r => {
      r.addEventListener('change', function() {
        selectedMode = this.value;
        updateModeInfo();
      });
    });

    // Subject change
    document.getElementById('subjectSelect')?.addEventListener('change', function() {
      const opt = this.selectedOptions[0];
      currentSubject = opt?.dataset?.subject ? JSON.parse(opt.dataset.subject) : null;
      updatePreviewPanel();
      updateModeInfo();
    });

    // Semester change
    document.getElementById('semesterSelect')?.addEventListener('change', () => {
      populateSubjects();
      currentSubject = null;
      updatePreviewPanel();
    });
  }

  function updateModeInfo() {
    // Update mode info hint in preview panel if visible
    const modeEl = document.getElementById('previewModeInfo');
    if (!modeEl) return;
    const info = MODE_INFO[selectedMode];
    if (info) modeEl.innerHTML = `<strong>${info.label}:</strong> ${info.hint}`;
  }

  function updatePreviewPanel() {
    const placeholder = document.getElementById('previewPlaceholder');
    const content     = document.getElementById('previewContent');
    if (!currentSubject) {
      if (placeholder) placeholder.style.display = '';
      if (content)     content.style.display = 'none';
      return;
    }
    if (placeholder) placeholder.style.display = 'none';
    if (content)     content.style.display = '';

    const s = currentSubject;
    // Pattern table
    let patternRows = s.pattern.map(p => `
      <tr>
        <td><strong>${p.part}</strong></td>
        <td>${p.type}</td>
        <td style="font-size:10px;color:#555">${p.attempt}</td>
        <td class="marks-col">${p.marks}</td>
      </tr>`).join('');

    // Unit weightage bars
    let unitBars = s.units.map(u => `
      <div class="inst-unit-row">
        <span class="inst-unit-name">Unit ${u.no}</span>
        <div class="inst-unit-bar-wrap">
          <div class="inst-unit-bar-fill" style="width:${u.weight}%"></div>
        </div>
        <span class="inst-unit-pct">${u.weight}%</span>
      </div>`).join('');

    content.innerHTML = `
      <div class="inst-section-label" style="margin-bottom:6px">Paper Structure — ${s.name} (${s.code})</div>
      <table class="inst-pattern-table">
        <thead>
          <tr>
            <th>Part</th><th>Type</th><th>Instructions</th><th>Marks</th>
          </tr>
        </thead>
        <tbody>
          ${patternRows}
          <tr class="total-row">
            <td colspan="3">Total Marks</td>
            <td class="marks-col">${s.marks}</td>
          </tr>
        </tbody>
      </table>

      <div class="inst-section-label" style="margin-top:12px;margin-bottom:6px">Unit Weightage (PYQ Based)</div>
      ${unitBars}

      <div class="inst-mode-info" id="previewModeInfo">
        <strong>${MODE_INFO[selectedMode].label}:</strong> ${MODE_INFO[selectedMode].hint}
      </div>

      <div class="inst-subject-note">
        <strong>Generation Style:</strong>
        ${s.profile.style === 'symbolic'
          ? 'Mathematical · Symbolic · Short board-style phrasing (Find, Solve, Evaluate, Derive)'
          : 'Descriptive · Diploma-practical · Theory-based (Explain, Differentiate, Write notes)'}
      </div>`;
  }

  // ── GENERATION ──
  async function generatePaper() {
    if (!currentSubject) {
      showError('Please select a subject first.');
      return;
    }
    const branch  = document.getElementById('branchSelect')?.value || 'Mechanical Engineering';
    const genBtn  = document.getElementById('generateBtn');
    const errorEl = document.getElementById('errorMsg');
    const outputEl= document.getElementById('paperOutput');

    errorEl?.classList.remove('show');
    outputEl?.classList.remove('show');
    if (genBtn) { genBtn.disabled = true; genBtn.textContent = '⏳ Generating...'; }
    showLoadingOverlay(currentSubject);

    try {
      const response = await fetch('/api/generate-polytechnic-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: currentSubject.id,
          branch,
          language: selectedLanguage,
          mode: selectedMode
        })
      });

      if (!response.ok && !response.headers.get('content-type')?.includes('text/event-stream')) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed');
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop();
        for (const eventStr of events) {
          if (!eventStr.trim()) continue;
          let eventType = '', eventData = '';
          for (const line of eventStr.split('\n')) {
            if (line.startsWith('event: ')) eventType = line.substring(7);
            if (line.startsWith('data: '))  eventData = line.substring(6);
          }
          if (!eventType || !eventData) continue;
          try { handleSSEEvent(eventType, JSON.parse(eventData)); } catch(e) {}
        }
      }
    } catch (err) {
      hideLoadingOverlay();
      showError(err.message);
    } finally {
      if (genBtn) { genBtn.disabled = false; genBtn.textContent = '▶ Generate BTEUP Paper'; }
    }
  }
  window.generatePaper = generatePaper;

  function handleSSEEvent(type, data) {
    if (type === 'progress') updateProgress(data);
    else if (type === 'complete') {
      hideLoadingOverlay();
      if (data.success) { generatedPaperData = data; renderPaper(data); }
      else showError(data.error || 'Generation failed');
    } else if (type === 'error') {
      hideLoadingOverlay();
      showError(data.error || 'An error occurred');
    }
  }

  // ── LOADING ──
  function showLoadingOverlay(subject) {
    const overlay = document.getElementById('loadingOverlay');
    const chips   = document.getElementById('topicChips');
    if (chips && subject.topics) {
      chips.innerHTML = subject.topics.map(t => `<span class="pg-topic-chip">${t}</span>`).join('');
      startChipAnimation(chips);
    }
    const fill = document.getElementById('progressFill');
    if (fill) fill.style.width = '0%';
    const st = document.getElementById('stageText');
    if (st) st.textContent = 'Analyzing syllabus...';
    if (overlay) overlay.classList.add('active');
  }

  function hideLoadingOverlay() {
    stopChipAnimation();
    document.getElementById('loadingOverlay')?.classList.remove('active');
  }

  let chipTimer = null;
  function startChipAnimation(container) {
    stopChipAnimation();
    const chips = container.querySelectorAll('.pg-topic-chip');
    if (!chips.length) return;
    let i = 0;
    chipTimer = setInterval(() => {
      chips.forEach(c => c.classList.remove('active'));
      chips[i % chips.length].classList.add('active');
      i++;
    }, 900);
  }
  function stopChipAnimation() {
    if (chipTimer) { clearInterval(chipTimer); chipTimer = null; }
  }

  function updateProgress(data) {
    const fill = document.getElementById('progressFill');
    const st   = document.getElementById('stageText');
    const sub  = document.getElementById('stageSub');
    if (fill && data.progress != null) fill.style.width = data.progress + '%';
    if (st   && data.message)  st.textContent  = data.message;
    if (sub  && data.section)  sub.textContent = data.section;
  }

  // ── RENDERER ──
  function renderPaper(data) {
    const sheet  = document.getElementById('paperSheet');
    const output = document.getElementById('paperOutput');
    const meta   = document.getElementById('paperMeta');
    if (!sheet || !output) return;

    const isHindi = data.language === 'hindi';
    if (isHindi) sheet.classList.add('hindi-paper');
    else          sheet.classList.remove('hindi-paper');

    if (data.subject?.renderer_type === 'PATTERN_MATH') {
      sheet.innerHTML = renderMathPaper(data.subject, data.branch, data.sections, data.language);
    } else if (data.subject?.renderer_type === 'PATTERN_FEEE') {
      sheet.innerHTML = renderFEEEPaper(data.subject, data.branch, data.sections, data.language);
    }

    if (meta) {
      const modeLabel = MODE_INFO[data.mode || selectedMode]?.label || '';
      meta.textContent = `Mode: ${modeLabel} · ${data.language === 'hindi' ? 'Hindi' : 'English'} · ${new Date().toLocaleDateString('en-IN')}`;
    }

    output.classList.add('show');
    output.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function getHdrNotes(lang) {
    if (lang === 'hindi') return `
      <div class="bteup-notes">
        <p><strong>नोट :</strong></p>
        <p>(i) सभी प्रश्न अनिवार्य हैं।</p>
        <p>(ii) प्रत्येक भाग के साथ दिए गए निर्देशों का पालन करें।</p>
        <p>(iii) परीक्षार्थी मोबाइल फोन व पेजर का प्रयोग न करें।</p>
      </div>`;
    return `
      <div class="bteup-notes">
        <p><strong>Notes :</strong></p>
        <p>(i) Attempt all questions. All questions carry equal marks unless stated otherwise.</p>
        <p>(ii) Use of Pager and Mobile Phone by students is not allowed in the examination hall.</p>
        <p>(iii) Attempt all parts of each question at one place.</p>
      </div>`;
  }

  function getPaperHeader(subject, branch, lang) {
    const minMarks = Math.ceil((subject.marks_total || 60) * 0.283);
    return `
      <div class="bteup-paper-frame">
      <div class="bteup-hdr">
        <div class="bteup-hdr-top-row">
          <div class="bteup-hdr-code">Code No. : ${subject.code}</div>
          <div class="bteup-hdr-roll">Roll No. : ___________</div>
        </div>
        <div class="bteup-hdr-board">BOARD OF TECHNICAL EDUCATION UTTAR PRADESH, LUCKNOW</div>
        <div class="bteup-hdr-subject">${esc(subject.name)}</div>
        <table class="bteup-hdr-meta-table">
          <tr>
            <td>Branch : ${esc(branch)}</td>
            <td>Semester : ${subject.semester || 2}nd</td>
          </tr>
          <tr>
            <td>Time Allowed : 3:00 Hours</td>
            <td>Maximum Marks : ${subject.marks_total || 60}</td>
          </tr>
          <tr>
            <td></td>
            <td>Minimum Marks : ${minMarks}</td>
          </tr>
        </table>
      </div>
      ${getHdrNotes(lang)}`;
  }

  function renderMathPaper(subject, branch, sections, lang) {
    const isHindi = lang === 'hindi';

    function renderQ(q, num) {
      const text = isHindi ? (q.hi || q.en) : q.en;
      let html = `<li><span class="q-num">${num}.</span><span class="q-body">${esc(text)}`;
      if (q.type === 'mcq' && q.options) {
        html += `<div class="q-options">`;
        q.options.forEach((o, i) => {
          html += `<span>(${String.fromCharCode(97+i)}) ${esc(o)}</span>`;
        });
        html += `</div>`;
      }
      html += `</span></li>`;
      return html;
    }

    const pA = sections.partA?.questions || [];
    const pB = sections.partB?.questions || [];
    const pC = sections.partC?.questions || [];
    const pD = sections.partD?.questions || [];

    return getPaperHeader(subject, branch, lang) + `
      <div class="bteup-part-header">PART – A (Objective Type Questions)</div>
      <div class="bteup-part-meta">
        <span>${isHindi ? 'सभी प्रश्न कीजिए।' : 'Attempt all questions.'}</span>
        <span>10 × 1 = 10</span>
      </div>
      <ol class="bteup-questions">${pA.map((q,i) => renderQ(q,i+1)).join('')}</ol>

      <div class="bteup-pto">[ P.T.O. ]</div>

      <div class="bteup-part-header">PART – B (Very Short Answer Questions)</div>
      <div class="bteup-part-meta">
        <span>${isHindi ? 'किन्हीं पाँच प्रश्नों के उत्तर दीजिए।' : 'Attempt any five questions out of seven.'}</span>
        <span>5 × 2 = 10</span>
      </div>
      <ol class="bteup-questions">${pB.map((q,i) => renderQ(q,i+1)).join('')}</ol>

      <div class="bteup-part-header">PART – C (Short Answer Questions)</div>
      <div class="bteup-part-meta">
        <span>${isHindi ? 'किन्हीं आठ प्रश्नों के उत्तर दीजिए।' : 'Attempt any eight questions out of ten.'}</span>
        <span>8 × 2½ = 20</span>
      </div>
      <ol class="bteup-questions">${pC.map((q,i) => renderQ(q,i+1)).join('')}</ol>

      <div class="bteup-part-header">PART – D (Long Answer / Numerical Questions)</div>
      <div class="bteup-part-meta">
        <span>${isHindi ? 'किन्हीं चार प्रश्नों के उत्तर दीजिए।' : 'Attempt any four questions out of six.'}</span>
        <span>4 × 5 = 20</span>
      </div>
      <ol class="bteup-questions">${pD.map((q,i) => renderQ(q,i+1)).join('')}</ol>

      <div class="bteup-footer">
        <span class="bteup-page-num">(2)</span>
        <span>— × —</span>
        <span></span>
      </div>
      </div>`;
  }

  function renderFEEEPaper(subject, branch, sections, lang) {
    const isHindi = lang === 'hindi';
    const unitNames = [
      'DC Circuits & Magnetic Circuits',
      'AC Circuits',
      'Electrical Machines',
      'Electronic Devices',
      'Digital Electronics & Instruments'
    ];
    const unitNamesHi = [
      'DC परिपथ एवं चुम्बकीय परिपथ',
      'AC परिपथ',
      'विद्युत मशीनें',
      'इलेक्ट्रॉनिक युक्तियाँ',
      'डिजिटल इलेक्ट्रॉनिक्स एवं उपकरण'
    ];

    let questionsHTML = '';
    for (let i = 1; i <= 5; i++) {
      const parts = sections[`q${i}`]?.parts || [];
      const uName = isHindi ? unitNamesHi[i-1] : unitNames[i-1];
      questionsHTML += `
        <div class="bteup-q-block">
          <div class="bteup-q-header">Q.${i} &nbsp; ${esc(uName)}</div>
          <div class="bteup-q-instruction">${isHindi ? 'निम्न में से कोई दो प्रश्न हल कीजिए : (2 × 10 = 20 अंक)' : 'Attempt any TWO of the following : (2 × 10 = 20 Marks)'}</div>
          <ol class="bteup-q-parts">${parts.map((p,j) => {
            const text = isHindi ? (p.hi || p.en) : p.en;
            return `<li><span class="q-label">(${String.fromCharCode(97+j)})</span><span class="q-body">${esc(text)}</span><span class="q-marks">[${p.marks||10} M]</span></li>`;
          }).join('')}</ol>
        </div>`;
    }

    const notes = sections.q6?.notes || [];
    questionsHTML += `
      <div class="bteup-q-block">
        <div class="bteup-q-header">Q.6 &nbsp; ${isHindi ? 'लघु टिप्पणी' : 'Short Notes'}</div>
        <div class="bteup-q-instruction">${isHindi ? 'निम्न में से कोई चार पर लघु टिप्पणी लिखिए : (4 × 2½ = 10 अंक)' : 'Write short notes on any FOUR of the following : (4 × 2½ = 10 Marks)'}</div>
        <ol class="bteup-q-parts">${notes.map((n,j) => {
          const text = isHindi ? (n.hi || n.en) : n.en;
          return `<li><span class="q-label">(${String.fromCharCode(97+j)})</span><span class="q-body">${esc(text)}</span></li>`;
        }).join('')}</ol>
      </div>`;

    return getPaperHeader(subject, branch, lang) + questionsHTML + `
      <div class="bteup-footer">
        <span class="bteup-page-num">(2)</span>
        <span>— × —</span>
        <span></span>
      </div>
      </div>`;
  }

  // ── UTILITY ──
  function showError(msg) {
    const el = document.getElementById('errorMsg');
    const tx = document.getElementById('errorText');
    if (el && tx) { tx.textContent = msg; el.classList.add('show'); }
  }

  window.printPaper   = () => window.print();
  window.copyPaper    = () => {
    const text = document.getElementById('paperSheet')?.innerText || '';
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.querySelector('.pg-output-actions button:nth-child(2)');
      if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => btn.textContent = '📋 Copy Text', 2000); }
    });
  };
  window.generateAnother = () => {
    document.getElementById('paperOutput')?.classList.remove('show');
    document.getElementById('formPanel')?.scrollIntoView({ behavior: 'smooth' });
  };
})();
