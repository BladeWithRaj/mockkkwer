// ═══════════════════════════════════════════════════════════════
// BTEUP PAPER GENERATOR — Production-Grade Engine v3
// POST /api/generate-polytechnic-paper
//
// Architecture: Blueprint → Pattern → AI Filling → Renderer
// Providers:   Gemini (premium) | Groq (fast) | Mistral (structured)
// Routing:     providerRouter.js — cost-optimized per subject+section
// Modes:       important | board_pattern | pyq_weighted | pass_guaranteed
// Languages:   english | hindi (separate prompts — NOT translation)
// ═══════════════════════════════════════════════════════════════

import { routeToProvider, getProviderStatus } from '../providers/providerRouter.js';
import { validateSection, validatePaper }      from '../engine/validationEngine.js';
import { retrySection }                        from '../engine/retryManager.js';
import { createBudgetTracker, logTokenUsage }  from '../engine/tokenBudgetManager.js';

// ── Generation Mode Modifiers ──
// Each mode injects specific behavioral instructions into the AI prompt.
// This is REAL behavioral difference — not a UI label.
const MODE_MODIFIERS = {
  important: {
    label: 'Important Questions',
    instruction: 'PRIORITY: Focus ONLY on high-frequency concepts that have appeared repeatedly in BTEUP board exams over the last 6 years. Prefer topics that recur every year or alternate years. Avoid rare or obscure topics. Students rely on these for exam preparation.',
    temperature_adj: -0.05,   // slightly lower temp = more predictable, repeated topics
    difficulty_bias: 'favor commonly tested difficulty'
  },
  board_pattern: {
    label: 'Board Pattern',
    instruction: 'PRIORITY: Use STRICT official BTEUP board examination wording. Questions must be mechanical, short, and robotic — exactly as they appear in official printed papers. Use exact verb patterns: "Find the value of", "Solve the following", "Prove that", "Evaluate", "Write the equation of". NO creative or explanatory phrasing. Paper must be indistinguishable from an actual board paper.',
    temperature_adj: -0.15,   // lower temp = rigid, formulaic outputs
    difficulty_bias: 'standard board distribution'
  },
  pyq_weighted: {
    label: 'PYQ Weighted',
    instruction: 'PRIORITY: Weight your question selection by historical repetition. Topics that appear in 4+ of the last 6 years must get priority. Use the keywords and concepts most commonly tested in previous board papers. Distribution should heavily favor units with highest exam frequency. Avoid topics that appeared only once or never.',
    temperature_adj: -0.1,
    difficulty_bias: 'historically tested difficulty'
  },
  pass_guaranteed: {
    label: 'Pass-Guaranteed',
    instruction: 'PRIORITY: Generate questions that a below-average student can attempt to secure passing marks (17/60). Focus on: direct formula application (not derivation), short definitions, basic numericals with simple numbers, true/false based on fundamental concepts. Avoid complex proofs, multi-step derivations, or advanced topics. Every question must be solvable in under 5 minutes.',
    temperature_adj: -0.2,    // most predictable = easiest questions
    difficulty_bias: 'easy to easy-medium only'
  }
};

const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 10;
const rateBuckets = {};

