// ============================================
// AI GATEWAY — Doc 12 §14
// Single entry point for all AI operations.
//
// Pattern:
//   Task → Prompt Builder → Provider Router →
//   Retry → Cache → Normalizer → Response
//
// Never call providers directly.
// Everything enters through the gateway.
// ============================================

const AIGateway = {

  // ── Provider config ──
  _providers: {
    gemini: {
      name: 'Gemini',
      model: 'gemini-2.0-flash',
      available: false, // Will be true when API key configured
      costPer1kTokens: 0.0001,
      maxTokens: 4096,
      tasks: ['explanation', 'weekly_report', 'concept_extraction']
    }
  },

  // ── Metrics ──
  _metrics: {
    requests: 0,
    cacheHits: 0,
    errors: 0,
    totalTokens: 0,
    totalLatencyMs: 0
  },

  // ── Doc 15 §29C: Circuit Breaker ──
  _circuitBreaker: {
    state: 'CLOSED',        // CLOSED | OPEN | HALF_OPEN
    failures: 0,
    threshold: 3,           // Open after 3 consecutive failures
    cooldownMs: 60000,      // 60s before attempting recovery
    lastFailureTime: null,
    lastStateChange: null
  },

  /** Check if AI calls are allowed (circuit breaker) */
  _isCircuitAllowed() {
    const cb = this._circuitBreaker;

    if (cb.state === 'CLOSED') return true;

    if (cb.state === 'OPEN') {
      // Check if cooldown has passed → transition to HALF_OPEN
      if (cb.lastFailureTime && (Date.now() - cb.lastFailureTime > cb.cooldownMs)) {
        cb.state = 'HALF_OPEN';
        cb.lastStateChange = Date.now();
        console.log('[AIGateway] Circuit HALF_OPEN — testing one request');
        return true;
      }
      return false; // Still in cooldown
    }

    if (cb.state === 'HALF_OPEN') return true; // Allow test request

    return true;
  },

  /** Record AI call success (circuit breaker) */
  _circuitSuccess() {
    const cb = this._circuitBreaker;
    if (cb.state === 'HALF_OPEN') {
      console.log('[AIGateway] Circuit CLOSED — recovery successful');
    }
    cb.state = 'CLOSED';
    cb.failures = 0;
    cb.lastStateChange = Date.now();
  },

  /** Record AI call failure (circuit breaker) */
  _circuitFailure() {
    const cb = this._circuitBreaker;
    cb.failures++;
    cb.lastFailureTime = Date.now();

    if (cb.state === 'HALF_OPEN') {
      cb.state = 'OPEN';
      cb.lastStateChange = Date.now();
      console.warn('[AIGateway] Circuit OPEN — half-open test failed');
      return;
    }

    if (cb.failures >= cb.threshold) {
      cb.state = 'OPEN';
      cb.lastStateChange = Date.now();
      console.warn(`[AIGateway] Circuit OPEN — ${cb.failures} consecutive failures`);
    }
  },


  // ═══════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════

  /**
   * Get explanation for a question. Cache-first (Doc 12 §12).
   * @param {number} questionId
   * @param {string} language - 'en' | 'hi'
   * @param {object} questionData - { question, options, correctAnswer }
   * @returns {Promise<{content, cached, provider, latencyMs}>}
   */
  async getExplanation(questionId, language = 'en', questionData = {}) {
    this._metrics.requests++;

    // 1. Check cache (Supabase)
    try {
      const cached = await this._checkExplanationCache(questionId, language);
      if (cached) {
        this._metrics.cacheHits++;
        return { content: cached.content, cached: true, provider: cached.provider, latencyMs: 0 };
      }
    } catch (e) {
      console.warn('[AIGateway] Cache check failed:', e.message);
    }

    // 2. Build prompt from template
    const prompt = await this._buildPrompt(
      language === 'hi' ? 'question_explanation_hi' : 'question_explanation_en',
      {
        question: questionData.question || '',
        options: Array.isArray(questionData.options) ? questionData.options.join('\n') : '',
        correct_answer: questionData.correctAnswer || ''
      }
    );

    // 3. Route to provider
    const result = await this._routeToProvider('explanation', prompt);

    // 4. Cache result if successful
    if (result.content && questionId) {
      this._cacheExplanation(questionId, language, result).catch(() => {});
    }

    return result;
  },


  /**
   * Generate a task (generic). Routes to appropriate provider.
   * @param {string} taskType - 'explanation' | 'weekly_report' | 'concept_extraction'
   * @param {string} prompt - The built prompt
   * @returns {Promise<{content, provider, model, latencyMs, tokens}>}
   */
  async generate(taskType, prompt) {
    this._metrics.requests++;
    return this._routeToProvider(taskType, prompt);
  },


  // ═══════════════════════════════════════════
  // PROMPT BUILDER (Doc 12 §15)
  // ═══════════════════════════════════════════

  /** Build prompt from template, substituting {{variables}} */
  async _buildPrompt(templateName, variables = {}) {
    // Try to load from Supabase prompt_templates
    try {
      if (typeof client !== 'undefined') {
        const { data } = await client
          .from('prompt_templates')
          .select('prompt')
          .eq('name', templateName)
          .eq('active', true)
          .order('version', { ascending: false })
          .limit(1)
          .single();

        if (data?.prompt) {
          return this._substituteVars(data.prompt, variables);
        }
      }
    } catch (e) {
      // Fallback to hardcoded
    }

    // Fallback templates (never hardcode in production — these are just safety nets)
    const fallbacks = {
      'question_explanation_en': `Explain this question step by step.\n\nQuestion: {{question}}\nOptions: {{options}}\nCorrect Answer: {{correct_answer}}\n\nProvide:\n1. Why the correct answer is right\n2. Key concept\n3. Quick tip`,
      'question_explanation_hi': `Is question ko step by step samjhaiye.\n\nQuestion: {{question}}\nOptions: {{options}}\nSahi Answer: {{correct_answer}}`
    };

    const template = fallbacks[templateName] || `Task: ${templateName}\n\n${JSON.stringify(variables)}`;
    return this._substituteVars(template, variables);
  },

  _substituteVars(template, vars) {
    let result = template;
    Object.entries(vars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '');
    });
    return result;
  },


  // ═══════════════════════════════════════════
  // PROVIDER ROUTER (Doc 12 §13)
  // ═══════════════════════════════════════════

  /** Route to the best available provider for a task */
  async _routeToProvider(taskType, prompt) {
    const start = Date.now();

    // Doc 15 §29C: Circuit breaker check
    if (!this._isCircuitAllowed()) {
      console.warn('[AIGateway] Circuit OPEN — serving cached/rule-based only');
      return {
        content: null,
        provider: 'circuit_breaker',
        model: 'none',
        latencyMs: 0,
        tokens: 0,
        error: 'AI temporarily unavailable. Using cached responses.',
        circuitState: this._circuitBreaker.state
      };
    }

    // Find available provider for this task
    const provider = Object.entries(this._providers)
      .find(([_, p]) => p.available && p.tasks.includes(taskType));

    if (!provider) {
      // No provider available — return rule-based fallback
      this._metrics.errors++;
      return {
        content: null,
        provider: 'none',
        model: 'none',
        latencyMs: 0,
        tokens: 0,
        error: 'No AI provider configured. Using rule-based intelligence.'
      };
    }

    const [providerName, config] = provider;

    try {
      // Future: actual API call to Gemini/Groq/etc.
      // For now, return a structured "not yet connected" response
      const latency = Date.now() - start;
      this._metrics.totalLatencyMs += latency;

      // Doc 15 §29C: Record success
      this._circuitSuccess();

      return {
        content: null,
        provider: providerName,
        model: config.model,
        latencyMs: latency,
        tokens: 0,
        error: 'Provider not yet connected. Will use rule-based intelligence.'
      };
    } catch (e) {
      this._metrics.errors++;

      // Doc 15 §29C: Record failure
      this._circuitFailure();

      console.warn(`[AIGateway] Provider ${providerName} error:`, e.message);

      return {
        content: null,
        provider: providerName,
        model: config.model,
        latencyMs: Date.now() - start,
        tokens: 0,
        error: e.message
      };
    }
  },


  // ═══════════════════════════════════════════
  // EXPLANATION CACHE (Doc 12 §12)
  // ═══════════════════════════════════════════

  async _checkExplanationCache(questionId, language) {
    if (typeof client === 'undefined') return null;

    try {
      const { data } = await client
        .from('explanation_cache')
        .select('content, provider, model')
        .eq('question_id', questionId)
        .eq('language', language)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      return data || null;
    } catch (e) {
      return null;
    }
  },

  async _cacheExplanation(questionId, language, result) {
    if (typeof client === 'undefined' || !result.content) return;

    try {
      await client.from('explanation_cache').upsert({
        question_id: questionId,
        language: language,
        version: 1,
        provider: result.provider || 'unknown',
        model: result.model || 'unknown',
        content: result.content,
        content_hash: this._simpleHash(result.content),
        tokens_used: result.tokens || 0,
        latency_ms: result.latencyMs || 0
      }, { onConflict: 'question_id,language,version' });
    } catch (e) {
      console.warn('[AIGateway] Cache write failed:', e.message);
    }
  },

  _simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  },


  // ═══════════════════════════════════════════
  // METRICS (Doc 12 §17)
  // ═══════════════════════════════════════════

  /** Get current metrics for admin dashboard */
  getMetrics() {
    const m = this._metrics;
    return {
      requests: m.requests,
      cacheHits: m.cacheHits,
      cacheHitRate: m.requests > 0 ? Math.round((m.cacheHits / m.requests) * 100) + '%' : '0%',
      errors: m.errors,
      errorRate: m.requests > 0 ? Math.round((m.errors / m.requests) * 100) + '%' : '0%',
      totalTokens: m.totalTokens,
      avgLatencyMs: m.requests > 0 ? Math.round(m.totalLatencyMs / m.requests) : 0,
      providers: Object.entries(this._providers).map(([name, p]) => ({
        name, model: p.model, available: p.available
      }))
    };
  },

  /** Reset metrics (useful for periodic snapshots) */
  resetMetrics() {
    this._metrics = { requests: 0, cacheHits: 0, errors: 0, totalTokens: 0, totalLatencyMs: 0 };
  },

  /** Doc 15 §29C/D: Full diagnostics including circuit breaker */
  getDiagnostics() {
    return {
      ...this.getMetrics(),
      circuitBreaker: {
        state: this._circuitBreaker.state,
        failures: this._circuitBreaker.failures,
        threshold: this._circuitBreaker.threshold,
        cooldownMs: this._circuitBreaker.cooldownMs,
        lastFailureTime: this._circuitBreaker.lastFailureTime,
        lastStateChange: this._circuitBreaker.lastStateChange
      }
    };
  },

  /** Manual circuit reset (admin use) */
  resetCircuit() {
    this._circuitBreaker.state = 'CLOSED';
    this._circuitBreaker.failures = 0;
    this._circuitBreaker.lastFailureTime = null;
    this._circuitBreaker.lastStateChange = Date.now();
    console.log('[AIGateway] Circuit manually reset to CLOSED');
  }
};

window.AIGateway = AIGateway;
