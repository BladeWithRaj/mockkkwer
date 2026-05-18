// ═══════════════════════════════════════════════
// POLYTECHNIC PAPER GENERATOR ENGINE
// Weighted, balanced, anti-repetition paper generation
// ═══════════════════════════════════════════════

/**
 * Generate a balanced exam paper from the question bank.
 * 
 * Pipeline:
 * 1. Load syllabus graph (units + weightages)
 * 2. Load paper pattern (sections + marks)
 * 3. Filter approved questions
 * 4. Apply difficulty + unit balancing
 * 5. Anti-repetition via usage tracking
 * 6. Return structured paper object
 */
export async function generatePaper(supabase, { subjectId, patternId, excludeRecentDays = 30 }) {
  // ── Step 1: Load syllabus with weightages ──
  const { data: syllabus, error: sylErr } = await supabase
    .from("polytechnic_syllabus")
    .select("unit_no, unit_name, topic_name, weightage")
    .eq("subject_id", subjectId)
    .eq("is_active", true)
    .order("unit_no");

  if (sylErr || !syllabus?.length) {
    throw new Error("Syllabus not found for subject " + subjectId);
  }

  // ── Step 2: Load paper pattern ──
  let patternQuery = supabase
    .from("polytechnic_paper_patterns")
    .select("*")
    .eq("subject_id", subjectId);

  if (patternId) {
    patternQuery = patternQuery.eq("id", patternId);
  } else {
    patternQuery = patternQuery.eq("is_default", true);
  }

  const { data: patterns } = await patternQuery.limit(1).single();
  if (!patterns?.pattern_json) {
    throw new Error("Paper pattern not found");
  }

  const pattern = patterns.pattern_json;

  // ── Step 3: Load approved questions ──
  const { data: allQuestions, error: qErr } = await supabase
    .from("polytechnic_questions")
    .select("*")
    .eq("subject_id", subjectId)
    .eq("moderation_status", "approved")
    .order("unit_no");

  if (qErr) throw new Error("Failed to load questions: " + qErr.message);
  if (!allQuestions?.length) {
    throw new Error("No approved questions found for this subject. Add and approve questions first.");
  }

  // ── Step 4: Load recent usage for anti-repetition ──
  const cutoffDate = new Date(Date.now() - excludeRecentDays * 86400000).toISOString();
  const { data: recentUsage } = await supabase
    .from("polytechnic_question_usage")
    .select("question_id")
    .gte("used_at", cutoffDate);

  const recentIds = new Set((recentUsage || []).map(u => u.question_id));

  // ── Step 5: Build unit weightage map ──
  const totalWeightage = syllabus.reduce((sum, u) => sum + (u.weightage || 0), 0);
  const unitWeights = {};
  syllabus.forEach(u => {
    unitWeights[u.unit_no] = (u.weightage || 0) / (totalWeightage || 1);
  });

  // ── Step 6: Group questions by unit + difficulty ──
  const questionsByUnit = {};
  allQuestions.forEach(q => {
    const key = q.unit_no || 0;
    if (!questionsByUnit[key]) questionsByUnit[key] = [];
    questionsByUnit[key].push(q);
  });

  // ── Step 7: Generate each section ──
  const sections = [];
  const usedQuestionIds = new Set();
  let totalMarks = 0;
  let totalQuestions = 0;

  for (const section of pattern.sections) {
    const sectionQuestions = selectQuestionsForSection(
      section,
      questionsByUnit,
      unitWeights,
      syllabus,
      recentIds,
      usedQuestionIds
    );

    sections.push({
      name: section.name,
      marks_each: section.marks_each,
      difficulty: section.difficulty,
      question_type: section.question_type || "mcq",
      questions: sectionQuestions
    });

    totalMarks += sectionQuestions.length * section.marks_each;
    totalQuestions += sectionQuestions.length;
    sectionQuestions.forEach(q => usedQuestionIds.add(q.id));
  }

  // ── Step 8: Build answer key ──
  const answerKey = [];
  let qNum = 1;
  for (const section of sections) {
    for (const q of section.questions) {
      answerKey.push({
        qno: qNum++,
        section: section.name,
        correct_index: q.correct_index ?? 0,
        answer_en: q.answer_en || "",
        answer_hi: q.answer_hi || "",
        marks: section.marks_each
      });
    }
  }

  return {
    subject_id: subjectId,
    pattern_name: patterns.pattern_name,
    total_marks: totalMarks,
    total_questions: totalQuestions,
    time_minutes: patterns.time_minutes || 180,
    sections,
    answer_key: answerKey,
    generation_config: {
      pattern_id: patterns.id,
      exclude_recent_days: excludeRecentDays,
      generated_at: new Date().toISOString(),
      questions_available: allQuestions.length,
      questions_used: usedQuestionIds.size,
      recent_excluded: recentIds.size
    }
  };
}

