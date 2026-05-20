// ═══════════════════════════════════════════════════════════════
// GEMINI PROVIDER
// Role: Premium accuracy engine — final paper generation & validation
// Models: gemini-2.0-flash (fast), gemini-1.5-pro (complex)
// ═══════════════════════════════════════════════════════════════

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Call Gemini with JSON mode enforced.
 * @returns Standard provider response shape
 */
export async function callGemini(prompt, { maxTokens = 4000, temperature = 0.6, model = 'gemini-2.0-flash' } = {}) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { success: false, error: 'GEMINI_API_KEY not set', provider: 'gemini', model };

  const t0 = Date.now();

  try {
    const url = `${GEMINI_BASE}/${model}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
          topP: 0.9,
          topK: 40,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      const is429 = res.status === 429;
      console.warn(`[GEMINI] HTTP ${res.status}:`, errText.substring(0, 200));
      return { success: false, error: `Gemini ${res.status}: ${errText.substring(0, 100)}`, provider: 'gemini', model, quota_exhausted: is429 };
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!rawText || rawText.trim().length < 20) {
      return { success: false, error: 'Gemini returned empty response', provider: 'gemini', model };
    }

    const parsed = parseJSON(rawText);
    if (!parsed) return { success: false, error: `Gemini JSON parse failed: ${rawText.substring(0, 80)}`, provider: 'gemini', model };

    return {
      success: true,
      provider: 'gemini',
      model,
      content: parsed,
      tokens_used: data?.usageMetadata?.totalTokenCount || 0,
      latency_ms: Date.now() - t0,
      finish_reason: data?.candidates?.[0]?.finishReason || 'STOP'
    };

  } catch (e) {
    return { success: false, error: e.message, provider: 'gemini', model };
  }
}

function parseJSON(text) {
  try { return JSON.parse(text); } catch (_) {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch (_) {} }
  return null;
}
