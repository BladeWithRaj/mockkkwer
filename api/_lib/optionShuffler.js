// ═══════════════════════════════════════════════════════════════
// OPTIONS SHUFFLER — Production Grade Engine v2
// api/_lib/optionShuffler.js
//
// FEATURES:
//   1. Fisher-Yates shuffle (not sort-random — statistically correct)
//   2. Seeded PRNG (mulberry32) — deterministic per attempt+question
//   3. Balanced distribution — tracks A:B:C:D counts, biases toward
//      underused positions so no position dominates across a paper
//   4. Hindi sync — EN and HI arrays always shuffled identically
//   5. Server-side shuffle at INSERT time (primary defence)
//   6. Frontend runtime shuffle with attempt seed (secondary defence)
//
// REVIEW SCREEN: q.correct is always the POST-SHUFFLE index.
//   analysis.js uses: if (oi === q.correct)   ← correct ✅
//   testEngine.js:    answer === q.correct      ← correct ✅
// ═══════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// 1. SEEDED PRNG — mulberry32
//    Deterministic, fast, good distribution.
//    Same seed → same sequence → same shuffle.
//    Used for per-attempt stable shuffles.
// ─────────────────────────────────────────────

/**
 * Create a mulberry32 PRNG from a 32-bit integer seed.
 * Returns a function () => float in [0, 1)
 */
function createRNG(seed) {
  let s = seed >>> 0; // force uint32
  return function () {
    s += 0x6D2B79F5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

/**
 * Generate a numeric seed from attemptId (string/number) + questionId (number).
 * Uses djb2-style hash so any string attemptId works.
 */
function makeSeed(attemptId, questionId) {
  let hash = 5381;
  const str = String(attemptId) + ':' + String(questionId);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // force int32
  }
  return Math.abs(hash) ^ (questionId * 1000003);
}

// ─────────────────────────────────────────────
// 2. CORE SHUFFLE (accepts custom RNG)
//    index-map approach: EN, HI, correctIndex
//    all stay in sync via same permutation.
// ─────────────────────────────────────────────

function _shuffleWithRNG(optionsEN, optionsHI, correctIndex, rng) {
  const n = optionsEN.length;
  const hi = Array.isArray(optionsHI) && optionsHI.length === n ? optionsHI : optionsEN;

  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return {
    options_en:    indices.map(i => optionsEN[i]),
    options_hi:    indices.map(i => hi[i]),
    correct_index: indices.indexOf(correctIndex)
  };
}

// ─────────────────────────────────────────────
// 3. DISTRIBUTION TRACKER
//    Keeps count of how often each position (0-3)
//    has been assigned the correct answer.
//    Used to bias shuffles toward underused slots.
// ─────────────────────────────────────────────

export function createDistributionTracker(n = 4) {
  const counts = new Array(n).fill(0);

  return {
    /**
     * Record that position `pos` was used as correct answer.
     */
    record(pos) {
      if (pos >= 0 && pos < n) counts[pos]++;
    },

    /**
     * Get the currently most underused positions (sorted ascending by count).
     */
    underusedPositions() {
      return Array.from({ length: n }, (_, i) => i)
        .sort((a, b) => counts[a] - counts[b]);
    },

    /**
     * Get current counts as {A, B, C, D} for debugging.
     */
    snapshot() {
      const labels = ['A', 'B', 'C', 'D'];
      return Object.fromEntries(counts.map((c, i) => [labels[i], c]));
    },

    counts
  };
}

// ─────────────────────────────────────────────
// 4. BALANCED SHUFFLE
//    After shuffle, if correct answer landed at an
//    overused position → swap it to most underused.
//    This corrects distribution bias over a paper.
// ─────────────────────────────────────────────

/**
 * @param {string[]} optionsEN
 * @param {string[]|null} optionsHI
 * @param {number} correctIndex      - pre-shuffle correct index
 * @param {object} tracker           - createDistributionTracker() instance
 * @param {function|null} rng        - optional seeded RNG, defaults to Math.random
 * @returns {{ options_en, options_hi, correct_index }}
 */
export function balancedShuffle(optionsEN, optionsHI, correctIndex, tracker, rng = null) {
  if (!Array.isArray(optionsEN) || optionsEN.length < 2) {
    return { options_en: optionsEN, options_hi: optionsHI, correct_index: correctIndex };
  }

  const randFn = rng || Math.random.bind(Math);
  let result = _shuffleWithRNG(optionsEN, optionsHI, correctIndex, randFn);

  // Check if correct answer landed at overused position
  if (tracker) {
    const underused = tracker.underusedPositions();
    const targetPos  = underused[0]; // most underused

    if (result.correct_index !== targetPos) {
      // Swap correct answer to target position
      const cur = result.correct_index;

      // Swap in EN
      [result.options_en[cur], result.options_en[targetPos]] =
      [result.options_en[targetPos], result.options_en[cur]];

      // Swap in HI (always in sync)
      [result.options_hi[cur], result.options_hi[targetPos]] =
      [result.options_hi[targetPos], result.options_hi[cur]];

      result.correct_index = targetPos;
    }

    tracker.record(result.correct_index);
  }

  return result;
}

// ─────────────────────────────────────────────
// 5. PER-ATTEMPT SEEDED SHUFFLE
//    Same question → different position each attempt.
//    Same question in SAME attempt → stable (deterministic).
//    Uses: attemptId + questionId as seed.
// ─────────────────────────────────────────────

/**
 * Create a shuffler bound to a specific attempt.
 * Call once per test session, then use shuffle() per question.
 *
 * @param {string|number} attemptId  - unique test attempt ID
 * @param {object|null} tracker      - optional distribution tracker
 * @returns {{ shuffle: function, distribution: function }}
 */
export function createAttemptShuffler(attemptId, tracker = null) {
  return {
    /**
     * Shuffle options for a specific question with seeded RNG.
     * @param {string[]} optionsEN
     * @param {string[]|null} optionsHI
     * @param {number} correctIndex
     * @param {number} questionId
     * @returns {{ options_en, options_hi, correct_index }}
     */
    shuffle(optionsEN, optionsHI, correctIndex, questionId) {
      if (!Array.isArray(optionsEN) || optionsEN.length < 2) {
        return { options_en: optionsEN, options_hi: optionsHI, correct_index: correctIndex };
      }
      const seed = makeSeed(attemptId, questionId);
      const rng  = createRNG(seed);
      return balancedShuffle(optionsEN, optionsHI, correctIndex, tracker, rng);
    },

    /**
     * Current distribution snapshot.
     */
    distribution() {
      return tracker ? tracker.snapshot() : null;
    }
  };
}

// ─────────────────────────────────────────────
// 6. SERVER-SIDE SIMPLE SHUFFLE (for INSERT)
//    No seed needed — DB randomized once at write.
//    Used by adminHandlers bulk-import + create.
// ─────────────────────────────────────────────

/**
 * Fisher-Yates shuffle of options arrays (uses Math.random).
 */
export function shuffleQuestionOptions(optionsEN, optionsHI, correctIndex) {
  return _shuffleWithRNG(
    optionsEN,
    optionsHI,
    correctIndex,
    Math.random.bind(Math)
  );
}

/**
 * Shuffle a batch of question rows (for bulk-import).
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
