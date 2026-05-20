// ═══════════════════════════════════════════════════════════════
// BTEUP PAPER GENERATOR — Production-Grade Engine v2
// POST /api/generate-polytechnic-paper
//
// Architecture: Blueprint → Pattern → AI Filling → Renderer
// Modes: important | board_pattern | pyq_weighted | pass_guaranteed
// Languages: english | hindi (separate prompts — NOT translation)
// ═══════════════════════════════════════════════════════════════

// ── Generation Mode Modifiers ──
// Each mode injects specific behavioral instructions into the AI prompt.
// This is REAL behavioral difference — not a UI label.
const MODE_MODIFIERS = {
  important: {
    label: 'Important Questions',
    instruction: 'PRIORITY: Focus ONLY on high-frequency concepts that have appeared repeatedly in BTEUP board exams over the last 6 years. Prefer topics that recur every year or alternate years. Avoid rare or obscure topics. Students rely on these for exam preparation.',
    temperature_adj: -0.05,   // slightly lower temp = more predictable, repeated topics
    difficulty_bias: 'favor commonly tested difficulty'
  },
  board_pattern: {
    label: 'Board Pattern',
    instruction: 'PRIORITY: Use STRICT official BTEUP board examination wording. Questions must be mechanical, short, and robotic — exactly as they appear in official printed papers. Use exact verb patterns: "Find the value of", "Solve the following", "Prove that", "Evaluate", "Write the equation of". NO creative or explanatory phrasing. Paper must be indistinguishable from an actual board paper.',
    temperature_adj: -0.15,   // lower temp = rigid, formulaic outputs
    difficulty_bias: 'standard board distribution'
  },
  pyq_weighted: {
    label: 'PYQ Weighted',
    instruction: 'PRIORITY: Weight your question selection by historical repetition. Topics that appear in 4+ of the last 6 years must get priority. Use the keywords and concepts most commonly tested in previous board papers. Distribution should heavily favor units with highest exam frequency. Avoid topics that appeared only once or never.',
    temperature_adj: -0.1,
    difficulty_bias: 'historically tested difficulty'
  },
  pass_guaranteed: {
    label: 'Pass-Guaranteed',
    instruction: 'PRIORITY: Generate questions that a below-average student can attempt to secure passing marks (17/60). Focus on: direct formula application (not derivation), short definitions, basic numericals with simple numbers, true/false based on fundamental concepts. Avoid complex proofs, multi-step derivations, or advanced topics. Every question must be solvable in under 5 minutes.',
    temperature_adj: -0.2,    // most predictable = easiest questions
    difficulty_bias: 'easy to easy-medium only'
  }
};

const MAX_RETRIES = 3;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 10;
const rateBuckets = {};

