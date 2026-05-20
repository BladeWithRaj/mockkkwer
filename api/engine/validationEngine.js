// ═══════════════════════════════════════════════════════════════
// VALIDATION ENGINE
// Purpose: AI output CANNOT directly render — must pass all checks.
//
// Pipeline:
//   1. Syntax   — is it valid JSON? do required fields exist?
//   2. Count    — does it have required number of questions?
//   3. Semantic — are fields populated correctly per question?
//   4. Pattern  — does it match board-style expectations?
//
// Returns: { valid: boolean, errors: string[], warnings: string[], score: number }
// ═══════════════════════════════════════════════════════════════

// ── Master validator entry point ──────────────────────────────
/**
 * Validate a single AI-generated section.
 * @param {string} rendererType  - 'PATTERN_MATH' | 'PATTERN_FEEE' | 'PATTERN_GENERAL'
 * @param {string} sectionKey    - 'partA' | 'secB' | 'q1' etc.
 * @param {object} data          - parsed AI response object
 * @param {number} expectedCount - expected question count
 * @returns {{ valid: boolean, errors: string[], warnings: string[], score: number }}
 */
export function validateSection(rendererType, sectionKey, data, expectedCount) {
  if (!data || typeof data !== 'object') {
    return fail(`Response is not an object — got ${typeof data}`);
  }

  switch (rendererType) {
    case 'PATTERN_MATH':    return validateMathSection(sectionKey, data, expectedCount);
    case 'PATTERN_FEEE':    return validateFEEESection(sectionKey, data);
    case 'PATTERN_GENERAL': return validateGeneralSection(sectionKey, data, expectedCount);
    default:
      // Unknown pattern — pass through with warning (don't block)
      return warn(`Unknown renderer type: ${rendererType} — skipping validation`);
  }
}

// ── PATTERN_MATH validator ──────────────────────────────────────
function validateMathSection(key, data, expectedCount) {
  const questions = data?.questions;

  if (!Array.isArray(questions)) return fail(`${key}: missing 'questions' array`);

  const minRequired = Math.floor(expectedCount * 0.7);
  if (questions.length < minRequired) {
    return fail(`${key}: got ${questions.length} questions, need at least ${minRequired} (70% of ${expectedCount})`);
  }

  const errors = [];
  const warnings = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const label = `${key}[${i + 1}]`;

    // Every question needs English text
    if (typeof q.en !== 'string' || q.en.trim().length < 5) {
      errors.push(`${label}: missing or too-short 'en' field`);
    }

    // MCQs in Part A must have exactly 4 options
    if (key === 'partA' && q.type === 'mcq') {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        errors.push(`${label}: MCQ must have exactly 4 options`);
      }
      if (!q.answer) warnings.push(`${label}: MCQ missing 'answer' field`);
    }

    // Unit field should be present
    if (q.unit === undefined || q.unit === null) {
      warnings.push(`${label}: missing 'unit' field — unit distribution tracking affected`);
    }
  }

  if (errors.length > questions.length * 0.3) {
    return fail(`${key}: too many invalid questions (${errors.length}/${questions.length})`, errors);
  }

  return result(errors.length === 0, errors, warnings, questions.length / expectedCount);
}

// ── PATTERN_FEEE validator ──────────────────────────────────────
function validateFEEESection(key, data) {
  // Q6 = short notes (returns { notes: [...] })
  if (key === 'q6') {
    const notes = data?.notes;
    if (!Array.isArray(notes)) return fail('q6: missing "notes" array');
    if (notes.length < 3)      return fail(`q6: need 5 notes, got ${notes.length}`);

    const errors = [];
    notes.forEach((n, i) => {
      if (typeof n.en !== 'string' || n.en.length < 3) {
        errors.push(`q6[${i + 1}]: missing 'en' field`);
      }
    });
    return result(errors.length === 0, errors, [], notes.length / 5);
  }

  // Q1-Q5 = long answer parts (returns { parts: [...] })
  const parts = data?.parts;
  if (!Array.isArray(parts)) return fail(`${key}: missing "parts" array`);
  if (parts.length < 2)      return fail(`${key}: need 3 parts, got ${parts.length}`);

  const errors = [];
  parts.forEach((p, i) => {
    if (typeof p.en !== 'string' || p.en.length < 10) {
      errors.push(`${key}[${i + 1}]: missing/short 'en' field`);
    }
    if (p.marks === undefined) {
      errors.push(`${key}[${i + 1}]: missing 'marks' field`);
    }
  });

  return result(errors.length === 0, errors, [], parts.length / 3);
}

