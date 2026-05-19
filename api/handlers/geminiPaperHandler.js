// ═══════════════════════════════════════════════════════════════
// BTEUP PAPER GENERATOR — Template-Controlled AI System
// POST /api/generate-polytechnic-paper
//
// Architecture:
//   AI generates ONLY questions (structured)
//   Backend validates, formats, and assembles final paper
//   Frontend renders with hardcoded BTEUP template
//
// Subject: Mathematics-II (2nd Semester, Common for all branches)
// Total Marks: 60  |  Time: 3 Hours
// ═══════════════════════════════════════════════════════════════

// ── Provider Configs (read at request time for Vercel) ──
function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY;
  return {
    key,
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`
  };
}

function getGroqConfig() {
  const key = process.env.GROQ_API_KEY;
  return {
    key,
    url: "https://api.groq.com/openai/v1/chat/completions"
  };
}

function getDeepSeekConfig() {
  const key = process.env.DEEPSEEK_API_KEY;
  return {
    key,
    url: "https://api.deepseek.com/chat/completions"
  };
}

const MAX_RETRIES = 2;

// ── IP-based rate limiter ──
const rateBuckets = {};
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 10;

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
// MATHEMATICS-II SYLLABUS (2nd Sem — Common for ALL branches)
// ═══════════════════════════════════════════════════════════════

const MATH2_SYLLABUS = `
UNIT I — Determinants & Matrices:
Properties of determinants (up to 3rd order), Minors & Cofactors, Cramer's rule for solving simultaneous equations, Types of matrices (symmetric, skew-symmetric, orthogonal, Hermitian, skew-Hermitian, unitary), Algebra of matrices, Adjoint & Inverse of matrix, Rank of matrix, Consistency of system of equations

UNIT II — Differential Calculus-II:
Successive differentiation, Leibnitz theorem, Partial differentiation, Euler's theorem on homogeneous functions, Total differential coefficients, Maxima and Minima of functions of two variables

UNIT III — Integral Calculus:
Integration by parts, Definite integrals and properties, Reduction formulae for ∫sinⁿx dx and ∫cosⁿx dx, Beta and Gamma functions (definitions, properties, relation), Numerical integration — Trapezoidal rule, Simpson's 1/3 rule, Simpson's 3/8 rule

UNIT IV — Differential Equations:
Order and degree of DE, Formation of DE, Solution of first order first degree DE — Variable separable, Homogeneous equations, Linear equations, Bernoulli's equation, Exact equations, Second order linear DE with constant coefficients (complementary function & particular integral)

UNIT V — Coordinate Geometry & Vector Algebra:
Circle — General equation, finding center & radius, tangent & normal, Conic Sections — Parabola, Ellipse, Hyperbola (standard forms, eccentricity, foci, directrix), Vector Algebra — Types of vectors, Addition, Dot product, Cross product, Scalar triple product, Applications
`.trim();


// ═══════════════════════════════════════════════════════════════
// PROMPT BUILDER — Asks AI for structured questions ONLY
// ═══════════════════════════════════════════════════════════════

function buildStructuredPrompt(language = 'english') {
  const isHindi = language === 'hindi';

  return `You are a senior BTEUP (Board of Technical Education, UP) Mathematics paper setter.

TASK: Generate exam questions for Mathematics-II (2nd Semester Diploma).

SYLLABUS:
${MATH2_SYLLABUS}

═══════════════════════════════════════════
OUTPUT FORMAT — FOLLOW EXACTLY:
═══════════════════════════════════════════

===PART_A===
[Generate EXACTLY 10 objective-type questions]
Mix types: MCQ (with 4 options on same line), Fill-in-blank (end with _______), True/False, One-word answer.
Cover all 5 units (2 questions per unit minimum).
Difficulty: EASY (1 mark each).
For MCQ format: Question text (a) opt1 (b) opt2 (c) opt3 (d) opt4

1. <question>
2. <question>
3. <question>
4. <question>
5. <question>
6. <question>
7. <question>
8. <question>
9. <question>
10. <question>
===END_A===

===PART_B===
[Generate EXACTLY 7 very short answer questions]
Short calculation, formula recall, single-step derivation.
Cover at least 4 units.
Difficulty: EASY-MEDIUM (2 marks each).

1. <question>
2. <question>
3. <question>
4. <question>
5. <question>
6. <question>
7. <question>
===END_B===

===PART_C===
[Generate EXACTLY 10 short answer questions]
Multi-step numericals, short proofs, formula applications.
Cover all 5 units (2 per unit).
Difficulty: MEDIUM (2.5 marks each).

1. <question>
2. <question>
3. <question>
4. <question>
5. <question>
6. <question>
7. <question>
8. <question>
9. <question>
10. <question>
===END_C===

===PART_D===
[Generate EXACTLY 6 long answer questions]
Full derivations, multi-step numericals, proofs, matrix problems.
Cover at least 4 units.
Difficulty: HARD (5 marks each).

1. <question>
2. <question>
3. <question>
4. <question>
5. <question>
6. <question>
===END_D===

═══════════════════════════════════════════
STRICT RULES:
═══════════════════════════════════════════
1. Output ONLY questions. NO answers, NO explanations, NO hints.
2. NO markdown: no **, ##, \`\`\`, bullets.
3. NO "Here is your paper" or any conversational text.
4. Math notation: x², x³, √x, ∫, Σ, ∂, Δ, π, ∞ (plain Unicode, NOT LaTeX)
5. Fractions: a/b format. Matrices: |a b; c d| or [[a,b],[c,d]]
6. Clean solvable numbers. Diploma level (NOT degree).
7. NO repeated concepts across parts.
8. Each question must be on its own line starting with number.
${isHindi ? `9. Write ALL questions in Hindi (Devanagari script).
10. Mathematical symbols/formulas/variables stay in English/Unicode.
11. Technical terms: Hindi with English in brackets. Ex: "सारणिक (Determinant)"
12. MCQ options also in Hindi where applicable.
13. Example: "आव्यूह A = [[2,1],[3,4]] का व्युत्क्रम ज्ञात करें।"` : ''}

GENERATE NOW:`;
}


// ═══════════════════════════════════════════════════════════════
// PARSER — Extracts structured questions from AI response
// ═══════════════════════════════════════════════════════════════

function extractSection(text, partLetter) {
  // Try multiple delimiter patterns for robustness
  const patterns = [
    new RegExp(`===\\s*PART_${partLetter}\\s*===[\\s\\S]*?===\\s*END_${partLetter}\\s*===`, 'i'),
    new RegExp(`===\\s*PART_${partLetter}\\s*===([\\s\\S]*?)(?====\\s*(?:PART_|END_)|$)`, 'i'),
    new RegExp(`PART\\s*[-–—]?\\s*${partLetter}[\\s\\S]*?(?=PART\\s*[-–—]?\\s*[${partLetter === 'A' ? 'B' : partLetter === 'B' ? 'C' : partLetter === 'C' ? 'D' : 'Z'}]|$)`, 'i')
  ];

  for (const pat of patterns) {
    const match = text.match(pat);
    if (match) {
      let section = match[1] || match[0];
      // Remove the delimiter lines themselves
      section = section
        .replace(/===\s*PART_[A-D]\s*===/gi, '')
        .replace(/===\s*END_[A-D]\s*===/gi, '')
        .replace(/\[Generate EXACTLY.*?\]/gi, '')
        .replace(/^(Mix types|Cover all|Difficulty|Short calculation|Multi-step|Full derivations|For MCQ format).*$/gim, '')
        .trim();
      if (section.length > 20) return section;
    }
  }
  return '';
}

function parseNumberedQuestions(section) {
  if (!section) return [];

  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const questions = [];
  let current = '';

  for (const line of lines) {
    // New question starts with number followed by . or )
    if (/^\d{1,2}[\.\)]\s/.test(line)) {
      if (current) questions.push(current.trim());
      current = line.replace(/^\d{1,2}[\.\)]\s*/, '');
    } else if (current) {
      // Continuation of previous question (multi-line)
      current += ' ' + line;
    }
  }
  if (current) questions.push(current.trim());

  // Filter out empty/too-short questions
  return questions.filter(q => q.length > 5);
}

function parseAIResponse(rawText) {
  // Clean markdown artifacts
  let text = rawText
    .replace(/```[\s\S]*?```/g, '')
    .replace(/```/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\int/g, '∫')
    .replace(/\\sum/g, 'Σ')
    .replace(/\\partial/g, '∂')
    .replace(/\\pi/g, 'π')
    .replace(/\\infty/g, '∞')
    .replace(/\\[a-zA-Z]+/g, '')
    .trim();

  return {
    partA: parseNumberedQuestions(extractSection(text, 'A')),
    partB: parseNumberedQuestions(extractSection(text, 'B')),
    partC: parseNumberedQuestions(extractSection(text, 'C')),
    partD: parseNumberedQuestions(extractSection(text, 'D'))
  };
}


