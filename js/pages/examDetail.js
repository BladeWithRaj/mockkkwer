// ============================================
// EXAM DETAIL PAGE — Individual Exam Dashboard
// /exam?id=ssc-cgl, /exam?id=rrb-ntpc, etc.
// Shows: Stages (CBT only), Pattern, Syllabus, Tips
// Non-CBT stages (physical, typing, interview) are hidden
// ============================================

const ExamDetailPage = {

  // ── Exam-specific data ──
  // Each stage with status:'live' MUST have a presetId that maps to ExamPresets
  // Stages with type:'physical' are auto-filtered (not shown)
  _exams: {

    // ═══════════════════════════════
    //   SSC EXAMS
    // ═══════════════════════════════

    'ssc-cgl': {
      title: 'SSC CGL 2026',
      full: 'Combined Graduate Level Examination',
      board: 'SSC',
      icon: '🎯',
      color: '#2563EB',
      popular: true,
      flow: ['Tier 1 (CBT)', 'Tier 2 (CBT)', 'DEST/CPT', 'Document Verification', 'Final Selection'],
      stages: [
        { name: 'Tier 1 — Prelims', desc: '100 Questions · 60 Minutes · 4 Sections · −0.50 Negative', status: 'live', icon: '📘', presetId: 'ssc-cgl' },
        { name: 'Tier 2 — Mains', desc: 'Session I + II · Math, Reasoning, English, GK, Computer', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'SSC CGL PYQs (2019–2025) · Year-wise & Shift-wise', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SSC CGL Tier-1 Exam Pattern',
        rows: [
          ['Quantitative Aptitude', '25', '50', '15 min', '−0.50'],
          ['General Intelligence & Reasoning', '25', '50', '15 min', '−0.50'],
          ['English Language', '25', '50', '15 min', '−0.50'],
          ['General Awareness', '25', '50', '15 min', '−0.50']
        ],
        total: ['Total', '100', '200', '60 min', '—']
      },
      syllabus: [
        { subject: 'Quantitative Aptitude', topics: 'Number System, Percentage, Ratio & Proportion, Average, Profit & Loss, SI/CI, Time & Work, Time Speed Distance, Algebra, Geometry, Trigonometry, Mensuration, Data Interpretation' },
        { subject: 'General Intelligence & Reasoning', topics: 'Analogy, Classification, Series, Coding-Decoding, Blood Relations, Direction Sense, Venn Diagram, Syllogism, Matrix, Paper Folding, Mirror Image, Embedded Figures' },
        { subject: 'English Language', topics: 'Reading Comprehension, Cloze Test, Error Spotting, Fill in the Blanks, Synonyms/Antonyms, Idioms & Phrases, One Word Substitution, Sentence Improvement' },
        { subject: 'General Awareness', topics: 'History (Ancient, Medieval, Modern), Geography, Indian Polity, Economics, General Science (Physics, Chemistry, Biology), Current Affairs, Static GK' }
      ],
      tips: [
        { title: '⏱ Time Management', text: 'Allocate max 15 minutes per section. Solve easy questions first, attempt difficult ones later.' },
        { title: '🎯 Accuracy Over Speed', text: 'With −0.50 negative marking, guessing is risky. 70-80 correct > 100 attempted with low accuracy.' },
        { title: '📊 Daily Mock Tests', text: 'Take one mock test daily. Review analysis, identify weak areas, and focus on those topics.' }
      ]
    },

    'ssc-chsl': {
      title: 'SSC CHSL 2026',
      full: 'Combined Higher Secondary Level',
      board: 'SSC',
      icon: '📝',
      color: '#3B82F6',
      flow: ['Tier 1 (CBT)', 'Tier 2 (CBT+DEST)', 'Document Verification', 'Final Selection'],
      stages: [
        { name: 'Tier 1 — CBT', desc: '100 Questions · 60 Minutes · 4 Sections · −0.50 Negative', status: 'live', icon: '📘', presetId: 'ssc-chsl' },
        { name: 'Tier 2 — CBT + Skill Test', desc: 'Math, GK, English, Computer · DEST Typing Test', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'SSC CHSL PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SSC CHSL Tier-1 Exam Pattern',
        rows: [
          ['Quantitative Aptitude', '25', '50', '15 min', '−0.50'],
          ['General Intelligence', '25', '50', '15 min', '−0.50'],
          ['English Language', '25', '50', '15 min', '−0.50'],
          ['General Awareness', '25', '50', '15 min', '−0.50']
        ],
        total: ['Total', '100', '200', '60 min', '—']
      },
      syllabus: [
        { subject: 'Quantitative Aptitude', topics: 'Arithmetic, Algebra, Geometry, Trigonometry, Mensuration, Data Interpretation' },
        { subject: 'General Intelligence', topics: 'Analogies, Series, Classification, Coding-Decoding, Venn Diagram, Syllogism' },
        { subject: 'English Language', topics: 'Error Spotting, Cloze Test, Reading Comprehension, Synonyms, Antonyms, Idioms' },
        { subject: 'General Awareness', topics: 'History, Geography, Polity, Economics, Science, Current Affairs' }
      ],
      tips: [
        { title: '📖 Focus on Basics', text: 'CHSL is 10+2 level. Focus on conceptual clarity over complex problem solving.' },
        { title: '⚡ Speed Matters', text: '60 minutes for 100 questions means 36 seconds per question. Practice speed drills.' }
      ]
    },

    'ssc-mts': {
      title: 'SSC MTS 2026',
      full: 'Multi Tasking Staff',
      board: 'SSC',
      icon: '📋',
      color: '#0EA5E9',
      flow: ['CBT', 'Physical Test', 'Document Verification'],
      stages: [
        { name: 'Computer Based Test', desc: '90 Questions · 90 Minutes · Numerical, Reasoning, English, GA', status: 'live', icon: '📘', presetId: 'ssc-mts' },
        { name: 'Previous Year Papers', desc: 'SSC MTS PYQs (2020–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SSC MTS CBT Exam Pattern',
        rows: [
          ['Numerical Aptitude', '20', '60', '—', '−1.00'],
          ['Reasoning & GI', '20', '60', '—', '−1.00'],
          ['English Language', '25', '75', '—', '−1.00'],
          ['General Awareness', '25', '75', '—', '−1.00']
        ],
        total: ['Total', '90', '270', '90 min', '—']
      },
      syllabus: [
        { subject: 'Numerical Aptitude', topics: 'Number System, HCF/LCM, Percentage, Average, Ratio, Profit & Loss, SI/CI, Time & Work' },
        { subject: 'Reasoning', topics: 'Analogies, Classification, Series, Coding-Decoding, Directions, Blood Relations' },
        { subject: 'English', topics: 'Vocabulary, Grammar, Reading Comprehension, Sentence Correction' },
        { subject: 'General Awareness', topics: 'History, Geography, Polity, Economics, Science, Current Affairs' }
      ],
      tips: [
        { title: '📌 Easy Level', text: 'MTS is the easiest SSC exam. Focus on accuracy — cutoff is usually low but competition is high.' }
      ]
    },

    'ssc-gd': {
      title: 'SSC GD Constable 2026',
      full: 'General Duty Constable',
      board: 'SSC',
      icon: '🛡️',
      color: '#DC2626',
      popular: true,
      flow: ['CBT', 'PET/PST', 'Medical', 'Document Verification'],
      stages: [
        { name: 'Computer Based Test', desc: '80 Questions · 60 Minutes · 4 Sections · No Negative', status: 'live', icon: '📘', presetId: 'ssc-gd' },
        { name: 'Previous Year Papers', desc: 'SSC GD PYQs (2018–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SSC GD Constable Exam Pattern',
        rows: [
          ['General Intelligence & Reasoning', '20', '40', '—', 'No Neg'],
          ['General Knowledge & GA', '20', '40', '—', 'No Neg'],
          ['Elementary Mathematics', '20', '40', '—', 'No Neg'],
          ['English / Hindi', '20', '40', '—', 'No Neg']
        ],
        total: ['Total', '80', '160', '60 min', '—']
      },
      syllabus: [
        { subject: 'Reasoning', topics: 'Analogies, Classification, Series, Coding-Decoding, Matrix, Venn Diagram, Directions' },
        { subject: 'General Knowledge', topics: 'History, Geography, Polity, Economics, Science, Sports, Current Affairs' },
        { subject: 'Mathematics', topics: 'Number System, HCF/LCM, Decimals, Fractions, Percentage, Average, Ratio, SI/CI' },
        { subject: 'English/Hindi', topics: 'Vocabulary, Grammar, Comprehension, Fill in the Blanks, Error Detection' }
      ],
      tips: [
        { title: '✅ No Negative Marking', text: 'Attempt ALL questions. There is no penalty for wrong answers in SSC GD.' }
      ]
    },

    'ssc-cpo': {
      title: 'SSC CPO 2026',
      full: 'Central Police Organisation (Sub-Inspector)',
      board: 'SSC',
      icon: '👮',
      color: '#7C3AED',
      flow: ['Tier 1 (CBT)', 'Tier 2 (CBT)', 'Physical', 'Medical', 'Final Selection'],
      stages: [
        { name: 'Tier 1 — Paper I', desc: '200 Questions · 120 Minutes · 4 Sections · −0.25 Negative', status: 'live', icon: '📘', presetId: 'ssc-cpo' },
        { name: 'Tier 2 — Paper II', desc: 'English Language & Comprehension · 200 Questions', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'SSC CPO PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SSC CPO Tier-1 Exam Pattern',
        rows: [
          ['General Intelligence & Reasoning', '50', '50', '—', '−0.25'],
          ['General Knowledge & GA', '50', '50', '—', '−0.25'],
          ['Quantitative Aptitude', '50', '50', '—', '−0.25'],
          ['English Comprehension', '50', '50', '—', '−0.25']
        ],
        total: ['Total', '200', '200', '120 min', '—']
      },
      syllabus: [
        { subject: 'Reasoning', topics: 'Analogy, Classification, Series, Coding-Decoding, Venn Diagram, Syllogism, Matrix, Directions' },
        { subject: 'General Knowledge', topics: 'History, Geography, Polity, Economics, Science, Current Affairs, Static GK' },
        { subject: 'Quantitative Aptitude', topics: 'Number System, Percentage, Ratio, Profit & Loss, SI/CI, Algebra, Geometry, Trigonometry, Mensuration, DI' },
        { subject: 'English', topics: 'Reading Comprehension, Error Spotting, Fill in Blanks, Idioms, One Word Substitution, Sentence Improvement' }
      ],
      tips: [
        { title: '📏 200 Questions', text: 'CPO Tier 1 has 200 questions in 120 minutes — 36 seconds per question. Speed is key.' },
        { title: '🔍 English in Tier 2', text: 'CPO Tier 2 is only English. Start preparing Reading Comprehension and Grammar from Day 1.' }
      ]
    },

    'ssc-stenographer': {
      title: 'SSC Stenographer 2026',
      full: 'Stenographer Grade C & D',
      board: 'SSC',
      icon: '⌨️',
      color: '#0891B2',
      flow: ['CBT', 'Skill Test (Stenography)', 'Document Verification'],
      stages: [
        { name: 'Computer Based Test', desc: '200 Questions · 120 Minutes · 3 Sections · −0.25 Negative', status: 'live', icon: '📘', presetId: 'ssc-stenographer' },
        { name: 'Previous Year Papers', desc: 'SSC Steno PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SSC Stenographer Exam Pattern',
        rows: [
          ['General Intelligence & Reasoning', '50', '50', '—', '−0.25'],
          ['General Awareness', '50', '50', '—', '−0.25'],
          ['English Language', '100', '100', '—', '−0.25']
        ],
        total: ['Total', '200', '200', '120 min', '—']
      },
      syllabus: [
        { subject: 'Reasoning', topics: 'Analogies, Series, Classification, Coding-Decoding, Syllogism, Matrix, Venn Diagram' },
        { subject: 'General Awareness', topics: 'History, Geography, Polity, Economics, Science, Current Affairs' },
        { subject: 'English', topics: 'Reading Comprehension, Error Detection, Cloze Test, Vocabulary, Grammar, Sentence Structure' }
      ],
      tips: [
        { title: '📝 English is 50%', text: 'English carries 100 out of 200 marks. Focus heavily on grammar and comprehension.' }
      ]
    },

    // ═══════════════════════════════
    //   RAILWAY EXAMS
    // ═══════════════════════════════

    'rrb-ntpc': {
      title: 'RRB NTPC 2026',
      full: 'Non-Technical Popular Categories',
      board: 'Railway',
      icon: '🚆',
      color: '#059669',
      popular: true,
      flow: ['CBT 1', 'CBT 2', 'CBAT/Typing', 'Document Verification', 'Medical'],
      stages: [
        { name: 'CBT 1', desc: '100 Questions · 90 Minutes · Math, GI, GK', status: 'live', icon: '📘', presetId: 'rrb-ntpc' },
        { name: 'CBT 2', desc: '120 Questions · 90 Minutes · Advanced Level', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'RRB NTPC PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'RRB NTPC CBT-1 Exam Pattern',
        rows: [
          ['Mathematics', '30', '30', '—', '−⅓'],
          ['General Intelligence & Reasoning', '30', '30', '—', '−⅓'],
          ['General Awareness', '40', '40', '—', '−⅓']
        ],
        total: ['Total', '100', '100', '90 min', '—']
      },
      syllabus: [
        { subject: 'Mathematics', topics: 'Number System, Decimals, Fractions, LCM, HCF, Ratio, Percentage, Mensuration, Time & Work, Time & Distance, SI/CI, Profit & Loss, Algebra, Geometry, Trigonometry, Statistics' },
        { subject: 'General Intelligence & Reasoning', topics: 'Analogies, Number Series, Coding-Decoding, Mathematical Operations, Relationships, Syllogism, Venn Diagram, Data Interpretation' },
        { subject: 'General Awareness', topics: 'Current Events, History, Culture, Geography, Economics, Polity, General Science, Scientific Research, Sports' }
      ],
      tips: [
        { title: '📚 Focus on GK', text: 'General Awareness carries 40 marks — highest weightage. Read daily current affairs.' },
        { title: '⚡ Speed Math', text: 'Learn shortcut tricks. Railway exams reward speed over complex problem solving.' }
      ]
    },

    'rrb-group-d': {
      title: 'RRB Group D 2026',
      full: 'Level 1 Posts (Track Maintainer, Helper, etc.)',
      board: 'Railway',
      icon: '🔧',
      color: '#10B981',
      flow: ['CBT', 'PET', 'Document Verification', 'Medical'],
      stages: [
        { name: 'Computer Based Test', desc: '100 Questions · 90 Minutes · Math, Reasoning, Science, GK', status: 'live', icon: '📘', presetId: 'rrb-group-d' },
        { name: 'Previous Year Papers', desc: 'RRB Group D PYQs (2018–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'RRB Group D CBT Exam Pattern',
        rows: [
          ['Mathematics', '25', '25', '—', '−⅓'],
          ['General Intelligence & Reasoning', '30', '30', '—', '−⅓'],
          ['General Science', '25', '25', '—', '−⅓'],
          ['General Awareness & Current Affairs', '20', '20', '—', '−⅓']
        ],
        total: ['Total', '100', '100', '90 min', '—']
      },
      syllabus: [
        { subject: 'Mathematics', topics: 'Number System, BODMAS, Decimals, Fractions, LCM, HCF, Ratio, Percentage, Mensuration, Time & Work, Time & Distance, SI/CI, Profit & Loss, Algebra' },
        { subject: 'Reasoning', topics: 'Analogies, Classification, Number Series, Coding-Decoding, Mathematical Operations, Syllogism, Venn Diagram, Conclusions' },
        { subject: 'General Science', topics: 'Physics, Chemistry, Biology — 10th standard level, everyday science applications' },
        { subject: 'General Awareness', topics: 'Current Affairs, Indian History, Geography, Economy, Polity, Sports, Important Days' }
      ],
      tips: [
        { title: '🔬 Science is Key', text: 'General Science carries 25 marks. Revise 10th class NCERT thoroughly for Physics, Chemistry, Biology.' }
      ]
    },

    'rrb-alp': {
      title: 'RRB ALP 2026',
      full: 'Assistant Loco Pilot',
      board: 'Railway',
      icon: '🚂',
      color: '#0D9488',
      flow: ['CBT 1', 'CBT 2 (Part A + B)', 'CBAT', 'Document Verification'],
      stages: [
        { name: 'CBT 1', desc: '75 Questions · 60 Minutes · Math, GI, Science, GK', status: 'live', icon: '📘', presetId: 'rrb-alp' },
        { name: 'CBT 2 — Part A', desc: 'Screening — Math, Physics, Basics of Electrical', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'RRB ALP PYQs (2018–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'RRB ALP CBT-1 Exam Pattern',
        rows: [
          ['Mathematics', '20', '20', '—', '−⅓'],
          ['General Intelligence & Reasoning', '25', '25', '—', '−⅓'],
          ['General Science', '20', '20', '—', '−⅓'],
          ['General Awareness', '10', '10', '—', '−⅓']
        ],
        total: ['Total', '75', '75', '60 min', '—']
      },
      syllabus: [
        { subject: 'Mathematics', topics: 'Number System, BODMAS, Decimals, Fractions, LCM, HCF, Ratio, Percentage, Mensuration, Time & Work, SI/CI, Algebra' },
        { subject: 'Reasoning', topics: 'Analogies, Classification, Number Series, Coding-Decoding, Mathematical Operations, Syllogism, Directions, Venn Diagram' },
        { subject: 'General Science', topics: 'Physics (Heat, Light, Sound, Mechanics), Chemistry (Elements, Reactions), Biology (Human Body, Diseases)' },
        { subject: 'General Awareness', topics: 'Current Affairs, Indian Railways Knowledge, History, Geography, Polity' }
      ],
      tips: [
        { title: '🔌 Technical Focus', text: 'ALP CBT 2 Part B is trade-specific. Choose your trade wisely and prepare accordingly.' }
      ]
    },

    'rrb-je': {
      title: 'RRB JE 2026',
      full: 'Junior Engineer',
      board: 'Railway',
      icon: '⚙️',
      color: '#0284C7',
      flow: ['CBT 1', 'CBT 2 (Technical)', 'Document Verification'],
      stages: [
        { name: 'CBT 1', desc: '100 Questions · 90 Minutes · Math, Reasoning, GA, Science', status: 'live', icon: '📘', presetId: 'rrb-je' },
        { name: 'CBT 2 — Technical', desc: 'Branch-specific Technical Questions', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'RRB JE PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'RRB JE CBT-1 Exam Pattern',
        rows: [
          ['Mathematics', '30', '30', '—', '−⅓'],
          ['General Intelligence & Reasoning', '25', '25', '—', '−⅓'],
          ['General Awareness', '15', '15', '—', '−⅓'],
          ['General Science', '30', '30', '—', '−⅓']
        ],
        total: ['Total', '100', '100', '90 min', '—']
      },
      syllabus: [
        { subject: 'Mathematics', topics: 'Number System, Algebra, Geometry, Trigonometry, Statistics, Mensuration, Profit & Loss, SI/CI, Time & Work' },
        { subject: 'Reasoning', topics: 'Analogies, Series, Classification, Coding-Decoding, Blood Relations, Syllogism, Venn Diagram, Data Interpretation' },
        { subject: 'General Awareness', topics: 'Current Events, History, Geography, Polity, Economics, Science, Sports' },
        { subject: 'General Science', topics: 'Physics, Chemistry, Biology — Engineering-oriented basics' }
      ],
      tips: [
        { title: '🛠️ Technical Prep', text: 'CBT 2 is purely technical. Start CBT 1 prep now, but revise your engineering basics in parallel.' }
      ]
    },

    'rpf-constable': {
      title: 'RPF Constable 2026',
      full: 'Railway Protection Force',
      board: 'Railway',
      icon: '🛤️',
      color: '#16A34A',
      flow: ['CBT', 'PET/PMT', 'Document Verification'],
      stages: [
        { name: 'Computer Based Test', desc: '120 Questions · 90 Minutes · GA, Arithmetic, Reasoning', status: 'live', icon: '📘', presetId: 'rpf-constable' },
        { name: 'Previous Year Papers', desc: 'RPF PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'RPF Constable CBT Exam Pattern',
        rows: [
          ['General Awareness', '50', '50', '—', '−⅓'],
          ['Arithmetic', '35', '35', '—', '−⅓'],
          ['General Intelligence & Reasoning', '35', '35', '—', '−⅓']
        ],
        total: ['Total', '120', '120', '90 min', '—']
      },
      syllabus: [
        { subject: 'General Awareness', topics: 'Current Affairs, History, Geography, Polity, Economics, Science, Indian Railways Knowledge' },
        { subject: 'Arithmetic', topics: 'Number System, Percentage, Ratio, Average, Profit & Loss, SI/CI, Time & Work, Time & Distance' },
        { subject: 'Reasoning', topics: 'Analogies, Classification, Series, Coding-Decoding, Blood Relations, Directions, Venn Diagram' }
      ],
      tips: [
        { title: '🚂 Railway GK', text: 'RPF frequently asks questions about Indian Railways — history, zones, headquarters, recent developments.' }
      ]
    },

    // ═══════════════════════════════
    //   BANKING EXAMS
    // ═══════════════════════════════

    'ibps-po': {
      title: 'IBPS PO 2026',
      full: 'Probationary Officer',
      board: 'Banking',
      icon: '🏦',
      color: '#7C3AED',
      popular: true,
      flow: ['Prelims', 'Mains', 'Interview', 'Final Selection'],
      stages: [
        { name: 'Prelims', desc: '100 Questions · 60 Minutes · 3 Sections · Sectional Cutoff', status: 'live', icon: '📘', presetId: 'ibps-po' },
        { name: 'Mains', desc: '200 Questions · 180 Minutes · 5 Sections · Descriptive Test', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'IBPS PO PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'IBPS PO Prelims Exam Pattern',
        rows: [
          ['English Language', '30', '30', '20 min', '−0.25'],
          ['Quantitative Aptitude', '35', '35', '20 min', '−0.25'],
          ['Reasoning Ability', '35', '35', '20 min', '−0.25']
        ],
        total: ['Total', '100', '100', '60 min', '—']
      },
      syllabus: [
        { subject: 'English', topics: 'Reading Comprehension, Cloze Test, Para Jumbles, Fill in the Blanks, Error Detection, Vocabulary' },
        { subject: 'Quantitative Aptitude', topics: 'Simplification, Number Series, Data Interpretation, Quadratic Equations, Arithmetic' },
        { subject: 'Reasoning', topics: 'Seating Arrangement, Puzzle, Syllogism, Inequality, Blood Relations, Coding-Decoding, Input-Output' }
      ],
      tips: [
        { title: '📊 Sectional Cutoff', text: 'Banking exams have sectional cutoffs. You MUST clear each section individually.' },
        { title: '📈 DI is King', text: 'Data Interpretation is the highest scoring area. Practice 5 DI sets daily.' }
      ]
    },

    'sbi-po': {
      title: 'SBI PO 2026',
      full: 'State Bank Probationary Officer',
      board: 'Banking',
      icon: '🏛️',
      color: '#2563EB',
      flow: ['Prelims', 'Mains', 'Interview', 'Final Selection'],
      stages: [
        { name: 'Prelims', desc: '100 Questions · 60 Minutes · 3 Sections · −0.25 Negative', status: 'live', icon: '📘', presetId: 'sbi-po' },
        { name: 'Mains', desc: '200 Questions · 180 Minutes · 4 Sections + Descriptive', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'SBI PO PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SBI PO Prelims Exam Pattern',
        rows: [
          ['English Language', '30', '30', '20 min', '−0.25'],
          ['Quantitative Aptitude', '35', '35', '20 min', '−0.25'],
          ['Reasoning Ability', '35', '35', '20 min', '−0.25']
        ],
        total: ['Total', '100', '100', '60 min', '—']
      },
      syllabus: [
        { subject: 'English', topics: 'Reading Comprehension, Cloze Test, Para Jumbles, Error Detection, Vocabulary, Sentence Rearrangement' },
        { subject: 'Quantitative Aptitude', topics: 'Simplification, Number Series, Data Interpretation, Quadratic Equations, Arithmetic, Missing DI' },
        { subject: 'Reasoning', topics: 'Puzzles, Seating Arrangement, Syllogism, Inequality, Coding-Decoding, Blood Relations, Input-Output' }
      ],
      tips: [
        { title: '🏛️ SBI is Tougher', text: 'SBI PO is harder than IBPS PO. DI and Puzzles are more complex. Practice advanced sets.' },
        { title: '📝 Descriptive in Mains', text: 'SBI Mains has a descriptive paper (Essay + Letter). Practice writing regularly.' }
      ]
    },

    'ibps-clerk': {
      title: 'IBPS Clerk 2026',
      full: 'Clerical Cadre',
      board: 'Banking',
      icon: '📊',
      color: '#6D28D9',
      flow: ['Prelims', 'Mains', 'Provisional Allotment'],
      stages: [
        { name: 'Prelims', desc: '100 Questions · 60 Minutes · 3 Sections · −0.25 Negative', status: 'live', icon: '📘', presetId: 'ibps-clerk' },
        { name: 'Mains', desc: '190 Questions · 160 Minutes · 4 Sections · Sectional Timing', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'IBPS Clerk PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'IBPS Clerk Prelims Exam Pattern',
        rows: [
          ['English Language', '30', '30', '20 min', '−0.25'],
          ['Numerical Ability', '35', '35', '20 min', '−0.25'],
          ['Reasoning Ability', '35', '35', '20 min', '−0.25']
        ],
        total: ['Total', '100', '100', '60 min', '—']
      },
      syllabus: [
        { subject: 'English', topics: 'Reading Comprehension, Cloze Test, Error Spotting, Fill in the Blanks, Para Jumbles' },
        { subject: 'Numerical Ability', topics: 'Simplification, Number Series, Data Interpretation, Quadratic, Arithmetic Word Problems' },
        { subject: 'Reasoning', topics: 'Puzzles, Seating Arrangement, Syllogism, Inequality, Coding-Decoding, Blood Relations' }
      ],
      tips: [
        { title: '✅ No Interview', text: 'IBPS Clerk has no interview. Mains score = final merit. Focus entirely on Mains preparation.' }
      ]
    },

    'sbi-clerk': {
      title: 'SBI Clerk 2026',
      full: 'Junior Associates',
      board: 'Banking',
      icon: '💳',
      color: '#4F46E5',
      flow: ['Prelims', 'Mains', 'Local Language Test'],
      stages: [
        { name: 'Prelims', desc: '100 Questions · 60 Minutes · 3 Sections · −0.25 Negative', status: 'live', icon: '📘', presetId: 'sbi-clerk' },
        { name: 'Mains', desc: '190 Questions · 160 Minutes · 4 Sections', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'SBI Clerk PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'SBI Clerk Prelims Exam Pattern',
        rows: [
          ['English Language', '30', '30', '20 min', '−0.25'],
          ['Numerical Ability', '35', '35', '20 min', '−0.25'],
          ['Reasoning Ability', '35', '35', '20 min', '−0.25']
        ],
        total: ['Total', '100', '100', '60 min', '—']
      },
      syllabus: [
        { subject: 'English', topics: 'Reading Comprehension, Cloze Test, Error Spotting, Fill in the Blanks, Vocabulary' },
        { subject: 'Numerical Ability', topics: 'Simplification, Number Series, Data Interpretation, Quadratic Equations, Arithmetic' },
        { subject: 'Reasoning', topics: 'Puzzles, Seating, Syllogism, Inequality, Coding-Decoding, Blood Relations, Directions' }
      ],
      tips: [
        { title: '🌐 Local Language', text: 'SBI Clerk requires a local language proficiency test in the state you apply for.' }
      ]
    },

    'rbi-assistant': {
      title: 'RBI Assistant 2026',
      full: 'Reserve Bank of India Assistant',
      board: 'Banking',
      icon: '🏧',
      color: '#0891B2',
      flow: ['Prelims', 'Mains', 'Language Proficiency Test'],
      stages: [
        { name: 'Prelims', desc: '100 Questions · 60 Minutes · 3 Sections · −0.25 Negative', status: 'live', icon: '📘', presetId: 'rbi-assistant' },
        { name: 'Mains', desc: '200 Questions · 135 Minutes · 5 Sections', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'RBI Assistant PYQs (2020–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'RBI Assistant Prelims Exam Pattern',
        rows: [
          ['English Language', '30', '30', '20 min', '−0.25'],
          ['Numerical Ability', '35', '35', '20 min', '−0.25'],
          ['Reasoning Ability', '35', '35', '20 min', '−0.25']
        ],
        total: ['Total', '100', '100', '60 min', '—']
      },
      syllabus: [
        { subject: 'English', topics: 'Reading Comprehension, Cloze Test, Para Jumbles, Fill in Blanks, Error Detection' },
        { subject: 'Numerical Ability', topics: 'Simplification, Number Series, Data Interpretation, Quadratic, Arithmetic' },
        { subject: 'Reasoning', topics: 'Puzzles, Seating, Syllogism, Inequality, Coding-Decoding, Blood Relations' }
      ],
      tips: [
        { title: '🏦 RBI Standard', text: 'RBI exams have a slightly higher difficulty than IBPS. Expect complex DI and advanced puzzles.' }
      ]
    },

    'ibps-rrb-po': {
      title: 'IBPS RRB PO 2026',
      full: 'Regional Rural Bank — Officer Scale 1',
      board: 'Banking',
      icon: '🌾',
      color: '#15803D',
      flow: ['Prelims', 'Mains', 'Interview'],
      stages: [
        { name: 'Prelims', desc: '80 Questions · 45 Minutes · 2 Sections · −0.25 Negative', status: 'live', icon: '📘', presetId: 'ibps-rrb-po' },
        { name: 'Mains', desc: '200 Questions · 120 Minutes · 5 Sections', status: 'coming', icon: '📗' },
        { name: 'Previous Year Papers', desc: 'IBPS RRB PYQs (2019–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'IBPS RRB PO Prelims Exam Pattern',
        rows: [
          ['Quantitative Aptitude', '40', '40', '—', '−0.25'],
          ['Reasoning Ability', '40', '40', '—', '−0.25']
        ],
        total: ['Total', '80', '80', '45 min', '—']
      },
      syllabus: [
        { subject: 'Quantitative Aptitude', topics: 'Simplification, Number Series, Data Interpretation, Quadratic Equations, Arithmetic' },
        { subject: 'Reasoning', topics: 'Puzzles, Seating Arrangement, Syllogism, Inequality, Coding-Decoding, Blood Relations' }
      ],
      tips: [
        { title: '🌾 Rural Focus', text: 'IBPS RRB Prelims has only 2 sections (no English). This is the easiest banking prelims to crack.' }
      ]
    },

    // ═══════════════════════════════
    //   UPSC EXAMS
    // ═══════════════════════════════

    'upsc-prelims-gs1': {
      title: 'UPSC CSE Prelims 2026',
      full: 'Civil Services — General Studies Paper I',
      board: 'UPSC',
      icon: '🏛️',
      color: '#D97706',
      popular: true,
      flow: ['Prelims GS-I', 'Prelims CSAT', 'Mains', 'Interview', 'Final Selection'],
      stages: [
        { name: 'GS Paper I', desc: '100 Questions · 120 Minutes · 7 Sections · −⅓ Negative', status: 'live', icon: '📘', presetId: 'upsc-prelims-gs1' },
        { name: 'CSAT Paper II', desc: '80 Questions · 120 Minutes · Qualifying (33%)', status: 'live', icon: '📗', presetId: 'upsc-prelims-csat' },
        { name: 'Previous Year Papers', desc: 'UPSC CSE PYQs (2011–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'UPSC Prelims GS-I Exam Pattern',
        rows: [
          ['History & Culture', '15', '30', '—', '−⅓'],
          ['Geography', '15', '30', '—', '−⅓'],
          ['Indian Polity', '15', '30', '—', '−⅓'],
          ['Economy', '15', '30', '—', '−⅓'],
          ['Environment & Ecology', '15', '30', '—', '−⅓'],
          ['Science & Technology', '10', '20', '—', '−⅓'],
          ['Current Affairs', '15', '30', '—', '−⅓']
        ],
        total: ['Total', '100', '200', '120 min', '—']
      },
      syllabus: [
        { subject: 'History', topics: 'Ancient India, Medieval India, Modern India, Freedom Movement, Art & Culture, World History' },
        { subject: 'Geography', topics: 'Physical, Indian, World Geography, Climate, Resources, Agriculture, Urbanization' },
        { subject: 'Polity', topics: 'Constitution, Governance, Panchayati Raj, Public Policy, Rights Issues' },
        { subject: 'Economy', topics: 'Indian Economy, Banking, Planning, Poverty, External Sector, Budget' },
        { subject: 'Environment', topics: 'Ecology, Biodiversity, Climate Change, Environmental Impact, Sustainable Development' },
        { subject: 'Science & Tech', topics: 'Space, Nuclear, IT, Biotechnology, Defence Technology, Health' },
        { subject: 'Current Affairs', topics: 'National & International Events, Government Schemes, Awards, Sports' }
      ],
      tips: [
        { title: '📚 NCERT is Bible', text: 'Start with 6th to 12th NCERT books. They form 40-50% of prelims questions.' },
        { title: '🗞️ Current Affairs', text: 'Read The Hindu/Indian Express daily. Current affairs contribute 15-20 questions.' }
      ]
    },

    'upsc-capf': {
      title: 'UPSC CAPF 2026',
      full: 'Central Armed Police Forces (AC)',
      board: 'UPSC',
      icon: '🎖️',
      color: '#B45309',
      flow: ['Paper I (CBT)', 'Paper II (Descriptive)', 'Physical', 'Interview'],
      stages: [
        { name: 'Paper I — Objective', desc: '125 Questions · 120 Minutes · GA + Intelligence', status: 'live', icon: '📘', presetId: 'upsc-capf' },
        { name: 'Previous Year Papers', desc: 'UPSC CAPF PYQs (2017–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'UPSC CAPF Paper-I Exam Pattern',
        rows: [
          ['General Ability & Intelligence', '75', '150', '—', '−⅓'],
          ['General Studies', '50', '100', '—', '−⅓']
        ],
        total: ['Total', '125', '250', '120 min', '—']
      },
      syllabus: [
        { subject: 'General Ability & Intelligence', topics: 'Verbal, Non-verbal Reasoning, English Comprehension, Numerical Ability, Data Interpretation' },
        { subject: 'General Studies', topics: 'History, Geography, Polity, Economy, Science, International Relations, Current Affairs' }
      ],
      tips: [
        { title: '🎖️ Combined Prep', text: 'CAPF Paper I overlaps with UPSC Prelims GS. Prepare both simultaneously for maximum efficiency.' }
      ]
    },

    'upsc-epfo': {
      title: 'UPSC EPFO 2026',
      full: 'Employees Provident Fund Organisation — Enforcement Officer',
      board: 'UPSC',
      icon: '📑',
      color: '#92400E',
      flow: ['Prelims (CBT)', 'Mains (Descriptive)', 'Interview'],
      stages: [
        { name: 'Prelims — CBT', desc: '120 Questions · 120 Minutes · 8 Sections · −⅓ Negative', status: 'live', icon: '📘', presetId: 'upsc-epfo' },
        { name: 'Previous Year Papers', desc: 'UPSC EPFO PYQs (2017–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'UPSC EPFO Prelims Exam Pattern',
        rows: [
          ['General English', '20', '40', '—', '−⅓'],
          ['Indian Freedom Struggle', '15', '30', '—', '−⅓'],
          ['Current Events', '15', '30', '—', '−⅓'],
          ['Indian Polity', '15', '30', '—', '−⅓'],
          ['Economy & Social Security', '20', '40', '—', '−⅓'],
          ['General Accounting', '15', '30', '—', '−⅓'],
          ['General Science & IT', '10', '20', '—', '−⅓'],
          ['Quantitative Aptitude', '10', '20', '—', '−⅓']
        ],
        total: ['Total', '120', '240', '120 min', '—']
      },
      syllabus: [
        { subject: 'English', topics: 'Reading Comprehension, Grammar, Vocabulary, Sentence Correction' },
        { subject: 'Indian Freedom Struggle', topics: 'Major Movements, Important Leaders, Constitutional Development, Post-Independence' },
        { subject: 'Current Events', topics: 'National & International Events, Government Schemes, Awards' },
        { subject: 'Indian Polity', topics: 'Constitution, Governance, Amendments, Fundamental Rights, Directive Principles' },
        { subject: 'Economy', topics: 'Indian Economy, Social Security Laws (PF, ESI), Budget, Banking, Insurance' },
        { subject: 'Accounting', topics: 'Basic Accounting Principles, Balance Sheet, P&L Account, Auditing Basics' },
        { subject: 'General Science & IT', topics: 'Physics, Chemistry, Biology Basics, Computer Fundamentals, Cyber Security' },
        { subject: 'Quantitative Aptitude', topics: 'Simplification, Percentage, Ratio, Average, Profit & Loss, SI/CI, Time & Work' }
      ],
      tips: [
        { title: '📋 Labour Laws', text: 'EPFO specifically tests Social Security and Labour Laws. Study PF Act, ESI Act thoroughly.' }
      ]
    },

    'uppsc-prelims': {
      title: 'UPPSC PCS 2026',
      full: 'Uttar Pradesh Public Service Commission',
      board: 'UPSC',
      icon: '🗺️',
      color: '#A16207',
      flow: ['Prelims', 'Mains', 'Interview', 'Final Selection'],
      stages: [
        { name: 'GS Paper I', desc: '150 Questions · 120 Minutes · GS + UP Special', status: 'live', icon: '📘', presetId: 'uppsc-prelims' },
        { name: 'Previous Year Papers', desc: 'UPPSC PYQs (2017–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'UPPSC Prelims GS Paper-I Pattern',
        rows: [
          ['General Studies', '100', '200', '—', '−⅓'],
          ['Current Affairs & UP Special', '50', '100', '—', '−⅓']
        ],
        total: ['Total', '150', '300', '120 min', '—']
      },
      syllabus: [
        { subject: 'General Studies', topics: 'History, Geography, Polity, Economy, Science, Environment' },
        { subject: 'UP Special', topics: 'UP History, UP Geography, UP Economy, UP Culture, UP Government Schemes' }
      ],
      tips: [
        { title: '🗺️ UP Focus', text: 'UPPSC always asks 15-20 questions on UP-specific topics. Know UP districts, rivers, festivals.' }
      ]
    },

    'bpsc-prelims': {
      title: 'BPSC PCS 2026',
      full: 'Bihar Public Service Commission',
      board: 'UPSC',
      icon: '📋',
      color: '#CA8A04',
      flow: ['Prelims', 'Mains', 'Interview', 'Final Selection'],
      stages: [
        { name: 'GS Paper', desc: '150 Questions · 120 Minutes · No Negative Marking', status: 'live', icon: '📘', presetId: 'bpsc-prelims' },
        { name: 'Previous Year Papers', desc: 'BPSC PYQs (2015–2025)', status: 'coming', icon: '📄' }
      ],
      pattern: {
        title: 'BPSC Prelims GS Pattern',
        rows: [
          ['General Studies', '100', '100', '—', 'No Neg'],
          ['Current Affairs & Bihar Special', '50', '50', '—', 'No Neg']
        ],
        total: ['Total', '150', '150', '120 min', '—']
      },
      syllabus: [
        { subject: 'General Studies', topics: 'History, Geography, Polity, Economy, Science, Environment' },
        { subject: 'Bihar Special', topics: 'Bihar History, Bihar Geography, Bihar Economy, Bihar Culture, Government Schemes' }
      ],
      tips: [
        { title: '✅ No Negative', text: 'BPSC has no negative marking. Attempt ALL 150 questions — leave nothing blank.' }
      ]
    }
  },

  // ═══════════════════════════════════════════
  // HELPER: Filter stages to only show CBT stages
  // ═══════════════════════════════════════════
  _getVisibleStages(exam) {
    // Keywords that indicate non-simulatable physical/skill tests
    const excludeKeywords = [
      'physical', 'pet', 'pst', 'pmt', 'medical', 'running',
      'typing', 'stenography', 'skill test', 'document verification',
      'interview', 'final selection', 'provisional allotment',
      'local language', 'language proficiency'
    ];
    return (exam.stages || []).filter(stage => {
      const nameLower = stage.name.toLowerCase();
      const descLower = (stage.desc || '').toLowerCase();
      return !excludeKeywords.some(kw => nameLower.includes(kw) || descLower.includes(kw));
    });
  },

  // ═══════════════════════════════════════════
  // HELPER: Check if exam has only 1 live CBT stage
  // ═══════════════════════════════════════════
  _hasSingleLiveStage(exam) {
    const visible = this._getVisibleStages(exam);
    const liveStages = visible.filter(s => s.status === 'live');
    return liveStages.length === 1;
  },

  // ── Get exam list for a board ──
  getExamsForBoard(boardId) {
    return Object.entries(this._exams)
      .filter(([_, exam]) => exam.board === boardId)
      .map(([id, exam]) => ({ id, ...exam }));
  },

  // ══════════════════════════════════════════════
  //  START METHODS
  // ══════════════════════════════════════════════
  _startStage(presetId) {
    App.navigate('setup', { preset: presetId });
  },

  // Backward compat alias (used from older onclick references)
  startPresetExam(presetId) {
    this._startStage(presetId);
  },

  // ══════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════
  render(params) {
    const examId = params?.id;
    const exam = this._exams[examId];

    if (!exam) {
      return `
        <div class="empty-state" style="padding-top: 120px;">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-title">Exam Not Found</div>
          <p style="color: var(--text-muted);">The requested exam doesn't exist yet.</p>
          <button class="btn btn-primary" onclick="App.navigate('home')" style="margin-top: 16px;">← Back to Home</button>
        </div>
      `;
    }

    // Get only CBT-visible stages
    const visibleStages = this._getVisibleStages(exam);

    // If single live stage, skip stage selection — go directly to setup
    if (this._hasSingleLiveStage(exam) && visibleStages.length <= 2) {
      const liveStage = visibleStages.find(s => s.status === 'live');
      if (liveStage?.presetId) {
        // Brief redirect — show for a moment then navigate
        setTimeout(() => this._startStage(liveStage.presetId), 0);
        return `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; gap: 16px;">
            <div style="font-size: 40px;">${exam.icon}</div>
            <div style="font-size: 18px; font-weight: 700; color: var(--text-primary); font-family: var(--font-display);">${exam.title}</div>
            <p style="color: var(--text-muted); font-size: 14px;">Loading test setup...</p>
          </div>
        `;
      }
    }

    return `
      <div class="page-enter" style="--board-color: ${exam.color};">

        <!-- Hero -->
        <section class="bp-hero">
          <div class="bp-breadcrumb">
            <a href="#home">Home</a>
            <span>›</span>
            <a href="#board?id=${exam.board}" style="color: var(--text-secondary);">${exam.board}</a>
            <span>›</span>
            <span style="color: var(--text-primary); font-weight: 500;">${exam.title}</span>
          </div>

          <h1 class="bp-title">${exam.icon} ${exam.title}</h1>
          <p class="bp-sub">${exam.full}</p>

          <!-- Selection Flow Bar -->
          <div class="bp-flow-bar">
            <span class="bp-flow-label">📋 Selection Process:</span>
            ${exam.flow.map((step, i) => `
              <span class="bp-flow-step ${i === 0 ? 'active' : ''}">${step}</span>
              ${i < exam.flow.length - 1 ? '<span class="bp-flow-arrow">→</span>' : ''}
            `).join('')}
          </div>
        </section>

        <!-- ═══ SELECTION STAGES (CBT only) ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">Choose Your Stage</h2>
          <p class="bp-section-sub">Select a stage to start practicing</p>

          <div class="bp-stages-list">
            ${visibleStages.map((stage, i) => `
              <div class="bp-stage-card ${stage.status === 'coming' ? 'bp-stage-coming' : 'bp-stage-live-clickable'}"
                   style="animation: fadeInUp 0.4s ${0.06 * i}s ease both;${stage.status === 'live' ? 'cursor:pointer;' : ''}"
                   ${stage.status === 'live' && stage.presetId ? `onclick="ExamDetailPage._startStage('${stage.presetId}')"` : ''}>
                <div class="bp-stage-left">
                  <span class="bp-stage-icon">${stage.icon}</span>
                  <div>
                    <div class="bp-stage-name">${stage.name}</div>
                    <div class="bp-stage-desc">${stage.desc}</div>
                  </div>
                </div>
                <div class="bp-stage-right">
                  ${stage.status === 'live'
                    ? `<button class="bp-stage-start-btn" style="--board-color: ${exam.color};">▶ Start Test</button>`
                    : `<span class="bp-stage-badge bp-badge-soon">🔜 Coming Soon</span>`
                  }
                </div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ═══ EXAM PATTERN ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">${exam.pattern.title}</h2>
          <p class="bp-section-sub">Our mock tests follow the exact same pattern</p>
          <div class="bp-table-wrap">
            <table class="bp-table">
              <thead>
                <tr><th>Section</th><th>Questions</th><th>Max Marks</th><th>Time</th><th>Negative</th></tr>
              </thead>
              <tbody>
                ${exam.pattern.rows.map(r => `
                  <tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td></tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr class="bp-table-total">
                  <td><strong>${exam.pattern.total[0]}</strong></td>
                  <td><strong>${exam.pattern.total[1]}</strong></td>
                  <td><strong>${exam.pattern.total[2]}</strong></td>
                  <td><strong>${exam.pattern.total[3]}</strong></td>
                  <td>${exam.pattern.total[4]}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <!-- ═══ SYLLABUS ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">Syllabus</h2>
          <p class="bp-section-sub">Subject-wise important topics</p>
          <div class="bp-syllabus-list">
            ${exam.syllabus.map((s, i) => `
              <div class="bp-syllabus-item ${i === 0 ? 'open' : ''}" id="syllabus-${i}">
                <button class="bp-syllabus-q" onclick="document.getElementById('syllabus-${i}').classList.toggle('open')">${s.subject}</button>
                <div class="bp-syllabus-a">${s.topics}</div>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ═══ PREPARATION TIPS ═══ -->
        <section class="bp-section">
          <h2 class="bp-section-title">Preparation Tips</h2>
          <p class="bp-section-sub">Top strategies for ${exam.title}</p>
          <div class="bp-tips-grid">
            ${exam.tips.map(tip => `
              <div class="bp-tip-card">
                <div class="bp-tip-title">${tip.title}</div>
                <p class="bp-tip-text">${tip.text}</p>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- Back -->
        <div style="text-align: center; padding: 0 24px 48px;">
          <button class="hp5-btn-secondary" onclick="App.navigate('board', {id: '${exam.board}'})" style="font-size: 14px;">
            ← Back to ${exam.board} Exams
          </button>
        </div>
      </div>
    `;
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent("page_view", { page: "exam_detail", exam: App.params?.id });
  }
};

window.ExamDetailPage = ExamDetailPage;

// Backward compat: some old code calls HomePage.startPresetExam
if (typeof HomePage !== 'undefined' && !HomePage.startPresetExam) {
  HomePage.startPresetExam = function(presetId) {
    ExamDetailPage._startStage(presetId);
  };
}
