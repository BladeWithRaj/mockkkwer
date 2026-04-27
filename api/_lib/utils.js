// utils.js – server‑side score calculation
// Questions must have: id, correct_answer, subject, option_a, option_b, option_c, option_d
// Answers format: { "question_id": optionIndex (0-3) }

export function calculateResult(questions, answers) {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  let warnings = [];

  const topicStats = {};

  const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d'];

  questions.forEach(q => {
    const userAnswerIndex = answers[q.id];

    if (!topicStats[q.subject]) {
      topicStats[q.subject] = { correct: 0, wrong: 0 };
    }

    // Edge case: question has no correct_answer
    if (!q.correct_answer || (typeof q.correct_answer === 'string' && q.correct_answer.trim() === '')) {
      warnings.push({ questionId: q.id, issue: 'no_correct_answer' });
      skipped++; // Count as skipped — can't score a question with no answer
      return;
    }

    // Check if skipped (no answer provided for this question)
    if (userAnswerIndex === undefined || userAnswerIndex === null) {
      skipped++;
      return;
    }

    // Map option index to actual option text
    const optionKey = optionKeys[userAnswerIndex];
    if (!optionKey) {
      // Invalid option index (not 0-3)
      wrong++;
      topicStats[q.subject].wrong++;
      warnings.push({ questionId: q.id, issue: 'invalid_option_index', value: userAnswerIndex });
      return;
    }

    const userAnswerText = q[optionKey];

    // Edge case: option column is null/empty
    if (!userAnswerText || (typeof userAnswerText === 'string' && userAnswerText.trim() === '')) {
      wrong++;
      topicStats[q.subject].wrong++;
      warnings.push({ questionId: q.id, issue: 'empty_option_column', column: optionKey });
      return;
    }

    if (userAnswerText === q.correct_answer) {
      correct++;
      topicStats[q.subject].correct++;
    } else {
      wrong++;
      topicStats[q.subject].wrong++;
    }
  });

  const total = questions.length;
  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;

  const result = {
    correct,
    wrong,
    skipped,
    scorePercent,
    topicStats
  };

  // Include warnings if any data integrity issues found
  if (warnings.length > 0) {
    result.warnings = warnings;
    console.warn('[SCORING] Data integrity warnings:', warnings);
  }

  return result;
}
