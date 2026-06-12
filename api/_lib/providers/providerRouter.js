// ═══════════════════════════════════════════════════════════════
// PROVIDER ROUTER v2 — Smart AI dispatch with cost optimization
//
// Cascade (from PRD):
//   Gemini → OpenRouter (DeepSeek/Llama) → Mistral → Retry
//
// Provider Roles:
//   Gemini       = Premium accuracy, final paper, numericals, board phrasing
//   OpenRouter   = Multi-model fallback (DeepSeek, Llama, Qwen free tier)
//   Mistral      = Structured fast worker, JSON cleanup, simple theory
//
// DO NOT add raw if/else per provider anywhere else in codebase.
// This is the ONLY place provider selection logic lives.
// ═══════════════════════════════════════════════════════════════

import { callGemini }     from './gemini.js';
import { callOpenRouter } from './openrouter.js';
import { callMistral, cleanupJSON } from './mistral.js';

// ── Subject Routing Table ──────────────────────────────────────
// Maps subject namespaces → provider tier preference
// Tier determines cascade order (see getProviderCascade below)
const SUBJECT_PROFILES = {
  // PREMIUM — Gemini first (numerical heavy, derivations, complex reasoning)
  math:           { tier: 'premium',  reason: 'complex numericals, symbolic math, derivations' },
  engg_mechanics: { tier: 'premium',  reason: 'force/torque numericals, FBD, beam reactions' },
  physics2:       { tier: 'premium',  reason: 'circuit numericals, optics, wave problems' },
  feee:           { tier: 'premium',  reason: 'AC/DC circuits, phasor diagrams, electrical machines' },
  engg_graphics:  { tier: 'premium',  reason: 'projection problems, orthographic views, isometric' },

  // STANDARD — OpenRouter first (theory, definitions, applications)
  env_science:    { tier: 'standard', reason: 'pure theory, no numericals, EVS concepts' },
  it_systems:     { tier: 'standard', reason: 'IT theory, definitions, computer basics' },
  workshop:       { tier: 'standard', reason: 'procedural knowledge, safety rules, tools' },
};

// ── Section Routing Table ──────────────────────────────────────
// Sections within a paper have independent tier assignments.
// High-complexity sections can override a standard-tier subject to use Gemini.
const SECTION_PROFILES = {
  // FAST — Groq/OpenRouter Llama sufficient
  partA: { tier: 'fast', reason: 'MCQ, T/F, fill-blank — low complexity objective' },
  secA:  { tier: 'fast', reason: '1-mark very short questions' },
  q6:    { tier: 'fast', reason: 'short note topics — structured list' },

  // BALANCED — OpenRouter DeepSeek good enough
  partB: { tier: 'balanced', reason: '2-mark short recall and formula questions' },
  secB:  { tier: 'balanced', reason: '2-mark short answer questions' },

  // PREMIUM — Gemini preferred
  partC: { tier: 'premium', reason: '4-mark derivations and explanations' },
  partD: { tier: 'premium', reason: '6-mark long answer + numericals' },
  secC:  { tier: 'premium', reason: '4-mark diagram and explanation questions' },
  secD:  { tier: 'premium', reason: '6-mark numerical/long answer questions' },
  q1:    { tier: 'premium', reason: 'DC circuits — complex numerical derivation' },
  q2:    { tier: 'premium', reason: 'AC circuits — phasor, impedance numericals' },
  q3:    { tier: 'premium', reason: 'electrical machines — motor/generator theory' },
  q4:    { tier: 'premium', reason: 'electronic devices — diode/transistor circuits' },
  q5:    { tier: 'premium', reason: 'digital electronics — logic gates, K-map' },
};

// Tier rank for comparison (higher = more expensive/accurate)
const TIER_RANK = { fast: 1, balanced: 2, standard: 2, premium: 3 };

/**
 * Get ordered provider cascade for a subject+section combination.
 *
 * Cascade logic:
 *   premium tier  → Gemini → OpenRouter → Mistral
 *   balanced tier → OpenRouter → Gemini → Mistral
 *   fast tier     → OpenRouter → Mistral → Gemini
 *   standard tier → OpenRouter → Mistral → Gemini  (theory subjects)
 *
 * @returns {string[]} e.g. ['gemini', 'openrouter', 'mistral']
 */
export function getProviderCascade(subjectNamespace, sectionKey) {
  const subjectProfile = SUBJECT_PROFILES[subjectNamespace] || { tier: 'balanced' };
  const sectionProfile = SECTION_PROFILES[sectionKey]       || { tier: 'balanced' };

  // Use the more demanding tier of subject vs section
  const effectiveTier = (TIER_RANK[sectionProfile.tier] || 2) > (TIER_RANK[subjectProfile.tier] || 2)
    ? sectionProfile.tier
    : subjectProfile.tier;

  switch (effectiveTier) {
    case 'premium':
      // Gemini first — best accuracy for complex content
      return ['gemini', 'openrouter', 'mistral'];

    case 'balanced':
      // OpenRouter (DeepSeek free) first — cost-effective for medium complexity
      return ['openrouter', 'gemini', 'mistral'];

    case 'fast':
    case 'standard':
      // OpenRouter → Mistral → Gemini (cheapest path first)
      return ['openrouter', 'mistral', 'gemini'];

    default:
      return ['gemini', 'openrouter', 'mistral'];
  }
}

