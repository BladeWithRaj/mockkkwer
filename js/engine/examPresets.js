// ============================================
// EXAM PRESETS ENGINE
// Real exam patterns: timing, sections,
// negative marking, question distribution
// Backend-driven exam configs
// ============================================

const ExamPresets = {

  // ═══════════════════════════════════════════
  //  MASTER EXAM REGISTRY
  // ═══════════════════════════════════════════

  _presets: {
    // ────────────────────────────────────
    //  SSC
    // ────────────────────────────────────
    'ssc-cgl': {
      id: 'ssc-cgl',
      name: 'SSC CGL',
      fullName: 'Combined Graduate Level (Tier 1)',
      category: 'SSC',
      icon: '🎓',
      totalQuestions: 100,
      totalTime: 60 * 60, // 60 minutes
      negativeMarking: true,
      negativeValue: 0.50,
      marksPerQuestion: 2,
      sections: [
        { name: 'Quantitative Aptitude', subject: 'math', questions: 25 },
        { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 25 },
        { name: 'English Language', subject: 'english', questions: 25 },
        { name: 'General Awareness', subject: 'gk', questions: 25 }
      ],
      description: 'Exact SSC CGL Tier-1 pattern: 100 questions, 60 min, -0.50 marking'
    },

    'ssc-chsl': {
      id: 'ssc-chsl',
      name: 'SSC CHSL',
      fullName: 'Combined Higher Secondary (Tier 1)',
      category: 'SSC',
      icon: '📝',
      totalQuestions: 100,
      totalTime: 60 * 60,
      negativeMarking: true,
      negativeValue: 0.50,
      marksPerQuestion: 2,
      sections: [
        { name: 'Quantitative Aptitude', subject: 'math', questions: 25 },
        { name: 'General Intelligence', subject: 'reasoning', questions: 25 },
        { name: 'English Language', subject: 'english', questions: 25 },
        { name: 'General Awareness', subject: 'gk', questions: 25 }
      ],
      description: 'SSC CHSL pattern: 100 questions, 60 min, -0.50 per wrong'
    },

    'ssc-mts': {
      id: 'ssc-mts',
      name: 'SSC MTS',
      fullName: 'Multi Tasking Staff',
      category: 'SSC',
      icon: '🔧',
      totalQuestions: 75,
      totalTime: 45 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Numerical Aptitude', subject: 'math', questions: 20 },
        { name: 'Reasoning', subject: 'reasoning', questions: 20 },
        { name: 'English Language', subject: 'english', questions: 15 },
        { name: 'General Awareness', subject: 'gk', questions: 20 }
      ],
      description: 'SSC MTS pattern: 75 questions, 45 min, -0.25 marking'
    },

    'ssc-cpo': {
      id: 'ssc-cpo',
      name: 'SSC CPO',
      fullName: 'Central Police Organisation',
      category: 'SSC',
      icon: '🛡️',
      totalQuestions: 200,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Quantitative Aptitude', subject: 'math', questions: 50 },
        { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 50 },
        { name: 'English Comprehension', subject: 'english', questions: 50 },
        { name: 'General Knowledge', subject: 'gk', questions: 50 }
      ],
      description: 'SSC CPO pattern: 200 questions, 2 hours, -0.25 marking'
    },

    // ────────────────────────────────────
    //  RAILWAY
    // ────────────────────────────────────
    'rrb-ntpc': {
      id: 'rrb-ntpc',
      name: 'RRB NTPC',
      fullName: 'Non-Technical Popular Categories (CBT-1)',
      category: 'Railway',
      icon: '📊',
      totalQuestions: 100,
      totalTime: 90 * 60,
      negativeMarking: true,
      negativeValue: 0.33,
      marksPerQuestion: 1,
      sections: [
        { name: 'Mathematics', subject: 'math', questions: 30 },
        { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 30 },
        { name: 'General Awareness', subject: 'gk', questions: 40 }
      ],
      description: 'RRB NTPC CBT-1: 100 questions, 90 min, -1/3 marking'
    },

    'rrb-group-d': {
      id: 'rrb-group-d',
      name: 'RRB Group D',
      fullName: 'Level 1 Posts',
      category: 'Railway',
      icon: '⚙️',
      totalQuestions: 100,
      totalTime: 90 * 60,
      negativeMarking: true,
      negativeValue: 0.33,
      marksPerQuestion: 1,
      sections: [
        { name: 'Mathematics', subject: 'math', questions: 25 },
        { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 30 },
        { name: 'General Science', subject: 'science', questions: 25 },
        { name: 'General Awareness', subject: 'gk', questions: 20 }
      ],
      description: 'RRB Group D: 100 questions, 90 min, -1/3 marking'
    },

    'rrb-alp': {
      id: 'rrb-alp',
      name: 'RRB ALP',
      fullName: 'Assistant Loco Pilot (CBT-1)',
      category: 'Railway',
      icon: '🚆',
      totalQuestions: 75,
      totalTime: 60 * 60,
      negativeMarking: true,
      negativeValue: 0.33,
      marksPerQuestion: 1,
      sections: [
        { name: 'Mathematics', subject: 'math', questions: 20 },
        { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 25 },
        { name: 'General Science', subject: 'science', questions: 20 },
        { name: 'General Awareness', subject: 'gk', questions: 10 }
      ],
      description: 'RRB ALP CBT-1: 75 questions, 60 min, -1/3 marking'
    },

    // ────────────────────────────────────
    //  BANKING
    // ────────────────────────────────────
    'ibps-po': {
      id: 'ibps-po',
      name: 'IBPS PO',
      fullName: 'Probationary Officer (Prelims)',
      category: 'Banking',
      icon: '💼',
      totalQuestions: 100,
      totalTime: 60 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Quantitative Aptitude', subject: 'math', questions: 35 },
        { name: 'Reasoning Ability', subject: 'reasoning', questions: 35 },
        { name: 'English Language', subject: 'english', questions: 30 }
      ],
      description: 'IBPS PO Prelims: 100 questions, 60 min, -0.25 marking'
    },

    'ibps-clerk': {
      id: 'ibps-clerk',
      name: 'IBPS Clerk',
      fullName: 'Clerical Cadre (Prelims)',
      category: 'Banking',
      icon: '📋',
      totalQuestions: 100,
      totalTime: 60 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Numerical Ability', subject: 'math', questions: 35 },
        { name: 'Reasoning Ability', subject: 'reasoning', questions: 35 },
        { name: 'English Language', subject: 'english', questions: 30 }
      ],
      description: 'IBPS Clerk Prelims: 100 questions, 60 min, -0.25 marking'
    },

    'sbi-po': {
      id: 'sbi-po',
      name: 'SBI PO',
      fullName: 'Probationary Officer (Prelims)',
      category: 'Banking',
      icon: '🏛️',
      totalQuestions: 100,
      totalTime: 60 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Quantitative Aptitude', subject: 'math', questions: 35 },
        { name: 'Reasoning Ability', subject: 'reasoning', questions: 35 },
        { name: 'English Language', subject: 'english', questions: 30 }
      ],
      description: 'SBI PO Prelims: 100 questions, 60 min, -0.25 marking'
    },

    'sbi-clerk': {
      id: 'sbi-clerk',
      name: 'SBI Clerk',
      fullName: 'Junior Associate (Prelims)',
      category: 'Banking',
      icon: '📄',
      totalQuestions: 100,
      totalTime: 60 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Numerical Ability', subject: 'math', questions: 35 },
        { name: 'Reasoning Ability', subject: 'reasoning', questions: 35 },
        { name: 'English Language', subject: 'english', questions: 30 }
      ],
      description: 'SBI Clerk Prelims: 100 questions, 60 min, -0.25 marking'
    },

    // ────────────────────────────────────
    //  STATE EXAMS
    // ────────────────────────────────────
    'up-police': {
      id: 'up-police',
      name: 'UP Police',
      fullName: 'UP Police Constable',
      category: 'State',
      icon: '🔰',
      totalQuestions: 150,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Quantitative Aptitude', subject: 'math', questions: 38 },
        { name: 'General Intelligence', subject: 'reasoning', questions: 38 },
        { name: 'Hindi Language', subject: 'hindi', questions: 37 },
        { name: 'General Knowledge', subject: 'gk', questions: 37 }
      ],
      description: 'UP Police: 150 questions, 2 hours, -0.25 marking'
    },

    'bihar-si': {
      id: 'bihar-si',
      name: 'Bihar SI',
      fullName: 'Bihar Sub Inspector',
      category: 'State',
      icon: '⭐',
      totalQuestions: 200,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Mathematics', subject: 'math', questions: 50 },
        { name: 'General Intelligence', subject: 'reasoning', questions: 50 },
        { name: 'Hindi Language', subject: 'hindi', questions: 50 },
        { name: 'General Knowledge', subject: 'gk', questions: 50 }
      ],
      description: 'Bihar SI: 200 questions, 2 hours, -0.25 marking'
    },

    'mp-patwari': {
      id: 'mp-patwari',
      name: 'MP Patwari',
      fullName: 'Madhya Pradesh Patwari',
      category: 'State',
      icon: '📜',
      totalQuestions: 100,
      totalTime: 120 * 60,
      negativeMarking: false,
      negativeValue: 0,
      marksPerQuestion: 1,
      sections: [
        { name: 'Quantitative Aptitude', subject: 'math', questions: 25 },
        { name: 'General Intelligence', subject: 'reasoning', questions: 25 },
        { name: 'Hindi Language', subject: 'hindi', questions: 25 },
        { name: 'General Knowledge', subject: 'gk', questions: 25 }
      ],
      description: 'MP Patwari: 100 questions, 2 hours, no negative marking'
    },

    // ────────────────────────────────────
    //  QUICK MODES
    // ────────────────────────────────────
    'quick-10': {
      id: 'quick-10',
      name: 'Quick 10',
      fullName: '10-Question Speed Round',
      category: 'Quick',
      icon: '⚡',
      totalQuestions: 10,
      totalTime: 5 * 60,
      negativeMarking: false,
      negativeValue: 0,
      marksPerQuestion: 1,
      sections: [
        { name: 'Mixed', subject: 'all', questions: 10 }
      ],
      description: '10 random questions, 5 min — warm up!'
    },

    'daily-challenge': {
      id: 'daily-challenge',
      name: 'Daily Challenge',
      fullName: 'Daily 15-Question Challenge',
      category: 'Daily',
      icon: '🔥',
      totalQuestions: 15,
      totalTime: 10 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Math', subject: 'math', questions: 5 },
        { name: 'Reasoning', subject: 'reasoning', questions: 5 },
        { name: 'GK', subject: 'gk', questions: 5 }
      ],
      description: '15 questions, 10 min — daily streak builder!'
    }
  },

  // ═══════════════════════════════════════════
  //  PUBLIC API
  // ═══════════════════════════════════════════

  /** Get preset by exam ID */
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
