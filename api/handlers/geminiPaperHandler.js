// ═══════════════════════════════════════════════
// POLYTECHNIC PAPER GENERATOR — Gemini AI + Groq Fallback
// POST /api/generate-polytechnic-paper
// 
// Hardened: strict structure, real sample context,
// diversity rules, output validation + sanitization
// Fallback: Gemini → Groq (if Gemini fails/rate-limited)
// ═══════════════════════════════════════════════

// Read at request time, not module load — Vercel env may not be ready at cold start
function getGeminiConfig() {
  const key = process.env.GEMINI_API_KEY;
  return {
    key,
    url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`
  };
}

// Groq fallback — used when Gemini is rate-limited or unavailable
function getGroqConfig() {
  const key = process.env.GROQ_API_KEY;
  return {
    key,
    url: "https://api.groq.com/openai/v1/chat/completions"
  };
}

// DeepSeek fallback — last resort if both Gemini & Groq fail
function getDeepSeekConfig() {
  const key = process.env.DEEPSEEK_API_KEY;
  return {
    key,
    url: "https://api.deepseek.com/chat/completions"
  };
}

const MAX_RETRIES = 2;

// ── IP-based rate limiter — protect Gemini quota from abuse ──
const rateBuckets = {};
const RATE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_MAX = 10; // max 10 papers per 5 min per IP

function checkRateLimit(ip) {
  if (!ip || ip === "unknown") ip = "global";
  const now = Date.now();
  if (!rateBuckets[ip]) rateBuckets[ip] = [];
  rateBuckets[ip] = rateBuckets[ip].filter(ts => now - ts < RATE_WINDOW_MS);
  if (rateBuckets[ip].length >= RATE_MAX) return false;
  rateBuckets[ip].push(now);
  // Cleanup old IPs
  if (Object.keys(rateBuckets).length > 500) {
    for (const k of Object.keys(rateBuckets)) {
      if (!rateBuckets[k].length) delete rateBuckets[k];
    }
  }
  return true;
}

// ── Subject → Syllabus mapping (common subjects) ──
const SYLLABUS_MAP = {
  "Applied Mathematics-II": {
    units: [
      "Unit I: Determinants & Matrices — Properties of determinants, Cramer's rule, types of matrices, inverse, rank",
      "Unit II: Differential Calculus-II — Successive differentiation, Leibnitz theorem, partial differentiation, Euler's theorem",
      "Unit III: Integral Calculus — Indefinite integrals, definite integrals, reduction formulae, Beta & Gamma functions",
      "Unit IV: Differential Equations — ODE formation, variable separable, homogeneous, linear, Bernoulli's, exact equations",
      "Unit V: Numerical Methods — Newton-Raphson, Regula-Falsi, finite differences, interpolation (Newton's forward/backward), numerical integration (Trapezoidal, Simpson's 1/3 & 3/8)"
    ],
    isCommon: true,
    branches: ["Mechanical Engineering (Automobile)", "Civil Engineering", "Electrical Engineering", "Mechanical Engineering (Production)"]
  },
  "Applied Mathematics-I": {
    units: [
      "Unit I: Algebra — Binomial theorem, partial fractions, logarithms, AP/GP/HP series",
      "Unit II: Trigonometry — Compound angles, submultiple angles, inverse trigonometric functions",
      "Unit III: Coordinate Geometry — Straight line, circle, conic sections (parabola, ellipse, hyperbola)",
      "Unit IV: Differential Calculus-I — Limits, continuity, differentiation, tangent/normal, maxima/minima",
      "Unit V: Complex Numbers — Algebra of complex numbers, De Moivre's theorem, roots of complex numbers"
    ],
    isCommon: true,
    branches: ["Mechanical Engineering (Automobile)", "Civil Engineering", "Electrical Engineering", "Mechanical Engineering (Production)"]
  },
  "Applied Physics-I": {
    units: [
      "Unit I: Units & Dimensions — SI units, dimensional analysis, errors in measurements",
      "Unit II: Force & Motion — Newton's laws, friction, projectile motion, circular motion",
      "Unit III: Work, Energy & Power — Work-energy theorem, conservation laws, collisions",
      "Unit IV: Properties of Matter — Elasticity, surface tension, viscosity, Bernoulli's theorem",
      "Unit V: Heat & Thermodynamics — Temperature scales, thermal expansion, specific heat, laws of thermodynamics"
    ],
    isCommon: true,
    branches: ["Mechanical Engineering (Automobile)", "Civil Engineering", "Electrical Engineering", "Mechanical Engineering (Production)"]
  },
  "Applied Chemistry": {
    units: [
      "Unit I: Atomic Structure & Chemical Bonding — Bohr model, quantum numbers, ionic/covalent bonding",
      "Unit II: Fuels & Combustion — Classification, calorific value, combustion calculations",
      "Unit III: Water Treatment — Hardness, softening methods, boiler problems",
      "Unit IV: Polymers & Plastics — Classification, polymerization, rubber, plastics",
      "Unit V: Corrosion & its Prevention — Types of corrosion, electrochemical theory, protection methods"
    ],
    isCommon: true,
    branches: ["Mechanical Engineering (Automobile)", "Civil Engineering", "Electrical Engineering", "Mechanical Engineering (Production)"]
  }
};

// ── Real BTEUP sample paper structure for context ──
const SAMPLE_PAPER = `EXAMPLE OF CORRECT FORMAT:

Q1) Attempt any ten parts of the following:        (10 × 1 = 10)

(a) Define a determinant of order 3.
(b) If A is a square matrix of order 3 and |A| = 5, find |3A|.
(c) State the condition for consistency of a system of linear equations.
(d) Evaluate: ∫(sin²x)dx
(e) Write the degree of the differential equation d²y/dx² + (dy/dx)³ = 0.
(f) Find the value of Δ²(x³) where Δ is the forward difference operator with h=1.
(g) Write Simpson's 1/3 rule formula.
(h) If y = e^(ax), find yn (nth derivative).
(i) State Euler's theorem on homogeneous functions.
(j) Define Beta function.
(k) Write the formula for Newton-Raphson method.
(l) Find the integrating factor of dy/dx + y/x = x².

Q2) Attempt any five parts of the following:       (5 × 2 = 10)