/**
 * Select questions for a single section with unit-weighted balancing.
 */
function selectQuestionsForSection(section, questionsByUnit, unitWeights, syllabus, recentIds, usedIds) {
  const needed = section.questions || section.question_count || 10;
  const difficulty = section.difficulty;
  const selected = [];

  // Calculate per-unit allocation based on weightage
  const unitAllocations = [];
  let totalAllocated = 0;

  for (const unit of syllabus) {
    const weight = unitWeights[unit.unit_no] || 0;
    const count = Math.max(1, Math.round(needed * weight));
    unitAllocations.push({ unit_no: unit.unit_no, count });
    totalAllocated += count;
  }

  // Adjust to match needed count exactly
  while (totalAllocated > needed && unitAllocations.length > 0) {
    const largest = unitAllocations.reduce((a, b) => a.count > b.count ? a : b);
    largest.count--;
    totalAllocated--;
  }
  while (totalAllocated < needed) {
    const smallest = unitAllocations.reduce((a, b) => a.count < b.count ? a : b);
    smallest.count++;
    totalAllocated++;
  }

  // Select from each unit
  for (const alloc of unitAllocations) {
    const pool = (questionsByUnit[alloc.unit_no] || []).filter(q => {
      if (usedIds.has(q.id)) return false;
      if (difficulty && q.difficulty && q.difficulty !== difficulty) return false;
      return true;
    });

    // Prefer non-recent questions
    const fresh = pool.filter(q => !recentIds.has(q.id));
    const source = fresh.length >= alloc.count ? fresh : pool;

    // Shuffle and pick
    const shuffled = shuffleArray([...source]);
    selected.push(...shuffled.slice(0, alloc.count));
  }

  // If we still need more (unit pools exhausted), fill from any remaining
  if (selected.length < needed) {
    const allPool = Object.values(questionsByUnit)
      .flat()
      .filter(q => !usedIds.has(q.id) && !selected.find(s => s.id === q.id));
    const shuffled = shuffleArray([...allPool]);
    const remaining = needed - selected.length;
    selected.push(...shuffled.slice(0, remaining));
  }

  return shuffleArray(selected).slice(0, needed);
}

/**
 * Fisher-Yates shuffle
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Save a generated paper to the database.
 */
export async function savePaper(supabase, paper, title, generatedBy) {
  const { data: savedPaper, error: paperErr } = await supabase
    .from("generated_papers")
    .insert({
      subject_id: paper.subject_id,
      title: title || `Paper - ${new Date().toLocaleDateString("en-IN")}`,
      generated_by: generatedBy || null,
      difficulty_profile: paper.generation_config,
      paper_structure: { sections: paper.sections.map(s => ({ name: s.name, count: s.questions.length, marks_each: s.marks_each })) },
      answer_key: paper.answer_key,
      generation_config: paper.generation_config,
      paper_type: "generated",
      is_public: false
    })
    .select("id")
    .single();

  if (paperErr) throw new Error("Failed to save paper: " + paperErr.message);

  // Save question usage for anti-repetition tracking
  let qOrder = 1;
  const usageRows = [];
  const linkRows = [];

  for (const section of paper.sections) {
    for (const q of section.questions) {
      usageRows.push({ question_id: q.id, paper_id: savedPaper.id });
      linkRows.push({
        paper_id: savedPaper.id,
        question_id: q.id,
        section_name: section.name,
        question_order: qOrder++
      });
    }
  }

  // Batch insert
  if (usageRows.length) {
    await supabase.from("polytechnic_question_usage").insert(usageRows);
  }
  if (linkRows.length) {
    await supabase.from("generated_paper_questions").insert(linkRows);
  }

  return savedPaper.id;
}
