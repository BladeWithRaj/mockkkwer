// ═══════════════════════════════════════════════════════════════
// PRACTICAL GENERATOR — generation_mode: viva_and_practical
// For: Engineering Graphics, Engineering Workshop Practice
//
// Does NOT generate fake theory papers.
// Produces: viva questions, practical file help, lab guidance,
//           drawing topics, experiment questions, safety MCQs
// ═══════════════════════════════════════════════════════════════

import { routeToProvider } from '../providers/providerRouter.js';

// ── Practical Output Sections ──
const PRACTICAL_SECTIONS = {
  workshop1:   ['viva_oral', 'safety_mcq', 'tool_identification', 'process_steps', 'practical_file'],
  workshop:    ['viva_oral', 'safety_mcq', 'tool_identification', 'process_steps', 'practical_file'],
  graphics1:   ['viva_theory', 'drawing_guidance', 'projection_steps', 'dimensioning_rules', 'practical_file'],
  engg_graphics:['viva_theory', 'drawing_guidance', 'projection_steps', 'dimensioning_rules', 'practical_file'],
};

const SECTION_CONFIGS = {
  viva_oral: {
    label: 'Viva Voce — Oral Questions',
    stageText: 'Generating viva questions...',
    count: 15,
    maxTokens: 2000,
    schema: '{ "questions": [{ "q": "question", "hint": "key point for answer", "unit": 1 }] }'
  },
  safety_mcq: {
    label: 'Safety & Rules — MCQ Bank',
    stageText: 'Generating safety MCQs...',
    count: 10,
    maxTokens: 1500,
    schema: '{ "questions": [{ "q": "question", "options": ["a","b","c","d"], "answer": "correct", "unit": 1 }] }'
  },
  tool_identification: {
    label: 'Tool Identification — Short Q&A',
    stageText: 'Generating tool identification questions...',
    count: 10,
    maxTokens: 1500,
    schema: '{ "questions": [{ "q": "question about tool/instrument", "answer": "tool name and use", "unit": 1 }] }'
  },
  process_steps: {
    label: 'Process Steps — Step-by-Step Procedures',
    stageText: 'Generating process procedure questions...',
    count: 5,
    maxTokens: 2000,
    schema: '{ "questions": [{ "process": "name of process", "steps": ["step 1","step 2","step 3"], "unit": 1 }] }'
  },
  practical_file: {
    label: 'Practical File — Experiment Write-up',
    stageText: 'Generating practical file questions...',
    count: 5,
    maxTokens: 2000,
    schema: '{ "experiments": [{ "title": "Experiment name", "aim": "...", "apparatus": ["..."], "procedure_hint": "key steps", "observation_format": "table or description", "result_format": "expected format" }] }'
  },
  viva_theory: {
    label: 'Viva — Theoretical Drawing Questions',
    stageText: 'Generating drawing viva questions...',
    count: 15,
    maxTokens: 2000,
    schema: '{ "questions": [{ "q": "question", "hint": "answer guidance", "unit": 1 }] }'
  },
  drawing_guidance: {
    label: 'Drawing Problems — Practice List',
    stageText: 'Generating drawing practice problems...',
    count: 8,
    maxTokens: 2000,
    schema: '{ "problems": [{ "title": "problem title", "description": "what to draw/project", "type": "orthographic|isometric|section|scale", "difficulty": "easy|medium|hard", "unit": 1 }] }'
  },
  projection_steps: {
    label: 'Projection Steps — Procedure Guide',
    stageText: 'Generating projection procedure guide...',
    count: 5,
    maxTokens: 2000,
    schema: '{ "procedures": [{ "topic": "projection type", "steps": ["step 1","step 2"], "common_mistakes": ["mistake 1"], "unit": 1 }] }'
  },
  dimensioning_rules: {
    label: 'Dimensioning & BIS Rules — Q&A',
    stageText: 'Generating dimensioning rules...',
    count: 10,
    maxTokens: 1500,
    schema: '{ "questions": [{ "q": "question about BIS/dimensioning rule", "answer": "rule explanation", "unit": 1 }] }'
  }
};

// ── Prompt Builders per Section ──