// ── Standard Response Shape ────────────────────────────────────
// CONTRACT: Every provider returns this exact shape.
// {
//   success:        boolean
//   provider:       'gemini' | 'openrouter' | 'mistral'
//   model:          string      ← exact model ID used
//   content:        object      ← parsed JSON exam questions
//   tokens_used:    number
//   latency_ms:     number
//   finish_reason:  string
//   cost_estimate:  number      ← USD (0 for free tier)
//   error?:         string      ← only when success: false
//   quota_exhausted?: boolean   ← skip this provider hint
// }

/**
 * Route a generation request through the provider cascade.
 * Automatically falls back on any failure.
 * Throws only if ALL providers in the cascade fail.
 *
 * @param {string} prompt
 * @param {object} opts
 * @param {string}  opts.subjectNamespace
 * @param {string}  opts.sectionKey
 * @param {number}  opts.maxTokens
 * @param {number}  opts.temperature
 * @param {boolean} opts.useCleanupOnFail   try Mistral JSON repair as final rescue
 * @param {string}  opts.systemPrompt       custom system message override
 * @returns {object} Standard response shape with content field populated
 * @throws  Error if all cascade providers fail
 */
export async function routeToProvider(prompt, {
  subjectNamespace  = 'general',
  sectionKey        = 'general',
  maxTokens         = 4000,
  temperature       = 0.6,
  useCleanupOnFail  = true,
  systemPrompt      = null
} = {}) {
  const cascade = getProviderCascade(subjectNamespace, sectionKey);
  const opts = { maxTokens, temperature, systemPrompt };

  console.log(`[ROUTER] ${subjectNamespace}/${sectionKey} → [${cascade.join(' → ')}]`);

  let lastError = null;

  for (const providerName of cascade) {
    try {
      let result;

      switch (providerName) {
        case 'gemini':
          result = await callGemini(prompt, opts);
          break;
        case 'openrouter':
          result = await callOpenRouter(prompt, opts);
          break;
        case 'mistral':
          result = await callMistral(prompt, opts);
          break;
        default:
          console.warn(`[ROUTER] Unknown provider "${providerName}" — skipping`);
          continue;
      }

      if (result.success) {
        console.log(
          `[ROUTER] ✓ ${result.provider}/${result.model} ` +
          `(${result.latency_ms}ms, ${result.tokens_used} tokens, ~$${result.cost_estimate || 0})`
        );
        return result;
      }

      // Provider responded but returned failure (quota, bad key, etc.)
      lastError = result.error;
      console.warn(`[ROUTER] ✗ ${providerName}: ${result.error}`);

      if (result.quota_exhausted) {
        console.warn(`[ROUTER] ${providerName} quota exhausted — moving to next`);
      }

    } catch (e) {
      lastError = e.message;
      console.error(`[ROUTER] ${providerName} threw exception:`, e.message.substring(0, 150));
    }
  }

  // ── Last Resort: Mistral JSON Repair ──────────────────────────
  // If a provider returned malformed JSON, attempt cleanup via Mistral
  // (only useful if we captured raw text, which we don't currently — future enhancement)
  if (useCleanupOnFail) {
    console.warn('[ROUTER] All providers failed — trying Mistral cleanup rescue...');
    const cleaned = await cleanupJSON(`Regenerate a valid JSON for a BTEUP exam section prompt:\n${prompt.substring(0, 500)}`, {});
    if (cleaned.success) {
      console.log('[ROUTER] ✓ Mistral rescue succeeded');
      return { ...cleaned, rescued: true };
    }
  }

  throw new Error(
    `All providers exhausted [${cascade.join('→')}]. ` +
    `Last error: ${(lastError || 'unknown').substring(0, 200)}`
  );
}

/**
 * Health check — which providers are configured in environment?
 * Safe to expose to admin endpoints (returns no key values).
 */
export function getProviderStatus() {
  return {
    gemini: {
      configured: !!process.env.GEMINI_API_KEY,
      role: 'Premium accuracy engine — numericals, board phrasing, final paper'
    },
    openrouter: {
      configured: !!process.env.OPENROUTER_API_KEY,
      role: 'Multi-model fallback — DeepSeek, Llama, Qwen via single key'
    },
    mistral: {
      configured: !!process.env.MISTRAL_API_KEY,
      role: 'Structured fast worker — theory sections, JSON cleanup'
    }
  };
}
