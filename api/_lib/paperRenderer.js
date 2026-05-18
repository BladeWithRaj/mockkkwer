// ═══════════════════════════════════════════════
// POLYTECHNIC PDF RENDERER — pdf-lib based
// Clean, printable, bilingual exam papers
// ═══════════════════════════════════════════════

/**
 * Render a generated paper as HTML for preview/print.
 * Using HTML→print instead of pdf-lib for Vercel serverless compatibility.
 * pdf-lib needs font files which bloat the bundle.
 * 
 * This generates a fully self-contained HTML document optimized for:
 * - Print with correct margins/pagination
 * - Bilingual (Hindi/English) layout
 * - Header/footer with page numbers
 * - Answer key on separate page
 */
export function renderPaperHTML(paper, subjectInfo, options = {}) {
  const {
    showAnswerKey = false,
    language = "bilingual", // en | hi | bilingual
    watermark = "",
    instituteName = "POLYTECHNIC EXAMINATION",
    boardName = "Board of Technical Education"
  } = options;

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

  let questionNumber = 1;

  // Build sections HTML
  const sectionsHTML = paper.sections.map(section => {
    const sectionMarks = section.questions.length * section.marks_each;
    const questionsHTML = section.questions.map(q => {
      const qNum = questionNumber++;
      return renderQuestion(q, qNum, language, section.marks_each);
    }).join("\n");

    return `
      <div class="section">
        <div class="section-header">
          <strong>${section.name}</strong>
          <span class="section-meta">
            ${section.questions.length} Questions × ${section.marks_each} Mark${section.marks_each > 1 ? "s" : ""} = ${sectionMarks} Marks
            ${section.difficulty ? ` | Difficulty: ${section.difficulty.toUpperCase()}` : ""}
          </span>
        </div>
        <div class="questions">
          ${questionsHTML}
        </div>
      </div>
    `;
  }).join("\n");

  // Build answer key HTML
  const answerKeyHTML = showAnswerKey ? renderAnswerKey(paper.answer_key, language) : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectInfo?.subject_name || "Exam Paper"} - ${subjectInfo?.branch || ""} Sem ${subjectInfo?.semester || ""}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    @page {
      size: A4;
      margin: 15mm 12mm 20mm 12mm;
    }

    body {
      font-family: 'Inter', 'Noto Sans Devanagari', sans-serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fff;
    }

    /* ── Screen-only wrapper ── */
    @media screen {
      body { background: #e8e8e8; }
      .paper-container {
        max-width: 210mm;
        margin: 20px auto;
        background: #fff;
        box-shadow: 0 4px 24px rgba(0,0,0,.12);
        padding: 15mm 12mm;
      }
    }

    /* ── Header ── */
    .paper-header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .paper-header .board-name {
      font-size: 13pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #111;
    }
    .paper-header .institute-name {
      font-size: 11pt;
      font-weight: 600;
      color: #444;
      margin-top: 2px;
    }
    .paper-header .subject-line {
      font-size: 14pt;
      font-weight: 700;
      margin-top: 8px;
      color: #000;
    }
    .paper-meta {
      display: flex;
      justify-content: space-between;
      font-size: 10pt;
      margin-top: 8px;
      padding: 6px 0;
      border-top: 1px solid #ccc;
    }
    .paper-meta span { font-weight: 500; }

    .instructions {
      background: #f8f8f8;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 8px 12px;
      margin-bottom: 16px;
      font-size: 9pt;
      color: #555;
    }
    .instructions strong { color: #333; }
    .instructions ul { margin-left: 16px; margin-top: 4px; }
    .instructions li { margin-bottom: 2px; }

    /* ── Sections ── */
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    .section-header {
      background: #f0f0f0;
      padding: 6px 12px;
      border-left: 4px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .section-meta {
      font-size: 9pt;
      color: #666;
    }

    /* ── Questions ── */
    .question {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .question-text {
      margin-bottom: 6px;
      font-weight: 500;
    }
    .question-text .qno {
      font-weight: 700;
      color: #333;
      margin-right: 4px;
    }
    .question-text .marks-badge {
      font-size: 8pt;
      background: #eee;
      padding: 1px 6px;
      border-radius: 3px;
      color: #666;
      float: right;
    }
    .question-hi {
      font-family: 'Noto Sans Devanagari', sans-serif;
      color: #444;
      font-size: 10.5pt;
      margin-top: 2px;
      padding-left: 20px;
    }
    .options {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 24px;
      padding-left: 20px;
      margin-top: 6px;
    }
    .option {
      font-size: 10.5pt;
      padding: 2px 0;
    }
    .option-label {
      font-weight: 600;
      color: #555;
      margin-right: 4px;
    }

    /* ── Answer Key ── */
    .answer-key-page {
      page-break-before: always;
      margin-top: 30px;
    }
    .answer-key-page h2 {
      text-align: center;
      font-size: 14pt;
      margin-bottom: 16px;
      border-bottom: 2px solid #333;
      padding-bottom: 8px;
    }
    .answer-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      font-size: 10pt;
    }
    .answer-cell {
      border: 1px solid #ddd;
      padding: 4px 8px;
      text-align: center;
    }
    .answer-cell .aq-no { font-weight: 700; }
    .answer-cell .aq-ans { color: #2563eb; font-weight: 600; }

    /* ── Watermark ── */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 60pt;
      color: rgba(0,0,0,0.04);
      font-weight: 900;
      pointer-events: none;
      z-index: 0;
    }

    /* ── Print ── */
    @media print {
      body { background: #fff; }
      .paper-container { box-shadow: none; padding: 0; margin: 0; max-width: none; }
      .no-print { display: none !important; }
    }

    /* ── Print Button (screen only) ── */
    .print-bar {
      text-align: center;
      padding: 16px;
      background: #1a1a2e;
    }
    .print-bar button {
      padding: 10px 32px;
      font-size: 13pt;
      font-weight: 600;
      background: #6c5ce7;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin: 0 8px;
    }
    .print-bar button:hover { background: #5a4bd1; }
  </style>
</head>
<body>
  ${watermark ? `<div class="watermark">${watermark}</div>` : ""}

  <div class="print-bar no-print">
    <button onclick="window.print()">🖨️ Print Paper</button>
    <button onclick="toggleAnswerKey()">🔑 Toggle Answer Key</button>
    <button onclick="window.close()">✖ Close</button>
  </div>

  <div class="paper-container">
    <!-- Header -->
    <div class="paper-header">
      <div class="board-name">${boardName}</div>
      <div class="institute-name">${instituteName}</div>
      <div class="subject-line">${subjectInfo?.subject_name || "Subject"} (${subjectInfo?.subject_code || "---"})</div>
      <div class="paper-meta">
        <span>Branch: ${subjectInfo?.branch || "---"}</span>
        <span>Semester: ${subjectInfo?.semester || "---"}</span>
        <span>Time: ${paper.time_minutes || 180} Minutes</span>
        <span>Max Marks: ${paper.total_marks}</span>
      </div>
    </div>

    <!-- Instructions -->
    <div class="instructions">
      <strong>Instructions:</strong>
      <ul>
        <li>Attempt ALL questions. Each question carries the marks indicated.</li>
        <li>Total Questions: ${paper.total_questions} | Total Marks: ${paper.total_marks}</li>
        <li>No electronic devices allowed during the examination.</li>
        ${language === "bilingual" ? "<li>Questions are provided in both English and Hindi.</li>" : ""}
      </ul>
    </div>

    <!-- Sections -->
    ${sectionsHTML}
  </div>

  <!-- Answer Key (hidden by default) -->
  <div class="paper-container answer-key-page" id="answerKeySection" style="display:none;">
    ${answerKeyHTML}
  </div>

  <script>
    function toggleAnswerKey() {
      const ak = document.getElementById('answerKeySection');
      ak.style.display = ak.style.display === 'none' ? 'block' : 'none';
    }
  </script>
</body>
</html>`;
}

/**
 * Render a single question.
 */
function renderQuestion(q, qNum, language, marks) {
  const labels = ["A", "B", "C", "D", "E", "F"];
  
  // Get the right text based on language
  const textEn = q.question_en || "";
  const textHi = q.question_hi || "";
  const optionsEn = q.options_en || (q.answer_en ? null : null);
  const optionsHi = q.options_hi || null;

  // Question text
  let qText = "";
  if (language === "en" || language === "bilingual") {
    qText += `<div class="question-text"><span class="qno">Q${qNum}.</span> ${textEn} <span class="marks-badge">${marks}M</span></div>`;
  }
  if ((language === "hi" || language === "bilingual") && textHi) {
    qText += `<div class="question-hi">${textHi}</div>`;
  }

  // Options (MCQ)
  let optionsHTML = "";
  if (optionsEn && Array.isArray(optionsEn)) {
    optionsHTML = `<div class="options">`;
    optionsEn.forEach((opt, i) => {
      const hiOpt = optionsHi?.[i] || "";
      optionsHTML += `<div class="option"><span class="option-label">(${labels[i]})</span> ${opt}${language === "bilingual" && hiOpt ? ` / ${hiOpt}` : ""}</div>`;
    });
    optionsHTML += `</div>`;
  }

  return `<div class="question">${qText}${optionsHTML}</div>`;
}

/**
 * Render answer key section.
 */
function renderAnswerKey(answerKey, language) {
  if (!answerKey?.length) return "<p>No answer key available.</p>";

  const labels = ["A", "B", "C", "D", "E", "F"];
  const cells = answerKey.map(a => {
    const ans = labels[a.correct_index] || "?";
    return `<div class="answer-cell"><div class="aq-no">Q${a.qno}</div><div class="aq-ans">${ans}</div><div style="font-size:8pt;color:#888">${a.marks}M</div></div>`;
  }).join("\n");

  return `
    <h2>📝 ANSWER KEY</h2>
    <div class="answer-grid">
      ${cells}
    </div>
  `;
}
