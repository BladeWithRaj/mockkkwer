// ═══════════════════════════════════════════════════════════════
// OPENROUTER PROVIDER
// Role: Multi-model routing, fallback layer, cheap large-volume generation
//
// Why OpenRouter over direct APIs?
//   ✓ One API key → access to 100+ models
//   ✓ Auto-failover between model providers
//   ✓ DeepSeek, Llama, Qwen, Mistral — all through one endpoint
//   ✓ Cost-transparent (per-model pricing visible)
//
// Model Strategy:
//   deepseek/deepseek-chat-v3-0324  — cheap, JSON-reliable, high context
//   meta-llama/llama-3.3-70b-instruct — fast, good for structured output
//   deepseek/deepseek-r1-distill-llama-70b — reasoning tasks
//   qwen/qwen-2.5-72b-instruct      — strong multilingual (Hindi support)
//
// Docs: https://openrouter.ai/docs
// ═══════════════════════════════════════════════════════════════

const OPENROUTER_BASE = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_CHAT = `${OPENROUTER_BASE}/chat/completions`;
const TIMEOUT_MS = 40_000;

// Model cascade — ordered by: cost-efficiency, JSON reliability, quota availability
// Free models first, paid as last resort. Each has different context windows.
const OPENROUTER_MODELS = [
  {
    id: 'deepseek/deepseek-chat-v3-0324:free',
    label: 'DeepSeek V3 (free)',
    jsonMode: true,     // supports response_format: json_object
    maxContextTokens: 64000,
    tier: 'standard'
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    label: 'Llama 3.3 70B (free)',
    jsonMode: false,    // enforce JSON via prompt
    maxContextTokens: 131072,
    tier: 'fast'
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    label: 'Qwen 2.5 72B (free)',
    jsonMode: false,
    maxContextTokens: 131072,
    tier: 'fast'
  },
  {
    id: 'deepseek/deepseek-chat-v3-0324',
    label: 'DeepSeek V3 (paid)',
    jsonMode: true,
    maxContextTokens: 64000,
    tier: 'premium'
  },
];

/**
 * Call OpenRouter — tries models in order, each with its own quota pool.
 * @param {string} prompt
 * @param {object} opts
 * @param {number}  opts.maxTokens
 * @param {number}  opts.temperature
 * @param {string}  opts.preferTier     - 'fast' | 'standard' | 'premium' (filter models)
 * @param {string}  opts.systemPrompt
 * @returns Standard provider response shape
 */
export async function callOpenRouter(prompt, {
  maxTokens = 4000,
  temperature = 0.6,
  preferTier = null,
  systemPrompt = null
} = {}) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return { success: false, error: 'OPENROUTER_API_KEY not set', provider: 'openrouter', model: null };

  // Filter models by tier preference if specified
  const modelList = preferTier
    ? OPENROUTER_MODELS.filter(m => m.tier === preferTier || m.tier === 'standard')
    : OPENROUTER_MODELS;

  const sysMsg = systemPrompt || 'You are a BTEUP Polytechnic board exam paper setter with 20 years experience. Output ONLY valid JSON. No markdown. No explanation. No text before or after the JSON.';

  for (const model of modelList) {
    const t0 = Date.now();
    try {
      const body = {
        model: model.id,
        messages: [
          { role: 'system', content: sysMsg },
          { role: 'user',   content: prompt  }
        ],
        temperature,
        max_tokens: Math.min(maxTokens, model.maxContextTokens - 2000),
      };

      // Enable JSON mode where supported
      if (model.jsonMode) {
        body.response_format = { type: 'json_object' };
      } else {
        // Prompt-level JSON enforcement for models without native JSON mode
        body.messages[0].content = sysMsg + '\n\nCRITICAL: Your response must be a single valid JSON object. Nothing else.';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      let res;
      try {
        res = await fetch(OPENROUTER_CHAT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`,
            'HTTP-Referer': 'https://mock24hr.vercel.app',
            'X-Title': 'MockTestPro — BTEUP Paper Generator'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[OPENROUTER] ${model.label} HTTP ${res.status}:`, errText.substring(0, 200));
        // 429 = rate limit, 402 = no credits, 503 = overload — try next model
        continue;
      }

      const data = await res.json();

      // OpenRouter wraps errors inside 200 responses sometimes
      if (data.error) {
        console.warn(`[OPENROUTER] ${model.label} API error:`, data.error?.message?.substring(0, 150));
        continue;
      }

      const text = data?.choices?.[0]?.message?.content || '';
      if (!text || text.length < 10) {
        console.warn(`[OPENROUTER] ${model.label} — empty response`);
        continue;
      }

      const parsed = parseJSON(text);
      if (!parsed) {
        console.warn(`[OPENROUTER] ${model.label} — JSON parse failed:`, text.substring(0, 100));
        continue;
      }

      const latency = Date.now() - t0;
      console.log(`[OPENROUTER] ✓ ${model.label} (${latency}ms)`);

      return {
        success: true,
        provider: 'openrouter',
        model: model.id,
        model_label: model.label,
        content: parsed,
        tokens_used: data?.usage?.total_tokens || 0,
        latency_ms: latency,
        finish_reason: data?.choices?.[0]?.finish_reason || 'stop',
        cost_estimate: estimateCost(model.id, data?.usage?.total_tokens || 0)
      };

    } catch (e) {
      if (e.name === 'AbortError') {
        console.warn(`[OPENROUTER] ${model.label} — timeout (${TIMEOUT_MS}ms)`);
      } else {
        console.warn(`[OPENROUTER] ${model.label} exception:`, e.message.substring(0, 100));
      }
      // continue to next model
    }
  }

  console.error('[OPENROUTER] All models exhausted');
  return {
    success: false,
    error: 'All OpenRouter models exhausted or quota depleted',
    provider: 'openrouter',
    model: null
  };
}

/**
 * Rough cost estimate in USD cents.
 * DeepSeek V3 ≈ $0.27/M input + $1.10/M output (as of 2025)
 * Free tier models = $0
 */
function estimateCost(modelId, totalTokens) {
  if (modelId.includes(':free')) return 0;
  if (modelId.includes('deepseek-chat')) return +(totalTokens * 0.0000007).toFixed(6);
  return +(totalTokens * 0.000001).toFixed(6); // rough estimate
}

function parseJSON(text) {
  // Direct parse
  try { return JSON.parse(text); } catch (_) {}
  // Strip markdown fences
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch (_) {} }
  // Extract first { } block
  const obj = text.match(/\{[\s\S]*\}/);
  if (obj) { try { return JSON.parse(obj[0]); } catch (_) {} }
  return null;
}
