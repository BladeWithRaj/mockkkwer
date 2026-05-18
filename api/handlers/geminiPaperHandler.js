// ═══════════════════════════════════════════════
// POLYTECHNIC PAPER GENERATOR — Gemini AI
// POST /api/generate-polytechnic-paper
// 
// Hardened: strict structure, real sample context,
// diversity rules, output validation + sanitization
// ═══════════════════════════════════════════════

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const MAX_RETRIES = 2;

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

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: "Gemini API key not configured." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { branch, semester, subject } = body || {};

    if (!branch || !semester || !subject) {
      return res.status(400).json({ error: "branch, semester, and subject are required" });
    }

    // Try with retries
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const prompt = buildPrompt(branch, semester, subject);
        
        const geminiRes = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: attempt === 0 ? 0.6 : 0.75, // Slightly higher temp on retry
              maxOutputTokens: 6000,
              topP: 0.9,
              topK: 40
            }
          })
        });

        if (!geminiRes.ok) {
          const errText = await geminiRes.text();
          console.error(`[GEMINI] API error (attempt ${attempt + 1}):`, geminiRes.status, errText);
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

    // All retries exhausted
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
function buildPrompt(branch, semester, subject) {
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
