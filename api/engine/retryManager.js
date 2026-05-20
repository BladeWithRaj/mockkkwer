// ═══════════════════════════════════════════════════════════════
// RETRY MANAGER
// Purpose: Smart retry with exponential backoff.
//
// Retry ONLY when:
//   - JSON parse failed (malformed output)
//   - Missing required sections/fields
//   - Validation score < threshold
//   - Network timeout (transient)
//
// Do NOT retry on:
//   - 429 quota errors (waste of time — skip to next provider)
//   - 401/403 auth errors (key problem — skip provider)
//   - Syllabus violations (prompt problem — retry won't fix it)
// ═══════════════════════════════════════════════════════════════

const MAX_RETRIES  = 3;
const BASE_DELAY   = 1500; // ms
const MAX_DELAY    = 8000; // ms cap

// Error codes that should NOT be retried
const SKIP_RETRY_CODES = [401, 402, 403];

/**
 * Execute an async function with retry logic.
 *
 * @param {Function} fn        - async () => result
 * @param {object}   opts
 * @param {number}   opts.maxRetries   - max attempts (default 3)
 * @param {Function} opts.shouldRetry  - (err, attempt) => boolean — custom retry condition
 * @param {Function} opts.onRetry      - (err, attempt) => void — called before each retry
 * @param {string}   opts.label        - log label e.g. 'secA generation'
 * @returns result of fn on success
 * @throws last error after all retries exhausted
 */
export async function withRetry(fn, {
  maxRetries  = MAX_RETRIES,
  shouldRetry = defaultShouldRetry,
  onRetry     = null,
  label       = 'operation'
} = {}) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;

      const isLast = attempt >= maxRetries;
      const retry  = !isLast && shouldRetry(err, attempt);

      if (!retry) {
        console.error(`[RETRY] ${label} failed (attempt ${attempt}/${maxRetries}, no retry): ${err.message.substring(0, 120)}`);
        throw err;
      }

      const delay = Math.min(BASE_DELAY * Math.pow(1.8, attempt - 1), MAX_DELAY);
      console.warn(`[RETRY] ${label} attempt ${attempt}/${maxRetries} failed — retrying in ${Math.round(delay)}ms`);
      console.warn(`[RETRY] Error: ${err.message.substring(0, 100)}`);

      if (onRetry) onRetry(err, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Default retry condition — retry on transient/fixable errors only.
 */
function defaultShouldRetry(err, attempt) {
  const msg = err.message || '';

  // Never retry auth/billing errors
  if (SKIP_RETRY_CODES.some(code => msg.includes(String(code)))) return false;

  // Never retry if all providers exhausted (not a transient error)
  if (msg.includes('All providers exhausted') || msg.includes('All providers failed')) return false;

  // Retry on: parse failures, empty responses, timeouts, server errors
  const retryable = [
    'JSON',
    'parse',
    'empty',
    'timeout',
    '500',
    '502',
    '503',
    '504',
    'network',
    'ECONNRESET',
    'AbortError',
    'invalid response'
  ];

  return retryable.some(keyword => msg.toLowerCase().includes(keyword.toLowerCase()));
}

/**
 * Retry specifically for section generation — includes SSE progress reporting.
 *
 * @param {Function} generateFn     - async (attempt) => sectionData
 * @param {Function} validateFn     - (data) => { valid, errors }
 * @param {Function} onProgress     - (message) => void — for SSE updates
 * @param {string}   sectionLabel   - e.g. 'Section A'
 * @param {number}   maxAttempts    - default 2 (paper generation is expensive)
 * @returns { data, attempt, valid }
 */
export async function retrySection(generateFn, validateFn, {
  onProgress   = null,
  sectionLabel = 'section',
  maxAttempts  = 2
} = {}) {
  let lastData  = null;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        const delay = BASE_DELAY * attempt;
        if (onProgress) onProgress(`Retrying ${sectionLabel} (attempt ${attempt}/${maxAttempts})...`);
        await sleep(delay);
      }

      const data = await generateFn(attempt);
      const validation = validateFn(data);

      if (validation.valid) {
        return { data, attempt, valid: true, validation };
      }

      // Validation failed — log and retry
      lastData  = data;  // keep partial data in case we run out of retries
      lastError = validation.errors?.[0] || 'validation failed';
      console.warn(`[RETRY] ${sectionLabel} attempt ${attempt}: ${lastError}`);

      if (attempt === maxAttempts) {
        // Accept partial on last attempt — better than nothing
        console.warn(`[RETRY] Accepting partial result for ${sectionLabel} after ${maxAttempts} attempts`);
        return { data: lastData, attempt, valid: false, validation };
      }

    } catch (err) {
      lastError = err.message;
      console.error(`[RETRY] ${sectionLabel} attempt ${attempt} threw:`, err.message.substring(0, 100));

      if (attempt === maxAttempts) throw err;
    }
  }

  // Should not reach here but handle gracefully
  if (lastData) {
    return { data: lastData, attempt: maxAttempts, valid: false };
  }
  throw new Error(`${sectionLabel} failed after ${maxAttempts} attempts: ${lastError}`);
}

// ── Token-aware retry ───────────────────────────────────────────
/**
 * Retry with progressively shorter prompts on token limit errors.
 * Useful when a prompt is too long for a specific model's context window.
 */
export async function retryWithTruncation(fn, prompt, maxAttempts = 2) {
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn(currentPrompt);
    } catch (err) {
      const isTokenError = err.message.includes('token') ||
                           err.message.includes('context') ||
                           err.message.includes('length') ||
                           err.message.includes('413');

      if (isTokenError && attempt < maxAttempts) {
        // Truncate prompt by 25% and retry
        const newLength = Math.floor(currentPrompt.length * 0.75);
        console.warn(`[RETRY] Token limit hit — truncating prompt from ${currentPrompt.length} to ${newLength} chars`);
        currentPrompt = currentPrompt.substring(0, newLength) + '\n\nGENERATE NOW (truncated):';
        continue;
      }
      throw err;
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
