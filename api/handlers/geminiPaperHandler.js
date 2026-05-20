// ═══════════════════════════════════════════════════════════════
// BTEUP PAPER GENERATOR — Production-Grade Engine v2
// POST /api/generate-polytechnic-paper
//
// Architecture:
//   3-Layer: DATA → AI → RENDER
//   - Section-wise sequential generation
//   - Strict JSON output (responseMimeType)
//   - SSE streaming progress to client
//   - Retry logic with MAX_RETRIES=3
//   - Per-section token budgets
//   - Difficulty balancing
//   - Paper caching
//
// Patterns: PATTERN_MATH (Math-II), PATTERN_FEEE (FEEE)
// ═══════════════════════════════════════════════════════════════

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

function buildSectionPrompt(subject, units, sectionConfig, language) {
  const isHindi = language === 'hindi';
  const isBilingual = language === 'bilingual';
  const namespace = subject.prompt_namespace;

  const syllabusText = units.map(u =>
    `Unit ${u.unit_no} — ${u.unit_name}: ${u.topics}`
  ).join('\n');

  const keywordsText = units.map(u =>
    `Unit ${u.unit_no}: ${(u.important_keywords || []).join(', ')}`
  ).join('\n');

  // Base template per pattern type
  if (subject.renderer_type === 'PATTERN_MATH') {
    return buildMathPrompt(sectionConfig, syllabusText, keywordsText, language, subject.name);
  } else if (subject.renderer_type === 'PATTERN_FEEE') {
    return buildFEEEPrompt(sectionConfig, syllabusText, keywordsText, language, subject.name, units);
  }
  throw new Error(`Unknown renderer_type: ${subject.renderer_type}`);
}

function buildMathPrompt(section, syllabus, keywords, language, subjectName) {
  const langRule = language === 'hindi'
    ? 'Write ALL text in Hindi (Devanagari). Math symbols/variables stay in Unicode.'
    : language === 'bilingual'
      ? 'Provide BOTH "en" (English) and "hi" (Hindi Devanagari) fields for every question.'
      : 'Write all questions in English only. Still include both "en" and "hi" fields — set "hi" to empty string.';

  const schemas = {
    partA: `{
  "questions": [
    {
      "en": "English question text",
      "hi": "Hindi question text",
      "type": "mcq",
      "options": ["option a", "option b", "option c", "option d"],
      "answer": "correct answer",
      "unit": 1
    }
  ]
}
NOTES: "type" must be one of: "mcq", "fill", "truefalse", "oneword".
"options" array ONLY for type "mcq" (exactly 4 options). Omit for other types.
Generate EXACTLY 10 questions. Mix types: at least 4 MCQ, 2 fill-in-blank, rest true/false or one-word.
Cover all 5 units (at least 2 questions per unit). Difficulty: EASY (1 mark each).`,

    partB: `{
  "questions": [
    {
      "en": "English question text",
      "hi": "Hindi question text",
      "unit": 1
    }
  ]
}
Generate EXACTLY 7 questions. Short calculation, formula recall, single-step derivation.
Cover at least 4 units. Difficulty: EASY-MEDIUM (2 marks each).`,

    partC: `{
  "questions": [
    {
      "en": "English question text",
      "hi": "Hindi question text",
      "unit": 1
    }
  ]
}
Generate EXACTLY 10 questions. Multi-step numericals, short proofs, formula applications.
Cover all 5 units (2 per unit). Difficulty: MEDIUM (2.5 marks each).`,

    partD: `{
  "questions": [
    {
      "en": "English question text",
      "hi": "Hindi question text",
      "unit": 1
    }
  ]
}
Generate EXACTLY 6 questions. Full derivations, multi-step numericals, proofs, matrix problems.
Cover at least 4 units. Difficulty: HARD (5 marks each).`
  };

  return `You are a senior BTEUP (Board of Technical Education, UP) ${subjectName} paper setter.

TASK: Generate exam questions for ${section.label}.

SYLLABUS:
${syllabus}

IMPORTANT KEYWORDS BY UNIT:
${keywords}

OUTPUT: Return STRICT JSON matching this schema EXACTLY:
${schemas[section.key]}

STRICT RULES:
1. Output ONLY valid JSON. No text outside JSON. No markdown. No explanation.
2. No LaTeX. Use Unicode math: x², x³, √x, ∫, Σ, ∂, Δ, π, ∞
3. Fractions: a/b format. Matrices: [[a,b],[c,d]]
4. ${langRule}
5. Hindi technical terms must include English in brackets: "सारणिक (Determinant)"
6. Board style: UPBTE diploma level (NOT degree level).
7. Questions must have clean, solvable numbers.
8. No repeated concepts within this section.
9. Difficulty: ${section.difficulty}
10. avoid_repetition: true

GENERATE NOW:`;
}

function buildFEEEPrompt(section, syllabus, keywords, language, subjectName, units) {
  const langRule = language === 'hindi'
    ? 'Write ALL text in Hindi (Devanagari). Technical symbols stay in Unicode.'
    : language === 'bilingual'
      ? 'Provide BOTH "en" (English) and "hi" (Hindi Devanagari) fields for every item.'
      : 'Write all in English only. Still include both "en" and "hi" fields — set "hi" to empty string.';

  if (section.key === 'q6') {
    return `You are a senior BTEUP ${subjectName} paper setter.

TASK: Generate short note topics for Q6 (Short Notes section).

SYLLABUS:
${syllabus}

OUTPUT: Return STRICT JSON matching this schema:
{
  "notes": [
    {
      "en": "Topic name or short question in English",
      "hi": "Topic in Hindi",
      "unit": 1
    }
  ]
}

Generate EXACTLY 5 short note topics from across ALL 5 units.
Difficulty: EASY-MEDIUM (2.5 marks each).

STRICT RULES:
1. Output ONLY valid JSON. No text outside JSON. No markdown.
2. No LaTeX. Use Unicode symbols.
3. ${langRule}
4. Board style: UPBTE diploma level.
5. Topics should be focused (e.g., "Working principle of CRO", "Zener diode as voltage regulator").
6. avoid_repetition: true

GENERATE NOW:`;
  }

  // Q1-Q5: Each maps to one unit
  const qNum = parseInt(section.key.replace('q', ''));
  const unit = units.find(u => u.unit_no === qNum);
  const unitTopics = unit ? `${unit.unit_name}: ${unit.topics}` : syllabus;

  return `You are a senior BTEUP ${subjectName} paper setter.

TASK: Generate 3 long-answer sub-parts for ${section.label}.
This question covers: ${unitTopics}

SYLLABUS (full for reference):
${syllabus}

OUTPUT: Return STRICT JSON matching this schema:
{
  "parts": [
    {
      "en": "Full question text in English",
      "hi": "Full question text in Hindi",
      "marks": 10
    }
  ]
}

Generate EXACTLY 3 parts (student attempts any 2).
Each part is worth 10 marks. Difficulty: MEDIUM-HARD.

STRICT RULES:
1. Output ONLY valid JSON. No text outside JSON. No markdown.
2. No LaTeX. Use Unicode symbols.
3. ${langRule}
4. Board style: UPBTE diploma level.
5. Questions should include derivations, diagrams descriptions, numerical problems, or explain-with-diagram type.
6. avoid_repetition: true
7. Each part should be substantial enough for 10 marks (multi-step).

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
    const { subject_id, branch, language } = body || {};
    const lang = (language || 'bilingual').toLowerCase();

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

          const prompt = buildSectionPrompt(subject, units, section, lang);
          const temperature = attempt === 1 ? 0.55 : 0.7;

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
