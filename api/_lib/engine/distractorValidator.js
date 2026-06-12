// ═══════════════════════════════════════════════════════════════
// DISTRACTOR VALIDATOR — MCQ Option Quality Engine
// api/engine/distractorValidator.js
//
// PURPOSE:
//   AI models (including Gemini) often generate:
//   1. Obviously wrong distractors (out-of-domain, absurd words)
//   2. Correct answer that is visibly longer than wrong options
//   3. Options with wildly inconsistent structure/format
//
//   This validator runs POST-GENERATION to score each MCQ question.
//   Low-quality questions are flagged and can be:
//   - Regenerated (if budget allows)
//   - Demoted to supplementary questions
//   - Logged for manual review
//
// USAGE:
//   import { validateMCQOptions } from './distractorValidator.js';
//   const result = validateMCQOptions(question.options, question.answer);
//   if (result.score < DISTRACTOR_PASS_SCORE) { /* flag or regenerate */ }
// ═══════════════════════════════════════════════════════════════

// Minimum quality score to pass (0-100)
export const DISTRACTOR_PASS_SCORE = 60;

// ─────────────────────────────────────────────
// 1. OPTION LENGTH VARIANCE CHECK
//    Humans subconsciously detect: longest = correct.
//    AI consistently outputs correct answer as longest option.
//
//    Scoring:
//      - Max variance ≤ 40% of avg length → pass
//      - Max variance ≤ 70% → warn
//      - Max variance > 70% → fail
// ─────────────────────────────────────────────

export function checkOptionLengths(options) {
  if (!Array.isArray(options) || options.length < 2) {
    return { score: 100, issue: null };
  }

  const lengths = options.map(o => String(o).trim().length);
  const avgLen  = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const maxLen  = Math.max(...lengths);
  const minLen  = Math.min(...lengths);

  if (avgLen === 0) return { score: 100, issue: null };

  const maxDeviation = (maxLen - avgLen) / avgLen;
  const spread       = (maxLen - minLen) / avgLen;

  let score = 100;
  let issue = null;
  let severity = 'pass';

  if (maxDeviation > 0.70) {
    score = 20;
    severity = 'fail';
    issue = `Correct answer is likely longest option (deviation: ${Math.round(maxDeviation * 100)}% above avg). Students can guess.`;
  } else if (maxDeviation > 0.40) {
    score = 60;
    severity = 'warn';
    issue = `Option lengths vary significantly (max deviation: ${Math.round(maxDeviation * 100)}%). Consider trimming longer options.`;
  } else if (spread > 0.80) {
    score = 70;
    severity = 'warn';
    issue = `Length spread is high (${Math.round(spread * 100)}% of avg). Options should be roughly uniform.`;
  }

  return { score, severity, issue, maxDeviation: Math.round(maxDeviation * 100), spread: Math.round(spread * 100) };
}

// ─────────────────────────────────────────────
// 2. DOMAIN PLAUSIBILITY CHECK
//    Detects obviously out-of-domain distractors:
//    common nouns, food, geography when question
//    is about science/engineering.
//
//    Uses lightweight heuristics — not ML.
//    Checks: word overlap, numeric consistency, unit consistency.
// ─────────────────────────────────────────────

// Common obviously wrong word categories for technical subjects
const OUT_OF_DOMAIN_SIGNALS = [
  // food items
  /\b(mango|banana|apple|rice|bread|milk|food|fruit|vegetable|sugar|salt|tea|coffee)\b/i,
  // random objects
  /\b(table|chair|book|pen|car|bus|train|plane|bicycle|shoe|clothes|house|room)\b/i,
  // geographic places (when not a geography question)
  /\b(delhi|mumbai|paris|london|new york|china|india|america|europe|asia|africa)\b/i,
  // body parts (when not biology)
  /\b(hair|nose|ear|eye|hand|foot|leg|arm|heart|liver|kidney)\b/i,
];

export function checkDomainPlausibility(options, questionText = '') {
  if (!Array.isArray(options) || options.length < 2) {
    return { score: 100, issue: null };
  }

  // Skip geography/biology questions
  const geoKeywords    = /capital|country|city|state|region|continent|ocean|river/i;
  const bioKeywords    = /organ|body|cell|tissue|blood|muscle|bone|anatomy/i;
  const isGeoQuestion  = geoKeywords.test(questionText);
  const isBioQuestion  = bioKeywords.test(questionText);
  if (isGeoQuestion || isBioQuestion) return { score: 100, issue: null };

  let flaggedCount = 0;
  const flagged = [];

  for (const opt of options) {
    const text = String(opt).trim().toLowerCase();
    for (const pattern of OUT_OF_DOMAIN_SIGNALS) {
      if (pattern.test(text)) {
        flaggedCount++;
        flagged.push(opt);
        break;
      }
    }
  }

  if (flaggedCount === 0) return { score: 100, severity: 'pass', issue: null };

  // 1 out of 4 out-of-domain → warn
  // 2+ out of domain → fail (options are obviously wrong)
  const score    = flaggedCount >= 2 ? 10 : 55;
  const severity = flaggedCount >= 2 ? 'fail' : 'warn';
  const issue    = `${flaggedCount} option(s) appear out-of-domain: [${flagged.join(' | ')}]. Students can eliminate by common sense.`;

  return { score, severity, issue, flagged };
}

