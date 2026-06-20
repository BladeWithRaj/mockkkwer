// ============================================
// ADMIN CONSOLE — Polytechnic Module
// ============================================

window.AdminPoly = {
  subTab: 'p-subjects',
  page: 1,
  subjectFilter: '',
  statusFilter: 'all',

  async api(path, opts = {}) {
    const h = { 'Authorization': 'Bearer ' + AdminCore.token };
    if (opts.body) { h['Content-Type'] = 'application/json'; }
    const r = await fetch(`/api/polytechnic/${path}`, {
      method: opts.body ? (opts.method || 'POST') : 'GET', 
      headers: h,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
    if (!r.ok) { 
      const e = await r.json(); 
      throw new Error(e.error || 'API error'); 
    }
    return r.json();
  },

  async renderTab(el) {
    const tabs = [
      { id:'p-subjects', icon:'📚', label:'Subjects' },
      { id:'p-syllabus', icon:'📖', label:'Syllabus' },
      { id:'p-questions', icon:'❓', label:'Questions' },
      { id:'p-import', icon:'📥', label:'CSV Import' },
      { id:'p-patterns', icon:'📋', label:'Patterns' },
      { id:'p-papers', icon:'📄', label:'Papers' }
    ];
    el.innerHTML = `
      <div class="sec-card" style="padding:8px 12px;">
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          ${tabs.map(t => `
            <button class="tool-btn ${this.subTab === t.id ? 'active' : ''}" 
                    onclick="window.AdminPoly.switchSubTab('${t.id}')" 
                    style="${this.subTab === t.id ? 'background:var(--accent,#6c5ce7); color:#fff;' : ''}">
              ${t.icon} ${t.label}
            </button>
          `).join('')}
        </div>
      </div>
      <div id="polyContent"></div>
    `;
    
    const pc = document.getElementById('polyContent');
    pc.innerHTML = '<div class="loading" style="padding:40px; text-align:center; color:var(--text-muted);"><span class="guard-spin" style="margin-right:8px;"></span> Loading...</div>';
    try {
      switch(this.subTab) {
        case 'p-subjects': await this.renderSubjects(pc); break;
        case 'p-syllabus': await this.renderSyllabus(pc); break;
        case 'p-questions': await this.renderQuestions(pc); break;
        case 'p-import': this.renderImport(pc); break;
        case 'p-patterns': await this.renderPatterns(pc); break;
        case 'p-papers': await this.renderPapers(pc); break;
      }
    } catch(e) { 
      pc.innerHTML = `<div class="empty">❌ ${e.message}</div>`; 
    }
  },

  switchSubTab(tabId) {
    this.subTab = tabId;
    this.page = 1;
    this.renderTab(document.getElementById('adminContent'));
  },

  // ── Subjects ──
  async renderSubjects(el) {
    const d = await this.api('subjects');
    const subs = d.subjects || [];
    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">📚 Subjects (${subs.length})</div>
        <button class="tool-btn" onclick="window.AdminPoly.showSubjectForm()" style="margin-bottom:12px;">➕ Add Subject</button>
        <div id="polySubjectForm" style="display:none; margin-bottom:16px; padding:12px; background:var(--surface-alt,#1a1a3e); border-radius:8px;">
          <div class="form-grid">
            <div class="form-group"><label>Branch</label><select id="ps_branch"><option>CSE</option><option>EE</option><option>ME</option><option>CE</option><option>ECE</option><option>IT</option></select></div>
            <div class="form-group"><label>Semester</label><input type="number" id="ps_sem" value="1" min="1" max="8"></div>
            <div class="form-group"><label>Subject Code</label><input type="text" id="ps_code" placeholder="CS-101"></div>
            <div class="form-group"><label>Subject Name</label><input type="text" id="ps_name" placeholder="Computer Fundamentals"></div>
            <div class="form-group"><label>Duration (min)</label><input type="number" id="ps_dur" value="180"></div>
            <div class="form-group"><label>Total Marks</label><input type="number" id="ps_marks" value="70"></div>
          </div>
          <button class="save-btn" style="margin-top:8px;" onclick="window.AdminPoly.saveSubject()">💾 Save Subject</button>
        </div>
        ${subs.length === 0 ? '<div class="empty">No subjects. Add your first subject above.</div>' :
          subs.map(s => `
            <div class="q-row" style="padding:10px;">
              <div class="q-body">
                <div class="q-text" style="font-size:14px;">${s.subject_name} (${s.subject_code})</div>
                <div class="q-meta">
                  <span class="chip-s chip-subj">${s.branch}</span>
                  <span class="chip-s chip-board">Sem ${s.semester}</span>
                  <span class="chip-s">${s.total_marks}M | ${s.exam_duration}min</span>
                  <span class="q-id">ID: ${s.id}</span>
                </div>
              </div>
            </div>
          `).join('')}
      </div>
    `;
  },

  showSubjectForm() {
    document.getElementById('polySubjectForm').style.display = 'block';
  },

  async saveSubject() {
    try {
      await this.api('subjects', { 
        body: {
          branch: document.getElementById('ps_branch').value,
          semester: parseInt(document.getElementById('ps_sem').value),
          subject_code: document.getElementById('ps_code').value.trim(),
          subject_name: document.getElementById('ps_name').value.trim(),
          exam_duration: parseInt(document.getElementById('ps_dur').value),
          total_marks: parseInt(document.getElementById('ps_marks').value)
        }
      });
      AdminCore.showToast('Subject added!', 'success');
      this.renderTab(document.getElementById('adminContent'));
    } catch(e) { 
      AdminCore.showToast(e.message, 'error'); 
    }
  },

  // ── Syllabus ──
  async renderSyllabus(el) {
    const subs = (await this.api('subjects')).subjects || [];
    const selId = this.subjectFilter || (subs[0]?.id || '');
    const syl = selId ? (await this.api(`syllabus?subject_id=${selId}`)).syllabus || [] : [];
    
    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">📖 Syllabus Units</div>
        <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap;">
          <select class="tool-select" onchange="window.AdminPoly.subjectFilter=this.value; window.AdminPoly.switchSubTab('p-syllabus')">
            ${subs.map(s => `<option value="${s.id}" ${s.id == selId ? 'selected' : ''}>${s.branch} S${s.semester} — ${s.subject_name}</option>`).join('')}
          </select>
          <button class="tool-btn" onclick="window.AdminPoly.showSyllabusForm()">➕ Add Unit</button>
        </div>
        <div id="polySylForm" style="display:none; margin-bottom:16px; padding:12px; background:var(--surface-alt,#1a1a3e); border-radius:8px;">
          <div class="form-grid">
            <div class="form-group"><label>Unit No</label><input type="number" id="pu_no" value="${syl.length+1}" min="1"></div>
            <div class="form-group"><label>Unit Name</label><input type="text" id="pu_name" placeholder="Introduction"></div>
            <div class="form-group"><label>Topic</label><input type="text" id="pu_topic" placeholder="Computer Basics"></div>
            <div class="form-group"><label>Weightage %</label><input type="number" id="pu_weight" value="20" min="1" max="100"></div>
          </div>
          <button class="save-btn" style="margin-top:8px;" onclick="window.AdminPoly.saveSyllabus('${selId}')">💾 Save Unit</button>
        </div>
        ${syl.length === 0 ? '<div class="empty">No units defined for this subject.</div>' :
          syl.map(u => `
            <div class="q-row" style="padding:10px;">
              <div class="q-body">
                <div class="q-text">Unit ${u.unit_no}: ${u.unit_name}</div>
                <div class="q-meta">
                  <span class="chip-s chip-topic">${u.topic_name}</span>
                  <span class="chip-s chip-subj">Weight: ${u.weightage}%</span>
                </div>
              </div>
            </div>
          `).join('')}
      </div>
    `;
  },

  showSyllabusForm() {
    document.getElementById('polySylForm').style.display = 'block';
  },

  async saveSyllabus(sid) {
    try {
      await this.api('syllabus', { 
        body: {
          subject_id: parseInt(sid),
          unit_no: parseInt(document.getElementById('pu_no').value),
          unit_name: document.getElementById('pu_name').value.trim(),
          topic_name: document.getElementById('pu_topic').value.trim(),
          weightage: parseInt(document.getElementById('pu_weight').value)
        }
      });
      AdminCore.showToast('Unit added!', 'success');
      this.renderTab(document.getElementById('adminContent'));
    } catch(e) { 
      AdminCore.showToast(e.message, 'error'); 
    }
  },

  // ── Questions + Moderation ──
  async renderQuestions(el) {
    const subs = (await this.api('subjects')).subjects || [];
    const status = this.statusFilter === 'all' ? 'pending' : this.statusFilter;
    let url = `questions?status=${status}&page=${this.page}&limit=20`;
    if (this.subjectFilter) url += `&subject_id=${this.subjectFilter}`;
    
    const d = await this.api(url);
    const qs = d.questions || [];
    const labels = ['A','B','C','D'];
    const statusColors = { pending:'#f59e0b', approved:'#10b981', rejected:'#ef4444', flagged:'#8b5cf6' };

    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">❓ Polytechnic Questions (${d.total || 0} ${status})</div>
        <div style="display:flex; gap:8px; margin-bottom:12px; flex-wrap:wrap; align-items:center;">
          <select class="tool-select" onchange="window.AdminPoly.subjectFilter=this.value; window.AdminPoly.switchSubTab('p-questions')">
            <option value="">All Subjects</option>
            ${subs.map(s => `<option value="${s.id}" ${s.id == this.subjectFilter ? 'selected' : ''}>${s.subject_name}</option>`).join('')}
          </select>
          <select class="tool-select" onchange="window.AdminPoly.statusFilter=this.value; window.AdminPoly.switchSubTab('p-questions')">
            ${['pending','approved','rejected','flagged'].map(s => `<option value="${s}" ${status === s ? 'selected' : ''}>${s.toUpperCase()}</option>`).join('')}
          </select>
          ${status === 'pending' && qs.length > 0 ? `
            <button class="tool-btn" style="background:#10b981; color:#fff;" onclick="window.AdminPoly.bulkModerate('approved')">✅ Approve All (${qs.length})</button>
            <button class="tool-btn" style="background:#ef4444; color:#fff;" onclick="window.AdminPoly.bulkModerate('rejected')">❌ Reject All</button>
          ` : ''}
        </div>
        ${qs.length === 0 ? `<div class="empty">No ${status} questions found.</div>` :
          qs.map(q => `
            <div class="q-row" style="padding:10px;">
              <div class="q-body">
                <div class="q-text">${q.question_en || q.topic_name || '-'}</div>
                ${q.question_hi ? `<div class="q-hi">${q.question_hi}</div>` : ''}
                <div class="q-options">
                  ${(q.options_en||[]).map((o,i)=>`<span class="q-opt ${i===q.correct_index?'correct':''}">${labels[i]}. ${o}</span>`).join('')}
                </div>
                <div class="q-meta">
                  <span class="chip-s" style="background:${statusColors[q.moderation_status]||'#888'}; color:#fff;">${(q.moderation_status||'pending').toUpperCase()}</span>
                  <span class="chip-s chip-subj">U${q.unit_no||'?'}</span>
                  <span class="chip-s chip-diff-${q.difficulty||'medium'}">${q.difficulty||'medium'}</span>
                  ${q.source ? `<span class="chip-s chip-board">${q.source}</span>` : ''}
                  <span class="q-id">ID: ${q.id}</span>
                </div>
              </div>
              <div class="q-actions">
                ${q.moderation_status !== 'approved' ? `<button class="act-btn" onclick="window.AdminPoly.moderateQ([${q.id}],'approved')" title="Approve" style="background:#10b981; color:#fff;">✅</button>` : ''}
                ${q.moderation_status !== 'rejected' ? `<button class="act-btn" onclick="window.AdminPoly.moderateQ([${q.id}],'rejected')" title="Reject" style="background:#ef4444; color:#fff;">❌</button>` : ''}
                <button class="act-btn" onclick="window.AdminPoly.moderateQ([${q.id}],'flagged')" title="Flag">🚩</button>
              </div>
            </div>
          `).join('')}
        <div class="paginator" style="margin-top:12px;">
          <button ${this.page <= 1 ? 'disabled' : ''} onclick="window.AdminPoly.page--; window.AdminPoly.renderTab(document.getElementById('adminContent'))">← Prev</button>
          <span class="page-info">Page ${this.page}</span>
          <button ${qs.length < 20 ? 'disabled' : ''} onclick="window.AdminPoly.page++; window.AdminPoly.renderTab(document.getElementById('adminContent'))">Next →</button>
        </div>
      </div>
    `;
  },

  async moderateQ(ids, action) {
    try {
      await this.api('questions', { 
        method: 'PATCH', 
        body: { ids, action, approved_by: AdminCore.user?.username || 'superadmin' }
      });
      AdminCore.showToast(`${ids.length} question(s) → ${action}`, 'success');
      this.renderTab(document.getElementById('adminContent'));
    } catch(e) { 
      AdminCore.showToast(e.message, 'error'); 
    }
  },

  async bulkModerate(action) {
    if (!confirm(`${action.toUpperCase()} all visible questions?`)) return;
    const rows = document.querySelectorAll('.q-row .q-id');
    const ids = [...rows].map(r => parseInt(r.textContent.replace('ID: ',''))).filter(n => !isNaN(n));
    if (ids.length) await this.moderateQ(ids, action);
  },

  // ── CSV Import ──
  renderImport(el) {
    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">📥 Polytechnic Bulk CSV Import</div>
        <div class="upload-zone" id="polyUploadZone" onclick="document.getElementById('polyCsvFile').click()"
          ondragover="event.preventDefault(); this.classList.add('hover')" ondragleave="this.classList.remove('hover')"
          ondrop="event.preventDefault(); this.classList.remove('hover'); window.AdminPoly.handleFile(event.dataTransfer.files[0])">
          <div style="font-size:40px; opacity:.5">📁</div>
          <div>Click or drag CSV file</div>
          <div class="upload-hint">subject_id,unit_no,question_en,question_hi,opt_a,opt_b,opt_c,opt_d,correct,difficulty,marks,source,year</div>
          <input type="file" id="polyCsvFile" accept=".csv" style="display:none" onchange="window.AdminPoly.handleFile(this.files[0])">
        </div>
        <button class="tool-btn" style="margin-top:12px" onclick="window.AdminPoly.downloadTemplate()">📄 Download CSV Template</button>
      </div>
      <div id="polyImportPreview"></div>
    `;
  },

  downloadTemplate() {
    const csv = 'subject_id,unit_no,question_en,question_hi,opt_a_en,opt_b_en,opt_c_en,opt_d_en,opt_a_hi,opt_b_hi,opt_c_hi,opt_d_hi,correct,difficulty,marks,source,year\n1,1,"What is CPU?","CPU क्या है?","Central Processing Unit","Computer Personal Unit","Central Personal Unit","Control Processing Unit","केंद्रीय प्रसंस्करण इकाई","कंप्यूटर व्यक्तिगत इकाई","केंद्रीय व्यक्तिगत इकाई","नियंत्रण प्रसंस्करण इकाई","A","easy",1,"textbook",2024';
    const b = new Blob([csv], {type:'text/csv'}); 
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(b); 
    a.download = 'polytechnic_questions_template.csv'; 
    a.click();
  },

  handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) return AdminCore.showToast('CSV file required', 'error');
    const reader = new FileReader(); 
    reader.onload = (e) => this.parseCSV(e.target.result); 
    reader.readAsText(file);
  },

  parseCSV(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return AdminCore.showToast('CSV has no data rows', 'error');
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g,'').trim().toLowerCase());
    const correctMap = {a:0, b:1, c:2, d:3};
    const questions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const vals = this.parseCSVLine(lines[i]);
      const get = (name) => { const idx = headers.indexOf(name); return idx >= 0 ? (vals[idx]||'') : ''; };
      
      const qen = get('question_en'), oa = get('opt_a_en'), ob = get('opt_b_en');
      const cor = get('correct').toUpperCase();
      
      if (!qen || !oa || !ob) { errors.push(`Row ${i+1}: missing question/options`); continue; }
      if (!correctMap.hasOwnProperty(cor.toLowerCase())) { errors.push(`Row ${i+1}: invalid correct "${cor}"`); continue; }
      
      questions.push({
        subject_id: parseInt(get('subject_id')) || 1,
        unit_no: parseInt(get('unit_no')) || 1,
        question_en: qen, 
        question_hi: get('question_hi') || null,
        options_en: [oa, ob, get('opt_c_en')||'', get('opt_d_en')||''],
        options_hi: get('opt_a_hi') ? [get('opt_a_hi'), get('opt_b_hi'), get('opt_c_hi'), get('opt_d_hi')] : null,
        correct_index: correctMap[cor.toLowerCase()],
        difficulty: get('difficulty') || 'medium',
        marks: parseInt(get('marks')) || 1,
        source: get('source') || null,
        exam_year: parseInt(get('year')) || null,
        moderation_status: 'pending',
        created_by: AdminCore.user?.username || 'admin'
      });
    }
    
    window._polyPending = questions;
    const prev = document.getElementById('polyImportPreview');
    prev.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">Preview: ${questions.length} questions ${errors.length ? `(${errors.length} errors)` : ''}</div>
        ${errors.length ? `<div class="import-errors">${errors.slice(0,10).map(e=>`<div>${e}</div>`).join('')}</div>` : ''}
        ${questions.slice(0,15).map(q => `
          <div class="q-row compact">
            <div class="q-body">
              <div class="q-text">${q.question_en}</div>
              <div class="q-meta">
                <span class="chip-s chip-subj">S${q.subject_id} U${q.unit_no}</span>
                <span class="chip-s chip-diff-${q.difficulty}">${q.difficulty}</span>
              </div>
            </div>
          </div>
        `).join('')}
        ${questions.length > 15 ? `<div class="empty">...and ${questions.length-15} more</div>` : ''}
        <button class="save-btn" style="margin-top:16px" onclick="window.AdminPoly.confirmImport()" id="polyImportBtn">
          ✅ Import ${questions.length} Questions (as PENDING)
        </button>
      </div>
    `;
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

  async confirmImport() {
    if (!window._polyPending?.length) return;
    const btn = document.getElementById('polyImportBtn');
    btn.disabled = true; 
    btn.textContent = '⏳ Importing...';
    
    try {
      let imported = 0, failed = 0;
      // Batch insert in chunks of 50
      for (let i = 0; i < window._polyPending.length; i += 50) {
        const chunk = window._polyPending.slice(i, i + 50);
        const r = await fetch('/api/polytechnic/questions', {
          method: 'POST', 
          headers: { 'Authorization': 'Bearer ' + AdminCore.token, 'Content-Type': 'application/json' },
          body: JSON.stringify(chunk)
        });
        if (r.ok) imported += chunk.length; else failed += chunk.length;
      }
      AdminCore.showToast(`✅ Imported: ${imported} | Failed: ${failed}`, 'success');
      window._polyPending = [];
      this.switchSubTab('p-questions');
    } catch(e) { 
      AdminCore.showToast(e.message, 'error'); 
      btn.disabled = false; 
      btn.textContent = '✅ Import'; 
    }
  },

  // ── Patterns ──
  async renderPatterns(el) {
    const subs = (await this.api('subjects')).subjects || [];
    const d = await this.api('patterns');
    const pats = d.patterns || [];
    
    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">📋 Paper Patterns (${pats.length})</div>
        <button class="tool-btn" onclick="window.AdminPoly.showPatternForm()" style="margin-bottom:12px;">➕ Add Pattern</button>
        <div id="polyPatternForm" style="display:none; margin-bottom:16px; padding:12px; background:var(--surface-alt,#1a1a3e); border-radius:8px;">
          <div class="form-grid">
            <div class="form-group"><label>Subject</label><select id="pp_sub">${subs.map(s=>`<option value="${s.id}">${s.subject_name}</option>`).join('')}</select></div>
            <div class="form-group"><label>Pattern Name</label><input type="text" id="pp_name" placeholder="UP Poly Standard"></div>
            <div class="form-group"><label>Total Marks</label><input type="number" id="pp_marks" value="70"></div>
            <div class="form-group"><label>Time (min)</label><input type="number" id="pp_time" value="180"></div>
            <div class="form-group full">
              <label>Pattern JSON (sections)</label>
              <textarea id="pp_json" rows="5" placeholder='{"sections":[{"name":"Section A","question_count":20,"marks_each":1,"difficulty":"easy","question_type":"mcq"}]}'></textarea>
            </div>
          </div>
          <button class="save-btn" style="margin-top:8px;" onclick="window.AdminPoly.savePattern()">💾 Save Pattern</button>
        </div>
        ${pats.map(p => `
          <div class="q-row" style="padding:10px;">
            <div class="q-body">
              <div class="q-text">${p.pattern_name || 'Pattern #'+p.id}</div>
              <div class="q-meta">
                <span class="chip-s chip-subj">Sub: ${p.subject_id}</span>
                <span class="chip-s chip-board">${p.total_marks||'?'}M</span>
                <span class="chip-s">${p.time_minutes||'?'}min</span>
                ${p.is_default ? '<span class="chip-s" style="background:#10b981; color:#fff;">DEFAULT</span>' : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  showPatternForm() {
    document.getElementById('polyPatternForm').style.display = 'block';
  },

  async savePattern() {
    try {
      let pj; 
      try { pj = JSON.parse(document.getElementById('pp_json').value); } 
      catch(e) { throw new Error('Invalid JSON'); }
      
      await this.api('patterns', { 
        body: {
          subject_id: parseInt(document.getElementById('pp_sub').value),
          pattern_name: document.getElementById('pp_name').value.trim(),
          total_marks: parseInt(document.getElementById('pp_marks').value),
          time_minutes: parseInt(document.getElementById('pp_time').value),
          pattern_json: pj, 
          section_name: 'Full', 
          question_type: 'mixed',
          question_count: pj.sections?.reduce((a,s) => a+(s.question_count||0), 0) || 0, 
          marks_per_question: 1
        }
      });
      AdminCore.showToast('Pattern saved!', 'success');
      this.renderTab(document.getElementById('adminContent'));
    } catch(e) { 
      AdminCore.showToast(e.message, 'error'); 
    }
  },

  // ── Papers History ──
  async renderPapers(el) {
    const d = await this.api('papers');
    const papers = d.papers || [];
    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">📄 Generated Papers (${papers.length})</div>
        <a href="/polytechnic/" target="_blank" class="tool-btn" style="display:inline-block; margin-bottom:12px; text-decoration:none;">🚀 Open Paper Generator</a>
        ${papers.length === 0 ? '<div class="empty">No papers generated yet. Use the Paper Generator to create your first paper.</div>' :
          papers.map(p => `
            <div class="q-row" style="padding:10px;">
              <div class="q-body">
                <div class="q-text">${p.title || 'Paper #'+p.id}</div>
                <div class="q-meta">
                  <span class="chip-s chip-subj">${p.paper_type || 'generated'}</span>
                  <span class="chip-s chip-board">${new Date(p.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                  <span class="q-id">ID: ${p.id}</span>
                </div>
              </div>
            </div>
          `).join('')}
      </div>
    `;
  }
};