function buildWorkshopVivaPrompt(sectionKey, cfg, syllabus, units, language, mode) {
  const isHindi = language === 'hindi';
  const langRule = isHindi
    ? 'Write ALL questions and answers in Hindi (Devanagari). Technical tool names may stay in English.'
    : 'Write in English. Use clear, practical workshop/trades terminology. Short direct questions.';

  const sectionCfg = SECTION_CONFIGS[sectionKey];

  return `You are a senior BTEUP Workshop Practice examiner with 20 years experience.

TASK: Generate ${sectionCfg.label} for Engineering Workshop Practice exam preparation.

SYLLABUS COVERAGE:
${syllabus}

GENERATION MODE: ${mode.toUpperCase()}
${mode === 'pass_assist' ? '— Focus on most commonly asked viva questions. Easy to answer.' : ''}
${mode === 'advanced_prediction' ? '— Include tricky viva questions that trip students up.' : ''}

OUTPUT (return ONLY this JSON — no markdown, no explanation):
Generate EXACTLY ${sectionCfg.count} items.
${sectionCfg.schema}

RULES:
1. ONLY valid JSON. No text outside.
2. ${langRule}
3. Workshop/trades level — NOT engineering degree level.
4. Questions must be practical, real-world workshop oriented.
5. Cover all workshop operations: carpentry, fitting, welding, smithy, safety.
6. No theoretical derivations or mathematical proofs.
7. Focus: tool names, safety rules, process steps, workshop terminology.

GENERATE NOW:`;
}

function buildGraphicsVivaPrompt(sectionKey, cfg, syllabus, units, language, mode) {
  const isHindi = language === 'hindi';
  const langRule = isHindi
    ? 'Write ALL questions in Hindi (Devanagari). Drawing terms like "orthographic", "isometric" may stay in English.'
    : 'Write in English. Use standard engineering drawing terminology.';

  const sectionCfg = SECTION_CONFIGS[sectionKey];

  return `You are a senior BTEUP Engineering Graphics examiner.

TASK: Generate ${sectionCfg.label} for Engineering Graphics exam preparation.

SYLLABUS:
${syllabus}

GENERATION MODE: ${mode.toUpperCase()}

OUTPUT (return ONLY this JSON):
Generate EXACTLY ${sectionCfg.count} items.
${sectionCfg.schema}

RULES:
1. ONLY valid JSON. No explanation.
2. ${langRule}
3. Diploma-level Engineering Drawing — NOT CAD/computer graphics.
4. Drawing problems must describe what to draw — not actual drawings (text description only).
5. Reference BIS standards, first-angle projection conventions.
6. Cover: projection of points, lines, planes, solids, sections, isometric views.
7. Viva questions should test conceptual understanding, not computation.

GENERATE NOW:`;
}

// ── Main Exported Handler ──

export async function generatePracticalPaper(supabase, subject, units, language, mode, sendSSE, res) {
  const namespace = subject.prompt_namespace;
  const sections  = PRACTICAL_SECTIONS[namespace] || ['viva_oral', 'safety_mcq', 'practical_file'];

  const syllabusText = units.map(u =>
    `Unit ${u.unit_no} — ${u.unit_name}: ${u.topics}`
  ).join('\n');

  const isWorkshop = namespace.startsWith('workshop');
  const isGraphics  = namespace.startsWith('graphics') || namespace.startsWith('engg_graphics');

  const paperData = {};
  const failedSections = [];
  let completed = 0;

  for (const sectionKey of sections) {
    const sectionCfg = SECTION_CONFIGS[sectionKey];
    if (!sectionCfg) continue;

    const progressPct = Math.round(10 + (completed / sections.length) * 80);
    sendSSE(res, 'progress', {
      stage: sectionKey,
      message: sectionCfg.stageText,
      progress: progressPct,
      section: sectionCfg.label
    });

    const prompt = isWorkshop
      ? buildWorkshopVivaPrompt(sectionKey, sectionCfg, syllabusText, units, language, mode)
      : buildGraphicsVivaPrompt(sectionKey, sectionCfg, syllabusText, units, language, mode);

    try {
      const result = await routeToProvider(prompt, {
        subjectNamespace: namespace,
        sectionKey,
        maxTokens: sectionCfg.maxTokens,
        temperature: 0.5
      });

      let parsed;
      const raw = result.content?.trim() || '';
      const jsonStart = raw.indexOf('{');
      const jsonEnd   = raw.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        try { parsed = JSON.parse(raw.substring(jsonStart, jsonEnd + 1)); } catch(e) {}
      }

      if (parsed) {
        paperData[sectionKey] = parsed;
        completed++;
      } else {
        failedSections.push({ key: sectionKey, label: sectionCfg.label, error: 'JSON parse failed' });
      }
    } catch (err) {
      console.error(`[PRACTICAL] ${sectionKey} failed:`, err.message.substring(0, 100));
      failedSections.push({ key: sectionKey, label: sectionCfg.label, error: err.message });
    }
  }

  return {
    paperData,
    failedSections,
    sections_meta: sections.map(k => ({
      key: k,
      label: SECTION_CONFIGS[k]?.label || k,
      count: SECTION_CONFIGS[k]?.count || 0
    }))
  };
}
