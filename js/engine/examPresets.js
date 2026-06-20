// ============================================
// EXAM PRESETS ENGINE — API-backed
// Fetches from /api/exams, caches in memory.
// Same public API as before so renderers/pages
// continue to work without changes.
// ============================================

const ExamPresets = {

  // ── Internal State ──
  _presets: {},       // slug → preset object
  _loaded: false,
  _loading: null,     // promise dedup

  // ═══════════════════════════════════════════
  //  INITIALIZATION — fetch from API
  // ═══════════════════════════════════════════

  /**
   * Load all exam configs from backend.
   * Returns a promise. Safe to call multiple times (deduped).
   */
  async load() {
    if (this._loaded) return;
    if (this._loading) return this._loading;

    this._loading = (async () => {
      try {
        const resp = await fetch('/api/exams');
        const data = await resp.json();

        if (data.success && Array.isArray(data.exams)) {
          this._presets = {};
          for (const row of data.exams) {
            this._presets[row.slug] = this._normalize(row);
          }
          this._loaded = true;
          console.log(`[ExamPresets] Loaded ${data.exams.length} exams from API`);
        } else {
          console.warn('[ExamPresets] API returned no exams, using fallback');
          this._loadFallback();
        }
      } catch (err) {
        console.warn('[ExamPresets] API fetch failed, using fallback:', err.message);
        this._loadFallback();
      } finally {
        this._loading = null;
      }
    })();

    return this._loading;
  },

  /**
   * Convert DB row to the preset format renderers expect.
   */
  _normalize(row) {
    const sections = (Array.isArray(row.sections) ? row.sections : []).map(s => ({
      name: s.name,
      subject: s.subject,
      questions: s.questions,
      ...(s.sectionTime ? { sectionTime: s.sectionTime } : {}),
      ...(s.v2StageId ? { v2StageId: s.v2StageId } : {}),
      ...(s.v2ExamId ? { v2ExamId: s.v2ExamId } : {})
    }));

    return {
      id: row.slug,
      name: row.exam_name,
      fullName: row.full_name || row.exam_name,
      category: row.category || row.board,
      icon: row.icon || '📝',
      totalQuestions: row.total_questions,
      totalTime: row.duration_minutes * 60,    // Convert minutes → seconds
      negativeMarking: (row.negative_marking || 0) > 0,
      negativeValue: parseFloat(row.negative_marking) || 0,
      marksPerQuestion: parseFloat(row.marks_per_question) || 1,
      sections,
      description: row.description || '',
      // Behavior config
      renderer: row.renderer_type || 'ssc',
      sectionLocking: !!row.section_locking,
      sectionTimers: !!row.section_timers,
      calculator: !!row.calculator_allowed,
      paletteType: row.palette_type || 'default',
      keyboardNav: !!row.keyboard_nav
    };
  },

  /**
   * Minimal fallback for offline/error — quick-10 and daily only
   */
  _loadFallback() {
    this._presets = {
      // ─── Quick Modes ───
      'quick-10': {
        id: 'quick-10', name: 'Quick 10', fullName: '10-Question Speed Round',
        category: 'Quick', icon: '⚡', totalQuestions: 10, totalTime: 300,
        negativeMarking: false, negativeValue: 0, marksPerQuestion: 1,
        sections: [{ name: 'Mixed', subject: 'all', questions: 10 }],
        description: '10 random questions, 5 min', renderer: 'ssc'
      },
      'daily-challenge': {
        id: 'daily-challenge', name: 'Daily Challenge', fullName: 'Daily 15-Question Challenge',
        category: 'Daily', icon: '🔥', totalQuestions: 15, totalTime: 600,
        negativeMarking: true, negativeValue: 0.25, marksPerQuestion: 1,
        sections: [
          { name: 'Math', subject: 'math', questions: 5 },
          { name: 'Reasoning', subject: 'reasoning', questions: 5 },
          { name: 'GK', subject: 'gk', questions: 5 }
        ],
        description: '15 questions, 10 min', renderer: 'ssc'
      },

      // ─── SSC CGL ───
      'ssc-cgl': {
        id: 'ssc-cgl', name: 'SSC CGL', fullName: 'SSC CGL Tier 1 — 2026',
        category: 'SSC', icon: '🎯', totalQuestions: 100, totalTime: 3600,
        negativeMarking: true, negativeValue: 0.50, marksPerQuestion: 2,
        sections: [
          { name: 'Quantitative Aptitude', subject: 'math', questions: 25 },
          { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 25 },
          { name: 'English Language', subject: 'english', questions: 25 },
          { name: 'General Awareness', subject: 'gk', questions: 25 }
        ],
        description: '100 questions, 60 min', renderer: 'ssc',
        sortOrder: 1
      },

      // ─── SSC CHSL ───
      'ssc-chsl': {
        id: 'ssc-chsl', name: 'SSC CHSL', fullName: 'SSC CHSL Tier 1 — 2026',
        category: 'SSC', icon: '📝', totalQuestions: 100, totalTime: 3600,
        negativeMarking: true, negativeValue: 0.50, marksPerQuestion: 2,
        sections: [
          { name: 'Quantitative Aptitude', subject: 'math', questions: 25 },
          { name: 'General Intelligence', subject: 'reasoning', questions: 25 },
          { name: 'English Language', subject: 'english', questions: 25 },
          { name: 'General Awareness', subject: 'gk', questions: 25 }
        ],
        description: '100 questions, 60 min', renderer: 'ssc',
        sortOrder: 2
      },

      // ─── SSC MTS ───
      'ssc-mts': {
        id: 'ssc-mts', name: 'SSC MTS', fullName: 'SSC MTS CBT — 2026',
        category: 'SSC', icon: '📋', totalQuestions: 90, totalTime: 5400,
        negativeMarking: true, negativeValue: 1.00, marksPerQuestion: 3,
        sections: [
          { name: 'Numerical Aptitude', subject: 'math', questions: 20 },
          { name: 'Reasoning & GI', subject: 'reasoning', questions: 20 },
          { name: 'English Language', subject: 'english', questions: 25 },
          { name: 'General Awareness', subject: 'gk', questions: 25 }
        ],
        description: '90 questions, 90 min', renderer: 'ssc',
        sortOrder: 3
      },

      // ─── SSC GD ───
      'ssc-gd': {
        id: 'ssc-gd', name: 'SSC GD Constable', fullName: 'SSC GD Constable CBT — 2026',
        category: 'SSC', icon: '🛡️', totalQuestions: 80, totalTime: 3600,
        negativeMarking: false, negativeValue: 0, marksPerQuestion: 2,
        sections: [
          { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 20 },
          { name: 'General Knowledge & GA', subject: 'gk', questions: 20 },
          { name: 'Elementary Mathematics', subject: 'math', questions: 20 },
          { name: 'English / Hindi', subject: 'english', questions: 20 }
        ],
        description: '80 questions, 60 min, no negative', renderer: 'ssc',
        sortOrder: 4
      },

      // ─── RRB NTPC ───
      'rrb-ntpc': {
        id: 'rrb-ntpc', name: 'RRB NTPC', fullName: 'RRB NTPC CBT 1 — 2026',
        category: 'Railway', icon: '🚆', totalQuestions: 100, totalTime: 5400,
        negativeMarking: true, negativeValue: 0.33, marksPerQuestion: 1,
        sections: [
          { name: 'Mathematics', subject: 'math', questions: 30 },
          { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 30 },
          { name: 'General Awareness', subject: 'gk', questions: 40 }
        ],
        description: '100 questions, 90 min', renderer: 'railway',
        sortOrder: 1
      },

      // ─── IBPS PO ───
      'ibps-po': {
        id: 'ibps-po', name: 'IBPS PO', fullName: 'IBPS PO Prelims — 2026',
        category: 'Banking', icon: '🏦', totalQuestions: 100, totalTime: 3600,
        negativeMarking: true, negativeValue: 0.25, marksPerQuestion: 1,
        sections: [
          { name: 'English Language', subject: 'english', questions: 30 },
          { name: 'Quantitative Aptitude', subject: 'math', questions: 35 },
          { name: 'Reasoning Ability', subject: 'reasoning', questions: 35 }
        ],
        description: '100 questions, 60 min', renderer: 'banking',
        sortOrder: 1
      }
    };
    this._loaded = true;
  },

  // ═══════════════════════════════════════════
  //  PUBLIC API — same interface as before
  // ═══════════════════════════════════════════

  /** Get preset by exam ID (slug) */
  get(examId) {
    return this._presets[examId] || null;
  },

  /** Get all presets */
  getAll() {
    return Object.values(this._presets);
  },

  /** Get presets by category */
  getByCategory(category) {
    return Object.values(this._presets).filter(p => p.category === category);
  },

  /** Get all category names */
  getCategories() {
    const cats = {};
    Object.values(this._presets).forEach(p => {
      if (!cats[p.category]) {
        cats[p.category] = { name: p.category, count: 0 };
      }
      cats[p.category].count++;
    });
    return Object.values(cats);
  },

  /** Get subjects needed for an exam preset */
  getSubjects(examId) {
    const preset = this.get(examId);
    if (!preset) return [];
    return preset.sections
      .map(s => s.subject)
      .filter(s => s !== 'all');
  },

  /** Build test config from preset (ready for TestEngine.createTest) */
  buildConfig(examId) {
    const preset = this.get(examId);
    if (!preset) return null;

    const subjects = this.getSubjects(examId);

    return {
      examId: preset.id,
      examName: preset.name,
      subjects: subjects.length > 0 ? subjects : [],
      numQuestions: preset.totalQuestions,
      totalTime: preset.totalTime,
      timeMode: 'manual',
      negativeMarking: preset.negativeMarking,
      negativeValue: preset.negativeValue,
      marksPerQuestion: preset.marksPerQuestion || 1,
      sections: preset.sections
    };
  },

  /** Format time for display */
  formatTime(seconds) {
    if (seconds >= 3600) return Math.round(seconds / 3600) + ' hr';
    return Math.round(seconds / 60) + ' min';
  },

  /** Format negative marking for display */
  formatNeg(preset) {
    if (!preset.negativeMarking) return 'No negative';
    return `-${preset.negativeValue} per wrong`;
  }
};

// Export to window for consistent access across scripts
window.ExamPresets = ExamPresets;