(a) Solve using Cramer's rule: 2x + y = 5, 3x - 2y = 4
(b) Evaluate: ∫₀^(π/2) sin⁴x dx using reduction formula.
(c) Find the nth derivative of y = x²·e^(3x).
(d) If u = x³ + y³ + 3xy, find ∂u/∂x and ∂u/∂y.
(e) Solve: dy/dx = (x + y)/(x - y)
(f) Find a real root of x³ - x - 1 = 0 by Newton-Raphson method (3 iterations).
(g) Evaluate ∫₀^1 dx/(1+x²) using Simpson's 1/3 rule with n=4.

Q3) Attempt any two parts of the following:        (2 × 5 = 10)

(a) Solve the system using matrix inversion: x + y + z = 6, x - y + z = 2, 2x + y - z = 1
(b) Evaluate ∫₀^(π/2) sin⁶x·cos⁴x dx using Beta/Gamma functions.
(c) Solve: (x² + y²)dx - 2xy·dy = 0

Q4) Attempt any two parts of the following:        (2 × 5 = 10)

(a) If u = log(x² + y² + z²), prove that x·∂u/∂x + y·∂u/∂y + z·∂u/∂z = 2.
(b) Solve: d²y/dx² - 3·dy/dx + 2y = e^(3x)
(c) From the following table, find f(1.5) using Newton's forward interpolation formula:
    x:    1    2    3    4    5
    f(x): 1    8    27   64   125

Q5) Attempt any two parts of the following:        (2 × 5 = 10)

