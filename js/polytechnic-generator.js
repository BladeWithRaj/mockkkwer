// ═══════════════════════════════════════════════════════════════
// BTEUP POLYTECHNIC PAPER GENERATOR — Frontend Engine
// Handles: Subject selection, SSE streaming, progress overlay,
//          topic chip animations, and bilingual paper rendering
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  // ═══════════════════════════════════
  // SUBJECT DATABASE (Client-side)
  // ═══════════════════════════════════
  const SUBJECTS_DB = {
    semester2: [
      { id: 1, name: 'Mathematics-II', code: '4201', renderer: 'PATTERN_MATH', marks: 60, topics: ['Determinants', 'Matrices', 'Differential Calculus', 'Integral Calculus', 'Differential Equations', 'Coordinate Geometry', 'Vector Algebra', 'Beta & Gamma Functions', 'Numerical Integration'] },
      { id: 2, name: 'Fundamentals of Electrical & Electronics Engg.', code: '4209', renderer: 'PATTERN_FEEE', marks: 60, topics: ['DC Circuits', 'Kirchhoff Laws', 'Electromagnetic Induction', 'AC Circuits', 'Transformers', 'Induction Motors', 'PN Junction', 'MOSFET', 'Logic Gates', 'CRO', 'Wattmeter'] }
    ]
  };

  const BRANCHES = [
    'Mechanical Engineering',
    'Mechanical Engineering (Automobile)',
    'Mechanical Engineering (Production)',
    'Civil Engineering',
    'Electrical Engineering'
  ];

  // ═══════════════════════════════════
  // STATE
  // ═══════════════════════════════════
  let selectedLanguage = 'bilingual';
  let currentSubject = null;
  let generatedPaperData = null;

  // ═══════════════════════════════════
  // INIT
  // ═══════════════════════════════════
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
      opt.value = b;
      opt.textContent = b;
      sel.appendChild(opt);
    });
  }

  function populateSemesters() {
    const sel = document.getElementById('semesterSelect');
    if (!sel) return;
    // Only semester 2 for now
    sel.innerHTML = '<option value="2">2nd Semester</option>';
  }

  function populateSubjects() {
    const sel = document.getElementById('subjectSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select Subject...</option>';
    const semester = document.getElementById('semesterSelect')?.value || '2';
    const subjects = SUBJECTS_DB[`semester${semester}`] || [];
    subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.code}) — ${s.marks} Marks`;
      opt.dataset.subject = JSON.stringify(s);
      sel.appendChild(opt);
    });
  }

  function bindEvents() {
    // Language toggle
    document.querySelectorAll('.pg-lang-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.pg-lang-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedLanguage = this.dataset.lang;
        const hint = document.getElementById('langHint');
        if (hint) {
          const labels = { english: 'Paper in English', hindi: 'पेपर हिन्दी में', bilingual: 'Bilingual — English + Hindi' };
          hint.textContent = labels[selectedLanguage] || '';
        }
      });
    });

    // Subject change
    const subjectSel = document.getElementById('subjectSelect');
    if (subjectSel) {
      subjectSel.addEventListener('change', function() {
        const opt = this.selectedOptions[0];
        currentSubject = opt?.dataset?.subject ? JSON.parse(opt.dataset.subject) : null;
        updateSubjectInfo();
      });
    }

    // Semester change
    const semSel = document.getElementById('semesterSelect');
    if (semSel) {
      semSel.addEventListener('change', () => {
        populateSubjects();
        currentSubject = null;
        updateSubjectInfo();
      });
    }

    // Generate button
    const genBtn = document.getElementById('generateBtn');
    if (genBtn) {
      genBtn.addEventListener('click', () => generatePaper());
    }
  }

  function updateSubjectInfo() {
    const infoEl = document.getElementById('subjectInfo');
    if (!infoEl) return;
    if (!currentSubject) {
      infoEl.style.display = 'none';
      return;
    }
    infoEl.style.display = 'block';
    const patternLabel = currentSubject.renderer === 'PATTERN_MATH'
      ? 'Part A-B-C-D (Objective + Short + Long)'
      : 'Q1-Q6 (Long Answer + Short Notes)';
    infoEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:0.82rem;color:var(--text-dim);padding:10px 14px;background:var(--surface2);border-radius:8px;margin-top:12px">
        <span>📋 Pattern: ${patternLabel}</span>
        <span>📝 ${currentSubject.marks} Marks</span>
      </div>`;
  }


  // ═══════════════════════════════════
  // PAPER GENERATION (SSE Streaming)
  // ═══════════════════════════════════
  async function generatePaper() {
    if (!currentSubject) {
      showError('Please select a subject first.');
      return;
    }

    const branch = document.getElementById('branchSelect')?.value || 'Mechanical Engineering';
    const genBtn = document.getElementById('generateBtn');
    const overlay = document.getElementById('loadingOverlay');
    const errorEl = document.getElementById('errorMsg');
    const outputEl = document.getElementById('paperOutput');

    // Reset UI
    errorEl?.classList.remove('show');
    outputEl?.classList.remove('show');
    if (genBtn) { genBtn.disabled = true; genBtn.textContent = '⏳ Generating...'; }

    // Show loading overlay with topic chips
    showLoadingOverlay(currentSubject);

    try {
      const response = await fetch('/api/generate-polytechnic-paper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: currentSubject.id,
          branch: branch,
          language: selectedLanguage
        })
      });

      if (!response.ok && !response.headers.get('content-type')?.includes('text/event-stream')) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed');
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events
        const events = buffer.split('\n\n');
        buffer = events.pop(); // Keep incomplete event in buffer

        for (const eventStr of events) {
          if (!eventStr.trim()) continue;

          const lines = eventStr.split('\n');
          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) eventType = line.substring(7);
            if (line.startsWith('data: ')) eventData = line.substring(6);
          }

          if (!eventType || !eventData) continue;

          try {
            const data = JSON.parse(eventData);
            handleSSEEvent(eventType, data);
          } catch (e) {
            console.warn('[SSE] Parse error:', e, eventData);
          }
        }
      }

    } catch (err) {
      hideLoadingOverlay();
      showError(err.message);
    } finally {
      if (genBtn) { genBtn.disabled = false; genBtn.textContent = '⚡ Generate BTEUP Paper'; }
    }
  }

  // Make it globally accessible
  window.generatePaper = generatePaper;

  function handleSSEEvent(type, data) {
    switch (type) {
      case 'progress':
        updateProgress(data);
        break;
      case 'complete':
        hideLoadingOverlay();
        if (data.success) {
          generatedPaperData = data;
          renderPaper(data);
        } else {
          showError(data.error || 'Generation failed');
        }
        break;
      case 'error':
        hideLoadingOverlay();
        showError(data.error || 'An error occurred');
        break;
    }
  }


  // ═══════════════════════════════════
  // LOADING OVERLAY
  // ═══════════════════════════════════
  function showLoadingOverlay(subject) {
    const overlay = document.getElementById('loadingOverlay');
    if (!overlay) return;

    // Populate topic chips
    const chipsContainer = overlay.querySelector('.pg-topic-chips');
    if (chipsContainer && subject.topics) {
      chipsContainer.innerHTML = subject.topics.map(t =>
        `<span class="pg-topic-chip">${t}</span>`
      ).join('');
      // Start rotating chip highlights
      startChipAnimation(chipsContainer);
    }

    // Reset progress
    const fill = overlay.querySelector('.pg-progress-fill');
    if (fill) fill.style.width = '0%';
    const stageText = overlay.querySelector('.pg-stage-text');
    if (stageText) stageText.textContent = 'Initializing...';

    overlay.classList.add('active');
  }

  function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      stopChipAnimation();
    }
  }

  let chipAnimInterval = null;
  function startChipAnimation(container) {
    stopChipAnimation();
    const chips = container.querySelectorAll('.pg-topic-chip');
    if (!chips.length) return;
    let idx = 0;
    chipAnimInterval = setInterval(() => {
      chips.forEach(c => c.classList.remove('active'));
      chips[idx % chips.length].classList.add('active');
      idx++;
    }, 800);
  }
  function stopChipAnimation() {
    if (chipAnimInterval) { clearInterval(chipAnimInterval); chipAnimInterval = null; }
  }

  function updateProgress(data) {
    const fill = document.querySelector('.pg-progress-fill');
    const stageText = document.querySelector('.pg-stage-text');
    const stageSub = document.querySelector('.pg-stage-sub');

    if (fill && data.progress != null) fill.style.width = data.progress + '%';
    if (stageText && data.message) {
      stageText.style.opacity = '0';
      setTimeout(() => {
        stageText.textContent = data.message;
        stageText.style.opacity = '1';
      }, 150);
    }
    if (stageSub && data.section) stageSub.textContent = data.section;
  }


  // ═══════════════════════════════════
  // PAPER RENDERER
  // ═══════════════════════════════════
  function renderPaper(data) {
    const sheet = document.getElementById('paperSheet');
    const output = document.getElementById('paperOutput');
    if (!sheet || !output) return;

    const subject = data.subject;
    const branch = data.branch;
    const sections = data.sections;
    const lang = data.language;

    if (subject.renderer_type === 'PATTERN_MATH') {
      sheet.innerHTML = renderMathPaper(subject, branch, sections, lang);
    } else if (subject.renderer_type === 'PATTERN_FEEE') {
      sheet.innerHTML = renderFEEEPaper(subject, branch, sections, lang);
    }

    output.classList.add('show');
    output.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function esc(s) {
    if (!s) return '';
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── MATH PAPER RENDERER ──
  function renderMathPaper(subject, branch, sections, lang) {
    const showHi = lang === 'hindi' || lang === 'bilingual';
    const showEn = lang === 'english' || lang === 'bilingual';

    function renderQ(q, num) {
      let html = `<li><span class="q-num">${num}.</span>`;
      if (showEn) html += esc(q.en);
      if (showHi && q.hi) html += `<span class="q-hi">${esc(q.hi)}</span>`;
      if (q.type === 'mcq' && q.options) {
        html += '<span class="q-options">';
        q.options.forEach((o, i) => {
          html += `<span>(${String.fromCharCode(97 + i)}) ${esc(o)}</span>`;
        });
        html += '</span>';
      }
      html += '</li>';
      return html;
    }

    const partA = sections.partA?.questions || [];
    const partB = sections.partB?.questions || [];
    const partC = sections.partC?.questions || [];
    const partD = sections.partD?.questions || [];

    return `
      <div class="bteup-hdr">
        <div class="bteup-hdr-code">Code No.: ${subject.code}</div>
        <div class="bteup-hdr-board">BOARD OF TECHNICAL EDUCATION UTTAR PRADESH, LUCKNOW</div>
        <div class="bteup-hdr-subject">${subject.name}</div>
        <div class="bteup-hdr-meta">
          <span>Branch: ${branch}</span>
          <span>Semester: ${subject.semester}nd</span>
        </div>
        <div class="bteup-hdr-meta-row">
          <span>Time Allowed : 3:00 Hours</span>
          <span>Maximum Marks : ${subject.marks_total}</span>
        </div>
        <div class="bteup-hdr-meta-row">
          <span></span>
          <span>Minimum Marks : ${Math.ceil(subject.marks_total * 0.283)}</span>
        </div>
      </div>

      <div class="bteup-notes">
        <p><strong>Notes:</strong></p>
        <p>(i) Attempt All questions. All questions carry equal marks unless stated otherwise.</p>
        <p>(ii) Students are advised to specially check the numerical data of question paper in both versions.</p>
        <p>(iii) Use of Pager and Mobile Phone by students is not allowed.</p>
      </div>

      <div class="bteup-part-header">PART – A (Objective Type Questions)</div>
      <div class="bteup-part-instruction">Attempt all questions.</div>
      <div class="bteup-part-marks">10 × 1 = 10</div>
      <ol class="bteup-questions">${partA.map((q, i) => renderQ(q, i + 1)).join('')}</ol>

      <div class="bteup-part-header">PART – B (Very Short Answer Questions)</div>
      <div class="bteup-part-instruction">Attempt any five questions out of seven.</div>
      <div class="bteup-part-marks">5 × 2 = 10</div>
      <ol class="bteup-questions">${partB.map((q, i) => renderQ(q, i + 1)).join('')}</ol>

      <div class="bteup-part-header">PART – C (Short Answer Questions)</div>
      <div class="bteup-part-instruction">Attempt any eight questions out of ten.</div>
      <div class="bteup-part-marks">8 × 2½ = 20</div>
      <ol class="bteup-questions">${partC.map((q, i) => renderQ(q, i + 1)).join('')}</ol>

      <div class="bteup-part-header">PART – D (Long Answer / Numerical Questions)</div>
      <div class="bteup-part-instruction">Attempt any four questions out of six.</div>
      <div class="bteup-part-marks">4 × 5 = 20</div>
      <ol class="bteup-questions">${partD.map((q, i) => renderQ(q, i + 1)).join('')}</ol>

      <div class="bteup-footer">— × —</div>
    `;
  }

  // ── FEEE PAPER RENDERER ──
  function renderFEEEPaper(subject, branch, sections, lang) {
    const showHi = lang === 'hindi' || lang === 'bilingual';
    const showEn = lang === 'english' || lang === 'bilingual';
    const unitNames = ['DC Circuits & Magnetic Circuits', 'AC Circuits', 'Electrical Machines', 'Electronic Devices', 'Digital Electronics & Instruments'];

    let questionsHTML = '';

    // Q1-Q5
    for (let i = 1; i <= 5; i++) {
      const qData = sections[`q${i}`];
      const parts = qData?.parts || [];
      questionsHTML += `
        <div class="bteup-q-block">
          <div class="bteup-q-header">Q.${i} — ${unitNames[i - 1]}</div>
          <div class="bteup-q-instruction">Attempt any TWO of the following: (2 × 10 = 20 marks)</div>
          <ol class="bteup-q-parts">
            ${parts.map((p, j) => {
              let html = `<li><span class="q-label">(${String.fromCharCode(97 + j)})</span>`;
              if (showEn) html += esc(p.en);
              if (showHi && p.hi) html += `<span class="q-hi">${esc(p.hi)}</span>`;
              html += `<span style="font-size:11px;color:#666;margin-left:4px">[${p.marks || 10} Marks]</span>`;
              html += '</li>';
              return html;
            }).join('')}
          </ol>
        </div>
      `;
    }

    // Q6 — Short Notes
    const notes = sections.q6?.notes || [];
    questionsHTML += `
      <div class="bteup-q-block">
        <div class="bteup-q-header">Q.6 — Short Notes</div>
        <div class="bteup-q-instruction">Write short notes on any FOUR of the following: (4 × 2.5 = 10 marks)</div>
        <ol class="bteup-q-parts">
          ${notes.map((n, j) => {
            let html = `<li><span class="q-label">(${String.fromCharCode(97 + j)})</span>`;
            if (showEn) html += esc(n.en);
            if (showHi && n.hi) html += `<span class="q-hi">${esc(n.hi)}</span>`;
            html += '</li>';
            return html;
          }).join('')}
        </ol>
      </div>
    `;

    return `
      <div class="bteup-hdr">
        <div class="bteup-hdr-code">Code No.: ${subject.code}</div>
        <div class="bteup-hdr-board">BOARD OF TECHNICAL EDUCATION UTTAR PRADESH, LUCKNOW</div>
        <div class="bteup-hdr-subject">${subject.name}</div>
        <div class="bteup-hdr-meta">
          <span>Branch: ${branch}</span>
          <span>Semester: ${subject.semester}nd</span>
        </div>
        <div class="bteup-hdr-meta-row">
          <span>Time Allowed : 3:00 Hours</span>
          <span>Maximum Marks : ${subject.marks_total}</span>
        </div>
        <div class="bteup-hdr-meta-row">
          <span></span>
          <span>Minimum Marks : ${Math.ceil(subject.marks_total * 0.283)}</span>
        </div>
      </div>

      <div class="bteup-notes">
        <p><strong>Notes:</strong></p>
        <p>(i) Attempt all questions as per instructions given with each question.</p>
        <p>(ii) Students are advised to specially check the numerical data of question paper in both versions.</p>
        <p>(iii) Use of Pager and Mobile Phone by students is not allowed.</p>
      </div>

      ${questionsHTML}

      <div class="bteup-footer">— × —</div>
    `;
  }


  // ═══════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════
  function showError(msg) {
    const el = document.getElementById('errorMsg');
    const textEl = document.getElementById('errorText');
    if (el && textEl) {
      textEl.textContent = msg;
      el.classList.add('show');
    }
  }

  // Global functions for button onclick handlers
  window.printPaper = function() { window.print(); };
  window.copyPaper = function() {
    const text = document.getElementById('paperSheet')?.innerText || '';
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.querySelector('.pg-output-actions .btn-copy');
      if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => btn.textContent = '📋 Copy Text', 2000); }
    });
  };
  window.generateAnother = function() {
    document.getElementById('paperOutput')?.classList.remove('show');
    document.querySelector('.pg-card')?.scrollIntoView({ behavior: 'smooth' });
  };

})();
