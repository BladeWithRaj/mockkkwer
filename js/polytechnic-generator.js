(function() {
  'use strict';

  const SUBJECTS_DB = {
    // ── SEMESTER-1 — Fully isolated from Semester-2 ──
    semester1: [
      {
        id: 9, name: 'Mathematics-I', code: '4101', renderer: 'PATTERN_MATH', marks: 60, semester: 1,
        subject_category: 'core_theory', generation_mode: 'advanced_prediction', prediction_priority: 10,
        topics: ['Algebra','Trigonometry','Coordinate Geometry','Differential Calculus-I','Statistics & Probability'],
        importantTopics: ['Trigonometric identities','Quadratic equations','Compound angles','Permutation & Combination','Differentiation rules','Straight lines','Binomial theorem'],
        profile: { style: 'symbolic', keyVerbs: ['Find','Solve','Evaluate','Prove'] },
        pattern: [
          { part: 'Part A', type: 'Objective (MCQ + Fill + True/False)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Part B', type: 'Very Short Answer (Numericals/Formula)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Part C', type: 'Short Answer (Derivations/Proofs)', attempt: 'Attempt any 8 of 10', marks: '8 × 2½ = 20' },
          { part: 'Part D', type: 'Long Answer (Full Problems)', attempt: 'Attempt any 4 of 6', marks: '4 × 5 = 20' }
        ],
        units: [
          { no: 1, name: 'Algebra', weight: 22 },
          { no: 2, name: 'Trigonometry', weight: 28 },
          { no: 3, name: 'Coordinate Geometry', weight: 20 },
          { no: 4, name: 'Differential Calculus-I', weight: 22 },
          { no: 5, name: 'Statistics & Probability', weight: 8 }
        ]
      },
      {
        id: 10, name: 'Applied Physics-I', code: '4102', renderer: 'PATTERN_GENERAL', marks: 60, semester: 1,
        subject_category: 'core_theory', generation_mode: 'advanced_prediction', prediction_priority: 9,
        topics: ['Units & Dimensions','Motion','Newton\'s Laws','Work & Energy','Rotational Motion','Heat & Thermodynamics','Elasticity'],
        importantTopics: ['Equations of motion','Newton\'s 3 laws','Work-energy theorem','Specific heat calorimetry','Moment of inertia','Young\'s modulus'],
        profile: { style: 'conceptual_numerical', keyVerbs: ['Define','Derive','Calculate','State and prove'], numericalPct: 50 },
        pattern: [
          { part: 'Section A', type: 'Very Short (MCQ/Fill/True-False/1-word)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Definitions/Notes)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Long Answer (Theory + Diagrams)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Numerical Problems', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Units, Dimensions & Motion', weight: 25 },
          { no: 2, name: 'Newton\'s Laws & Work-Energy', weight: 28 },
          { no: 3, name: 'Rotational Motion', weight: 18 },
          { no: 4, name: 'Heat & Thermodynamics', weight: 20 },
          { no: 5, name: 'Elasticity & Properties of Matter', weight: 9 }
        ]
      },
      {
        id: 11, name: 'Applied Chemistry', code: '4103', renderer: 'PATTERN_GENERAL', marks: 60, semester: 1,
        subject_category: 'core_theory', generation_mode: 'advanced_prediction', prediction_priority: 9,
        topics: ['Atomic Structure','Chemical Bonding','Acids & Bases','Water Treatment','Fuels','Lubricants','Polymers'],
        importantTopics: ['Bohr model','Ionic & covalent bonding','Hard water treatment','pH calculation','Calorific value','Polymer classification'],
        profile: { style: 'theory_application', keyVerbs: ['Define','Explain','Differentiate','Write short note on'], numericalPct: 20 },
        pattern: [
          { part: 'Section A', type: 'Very Short (MCQ/Fill/True-False/Define)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Definitions/Differences)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Long Answer (Theory/Applications)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Detailed Theory / Industrial Applications', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Atomic Structure & Chemical Bonding', weight: 20 },
          { no: 2, name: 'Acids, Bases & Electrochemistry', weight: 20 },
          { no: 3, name: 'Water & Its Treatment', weight: 22 },
          { no: 4, name: 'Fuels & Lubricants', weight: 20 },
          { no: 5, name: 'Polymers & Modern Materials', weight: 18 }
        ]
      },
      {
        id: 12, name: 'Communication Skills in English', code: '4104', renderer: 'PATTERN_GENERAL', marks: 60, semester: 1,
        subject_category: 'core_theory', generation_mode: 'advanced_prediction', prediction_priority: 8,
        topics: ['Grammar','Letter Writing','Comprehension','Precis Writing','Report Writing','Essay Writing','Vocabulary'],
        importantTopics: ['Formal letter format','Job application letter','Precis writing','Grammar correction','Essay writing','Comprehension passage'],
        profile: { style: 'language_practical', keyVerbs: ['Write','Explain','Correct','Draft'], numericalPct: 0 },
        pattern: [
          { part: 'Section A', type: 'Very Short (MCQ/Fill/Grammar/Vocabulary)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Grammar/Comprehension)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Writing — Letters/Reports/Precis', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Long Writing — Essay/Detailed Letter/Report', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Grammar & Vocabulary', weight: 22 },
          { no: 2, name: 'Reading & Comprehension', weight: 15 },
          { no: 3, name: 'Letter & Email Writing', weight: 25 },
          { no: 4, name: 'Reports & Precis Writing', weight: 20 },
          { no: 5, name: 'Essays & Functional Writing', weight: 18 }
        ]
      },
      {
        id: 13, name: 'Engineering Mechanics', code: '4105', renderer: 'PATTERN_GENERAL', marks: 60, semester: 1,
        subject_category: 'core_theory', generation_mode: 'advanced_prediction', prediction_priority: 9,
        topics: ['Force System','Lami\'s Theorem','Moments','Friction','Centroid','Simple Machines','Equilibrium'],
        importantTopics: ['Lami\'s theorem','Resultant of forces','Varignon\'s theorem','Coefficient of friction','Centroid of composite figures','MA & VR of machines'],
        profile: { style: 'numerical_mechanics', keyVerbs: ['Find','Calculate','State and prove','Derive'], numericalPct: 65 },
        pattern: [
          { part: 'Section A', type: 'Very Short (MCQ/Fill/True-False/Define)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Derivations/Theorems)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Numerical Problems (Medium)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Long Numericals & Proofs', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Force System & Resultants', weight: 25 },
          { no: 2, name: 'Moments & Couples', weight: 20 },
          { no: 3, name: 'Equilibrium & Friction', weight: 25 },
          { no: 4, name: 'Centroid & Centre of Gravity', weight: 20 },
          { no: 5, name: 'Simple Lifting Machines', weight: 10 }
        ]
      },
      {
        id: 14, name: 'Environmental Science', code: '4106', renderer: 'PATTERN_GENERAL', marks: 60, semester: 1,
        subject_category: 'qualifying', generation_mode: 'pass_assist', prediction_priority: 2,
        topics: ['Ecosystem','Air Pollution','Water Pollution','Global Warming','Ozone Depletion','Renewable Energy','Waste Management'],
        importantTopics: ['Pollution types causes effects','Greenhouse effect','Ozone layer depletion','Food chain food web','Renewable energy sources','3R principle'],
        profile: { style: 'awareness_theory', keyVerbs: ['Define','Explain','What are causes of','Write short note on'], numericalPct: 0 },
        pattern: [
          { part: 'Section A', type: 'Very Short (MCQ/Fill/True-False/Define)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Causes/Effects/Definitions)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Long Answer (Pollution/Environment)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Detailed Theory / Environmental Issues', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Environment & Ecosystem', weight: 18 },
          { no: 2, name: 'Pollution — Types & Control', weight: 28 },
          { no: 3, name: 'Global Environmental Issues', weight: 22 },
          { no: 4, name: 'Natural Resources & Renewable Energy', weight: 18 },
          { no: 5, name: 'Waste Management & Sustainability', weight: 14 }
        ]
      },
      {
        id: 15, name: 'Engineering Workshop Practice', code: '4107', renderer: 'PATTERN_GENERAL', marks: 60, semester: 1, optional: true,
        subject_category: 'practical', generation_mode: 'viva_and_practical', prediction_priority: 2,
        topics: ['Carpentry','Fitting','Welding','Smithy','Foundry','Lathe Machine','Workshop Safety'],
        importantTopics: ['Types of welding','Welding joints','Fitting tools','Carpentry joints','PPE safety rules','Lathe machine parts'],
        profile: { style: 'practical_workshop', keyVerbs: ['Name','State','Explain','Draw and label'], numericalPct: 0 },
        pattern: [
          { part: 'Section A', type: 'Very Short (Tool ID/True-False/Fill)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Safety/Tools/Differences)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Long Answer (Processes with diagrams)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Detailed Process / Workshop Operations', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Carpentry & Wood Working', weight: 20 },
          { no: 2, name: 'Fitting & Sheet Metal', weight: 22 },
          { no: 3, name: 'Welding', weight: 25 },
          { no: 4, name: 'Smithy & Foundry', weight: 18 },
          { no: 5, name: 'Machine Shop & Safety', weight: 15 }
        ]
      },
      {
        id: 16, name: 'Engineering Graphics', code: '4108', renderer: 'PATTERN_GENERAL', marks: 60, semester: 1, optional: true,
        subject_category: 'practical', generation_mode: 'viva_and_practical', prediction_priority: 2,
        topics: ['Drawing Instruments','Scales','Projection of Points','Projection of Lines','Orthographic Projection','Isometric Projection','Sectional Views'],
        importantTopics: ['Orthographic three views','First/Third angle projection','Projection of lines','Isometric drawing','Sectional views','Plain scale construction'],
        profile: { style: 'drawing_oriented', keyVerbs: ['Draw','Construct','Project','Find true length'], numericalPct: 10 },
        pattern: [
          { part: 'Section A', type: 'Very Short (Definitions/True-False/Fill)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Theory/RF/Differences)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Drawing Problems (Projections)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Long Drawing Problems (Ortho/Isometric)', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Introduction & Drawing Instruments', weight: 15 },
          { no: 2, name: 'Projection of Points & Lines', weight: 22 },
          { no: 3, name: 'Projection of Planes & Solids', weight: 22 },
          { no: 4, name: 'Orthographic & Isometric Projection', weight: 28 },
          { no: 5, name: 'Sectional Views', weight: 13 }
        ]
      }
    ],
    semester2: [
      {
        id: 1, name: 'Mathematics-II', code: '4201', renderer: 'PATTERN_MATH', marks: 60,
        topics: ['Determinants','Matrices','Differential Calculus','Integral Calculus','Differential Equations','Coordinate Geometry','Vector Algebra'],
        profile: { style: 'symbolic', keyVerbs: ['Find','Solve','Evaluate','Prove','Derive'] },
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
        topics: ['DC Circuits','Kirchhoff Laws','EM Induction','AC Circuits','Transformers','Induction Motors','PN Junction','MOSFET','Logic Gates','CRO'],
        profile: { style: 'descriptive', keyVerbs: ['Explain','Differentiate','State and explain','Draw and explain'] },
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
      },
      {
        id: 3, name: 'Applied Physics-II', code: '4202', renderer: 'PATTERN_GENERAL', marks: 60, optional: false,
        topics: ['Wave Motion','Ultrasonics','Optics & Laser','Electrostatics','Current Electricity','Electromagnetism','Semiconductor Physics'],
        profile: { style: 'mixed', keyVerbs: ['Define','Derive','Calculate','Explain','State and prove'], numericalPct: 40 },
        pattern: [
          { part: 'Section A', type: 'Very Short (MCQ/Fill/True-False/1-word)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Definitions/Short notes)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Long Answer (Theory + Diagrams)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Long / Numerical Problems', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Wave Motion & Acoustics', weight: 22 },
          { no: 2, name: 'Optics (TIR, Optical Fiber, LASER)', weight: 22 },
          { no: 3, name: 'Electrostatics & Current Electricity', weight: 20 },
          { no: 4, name: 'Electromagnetism', weight: 18 },
          { no: 5, name: 'Semiconductor Physics', weight: 18 }
        ]
      },
      {
        id: 4, name: 'Introduction to IT Systems', code: '4203', renderer: 'PATTERN_GENERAL', marks: 60, optional: false,
        topics: ['Computer Basics','Hardware','Operating Systems','MS Office','Internet','Networking','Cyber Security','E-Commerce'],
        profile: { style: 'descriptive', keyVerbs: ['Define','Differentiate','Explain','List','Write short note on'], numericalPct: 0 },
        pattern: [
          { part: 'Section A', type: 'Very Short (MCQ/Fill/True-False/Expand)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Definitions/Differences)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Long Answer (Theory + Block diagrams)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Detailed Theory / Practical Usage', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Computer Fundamentals & Hardware', weight: 22 },
          { no: 2, name: 'Operating System & Software', weight: 20 },
          { no: 3, name: 'MS Office Applications', weight: 18 },
          { no: 4, name: 'Networking & Internet', weight: 20 },
          { no: 5, name: 'Cyber Security & E-Commerce', weight: 20 }
        ]
      },
      {
        id: 5, name: 'Engineering Mechanics', code: '4204', renderer: 'PATTERN_GENERAL', marks: 60, optional: false,
        topics: ['Force System','Resultants','Moments','Equilibrium','Friction','Centroid','Moment of Inertia','Simple Machines'],
        profile: { style: 'numerical', keyVerbs: ['Find','Calculate','Determine','State and prove','Derive'], numericalPct: 50 },
        pattern: [
          { part: 'Section A', type: 'Very Short (MCQ/Fill/True-False/Define)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Derivations/Definitions)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Numerical Problems (Medium)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Long Numericals & Theory', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Force System & Resultants', weight: 22 },
          { no: 2, name: 'Moments & Equilibrium', weight: 22 },
          { no: 3, name: 'Friction', weight: 18 },
          { no: 4, name: 'Centroid & Moment of Inertia', weight: 20 },
          { no: 5, name: 'Simple Lifting Machines', weight: 18 }
        ]
      },
      {
        id: 6, name: 'Environmental Sciences', code: '4205', renderer: 'PATTERN_GENERAL', marks: 60, optional: false,
        topics: ['Ecosystem','Pollution','Global Warming','Ozone Depletion','Renewable Energy','Waste Management','Biodiversity','Sustainable Development'],
        profile: { style: 'descriptive', keyVerbs: ['Define','Explain','What are causes of','Write short note on','Differentiate'], numericalPct: 0 },
        pattern: [
          { part: 'Section A', type: 'Very Short (MCQ/Fill/True-False/Define)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Causes/Effects/Definitions)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Long Answer (Pollution/Environment)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Detailed Theory / Environmental Issues', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Environment & Ecosystem', weight: 20 },
          { no: 2, name: 'Pollution (Air/Water/Soil/Noise)', weight: 25 },
          { no: 3, name: 'Global Environmental Issues', weight: 20 },
          { no: 4, name: 'Natural Resources & Energy', weight: 18 },
          { no: 5, name: 'Waste Management & Sustainability', weight: 17 }
        ]
      },
      {
        id: 7, name: 'Engineering Workshop Practice', code: '4206', renderer: 'PATTERN_GENERAL', marks: 60, optional: true,
        topics: ['Carpentry','Fitting','Welding','Smithy','Foundry','Machine Tools','Workshop Safety'],
        profile: { style: 'practical', keyVerbs: ['Name','State','Explain','Draw and label','Differentiate'], numericalPct: 0 },
        pattern: [
          { part: 'Section A', type: 'Very Short (Tool ID/True-False/Fill)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Safety/Tools/Differences)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Long Answer (Processes with diagrams)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Detailed Process / Workshop Operations', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Carpentry & Wood Working', weight: 20 },
          { no: 2, name: 'Fitting & Sheet Metal', weight: 22 },
          { no: 3, name: 'Welding', weight: 22 },
          { no: 4, name: 'Smithy & Foundry', weight: 18 },
          { no: 5, name: 'Machine Tools & Safety', weight: 18 }
        ]
      },
      {
        id: 8, name: 'Engineering Graphics', code: '4207', renderer: 'PATTERN_GENERAL', marks: 60, optional: true,
        topics: ['Drawing Instruments','Scales','Projection of Points','Orthographic Projection','Isometric Projection','Sectional Views','Projection of Solids'],
        profile: { style: 'graphical', keyVerbs: ['Draw','Construct','Project','Find the true shape','Determine'], numericalPct: 10 },
        pattern: [
          { part: 'Section A', type: 'Very Short (Definitions/True-False/Fill)', attempt: 'Attempt all', marks: '10 × 1 = 10' },
          { part: 'Section B', type: 'Short Answer (Theory/RF/Differences)', attempt: 'Attempt any 5 of 7', marks: '5 × 2 = 10' },
          { part: 'Section C', type: 'Drawing Problems (Projections)', attempt: 'Attempt any 4 of 5', marks: '4 × 4 = 16' },
          { part: 'Section D', type: 'Long Drawing Problems (Ortho/Isometric)', attempt: 'Attempt any 4 of 5', marks: '4 × 6 = 24' }
        ],
        units: [
          { no: 1, name: 'Introduction & Scales', weight: 18 },
          { no: 2, name: 'Projection of Points & Lines', weight: 20 },
          { no: 3, name: 'Orthographic Projection', weight: 25 },
          { no: 4, name: 'Isometric Projection', weight: 22 },
          { no: 5, name: 'Projection of Solids & Sections', weight: 15 }
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
    sel.innerHTML = `
      <option value="1">Semester-I (1st Semester)</option>
      <option value="2">Semester-II (2nd Semester)</option>
    `;
    sel.value = '1'; // default to Semester-1 per PRD
  }

  // Subject category config for UI display
  const CATEGORY_META = {
    core_theory:    { label: '📘 Core Theory',    badge: 'core-badge',      desc: 'Full AI prediction · PYQ weighted · Board pattern' },
    optional_theory:{ label: '📗 Optional Theory', badge: 'optional-badge',  desc: 'Moderate prediction · Institute-dependent' },
    practical:      { label: '🔧 Practical',        badge: 'practical-badge', desc: 'Viva · Practical file · No fake theory papers' },
    qualifying:     { label: '📋 Qualifying',       badge: 'qualifying-badge',desc: 'Pass-focused · MCQs · Repeated PYQs' }
  };

  function populateSubjects() {
    const sel = document.getElementById('subjectSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Select Subject --</option>';
    const sem = document.getElementById('semesterSelect')?.value || '1';
    const subjects = SUBJECTS_DB[`semester${sem}`] || [];

    // Group by category
    const groups = { core_theory: [], optional_theory: [], practical: [], qualifying: [] };
    subjects.forEach(s => {
      const cat = s.subject_category || 'core_theory';
      if (groups[cat]) groups[cat].push(s);
      else groups.core_theory.push(s);
    });

    // Render each category as an optgroup
    Object.entries(groups).forEach(([cat, list]) => {
      if (!list.length) return;
      const meta = CATEGORY_META[cat] || { label: cat };
      const grp = document.createElement('optgroup');
      grp.label = meta.label;
      list.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        const suffix = cat === 'practical'  ? ' [Viva/Practical]'
                     : cat === 'qualifying' ? ' [Qualifying]'
                     : cat === 'optional_theory' ? ' [Optional]'
                     : '';
        opt.textContent = `${s.name}${suffix} (${s.code})`;
        opt.dataset.subject = JSON.stringify(s);
        grp.appendChild(opt);
      });
      sel.appendChild(grp);
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

    // Important topics block (Sem-1 subjects have importantTopics)
    const importantBlock = s.importantTopics?.length
      ? `<div class="inst-section-label" style="margin-top:12px;margin-bottom:6px">🔥 Important Topics (High PYQ Weight)</div>
         <div class="inst-important-chips">${s.importantTopics.map(t => `<span class="inst-imp-chip">${t}</span>`).join('')}</div>`
      : '';

    const semBadge = s.semester === 1
      ? '<span class="sem-badge sem1-badge">1st Semester</span>'
      : '<span class="sem-badge sem2-badge">2nd Semester</span>';

    const cat = s.subject_category || 'core_theory';
    const catMeta = CATEGORY_META[cat] || CATEGORY_META.core_theory;
    const catBadge = `<span class="sem-badge ${catMeta.badge}">${cat.replace('_', ' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>`;

    // ── PRACTICAL subjects: show viva/practical info instead of theory paper ──
    if (cat === 'practical') {
      const sections = s.profile?.style === 'drawing_oriented'
        ? ['Viva — Theory Questions', 'Drawing Guidance — Practice Problems', 'Projection Steps & Procedures', 'Dimensioning & BIS Rules', 'Practical File']
        : ['Viva Voce — Oral Questions', 'Safety & Rules MCQ Bank', 'Tool Identification Q&A', 'Process Steps — Procedures', 'Practical File Write-up'];

      content.innerHTML = `
        <div class="inst-section-label" style="margin-bottom:6px">${s.name} (${s.code}) ${semBadge} ${catBadge}</div>
        <div class="inst-pipeline-notice practical-notice">
          <strong>🔧 Practical Pipeline Active</strong><br>
          This subject does NOT generate a theory exam paper.<br>
          Instead it generates: <strong>viva questions, practical file guidance, and safety/tool MCQs</strong>.
        </div>
        <div class="inst-section-label" style="margin-top:12px;margin-bottom:6px">What gets generated:</div>
        <ul class="inst-pipeline-list">
          ${sections.map(s => `<li>${s}</li>`).join('')}
        </ul>
        <div class="inst-section-label" style="margin-top:12px;margin-bottom:6px">Unit Coverage</div>
        ${unitBars}
        <div class="inst-mode-info" style="margin-top:10px;border-left-color:#2a6b2a">
          <strong>Note:</strong> ${catMeta.desc}
        </div>`;
      return;
    }

    // ── QUALIFYING subjects: show pass-assist info ──
    if (cat === 'qualifying') {
      content.innerHTML = `
        <div class="inst-section-label" style="margin-bottom:6px">${s.name} (${s.code}) ${semBadge} ${catBadge}</div>
        <div class="inst-pipeline-notice qualifying-notice">
          <strong>📋 Pass-Assist Mode</strong><br>
          This is a <strong>qualifying subject</strong> (marks may not count in merit).<br>
          System generates <strong>MCQ bank + important short answers + repeated PYQs</strong>.
        </div>
        <div class="inst-section-label" style="margin-top:12px;margin-bottom:6px">What gets generated:</div>
        <ul class="inst-pipeline-list">
          <li>MCQ Bank — 20 most repeated questions</li>
          <li>Important Short Answers (2 marks)</li>
          <li>Key Definitions & 1-mark facts</li>
          <li>Important Long Answers (Pass-focused)</li>
        </ul>
        <div class="inst-section-label" style="margin-top:12px;margin-bottom:6px">Unit Coverage</div>
        ${unitBars}
        ${importantBlock}
        <div class="inst-mode-info" style="margin-top:10px;border-left-color:#c4a000">
          <strong>Note:</strong> ${catMeta.desc}
        </div>`;
      return;
    }

    // ── CORE / OPTIONAL THEORY: full paper structure ──
    const optionalNote = cat === 'optional_theory'
      ? `<div class="inst-pipeline-notice optional-notice">
           <strong>📗 Optional Subject</strong> — Shown only for institutes that offer this subject.
           PYQ confidence is moderate (institute-dependent syllabus variations).
         </div>`
      : '';

    content.innerHTML = `
      <div class="inst-section-label" style="margin-bottom:6px">Paper Structure — ${s.name} (${s.code}) ${semBadge} ${catBadge}</div>
      ${optionalNote}
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

      ${importantBlock}

      <div class="inst-mode-info" id="previewModeInfo">
        <strong>${MODE_INFO[selectedMode].label}:</strong> ${MODE_INFO[selectedMode].hint}
      </div>

      <div class="inst-subject-note">
        <strong>Generation Style:</strong>
        ${s.profile.style === 'symbolic'
          ? 'Mathematical · Symbolic · Short board-style phrasing (Find, Solve, Evaluate, Derive)'
          : s.profile.style === 'language_practical'
          ? 'Language Practical · Letter/Essay writing · Grammar correction (No bilingual)'
          : s.profile.style === 'drawing_oriented'
          ? 'Drawing Oriented · Projection problems · Cannot generate actual sketches (describe only)'
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
    } else if (data.subject?.renderer_type === 'PATTERN_GENERAL') {
      sheet.innerHTML = renderGeneralPaper(data.subject, data.branch, data.sections, data.language);
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

  // ════════════════════════════════════════════════════════
  // PATTERN_GENERAL renderer — Physics, IT, Mechanics, Env, Workshop, Graphics
  // Structure: Section A (10×1) + B (7×2) + C (5×4) + D (5×6) = 60 marks
  // ════════════════════════════════════════════════════════
  function renderGeneralPaper(subject, branch, sections, lang) {
    const isHindi = lang === 'hindi';

    // Render a single question <li>
    function renderQ(q, num, showMarks, showOptions) {
      const text = isHindi ? (q.hi || q.en) : q.en;
      let html = `<li><span class="q-num">${num}.</span><span class="q-body">${esc(text)}`;
      if (showOptions && q.type === 'mcq' && q.options && q.options.length) {
        html += `<div class="q-options">`;
        q.options.forEach((o, i) => {
          html += `<span>(${String.fromCharCode(97+i)}) ${esc(String(o))}</span>`;
        });
        html += `</div>`;
      }
      html += `</span>`;
      if (showMarks && q.marks) html += `<span class="q-marks">[${q.marks} M]</span>`;
      html += `</li>`;
      return html;
    }

    const secA = sections.secA?.questions || [];
    const secB = sections.secB?.questions || [];
    const secC = sections.secC?.questions || [];
    const secD = sections.secD?.questions || [];

    const iH = isHindi;

    return getPaperHeader(subject, branch, lang) + `
      <div class="bteup-part-header">SECTION – A — अति लघुत्तरीय प्रश्न</div>
      <div class="bteup-part-meta">
        <span>${iH ? 'सभी प्रश्न अनिवार्य हैं।' : 'All questions are compulsory.'}</span>
        <span>10 × 1 = 10</span>
      </div>
      <ol class="bteup-questions">${secA.map((q,i) => renderQ(q, i+1, false, true)).join('')}</ol>

      <div class="bteup-pto">[ P.T.O. ]</div>

      <div class="bteup-part-header">SECTION – B — लघुत्तरीय प्रश्न</div>
      <div class="bteup-part-meta">
        <span>${iH ? 'किन्हीं पाँच प्रश्नों के उत्तर दीजिए।' : 'Attempt any FIVE questions out of seven.'}</span>
        <span>5 × 2 = 10</span>
      </div>
      <ol class="bteup-questions">${secB.map((q,i) => renderQ(q, i+1, false, false)).join('')}</ol>

      <div class="bteup-part-header">SECTION – C — दीर्घउत्तरीय प्रश्न</div>
      <div class="bteup-part-meta">
        <span>${iH ? 'किन्हीं चार प्रश्नों के उत्तर दीजिए।' : 'Attempt any FOUR questions out of five.'}</span>
        <span>4 × 4 = 16</span>
      </div>
      <ol class="bteup-questions">${secC.map((q,i) => renderQ(q, i+1, true, false)).join('')}</ol>

      <div class="bteup-part-header">SECTION – D — दीर्घ / आंकिक प्रश्न</div>
      <div class="bteup-part-meta">
        <span>${iH ? 'किन्हीं चार प्रश्नों के उत्तर दीजिए।' : 'Attempt any FOUR questions out of five.'}</span>
        <span>4 × 6 = 24</span>
      </div>
      <ol class="bteup-questions">${secD.map((q,i) => renderQ(q, i+1, true, false)).join('')}</ol>

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
