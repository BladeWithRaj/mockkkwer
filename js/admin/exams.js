// ============================================
// ADMIN CONSOLE — Exams & Configurations
// ============================================

window.AdminExams = {
  statusColors: { draft: '#f59e0b', published: '#10b981', archived: '#6b7280', disabled: '#ef4444' },
  statusIcons: { draft: '📝', published: '🟢', archived: '📦', disabled: '🔴' },

  VALID_RENDERERS: ['ssc', 'railway', 'banking', 'upsc'],
  VALID_BOARDS: ['SSC', 'Railway', 'Banking', 'UPSC', 'Teaching', 'Defence', 'State', 'Quick', 'Daily'],
  VALID_SUBJECTS: ['math', 'reasoning', 'english', 'hindi', 'gk', 'science', 'history', 'geography', 'polity', 'all'],

  async renderList(el) {
    try {
      const d = await AdminCore.api('all-exams');
      const exams = d.exams || [];
      const boards = [...new Set(exams.map(e => e.board || e.category))];

      el.innerHTML = `
        <div class="sec-card">
          <div class="sec-title">🎯 Exam Configurations (${exams.length})</div>
          <div style="margin-bottom:12px; display:flex; gap:8px; flex-wrap:wrap;">
            <button class="tool-btn" onclick="window.AdminExams.renderAdd()">➕ Add New Exam</button>
            <button class="tool-btn" onclick="window.AdminExams.backfillHashes()" style="background:var(--surface-alt, #2a2a3e);">🔄 Backfill Q-Hashes</button>
          </div>
          ${boards.map(board => `
            <div style="margin-bottom:16px;">
              <div style="font-weight:600; color:var(--text-primary); margin-bottom:8px; font-size:14px;">📁 ${board}</div>
              ${exams.filter(e => (e.board || e.category) === board).map(exam => `
                <div class="q-row" style="padding:12px;">
                  <div class="q-body" style="flex:1;">
                    <div style="display:flex; align-items:center; gap:8px;">
                      <span style="font-size:18px;">${exam.icon || '📝'}</span>
                      <div>
                        <div class="q-text" style="font-size:14px;">${exam.exam_name || exam.exam || '(unnamed)'}</div>
                        <div style="font-size:12px; color:var(--text-muted);">${exam.full_name || ''}</div>
                      </div>
                      <span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:600; color:#fff; background:${this.statusColors[exam.status] || '#6b7280'}; margin-left:8px;">
                        ${this.statusIcons[exam.status] || ''} ${(exam.status || 'draft').toUpperCase()}
                      </span>
                      ${exam.schema_version ? `<span style="font-size:11px; color:var(--text-muted);">v${exam.schema_version}</span>` : ''}
                    </div>
                    <div class="q-meta" style="margin-top:6px;">
                      <span class="chip-s chip-subj">${exam.total_questions}Q</span>
                      <span class="chip-s chip-board">${exam.duration_minutes}min</span>
                      <span class="chip-s ${exam.negative_marking > 0 ? 'chip-diff-hard' : 'chip-diff-easy'}">${exam.negative_marking > 0 ? '-'+exam.negative_marking : 'No neg'}</span>
                      <span class="chip-s chip-topic">${exam.renderer_type}</span>
                      <span class="chip-s">${(exam.sections || []).length} sections</span>
                    </div>
                  </div>
                  <div class="q-actions" style="display:flex; gap:4px; flex-wrap:wrap;">
                    ${exam.status === 'draft' ? `<button class="act-btn" onclick="window.AdminExams.publish('${exam.slug}')" title="Publish" style="background:#10b981; color:#fff;">🚀</button>` : ''}
                    ${exam.status === 'published' ? `<button class="act-btn" onclick="window.AdminExams.unpublish('${exam.slug}')" title="Unpublish" style="background:#f59e0b; color:#fff;">⏸️</button>` : ''}
                    <button class="act-btn" onclick="window.AdminExams.edit('${exam.slug}')" title="Edit">✏️</button>
                    <button class="act-btn" onclick="window.AdminExams.duplicate('${exam.slug}')" title="Duplicate">📋</button>
                    ${exam.status !== 'archived' ? `<button class="act-btn" onclick="window.AdminExams.archive('${exam.slug}')" title="Archive">📦</button>` : ''}
                    <button class="act-btn" onclick="window.AdminExams.showVersions('${exam.slug}')" title="History">🕐</button>
                    ${exam.status !== 'published' ? `<button class="act-btn danger" onclick="window.AdminExams.deleteExam(${exam.id}, '${(exam.exam_name || '').replace(/'/g, "\\'")}')" title="Delete">🗑️</button>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      `;
    } catch(e) {
      AdminCore.showToast(e.message, 'error');
    }
  },

  renderAdd(editData = null) {
    const el = document.getElementById('adminContent');
    const e = editData || { 
      slug:'', board:'SSC', exam_name:'', full_name:'', renderer_type:'ssc', 
      icon:'📝', duration_minutes:60, total_questions:100, marks_per_question:2, 
      negative_marking:0, category:'SSC', sections:[], section_locking:false, 
      section_timers:false, calculator_allowed:false, palette_type:'default', 
      keyboard_nav:false, description:'', sort_order:0, is_active:true 
    };
    const isEdit = !!editData;
    window._examSections = [...(e.sections || [])];

    el.innerHTML = `
      <div class="sec-card">
        <div class="sec-title">${isEdit ? '✏️ Edit' : '➕ Add'} Exam Config ${isEdit ? '#'+e.slug : ''}</div>
        <form id="examForm" onsubmit="return false;">
          <div class="form-grid">
            <div class="form-group"><label>Slug *</label><input type="text" id="ex_slug" value="${e.slug}" placeholder="ssc-cgl" ${isEdit ? 'readonly' : 'required'}></div>
            <div class="form-group"><label>Exam Name *</label><input type="text" id="ex_name" value="${e.exam_name}" required></div>
            <div class="form-group"><label>Full Name</label><input type="text" id="ex_full" value="${e.full_name || ''}"></div>
            <div class="form-group">
              <label>Board/Category *</label>
              <select id="ex_board">
                ${this.VALID_BOARDS.map(b => `<option value="${b}" ${e.board === b ? 'selected' : ''}>${b}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>Icon</label><input type="text" id="ex_icon" value="${e.icon || '📝'}"></div>
            <div class="form-group">
              <label>Renderer</label>
              <select id="ex_renderer">
                ${this.VALID_RENDERERS.map(r => `<option value="${r}" ${e.renderer_type === r ? 'selected' : ''}>${r}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>Duration (min)</label><input type="number" id="ex_dur" value="${e.duration_minutes}"></div>
            <div class="form-group"><label>Total Questions</label><input type="number" id="ex_total" value="${e.total_questions}"></div>
            <div class="form-group"><label>Marks/Question</label><input type="number" id="ex_marks" value="${e.marks_per_question}" step="0.25"></div>
            <div class="form-group"><label>Negative Marking</label><input type="number" id="ex_neg" value="${e.negative_marking}" step="0.01"></div>
            <div class="form-group"><label>Sort Order</label><input type="number" id="ex_sort" value="${e.sort_order || 0}"></div>
            <div class="form-group full"><label>Description</label><textarea id="ex_desc" rows="2">${e.description || ''}</textarea></div>
            <div class="form-group"><label><input type="checkbox" id="ex_lock" ${e.section_locking ? 'checked' : ''}> Section Locking</label></div>
            <div class="form-group"><label><input type="checkbox" id="ex_timers" ${e.section_timers ? 'checked' : ''}> Section Timers</label></div>
            <div class="form-group"><label><input type="checkbox" id="ex_calc" ${e.calculator_allowed ? 'checked' : ''}> Calculator</label></div>
            <div class="form-group"><label><input type="checkbox" id="ex_active" ${e.is_active !== false ? 'checked' : ''}> Active</label></div>
          </div>
          <div class="sec-card" style="margin-top:12px;">
            <div class="sec-title">📑 Sections</div>
            <div id="sectionsList"></div>
            <button type="button" class="tool-btn" onclick="window.AdminExams.addSection()" style="margin-top:8px;">+ Add Section</button>
          </div>
          <div class="form-actions" style="margin-top:12px;">
            <button type="button" class="save-btn" onclick="window.AdminExams.save(${isEdit ? "'"+e.slug+"'" : 'null'})">
              ${isEdit ? '💾 Update' : '➕ Create'} Exam
            </button>
            <button type="button" class="cancel-btn" onclick="AdminCore.switchTab('exams')">Cancel</button>
          </div>
        </form>
      </div>
    `;
    this.renderSectionsList();
  },

  renderSectionsList() {
    const el = document.getElementById('sectionsList');
    if (!el) return;
    el.innerHTML = (window._examSections || []).map((s, i) => `
      <div style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
        <input type="text" value="${s.name || ''}" placeholder="Section name" style="flex:2;" onchange="window._examSections[${i}].name=this.value">
        <input type="text" value="${s.subject || ''}" placeholder="subject" style="flex:1;" onchange="window._examSections[${i}].subject=this.value">
        <input type="number" value="${s.questions || 0}" placeholder="Qty" style="width:60px;" onchange="window._examSections[${i}].questions=parseInt(this.value)">
        <input type="number" value="${s.sectionTime || ''}" placeholder="Time(s)" style="width:80px;" onchange="window._examSections[${i}].sectionTime=parseInt(this.value)||undefined">
        <button class="act-btn danger" onclick="window._examSections.splice(${i},1); window.AdminExams.renderSectionsList()">✗</button>
      </div>
    `).join('') || '<div class="empty" style="padding:8px;">No sections added</div>';
  },

  addSection() {
    if (!window._examSections) window._examSections = [];
    window._examSections.push({ name: '', subject: '', questions: 25 });
    this.renderSectionsList();
  },

  async edit(slug) {
    try {
      const r = await fetch(`/api/exams?slug=${slug}`, { 
        headers: { 'Authorization': 'Bearer ' + AdminCore.token } 
      });
      const d = await r.json();
      if (d.exam) this.renderAdd(d.exam);
      else AdminCore.showToast('Exam not found', 'error');
    } catch(e) {
      AdminCore.showToast(e.message, 'error');
    }
  },

  validateClient(config, isUpdate) {
    const errors = [];
    const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

    if (!isUpdate) {
      if (!config.slug) errors.push('Slug is required');
      else if (!SLUG_RE.test(config.slug)) errors.push('Slug must be kebab-case. Got: "' + config.slug + '"');
      else if (config.slug.length < 2 || config.slug.length > 50) errors.push('Slug must be 2-50 characters');
    }

    if (!config.exam_name || config.exam_name.length < 2) errors.push('Exam name required (min 2 chars)');
    if (config.renderer_type && !this.VALID_RENDERERS.includes(config.renderer_type)) errors.push('Invalid renderer');
    if (config.board && !this.VALID_BOARDS.includes(config.board)) errors.push('Invalid board');

    const dur = Number(config.duration_minutes);
    if (isNaN(dur) || dur <= 0 || dur > 600) errors.push('Duration must be 1-600 minutes');

    const tq = Number(config.total_questions);
    if (isNaN(tq) || tq <= 0 || tq > 1000) errors.push('Total questions must be 1-1000');

    const mpq = Number(config.marks_per_question);
    if (isNaN(mpq) || mpq <= 0 || mpq > 10) errors.push('Marks/question must be 0.25-10');

    const neg = Number(config.negative_marking);
    if (isNaN(neg) || neg < 0 || neg > 5) errors.push('Negative marking must be 0-5');

    const secs = config.sections || [];
    if (secs.length === 0 && !isUpdate) errors.push('At least 1 section required');
    
    let secTotal = 0;
    secs.forEach((s, i) => {
      if (!s.name || !s.name.trim()) errors.push(`Section ${i+1}: name is required`);
      if (!s.subject) errors.push(`Section ${i+1}: subject is required`);
      else if (!this.VALID_SUBJECTS.includes(s.subject.toLowerCase())) errors.push(`Section ${i+1}: invalid subject "${s.subject}"`);
      const sq = Number(s.questions);
      if (isNaN(sq) || sq <= 0) errors.push(`Section ${i+1}: questions must be > 0`);
      else secTotal += sq;
    });

    if (secs.length > 0 && secTotal > 0 && !isNaN(tq) && tq > 0 && secTotal !== tq) {
      errors.push(`Section questions total (${secTotal}) ≠ total_questions (${tq})`);
    }

    return errors;
  },

  async save(editSlug) {
    const payload = {
      slug: document.getElementById('ex_slug').value.trim(),
      board: document.getElementById('ex_board').value,
      exam_name: document.getElementById('ex_name').value.trim(),
      full_name: document.getElementById('ex_full').value.trim() || null,
      renderer_type: document.getElementById('ex_renderer').value,
      icon: document.getElementById('ex_icon').value.trim() || '📝',
      duration_minutes: parseInt(document.getElementById('ex_dur').value) || 60,
      total_questions: parseInt(document.getElementById('ex_total').value) || 100,
      marks_per_question: parseFloat(document.getElementById('ex_marks').value) || 1,
      negative_marking: parseFloat(document.getElementById('ex_neg').value) || 0,
      category: document.getElementById('ex_board').value,
      description: document.getElementById('ex_desc').value.trim() || null,
      sort_order: parseInt(document.getElementById('ex_sort').value) || 0,
      sections: (window._examSections || []).filter(s => s.name && s.subject),
      section_locking: document.getElementById('ex_lock').checked,
      section_timers: document.getElementById('ex_timers').checked,
      calculator_allowed: document.getElementById('ex_calc').checked,
      is_active: document.getElementById('ex_active').checked
    };

    const errors = this.validateClient(payload, !!editSlug);
    if (errors.length > 0) {
      AdminCore.showToast('⚠️ ' + errors[0], 'error');
      if (errors.length > 1) setTimeout(() => AdminCore.showToast(`${errors.length} validation errors`, 'error'), 500);
      return;
    }

    try {
      if (editSlug) payload.slug = editSlug;
      await AdminCore.api(editSlug ? 'update-exam' : 'create-exam', payload);
      AdminCore.showToast(editSlug ? 'Exam updated!' : 'Exam created!', 'success');
      AdminCore.switchTab('exams');
    } catch(e) { 
      AdminCore.showToast(e.message, 'error'); 
    }
  },

  async deleteExam(id, name) {
    if (!confirm(`Delete exam "${name}" permanently?`)) return;
    try {
      await AdminCore.api('delete-exam', { id });
      AdminCore.showToast('Exam deleted', 'success');
      AdminCore.switchTab('exams');
    } catch(e) { AdminCore.showToast(e.message, 'error'); }
  },

  async publish(slug) {
    if (!confirm(`Publish "${slug}" to production?`)) return;
    try { 
      await AdminCore.api('publish-exam', { slug }); 
      AdminCore.showToast('🚀 Exam published!', 'success'); 
      AdminCore.switchTab('exams'); 
    } catch(e) { AdminCore.showToast(e.message, 'error'); }
  },

  async unpublish(slug) {
    if (!confirm(`Unpublish "${slug}"? It will be removed from frontend.`)) return;
    try { 
      await AdminCore.api('unpublish-exam', { slug }); 
      AdminCore.showToast('⏸️ Exam unpublished', 'success'); 
      AdminCore.switchTab('exams'); 
    } catch(e) { AdminCore.showToast(e.message, 'error'); }
  },

  async archive(slug) {
    if (!confirm(`Archive "${slug}"?`)) return;
    try { 
      await AdminCore.api('archive-exam', { slug }); 
      AdminCore.showToast('📦 Exam archived', 'success'); 
      AdminCore.switchTab('exams'); 
    } catch(e) { AdminCore.showToast(e.message, 'error'); }
  },

  async duplicate(slug) {
    try { 
      const d = await AdminCore.api('duplicate-exam', { slug }); 
      AdminCore.showToast(`📋 Cloned as ${d.exam?.slug}`, 'success'); 
      AdminCore.switchTab('exams'); 
    } catch(e) { AdminCore.showToast(e.message, 'error'); }
  },

  async showVersions(slug) {
    const el = document.getElementById('adminContent');
    el.innerHTML = '<div class="loading"><span class="guard-spin"></span> Loading versions...</div>';
    try {
      const d = await AdminCore.api('exam-versions&slug=' + slug);
      const vers = d.versions || [];
      el.innerHTML = `
        <div class="sec-card">
          <div class="sec-title">🕐 Version History — ${slug} (${vers.length} versions)</div>
          ${vers.length === 0 ? '<div class="empty">No versions yet. Publish to create first version.</div>' :
            vers.map(v => `
              <div class="q-row" style="padding:10px;">
                <div class="q-body">
                  <div class="q-text" style="font-size:13px;">v${v.version_number} — ${v.change_summary || 'Published'}</div>
                  <div class="q-meta">
                    <span class="chip-s chip-subj">${new Date(v.created_at).toLocaleString('en-IN', {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                    <span class="chip-s chip-board">${v.created_by || 'admin'}</span>
                  </div>
                </div>
                <div class="q-actions">
                  <button class="act-btn" onclick="window.AdminExams.rollback('${slug}', ${v.version_number})" title="Rollback">⏪</button>
                </div>
              </div>
            `).join('')}
          <button class="cancel-btn" style="margin-top:12px;" onclick="AdminCore.switchTab('exams')">← Back</button>
        </div>
      `;
    } catch (e) {
      AdminCore.showToast(e.message, 'error');
    }
  },

  async rollback(slug, version) {
    if (!confirm(`Rollback "${slug}" to v${version}? Current config will become a draft.`)) return;
    try { 
      await AdminCore.api('rollback-exam', { slug, version }); 
      AdminCore.showToast(`⏪ Rolled back to v${version}`, 'success'); 
      AdminCore.switchTab('exams'); 
    } catch(e) { AdminCore.showToast(e.message, 'error'); }
  },

  async backfillHashes() {
    if (!confirm('Backfill question hashes for duplicate detection? This processes all existing questions.')) return;
    try { 
      const d = await AdminCore.api('backfill-hashes', {}); 
      AdminCore.showToast(`✅ Updated: ${d.updated}, Duplicates found: ${d.duplicates}`, 'success'); 
    } catch(e) { AdminCore.showToast(e.message, 'error'); }
  }
};
