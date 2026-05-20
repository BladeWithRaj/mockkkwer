// ═══════════════════════════════════════════════════════════════
// TOKEN BUDGET MANAGER
// Purpose: Track, limit, and optimize token usage per request.
//
// Problem: Multi-section paper = 4-6 AI calls = cost explosion risk.
// Solution: Budget per request, track usage, warn before overspend.
//
// Note: Vercel serverless = no persistent state between requests.
//       This manages budget WITHIN a single paper generation request.
//       For cross-request daily tracking → use Supabase (see logUsage).
// ═══════════════════════════════════════════════════════════════

// ── Token cost estimates (per 1000 tokens, in USD) ────────────
// Based on public pricing as of 2025
const PROVIDER_COSTS = {
  // Gemini 2.0 Flash: $0.075/M input + $0.30/M output ≈ avg $0.0002/K
  'gemini': {
    input_per_k:  0.000075,
    output_per_k: 0.000300,
    avg_per_k:    0.000200
  },
  // OpenRouter DeepSeek V3 free: $0
  'openrouter_free': {
    input_per_k:  0,
    output_per_k: 0,
    avg_per_k:    0
  },
  // OpenRouter DeepSeek V3 paid: ~$0.27/M input
  'openrouter': {
    input_per_k:  0.000270,
    output_per_k: 0.001100,
    avg_per_k:    0.000500
  },
  // Mistral Small: $0.10/M input + $0.30/M output
  'mistral': {
    input_per_k:  0.000100,
    output_per_k: 0.000300,
    avg_per_k:    0.000200
  }
};

// ── Budget limits ─────────────────────────────────────────────
const BUDGETS = {
  per_section:  8000,    // max tokens per section generation
  per_paper:    50000,   // max tokens for full paper generation
  daily_warn:   500000,  // warn at 500k tokens/day across all users
  daily_hard:   2000000  // hard stop at 2M tokens/day (cost protection)
};

/**
 * Create a per-request token budget tracker.
 * One instance per paper generation request.
 *
 * @param {number} paperBudget  - max total tokens for this paper (default from BUDGETS)
 * @returns Budget tracker object
 */
export function createBudgetTracker(paperBudget = BUDGETS.per_paper) {
  const sections = {};
  let totalTokens = 0;
  let totalCostUSD = 0;
  const startTime = Date.now();

  return {
    /**
     * Record token usage after a successful AI call.
     * @param {string} sectionKey    - e.g. 'secA'
     * @param {object} providerResult - standard provider response
     */
    record(sectionKey, providerResult) {
      const tokens = providerResult.tokens_used || 0;
      const cost   = providerResult.cost_estimate || estimateCost(providerResult.provider, tokens);

      sections[sectionKey] = { tokens, cost, provider: providerResult.provider, model: providerResult.model };
      totalTokens += tokens;
      totalCostUSD += cost;

      // Warn if approaching per-section limit
      if (tokens > BUDGETS.per_section * 0.9) {
        console.warn(`[BUDGET] ${sectionKey}: ${tokens} tokens — approaching section limit (${BUDGETS.per_section})`);
      }

      // Warn if total approaching paper budget
      if (totalTokens > paperBudget * 0.8) {
        console.warn(`[BUDGET] Total ${totalTokens}/${paperBudget} tokens used — 80% of paper budget`);
      }
    },

    /**
     * Check if we're within budget before making an AI call.
     * @param {number} estimatedTokens  - rough estimate for next call
     * @returns {{ allowed: boolean, reason?: string }}
     */
    canProceed(estimatedTokens = 4000) {
      if (totalTokens + estimatedTokens > paperBudget) {
        return {
          allowed: false,
          reason: `Budget exceeded: ${totalTokens} + ${estimatedTokens} > ${paperBudget} tokens`
        };
      }
      return { allowed: true };
    },

    /**
     * Get recommended maxTokens for a section based on remaining budget.
     * @param {number} defaultMax  - section's default max tokens
     * @returns {number} adjusted max tokens
     */
    getAdjustedTokens(defaultMax) {
      const remaining = paperBudget - totalTokens;
      return Math.min(defaultMax, Math.max(1000, remaining - 2000));
    },

    /** Full usage summary for logging/SSE */
    getSummary() {
      return {
        total_tokens:    totalTokens,
        total_cost_usd:  +totalCostUSD.toFixed(6),
        budget_used_pct: +((totalTokens / paperBudget) * 100).toFixed(1),
        elapsed_ms:      Date.now() - startTime,
        sections,
        provider_breakdown: buildProviderBreakdown(sections)
      };
    }
  };
}

function buildProviderBreakdown(sections) {
  const breakdown = {};
  for (const [, s] of Object.entries(sections)) {
    const p = s.provider || 'unknown';
    if (!breakdown[p]) breakdown[p] = { calls: 0, tokens: 0, cost: 0 };
    breakdown[p].calls  += 1;
    breakdown[p].tokens += s.tokens;
    breakdown[p].cost   += s.cost;
  }
  return breakdown;
}

function estimateCost(provider, tokens) {
  // Free tier detection (OpenRouter free models have :free suffix)
  const costs = PROVIDER_COSTS[provider] || PROVIDER_COSTS['openrouter'];
  return +((tokens / 1000) * costs.avg_per_k).toFixed(6);
}

// ── Daily usage logging (Supabase-backed) ─────────────────────
/**
 * Log a completed paper's token usage to Supabase for daily tracking.
 * Call after paper generation completes.
 *
 * @param {object} supabase      - Supabase client
 * @param {object} summary       - from budgetTracker.getSummary()
 * @param {string} subjectId     - subject UUID
 * @param {string} paperId       - generated paper UUID (nullable)
 */
export async function logTokenUsage(supabase, summary, subjectId, paperId = null) {
  try {
    await supabase.from('ai_usage_log').insert({
      subject_id:       subjectId,
      paper_id:         paperId,
      total_tokens:     summary.total_tokens,
      total_cost_usd:   summary.total_cost_usd,
      provider_breakdown: summary.provider_breakdown,
      elapsed_ms:       summary.elapsed_ms,
      logged_at:        new Date().toISOString()
    });
  } catch (e) {
    // Non-critical — log to console only, don't fail the request
    console.warn('[BUDGET] Usage log failed (non-critical):', e.message.substring(0, 80));
  }
}

/**
 * Get today's token usage from DB.
 * Use to enforce daily hard limits.
 *
 * @param {object} supabase
 * @returns {{ today_tokens: number, today_cost_usd: number }}
 */
export async function getDailyUsage(supabase) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('ai_usage_log')
      .select('total_tokens, total_cost_usd')
      .gte('logged_at', today + 'T00:00:00Z');

    if (!data?.length) return { today_tokens: 0, today_cost_usd: 0 };

    return {
      today_tokens:   data.reduce((s, r) => s + (r.total_tokens || 0), 0),
      today_cost_usd: +data.reduce((s, r) => s + (r.total_cost_usd || 0), 0).toFixed(4)
    };
  } catch (e) {
    console.warn('[BUDGET] Daily usage fetch failed:', e.message.substring(0, 80));
    return { today_tokens: 0, today_cost_usd: 0 };
  }
}

// Export budget constants for use in handler
export { BUDGETS };
