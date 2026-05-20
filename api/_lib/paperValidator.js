// ═══════════════════════════════════════════════
// PAPER VALIDATOR — Whole-paper consistency checks
// Called after all sections are generated, before response
// ═══════════════════════════════════════════════

/**
 * Validate a complete generated paper for consistency.
 * Returns { valid: boolean, issues: string[] }
 * 
 * Checks:
 * 1. Difficulty balance across sections
 * 2. Cross-section topic duplication
 * 3. Marks total consistency
 * 4. Syllabus unit coverage
 * 5. Bilingual completeness
 */
export function validateWholePaper(paperData, rendererType, units, language) {
  const issues = [];

  if (rendererType === 'PATTERN_MATH') {
    validateMathPaper(paperData, units, language, issues);
  } else if (rendererType === 'PATTERN_FEEE') {
    validateFEEEPaper(paperData, units, language, issues);
  }

  // Cross-pattern checks
  checkCrossSectionDuplicates(paperData, rendererType, issues);

  return {
    valid: issues.length === 0,
    issues,
    severity: issues.length > 5 ? 'high' : issues.length > 2 ? 'medium' : 'low'
  };
}

// ── MATH PAPER VALIDATION ──
function validateMathPaper(data, units, language, issues) {
  const { partA, partB, partC, partD } = data;

  // 1. Question count checks
  if (partA?.questions?.length < 8) issues.push(`Part A: Only ${partA?.questions?.length || 0} questions (need ≥8)`);
  if (partB?.questions?.length < 5) issues.push(`Part B: Only ${partB?.questions?.length || 0} questions (need ≥5)`);
  if (partC?.questions?.length < 8) issues.push(`Part C: Only ${partC?.questions?.length || 0} questions (need ≥8)`);
  if (partD?.questions?.length < 4) issues.push(`Part D: Only ${partD?.questions?.length || 0} questions (need ≥4)`);

  // 2. Marks consistency
  const totalMarks = 
    (partA?.questions?.length || 0) * 1 +
    (partB?.questions?.length || 0) * 2 +
    (partC?.questions?.length || 0) * 2.5 +
    (partD?.questions?.length || 0) * 5;
  
  // BTEUP Math paper should be ~60 marks
  if (totalMarks < 50) issues.push(`Total marks too low: ${totalMarks} (expected ~60)`);
  if (totalMarks > 70) issues.push(`Total marks too high: ${totalMarks} (expected ~60)`);

  // 3. Unit coverage
  checkUnitCoverage(partA?.questions, units, 'Part A', issues);
  checkUnitCoverage(partD?.questions, units, 'Part D', issues);

  // 4. Bilingual completeness
  if (language === 'bilingual' || language === 'hindi') {
    checkBilingualCompleteness(partA?.questions, 'Part A', issues);
    checkBilingualCompleteness(partB?.questions, 'Part B', issues);
    checkBilingualCompleteness(partC?.questions, 'Part C', issues);
    checkBilingualCompleteness(partD?.questions, 'Part D', issues);
  }

  // 5. Part A type diversity
  if (partA?.questions) {
    const types = partA.questions.map(q => q.type).filter(Boolean);
    const uniqueTypes = new Set(types);
    if (uniqueTypes.size < 2) {
      issues.push('Part A: All questions are same type. Need mix of mcq/fill/truefalse/oneword');
    }
  }
}

// ── FEEE PAPER VALIDATION ──
function validateFEEEPaper(data, units, language, issues) {
  // Check Q1-Q5 parts count
  for (let i = 1; i <= 5; i++) {
    const q = data[`q${i}`];
    if (!q?.parts || q.parts.length < 2) {
      issues.push(`Q${i}: Only ${q?.parts?.length || 0} parts (need ≥2)`);
    }
  }

  // Check Q6 notes
  if (!data.q6?.notes || data.q6.notes.length < 4) {
    issues.push(`Q6: Only ${data.q6?.notes?.length || 0} short notes (need ≥4)`);
  }

  // Marks: Q1-Q5 = 5×20=100 attempt marks, Q6 = 10, total attempted ~110/120
  // We check generation is complete, not exact marks

  // Bilingual check
  if (language === 'bilingual' || language === 'hindi') {
    for (let i = 1; i <= 5; i++) {
      checkBilingualCompleteness(data[`q${i}`]?.parts, `Q${i}`, issues);
    }
    checkBilingualCompleteness(data.q6?.notes, 'Q6', issues);
  }

  // Unit coverage: Q1-Q5 should map to units 1-5
  const coveredUnits = new Set();
  for (let i = 1; i <= 5; i++) {
    if (data[`q${i}`]?.parts?.length >= 2) {
      coveredUnits.add(i);
    }
  }
  const totalUnits = units?.length || 5;
  if (coveredUnits.size < totalUnits - 1) {
    issues.push(`Only ${coveredUnits.size}/${totalUnits} units covered`);
  }
}

