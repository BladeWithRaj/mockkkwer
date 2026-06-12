// ═══════════════════════════════════════════════════════════════
// MISTRAL PROVIDER
// Role: Structured fast worker — JSON cleanup, cheap subjects
//
// WHEN TO USE:
//   ✓ EVS, IT Basics, Workshop (theory-heavy, no numericals)
//   ✓ JSON cleanup/reformatting pass
//   ✓ Section A objective questions (simple defs, T/F, fill-blank)
//   ✗ NOT for maths numericals — hallucination risk
//   ✗ NOT for final board-style formatting — Gemini is better
//
// Models (in recommended order):
//   mistral-small-latest  — cheap, fast, Section A / cleanup
//   mistral-medium-latest — balanced, general fallback
//   open-mistral-7b       — free tier, utility tasks only
// ═══════════════════════════════════════════════════════════════

const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

/**
 * Call Mistral AI.
 * @param {string} prompt
 * @param {object} opts
 * @param {number} opts.maxTokens
 * @param {number} opts.temperature
 * @param {string} opts.model       - override default model
 * @param {boolean} opts.jsonMode   - enforce JSON response format
 * @returns Standard provider response shape
 */
export async function callMistral(prompt, {
  maxTokens = 3000,
  temperature = 0.5,
  model = 'mistral-small-latest',
  jsonMode = true,
  systemPrompt = null
} = {}) {
  const key = process.env.MISTRAL_API_KEY;
  if (!key) return { success: false, error: 'MISTRAL_API_KEY not set', provider: 'mistral', model };

  const t0 = Date.now();

  try {
    const body = {
      model,
      messages: [
        {
          role: 'system',
          content: systemPrompt || 'You are a BTEUP Polytechnic exam paper setter. Output ONLY valid JSON. No markdown. No explanation.'
        },
        { role: 'user', content: prompt }
      ],
      temperature,
      max_tokens: maxTokens
    };

    // Mistral supports response_format for json_object mode
    if (jsonMode) {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(MISTRAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[MISTRAL] ${model} HTTP ${res.status}:`, errText.substring(0, 200));
      return {
        success: false,
        error: `Mistral ${res.status}: ${errText.substring(0, 100)}`,
        provider: 'mistral',
        model,
        quota_exhausted: res.status === 429
      };
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';

    if (!text || text.length < 10) {
      return { success: false, error: 'Mistral returned empty response', provider: 'mistral', model };
    }

    const parsed = parseJSON(text);
    if (!parsed) {
      return { success: false, error: `Mistral JSON parse failed: ${text.substring(0, 80)}`, provider: 'mistral', model };
    }

    console.log(`[MISTRAL] ✓ ${model} (${Date.now() - t0}ms)`);
    return {
      success: true,
      provider: 'mistral',
      model,
      content: parsed,
      tokens_used: data?.usage?.total_tokens || 0,
      latency_ms: Date.now() - t0,
      finish_reason: data?.choices?.[0]?.finish_reason || 'stop'
    };

  } catch (e) {
    return { success: false, error: e.message, provider: 'mistral', model };
  }
}

/**
 * Specialized cleanup call — pass malformed JSON string, get clean object back.
 * Uses Mistral's JSON mode as a reliable formatter.
 */
export async function cleanupJSON(malformedText, schema) {
  const prompt = `Fix and return this as valid JSON matching the schema.
Input (may be malformed): ${malformedText.substring(0, 3000)}
Expected schema: ${JSON.stringify(schema)}
Return ONLY the corrected JSON object. Nothing else.`;

  return callMistral(prompt, {
    model: 'mistral-small-latest',
    temperature: 0.1,
    maxTokens: 2000,
    jsonMode: true,
    systemPrompt: 'You are a JSON repair tool. Output only valid JSON, nothing else.'
  });
}

function parseJSON(text) {
  try { return JSON.parse(text); } catch (_) {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (_) {} }
  return null;
}