(a) Find the rank of the matrix: [[1,2,3],[2,3,4],[3,5,7]]
(b) Evaluate ∫₁^5 (1/x)dx using Trapezoidal rule with h=1 and verify the result.
(c) Solve: (D² + 4)y = cos2x, where D = d/dx`;


export async function handleGeneratePolytechnicPaper(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  // ── Origin check — only allow requests from our own domain ──
  const origin = req.headers.origin || req.headers.referer || "";
  const allowedOrigins = ["mock24hr.vercel.app", "localhost", "127.0.0.1"];
  const isAllowed = allowedOrigins.some(o => origin.includes(o));
  if (!isAllowed && origin) {
    console.warn("[PAPER] Blocked cross-origin request from:", origin);
    return res.status(403).json({ error: "Forbidden — cross-origin requests not allowed" });
  }

  // ── Rate limit per IP ──
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() 
          || req.headers["x-real-ip"] 
          || req.socket?.remoteAddress 
          || "unknown";
  if (!checkRateLimit(ip)) {
    console.warn("[PAPER] Rate limited IP:", ip);
    return res.status(429).json({ 
      error: "Too many requests. Max 10 papers per 5 minutes. Please wait.",
      retryAfter: 60 
    });
  }

  // ── Get Gemini config at request time ──
  const { key: GEMINI_API_KEY, url: GEMINI_URL } = getGeminiConfig();
  if (!GEMINI_API_KEY) {
    console.error("[GEMINI] GEMINI_API_KEY not found in env vars");
    return res.status(500).json({ error: "Gemini API key not configured." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { branch, semester, subject, language } = body || {};

    if (!branch || !semester || !subject) {
      return res.status(400).json({ error: "branch, semester, and subject are required" });
    }

    const lang = (language || 'english').toLowerCase();

    // Try with retries (but NOT on rate limit errors)
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Add delay between retries (not on first attempt)
        if (attempt > 0) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
        }

        const prompt = buildPrompt(branch, semester, subject, lang);

        const geminiRes = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: attempt === 0 ? 0.6 : 0.75,
              maxOutputTokens: 6000,
              topP: 0.9,
              topK: 40
            }
          })
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.error(`[GEMINI] API error (attempt ${attempt + 1}):`, geminiRes.status, errText.substring(0, 300));
          
          // 429 = rate limit / 403 = invalid key — skip retries, go to Groq fallback
          if (geminiRes.status === 429 || geminiRes.status === 403) {
            lastError = `Gemini ${geminiRes.status}: ${geminiRes.status === 429 ? "rate limited" : "key invalid"}`;
            console.warn(`[GEMINI] ${lastError} — switching to Groq fallback`);
            break; // Exit retry loop → fall through to Groq
          }
          
          lastError = `Gemini API error: ${geminiRes.status}`;
          continue;
        }

        const geminiData = await geminiRes.json();
        let paper = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!paper || paper.trim().length < 100) {
          lastError = "Generated paper too short";
          continue;
        }

        // Sanitize output
        paper = sanitizePaper(paper);

        // Validate structure
        const validation = validatePaper(paper);
        if (!validation.valid && attempt < MAX_RETRIES) {
          console.warn(`[PAPER] Validation failed (attempt ${attempt + 1}):`, validation.issues);
          lastError = `Validation: ${validation.issues.join(", ")}`;
          continue;
        }

        return res.json({
          success: true,
          paper: paper.trim(),
          validation: validation.valid ? "passed" : { issues: validation.issues },
          attempt: attempt + 1
        });

      } catch (genErr) {
        console.error(`[PAPER] Generation error (attempt ${attempt + 1}):`, genErr.message);
        lastError = genErr.message;
      }
    }

    // ── Groq Fallback — try if Gemini exhausted ──────────────
    const { key: GROQ_KEY, url: GROQ_URL } = getGroqConfig();
    if (GROQ_KEY) {
      console.log("[PAPER] Gemini failed, trying Groq fallback...");
      try {
        const prompt = buildPrompt(branch, semester, subject, lang);

        const groqRes = await fetch(GROQ_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_KEY}`
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              {
                role: "system",
                content: "You are an expert BTEUP Polytechnic paper setter. Follow all formatting instructions exactly. Output plain text only, no markdown."
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.65,
            max_tokens: 6000
          })
        });

        if (groqRes.ok) {
          const groqData = await groqRes.json();
          let paper = groqData?.choices?.[0]?.message?.content || "";

          if (paper && paper.trim().length >= 100) {
            paper = sanitizePaper(paper);
            const validation = validatePaper(paper);

            console.log("[PAPER] ✅ Generated via Groq fallback");
            return res.json({
              success: true,
              paper: paper.trim(),
              validation: validation.valid ? "passed" : { issues: validation.issues },
              provider: "groq-fallback"
            });
          } else {
            console.warn("[GROQ] Paper too short:", paper?.length || 0);
          }
        } else {
          const errText = await groqRes.text();
          console.error("[GROQ] Fallback API error:", groqRes.status, errText.substring(0, 300));
        }
      } catch (groqErr) {
        console.error("[GROQ] Fallback error:", groqErr.message);
      }
    }

    // ── DeepSeek Fallback — last resort ──────────────────────
    const { key: DEEPSEEK_KEY, url: DEEPSEEK_URL } = getDeepSeekConfig();
    if (DEEPSEEK_KEY) {
      console.log("[PAPER] Groq also failed, trying DeepSeek fallback...");
      try {
        const prompt = buildPrompt(branch, semester, subject, lang);

        const dsRes = await fetch(DEEPSEEK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${DEEPSEEK_KEY}`
          },
          body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
              {
                role: "system",
                content: "You are an expert BTEUP Polytechnic paper setter. Follow all formatting instructions exactly. Output plain text only, no markdown."
              },
              { role: "user", content: prompt }
            ],
            temperature: 0.65,
            max_tokens: 6000
          })
        });

        if (dsRes.ok) {
          const dsData = await dsRes.json();
          let paper = dsData?.choices?.[0]?.message?.content || "";

          if (paper && paper.trim().length >= 100) {
            paper = sanitizePaper(paper);
            const validation = validatePaper(paper);

            console.log("[PAPER] ✅ Generated via DeepSeek fallback");
            return res.json({
              success: true,
              paper: paper.trim(),
              validation: validation.valid ? "passed" : { issues: validation.issues },
              provider: "deepseek-fallback"
            });
          } else {
            console.warn("[DEEPSEEK] Paper too short:", paper?.length || 0);
          }
        } else {
          const errText = await dsRes.text();
          console.error("[DEEPSEEK] Fallback API error:", dsRes.status, errText.substring(0, 300));
        }
      } catch (dsErr) {
        console.error("[DEEPSEEK] Fallback error:", dsErr.message);
      }
    }

    // All 3 providers exhausted
    return res.status(502).json({
      error: "Failed to generate paper after multiple attempts. Please try again.",
      detail: lastError
    });

  } catch (err) {
    console.error("[GENERATE PAPER] Error:", err.message);
    return res.status(500).json({ error: "Internal error. Please try again." });
  }
}

/**
 * Build a hardened prompt with:
 * - Strict structure constraints
 * - Real sample paper context
 * - Dynamic syllabus per subject
 * - Diversity rules
 */
function buildPrompt(branch, semester, subject, language = 'english') {
  const isHindi = language === 'hindi';
  const syllabus = SYLLABUS_MAP[subject];
  const unitList = syllabus
    ? syllabus.units.map((u, i) => `  ${u}`).join("\n")
    : `  (Use standard ${subject} syllabus for ${branch} polytechnic)`;

  return `You are an expert UPBTE / BTEUP Polytechnic paper setter with 20 years experience.

TASK: Generate a complete, realistic, printable ${subject} question paper in EXACT BTEUP official format.

CONTEXT:
- Branch: ${branch}
- Semester: ${semester}
- Subject: ${subject}
- Board: Board of Technical Education, Uttar Pradesh (BTEUP/UPBTE)

═══════════════════════════════════════════════
MANDATORY PAPER STRUCTURE (DO NOT DEVIATE):
═══════════════════════════════════════════════

HEADER (EXACTLY AS SHOWN):
BOARD OF TECHNICAL EDUCATION UTTAR PRADESH, LUCKNOW
${subject.toUpperCase()}
Branch: ${branch}     Semester: ${semester.replace("Semester ", "")}
Time: 2:30 Hours                    Maximum Marks: 50
                                    Minimum Marks: 17

NOTES:
i) Attempt all questions.
ii) Students are advised to specially check the numerical data of question paper in both versions.
iii) Use of Pager and Mobile Phone by students is not allowed.

