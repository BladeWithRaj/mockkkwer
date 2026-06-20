// ============================================
// ADMIN CONSOLE — Questions & Import
// ============================================

window.AdminQuestions = {
  labels: ['A', 'B', 'C', 'D'],

  async renderList(el) {
    const params = new URLSearchParams({ 
      action: 'questions', 
      page: AdminCore.qPage, 
      search: AdminCore.qSearch 
    });
    if (AdminCore.qSubject) params.set('subject', AdminCore.qSubject);
    
    try {
      const r = await fetch(`/api/admin-data?${params}`, { 
        headers: { 'Authorization': 'Bearer ' + AdminCore.token } 
      });
      if (r.status === 401) {
        console.warn('Backend returned 401, ignored in no-login mode.');
        // window.location.href = '/secure-admin-login/';
        // return;
      }
      const d = await r.json();
      if (!d.success) throw new Error(d.error);

      el.innerHTML = `
        <div class="toolbar">
          <input type="text" placeholder="Search questions..." value="${AdminCore.qSearch}" id="qSearch" class="tool-input" 
            onkeydown="if(event.key==='Enter'){ AdminCore.qSearch=this.value; AdminCore.qPage=1; AdminCore.loadTab('questions'); }">
          <select class="tool-select" onchange="AdminCore.qSubject=this.value; AdminCore.qPage=1; AdminCore.loadTab('questions')">
            <option value="">All Subjects</option>
            ${['math','gk','reasoning','english','hindi','science','polity','geography','history'].map(s => `
              <option value="${s}" ${AdminCore.qSubject === s ? 'selected' : ''}>${s}</option>
            `).join('')}
          </select>
          <button class="tool-btn" onclick="AdminCore.qSearch=document.getElementById('qSearch').value; AdminCore.qPage=1; AdminCore.loadTab('questions')">Search</button>
        </div>
        
        <div class="sec-card">
          <div class="sec-title">📋 Questions (${d.total} total — Page ${d.page}/${d.totalPages || 1})</div>
          ${d.questions.length === 0 ? '<div class="empty">No questions found</div>' :
            d.questions.map(q => `
              <div class="q-row">
                <div class="q-body">
                  <div class="q-text">${q.question_en || '-'}</div>
                  ${q.question_hi ? `<div class="q-hi">${q.question_hi}</div>` : ''}
                  <div class="q-options">
                    ${(q.options_en || []).map((o, i) => `
                      <span class="q-opt ${i === q.correct_index ? 'correct' : ''}">${this.labels[i]}. ${o}</span>
                    `).join('')}
                  </div>
                  <div class="q-meta">
                    <span class="chip-s chip-subj">${q.subject || 'general'}</span>
                    <span class="chip-s chip-diff-${q.difficulty || 'medium'}">${q.difficulty || 'medium'}</span>
                    ${q.board ? `<span class="chip-s chip-board">${q.board}</span>` : ''}
                    ${q.topic ? `<span class="chip-s chip-topic">${q.topic}</span>` : ''}
                    ${q.year ? `<span class="chip-s chip-year">${q.year}</span>` : ''}
                    <span class="q-id">ID: ${q.id}</span>
                  </div>
                </div>
                <div class="q-actions">
                  <button class="act-btn" onclick="window.AdminQuestions.edit(${q.id})" title="Edit">✏️</button>
                  <button class="act-btn danger" onclick="window.AdminQuestions.delete(${q.id})" title="Delete">🗑️</button>
                </div>
              </div>
            `).join('')}
        </div>
        
        <div class="paginator">
          <button ${AdminCore.qPage <= 1 ? 'disabled' : ''} onclick="AdminCore.qPage--; AdminCore.loadTab('questions')">← Prev</button>
          <span class="page-info">Page ${d.page} / ${d.totalPages || 1}</span>
          <button ${AdminCore.qPage >= d.totalPages ? 'disabled' : ''} onclick="AdminCore.qPage++; AdminCore.loadTab('questions')">Next →</button>
        </div>
      `;
    } catch (e) {
      AdminCore.showToast(e.message, 'error');
    }
  },

  async delete(id) {
    if (!confirm('Delete this question permanently?')) return;
    try {
      await AdminCore.api('delete-question', { id });
      AdminCore.showToast('Question deleted', 'success');
      AdminCore.loadTab('questions');
    } catch(e) { 
      AdminCore.showToast(e.message, 'error'); 
    }
  },

  async edit(id) {
    const el = document.getElementById('adminContent');
    el.innerHTML = '<div class="loading"><span class="guard-spin"></span> Loading question...</div>';
    try {
      const r = await fetch(`/api/admin-data?action=questions&search=&page=1`, { 
        headers: { 'Authorization': 'Bearer ' + AdminCore.token } 
      });
      const d = await r.json();
      const q = (d.questions || []).find(x => x.id === id);
      if (!q) { 
        AdminCore.showToast('Question not found', 'error'); 
        return AdminCore.switchTab('questions'); 
      }
      this.renderAdd(el, q);
    } catch(e) {
      AdminCore.showToast(e.message, 'error');
    }
  },

  renderAdd(el, editData = null) {
    const q = editData || { 
      question_en:'', question_hi:'', 
      options_en:['','','',''], options_hi:['','','',''], 
      correct_index:0, subject:'math', difficulty:'medium', 
      board:'', topic:'', year:'', exam:'', source:'', marks:'' 
    };
    const isEdit = !!editData;

    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">${isEdit ? '✏️ Edit Question #'+q.id : '➕ Add New Question'}</div>
        <form id="questionForm" onsubmit="return false;">
          <div class="form-grid">
            <div class="form-group full">
              <label>Question (English) *</label>
              <textarea id="f_qen" rows="3" required>${q.question_en || ''}</textarea>
            </div>
            <div class="form-group full">
              <label>Question (Hindi)</label>
              <textarea id="f_qhi" rows="3">${q.question_hi || ''}</textarea>
            </div>
            <div class="form-group full">
              <label>Options (English) *</label>
              <div class="opts-grid">
                ${(q.options_en || ['','','','']).map((o, i) => `
                  <div class="opt-row">
                    <span class="opt-label">${this.labels[i]}</span>
                    <input type="text" id="f_oen${i}" value="${o}" placeholder="Option ${this.labels[i]}" required>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="form-group full">
              <label>Options (Hindi)</label>
              <div class="opts-grid">
                ${(q.options_hi || ['','','','']).map((o, i) => `
                  <div class="opt-row">
                    <span class="opt-label">${this.labels[i]}</span>
                    <input type="text" id="f_ohi${i}" value="${o || ''}" placeholder="विकल्प ${this.labels[i]}">
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="form-group">
              <label>Correct Answer *</label>
              <div class="correct-btns" id="correctBtns">
                ${this.labels.map((l, i) => `
                  <button type="button" class="cor-btn ${q.correct_index === i ? 'active' : ''}" 
                    onclick="window.AdminQuestions.setCorrect(${i})">${l}</button>
                `).join('')}
              </div>
            </div>
            <div class="form-group">
              <label>Subject *</label>
              <select id="f_subject">
                ${['math','gk','reasoning','english','hindi','science','polity','geography','history'].map(s => `
                  <option value="${s}" ${q.subject === s ? 'selected' : ''}>${s}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>Difficulty</label>
              <select id="f_diff">
                ${['easy','medium','hard'].map(d => `
                  <option value="${d}" ${q.difficulty === d ? 'selected' : ''}>${d}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group"><label>Board</label><input type="text" id="f_board" value="${q.board || ''}" placeholder="SSC, Railway..."></div>
            <div class="form-group"><label>Exam</label><input type="text" id="f_exam" value="${q.exam || ''}" placeholder="CGL, NTPC..."></div>
            <div class="form-group"><label>Topic</label><input type="text" id="f_topic" value="${q.topic || ''}" placeholder="Algebra, Polity..."></div>
            <div class="form-group"><label>Year (PYQ)</label><input type="text" id="f_year" value="${q.year || ''}" placeholder="2023"></div>
            <div class="form-group"><label>Source</label><input type="text" id="f_source" value="${q.source || ''}" placeholder="Official paper, Book..."></div>
            <div class="form-group"><label>Marks</label><input type="number" id="f_marks" value="${q.marks || ''}" placeholder="2" step="0.25"></div>
          </div>
          <div class="form-actions">
            <button type="button" class="save-btn" id="saveBtn" onclick="window.AdminQuestions.save(${isEdit ? q.id : 'null'})">
              ${isEdit ? '💾 Update' : '➕ Add'} Question
            </button>
            ${isEdit ? '<button type="button" class="cancel-btn" onclick="AdminCore.switchTab(\'questions\')">Cancel</button>' : ''}
          </div>
        </form>
      </div>
    `;
    window._correctIdx = q.correct_index || 0;
  },

  setCorrect(i) {
    window._correctIdx = i;
    document.querySelectorAll('.cor-btn').forEach((b, j) => {
      b.classList.toggle('active', j === i);
    });
  },

  async save(editId) {
    const btn = document.getElementById('saveBtn');
    btn.disabled = true; 
    btn.textContent = '⏳ Saving...';
    
    try {
      const payload = {
        question_en: document.getElementById('f_qen').value.trim(),
        question_hi: document.getElementById('f_qhi').value.trim() || null,
        options_en: [0, 1, 2, 3].map(i => document.getElementById(`f_oen${i}`).value.trim()),
        options_hi: [0, 1, 2, 3].map(i => document.getElementById(`f_ohi${i}`).value.trim()).filter(Boolean).length === 4
          ? [0, 1, 2, 3].map(i => document.getElementById(`f_ohi${i}`).value.trim()) : null,
        correct_index: window._correctIdx,
        subject: document.getElementById('f_subject').value,
        difficulty: document.getElementById('f_diff').value,
        board: document.getElementById('f_board').value.trim() || null,
        exam: document.getElementById('f_exam').value.trim() || null,
        topic: document.getElementById('f_topic').value.trim() || null,
        year: document.getElementById('f_year').value.trim() || null,
        source: document.getElementById('f_source').value.trim() || null,
        marks: document.getElementById('f_marks').value ? parseFloat(document.getElementById('f_marks').value) : null
      };

      if (!payload.question_en) throw new Error('Question text required');
      if (payload.options_en.some(o => !o)) throw new Error('All 4 options required');

      if (editId) {
        payload.id = editId;
        await AdminCore.api('edit-question', payload);
        AdminCore.showToast('Question updated!', 'success');
      } else {
        await AdminCore.api('create-question', payload);
        AdminCore.showToast('Question added!', 'success');
      }
      AdminCore.switchTab('questions');
    } catch(e) {
      AdminCore.showToast(e.message, 'error');
      btn.disabled = false; 
      btn.textContent = editId ? '💾 Update' : '➕ Add';
    }
  },

  renderImport(el) {
    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">📥 Bulk CSV Import</div>
        <div class="upload-zone" id="uploadZone" 
          onclick="document.getElementById('csvFile').click()"
          ondragover="event.preventDefault(); this.classList.add('hover')" 
          ondragleave="this.classList.remove('hover')"
          ondrop="event.preventDefault(); this.classList.remove('hover'); window.AdminQuestions.handleFile(event.dataTransfer.files[0])">
          <div style="font-size:40px; opacity:.5">📁</div>
          <div>Click or drag CSV file</div>
          <div class="upload-hint">question,option_a,option_b,option_c,option_d,correct,subject,difficulty,board,topic,year</div>
          <input type="file" id="csvFile" accept=".csv" style="display:none" onchange="window.AdminQuestions.handleFile(this.files[0])">
        </div>
        <button class="tool-btn" style="margin-top:12px" onclick="window.AdminQuestions.downloadTemplate()">📄 Download CSV Template</button>
      </div>
      <div id="importPreview"></div>
    `;
  },

  downloadTemplate() {
    const csv = 'question,option_a,option_b,option_c,option_d,correct,subject,difficulty,board,exam,topic,year,source\n"What is 2+2?","3","4","5","6","B","math","easy","SSC","CGL","Arithmetic","2023","PYQ"';
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(blob); 
    a.download = 'question_template.csv'; 
    a.click();
  },

  handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) {
      return AdminCore.showToast('CSV file required', 'error');
    }
    const reader = new FileReader();
    reader.onload = (e) => this.parseCSV(e.target.result);
    reader.readAsText(file);
  },

  parseCSVLine(line) {
    const result = []; 
    let current = '', inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  },

  parseCSV(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return AdminCore.showToast('CSV has no data rows', 'error');
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
    const correctMap = { a:0, b:1, c:2, d:3 };
    const questions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = this.parseCSVLine(lines[i]);
      const get = (name) => { const idx = headers.indexOf(name); return idx >= 0 ? vals[idx] : ''; };
      
      const q = get('question'), oa = get('option_a'), ob = get('option_b'), oc = get('option_c'), od = get('option_d');
      const cor = get('correct').toUpperCase();
      
      if (!q || !oa || !ob) { errors.push(`Row ${i+1}: missing question/options`); continue; }
      if (!correctMap.hasOwnProperty(cor.toLowerCase())) { errors.push(`Row ${i+1}: invalid correct answer "${cor}"`); continue; }
      
      questions.push({
        question_en: q, 
        options_en: [oa, ob, oc || '', od || ''], 
        correct_index: correctMap[cor.toLowerCase()],
        subject: get('subject') || 'general', 
        difficulty: get('difficulty') || 'medium',
        board: get('board') || null, 
        exam: get('exam') || null, 
        topic: get('topic') || null,
        year: get('year') || null, 
        source: get('source') || null
      });
    }

    window._pendingImport = questions;
    const prev = document.getElementById('importPreview');
    prev.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">Preview: ${questions.length} questions parsed ${errors.length ? `(${errors.length} errors)` : ''}</div>
        ${errors.length ? `<div class="import-errors">${errors.map(e => `<div>${e}</div>`).join('')}</div>` : ''}
        ${questions.slice(0, 20).map(q => `
          <div class="q-row compact">
            <div class="q-body">
              <div class="q-text">${q.question_en}</div>
              <div class="q-meta">
                <span class="chip-s chip-subj">${q.subject}</span>
                <span class="chip-s chip-diff-${q.difficulty}">${q.difficulty}</span>
                ${q.board ? `<span class="chip-s chip-board">${q.board}</span>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
        ${questions.length > 20 ? `<div class="empty">...and ${questions.length - 20} more</div>` : ''}
        <button class="save-btn" style="margin-top:16px" onclick="window.AdminQuestions.confirmImport()" id="importBtn">
          ✅ Import ${questions.length} Questions
        </button>
      </div>
    `;
  },

  async confirmImport() {
    if (!window._pendingImport?.length) return;
    const btn = document.getElementById('importBtn');
    btn.disabled = true; 
    btn.textContent = '⏳ Importing...';
    
    try {
      const d = await AdminCore.api('bulk-import', { questions: window._pendingImport });
      const msg = `✅ Imported: ${d.imported} | Rejected: ${d.rejected || 0} | Duplicates: ${d.duplicates || 0}`;
      AdminCore.showToast(msg, 'success');
      
      if (d.duplicates > 0 || d.rejected > 0) {
        document.getElementById('importPreview').innerHTML = `
          <div class="sec-card">
            <div class="sec-title">📊 Import Report</div>
            <div style="display:flex; gap:12px; margin-bottom:8px;">
              <span class="chip-s chip-diff-easy">✅ Imported: ${d.imported}</span>
              <span class="chip-s chip-diff-hard">❌ Rejected: ${d.rejected || 0}</span>
              <span class="chip-s chip-diff-medium">🔁 Duplicates: ${d.duplicates || 0}</span>
            </div>
            ${(d.duplicateItems || []).length ? `<div style="font-size:12px; color:var(--text-muted); margin-top:4px;">Duplicate samples: ${d.duplicateItems.join('; ')}</div>` : ''}
          </div>
        `;
      } else {
        window._pendingImport = [];
        AdminCore.switchTab('questions');
      }
    } catch(e) { 
      AdminCore.showToast(e.message, 'error'); 
      btn.disabled = false; 
      btn.textContent = '✅ Import'; 
    }
  }
};