// ═══════════════════════════════════════════════════════════════
// VALIDATOR — Ensures correct question counts
// ═══════════════════════════════════════════════════════════════

function validateStructure(parsed) {
  const issues = [];

  if (parsed.partA.length < 8) issues.push(`Part A: need 10, got ${parsed.partA.length}`);
  if (parsed.partB.length < 5) issues.push(`Part B: need 7, got ${parsed.partB.length}`);
  if (parsed.partC.length < 7) issues.push(`Part C: need 10, got ${parsed.partC.length}`);
  if (parsed.partD.length < 4) issues.push(`Part D: need 6, got ${parsed.partD.length}`);

  // Check for markdown contamination
  const allText = [...parsed.partA, ...parsed.partB, ...parsed.partC, ...parsed.partD].join(' ');
  if (allText.includes('**') || allText.includes('##')) issues.push('Markdown detected in output');
  if (allText.toLowerCase().includes('here is') || allText.toLowerCase().includes('here are')) {
    issues.push('Conversational text detected');
  }

  return { valid: issues.length === 0, issues };
}


// ═══════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════

export async function handleGeneratePolytechnicPaper(req, res) {
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

  // Get API config
  const { key: GEMINI_API_KEY, url: GEMINI_URL } = getGeminiConfig();
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "API key not configured." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { branch, language } = body || {};
    const lang = (language || 'english').toLowerCase();
    const subject = "Mathematics-II"; // LOCKED — only subject supported

    // ── Try Gemini with retries ──
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2000 * attempt));

        const prompt = buildStructuredPrompt(lang);

        const geminiRes = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: attempt === 0 ? 0.55 : 0.7,
              maxOutputTokens: 6000,
              topP: 0.9,
              topK: 40
            }
          })
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.error(`[GEMINI] Error (attempt ${attempt + 1}):`, geminiRes.status, errText.substring(0, 200));
          if (geminiRes.status === 429 || geminiRes.status === 403) {
            lastError = `Gemini ${geminiRes.status}`;
            break;
          }
          lastError = `Gemini API error: ${geminiRes.status}`;
          continue;
        }

        const data = await geminiRes.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!rawText || rawText.trim().length < 200) {
          lastError = "Response too short";
          continue;
        }

        const parsed = parseAIResponse(rawText);
        const validation = validateStructure(parsed);

        if (!validation.valid && attempt < MAX_RETRIES) {
          console.warn(`[PAPER] Validation failed (attempt ${attempt + 1}):`, validation.issues);
          lastError = validation.issues.join(", ");
          continue;
        }

        // Trim to exact counts
        return res.json({
          success: true,
          paper: {
            subject: "MATHEMATICS-II",
            code: "4201",
            branch: branch || "Mechanical Engineering",
            semester: "2nd",
            totalMarks: 60,
            time: "3:00 Hours",
            language: lang,
            partA: parsed.partA.slice(0, 10),
            partB: parsed.partB.slice(0, 7),
            partC: parsed.partC.slice(0, 10),
            partD: parsed.partD.slice(0, 6)
          },
          validation: validation.valid ? "passed" : { issues: validation.issues },
          provider: "gemini",
          attempt: attempt + 1
        });

      } catch (err) {
        console.error(`[PAPER] Error (attempt ${attempt + 1}):`, err.message);
        lastError = err.message;
      }
    }

    // ── Groq Fallback ──
    const { key: GROQ_KEY, url: GROQ_URL } = getGroqConfig();
    if (GROQ_KEY) {
      console.log("[PAPER] Trying Groq fallback...");
      try {
        const prompt = buildStructuredPrompt(lang);
        const groqRes = await fetch(GROQ_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_KEY}` },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: "You are a BTEUP Polytechnic Mathematics paper setter. Output ONLY questions in the exact format requested. No explanations." },
              { role: "user", content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 6000
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          const rawText = groqData?.choices?.[0]?.message?.content || "";
          if (rawText.length >= 200) {
            const parsed = parseAIResponse(rawText);
            const validation = validateStructure(parsed);
            return res.json({
              success: true,
              paper: {
                subject: "MATHEMATICS-II",
                code: "4201",
                branch: branch || "Mechanical Engineering",
                semester: "2nd",
                totalMarks: 60,
                time: "3:00 Hours",
                language: lang,
                partA: parsed.partA.slice(0, 10),
                partB: parsed.partB.slice(0, 7),
                partC: parsed.partC.slice(0, 10),
                partD: parsed.partD.slice(0, 6)
              },
              validation: validation.valid ? "passed" : { issues: validation.issues },
              provider: "groq"
            });
          }
        }
      } catch (e) {
        console.error("[GROQ] Error:", e.message);
      }
    }

    // ── DeepSeek Fallback ──
    const { key: DS_KEY, url: DS_URL } = getDeepSeekConfig();
    if (DS_KEY) {
      console.log("[PAPER] Trying DeepSeek fallback...");
      try {
        const prompt = buildStructuredPrompt(lang);
        const dsRes = await fetch(DS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DS_KEY}` },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: "You are a BTEUP Polytechnic Mathematics paper setter. Output ONLY questions in the exact format requested. No explanations." },
              { role: "user", content: prompt }
            ],
            temperature: 0.6,
            max_tokens: 6000
          })
        });

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          const rawText = dsData?.choices?.[0]?.message?.content || "";
          if (rawText.length >= 200) {
            const parsed = parseAIResponse(rawText);
            const validation = validateStructure(parsed);
            return res.json({
              success: true,
              paper: {
                subject: "MATHEMATICS-II",
                code: "4201",
                branch: branch || "Mechanical Engineering",
                semester: "2nd",
                totalMarks: 60,
                time: "3:00 Hours",
                language: lang,
                partA: parsed.partA.slice(0, 10),
                partB: parsed.partB.slice(0, 7),
                partC: parsed.partC.slice(0, 10),
                partD: parsed.partD.slice(0, 6)
              },
              validation: validation.valid ? "passed" : { issues: validation.issues },
              provider: "deepseek"
            });
          }
        }
      } catch (e) {
        console.error("[DEEPSEEK] Error:", e.message);
      }
    }

    return res.status(502).json({
      error: "Failed to generate paper. Please try again.",
      detail: lastError
    });

  } catch (err) {
    console.error("[GENERATE] Fatal:", err.message);
    return res.status(500).json({ error: "Internal error." });
  }
}
