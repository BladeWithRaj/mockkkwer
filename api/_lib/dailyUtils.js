import crypto from "crypto";

// Secret salt for daily challenge seed — must match exactly in production env
const DAILY_SALT = process.env.DAILY_CHALLENGE_SALT || "super_secret_daily_salt_123";

/**
 * Returns the current UTC date string (YYYY-MM-DD)
 */
export function getUTCDateString() {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * Generates the deterministic question IDs for today's challenge
 * @param {Array} allQuestions - Array of all questions from the DB
 * @param {string} dateStr - YYYY-MM-DD
 * @returns {Array} Array of 10 question IDs
 */
export function generateDailyChallenge(allQuestions, dateStr) {
  // 1. Stable dataset snapshot: Sort by ID so order is consistent
  // even if new questions are added to the DB.
  const stableQuestions = [...allQuestions].sort((a, b) => a.id.localeCompare(b.id));

  // 2. Generate secure seed
  const hash = crypto.createHash("sha256");
  hash.update(dateStr + DAILY_SALT);
  const seedBuffer = hash.digest();
  
  // 3. Seeded shuffle algorithm (Fisher-Yates with PRNG)
  let currentIndex = stableQuestions.length;
  let seedIndex = 0;

  // Simple PRNG using our secure hash bytes
  const nextRandom = () => {
    const val = seedBuffer.readUInt32LE(seedIndex % (seedBuffer.length - 4));
    seedIndex = (seedIndex + 4) % (seedBuffer.length - 4);
    return val;
  };

  while (currentIndex !== 0) {
    const randomIndex = nextRandom() % currentIndex;
    currentIndex--;

    // Swap
    [stableQuestions[currentIndex], stableQuestions[randomIndex]] = [
      stableQuestions[randomIndex], stableQuestions[currentIndex]
    ];
  }

  // 4. Return top 10 questions
  return stableQuestions.slice(0, 10).map(q => q.id);
}
