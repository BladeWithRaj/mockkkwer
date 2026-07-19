// ============================================
// FLASHCARD ENGINE — Doc 8 §12, §13
// Auto-generated from incorrect answers.
// Spaced repetition: interval doubles on correct,
// resets to 1 on wrong.
// ============================================

const Flashcards = {

  // ════ GENERATE FROM TEST RESULT (Doc 8 §12) ════
  generateFromResult(result) {
    if (!result || !result.questionResults) return 0;

    const existingCards = Storage.getFlashcards();
    const existingIds   = new Set(existingCards.map(c => c.qId));
    const today         = this._today();
    const newCards      = [];

    result.questionResults.forEach(qr => {
      // Only generate for wrong answers
      if (!qr.isSkipped && !qr.isCorrect && qr.question) {
        const q = qr.question;
        if (existingIds.has(q.id)) return; // Already have a card

        const card = this._buildCard(q, today);
        newCards.push(card);
        existingIds.add(q.id);
      }
    });

    if (newCards.length > 0) {
      const all = [...existingCards, ...newCards];
      Storage.saveFlashcards(all);
    }

    return newCards.length;
  },

  // ════ BUILD CARD FROM QUESTION (Doc 8 §13) ════
  _buildCard(q, today) {
    const labels    = ['A', 'B', 'C', 'D'];
    const correctOpt = q.options?.[q.correct] || '';
    const topic     = q.topic || q.subject || 'General';

    // Front: stripped question (remove HTML tags for flash display)
    const front = q.question
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);

    // Back: structured explanation
    const back = correctOpt;

    // Extract shortcut/trick from explanation if present
    const explanation = q.explanation || '';
    const shortcut = explanation.includes('Trick:') || explanation.includes('Shortcut:')
      ? explanation.split(/Trick:|Shortcut:/i)[1]?.split('\n')[0]?.trim() || ''
      : '';
    const commonMistake = q.commonMistake || '';
    const memoryTrick   = q.memoryTrick || shortcut || '';

    return {
      id:            `fc_${q.id}_${Date.now()}`,
      qId:           q.id,
      subject:       q.subject || 'General',
      topic,
      front,
      back,
      correctLabel:  labels[q.correct] || 'A',
      explanation:   explanation.slice(0, 400),
      shortcut,
      commonMistake,
      memoryTrick,
      relatedTopic:  q.relatedTopic || '',
      confidence:    null,          // null = not reviewed yet
      nextReview:    today,         // due immediately after wrong answer
      intervalDays:  1,
      reviewCount:   0,
      correctStreak: 0,
      createdAt:     today,
      // Doc 20: Tag with root cause from MistakeDNA for priority sorting
      rootCause:     this._classifyRootCause(q)
    };
  },

  // Doc 20: Determine root cause for a wrong-answer flashcard
  _classifyRootCause(q) {
    if (typeof MistakeDNA === 'undefined') return null;
    // Infer cause from question metadata heuristics (no full result context)
    const stem = (q.question || '').toLowerCase();
    if (q.formula) return 'concept';
    if (stem.includes('not') || stem.includes('except')) return 'reading';
    if (stem.includes('%') || stem.includes('calculate')) return 'calculation';
    return 'concept'; // default: concept gap for wrong-answer flashcards
  },

  // ════ GET CARDS DUE TODAY ════
  getDue() {
    const today = this._today();
    return Storage.getFlashcards()
      .filter(c => !c.nextReview || c.nextReview <= today)
      .sort((a, b) => {
        // Doc 20: Prioritize concept-gap root causes over carelessness
        const causePriority = { concept: 0, calculation: 1, reading: 2, guess: 3, timePressure: 4, careless: 5 };
        const aPri = causePriority[a.rootCause] ?? 3;
        const bPri = causePriority[b.rootCause] ?? 3;
        if (aPri !== bPri) return aPri - bPri;

        // Then: prioritize never-reviewed, then by weakness (shortest interval)
        if (!a.nextReview && b.nextReview) return -1;
        if (a.nextReview && !b.nextReview) return 1;
        return a.intervalDays - b.intervalDays;
      });
  },

  // ════ GET ALL ════
  getAll() {
    return Storage.getFlashcards();
  },

  // ════ GET BY SUBJECT ════
  getBySubject(subject) {
    return Storage.getFlashcards().filter(c => c.subject === subject);
  },

  // ════ RECORD REVIEW (spaced repetition) ════
  recordReview(cardId, wasCorrect) {
    const all  = Storage.getFlashcards();
    const idx  = all.findIndex(c => c.id === cardId);
    if (idx === -1) return;

    const card  = all[idx];
    const today = this._today();

    card.reviewCount++;
    card.confidence = wasCorrect ? 'confident' : 'unsure';

    if (wasCorrect) {
      // Interval doubles: 1 → 2 → 4 → 8 → 16 → 30
      const intervals = [1, 2, 4, 8, 16, 30];
      const currIdx   = intervals.indexOf(card.intervalDays);
      const nextIdx   = Math.min(currIdx + 1, intervals.length - 1);
      card.intervalDays  = intervals[nextIdx];
      card.correctStreak = (card.correctStreak || 0) + 1;
    } else {
      // Reset
      card.intervalDays  = 1;
      card.correctStreak = 0;
    }

    card.nextReview = this._addDays(today, card.intervalDays);
    all[idx] = card;
    Storage.saveFlashcards(all);
    return card;
  },

  // ════ GET STATS ════
  getStats() {
    const all    = Storage.getFlashcards();
    const due    = this.getDue();
    const mastered = all.filter(c => c.intervalDays >= 16);
    const bySubject = {};
    all.forEach(c => {
      if (!bySubject[c.subject]) bySubject[c.subject] = { total: 0, due: 0, mastered: 0 };
      bySubject[c.subject].total++;
      if (!c.nextReview || c.nextReview <= this._today()) bySubject[c.subject].due++;
      if (c.intervalDays >= 16) bySubject[c.subject].mastered++;
    });
    return { total: all.length, due: due.length, mastered: mastered.length, bySubject };
  },

  // ════ HELPERS ════
  _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  _addDays(dateStr, n) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
};

window.Flashcards = Flashcards;