// ── PATTERN_GENERAL validator ───────────────────────────────────
function validateGeneralSection(key, data, expectedCount) {
  const questions = data?.questions;

  if (!Array.isArray(questions) || questions.length === 0) {
    return fail(`${key}: questions array missing or empty`);
  }

  const minRequired = Math.ceil(expectedCount * 0.6);
  if (questions.length < minRequired) {
    return fail(`${key}: got ${questions.length}, need ${minRequired} (60% of ${expectedCount})`);
  }

  const errors = [];
  const warnings = [];

  questions.forEach((q, i) => {
    const label = `${key}[${i + 1}]`;
    if (!q.en || q.en.length < 5) errors.push(`${label}: missing 'en' text`);
    if (q.unit === undefined)     warnings.push(`${label}: missing 'unit' field`);

    // Section A should have type field
    if (key === 'secA' && !q.type) {
      warnings.push(`${label}: secA question missing 'type' (mcq/fill/tf/one-word)`);
    }
    // Section A MCQs need options
    if (key === 'secA' && q.type === 'mcq') {
      if (!Array.isArray(q.options) || q.options.length < 3) {
        errors.push(`${label}: MCQ needs at least 3 options`);
      }
    }
  });

  // Too many errors = reject
  if (errors.length > questions.length * 0.4) {
    return fail(`${key}: too many invalid questions (${errors.length}/${questions.length})`, errors);
  }

  return result(errors.length === 0, errors, warnings, questions.length / expectedCount);
}

// ── Duplicate Detection ─────────────────────────────────────────
/**
 * Check for duplicate questions across sections of a paper.
 * @param {object} paperData  - { sectionKey: { questions: [...] } }
 * @returns {string[]} list of duplicate 'en' texts found
 */
export function detectDuplicates(paperData) {
  const seen = new Map();
  const duplicates = [];

  for (const [sectionKey, sectionData] of Object.entries(paperData)) {
    const items = sectionData?.questions || sectionData?.parts || sectionData?.notes || [];
    for (const item of items) {
      const text = (item.en || '').toLowerCase().trim().substring(0, 80);
      if (text.length < 5) continue;
      if (seen.has(text)) {
        duplicates.push(`"${text.substring(0, 50)}..." appears in ${seen.get(text)} AND ${sectionKey}`);
      } else {
        seen.set(text, sectionKey);
      }
    }
  }

  return duplicates;
}

/**
 * Validate the entire generated paper after all sections complete.
 * @param {object} paperData      - complete paper sections
 * @param {Array}  failedSections - sections that failed generation
 * @returns {{ valid: boolean, warnings: string[], duplicates: string[] }}
 */
export function validatePaper(paperData, failedSections = []) {
  const warnings = [];

  if (failedSections.length > 0) {
    warnings.push(`${failedSections.length} section(s) failed: ${failedSections.map(s => s.key).join(', ')}`);
  }

  if (Object.keys(paperData).length === 0) {
    return { valid: false, warnings: ['Paper has no generated sections'], duplicates: [] };
  }

  const duplicates = detectDuplicates(paperData);
  if (duplicates.length > 0) {
    warnings.push(`Found ${duplicates.length} duplicate question(s)`);
  }

  // Paper is valid if at least 60% sections generated successfully
  const totalExpected = Object.keys(paperData).length + failedSections.length;
  const successRate = Object.keys(paperData).length / (totalExpected || 1);
  const valid = successRate >= 0.6;

  return { valid, warnings, duplicates, successRate };
}

// ── Helper constructors ─────────────────────────────────────────
function fail(message, errors = []) {
  return { valid: false, errors: [message, ...errors], warnings: [], score: 0 };
}

function warn(message) {
  return { valid: true, errors: [], warnings: [message], score: 1.0 };
}

function result(isValid, errors, warnings, score) {
  return { valid: isValid, errors, warnings, score: Math.min(score, 1) };
}
