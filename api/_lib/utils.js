// utils.js – server‑side score calculation
export function calculateResult(questions, answers) {
  let correct = 0;
  let wrong = 0;

  const topicStats = {};

  questions.forEach(q => {
    const userAns = answers[q.id];

    if (!topicStats[q.subject]) {
      topicStats[q.subject] = { correct: 0, wrong: 0 };
    }

    if (userAns === q.correct_answer) {
      correct++;
      topicStats[q.subject].correct++;
    } else {
      wrong++;
      topicStats[q.subject].wrong++;
    }
  });

  const scorePercent = Math.round((correct / questions.length) * 100);

  return {
    correct,
    wrong,
    skipped: questions.length - (correct + wrong),
    scorePercent,
    topicStats
  };
}