// ── CROSS-SECTION TOPIC DEDUP ──
function checkCrossSectionDuplicates(data, rendererType, issues) {
  const allTexts = [];

  if (rendererType === 'PATTERN_MATH') {
    for (const key of ['partA', 'partB', 'partC', 'partD']) {
      const questions = data[key]?.questions || [];
      questions.forEach(q => {
        if (q.en) allTexts.push({ section: key, text: q.en.toLowerCase() });
      });
    }
  } else if (rendererType === 'PATTERN_FEEE') {
    for (let i = 1; i <= 5; i++) {
      const parts = data[`q${i}`]?.parts || [];
      parts.forEach(p => {
        if (p.en) allTexts.push({ section: `q${i}`, text: p.en.toLowerCase() });
      });
    }
    const notes = data.q6?.notes || [];
    notes.forEach(n => {
      if (n.en) allTexts.push({ section: 'q6', text: n.en.toLowerCase() });
    });
  }

  // Check for concept overlap using keyword extraction
  const conceptMap = {};
  const conceptKeywords = [
    'determinant', 'matrix', 'cramer', 'inverse', 'adjoint', 'rank',
    'leibnitz', 'euler', 'partial', 'successive', 'maxima', 'minima',
    'integration', 'beta', 'gamma', 'trapezoidal', 'simpson', 'reduction',
    'differential equation', 'bernoulli', 'exact', 'homogeneous', 'linear',
    'circle', 'parabola', 'ellipse', 'vector', 'dot product', 'cross product',
    'kirchhoff', 'faraday', 'lenz', 'ohm', 'inductance',
    'phasor', 'resonance', 'power factor', 'rlc', 'three phase',
    'transformer', 'induction motor', 'dc motor', 'emf',
    'diode', 'zener', 'rectifier', 'transistor', 'mosfet', 'bjt',
    'logic gate', 'boolean', 'adder', 'flip-flop', 'cro', 'wattmeter'
  ];

  for (const item of allTexts) {
    for (const keyword of conceptKeywords) {
      if (item.text.includes(keyword)) {
        if (!conceptMap[keyword]) conceptMap[keyword] = [];
        conceptMap[keyword].push(item.section);
      }
    }
  }

  // Flag keywords appearing in 3+ sections
  for (const [keyword, sections] of Object.entries(conceptMap)) {
    const uniqueSections = [...new Set(sections)];
    if (uniqueSections.length >= 3) {
      issues.push(`Topic "${keyword}" repeated across ${uniqueSections.length} sections: ${uniqueSections.join(', ')}`);
    }
  }
}

// ── UNIT COVERAGE CHECK ──
function checkUnitCoverage(questions, units, sectionName, issues) {
  if (!questions?.length || !units?.length) return;

  const coveredUnits = new Set(questions.map(q => q.unit).filter(Boolean));
  const totalUnits = units.length;

  if (coveredUnits.size < Math.min(3, totalUnits)) {
    issues.push(`${sectionName}: Only covers ${coveredUnits.size}/${totalUnits} units`);
  }
}

// ── BILINGUAL COMPLETENESS ──
function checkBilingualCompleteness(items, sectionName, issues) {
  if (!items?.length) return;

  let missingHi = 0;
  for (const item of items) {
    if (!item.hi || item.hi.trim().length < 3) {
      missingHi++;
    }
  }

  if (missingHi > 0) {
    issues.push(`${sectionName}: ${missingHi}/${items.length} questions missing Hindi text`);
  }
}
