// ═══════════════════════════════════════════════
// EXAM CONFIG VALIDATOR — Server-side validation
// Prevents bad configs from corrupting platform
// ═══════════════════════════════════════════════

const ALLOWED_RENDERERS = ['ssc', 'railway', 'banking', 'upsc'];
const ALLOWED_BOARDS = ['SSC', 'Railway', 'Banking', 'UPSC', 'Teaching', 'Defence', 'State', 'Quick', 'Daily'];
const ALLOWED_PALETTES = ['default', 'ibps', 'paper'];
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;  // kebab-case only
const ALLOWED_SUBJECTS = ['math', 'reasoning', 'english', 'hindi', 'gk', 'science', 'history', 'geography', 'polity', 'all'];

/**
 * Validate an exam config payload before DB insert/update.
 * Returns: { valid: true } or { valid: false, errors: string[] }
 */
export function validateExamConfig(config, isUpdate = false) {
  const errors = [];

  // ── Slug ──
  if (!isUpdate) {
    if (!config.slug || typeof config.slug !== 'string') {
      errors.push('slug is required');
    } else if (!SLUG_REGEX.test(config.slug)) {
      errors.push(`slug must be kebab-case (a-z, 0-9, hyphens only). Got: "${config.slug}"`);
    } else if (config.slug.length < 2 || config.slug.length > 50) {
      errors.push('slug must be 2-50 characters');
    }
  }

  // ── Exam Name ──
  if (!isUpdate || config.exam_name !== undefined) {
    if (!config.exam_name || typeof config.exam_name !== 'string' || config.exam_name.trim().length < 2) {
      errors.push('exam_name is required (min 2 chars)');
    }
  }

  // ── Renderer Type ──
  if (config.renderer_type !== undefined) {
    if (!ALLOWED_RENDERERS.includes(config.renderer_type)) {
      errors.push(`renderer_type must be one of: ${ALLOWED_RENDERERS.join(', ')}. Got: "${config.renderer_type}"`);
    }
  }

  // ── Board ──
  if (config.board !== undefined) {
    if (!ALLOWED_BOARDS.includes(config.board)) {
      errors.push(`board must be one of: ${ALLOWED_BOARDS.join(', ')}. Got: "${config.board}"`);
    }
  }

  // ── Palette Type ──
  if (config.palette_type !== undefined) {
    if (!ALLOWED_PALETTES.includes(config.palette_type)) {
      errors.push(`palette_type must be one of: ${ALLOWED_PALETTES.join(', ')}. Got: "${config.palette_type}"`);
    }
  }

  // ── Duration ──
  if (config.duration_minutes !== undefined) {
    const dur = Number(config.duration_minutes);
    if (isNaN(dur) || dur <= 0 || dur > 600) {
      errors.push('duration_minutes must be between 1 and 600');
    }
  }

  // ── Total Questions ──
  if (config.total_questions !== undefined) {
    const tq = Number(config.total_questions);
    if (isNaN(tq) || tq <= 0 || tq > 1000) {
      errors.push('total_questions must be between 1 and 1000');
    }
  }

  // ── Marks Per Question ──
  if (config.marks_per_question !== undefined) {
    const mpq = Number(config.marks_per_question);
    if (isNaN(mpq) || mpq <= 0 || mpq > 10) {
      errors.push('marks_per_question must be between 0.25 and 10');
    }
  }

  // ── Negative Marking ──
  if (config.negative_marking !== undefined) {
    const neg = Number(config.negative_marking);
    if (isNaN(neg) || neg < 0 || neg > 5) {
      errors.push('negative_marking must be between 0 and 5');
    }
  }

  // ── Sections ──
  if (config.sections !== undefined) {
    if (!Array.isArray(config.sections)) {
      errors.push('sections must be an array');
    } else if (config.sections.length === 0 && !isUpdate) {
      errors.push('at least 1 section is required');
    } else {
      let sectionQuestionTotal = 0;

      config.sections.forEach((sec, idx) => {
        const prefix = `sections[${idx}]`;

        // Name required
        if (!sec.name || typeof sec.name !== 'string' || sec.name.trim().length < 1) {
          errors.push(`${prefix}.name is required`);
        }

        // Subject required
        if (!sec.subject || typeof sec.subject !== 'string') {
          errors.push(`${prefix}.subject is required`);
        } else if (!ALLOWED_SUBJECTS.includes(sec.subject.toLowerCase())) {
          errors.push(`${prefix}.subject must be one of: ${ALLOWED_SUBJECTS.join(', ')}. Got: "${sec.subject}"`);
        }

        // Questions count
        const sq = Number(sec.questions);
        if (isNaN(sq) || sq <= 0 || sq > 500) {
          errors.push(`${prefix}.questions must be between 1 and 500`);
        } else {
          sectionQuestionTotal += sq;
        }

        // Section time (optional — only for banking-style exams)
        if (sec.sectionTime !== undefined && sec.sectionTime !== null) {
          const st = Number(sec.sectionTime);
          if (isNaN(st) || st <= 0) {
            errors.push(`${prefix}.sectionTime must be > 0 seconds`);
          }
        }
      });

      // Cross-validation: section question totals must match total_questions
      const tq = Number(config.total_questions);
      if (!isNaN(tq) && tq > 0 && sectionQuestionTotal > 0 && sectionQuestionTotal !== tq) {
        errors.push(`Section question total (${sectionQuestionTotal}) does not match total_questions (${tq})`);
      }
    }
  }

  // ── Sort Order ──
  if (config.sort_order !== undefined) {
    const so = Number(config.sort_order);
    if (isNaN(so) || so < 0 || so > 9999) {
      errors.push('sort_order must be between 0 and 9999');
    }
  }

  // ── Icon (basic sanity) ──
  if (config.icon !== undefined) {
    if (typeof config.icon !== 'string' || config.icon.length > 10) {
      errors.push('icon must be a short string (emoji, max 10 chars)');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
