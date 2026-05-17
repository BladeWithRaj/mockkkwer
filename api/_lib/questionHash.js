// ═══════════════════════════════════════════════
// QUESTION HASH — Duplicate detection via normalized text
// ═══════════════════════════════════════════════

import { createHash } from "crypto";

/**
 * Generate a normalized hash for duplicate detection.
 * Normalizes: lowercase, strip whitespace/punctuation, sort options.
 * 
 * @param {string} questionText - The question text (English preferred)
 * @param {string[]} options - Array of option texts
 * @returns {string} MD5 hex hash
 */
export function generateQuestionHash(questionText, options = []) {
  const normalizedQ = normalize(questionText || "");
  const normalizedOpts = (options || [])
    .map(o => normalize(o || ""))
    .filter(Boolean)
    .sort()  // Sort so option order doesn't affect hash
    .join("|");

  const payload = `${normalizedQ}::${normalizedOpts}`;
  return createHash("md5").update(payload).digest("hex");
}

/**
 * Normalize text for comparison:
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common punctuation
 * - Trim
 */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[\s\u00A0]+/g, " ")       // Collapse whitespace
    .replace(/[.,;:!?'"()\[\]{}<>\/\\@#$%^&*_+=~`|—–-]+/g, "") // Strip punctuation
    .trim();
}

/**
 * Backfill question_hash for existing questions that don't have one.
 * Call this once after migration to populate hashes for 1102 existing questions.
 * 
 * @param {object} supabase - Service-role client
 * @returns {Promise<{updated: number, duplicates: number}>}
 */
export async function backfillQuestionHashes(supabase) {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, question_en, options_en")
    .is("question_hash", null)
    .limit(1000);

  if (error) {
    console.error("[HASH BACKFILL] Failed:", error.message);
    return { updated: 0, duplicates: 0 };
  }

  let updated = 0, duplicates = 0;
  const seenHashes = new Set();

  for (const q of (questions || [])) {
    const hash = generateQuestionHash(q.question_en, q.options_en || []);
    
    if (seenHashes.has(hash)) {
      duplicates++;
      continue;
    }
    seenHashes.add(hash);

    const { error: uErr } = await supabase
      .from("questions")
      .update({ question_hash: hash })
      .eq("id", q.id);

    if (uErr) {
      // Likely a unique constraint violation = duplicate
      if (uErr.code === "23505") {
        duplicates++;
      } else {
        console.warn(`[HASH BACKFILL] Failed for q#${q.id}:`, uErr.message);
      }
    } else {
      updated++;
    }
  }

  return { updated, duplicates };
}
