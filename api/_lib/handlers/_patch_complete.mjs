// Script to patch the complete SSE section of the handler
import { readFileSync, writeFileSync } from 'fs';

const filePath = 'c:/MockTestPro/api/handlers/geminiPaperHandler.js';
const content = readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const replacement = `\r
    // ── Paper-level validation ──\r
    const paperValidation = validatePaper(paperData, failedSections);\r
    const budgetSummary   = budget.getSummary();\r
\r
    // ── Send final paper data ──\r
    sendSSE(res, 'complete', {\r
      success: true,\r
      paper_id: paperId,\r
      subject: {\r
        name: subject.name,\r
        code: subject.code,\r
        semester: subject.semester,\r
        marks_total: subject.marks_total,\r
        renderer_type: subject.renderer_type,\r
        paper_style: subject.paper_style\r
      },\r
      branch: branch || 'Common',\r
      language: lang,\r
      mode: genMode,\r
      mode_label: MODE_MODIFIERS[genMode]?.label || genMode,\r
      sections: paperData,\r
      failed_sections: failedSections,\r
      paper_quality: {\r
        valid:        paperValidation.valid,\r
        warnings:     paperValidation.warnings,\r
        success_rate: paperValidation.successRate\r
      },\r
      generation_stats: {\r
        total_tokens:    budgetSummary.total_tokens,\r
        total_cost_usd:  budgetSummary.total_cost_usd,\r
        elapsed_ms:      budgetSummary.elapsed_ms,\r
        providers_used:  Object.keys(budgetSummary.provider_breakdown)\r
      },\r
      generated_at: new Date().toISOString()\r
    });\r
\r
    res.end();\r
\r
    // ── Async token usage log (non-blocking) ──\r
    logTokenUsage(supabase, budgetSummary, subject.id, paperId).catch(() => {});\r
`;

// Replace lines 687-709 (0-indexed: 686-708)
const newLines = lines.slice(0, 686).join('\n')
  + '\n' + replacement + '\n'
  + lines.slice(709).join('\n');

writeFileSync(filePath, newLines, 'utf8');
console.log('Patch applied. Lines now:', newLines.split('\n').length);