BODY STRUCTURE:
Q1) Attempt any ten parts: (10 × 1 = 10) → EXACTLY 12 sub-parts (a) to (l)
    - Short answer / definition / formula / fill-in type
    - Cover ALL units evenly (2-3 parts per unit)

Q2) Attempt any five parts: (5 × 2 = 10) → EXACTLY 7 sub-parts (a) to (g)
    - Short numerical / derivation / explain type
    - Cover at least 4 different units

Q3) Attempt any two parts: (2 × 5 = 10) → EXACTLY 3 sub-parts (a) to (c)
    - Long numerical / proof / detailed derivation
    - Each from DIFFERENT units

Q4) Attempt any two parts: (2 × 5 = 10) → EXACTLY 3 sub-parts (a) to (c)
    - Long numerical / proof / detailed derivation
    - Each from DIFFERENT units (different from Q3)

Q5) Attempt any two parts: (2 × 5 = 10) → EXACTLY 3 sub-parts (a) to (c)
    - Long numerical / proof / detailed derivation
    - Each from DIFFERENT units (cover remaining units)

TOTAL MARKS: 10 + 10 + 10 + 10 + 10 = 50

═══════════════════════════════════════════════
SYLLABUS UNITS TO COVER:
═══════════════════════════════════════════════
${unitList}

═══════════════════════════════════════════════
REAL BTEUP PAPER EXAMPLE (FOLLOW THIS FORMAT):
═══════════════════════════════════════════════
${SAMPLE_PAPER}