// ── Rate Limiter ──
function checkRateLimit(ip) {
  if (!ip || ip === "unknown") ip = "global";
  const now = Date.now();
  if (!rateBuckets[ip]) rateBuckets[ip] = [];
  rateBuckets[ip] = rateBuckets[ip].filter(ts => now - ts < RATE_WINDOW_MS);
  if (rateBuckets[ip].length >= RATE_MAX) return false;
  rateBuckets[ip].push(now);
  if (Object.keys(rateBuckets).length > 500) {
    for (const k of Object.keys(rateBuckets)) {
      if (!rateBuckets[k].length) delete rateBuckets[k];
    }
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════
// SECTION DEFINITIONS — Per-pattern section configs
// ═══════════════════════════════════════════════════════════════

const PATTERN_SECTIONS = {
  PATTERN_MATH: [
    { key: "partA", promptFile: "partA", label: "Part A — Objective Questions",   stageText: "Generating objective questions (Part A)...",      maxTokens: 2500, difficulty: "easy",        count: 10 },
    { key: "partB", promptFile: "partB", label: "Part B — Very Short Answers",    stageText: "Generating very short answers (Part B)...",       maxTokens: 2000, difficulty: "easy-medium",  count: 7  },
    { key: "partC", promptFile: "partC", label: "Part C — Short Answers",         stageText: "Generating short answer questions (Part C)...",   maxTokens: 2500, difficulty: "medium",       count: 10 },
    { key: "partD", promptFile: "partD", label: "Part D — Long Answer Questions", stageText: "Generating long answer questions (Part D)...",     maxTokens: 2500, difficulty: "hard",         count: 6  }
  ],
  PATTERN_FEEE: [
    { key: "q1", promptFile: "q1", label: "Q1 — DC Circuits & Magnetic Circuits",   stageText: "Generating Q1 — DC Circuits...",               maxTokens: 2000, difficulty: "medium-hard", count: 3 },
    { key: "q2", promptFile: "q2", label: "Q2 — AC Circuits",                       stageText: "Generating Q2 — AC Circuits...",               maxTokens: 2000, difficulty: "medium-hard", count: 3 },
    { key: "q3", promptFile: "q3", label: "Q3 — Electrical Machines",               stageText: "Generating Q3 — Electrical Machines...",       maxTokens: 2000, difficulty: "medium-hard", count: 3 },
    { key: "q4", promptFile: "q4", label: "Q4 — Electronic Devices",               stageText: "Generating Q4 — Electronic Devices...",        maxTokens: 2000, difficulty: "medium-hard", count: 3 },
    { key: "q5", promptFile: "q5", label: "Q5 — Digital Electronics & Instruments", stageText: "Generating Q5 — Digital Electronics...",       maxTokens: 2000, difficulty: "medium-hard", count: 3 },
    { key: "q6", promptFile: "q6", label: "Q6 — Short Notes",                       stageText: "Generating Q6 — Short Notes...",               maxTokens: 1500, difficulty: "easy-medium", count: 5 }
  ],
  // PATTERN_GENERAL — used for Physics, IT, Mechanics, Env, Workshop, Graphics
  PATTERN_GENERAL: [
    { key: "secA", label: "Section A — Very Short Answer",  stageText: "Generating Section A — Very Short (10 × 1 marks)...",    maxTokens: 2500, difficulty: "easy",        count: 10 },
    { key: "secB", label: "Section B — Short Answer",       stageText: "Generating Section B — Short Answer (7 × 2 marks)...",   maxTokens: 2200, difficulty: "easy-medium", count: 7  },
    { key: "secC", label: "Section C — Long Answer",        stageText: "Generating Section C — Long Answer (5 × 4 marks)...",    maxTokens: 2500, difficulty: "medium",      count: 5  },
    { key: "secD", label: "Section D — Long / Numerical",   stageText: "Generating Section D — Long/Numerical (5 × 6 marks)...", maxTokens: 2500, difficulty: "medium-hard", count: 5  }
  ]
};

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER — Loads prompt template & injects syllabus
// ═══════════════════════════════════════════════════════════════

// Hardcoded prompts (since Vercel serverless can't read fs)
const PROMPTS = {};

function getPromptTemplate(namespace, promptFile) {
  const cacheKey = `${namespace}/${promptFile}`;
  if (PROMPTS[cacheKey]) return PROMPTS[cacheKey];
  // Prompts are embedded below per-pattern. In production, these could be
  // fetched from DB or edge config. For now, inline for Vercel compatibility.
  return null;
}

function buildSectionPrompt(subject, units, sectionConfig, language, mode) {
  const syllabusText = units.map(u =>
    `Unit ${u.unit_no} — ${u.unit_name}: ${u.topics}`
  ).join('\n');

  const keywordsText = units.map(u =>
    `Unit ${u.unit_no}: ${(u.important_keywords || []).join(', ')}`
  ).join('\n');

  // PYQ weight context — inject if available
  const pyqText = units.map(u => {
    const imp = u.importance_score ? `importance:${u.importance_score}` : '';
    const freq = u.pyq_frequency   ? `pyq_freq:${u.pyq_frequency}`     : '';
    return imp || freq ? `Unit ${u.unit_no}: ${imp} ${freq}` : null;
  }).filter(Boolean).join('\n');

  const modeModifier = MODE_MODIFIERS[mode] || MODE_MODIFIERS.important;

  if (subject.renderer_type === 'PATTERN_MATH') {
    return buildMathPrompt(sectionConfig, syllabusText, keywordsText, pyqText, language, subject.name, modeModifier);
  } else if (subject.renderer_type === 'PATTERN_FEEE') {
    return buildFEEEPrompt(sectionConfig, syllabusText, keywordsText, pyqText, language, subject.name, units, modeModifier);
  } else if (subject.renderer_type === 'PATTERN_GENERAL') {
    return buildGeneralPrompt(subject, sectionConfig, syllabusText, keywordsText, pyqText, language, modeModifier, units);
  }
  throw new Error(`Unknown renderer_type: ${subject.renderer_type}`);
}

function buildMathPrompt(section, syllabus, keywords, pyqData, language, subjectName, modeModifier) {
  const isHindi = language === 'hindi';
  const langRule = isHindi
    ? 'Write ALL question text in Hindi (Devanagari script). Set "en" to empty string. Math symbols/variables stay in Unicode (x², √x, ∫, π etc).'
    : 'Write all questions in English only. Set "hi" to empty string. Use short mechanical board-style phrasing.';

  const schemas = {
    partA: `{
  "questions": [
    { "en": "question", "hi": "", "type": "mcq", "options": ["a","b","c","d"], "answer": "correct", "unit": 1 }
  ]
}
Generate EXACTLY 10 questions. Mix: at least 4 MCQ, 2 fill-in-blank, rest true/false or one-word.
Cover all 5 units (2 per unit). Difficulty: EASY.`,
    partB: `{
  "questions": [ { "en": "question", "hi": "", "unit": 1 } ]
}
Generate EXACTLY 7 questions. Short calculation or formula recall. Cover 4+ units. Difficulty: EASY-MEDIUM.`,
    partC: `{
  "questions": [ { "en": "question", "hi": "", "unit": 1 } ]
}
Generate EXACTLY 10 questions. Multi-step numericals, short proofs. All 5 units (2 each). Difficulty: MEDIUM.`,
    partD: `{
  "questions": [ { "en": "question", "hi": "", "unit": 1 } ]
}
Generate EXACTLY 6 questions. Full derivations, matrix problems, multi-step proofs. 4+ units. Difficulty: HARD.`
  };

  return `You are a senior BTEUP (Board of Technical Education, Uttar Pradesh) ${subjectName} paper setter with 20 years experience.

=== GENERATION MODE: ${modeModifier.label} ===
${modeModifier.instruction}

TASK: Generate exam questions for ${section.label}.

SYLLABUS:
${syllabus}

KEYWORDS BY UNIT:
${keywords}
${pyqData ? `
PYQ IMPORTANCE DATA:
${pyqData}` : ''}

OUTPUT SCHEMA (return ONLY this JSON, no other text):
${schemas[section.key]}

BOARD STYLE RULES:
1. Output ONLY valid JSON. No markdown. No explanation. No extra fields.
2. No LaTeX. Unicode math only: x², x³, √x, ∫, Σ, ∂, Δ, π, ∞, →
3. Fractions: use a/b. Matrices: [[a,b],[c,d]] notation.
4. ${langRule}
5. ${isHindi ? 'Hindi technical terms: use standard academic Hindi. Example: "सारणिक", "आव्यूह", "अवकल समीकरण"' : 'English phrasing must be MECHANICAL: "Find", "Solve", "Evaluate", "Prove", "Derive" — not "Determine" or "Calculate the analytical solution".'}
6. Diploma level ONLY. Not degree/engineering level complexity.
7. Each question must use clean, solvable numbers.
8. No repeated concepts within this section.
9. Difficulty bias: ${modeModifier.difficulty_bias}

GENERATE NOW:`;
}

function buildFEEEPrompt(section, syllabus, keywords, pyqData, language, subjectName, units, modeModifier) {
  const isHindi = language === 'hindi';
  const langRule = isHindi
    ? 'Write ALL text in Hindi (Devanagari). Set "en" to empty string. Technical terms: use standard Hindi diploma terminology.'
    : 'Write all in English only. Set "hi" to empty string. Use diploma-level practical wording: "Explain", "Differentiate between", "Write short note on", "State and explain", "Draw and explain".';

  if (section.key === 'q6') {
    return `You are a senior BTEUP ${subjectName} paper setter.

=== GENERATION MODE: ${modeModifier.label} ===
${modeModifier.instruction}

TASK: Generate short note topics for Q6 (Short Notes section).

SYLLABUS:
${syllabus}

OUTPUT (return ONLY this JSON):
{ "notes": [ { "en": "topic", "hi": "", "unit": 1 } ] }

Generate EXACTLY 5 short note topics across all 5 units. Difficulty: EASY-MEDIUM (2.5 marks each).

RULES:
1. ONLY valid JSON. No markdown.
2. ${langRule}
3. Topics must be focused and specific. Examples: "Working principle of CRO", "Zener diode as voltage regulator", "Types of DC motors"
4. Diploma level. Difficulty bias: ${modeModifier.difficulty_bias}

GENERATE NOW:`;
  }

  // Q1-Q5: Each maps to one unit
  const qNum = parseInt(section.key.replace('q', ''));
  const unit = units.find(u => u.unit_no === qNum);
  const unitTopics = unit ? `${unit.unit_name}: ${unit.topics}` : syllabus;
  const unitPYQ = unit?.importance_score ? `(PYQ importance: ${unit.importance_score}, frequency: ${unit.pyq_frequency || 'N/A'})` : '';

  return `You are a senior BTEUP ${subjectName} paper setter with 20 years experience.

=== GENERATION MODE: ${modeModifier.label} ===
${modeModifier.instruction}

TASK: Generate 3 long-answer sub-parts for ${section.label}.
This question covers: ${unitTopics} ${unitPYQ}

SYLLABUS (full reference):
${syllabus}
${pyqData ? `
PYQ DATA:
${pyqData}` : ''}

OUTPUT (return ONLY this JSON):
{ "parts": [ { "en": "question text", "hi": "", "marks": 10 } ] }

Generate EXACTLY 3 parts (student attempts any 2). Each part: 10 marks. Difficulty: MEDIUM-HARD.

RULES:
1. ONLY valid JSON. No markdown.
2. ${langRule}
3. FEEE question types: explain working principle, derive equation, draw+explain circuit diagram, compare/differentiate, numerical calculation, state and prove theorem.
4. ${isHindi ? 'Hindi phrasing examples: "कार्यसिद्धांत समझाइए", "परिपथ आरेख बनाइए", "अंतर स्पष्ट कीजिए"' : 'English phrasing must be practical diploma-level: NOT engineering-degree level theory.'}
5. Difficulty bias: ${modeModifier.difficulty_bias}

GENERATE NOW:`;
}


// ═══════════════════════════════════════════════════════════════
// SUBJECT_CONFIGS — Structured JSON rules per subject namespace
// These are CONSUMED by prompt builders — no raw text dumping.
// Each config mirrors the generation_rules column in DB.
// ═══════════════════════════════════════════════════════════════

const SUBJECT_CONFIGS = {
  physics2: {
    name: 'Applied Physics-II',
    content_mix:   { numericals: 40, theory: 30, applications: 20, diagrams: 10 },
    bloom_mix:     { remember: 25, understand: 30, apply: 30, analyze: 15 },
    priority_topics: ['SHM', 'Wave equation', 'Doppler effect', 'Ultrasonic applications',
      'Total internal reflection', 'Critical angle', 'Optical fiber', 'LASER applications',
      'Kirchhoff laws', 'Capacitors series-parallel', 'Ohm law', 'Faraday laws',
      'Lenz law', 'PN junction diode', 'Zener diode'],
    forbidden_topics: ['Schrodinger equation', 'Quantum numbers', 'Nuclear reactor theory',
      'Relativistic mechanics', 'Advanced band theory', 'Maxwell equations derivation'],
    question_styles: {
      secA: ['Define', 'State', 'Write the formula for', 'What is', 'True/False'],
      secB: ['Differentiate between', 'State and explain', 'Write short note on', 'Give two applications of'],
      secC: ['Explain with diagram', 'Derive the expression for', 'What are applications of', 'Explain working of'],
      secD: ['A numerical on', 'Calculate', 'Find the value of', 'Derive and apply']
    },
    numerical_topics: ['capacitor problems', 'resistance network', 'Kirchhoff circuit', 'lens formula', 'wave velocity']
  },

  it_systems: {
    name: 'Introduction to IT Systems',
    content_mix:   { numericals: 0, theory: 40, applications: 35, diagrams: 25 },
    bloom_mix:     { remember: 35, understand: 30, apply: 25, analyze: 10 },
    priority_topics: ['RAM vs ROM', 'CPU components', 'Input output devices', 'Operating system functions',
      'Application vs system software', 'MS Word Excel PowerPoint', 'LAN MAN WAN',
      'Network topology', 'IP address', 'Cyber security threats', 'Virus antivirus',
      'E-commerce types', 'Internet and email'],
    forbidden_topics: ['Programming syntax', 'C Java Python code', 'SQL queries',
      'Algorithm complexity', 'Data structures', 'Compiler design theory',
      'Advanced TCP/IP protocols', 'Subnetting calculations'],
    question_styles: {
      secA: ['Define', 'What is', 'Expand the abbreviation', 'True/False', 'Fill in blank'],
      secB: ['Differentiate between', 'List the functions of', 'Write short note on', 'Give examples of'],
      secC: ['Explain with block diagram', 'What are types of', 'Explain the working of', 'State advantages and disadvantages'],
      secD: ['Draw and explain', 'Explain in detail', 'Compare and contrast']
    },
    numerical_topics: []
  },

  engg_mechanics: {
    name: 'Engineering Mechanics',
    content_mix:   { numericals: 50, theory: 25, applications: 15, diagrams: 10 },
    bloom_mix:     { remember: 20, understand: 25, apply: 40, analyze: 15 },
    priority_topics: ['Lami theorem', 'Resultant of forces', 'Resolution of forces', 'FBD',
      'Beam reactions', 'Moment of force', 'Varignon theorem', 'Coefficient of friction',
      'Angle of repose', 'Centroid of composite figure', 'Parallel axis theorem',
      'Mechanical advantage', 'Velocity ratio', 'Efficiency of machine'],
    forbidden_topics: ['Advanced dynamics', 'Vibration analysis', 'Torsion theory',
      'Shear force bending moment diagrams advanced', 'Fluid statics', 'Virtual work advanced'],
    question_styles: {
      secA: ['Define', 'State', 'Write the formula', 'What is', 'Fill in blank'],
      secB: ['State and prove', 'Differentiate between', 'Derive', 'Explain with diagram'],
      secC: ['A body of weight... find', 'Calculate the resultant', 'Find the centroid of'],
      secD: ['A simply supported beam...', 'A body rests on rough surface...', 'Find MI of']
    },
    numerical_topics: ['equilibrium problems', 'friction numerical', 'resultant force', 'centroid calculation', 'beam reactions', 'machine efficiency']
  },

  env_science: {
    name: 'Environmental Sciences',
    content_mix:   { numericals: 0, theory: 60, applications: 25, diagrams: 15 },
    bloom_mix:     { remember: 35, understand: 30, apply: 25, analyze: 10 },
    priority_topics: ['Air pollution causes effects control', 'Water pollution treatment',
      'Soil pollution noise pollution', 'Global warming greenhouse effect',
      'Ozone layer depletion CFC', 'Renewable energy solar wind biogas',
      'Waste management 3R', 'Ecosystem food chain food web',
      'Biodiversity conservation', 'Sustainable development', 'E-waste'],
    forbidden_topics: ['Advanced biochemistry equations', 'Organic chemistry reactions',
      'Genetic modification', 'Ecological modeling equations', 'Advanced environmental chemistry'],
    question_styles: {
      secA: ['Define', 'What is', 'Expand', 'True/False', 'Give one example of'],
      secB: ['What are causes of', 'What are effects of', 'Write short note on', 'Differentiate between'],
      secC: ['Explain in detail', 'What preventive measures', 'Explain with diagram', 'Discuss the role of'],
      secD: ['Write detailed note on', 'Explain the concept of', 'Discuss with examples']
    },
    numerical_topics: []
  },

  workshop: {
    name: 'Engineering Workshop Practice',
    content_mix:   { numericals: 0, theory: 35, applications: 40, diagrams: 25 },
    bloom_mix:     { remember: 30, understand: 30, apply: 30, analyze: 10 },
    priority_topics: ['Workshop safety rules', 'Types of welding arc gas', 'Welding joints',
      'Fitting tools files hacksaw', 'Carpentry tools saw chisel plane',
      'Soldering brazing difference', 'Lathe machine parts', 'Types of files',
      'Sheet metal operations', 'PPE personal protective equipment'],
    forbidden_topics: ['CNC programming G-code', 'Industrial automation PLC',
      'Gear cutting calculations', 'Precision metrology CMM', 'CAD CAM software'],
    question_styles: {
      secA: ['Name the tool', 'What is', 'Define', 'True/False', 'Fill in blank'],
      secB: ['Name five tools used in', 'State safety precautions for', 'Differentiate between', 'Write short note on'],
      secC: ['Explain the process of', 'Draw and label', 'What are types of', 'Explain with neat sketch'],
      secD: ['Explain in detail the process of', 'State all safety rules for', 'Draw and explain']
    },
    numerical_topics: []
  },

  engg_graphics: {
    name: 'Engineering Graphics',
    content_mix:   { numericals: 10, theory: 30, applications: 10, diagrams: 50 },
    bloom_mix:     { remember: 25, understand: 30, apply: 35, analyze: 10 },
    priority_topics: ['Orthographic projection three views', 'First angle third angle projection',
      'Isometric drawing', 'Isometric view from orthographic', 'Projection of points',
      'Projection of lines', 'True length of line', 'Plain scale diagonal scale',
      'Sectional views', 'Projection of solids prism cylinder'],
    forbidden_topics: ['AutoCAD commands', 'CAD software theory', '3D rendering',
      'Computer graphics algorithms', 'Animation theory'],
    question_styles: {
      secA: ['Define', 'What is RF', 'True/False', 'Name the type of projection', 'State'],
      secB: ['Differentiate between first and third angle', 'Define and explain', 'What are types of'],
      secC: ['Draw the projection of', 'Draw and explain', 'Construct a scale'],
      secD: ['Draw the three views of', 'Draw the isometric view of', 'Find the true shape of section']
    },
    numerical_topics: ['representative fraction calculation', 'scale construction']
  }
};

// ── PATTERN_GENERAL unified prompt builder ──
// Dispatches to correct subject config by prompt_namespace.
// Each subject gets completely ISOLATED prompt — zero cross-contamination.
function buildGeneralPrompt(subject, section, syllabus, keywords, pyqData, language, modeModifier, units) {
  const cfg = SUBJECT_CONFIGS[subject.prompt_namespace];
  if (!cfg) throw new Error(`No SUBJECT_CONFIG found for namespace: ${subject.prompt_namespace}`);

  const isHindi = language === 'hindi';
  const langRule = isHindi
    ? `Write ALL question text in Hindi (Devanagari script). Set "en" to empty string. Technical terms use standard Hindi diploma terminology.`
    : `Write all questions in English ONLY. Set "hi" to empty string. Use mechanical UPBTE-style phrasing — short, direct, board-exam wording.`;

  // Build section-specific instruction from config
  const styles = cfg.question_styles[section.key] || ['Explain', 'Define', 'Describe'];
  const secInstructions = {
    secA: `Generate EXACTLY ${section.count} very short questions (1 mark each = ${section.count} marks total).
Mix: MCQ, Fill-in-blank, True/False, One-word answer, Expand abbreviation.
Start questions with: ${styles.join(', ')}.
Cover all 5 units. Difficulty: EASY.`,
    secB: `Generate EXACTLY ${section.count} short-answer questions (2 marks each).
Student attempts ANY 5 of these ${section.count} questions = 10 marks.
Start questions with: ${styles.join(', ')}.
Cover minimum 4 units. Difficulty: EASY-MEDIUM.`,
    secC: `Generate EXACTLY ${section.count} long-answer questions (4 marks each).
Student attempts ANY 4 = 16 marks.
Start questions with: ${styles.join(', ')}.
At least 2 questions must require diagram. All 5 units must appear.
Difficulty: MEDIUM.`,
    secD: `Generate EXACTLY ${section.count} long/numerical questions (6 marks each).
Student attempts ANY 4 = 24 marks.
${cfg.content_mix.numericals > 0 ? `MUST include at least ${Math.ceil(section.count * 0.5)} numerical problems on: ${(cfg.numerical_topics || []).join(', ')}.` : 'Theory-focused. No numericals for this subject.'}
Difficulty: MEDIUM-HARD.`
  };

  const priorityBlock = cfg.priority_topics.length
    ? `HIGH PRIORITY TOPICS (these MUST appear — PYQ repeated, high scoring):\n${cfg.priority_topics.map(t => `  • ${t}`).join('\n')}`
    : '';

  const forbiddenBlock = cfg.forbidden_topics.length
    ? `STRICTLY FORBIDDEN TOPICS (DO NOT generate questions on these — out of syllabus):\n${cfg.forbidden_topics.map(t => `  ✗ ${t}`).join('\n')}`
    : '';

  const contentMixBlock = `CONTENT MIX REQUIRED:
  • Numericals: ${cfg.content_mix.numericals}%
  • Theory/Explanation: ${cfg.content_mix.theory}%
  • Applications/Examples: ${cfg.content_mix.applications}%
  • Diagram-based: ${cfg.content_mix.diagrams}%`;

  const bloomBlock = `BLOOM TAXONOMY MIX:
  • Remember (definitions, facts): ${cfg.bloom_mix.remember}%
  • Understand (explain, compare): ${cfg.bloom_mix.understand}%
  • Apply (problems, examples): ${cfg.bloom_mix.apply}%
  • Analyze (evaluate, design): ${cfg.bloom_mix.analyze}%`;

  return `You are a senior UPBTE (Uttar Pradesh Board of Technical Education) ${cfg.name} paper setter with 20 years of board examination experience.

=== GENERATION MODE: ${modeModifier.label} ===
${modeModifier.instruction}

TASK: Generate exam questions for ${section.label}.
${secInstructions[section.key]}

SYLLABUS (5 units — questions MUST stay within these boundaries):
${syllabus}

KEYWORDS BY UNIT:
${keywords}
${pyqData ? `\nPYQ FREQUENCY DATA (weight your selection accordingly):\n${pyqData}` : ''}

${priorityBlock}

${forbiddenBlock}

${contentMixBlock}

${bloomBlock}

OUTPUT FORMAT (return ONLY this exact JSON — no markdown, no explanation):
${
  section.key === 'secA'
  ? `{ "questions": [ { "en": "question text", "hi": "", "type": "mcq|fill|tf|one-word", "options": ["a","b","c","d"], "answer": "correct option or answer", "unit": 1 } ] }`
  : `{ "questions": [ { "en": "question text", "hi": "", "unit": 1, "marks": ${section.key === 'secB' ? 2 : section.key === 'secC' ? 4 : 6} } ] }`
}

CRITICAL RULES:
1. Output ONLY valid JSON. No text before or after.
2. ${langRule}
3. UPBTE diploma level ONLY — Polytechnic 2nd semester. NOT degree-level complexity.
4. No repeated concepts across questions.
5. Questions must feel human-made — not AI-generated. Use real exam wording patterns.
6. Difficulty bias: ${modeModifier.difficulty_bias}
7. ${isHindi ? 'Hindi technical terms: use standard diploma Hindi — e.g. "विद्युत धारा", "चुम्बकीय क्षेत्र", "पारितंत्र"' : 'English: use short mechanical phrasing — "State", "Define", "Explain", "Calculate", "Draw and label".'}
8. Every question must be answerable from the given syllabus. Nothing beyond it.
9. For diagram-required questions: add note in English "(Draw a neat labelled diagram)" at end.

GENERATE NOW:`;
}


// ═══════════════════════════════════════════════════════════════
// AI CALLER — Delegates to providerRouter.js
// All provider logic lives in api/providers/ — never add inline callers here.
// Cost routing: premium subjects (maths/physics) → Gemini first
//               theory subjects (EVS/IT/Workshop) → Groq/Mistral first
// ═══════════════════════════════════════════════════════════════

async function callAIWithFallback(prompt, maxTokens, temperature = 0.6, context = {}) {
  return routeToProvider(prompt, {
    subjectNamespace: context.subjectNamespace || 'general',
    sectionKey:       context.sectionKey       || 'general',
    maxTokens,
    temperature
  });
  // routeToProvider throws if all cascade providers fail
}

// Validators live in api/engine/validationEngine.js
// Imported at top of file — do not add inline validators here.

// ═══════════════════════════════════════════════════════════════
// SSE HELPERS — Stream progress events to client
// ═══════════════════════════════════════════════════════════════

function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export async function handleGeneratePolytechnicPaper(supabase, req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  // Origin check
  const origin = req.headers.origin || req.headers.referer || "";
  const allowedOrigins = ["mock24hr.vercel.app", "localhost", "127.0.0.1"];
  const isAllowed = allowedOrigins.some(o => origin.includes(o));
  if (!isAllowed && origin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Rate limit
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.headers["x-real-ip"]
    || req.socket?.remoteAddress
    || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: "Too many requests. Max 10 papers per 5 minutes. Please wait.",
      retryAfter: 60
    });
  }

  // Provider status check — warn if Gemini not configured (fallbacks handle it)
  const providerStatus = getProviderStatus();
  const anyConfigured = Object.values(providerStatus).some(p => p.configured);
  if (!anyConfigured) {
    return res.status(500).json({ error: 'No AI providers configured. Set GEMINI_API_KEY, OPENROUTER_API_KEY, or MISTRAL_API_KEY.' });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { subject_id, branch, language, mode } = body || {};
    const lang = (language === 'hindi') ? 'hindi' : 'english';
    const genMode = MODE_MODIFIERS[mode] ? mode : 'important';

    if (!subject_id) {
      return res.status(400).json({ error: "subject_id is required" });
    }

    // ── Fetch subject from DB ──
    const { data: subject, error: subErr } = await supabase
      .from("polytechnic_board_subjects")
      .select("*")
      .eq("id", subject_id)
      .eq("active", true)
      .single();

    if (subErr || !subject) {
      return res.status(404).json({ error: "Subject not found or inactive" });
    }

    // ── Fetch syllabus units ──
    const { data: units, error: unitErr } = await supabase
      .from("polytechnic_subject_units")
      .select("*")
      .eq("subject_id", subject_id)
      .order("unit_no");

    if (unitErr || !units?.length) {
      return res.status(404).json({ error: "Syllabus not found for this subject" });
    }

    // ── Get section config for this pattern ──
    const sections = PATTERN_SECTIONS[subject.renderer_type];
    if (!sections) {
      return res.status(400).json({ error: `Unknown paper pattern: ${subject.renderer_type}` });
    }

    // ── Setup SSE streaming ──
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send initial stage
    sendSSE(res, "progress", {
      stage: "init",
      message: "Analyzing official BTEUP syllabus...",
      progress: 5
    });

    // ── Generate sections sequentially ──
    const paperData = {};
    const totalSections = sections.length;
    let completedSections = 0;
    const failedSections = [];

    // ── Setup token budget tracker ──
    const budget = createBudgetTracker();

    for (const section of sections) {
      const progressPct = Math.round(10 + (completedSections / totalSections) * 80);

      sendSSE(res, 'progress', {
        stage: section.key,
        message: section.stageText,
        progress: progressPct,
        section: section.label
      });

      const prompt      = buildSectionPrompt(subject, units, section, lang, genMode);
      const modeAdj     = MODE_MODIFIERS[genMode]?.temperature_adj || 0;
      const temperature = 0.55 + modeAdj;
      const adjTokens   = budget.getAdjustedTokens(section.maxTokens);

      const { data: sectionData, valid, validation } = await retrySection(
        async (attempt) => {
          const providerResult = await callAIWithFallback(prompt, adjTokens, temperature, {
            subjectNamespace: subject.prompt_namespace || 'general',
            sectionKey: section.key
          });
          budget.record(section.key, providerResult);
          return providerResult.content;
        },
        (data) => validateSection(subject.renderer_type, section.key, data, section.count),
        {
          onProgress: (msg) => sendSSE(res, 'progress', { stage: section.key, message: msg, progress: progressPct }),
          sectionLabel: section.label,
          maxAttempts: 2
        }
      ).catch(err => {
        console.error(`[GENERATE] ${section.key} failed:`, err.message.substring(0, 150));
        return { data: null, valid: false, validation: { errors: [err.message] } };
      });

      if (sectionData) {
        paperData[section.key] = sectionData;
        completedSections++;
        if (!valid) {
          console.warn(`[VALIDATE] ${section.key}: accepted partial — ${validation?.errors?.[0] || 'validation issue'}`);
        }
      } else {
        failedSections.push({ key: section.key, label: section.label, error: validation?.errors?.[0] || 'generation failed' });
      }
    }

    // ── Format final response ──
    sendSSE(res, "progress", {
      stage: "render",
      message: "Formatting official board pattern paper...",
      progress: 95
    });

    // ── Cache paper in DB ──
    let paperId = null;
    try {
      const { data: saved } = await supabase
        .from("generated_papers")
        .insert({
          title: `${subject.name} — Generated Paper`,
          subject_id: null,          // Avoid FK constraint to old polytechnic_subjects table
          paper_type: 'generated',   // Must match CHECK constraint: generated|pyq|practice|mock
          paper_structure: paperData,
          generation_config: { subject_id: subject.id, renderer: subject.renderer_type, mode: genMode },
          is_public: false
        })
        .select("id")
        .single();
      paperId = saved?.id;
    } catch (cacheErr) {
      console.error("[CACHE] Failed to save paper:", cacheErr.message);
    }

    // ── Paper-level validation ──
    const paperValidation = validatePaper(paperData, failedSections);
    const budgetSummary   = budget.getSummary();

    // ── Send final paper data ──
    sendSSE(res, 'complete', {
      success: true,
      paper_id: paperId,
      subject: {
        name: subject.name,
        code: subject.code,
        semester: subject.semester,
        marks_total: subject.marks_total,
        renderer_type: subject.renderer_type,
        paper_style: subject.paper_style
      },
      branch: branch || 'Common',
      language: lang,
      mode: genMode,
      mode_label: MODE_MODIFIERS[genMode]?.label || genMode,
      sections: paperData,
      failed_sections: failedSections,
      paper_quality: {
        valid:        paperValidation.valid,
        warnings:     paperValidation.warnings,
        success_rate: paperValidation.successRate
      },
      generation_stats: {
        total_tokens:    budgetSummary.total_tokens,
        total_cost_usd:  budgetSummary.total_cost_usd,
        elapsed_ms:      budgetSummary.elapsed_ms,
        providers_used:  Object.keys(budgetSummary.provider_breakdown)
      },
      generated_at: new Date().toISOString()
    });

    res.end();

    // ── Async token usage log (non-blocking) ──
    logTokenUsage(supabase, budgetSummary, subject.id, paperId).catch(() => {});


  } catch (err) {
    console.error("[GENERATE] Fatal:", err.message);
    // If headers already sent (SSE mode), send error event
    if (res.headersSent) {
      sendSSE(res, "error", { error: err.message });
      res.end();
    } else {
      return res.status(500).json({ error: "Internal error: " + err.message });
    }
  }
}
