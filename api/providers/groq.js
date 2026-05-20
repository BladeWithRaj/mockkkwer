// ═══════════════════════════════════════════════════════════════
// GROQ PROVIDER
// Role: Ultra-fast draft generation & utility layer
// Models: llama-3.1-8b-instant (primary, 500k TPD free)
//         gemma2-9b-it, llama3-groq-8b-8192-tool-use-preview (fallbacks)
// ═══════════════════════════════════════════════════════════════

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Order matters — highest free quota first.
// RETIRED models (do NOT add back): mixtral-8x7b-32768, llama3-8b-8192
const GROQ_MODELS = [
  'llama-3.1-8b-instant',               // Primary: 500k TPD, 6000 TPM free
  'llama3-groq-8b-8192-tool-use-preview', // Separate quota pool, reliable
  'gemma2-9b-it',                        // Google model on Groq, independent quota
  'llama-3.3-70b-versatile',             // Highest quality, lower TPD — last resort
];

/**
 * Call Groq — tries each model in order, skips on quota/auth/billing errors.
 * @returns Standard provider response shape
 */
export async function callGroq(prompt, { maxTokens = 4000, temperature = 0.6, systemPrompt = null } = {}) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { success: false, error: 'GROQ_API_KEY not set', provider: 'groq', model: null };

  const messages = [
    {
      role: 'system',
      content: systemPrompt || 'You are a BTEUP Polytechnic exam paper setter. Output ONLY valid JSON. No markdown code blocks. No explanations.'
    },
    { role: 'user', content: prompt }
  ];

  for (const model of GROQ_MODELS) {
    const t0 = Date.now();
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: Math.min(maxTokens, 8000)
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[GROQ] ${model} HTTP ${res.status}:`, errText.substring(0, 200));
        // 400=bad-req, 401=bad-key, 402=billing, 429=quota, 503=overload → try next model
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content || '';

      if (!text || text.length < 10) {
        console.warn(`[GROQ] ${model} — empty response, trying next`);
        continue;
      }

      const parsed = parseJSON(text);
      if (!parsed) {
        console.warn(`[GROQ] ${model} — JSON parse failed:`, text.substring(0, 80));
        continue;
      }

      console.log(`[GROQ] ✓ ${model} (${Date.now() - t0}ms)`);
      return {
        success: true,
        provider: 'groq',
        model,
        content: parsed,
        tokens_used: data?.usage?.total_tokens || 0,
        latency_ms: Date.now() - t0,
        finish_reason: data?.choices?.[0]?.finish_reason || 'stop'
      };

    } catch (e) {
      console.warn(`[GROQ] ${model} exception:`, e.message.substring(0, 100));
      // continue to next model
    }
  }

  console.error('[GROQ] All models exhausted:', GROQ_MODELS.join(', '));
  return { success: false, error: 'All Groq models exhausted (quota or network)', provider: 'groq', model: null };
}

function parseJSON(text) {
  try { return JSON.parse(text); } catch (_) {}
  // Strip markdown code fences if present
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1].trim()); } catch (_) {} }
  const obj = text.match(/(\{[\s\S]*\})/);
  if (obj) { try { return JSON.parse(obj[1]); } catch (_) {} }
  return null;
}
