// ═══════════════════════════════════════════════════════════════
// QUALIFYING GENERATOR — generation_mode: pass_assist
// For: Environmental Sciences / Environmental Science
//
// Qualifying subjects have weak pattern consistency.
// Strategy: MCQ bank + important short answers + repeated PYQs
// Goal: student secures passing marks (17+) with minimal effort
// ═══════════════════════════════════════════════════════════════

import { routeToProvider } from '../providers/providerRouter.js';

const QUALIFYING_SECTIONS = [
  {
    key: 'mcq_bank',
    label: 'MCQ Bank — Most Repeated Questions',
    stageText: 'Generating MCQ bank...',
    count: 20,
    maxTokens: 2500,
    schema: '{ "questions": [{ "en": "question", "hi": "", "options": ["a","b","c","d"], "answer": "correct option", "unit": 1, "repeat_probability": 0.8 }] }'
  },
  {
    key: 'short_answers',
    label: 'Important Short Answers (2 marks)',
    stageText: 'Generating important short answers...',
    count: 15,
    maxTokens: 2000,
    schema: '{ "questions": [{ "en": "question", "hi": "", "answer_hint": "key points", "unit": 1, "importance": "high|medium" }] }'
  },
  {
    key: 'definitions',
    label: 'Key Definitions & 1-Mark Facts',
    stageText: 'Generating definitions and 1-mark facts...',
    count: 15,
    maxTokens: 1800,
    schema: '{ "items": [{ "term": "term or concept", "definition": "concise definition (1-2 lines)", "unit": 1 }] }'
  },
  {
    key: 'long_important',
    label: 'Important Long Answers (Pass-Focused)',
    stageText: 'Generating important long answers...',
    count: 5,
    maxTokens: 2000,
    schema: '{ "questions": [{ "en": "question", "hi": "", "answer_outline": ["point 1","point 2","point 3","point 4"], "marks": 6, "unit": 1 }] }'
  }
];

function buildQualifyingPrompt(section, syllabus, language, subjectName) {
  const isHindi = language === 'hindi';
  const langRule = isHindi
    ? 'Write ALL questions in Hindi (Devanagari). Environmental terms may stay in English.'
    : 'Write in English. Use simple, direct language appropriate for polytechnic diploma level.';

  return `You are a BTEUP ${subjectName} paper setter specializing in pass-focused exam preparation.

TASK: Generate ${section.label} — ${section.count} items.

CONTEXT: This is a QUALIFYING subject. Students primarily need to pass, not score high.
Focus on most frequently repeated, high-yield, easy-to-answer topics.

SYLLABUS:
${syllabus}

OUTPUT (ONLY this JSON — no markdown):
${section.schema}

RULES:
1. ONLY valid JSON. No text outside JSON.
2. ${langRule}
3. PASS-FOCUSED: Questions must be straightforward. No trick questions.
4. HIGH REPEAT RATE: Select topics that appear in 3+ of last 6 years.
5. Cover all 5 units but weight toward most-tested topics.
6. Qualifying level — simple definitions, basic concepts, awareness.
7. Avoid advanced analysis, complex equations, deep environmental science.
8. ${isHindi ? 'Hindi academic style: simple, clear, standard terms.' : 'English: simple, clear, diploma-level phrasing.'}
9. For MCQs: all 4 options must be plausible. Correct answer must be unambiguously correct.
10. For short answers: answer_hint should cover the main 2-3 points needed for full marks.

GENERATE NOW:`;
}

// ── Main Exported Handler ──

export async function generateQualifyingPaper(supabase, subject, units, language, mode, sendSSE, res) {
  const syllabusText = units.map(u =>
    `Unit ${u.unit_no} — ${u.unit_name}: ${u.topics}`
  ).join('\n');

  const paperData = {};
  const failedSections = [];
  let completed = 0;

  for (const section of QUALIFYING_SECTIONS) {
    const progressPct = Math.round(10 + (completed / QUALIFYING_SECTIONS.length) * 80);

    sendSSE(res, 'progress', {
      stage: section.key,
      message: section.stageText,
      progress: progressPct,
      section: section.label
    });

    const prompt = buildQualifyingPrompt(section, syllabusText, language, subject.name);

    try {
      const result = await routeToProvider(prompt, {
        subjectNamespace: subject.prompt_namespace,
        sectionKey: section.key,
        maxTokens: section.maxTokens,
        temperature: 0.4   // lower = more predictable, pass-focused
      });

      let parsed;
      const raw = result.content?.trim() || '';
      const jsonStart = raw.indexOf('{');
      const jsonEnd   = raw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        try { parsed = JSON.parse(raw.substring(jsonStart, jsonEnd + 1)); } catch(e) {}
      }

      if (parsed) {
        paperData[section.key] = parsed;
        completed++;
      } else {
        failedSections.push({ key: section.key, label: section.label, error: 'JSON parse failed' });
      }
    } catch (err) {
      console.error(`[QUALIFYING] ${section.key} failed:`, err.message.substring(0, 100));
      failedSections.push({ key: section.key, label: section.label, error: err.message });
    }
  }

  return {
    paperData,
    failedSections,
    sections_meta: QUALIFYING_SECTIONS.map(s => ({
      key: s.key, label: s.label, count: s.count
    }))
  };
}
