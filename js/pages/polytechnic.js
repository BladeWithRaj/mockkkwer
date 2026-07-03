// ============================================
// POLYTECHNIC PAGE — BTEUP Sample Paper Generator v10
// Exact offline BTEUP paper format
// Math-II: Part A/B/C/D pattern
// FEEE: Q1-Q6 pattern (unit-wise long answers + short notes)
// ============================================

const PolytechnicPage = {
  _selectedBranch: 'Mechanical Engineering',
  _selectedSemester: '2',
  _selectedSubject: '',
  _isGenerating: false,
  _generatedPaper: null,

  _branches: [
    'Mechanical Engineering',
    'Civil Engineering',
    'Electrical Engineering',
    'Electronics Engineering',
    'Computer Science & Engineering',
    'Information Technology',
    'Chemical Engineering'
  ],

  // ── Subject catalogue with paper pattern type ──
  _subjectsByBranchSem: {
    // Sem 1 — Common for all
    'all_1': [
      { name: 'Mathematics-I',                    code: '4101', pattern: 'math' },
      { name: 'Applied Physics-I',                code: '4102', pattern: 'math' },
      { name: 'Applied Chemistry',                code: '4103', pattern: 'math' },
      { name: 'Communication Skills in English',  code: '4104', pattern: 'essay' },
      { name: 'Engineering Drawing',              code: '4105', pattern: 'drawing' }
    ],
    // Sem 2 — Common for all
    'all_2': [
      { name: 'Mathematics-II',                                     code: '4201', pattern: 'math2' },
      { name: 'Applied Physics-II',                                  code: '4202', pattern: 'math' },
      { name: 'Fundamentals of Electrical & Electronics Engineering', code: '4209', pattern: 'feee' },
      { name: 'Engineering Drawing-II',                              code: '4203', pattern: 'drawing' },
      { name: 'Computer Fundamentals',                               code: '4204', pattern: 'theory' }
    ],
    // Sem 3 — Mechanical
    'Mechanical Engineering_3': [
      { name: 'Applied Mechanics',      code: '3001', pattern: 'math' },
      { name: 'Strength of Materials',  code: '3002', pattern: 'math' },
      { name: 'Material Science',       code: '3003', pattern: 'theory' },
      { name: 'Thermodynamics',         code: '3004', pattern: 'math' },
      { name: 'Machine Drawing',        code: '3005', pattern: 'drawing' }
    ],
    'Civil Engineering_3': [
      { name: 'Surveying',               code: '3101', pattern: 'math' },
      { name: 'Building Materials',      code: '3102', pattern: 'theory' },
      { name: 'Fluid Mechanics',         code: '3103', pattern: 'math' },
      { name: 'Structural Engineering',  code: '3104', pattern: 'math' }
    ],
    'Computer Science & Engineering_3': [
      { name: 'Data Structures',          code: '3201', pattern: 'theory' },
      { name: 'Digital Electronics',      code: '3202', pattern: 'feee' },
      { name: 'Object Oriented Programming', code: '3203', pattern: 'theory' }
    ],
    'Electrical Engineering_3': [
      { name: 'Electrical Machines-I',   code: '3301', pattern: 'feee' },
      { name: 'Network Analysis',        code: '3302', pattern: 'math' },
      { name: 'Measurements',           code: '3303', pattern: 'theory' }
    ]
  },

  // ── Real BTEUP question bank per subject ──
  _qbank: {

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // MATHEMATICS-II (Pattern: math2)
    // Part A: 10 Obj (1M) | Part B: 7 VSA (2M) | Part C: 10 SA (2.5M) | Part D: 6 LA (5M)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    'Mathematics-II': {
      pattern: 'math2',
      totalMarks: 100,
      time: '3 Hours',
      partA: { // 10 Objective — 1 mark each
        label: 'Part A — Objective Type',
        marks_each: 1, count: 10, instruction: 'Attempt all 10 questions. Each carries 1 mark.',
        qs: [
          { en: 'The determinant of identity matrix I₂ is: (a) 0  (b) 1  (c) 2  (d) -1', hi: 'इकाई आव्यूह I₂ का सारणिक (Determinant) होगा: (a) 0  (b) 1  (c) 2  (d) -1', ans: '(b) 1', type:'mcq' },
          { en: 'A matrix A is called singular if |A| = ____', hi: 'आव्यूह A व्युत्क्रमण (Singular) कहलाती है यदि |A| = ____', ans: '0', type:'fill' },
          { en: 'The order of matrix AB is m×p if A is m×n and B is n×p. True or False?', hi: 'यदि A का क्रम m×n और B का क्रम n×p है, तो AB का क्रम m×p होगा। सत्य/असत्य?', ans: 'True', type:'truefalse' },
          { en: 'Rank of a null matrix of order 3×3 is: (a) 1  (b) 2  (c) 3  (d) 0', hi: '3×3 शून्य आव्यूह (Null Matrix) की कोटि (Rank) है: (a) 1  (b) 2  (c) 3  (d) 0', ans: '(d) 0', type:'mcq' },
          { en: 'The value of ∫eˣ dx is: (a) eˣ+C  (b) eˣ/x+C  (c) 1/eˣ+C  (d) none', hi: '∫eˣ dx का मान है: (a) eˣ+C  (b) eˣ/x+C  (c) 1/eˣ+C  (d) कोई नहीं', ans: '(a) eˣ+C', type:'mcq' },
          { en: 'L{1} = ____ (Laplace Transform)', hi: 'L{1} = ____ (लाप्लास रूपांतरण)', ans: '1/s', type:'fill' },
          { en: 'For Fourier series, the period of sin(x) is ____', hi: 'sin(x) का आवर्तकाल (Period) फूरियर श्रेणी में ____ होता है', ans: '2π', type:'fill' },
          { en: 'An eigen value of [[3,0],[0,5]] is: (a) 3  (b) 8  (c) 15  (d) 4', hi: 'आव्यूह [[3,0],[0,5]] का एक आइगन मान है: (a) 3  (b) 8  (c) 15  (d) 4', ans: '(a) 3', type:'mcq' },
          { en: 'The inverse Laplace transform of 1/s² is ____', hi: '1/s² का व्युत्क्रम लाप्लास रूपांतरण ____ है', ans: 't', type:'fill' },
          { en: 'If A is a skew-symmetric matrix, then A = −Aᵀ. True or False?', hi: 'यदि A विषम सममित आव्यूह (Skew-Symmetric) है, तो A = −Aᵀ। सत्य/असत्य?', ans: 'True', type:'truefalse' }
        ]
      },
      partB: { // 7 VSA — 2 marks each
        label: 'Part B — Very Short Answer',
        marks_each: 2, count: 7, instruction: 'Attempt all 7 questions. Each carries 2 marks.',
        qs: [
          { en: 'Find the determinant of matrix A = [[2, 3],[4, 1]].', hi: 'आव्यूह A = [[2, 3],[4, 1]] का सारणिक (Determinant) ज्ञात करें।' },
          { en: 'Evaluate: ∫(3x² + 2x – 5) dx', hi: 'मान ज्ञात करें: ∫(3x² + 2x – 5) dx' },
          { en: 'Find L{t²} using Laplace Transform.', hi: 'लाप्लास रूपांतरण से L{t²} ज्ञात करें।' },
          { en: 'State Cayley-Hamilton theorem.', hi: 'केले-हेमिल्टन (Cayley-Hamilton) प्रमेय का कथन लिखिए।' },
          { en: 'Evaluate: ∫₀^(π/2) sin(x) dx', hi: 'मान ज्ञात करें: ∫₀^(π/2) sin(x) dx' },
          { en: 'Find the rank of matrix [[1,2,3],[4,5,6],[7,8,9]].', hi: 'आव्यूह [[1,2,3],[4,5,6],[7,8,9]] की कोटि (Rank) ज्ञात करें।' },
          { en: 'Write the Fourier series formula for a periodic function f(x) in (–π, π).', hi: 'f(x) के लिए फूरियर श्रेणी (Fourier Series) का सूत्र (–π, π) में लिखिए।' }
        ]
      },
      partC: { // 10 SA — 2.5 marks each
        label: 'Part C — Short Answer',
        marks_each: 2.5, count: 10, instruction: 'Attempt all 10 questions. Each carries 2.5 marks.',
        qs: [
          { en: 'Find the inverse of matrix A = [[1,2],[3,4]] using adjoint method.', hi: 'सहखण्ड (Adjoint) विधि से A = [[1,2],[3,4]] का व्युत्क्रम (Inverse) ज्ञात करें।' },
          { en: 'Solve the system of equations using Cramer\'s Rule: 2x + y = 5, 3x – 2y = 4.', hi: 'क्रेमर नियम से हल करें: 2x + y = 5, 3x – 2y = 4' },
          { en: 'Evaluate: ∫ x·sin(x) dx using integration by parts.', hi: 'खंडशः समाकलन (Integration by Parts) से ∫ x·sin(x) dx ज्ञात करें।' },
          { en: 'Find the eigen values of matrix B = [[4, 1],[2, 3]].', hi: 'आव्यूह B = [[4,1],[2,3]] के आइगन मान (Eigen Values) ज्ञात करें।' },
          { en: 'Find the Fourier cosine series of f(x) = x in (0, π).', hi: '(0, π) में f(x) = x की फूरियर कोसाइन श्रेणी (Fourier Cosine Series) ज्ञात करें।' },
          { en: 'Solve: dy/dx + 2y = 4 using the integrating factor method.', hi: 'समाकलन गुणक (Integrating Factor) विधि से हल करें: dy/dx + 2y = 4' },
          { en: 'Find L{e^(at)} and L{sin(at)} using Laplace Transform formulas.', hi: 'लाप्लास रूपांतरण सूत्र से L{e^(at)} और L{sin(at)} ज्ञात करें।' },
          { en: 'Using Gauss elimination, solve: x + y = 3, 2x – y = 0.', hi: 'गॉस विलोपन (Gauss Elimination) से हल: x + y = 3, 2x – y = 0' },
          { en: 'Evaluate: ∫₀¹ x·eˣ dx', hi: 'मान ज्ञात करें: ∫₀¹ x·eˣ dx' },
          { en: 'Find the Laplace transform of f(t) = t·cos(2t).', hi: 'f(t) = t·cos(2t) का लाप्लास रूपांतरण ज्ञात करें।' }
        ]
      },
      partD: { // 6 LA — 5 marks each
        label: 'Part D — Long Answer',
        marks_each: 5, count: 6, instruction: 'Attempt all 6 questions. Each carries 5 marks.',
        qs: [
          { en: 'Verify Cayley-Hamilton theorem for matrix A = [[1,2],[3,4]] and hence find A⁻¹.', hi: 'A = [[1,2],[3,4]] के लिए केले-हेमिल्टन प्रमेय सत्यापित करें और A⁻¹ ज्ञात करें।' },
          { en: 'Solve the system of equations using matrix method (Ax = B): x + 2y + z = 6, 2x + y – z = 3, x – y + z = 2.', hi: 'आव्यूह विधि (Ax = B) से हल: x + 2y + z = 6, 2x + y – z = 3, x – y + z = 2' },
          { en: 'Find the Fourier series expansion of f(x) = x² in (–π, π) and deduce the sum 1 + 1/4 + 1/9 + ... = π²/6.', hi: '(–π, π) में f(x) = x² की फूरियर श्रेणी ज्ञात करें और 1 + 1/4 + 1/9 + ... = π²/6 निगमित करें।' },
          { en: 'Solve the differential equation using Laplace Transform: y\'\'+ 3y\' + 2y = e^(–t), y(0) = 0, y\'(0) = 1.', hi: 'लाप्लास रूपांतरण से हल: y\'\' + 3y\' + 2y = e^(–t), y(0) = 0, y\'(0) = 1' },
          { en: 'Find the eigen values and eigen vectors of matrix [[2,1,0],[1,3,1],[0,1,2]].', hi: 'आव्यूह [[2,1,0],[1,3,1],[0,1,2]] के आइगन मान (Eigen Values) और आइगन सदिश (Eigen Vectors) ज्ञात करें।' },
          { en: 'Evaluate: ∫₀^∞ e^(–2t) sin(3t) dt using Laplace Transform. Also find ∫₀^π x·sin(nx) dx using integration by parts.', hi: 'लाप्लास रूपांतरण से ∫₀^∞ e^(–2t) sin(3t) dt ज्ञात करें। साथ ही खंडशः समाकलन से ∫₀^π x·sin(nx) dx भी ज्ञात करें।' }
        ]
      }
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // FEEE — Fundamentals of Electrical & Electronics Engineering
    // Pattern: Q1-Q5 (unit-wise, 3 sub-parts × 10 marks, attempt any 2)
    //           Q6 (5 short notes × 2.5 marks, attempt any 4)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    'Fundamentals of Electrical & Electronics Engineering': {
      pattern: 'feee',
      totalMarks: 100,
      time: '3 Hours',
      questions: [
        {
          num: 1, unit: 'Unit I: DC Circuits & Magnetic Circuits',
          instruction: 'Attempt any 2 parts. Each part carries 10 marks.',
          parts: [
            { en: 'State and explain Kirchhoff\'s Voltage Law (KVL) and Kirchhoff\'s Current Law (KCL). Apply KVL to find the current flowing in each branch of the following network: A 12V battery is connected to two resistors R₁ = 4Ω and R₂ = 8Ω in series.', hi: 'किरचॉफ के वोल्टेज नियम (KVL) और धारा नियम (KCL) का कथन एवं व्याख्या करें। KVL से निम्न परिपथ में प्रत्येक शाखा में धारा ज्ञात करें: 12V बैटरी से R₁ = 4Ω और R₂ = 8Ω श्रेणी में जुड़े हैं।' },
            { en: 'Derive the expression for energy stored in a magnetic field. A coil of 500 turns has a magnetic flux of 0.02 Wb. If the current is 5A, find: (i) Inductance of the coil (ii) Energy stored in the magnetic field.', hi: 'चुम्बकीय क्षेत्र (Magnetic Field) में संचित ऊर्जा का सूत्र व्युत्पन्न करें। 500 फेरों की एक कुण्डली में चुम्बकीय फ्लक्स 0.02 Wb है और धारा 5A है। (i) कुण्डली का प्रेरकत्व (L) (ii) चुम्बकीय क्षेत्र में संचित ऊर्जा ज्ञात करें।' },
            { en: 'Explain the concept of self-inductance and mutual inductance with diagrams. Two coils A and B have self-inductances of 0.5H and 0.8H respectively and mutual inductance of 0.3H. Find the coefficient of coupling (k).', hi: 'चित्र सहित स्व-प्रेरकत्व (Self-Inductance) और अन्योन्य प्रेरकत्व (Mutual Inductance) की अवधारणा समझाएं। दो कुण्डलियों A और B के स्व-प्रेरकत्व 0.5H और 0.8H हैं तथा अन्योन्य प्रेरकत्व 0.3H है। युग्मन गुणांक (k) ज्ञात करें।' }
          ]
        },
        {
          num: 2, unit: 'Unit II: AC Circuits',
          instruction: 'Attempt any 2 parts. Each part carries 10 marks.',
          parts: [
            { en: 'A series RLC circuit has R = 10Ω, L = 0.1H, C = 100μF. It is connected to a 230V, 50Hz AC supply. Find: (i) Impedance Z (ii) Current I (iii) Power Factor (iv) Active Power consumed.', hi: 'एक श्रेणी RLC परिपथ में R = 10Ω, L = 0.1H, C = 100μF है। 230V, 50Hz AC सप्लाई से जोड़ने पर ज्ञात करें: (i) प्रतिबाधा Z (ii) धारा I (iii) शक्ति गुणांक (Power Factor) (iv) सक्रिय शक्ति (Active Power)' },
            { en: 'Derive the condition for resonance in a series RLC circuit. Find the resonant frequency, Q-factor, and bandwidth for R = 5Ω, L = 20mH, C = 50μF.', hi: 'श्रेणी RLC परिपथ में अनुनाद (Resonance) की स्थिति का सूत्र व्युत्पन्न करें। R = 5Ω, L = 20mH, C = 50μF के लिए अनुनादी आवृत्ति, Q-गुणांक और बैंडविड्थ ज्ञात करें।' },
            { en: 'Explain power in AC circuits: active power, reactive power, and apparent power. Draw the power triangle. A load of 10kVA operates at 0.8 power factor lagging. Find the active power (kW), reactive power (kVAR).', hi: 'AC परिपथ में शक्ति समझाएं: सक्रिय शक्ति (Active Power), प्रतिघाती शक्ति (Reactive Power), और आभासी शक्ति (Apparent Power)। शक्ति त्रिभुज (Power Triangle) बनाएं। 10kVA, 0.8 p.f. lagging के लिए kW और kVAR ज्ञात करें।' }
          ]
        },
        {
          num: 3, unit: 'Unit III: Semiconductor Devices',
          instruction: 'Attempt any 2 parts. Each part carries 10 marks.',
          parts: [
            { en: 'Explain the construction and working of a P-N junction diode. Draw its V-I characteristics curve and explain forward bias and reverse bias conditions. What is the significance of knee voltage and breakdown voltage?', hi: 'P-N जंक्शन डायोड का निर्माण और कार्य-सिद्धांत समझाएं। V-I अभिलक्षण वक्र (Characteristics Curve) बनाएं और अग्र-अभिनति (Forward Bias) एवं पश्च-अभिनति (Reverse Bias) समझाएं। नी वोल्टेज और ब्रेकडाउन वोल्टेज का महत्त्व क्या है?' },
            { en: 'Draw and explain the working of a full-wave bridge rectifier. Derive expressions for (i) Average output voltage (ii) RMS output voltage (iii) Ripple factor. Compare with half-wave rectifier.', hi: 'पूर्ण तरंग ब्रिज दिष्टकारी (Full-Wave Bridge Rectifier) का चित्र बनाकर कार्य-सिद्धांत समझाएं। (i) औसत आउटपुट वोल्टेज (ii) RMS आउटपुट वोल्टेज (iii) रिपल गुणांक (Ripple Factor) के सूत्र व्युत्पन्न करें।' },
            { en: 'Explain the principle and working of a Zener diode as a voltage regulator circuit. Draw the circuit diagram. If Vin = 15V, Zener voltage Vz = 10V, R = 1kΩ, find the load current for RL = 2kΩ.', hi: 'ज़ेनर डायोड (Zener Diode) के वोल्टेज नियामक (Voltage Regulator) के रूप में कार्यसिद्धांत समझाएं। परिपथ चित्र बनाएं। Vin = 15V, Vz = 10V, R = 1kΩ, RL = 2kΩ के लिए लोड धारा ज्ञात करें।' }
          ]
        },
        {
          num: 4, unit: 'Unit IV: Transistors',
          instruction: 'Attempt any 2 parts. Each part carries 10 marks.',
          parts: [
            { en: 'Explain the construction and working of an NPN transistor in Common Emitter (CE) configuration. Draw the input and output characteristics. Define α, β (current gain) and derive the relation between them.', hi: 'NPN ट्रांजिस्टर की उभयनिष्ठ उत्सर्जक (Common Emitter) संरूपण में निर्माण और कार्य समझाएं। इनपुट और आउटपुट अभिलक्षण बनाएं। α, β (धारा लाभ) परिभाषित करें और उनके बीच संबंध व्युत्पन्न करें।' },
            { en: 'What is a transistor as a switch? Explain with circuit diagram. A transistor in CE configuration has β = 100, RC = 2kΩ, VCC = 10V, VCE(sat) = 0.2V. Find the minimum base current to saturate the transistor.', hi: 'ट्रांजिस्टर एक स्विच के रूप में क्या है? परिपथ चित्र सहित समझाएं। CE संरूपण में β = 100, RC = 2kΩ, VCC = 10V, VCE(sat) = 0.2V। ट्रांजिस्टर को संतृप्त (Saturate) करने के लिए न्यूनतम आधार धारा (IB) ज्ञात करें।' },
            { en: 'Explain the concept of transistor biasing. Describe the voltage divider bias circuit with a neat diagram. Derive the expression for the operating point (Q-point) (ICQ, VCEQ).', hi: 'ट्रांजिस्टर अभिनति (Biasing) की अवधारणा समझाएं। वोल्टेज विभाजक अभिनति (Voltage Divider Bias) परिपथ को साफ चित्र सहित वर्णित करें। परिचालन बिंदु (Q-point) ICQ, VCEQ का सूत्र व्युत्पन्न करें।' }
          ]
        },
        {
          num: 5, unit: 'Unit V: Digital Electronics & Measuring Instruments',
          instruction: 'Attempt any 2 parts. Each part carries 10 marks.',
          parts: [
            { en: 'Explain the working of a moving coil galvanometer. Derive the expression for deflection. A galvanometer has 50Ω resistance and gives full-scale deflection at 10mA. How would you convert it into: (i) an ammeter to read 5A? (ii) a voltmeter to read 100V?', hi: 'चल कुण्डली गैल्वेनोमीटर (Moving Coil Galvanometer) का कार्य-सिद्धांत समझाएं। विक्षेपण (Deflection) का सूत्र व्युत्पन्न करें। 50Ω प्रतिरोध का गैल्वेनोमीटर 10mA पर पूर्ण विक्षेपण देता है। इसे (i) 5A अमीटर (ii) 100V वोल्टमीटर में कैसे बदलेंगे?' },
            { en: 'Explain the binary number system. Convert the following: (i) (1011.01)₂ to decimal (ii) (47)₁₀ to binary (iii) (A3F)₁₆ to binary (iv) Perform binary addition: 1011 + 1101.', hi: 'द्विआधारी संख्या प्रणाली (Binary Number System) समझाएं। निम्न को रूपांतरित करें: (i) (1011.01)₂ से दशमलव (ii) (47)₁₀ से द्विआधारी (iii) (A3F)₁₆ से द्विआधारी (iv) द्विआधारी योग: 1011 + 1101' },
            { en: 'Explain logic gates: AND, OR, NOT, NAND, NOR with truth tables and circuit symbols. Prove De-Morgan\'s theorems and verify using truth tables: (i) (A·B)\' = A\' + B\'  (ii) (A+B)\' = A\'·B\'', hi: 'लॉजिक गेट (Logic Gates) AND, OR, NOT, NAND, NOR को सत्य सारणी और परिपथ प्रतीक सहित समझाएं। डी-मॉर्गन प्रमेय (De-Morgan\'s Theorem) सिद्ध करें और सत्य सारणी से सत्यापित करें: (i) (A·B)\' = A\' + B\'  (ii) (A+B)\' = A\'·B\'' }
          ]
        },
        {
          num: 6, unit: 'Short Notes — All Units',
          instruction: 'Write short notes on any 4 of the following. Each carries 2.5 marks.',
          isNotes: true,
          notes: [
            { en: 'Ohm\'s Law and its Limitations', hi: 'ओम का नियम (Ohm\'s Law) और उसकी सीमाएं' },
            { en: 'Power Factor and its Significance in AC Circuits', hi: 'शक्ति गुणांक (Power Factor) और AC परिपथ में इसका महत्त्व' },
            { en: 'Lenz\'s Law and Electromagnetic Induction', hi: 'लेन्ज का नियम (Lenz\'s Law) और विद्युत चुम्बकीय प्रेरण (Electromagnetic Induction)' },
            { en: 'Working Principle of LED (Light Emitting Diode)', hi: 'LED (प्रकाश उत्सर्जक डायोड) का कार्यसिद्धांत' },
            { en: 'Transistor as an Amplifier (CE Configuration)', hi: 'CE संरूपण में ट्रांजिस्टर एक प्रवर्धक (Amplifier) के रूप में' }
          ]
        }
      ]
    }
  },

  // ── Fallback for subjects without specific bank ──
  _defaultPatterns: {
    math: {
      pattern: 'math2',
      totalMarks: 100,
      time: '3 Hours'
    }
  },

  getSubjects() {
    const key1 = `${this._selectedBranch}_${this._selectedSemester}`;
    const key2 = `all_${this._selectedSemester}`;
    return this._subjectsByBranchSem[key1] || this._subjectsByBranchSem[key2] || [
      { name: 'Applied Mathematics', code: '5001', pattern: 'math2' },
      { name: 'Theory of Machines', code: '5002', pattern: 'math2' }
    ];
  },

  render(params) {
    if (params?.branch) this._selectedBranch = params.branch === 'cs' ? 'Computer Science & Engineering' : params.branch.charAt(0).toUpperCase() + params.branch.slice(1) + ' Engineering';
    if (params?.semester) this._selectedSemester = params.semester;

    const subjects = this.getSubjects();
    if (subjects.length > 0 && !this._selectedSubject) {
      this._selectedSubject = subjects[0].name;
    }

    return `
      <div class="page-enter" style="max-width: 1100px; margin: 0 auto; padding: 24px 16px;">

        <!-- Header -->
        <div style="margin-bottom: 28px;">
          <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-muted);margin-bottom:10px;">
            <a href="#home" style="color:var(--primary);text-decoration:none;">Home</a>
            <span>›</span><span>Polytechnic</span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <div>
              <h1 style="font-size:26px;font-weight:800;color:var(--text-primary);margin:0 0 6px;letter-spacing:-0.02em;">📄 BTEUP Sample Paper Generator</h1>
              <p style="color:var(--text-secondary);font-size:13.5px;margin:0;">Bilingual offline-pattern BTEUP sample paper — bilkul actual board exam jaise</p>
            </div>
            <div style="display:flex;align-items:center;gap:8px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:100px;padding:6px 14px;">
              <span style="width:7px;height:7px;background:#10B981;border-radius:50%;display:inline-block;"></span>
              <span style="font-size:12px;font-weight:600;color:#10B981;">Free · Instant · No Login</span>
            </div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 320px;gap:24px;align-items:start;" class="poly-grid">

          <!-- Left -->
          <div style="display:flex;flex-direction:column;gap:20px;">

            <!-- Config Card -->
            <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:18px;padding:24px;">
              <h2 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 20px;display:flex;align-items:center;gap:8px;">⚙️ Configure Your Paper</h2>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;">Branch</label>
                  <select id="poly-branch" onchange="PolytechnicPage.onBranchChange(this.value)"
                    style="background:var(--bg-elevated);border:1.5px solid var(--border-color);border-radius:10px;padding:10px 12px;color:var(--text-primary);font-size:13px;width:100%;outline:none;">
                    ${this._branches.map(b => `<option value="${b}" ${b === this._selectedBranch ? 'selected' : ''}>${b}</option>`).join('')}
                  </select>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                  <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;">Semester</label>
                  <select id="poly-sem" onchange="PolytechnicPage.onSemChange(this.value)"
                    style="background:var(--bg-elevated);border:1.5px solid var(--border-color);border-radius:10px;padding:10px 12px;color:var(--text-primary);font-size:13px;width:100%;outline:none;">
                    ${['1','2','3','4','5','6'].map(s => `<option value="${s}" ${s === this._selectedSemester ? 'selected' : ''}>Semester ${s}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:20px;">
                <label style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;">Subject</label>
                <select id="poly-subject" onchange="PolytechnicPage.onSubjectChange(this.value)"
                  style="background:var(--bg-elevated);border:1.5px solid var(--border-color);border-radius:10px;padding:10px 12px;color:var(--text-primary);font-size:13px;width:100%;outline:none;">
                  ${subjects.map(s => `<option value="${s.name}" ${s.name === this._selectedSubject ? 'selected' : ''}>${s.name}  (${s.code})</option>`).join('')}
                </select>
              </div>

              <!-- Info strip -->
              <div style="background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.18);border-radius:12px;padding:12px 16px;margin-bottom:20px;display:flex;gap:20px;flex-wrap:wrap;">
                <span style="font-size:12.5px;color:var(--text-secondary);">📋 <b style="color:var(--text-primary);">BTEUP Pattern</b></span>
                <span style="font-size:12.5px;color:var(--text-secondary);">⏱️ <b style="color:var(--text-primary);">3 Hours</b></span>
                <span style="font-size:12.5px;color:var(--text-secondary);">📊 <b style="color:var(--text-primary);">100 Marks</b></span>
                <span style="font-size:12.5px;color:var(--text-secondary);">🇮🇳 <b style="color:var(--text-primary);">Bilingual</b></span>
              </div>

              <button id="poly-gen-btn" onclick="PolytechnicPage.generate()"
                style="background:linear-gradient(135deg,var(--primary) 0%,#7C3AED 100%);border:none;border-radius:12px;padding:15px;color:white;font-weight:700;font-size:15px;width:100%;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:opacity 0.2s;"
                onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
                <span style="font-size:18px;">🚀</span> Generate Sample Paper
              </button>
            </div>

            <!-- Paper Output -->
            <div id="poly-preview">${this._renderWelcome()}</div>
          </div>

          <!-- Sidebar -->
          <div style="display:flex;flex-direction:column;gap:18px;" class="poly-sidebar">
            <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:16px;padding:20px;">
              <h3 style="font-size:14px;font-weight:700;margin:0 0 14px;">📌 How to Use</h3>
              ${[['1','Select Branch, Semester & Subject','#4F46E5'],['2','Click "Generate Sample Paper"','#10B981'],['3','Read bilingual paper (EN+HI)','#F59E0B'],['4','Print / Download as PDF','#EC4899']].map(([n,t,c]) => `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                  <div style="width:24px;height:24px;border-radius:50%;background:${c};color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${n}</div>
                  <span style="font-size:12.5px;color:var(--text-secondary);">${t}</span>
                </div>`).join('')}
            </div>

            <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:16px;padding:20px;">
              <h3 style="font-size:14px;font-weight:700;margin:0 0 14px;">📐 Math-II Pattern</h3>
              ${[['Part A','10 Obj × 1M','10 Marks','#4F46E5'],['Part B','7 VSA × 2M','14 Marks','#10B981'],['Part C','10 SA × 2.5M','25 Marks','#F59E0B'],['Part D','6 LA × 5M','30 Marks','#EC4899'],['Internal','Sessional + Attendance','21 Marks','#94A3B8']].map(([s,d,m,c]) => `
                <div style="background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                  <div><div style="font-size:12px;font-weight:700;color:${c};">${s}</div><div style="font-size:11px;color:var(--text-muted);">${d}</div></div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-primary);">${m}</div>
                </div>`).join('')}
            </div>

            <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:16px;padding:20px;">
              <h3 style="font-size:14px;font-weight:700;margin:0 0 14px;">⚡ FEEE Pattern</h3>
              ${[['Q 1–5','Unit-wise: attempt 2/3 parts','20M each'],['Q 6','Short Notes: attempt 4/5','10 Marks']].map(([s,d,m]) => `
                <div style="background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:10px;padding:10px 12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                  <div><div style="font-size:12px;font-weight:700;color:var(--primary);">${s}</div><div style="font-size:11px;color:var(--text-muted);">${d}</div></div>
                  <div style="font-size:12px;font-weight:700;color:var(--text-primary);">${m}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  _renderWelcome() {
    return `
      <div style="background:var(--bg-secondary);border:2px dashed var(--border-color);border-radius:18px;padding:56px 24px;text-align:center;">
        <div style="font-size:56px;margin-bottom:16px;">📄</div>
        <h3 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0 0 8px;">Sample Paper Yahan Dikhega</h3>
        <p style="font-size:14px;color:var(--text-secondary);margin:0 0 6px;">Branch, Semester aur Subject select karein</p>
        <p style="font-size:13px;color:var(--text-muted);margin:0;">Phir <b style="color:var(--primary);">Generate Sample Paper</b> dabayein 🚀</p>
      </div>`;
  },

  generate() {
    if (this._isGenerating) return;
    this._isGenerating = true;

    const btn = document.getElementById('poly-gen-btn');
    if (btn) { btn.innerHTML = '<span>⏳</span> Generating...'; btn.disabled = true; btn.style.opacity = '0.65'; }
    const preview = document.getElementById('poly-preview');
    if (preview) preview.innerHTML = `
      <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:18px;padding:60px 24px;text-align:center;">
        <div style="width:44px;height:44px;border:4px solid var(--border-color);border-top:4px solid var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div>
        <p style="font-size:15px;font-weight:600;color:var(--text-primary);margin:0 0 6px;">Generating BTEUP Sample Paper...</p>
        <p style="font-size:13px;color:var(--text-muted);">Subject: ${this._selectedSubject}</p>
      </div>`;

    setTimeout(() => {
      if (btn) { btn.innerHTML = '<span style="font-size:18px;">🚀</span> Generate Sample Paper'; btn.disabled = false; btn.style.opacity = '1'; }
      this._isGenerating = false;

      const subjectName = this._selectedSubject;
      const bank = this._qbank[subjectName];

      if (preview) preview.innerHTML = bank
        ? (bank.pattern === 'feee' ? this._renderFEEEPaper(bank) : this._renderMath2Paper(bank))
        : this._renderGenericPaper();

      window.Helpers?.showToast?.('✅ Sample paper generated!', 'success');
    }, 1200);
  },

  // ── Math-II style paper (Part A/B/C/D) ──
  _renderMath2Paper(bank) {
    const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

    const renderPart = (part, qs) => {
      let inner = '';
      if (part.label.includes('Part A')) {
        inner = qs.map((q, i) => `
          <div style="padding:12px 14px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:10px;">
            <div style="font-size:13.5px;color:var(--text-primary);font-weight:500;margin-bottom:4px;line-height:1.55;">
              <b style="color:var(--primary);">${i+1}.</b> ${q.en} <span style="font-size:11px;color:var(--text-muted);font-weight:600;margin-left:6px;">[${part.marks_each} M]</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);font-style:italic;">${q.hi}</div>
          </div>`).join('');
      } else {
        inner = qs.map((q, i) => `
          <div style="padding:14px 16px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:10px;">
            <div style="font-size:14px;color:var(--text-primary);font-weight:500;margin-bottom:6px;line-height:1.6;">
              <b style="color:var(--primary);">Q${i+1}.</b> ${q.en} <span style="font-size:11px;color:var(--text-muted);font-weight:600;margin-left:6px;">[${part.marks_each} M]</span>
            </div>
            <div style="font-size:12px;color:var(--text-muted);font-style:italic;line-height:1.6;">${q.hi}</div>
          </div>`).join('');
      }

      const colors = { 'Part A': '#4F46E5', 'Part B': '#10B981', 'Part C': '#F59E0B', 'Part D': '#EC4899' };
      const label = part.label.split('—')[0].trim().replace('Part ', 'Part ');
      const clr = Object.entries(colors).find(([k]) => part.label.includes(k))?.[1] || '#4F46E5';

      return `
        <div style="margin-bottom:28px;">
          <div style="background:${clr}15;border-left:4px solid ${clr};border-radius:0 10px 10px 0;padding:12px 18px;margin-bottom:14px;">
            <div style="font-size:13px;font-weight:800;color:${clr};text-transform:uppercase;letter-spacing:0.05em;">${part.label}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;">${part.instruction}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">${inner}</div>
        </div>`;
    };

    return `
      <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:18px;overflow:hidden;">
        ${this._paperHeader(bank, this._selectedSubject)}
        <div style="padding:24px;">
          ${renderPart(bank.partA, shuffle(bank.partA.qs).slice(0, 10))}
          ${renderPart(bank.partB, shuffle(bank.partB.qs).slice(0, 7))}
          ${renderPart(bank.partC, shuffle(bank.partC.qs).slice(0, 10))}
          ${renderPart(bank.partD, shuffle(bank.partD.qs).slice(0, 6))}
        </div>
        ${this._paperActions()}
      </div>`;
  },

  // ── FEEE style paper (Q1-Q6) ──
  _renderFEEEPaper(bank) {
    const renderQ = (q) => {
      if (q.isNotes) {
        return `
          <div style="margin-bottom:28px;">
            <div style="background:#EC4899'15;border-left:4px solid #EC4899;border-radius:0 10px 10px 0;padding:12px 18px;margin-bottom:14px;">
              <div style="font-size:13px;font-weight:800;color:#EC4899;text-transform:uppercase;letter-spacing:0.05em;">Question ${q.num} — ${q.unit}</div>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;">${q.instruction}</div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${q.notes.map((n, i) => `
                <div style="padding:12px 16px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:10px;display:flex;align-items:flex-start;gap:12px;">
                  <div style="width:24px;height:24px;border-radius:50%;background:#EC489920;color:#EC4899;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${i+1}</div>
                  <div>
                    <div style="font-size:13.5px;color:var(--text-primary);font-weight:500;margin-bottom:4px;">${n.en} <span style="font-size:11px;color:var(--text-muted);">[2.5 M]</span></div>
                    <div style="font-size:12px;color:var(--text-muted);font-style:italic;">${n.hi}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>`;
      }

      const clrs = ['#4F46E5','#10B981','#F59E0B','#3B82F6','#8B5CF6'];
      const clr = clrs[(q.num - 1) % clrs.length];
      return `
        <div style="margin-bottom:28px;">
          <div style="background:${clr}15;border-left:4px solid ${clr};border-radius:0 10px 10px 0;padding:12px 18px;margin-bottom:14px;">
            <div style="font-size:13px;font-weight:800;color:${clr};text-transform:uppercase;letter-spacing:0.05em;">Question ${q.num} — ${q.unit}</div>
            <div style="font-size:12px;color:var(--text-secondary);margin-top:3px;">${q.instruction}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${q.parts.map((p, i) => `
              <div style="padding:14px 16px;background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:12px;">
                <div style="font-size:11px;font-weight:700;color:${clr};margin-bottom:6px;letter-spacing:0.04em;">PART (${String.fromCharCode(97+i).toUpperCase()}) — 10 Marks</div>
                <div style="font-size:14px;color:var(--text-primary);font-weight:500;line-height:1.65;margin-bottom:7px;">${p.en}</div>
                <div style="font-size:12px;color:var(--text-muted);font-style:italic;line-height:1.6;border-top:1px solid var(--border-color);padding-top:7px;">${p.hi}</div>
              </div>`).join('')}
          </div>
        </div>`;
    };

    return `
      <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:18px;overflow:hidden;">
        ${this._paperHeader(bank, this._selectedSubject)}
        <div style="padding:24px;">
          ${bank.questions.map(q => renderQ(q)).join('')}
        </div>
        ${this._paperActions()}
      </div>`;
  },

  _paperHeader(bank, subject) {
    return `
      <div style="background:linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08));border-bottom:1px solid var(--border-color);padding:24px 24px 20px;text-align:center;">
        <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px;">Board of Technical Education Uttar Pradesh (BTEUP)</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:16px;">उत्तर प्रदेश प्राविधिक शिक्षा परिषद</div>
        <div style="font-size:22px;font-weight:800;color:var(--text-primary);letter-spacing:-0.02em;margin-bottom:4px;">📄 Sample Examination Paper</div>
        <div style="font-size:16px;font-weight:700;color:var(--primary);margin-bottom:20px;">${subject}</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;max-width:700px;margin:0 auto;">
          ${[
            ['Branch', this._selectedBranch.replace(' Engineering','')],
            ['Semester', `${this._selectedSemester}${['','st','nd','rd','th','th','th'][+this._selectedSemester] || 'th'} Sem`],
            ['Max Marks', bank.totalMarks || 100],
            ['Time', bank.time || '3 Hours'],
            ['Pattern', 'BTEUP Official']
          ].map(([l,v]) => `
            <div style="background:var(--bg-elevated);border:1px solid var(--border-color);border-radius:10px;padding:10px 8px;text-align:center;">
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;font-weight:700;letter-spacing:0.05em;">${l}</div>
              <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-top:3px;">${v}</div>
            </div>`).join('')}
        </div>
      </div>
      <div style="background:rgba(245,158,11,0.07);border-bottom:1px solid var(--border-color);padding:12px 24px;">
        <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.7;">
          <b style="color:#D97706;">📌 General Instructions / सामान्य निर्देश:</b>
          All sections are compulsory unless instructed otherwise.
          Draw neat diagrams wherever required.
          Write legibly. Use only blue/black pen.
          |
          सभी खण्ड अनिवार्य हैं जब तक अन्यथा निर्देश न हो।
          आवश्यकता होने पर स्वच्छ रेखाचित्र बनाएं।
        </div>
      </div>`;
  },

  _paperActions() {
    return `
      <div style="padding:0 24px 24px;display:flex;gap:12px;flex-wrap:wrap;">
        <button onclick="window.print()"
          style="flex:1;min-width:140px;background:linear-gradient(135deg,var(--primary),#7C3AED);border:none;border-radius:12px;padding:13px;color:white;font-weight:700;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.2s;"
          onmouseover="this.style.opacity='0.88'" onmouseout="this.style.opacity='1'">
          🖨️ Print / Save as PDF
        </button>
        <button onclick="PolytechnicPage.generate()"
          style="flex:1;min-width:140px;background:transparent;border:1.5px solid var(--border-color);border-radius:12px;padding:13px;color:var(--text-primary);font-weight:600;font-size:14px;cursor:pointer;transition:border-color 0.2s;"
          onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border-color)'">
          🔄 New Paper
        </button>
      </div>`;
  },

  _renderGenericPaper() {
    return `
      <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:18px;padding:32px 24px;text-align:center;">
        <div style="font-size:40px;margin-bottom:16px;">⚠️</div>
        <h3 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0 0 10px;">Question Bank Coming Soon</h3>
        <p style="font-size:14px;color:var(--text-secondary);margin:0 0 6px;">Is subject ke liye abhi question bank add kiya ja raha hai.</p>
        <p style="font-size:13px;color:var(--text-muted);">Abhi ke liye <b style="color:var(--primary);">Mathematics-II</b> ya <b style="color:var(--primary);">FEEE</b> try karein — dono fully ready hain!</p>
      </div>`;
  },

  onBranchChange(v) { this._selectedBranch = v; this._selectedSubject = ''; this._generatedPaper = null; this.refresh(); },
  onSemChange(v)    { this._selectedSemester = v; this._selectedSubject = ''; this._generatedPaper = null; this.refresh(); },
  onSubjectChange(v){ this._selectedSubject = v; },

  refresh() {
    const app = document.getElementById('app');
    if (app && App.currentPage === 'polytechnic') {
      const footer = App._renderFooter ? App._renderFooter() : '';
      app.innerHTML = App._renderHeader('polytechnic') + this.render() + footer;
    }
  },

  afterRender() {},
  destroy() {}
};

window.PolytechnicPage = PolytechnicPage;