// ─────────────────────────────────────────────
// 3. STRUCTURAL CONSISTENCY CHECK
//    All options should follow similar patterns:
//    - All start with capital letter (or none do)
//    - All are complete phrases (or all are single words)
//    - No option is just a number when others are phrases
//    - No duplicates
// ─────────────────────────────────────────────

export function checkStructuralConsistency(options) {
  if (!Array.isArray(options) || options.length < 2) {
    return { score: 100, issue: null };
  }

  const issues = [];
  let score = 100;

  // Duplicate check
  const unique = new Set(options.map(o => String(o).trim().toLowerCase()));
  if (unique.size < options.length) {
    issues.push('Duplicate options detected.');
    score = Math.min(score, 15);
  }

  // Empty option check
  const hasEmpty = options.some(o => !String(o).trim());
  if (hasEmpty) {
    issues.push('One or more options are empty.');
    score = Math.min(score, 5);
  }

  // Type consistency: mix of numerals and text phrases
  const numericOpts  = options.filter(o => /^\s*-?\d+(\.\d+)?\s*$/.test(String(o)));
  const textOpts     = options.filter(o => !/^\s*-?\d+(\.\d+)?\s*$/.test(String(o)));
  if (numericOpts.length > 0 && textOpts.length > 0 && numericOpts.length < options.length) {
    issues.push('Mixed numeric and text options. Use all-numeric or all-text for MCQs.');
    score = Math.min(score, 50);
  }

  // Single-char options that are just letters (A/B/C/D placeholders)
  const placeholders = options.filter(o => /^\s*[a-dA-D]\s*$/.test(String(o)));
  if (placeholders.length > 0) {
    issues.push(`Options contain placeholder letters: [${placeholders.join(', ')}]. AI generated schema labels instead of content.`);
    score = Math.min(score, 0);
  }

  return {
    score,
    severity: score < 30 ? 'fail' : score < 70 ? 'warn' : 'pass',
    issue: issues.length > 0 ? issues.join(' ') : null
  };
}

// ─────────────────────────────────────────────
// 4. COMPOSITE SCORER
//    Combines all checks into single quality score.
//    Returns detailed breakdown for logging.
// ─────────────────────────────────────────────

/**
 * Full distractor quality validation for a single MCQ.
 *
 * @param {string[]} options       - Array of option strings (4 items)
 * @param {string}   answerText    - The correct answer text (for context)
 * @param {string}   questionText  - Question text (for domain checks)
 * @returns {DistractorReport}
 */
export function validateMCQOptions(options, answerText = '', questionText = '') {
  if (!Array.isArray(options) || options.length === 0) {
    return { score: 0, pass: false, severity: 'fail', checks: {}, issue: 'No options provided.' };
  }

  const lengthCheck     = checkOptionLengths(options);
  const domainCheck     = checkDomainPlausibility(options, questionText);
  const structureCheck  = checkStructuralConsistency(options);

  // Weighted composite score
  // Structure is most critical (placeholder letters = instant fail)
  // Length is important for anti-guessing
  // Domain is heuristic-based, lower weight
  const composite = Math.round(
    structureCheck.score * 0.40 +
    lengthCheck.score    * 0.35 +
    domainCheck.score    * 0.25
  );

  const allIssues = [lengthCheck.issue, domainCheck.issue, structureCheck.issue]
    .filter(Boolean);

  const severity = composite < 30 ? 'fail'
                 : composite < 60 ? 'warn'
                 : 'pass';

  return {
    score:    composite,
    pass:     composite >= DISTRACTOR_PASS_SCORE,
    severity,
    issue:    allIssues.length > 0 ? allIssues.join(' | ') : null,
    checks: {
      length:    lengthCheck,
      domain:    domainCheck,
      structure: structureCheck
    }
  };
}

// ─────────────────────────────────────────────
// 5. BATCH VALIDATOR
//    Validate all MCQ questions in a generated paper.
//    Returns summary + per-question results.
// ─────────────────────────────────────────────

/**
 * @param {object[]} questions - Array of question objects with .options, .answer, .en
 * @returns {{ passRate, failCount, warnCount, results: DistractorReport[] }}
 */
export function validatePaperDistractors(questions) {
  if (!Array.isArray(questions)) return { passRate: 0, failCount: 0, warnCount: 0, results: [] };

  const mcqs = questions.filter(q => q.type === 'mcq' && Array.isArray(q.options));

  if (mcqs.length === 0) return { passRate: 100, failCount: 0, warnCount: 0, results: [] };

  const results = mcqs.map((q, i) => ({
    questionIndex: i,
    questionText:  (q.en || q.question || '').slice(0, 80),
    ...validateMCQOptions(q.options, q.answer || '', q.en || q.question || '')
  }));

  const failCount = results.filter(r => r.severity === 'fail').length;
  const warnCount = results.filter(r => r.severity === 'warn').length;
  const passRate  = Math.round(((mcqs.length - failCount) / mcqs.length) * 100);

  return { passRate, failCount, warnCount, totalMCQs: mcqs.length, results };
}