// ── Provider Configs ──
function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY;
  return {
    key,
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`
  };
}

function getGroqConfig() {
  const key = process.env.GROQ_API_KEY;
  return { key, url: "https://api.groq.com/openai/v1/chat/completions" };
}

// ── Rate Limiter ──
function checkRateLimit(ip) {
  if (!ip || ip === "unknown") ip = "global";
  const now = Date.now();
  if (!rateBuckets[ip]) rateBuckets[ip] = [];
  rateBuckets[ip] = rateBuckets[ip].filter(ts => now - ts < RATE_WINDOW_MS);
  if (rateBuckets[ip].length >= RATE_MAX) return false;
  rateBuckets[ip].push(now);
  if (Object.keys(rateBuckets).length > 500) {
    for (const k of Object.keys(rateBuckets)) {
      if (!rateBuckets[k].length) delete rateBuckets[k];
    }
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════
// SECTION DEFINITIONS — Per-pattern section configs
// ═══════════════════════════════════════════════════════════════

const PATTERN_SECTIONS = {
  PATTERN_MATH: [
    { key: "partA", promptFile: "partA", label: "Part A — Objective Questions",   stageText: "Generating objective questions (Part A)...",      maxTokens: 2500, difficulty: "easy",        count: 10 },
    { key: "partB", promptFile: "partB", label: "Part B — Very Short Answers",    stageText: "Generating very short answers (Part B)...",       maxTokens: 2000, difficulty: "easy-medium",  count: 7  },
    { key: "partC", promptFile: "partC", label: "Part C — Short Answers",         stageText: "Generating short answer questions (Part C)...",   maxTokens: 2500, difficulty: "medium",       count: 10 },
    { key: "partD", promptFile: "partD", label: "Part D — Long Answer Questions", stageText: "Generating long answer questions (Part D)...",     maxTokens: 2500, difficulty: "hard",         count: 6  }
  ],
  PATTERN_FEEE: [
    { key: "q1", promptFile: "q1", label: "Q1 — DC Circuits & Magnetic Circuits",   stageText: "Generating Q1 — DC Circuits...",               maxTokens: 2000, difficulty: "medium-hard", count: 3 },
    { key: "q2", promptFile: "q2", label: "Q2 — AC Circuits",                       stageText: "Generating Q2 — AC Circuits...",               maxTokens: 2000, difficulty: "medium-hard", count: 3 },
    { key: "q3", promptFile: "q3", label: "Q3 — Electrical Machines",               stageText: "Generating Q3 — Electrical Machines...",       maxTokens: 2000, difficulty: "medium-hard", count: 3 },
    { key: "q4", promptFile: "q4", label: "Q4 — Electronic Devices",               stageText: "Generating Q4 — Electronic Devices...",        maxTokens: 2000, difficulty: "medium-hard", count: 3 },
    { key: "q5", promptFile: "q5", label: "Q5 — Digital Electronics & Instruments", stageText: "Generating Q5 — Digital Electronics...",       maxTokens: 2000, difficulty: "medium-hard", count: 3 },
    { key: "q6", promptFile: "q6", label: "Q6 — Short Notes",                       stageText: "Generating Q6 — Short Notes...",               maxTokens: 1500, difficulty: "easy-medium", count: 5 }
  ]
};

// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER — Loads prompt template & injects syllabus
// ═══════════════════════════════════════════════════════════════

// Hardcoded prompts (since Vercel serverless can't read fs)
const PROMPTS = {};

function getPromptTemplate(namespace, promptFile) {
  const cacheKey = `${namespace}/${promptFile}`;
  if (PROMPTS[cacheKey]) return PROMPTS[cacheKey];
  // Prompts are embedded below per-pattern. In production, these could be
  // fetched from DB or edge config. For now, inline for Vercel compatibility.
  return null;
}

function buildSectionPrompt(subject, units, sectionConfig, language, mode) {
  const syllabusText = units.map(u =>
    `Unit ${u.unit_no} — ${u.unit_name}: ${u.topics}`
  ).join('\n');

  const keywordsText = units.map(u =>
    `Unit ${u.unit_no}: ${(u.important_keywords || []).join(', ')}`
  ).join('\n');

  // PYQ weight context — inject if available
  const pyqText = units.map(u => {
    const imp = u.importance_score ? `importance:${u.importance_score}` : '';
    const freq = u.pyq_frequency   ? `pyq_freq:${u.pyq_frequency}`     : '';
    return imp || freq ? `Unit ${u.unit_no}: ${imp} ${freq}` : null;
  }).filter(Boolean).join('\n');

  const modeModifier = MODE_MODIFIERS[mode] || MODE_MODIFIERS.important;

  if (subject.renderer_type === 'PATTERN_MATH') {
    return buildMathPrompt(sectionConfig, syllabusText, keywordsText, pyqText, language, subject.name, modeModifier);
  } else if (subject.renderer_type === 'PATTERN_FEEE') {
    return buildFEEEPrompt(sectionConfig, syllabusText, keywordsText, pyqText, language, subject.name, units, modeModifier);
  }
  throw new Error(`Unknown renderer_type: ${subject.renderer_type}`);
}

function buildMathPrompt(section, syllabus, keywords, pyqData, language, subjectName, modeModifier) {
  const isHindi = language === 'hindi';
  const langRule = isHindi
    ? 'Write ALL question text in Hindi (Devanagari script). Set "en" to empty string. Math symbols/variables stay in Unicode (x², √x, ∫, π etc).'
    : 'Write all questions in English only. Set "hi" to empty string. Use short mechanical board-style phrasing.';

  const schemas = {
    partA: `{
  "questions": [
    { "en": "question", "hi": "", "type": "mcq", "options": ["a","b","c","d"], "answer": "correct", "unit": 1 }
  ]
}
Generate EXACTLY 10 questions. Mix: at least 4 MCQ, 2 fill-in-blank, rest true/false or one-word.
Cover all 5 units (2 per unit). Difficulty: EASY.`,
    partB: `{
  "questions": [ { "en": "question", "hi": "", "unit": 1 } ]
}
Generate EXACTLY 7 questions. Short calculation or formula recall. Cover 4+ units. Difficulty: EASY-MEDIUM.`,
    partC: `{
  "questions": [ { "en": "question", "hi": "", "unit": 1 } ]
}
Generate EXACTLY 10 questions. Multi-step numericals, short proofs. All 5 units (2 each). Difficulty: MEDIUM.`,
    partD: `{
  "questions": [ { "en": "question", "hi": "", "unit": 1 } ]
}
Generate EXACTLY 6 questions. Full derivations, matrix problems, multi-step proofs. 4+ units. Difficulty: HARD.`
  };

  return `You are a senior BTEUP (Board of Technical Education, Uttar Pradesh) ${subjectName} paper setter with 20 years experience.

=== GENERATION MODE: ${modeModifier.label} ===
${modeModifier.instruction}

TASK: Generate exam questions for ${section.label}.

SYLLABUS:
${syllabus}

KEYWORDS BY UNIT:
${keywords}
${pyqData ? `
PYQ IMPORTANCE DATA:
${pyqData}` : ''}

OUTPUT SCHEMA (return ONLY this JSON, no other text):
${schemas[section.key]}

BOARD STYLE RULES:
1. Output ONLY valid JSON. No markdown. No explanation. No extra fields.
2. No LaTeX. Unicode math only: x², x³, √x, ∫, Σ, ∂, Δ, π, ∞, →
3. Fractions: use a/b. Matrices: [[a,b],[c,d]] notation.
4. ${langRule}
5. ${isHindi ? 'Hindi technical terms: use standard academic Hindi. Example: "सारणिक", "आव्यूह", "अवकल समीकरण"' : 'English phrasing must be MECHANICAL: "Find", "Solve", "Evaluate", "Prove", "Derive" — not "Determine" or "Calculate the analytical solution".'}
6. Diploma level ONLY. Not degree/engineering level complexity.
7. Each question must use clean, solvable numbers.
8. No repeated concepts within this section.
9. Difficulty bias: ${modeModifier.difficulty_bias}

GENERATE NOW:`;
}

function buildFEEEPrompt(section, syllabus, keywords, pyqData, language, subjectName, units, modeModifier) {
  const isHindi = language === 'hindi';
  const langRule = isHindi
    ? 'Write ALL text in Hindi (Devanagari). Set "en" to empty string. Technical terms: use standard Hindi diploma terminology.'
    : 'Write all in English only. Set "hi" to empty string. Use diploma-level practical wording: "Explain", "Differentiate between", "Write short note on", "State and explain", "Draw and explain".';

  if (section.key === 'q6') {
    return `You are a senior BTEUP ${subjectName} paper setter.

=== GENERATION MODE: ${modeModifier.label} ===
${modeModifier.instruction}

TASK: Generate short note topics for Q6 (Short Notes section).

SYLLABUS:
${syllabus}

OUTPUT (return ONLY this JSON):
{ "notes": [ { "en": "topic", "hi": "", "unit": 1 } ] }

Generate EXACTLY 5 short note topics across all 5 units. Difficulty: EASY-MEDIUM (2.5 marks each).

RULES:
1. ONLY valid JSON. No markdown.
2. ${langRule}
3. Topics must be focused and specific. Examples: "Working principle of CRO", "Zener diode as voltage regulator", "Types of DC motors"
4. Diploma level. Difficulty bias: ${modeModifier.difficulty_bias}

GENERATE NOW:`;
  }

  // Q1-Q5: Each maps to one unit
  const qNum = parseInt(section.key.replace('q', ''));
  const unit = units.find(u => u.unit_no === qNum);
  const unitTopics = unit ? `${unit.unit_name}: ${unit.topics}` : syllabus;
  const unitPYQ = unit?.importance_score ? `(PYQ importance: ${unit.importance_score}, frequency: ${unit.pyq_frequency || 'N/A'})` : '';

  return `You are a senior BTEUP ${subjectName} paper setter with 20 years experience.

=== GENERATION MODE: ${modeModifier.label} ===
${modeModifier.instruction}

TASK: Generate 3 long-answer sub-parts for ${section.label}.
This question covers: ${unitTopics} ${unitPYQ}

SYLLABUS (full reference):
${syllabus}
${pyqData ? `
PYQ DATA:
${pyqData}` : ''}

OUTPUT (return ONLY this JSON):
{ "parts": [ { "en": "question text", "hi": "", "marks": 10 } ] }

Generate EXACTLY 3 parts (student attempts any 2). Each part: 10 marks. Difficulty: MEDIUM-HARD.

RULES:
1. ONLY valid JSON. No markdown.
2. ${langRule}
3. FEEE question types: explain working principle, derive equation, draw+explain circuit diagram, compare/differentiate, numerical calculation, state and prove theorem.
4. ${isHindi ? 'Hindi phrasing examples: "कार्यसिद्धांत समझाइए", "परिपथ आरेख बनाइए", "अंतर स्पष्ट कीजिए"' : 'English phrasing must be practical diploma-level: NOT engineering-degree level theory.'}
5. Difficulty bias: ${modeModifier.difficulty_bias}

GENERATE NOW:`;
}


// ═══════════════════════════════════════════════════════════════
// AI CALLER — Calls Gemini with JSON mode
// ═══════════════════════════════════════════════════════════════

async function callGeminiJSON(prompt, maxTokens, temperature = 0.6) {
  const { key, url } = getGeminiConfig();
  if (!key) throw new Error("GEMINI_API_KEY not configured");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        topP: 0.9,
        topK: 40,
        responseMimeType: "application/json"
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!rawText || rawText.trim().length < 20) {
    throw new Error("Gemini returned empty/short response");
  }

  // Parse JSON — Gemini with responseMimeType should return clean JSON
  try {
    return JSON.parse(rawText);
  } catch (e) {
    // Try to extract JSON from response if wrapped in text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`JSON parse failed: ${rawText.substring(0, 100)}`);
  }
}

async function callGroqJSON(prompt, maxTokens) {
  const { key, url } = getGroqConfig();
  if (!key) return null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a BTEUP Polytechnic paper setter. Output ONLY valid JSON. No explanations." },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: maxTokens,
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "";
    return JSON.parse(text);
  } catch (e) {
    console.error("[GROQ] Fallback failed:", e.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// VALIDATORS — Strict schema validation per section
// ═══════════════════════════════════════════════════════════════

function validateMathSection(key, data, expectedCount) {
  const questions = data?.questions;
  if (!Array.isArray(questions)) return { valid: false, error: "Missing questions array" };
  if (questions.length < Math.floor(expectedCount * 0.7)) {
    return { valid: false, error: `Need ${expectedCount}, got ${questions.length}` };
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (typeof q.en !== 'string' || q.en.length < 5) {
      return { valid: false, error: `Question ${i + 1}: missing/short 'en' field` };
    }
    if (key === 'partA' && q.type === 'mcq') {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        return { valid: false, error: `Question ${i + 1}: MCQ needs exactly 4 options` };
      }
    }
  }

  return { valid: true };
}

function validateFEEESection(key, data) {
  if (key === 'q6') {
    const notes = data?.notes;
    if (!Array.isArray(notes)) return { valid: false, error: "Missing notes array" };
    if (notes.length < 3) return { valid: false, error: `Need 5 notes, got ${notes.length}` };
    for (const n of notes) {
      if (typeof n.en !== 'string' || n.en.length < 3) {
        return { valid: false, error: "Short note missing 'en' field" };
      }
    }
    return { valid: true };
  }

  // Q1-Q5
  const parts = data?.parts;
  if (!Array.isArray(parts)) return { valid: false, error: "Missing parts array" };
  if (parts.length < 2) return { valid: false, error: `Need 3 parts, got ${parts.length}` };
  for (const p of parts) {
    if (typeof p.en !== 'string' || p.en.length < 10) {
      return { valid: false, error: "Part missing/short 'en' field" };
    }
  }
  return { valid: true };
}

function validateSection(rendererType, key, data, expectedCount) {
  if (rendererType === 'PATTERN_MATH') return validateMathSection(key, data, expectedCount);
  if (rendererType === 'PATTERN_FEEE') return validateFEEESection(key, data);
  return { valid: false, error: `Unknown renderer: ${rendererType}` };
}

// ═══════════════════════════════════════════════════════════════
// SSE HELPERS — Stream progress events to client
// ═══════════════════════════════════════════════════════════════

function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export async function handleGeneratePolytechnicPaper(supabase, req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  // Origin check
  const origin = req.headers.origin || req.headers.referer || "";
  const allowedOrigins = ["mock24hr.vercel.app", "localhost", "127.0.0.1"];
  const isAllowed = allowedOrigins.some(o => origin.includes(o));
  if (!isAllowed && origin) {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Rate limit
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.headers["x-real-ip"]
    || req.socket?.remoteAddress
    || "unknown";
  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: "Too many requests. Max 10 papers per 5 minutes. Please wait.",
      retryAfter: 60
    });
  }

  // Gemini key check
  const { key: GEMINI_API_KEY } = getGeminiConfig();
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { subject_id, branch, language, mode } = body || {};
    const lang = (language === 'hindi') ? 'hindi' : 'english';
    const genMode = MODE_MODIFIERS[mode] ? mode : 'important';

    if (!subject_id) {
      return res.status(400).json({ error: "subject_id is required" });
    }

    // ── Fetch subject from DB ──
    const { data: subject, error: subErr } = await supabase
      .from("polytechnic_board_subjects")
      .select("*")
      .eq("id", subject_id)
      .eq("active", true)
      .single();

    if (subErr || !subject) {
      return res.status(404).json({ error: "Subject not found or inactive" });
    }

    // ── Fetch syllabus units ──
    const { data: units, error: unitErr } = await supabase
      .from("polytechnic_subject_units")
      .select("*")
      .eq("subject_id", subject_id)
      .order("unit_no");

    if (unitErr || !units?.length) {
      return res.status(404).json({ error: "Syllabus not found for this subject" });
    }

    // ── Get section config for this pattern ──
    const sections = PATTERN_SECTIONS[subject.renderer_type];
    if (!sections) {
      return res.status(400).json({ error: `Unknown paper pattern: ${subject.renderer_type}` });
    }

    // ── Setup SSE streaming ──
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // Send initial stage
    sendSSE(res, "progress", {
      stage: "init",
      message: "Analyzing official BTEUP syllabus...",
      progress: 5
    });

    // ── Generate sections sequentially ──
    const paperData = {};
    const totalSections = sections.length;
    let completedSections = 0;
    const failedSections = [];

    for (const section of sections) {
      const progressPct = Math.round(10 + (completedSections / totalSections) * 80);

      sendSSE(res, "progress", {
        stage: section.key,
        message: section.stageText,
        progress: progressPct,
        section: section.label
      });

      let sectionData = null;
      let lastError = null;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          if (attempt > 1) {
            await new Promise(r => setTimeout(r, 1500 * attempt));
            sendSSE(res, "progress", {
              stage: section.key,
              message: `Retrying ${section.label} (attempt ${attempt}/${MAX_RETRIES})...`,
              progress: progressPct
            });
          }

          const prompt = buildSectionPrompt(subject, units, section, lang, genMode);
          const modeAdj = MODE_MODIFIERS[genMode]?.temperature_adj || 0;
          const temperature = attempt === 1 ? (0.55 + modeAdj) : 0.7;

          // Try Gemini first
          let result = null;
          try {
            result = await callGeminiJSON(prompt, section.maxTokens, temperature);
          } catch (geminiErr) {
            console.error(`[GEMINI] ${section.key} attempt ${attempt}:`, geminiErr.message);
            // Try Groq fallback
            result = await callGroqJSON(prompt, section.maxTokens);
            if (!result) throw geminiErr;
          }

          // Validate
          const validation = validateSection(subject.renderer_type, section.key, result, section.count);
          if (!validation.valid) {
            lastError = validation.error;
            console.warn(`[VALIDATE] ${section.key} attempt ${attempt}: ${validation.error}`);
            if (attempt < MAX_RETRIES) continue;
          }

          sectionData = result;
          break;

        } catch (err) {
          lastError = err.message;
          console.error(`[GENERATE] ${section.key} attempt ${attempt}:`, err.message);
        }
      }

      if (sectionData) {
        paperData[section.key] = sectionData;
        completedSections++;
      } else {
        failedSections.push({ key: section.key, label: section.label, error: lastError });
        // Still continue — generate what we can
      }
    }

    // ── Format final response ──
    sendSSE(res, "progress", {
      stage: "render",
      message: "Formatting official board pattern paper...",
      progress: 95
    });

    // ── Cache paper in DB ──
    let paperId = null;
    try {
      const { data: saved } = await supabase
        .from("generated_papers")
        .insert({
          title: `${subject.name} — Generated Paper`,
          subject_id: subject.id,
          paper_type: subject.renderer_type,
          paper_structure: paperData,
          is_public: false
        })
        .select("id")
        .single();
      paperId = saved?.id;
    } catch (cacheErr) {
      console.error("[CACHE] Failed to save paper:", cacheErr.message);
    }

    // ── Send final paper data ──
    sendSSE(res, "complete", {
      success: true,
      paper_id: paperId,
      subject: {
        name: subject.name,
        code: subject.code,
        semester: subject.semester,
        marks_total: subject.marks_total,
        renderer_type: subject.renderer_type,
        paper_style: subject.paper_style
      },
      branch: branch || "Common",
      language: lang,
      mode: genMode,
      mode_label: MODE_MODIFIERS[genMode]?.label || genMode,
      sections: paperData,
      failed_sections: failedSections,
      generated_at: new Date().toISOString()
    });

    res.end();

  } catch (err) {
    console.error("[GENERATE] Fatal:", err.message);
    // If headers already sent (SSE mode), send error event
    if (res.headersSent) {
      sendSSE(res, "error", { error: err.message });
      res.end();
    } else {
      return res.status(500).json({ error: "Internal error: " + err.message });
    }
  }
}
