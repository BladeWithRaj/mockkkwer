// ═══════════════════════════════════════════════════════════════
// PROVIDER ROUTER — Smart AI dispatch with cost optimization
//
// Philosophy (from PRD):
//   • Gemini  = premium accuracy engine (final paper, numericals)
//   • Groq    = ultra-fast utility layer (drafts, simple sections)
//   • Mistral = structured fast worker (theory subjects, cleanup)
//
// DO NOT add raw if/else per provider — use this router only.
// ═══════════════════════════════════════════════════════════════

import { callGemini }  from './gemini.js';
import { callGroq }    from './groq.js';
import { callMistral, cleanupJSON } from './mistral.js';

// ── Subject Cost Profiles ────────────────────────────────────
// Determines which provider handles each subject namespace.
// Heavy numerical/reasoning → Gemini preferred
// Theory-only, cheap → Mistral/Groq can handle it
const SUBJECT_PROFILES = {
  // ── Numerical-heavy — Gemini preferred ──
  math:           { tier: 'premium',  reason: 'numerical heavy, complex derivations' },
  engg_mechanics: { tier: 'premium',  reason: 'force/torque numericals, derivations' },
  physics2:       { tier: 'premium',  reason: 'numerical + circuit problems' },
  feee:           { tier: 'premium',  reason: 'electrical circuits, AC/DC numericals' },

  // ── Theory-heavy — Mistral/Groq handles fine ──
  env_science:    { tier: 'standard', reason: 'pure theory, no numericals' },
  it_systems:     { tier: 'standard', reason: 'theory, definitions, diagrams' },
  workshop:       { tier: 'standard', reason: 'procedural knowledge, safety rules' },

  // ── Mixed — Groq primary, Gemini for final quality ──
  engg_graphics:  { tier: 'balanced', reason: 'diagram questions, mixed content' },
};

// ── Section Cost Profiles ────────────────────────────────────
// Some sections within a subject can use cheaper providers
const SECTION_PROFILES = {
  // Simple objectives — fast providers fine
  partA:  { tier: 'fast', reason: 'MCQ/T-F/fill-blank = low complexity' },
  secA:   { tier: 'fast', reason: 'very short 1-mark questions' },
  q6:     { tier: 'fast', reason: 'short note topics only' },

  // Medium complexity
  partB:  { tier: 'balanced', reason: 'short recall questions' },
  secB:   { tier: 'balanced', reason: '2-mark short answers' },

  // High complexity — Gemini preferred
  partC:  { tier: 'premium', reason: '4-mark derivations/explanations' },
  partD:  { tier: 'premium', reason: '6-mark proofs and long numericals' },
  secC:   { tier: 'premium', reason: '4-mark diagram questions' },
  secD:   { tier: 'premium', reason: '6-mark numerical/long answers' },
  q1: { tier: 'premium', reason: 'DC circuits — numerical' },
  q2: { tier: 'premium', reason: 'AC circuits — phasor, numerical' },
  q3: { tier: 'premium', reason: 'machines — electrical engineering' },
  q4: { tier: 'premium', reason: 'electronics — derivation heavy' },
  q5: { tier: 'premium', reason: 'digital electronics — logic design' },
};

/**
 * Determine the best provider cascade for a given subject + section.
 * Returns ordered array: first = try first, last = last resort.
 *
 * @param {string} subjectNamespace  - e.g. 'env_science', 'math'
 * @param {string} sectionKey        - e.g. 'secA', 'partD', 'q1'
 * @returns {string[]} Provider order: 'gemini' | 'groq' | 'mistral'
 */
export function getProviderCascade(subjectNamespace, sectionKey) {
  const subjectProfile = SUBJECT_PROFILES[subjectNamespace] || { tier: 'balanced' };
  const sectionProfile = SECTION_PROFILES[sectionKey]       || { tier: 'balanced' };

  // Effective tier = most restrictive of subject & section
  const effectiveTier = tierRank(sectionProfile.tier) > tierRank(subjectProfile.tier)
    ? sectionProfile.tier
    : subjectProfile.tier;

  switch (effectiveTier) {
    case 'premium':
      // Gemini → Groq → Mistral (only if theory subject)
      return subjectProfile.tier === 'standard'
        ? ['gemini', 'mistral', 'groq']
        : ['gemini', 'groq', 'mistral'];

    case 'balanced':
      // Groq first (fast + cheap), Gemini as quality fallback
      return ['groq', 'gemini', 'mistral'];

    case 'fast':
      // Groq primary, Mistral secondary, Gemini only if both fail
      return ['groq', 'mistral', 'gemini'];

    default:
      return ['gemini', 'groq', 'mistral'];
  }
}

