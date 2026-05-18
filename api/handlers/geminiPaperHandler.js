// ═══════════════════════════════════════════════
// POLYTECHNIC PAPER GENERATOR — Gemini AI
// POST /api/generate-polytechnic-paper
// ═══════════════════════════════════════════════

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "REDACTED_KEY";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export async function handleGeneratePolytechnicPaper(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST only" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { branch, semester, subject } = body || {};

    if (!branch || !semester || !subject) {
      return res.status(400).json({ error: "branch, semester, and subject are required" });
    }

    const prompt = buildPrompt(branch, semester, subject);

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[GEMINI] API error:", geminiRes.status, errText);
      return res.status(502).json({ error: "Failed to generate paper. Please try again." });
    }

    const geminiData = await geminiRes.json();
    const paper = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!paper || paper.trim().length < 50) {
      return res.status(500).json({ error: "No paper generated. Please try again." });
    }

    return res.json({ success: true, paper: paper.trim() });

  } catch (err) {
    console.error("[GENERATE PAPER] Error:", err.message);
    return res.status(500).json({ error: "Internal error. Please try again." });
  }
}

function buildPrompt(branch, semester, subject) {
  return `You are an expert UPBTE / BTEUP Polytechnic paper setter.

Generate a realistic and printable ${subject} question paper exactly in BTEUP style.

Branch: ${branch}
Semester: ${semester}
Subject: ${subject}

STRICTLY follow the exact official BTEUP structure.

The paper must contain:
- One main question per section
- Multiple sub-parts inside each question
- Correct attempt-any logic
- Exact marks distribution
- Realistic diploma-level numericals

================================================
BOARD OF TECHNICAL EDUCATION UTTAR PRADESH
${subject.toUpperCase()}
Time: 2:30 Hours
Maximum Marks: 50
Minimum Marks: 17
================================================

NOTES:
i) Attempt all questions.
ii) Students are advised to specially check the numerical data of question paper in both versions. In case of any difference in Hindi and English version, answer according to English version.
iii) Use of Paper and Mobile Phone by students is not allowed.

------------------------------------------------

Q1) Attempt any ten parts of the following:        (10 × 1 = 10)

(a)
(b)
(c)
(d)
(e)
(f)
(g)
(h)
(i)
(j)
(k)
(l)

------------------------------------------------

Q2) Attempt any five parts of the following:      (5 × 2 = 10)

(a)
(b)
(c)
(d)
(e)
(f)
(g)

------------------------------------------------

Q3) Attempt any two parts of the following:       (2 × 5 = 10)

(a)
(b)
(c)

------------------------------------------------

Q4) Attempt any two parts of the following:       (2 × 5 = 10)

(a)
(b)
(c)

------------------------------------------------

Q5) Attempt any two parts of the following:       (2 × 5 = 10)

(a)
(b)
(c)

================================================

Use syllabus topics:
- Determinants and Matrices
- Integral Calculus
- Differential Equations
- Numerical Methods
- Coordinate Geometry
- Vector Algebra

Generation Rules:
- Questions must look like real BTEUP Polytechnic papers
- Prefer repeated and important concepts
- Use engineering diploma level difficulty
- Keep formatting clean and printable
- Do not generate separate standalone questions
- Each section must contain one main question with sub-parts
- Do not add explanations
- Do not add answer keys
- Avoid repeating same-type integrations
- Use readable mathematical notation
- Avoid raw LaTeX syntax

FINAL OUTPUT:
Return ONLY the final printable paper.`;
}
