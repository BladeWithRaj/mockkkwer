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

    'ssc-gd': {
      id: 'ssc-gd',
      name: 'SSC GD',
      fullName: 'GD Constable',
      category: 'SSC',
      icon: '💂',
      totalQuestions: 80,
      totalTime: 60 * 60,
      negativeMarking: true,
      negativeValue: 0.50,
      marksPerQuestion: 2,
      sections: [
        { name: 'Mathematics', subject: 'math', questions: 20 },
        { name: 'Reasoning', subject: 'reasoning', questions: 20 },
        { name: 'English/Hindi', subject: 'english', questions: 20 },
        { name: 'General Awareness', subject: 'gk', questions: 20 }
      ],
      description: 'SSC GD Constable: 80 questions, 60 min, -0.50 marking'
    },

    'ssc-steno': {
      id: 'ssc-steno',
      name: 'SSC Steno',
      fullName: 'Stenographer Grade C & D',
      category: 'SSC',
      icon: '⌨️',
      totalQuestions: 200,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 50 },
        { name: 'General Awareness', subject: 'gk', questions: 50 },
        { name: 'English Language', subject: 'english', questions: 100 }
      ],
      description: 'SSC Steno: 200 questions, 2 hours, -0.25 marking'
    },

    'ssc-je': {
      id: 'ssc-je',
      name: 'SSC JE',
      fullName: 'Junior Engineer (Paper 1)',
      category: 'SSC',
      icon: '🔩',
      totalQuestions: 200,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Quantitative Aptitude', subject: 'math', questions: 50 },
        { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 50 },
        { name: 'General Awareness', subject: 'gk', questions: 50 },
        { name: 'English Language', subject: 'english', questions: 50 }
      ],
      description: 'SSC JE Paper-1: 200 questions, 2 hours, -0.25 marking'
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

    'rrb-je': {
      id: 'rrb-je',
      name: 'RRB JE',
      fullName: 'Junior Engineer (CBT-1)',
      category: 'Railway',
      icon: '🔧',
      totalQuestions: 100,
      totalTime: 90 * 60,
      negativeMarking: true,
      negativeValue: 0.33,
      marksPerQuestion: 1,
      sections: [
        { name: 'Mathematics', subject: 'math', questions: 30 },
        { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 25 },
        { name: 'General Awareness', subject: 'gk', questions: 15 },
        { name: 'General Science', subject: 'science', questions: 30 }
      ],
      description: 'RRB JE CBT-1: 100 questions, 90 min, -1/3 marking'
    },

    'rpf-constable': {
      id: 'rpf-constable',
      name: 'RPF Constable',
      fullName: 'Railway Protection Force',
      category: 'Railway',
      icon: '🛡️',
      totalQuestions: 120,
      totalTime: 90 * 60,
      negativeMarking: true,
      negativeValue: 0.33,
      marksPerQuestion: 1,
      sections: [
        { name: 'Arithmetic', subject: 'math', questions: 35 },
        { name: 'General Intelligence & Reasoning', subject: 'reasoning', questions: 35 },
        { name: 'General Awareness', subject: 'gk', questions: 50 }
      ],
      description: 'RPF Constable: 120 questions, 90 min, -1/3 marking'
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

    'rbi-assistant': {
      id: 'rbi-assistant',
      name: 'RBI Assistant',
      fullName: 'Reserve Bank Assistant (Prelims)',
      category: 'Banking',
      icon: '🏦',
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
      description: 'RBI Assistant Prelims: 100 questions, 60 min, -0.25 marking'
    },

    'ibps-rrb': {
      id: 'ibps-rrb',
      name: 'IBPS RRB',
      fullName: 'Regional Rural Bank Officer (Prelims)',
      category: 'Banking',
      icon: '🌾',
      totalQuestions: 80,
      totalTime: 45 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Quantitative Aptitude', subject: 'math', questions: 40 },
        { name: 'Reasoning Ability', subject: 'reasoning', questions: 40 }
      ],
      description: 'IBPS RRB Officer Prelims: 80 questions, 45 min, -0.25 marking'
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

    'raj-police': {
      id: 'raj-police',
      name: 'Raj Police',
      fullName: 'Rajasthan Police Constable',
      category: 'State',
      icon: '🏜️',
      totalQuestions: 150,
      totalTime: 120 * 60,
      negativeMarking: false,
      negativeValue: 0,
      marksPerQuestion: 1,
      sections: [
        { name: 'Reasoning', subject: 'reasoning', questions: 30 },
        { name: 'Mathematics', subject: 'math', questions: 30 },
        { name: 'Hindi', subject: 'hindi', questions: 30 },
        { name: 'GK & Current Affairs', subject: 'gk', questions: 30 },
        { name: 'Science', subject: 'science', questions: 30 }
      ],
      description: 'Raj Police: 150 questions, 2 hours, no negative marking'
    },

    'upsssc-pet': {
      id: 'upsssc-pet',
      name: 'UPSSSC PET',
      fullName: 'UP Preliminary Eligibility Test',
      category: 'State',
      icon: '📋',
      totalQuestions: 100,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Hindi', subject: 'hindi', questions: 15 },
        { name: 'Mathematics', subject: 'math', questions: 15 },
        { name: 'Reasoning', subject: 'reasoning', questions: 15 },
        { name: 'General Awareness', subject: 'gk', questions: 15 },
        { name: 'Science', subject: 'science', questions: 15 },
        { name: 'English', subject: 'english', questions: 10 },
        { name: 'History & Polity', subject: 'polity', questions: 15 }
      ],
      description: 'UPSSSC PET: 100 questions, 2 hours, -0.25 marking'
    },

    // ────────────────────────────────────
    //  DEFENCE
    // ────────────────────────────────────
    'cds': {
      id: 'cds',
      name: 'CDS',
      fullName: 'Combined Defence Services (GK)',
      category: 'Defence',
      icon: '⚔️',
      totalQuestions: 120,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.33,
      marksPerQuestion: 1,
      sections: [
        { name: 'General Knowledge', subject: 'gk', questions: 120 }
      ],
      description: 'CDS GK Paper: 120 questions, 2 hours, -1/3 marking'
    },

    'nda': {
      id: 'nda',
      name: 'NDA',
      fullName: 'National Defence Academy (GAT)',
      category: 'Defence',
      icon: '🎖️',
      totalQuestions: 150,
      totalTime: 150 * 60,
      negativeMarking: true,
      negativeValue: 0.33,
      marksPerQuestion: 1,
      sections: [
        { name: 'Mathematics', subject: 'math', questions: 30 },
        { name: 'General Science', subject: 'science', questions: 25 },
        { name: 'History', subject: 'history', questions: 25 },
        { name: 'Geography', subject: 'geography', questions: 20 },
        { name: 'Polity', subject: 'polity', questions: 20 },
        { name: 'English', subject: 'english', questions: 30 }
      ],
      description: 'NDA GAT: 150 questions, 2.5 hours, -1/3 marking'
    },

    'afcat': {
      id: 'afcat',
      name: 'AFCAT',
      fullName: 'Air Force Common Admission Test',
      category: 'Defence',
      icon: '✈️',
      totalQuestions: 100,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.33,
      marksPerQuestion: 3,
      sections: [
        { name: 'General Awareness', subject: 'gk', questions: 25 },
        { name: 'Verbal Ability', subject: 'english', questions: 25 },
        { name: 'Numerical Ability', subject: 'math', questions: 25 },
        { name: 'Reasoning & Military Aptitude', subject: 'reasoning', questions: 25 }
      ],
      description: 'AFCAT: 100 questions, 2 hours, -1/3 marking'
    },

    // ────────────────────────────────────
    //  TEACHING
    // ────────────────────────────────────
    'ctet': {
      id: 'ctet',
      name: 'CTET',
      fullName: 'Central Teacher Eligibility (Paper 1)',
      category: 'Teaching',
      icon: '📚',
      totalQuestions: 150,
      totalTime: 150 * 60,
      negativeMarking: false,
      negativeValue: 0,
      marksPerQuestion: 1,
      sections: [
        { name: 'Child Development & Pedagogy', subject: 'reasoning', questions: 30 },
        { name: 'Hindi Language', subject: 'hindi', questions: 30 },
        { name: 'English Language', subject: 'english', questions: 30 },
        { name: 'Mathematics', subject: 'math', questions: 30 },
        { name: 'Environmental Studies', subject: 'science', questions: 30 }
      ],
      description: 'CTET Paper-1: 150 questions, 2.5 hours, no negative'
    },

    'dsssb-tgt': {
      id: 'dsssb-tgt',
      name: 'DSSSB TGT',
      fullName: 'Delhi TGT (Tier 1)',
      category: 'Teaching',
      icon: '🎓',
      totalQuestions: 200,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.25,
      marksPerQuestion: 1,
      sections: [
        { name: 'Mental Ability & Reasoning', subject: 'reasoning', questions: 40 },
        { name: 'Quantitative Aptitude', subject: 'math', questions: 40 },
        { name: 'General Awareness', subject: 'gk', questions: 40 },
        { name: 'English Language', subject: 'english', questions: 40 },
        { name: 'Hindi Language', subject: 'hindi', questions: 40 }
      ],
      description: 'DSSSB TGT Tier-1: 200 questions, 2 hours, -0.25 marking'
    },

    'super-tet': {
      id: 'super-tet',
      name: 'SUPER TET',
      fullName: 'UP Super TET',
      category: 'Teaching',
      icon: '🏫',
      totalQuestions: 150,
      totalTime: 150 * 60,
      negativeMarking: false,
      negativeValue: 0,
      marksPerQuestion: 1,
      sections: [
        { name: 'Hindi', subject: 'hindi', questions: 20 },
        { name: 'Mathematics', subject: 'math', questions: 20 },
        { name: 'Science', subject: 'science', questions: 15 },
        { name: 'General Knowledge', subject: 'gk', questions: 30 },
        { name: 'Reasoning', subject: 'reasoning', questions: 15 },
        { name: 'English', subject: 'english', questions: 15 },
        { name: 'Child Psychology', subject: 'reasoning', questions: 20 },
        { name: 'Social Studies', subject: 'history', questions: 15 }
      ],
      description: 'UP Super TET: 150 questions, 2.5 hours, no negative'
    },

    // ────────────────────────────────────
    //  UPSC / PSC
    // ────────────────────────────────────
    'upsc-prelims': {
      id: 'upsc-prelims',
      name: 'UPSC Prelims',
      fullName: 'Civil Services Prelims (GS Paper 1)',
      category: 'UPSC',
      icon: '🏛️',
      totalQuestions: 100,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.33,
      marksPerQuestion: 2,
      sections: [
        { name: 'History & Culture', subject: 'history', questions: 15 },
        { name: 'Geography', subject: 'geography', questions: 15 },
        { name: 'Polity & Governance', subject: 'polity', questions: 15 },
        { name: 'Economy', subject: 'gk', questions: 15 },
        { name: 'Science & Technology', subject: 'science', questions: 15 },
        { name: 'Environment & Ecology', subject: 'science', questions: 10 },
        { name: 'Current Affairs', subject: 'gk', questions: 15 }
      ],
      description: 'UPSC Prelims GS-1: 100 questions, 2 hours, -1/3 marking'
    },

    'uppsc-prelims': {
      id: 'uppsc-prelims',
      name: 'UPPSC Prelims',
      fullName: 'UP PCS Prelims (GS Paper 1)',
      category: 'UPSC',
      icon: '📜',
      totalQuestions: 150,
      totalTime: 120 * 60,
      negativeMarking: true,
      negativeValue: 0.33,
      marksPerQuestion: 1,
      sections: [
        { name: 'History', subject: 'history', questions: 25 },
        { name: 'Geography', subject: 'geography', questions: 20 },
        { name: 'Polity', subject: 'polity', questions: 25 },
        { name: 'Science', subject: 'science', questions: 20 },
        { name: 'Economy & GK', subject: 'gk', questions: 30 },
        { name: 'Current Affairs', subject: 'gk', questions: 30 }
      ],
      description: 'UPPSC GS-1: 150 questions, 2 hours, -1/3 marking'
    },

    'bpsc-prelims': {
      id: 'bpsc-prelims',
      name: 'BPSC Prelims',
      fullName: 'Bihar PCS Prelims (GS)',
      category: 'UPSC',
      icon: '⚖️',
      totalQuestions: 150,
      totalTime: 120 * 60,
      negativeMarking: false,
      negativeValue: 0,
      marksPerQuestion: 1,
      sections: [
        { name: 'History', subject: 'history', questions: 25 },
        { name: 'Geography', subject: 'geography', questions: 25 },
        { name: 'Polity', subject: 'polity', questions: 25 },
        { name: 'Science', subject: 'science', questions: 25 },
        { name: 'General Knowledge', subject: 'gk', questions: 25 },
        { name: 'Current Affairs', subject: 'gk', questions: 25 }
      ],
      description: 'BPSC Prelims: 150 questions, 2 hours, no negative marking'
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