function tierRank(tier) {
  return { fast: 1, balanced: 2, standard: 2, premium: 3 }[tier] || 2;
}

// ── Standard Response Shape ───────────────────────────────────
// Every provider MUST return this. Router enforces it.
//
// {
//   success: boolean
//   provider: 'gemini' | 'groq' | 'mistral'
//   model: string
//   content: object         ← parsed JSON, the actual exam questions
//   tokens_used: number
//   latency_ms: number
//   finish_reason: string
//   error?: string          ← only if success: false
//   quota_exhausted?: bool  ← hint to skip provider next time
// }

/**
 * Route a prompt to the right provider cascade and return content.
 * Automatically falls back through the cascade on failure.
 *
 * @param {string} prompt
 * @param {object} opts
 * @param {string}  opts.subjectNamespace - for cost routing
 * @param {string}  opts.sectionKey       - for cost routing
 * @param {number}  opts.maxTokens
 * @param {number}  opts.temperature
 * @param {boolean} opts.useCleanupOnFail - try Mistral JSON cleanup on parse errors
 * @returns {object} { content, provider, model, latency_ms, ... }
 * @throws  Error if all providers in cascade fail
 */
export async function routeToProvider(prompt, {
  subjectNamespace = 'general',
  sectionKey = 'general',
  maxTokens = 4000,
  temperature = 0.6,
  useCleanupOnFail = true
} = {}) {
  const cascade = getProviderCascade(subjectNamespace, sectionKey);
  const opts = { maxTokens, temperature };

  console.log(`[ROUTER] ${subjectNamespace}/${sectionKey} → cascade: [${cascade.join(' → ')}]`);

  let lastError = null;
  let lastRawText = null;

  for (const providerName of cascade) {
    try {
      let result;

      switch (providerName) {
        case 'gemini':  result = await callGemini(prompt, opts);  break;
        case 'groq':    result = await callGroq(prompt, opts);    break;
        case 'mistral': result = await callMistral(prompt, opts); break;
        default:
          console.warn(`[ROUTER] Unknown provider: ${providerName}, skipping`);
          continue;
      }

      if (result.success) {
        console.log(`[ROUTER] ✓ ${providerName}/${result.model} (${result.latency_ms}ms, ${result.tokens_used} tokens)`);
        return result;
      }

      // Provider returned failure
      lastError = result.error;
      console.warn(`[ROUTER] ✗ ${providerName}: ${result.error}`);

      // If quota exhausted, skip to next immediately
      if (result.quota_exhausted) {
        console.warn(`[ROUTER] ${providerName} quota exhausted — skipping`);
        continue;
      }

    } catch (e) {
      lastError = e.message;
      console.error(`[ROUTER] ${providerName} threw:`, e.message.substring(0, 100));
    }
  }

  // All cascade providers failed — try Mistral JSON cleanup as last resort
  if (useCleanupOnFail && lastRawText) {
    console.warn('[ROUTER] All providers failed — attempting Mistral JSON cleanup...');
    const cleaned = await cleanupJSON(lastRawText, {});
    if (cleaned.success) {
      console.log('[ROUTER] ✓ Mistral cleanup rescued the response');
      return { ...cleaned, rescued: true };
    }
  }

  throw new Error(
    `All providers failed [${cascade.join('→')}]. Last error: ${(lastError || 'unknown').substring(0, 150)}`
  );
}

/**
 * Health-check: verify which providers are configured.
 * Call this during startup/debug — not on every request.
 */
export function getProviderStatus() {
  return {
    gemini:  { configured: !!process.env.GEMINI_API_KEY,  role: 'Premium accuracy engine' },
    groq:    { configured: !!process.env.GROQ_API_KEY,    role: 'Ultra-fast utility layer' },
    mistral: { configured: !!process.env.MISTRAL_API_KEY, role: 'Structured fast worker' },
  };
}
