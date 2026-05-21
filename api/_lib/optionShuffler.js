// ═══════════════════════════════════════════════════════════════
// OPTIONS SHUFFLER — Server-Side Utility
// api/_lib/optionShuffler.js
//
// Called at INSERT time so DB stores pre-randomized options.
// This means even if frontend has no shuffle logic, options
// are never in predictable order.
//
// Usage:
//   import { shuffleQuestionOptions } from '../_lib/optionShuffler.js';
//   const shuffled = shuffleQuestionOptions(options_en, options_hi, correct_index);
//   // use shuffled.options_en, shuffled.options_hi, shuffled.correct_index
// ═══════════════════════════════════════════════════════════════

/**
 * Fisher-Yates shuffle of options arrays.
 * Keeps options_en, options_hi, and correct_index in sync.
 *
 * @param {string[]} optionsEN   - English options (4 items)
 * @param {string[]|null} optionsHI - Hindi options (same length, or null)
 * @param {number} correctIndex  - Index of correct option BEFORE shuffle
 * @returns {{ options_en, options_hi, correct_index }}
 */
export function shuffleQuestionOptions(optionsEN, optionsHI, correctIndex) {
  if (!Array.isArray(optionsEN) || optionsEN.length < 2) {
    return { options_en: optionsEN, options_hi: optionsHI, correct_index: correctIndex };
  }

  const n = optionsEN.length;
  const hi = Array.isArray(optionsHI) && optionsHI.length === n ? optionsHI : optionsEN;

  // Build index map and shuffle it
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return {
    options_en:    indices.map(i => optionsEN[i]),
    options_hi:    indices.map(i => hi[i]),
    correct_index: indices.indexOf(correctIndex)   // new position of correct
  };
}

/**
 * Shuffle a batch of question rows (for bulk-import).
 * Mutates each row's options_en, options_hi, correct_index in-place.
 *
 * @param {object[]} rows - Array of DB row objects
 * @returns {object[]} same rows with shuffled options
 */
export function shuffleAllRows(rows) {
  return rows.map(row => {
    if (!Array.isArray(row.options_en) || row.options_en.length < 2) return row;
    const { options_en, options_hi, correct_index } = shuffleQuestionOptions(
      row.options_en,
      row.options_hi,
      row.correct_index ?? 0
    );
    return { ...row, options_en, options_hi, correct_index };
  });
}