═══════════════════════════════════════════════
STRICT QUALITY RULES:
═══════════════════════════════════════════════

1. DIVERSITY: No two sub-parts should test the exact same concept. Avoid repeating:
   - Same type of integrals (e.g., don't have 3 trigonometric integrals)
   - Same type of differential equations
   - Same matrix operations

2. DIFFICULTY: Engineering diploma level (NOT degree level). Students are 11th/12th pass.

3. NUMERICALS: Use clean, solvable numbers. Avoid messy fractions or complex decimals.

4. COVERAGE: Every syllabus unit MUST appear in at least 2 questions.

5. MATHEMATICAL NOTATION: 
   - Use readable plain text notation: x², x³, √x, ∫, Σ, ∂, Δ, π
   - Write fractions as a/b format
   - DO NOT use LaTeX syntax like \\frac{}{} or \\int or $...$
   - Write matrices in bracket notation: [[1,2],[3,4]]

6. FORMAT: 
   - Plain text only, no markdown (no **, no ##, no \`\`\`)
   - Use dashes/equals for separators
   - Keep exactly the structure shown above
   - Do NOT add explanations, hints, or answer keys
   - Do NOT add any text before or after the paper

${isHindi ? `7. LANGUAGE — HINDI MEDIUM:
   - Write ALL question text in Hindi (Devanagari script).
   - The HEADER (Board name, branch, semester, time, marks, notes) should remain in ENGLISH.
   - Mathematical symbols, formulas, equations, variables (x, y, z, A, B, etc.) stay in English/Unicode math notation.
   - Technical terms can be written in Hindi with English in brackets. Example: "अवकल समीकरण (Differential Equation)"
   - Question numbering (Q1, Q2, (a), (b)) stays in English.
   - Marks pattern stays in English: (10 × 1 = 10)
   - Instructions like "Attempt any ten parts" should be in Hindi: "निम्नलिखित में से किन्हीं दस भागों को हल करें"
   - Example Hindi question: "(a) अवकलज ज्ञात करें: y = x² + 3x + 5"
   - Example Hindi question: "(b) आव्यूह A = [[1,2],[3,4]] का सारणिक ज्ञात करें।"
` : ''}

GENERATE THE COMPLETE PAPER NOW:`;
}

/**
 * Sanitize Gemini output — strip markdown artifacts, normalize formatting
 */
function sanitizePaper(paper) {
  return paper
    // Remove markdown code fences
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```/g, "")
    // Remove markdown bold/italic
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove LaTeX artifacts
    .replace(/\$([^$]+)\$/g, "$1")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\int/g, "∫")
    .replace(/\\sum/g, "Σ")
    .replace(/\\partial/g, "∂")
    .replace(/\\pi/g, "π")
    .replace(/\\infty/g, "∞")
    .replace(/\\[a-zA-Z]+/g, "") // Remove remaining LaTeX commands
    // Normalize whitespace
    .replace(/\n{4,}/g, "\n\n\n")
    .replace(/[ \t]+$/gm, "") // Trailing whitespace
    .trim();
}

/**
 * Validate paper structure — check Q1-Q5, marks, sub-parts
 */
function validatePaper(paper) {
  const issues = [];
  const text = paper.toUpperCase();

  // Check all 5 questions exist
  for (let i = 1; i <= 5; i++) {
    if (!text.includes(`Q${i}`) && !text.includes(`Q.${i}`) && !text.includes(`QUESTION ${i}`)) {
      issues.push(`Q${i} missing`);
    }
  }

  // Check marks structure
  if (!text.includes("10 × 1") && !text.includes("10×1") && !text.includes("10 X 1")) {
    issues.push("Q1 marks pattern (10×1=10) not found");
  }
  if (!text.includes("5 × 2") && !text.includes("5×2") && !text.includes("5 X 2")) {
    issues.push("Q2 marks pattern (5×2=10) not found");
  }

  // Check total marks mentioned
  if (!text.includes("50") || !text.includes("17")) {
    issues.push("Max marks (50) or min marks (17) not found in header");
  }

  // Check sub-parts exist (at least (a) through (c))
  const hasSubParts = paper.match(/\([a-l]\)/g);
  if (!hasSubParts || hasSubParts.length < 15) {
    issues.push(`Insufficient sub-parts (found ${hasSubParts?.length || 0}, expected 28+)`);
  }

  // Check minimum length
  if (paper.length < 1500) {
    issues.push("Paper too short (likely incomplete)");
  }

  return { valid: issues.length === 0, issues };
}
