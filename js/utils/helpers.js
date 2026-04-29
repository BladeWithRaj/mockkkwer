// ============================================
// MOCK TEST PLATFORM — Helper Utilities
// ============================================

const Helpers = {
  /**
   * Fisher-Yates shuffle
   */
  shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  /**
   * Generate unique ID
   */
  generateId() {
    return 'q_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  },

  /**
   * Format seconds to MM:SS
   */
  formatTime(seconds) {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  },

  /**
   * Format seconds to human readable
   */
  formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return s > 0 ? `${m}m ${s}s` : `${m}m`;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  },

  /**
   * Parse CSV text to question objects
   */
  parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { questions: [], errors: ['CSV must have a header row and at least one data row.'] };

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const requiredHeaders = ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct', 'subject'];
    const missing = requiredHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      return { questions: [], errors: [`Missing required columns: ${missing.join(', ')}`] };
    }

    const questions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles basic comma-separated, no quoted commas)
      const values = this._parseCSVLine(line);
      if (values.length < headers.length) {
        errors.push(`Row ${i + 1}: Insufficient columns (got ${values.length}, expected ${headers.length})`);
        continue;
      }

      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').trim().replace(/^"|"$/g, '');
      });

      // Validate required fields
      if (!row.question || !row.option_a || !row.option_b || !row.option_c || !row.option_d || !row.correct || !row.subject) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      // Map correct answer
      const correctMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, '0': 0, '1': 1, '2': 2, '3': 3 };
      const correctIdx = correctMap[row.correct.toLowerCase()];
      if (correctIdx === undefined) {
        errors.push(`Row ${i + 1}: Invalid 'correct' value. Use A, B, C, or D.`);
        continue;
      }

      const question = {
        id: this.generateId(),
        question: row.question,
        options: [row.option_a, row.option_b, row.option_c, row.option_d],
        correct: correctIdx,
        explanation: row.explanation || '',
        subject: row.subject,
        topic: row.topic || 'General',
        difficulty: (row.difficulty || 'medium').toLowerCase(),
        exam: row.exam ? row.exam.split(';').map(e => e.trim()) : [],
        pyq: (row.pyq || '').toLowerCase() === 'true' || row.pyq === '1',
        year: row.year ? parseInt(row.year) : null
      };

      questions.push(question);
    }

    return { questions, errors };
  },

  /**
   * Parse a single CSV line handling quoted fields
   */
  _parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  },

  /**
   * Generate CSV template
   */
  getCSVTemplate() {
    return 'question,option_a,option_b,option_c,option_d,correct,subject,difficulty\n' +
      '"What is 2+2?","3","4","5","6","B","math","easy"\n';
  },

  /**
   * Export questions to JSON
   */
  exportQuestionsJSON(questions) {
    const blob = new Blob([JSON.stringify(questions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_export.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Download text as file
   */
  downloadFile(content, filename, type = 'text/csv') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Debounce function
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /**
   * Animate number counting up
   */
  animateCounter(element, target, duration = 1000) {
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
      const current = Math.round(start + (target - start) * eased);
      element.textContent = current;
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  },

  /**
   * Get color for subject
   */
  getSubjectColor(subject) {
    const s = (subject || '').toLowerCase();
    const colors = {
      'math': '#3B82F6',
      'gk': '#10B981',
      'reasoning': '#8B5CF6',
      'english': '#F59E0B',
      'hindi': '#EF4444',
      'science': '#06B6D4',
      'polity': '#EC4899',
      'geography': '#14B8A6',
      'history': '#F97316'
    };
    return colors[s] || '#6B7280';
  },

  /**
   * Get subject icon
   */
  getSubjectIcon(subject) {
    const s = (subject || '').toLowerCase();
    const icons = {
      'math': '🔢',
      'gk': '🌍',
      'reasoning': '🧩',
      'english': '📝',
      'hindi': '📖',
      'science': '🔬',
      'polity': '⚖️',
      'geography': '🗺️',
      'history': '📜'
    };
    return icons[s] || '📋';
  },

  /**
   * Get difficulty chip class
   */
  getDifficultyClass(difficulty) {
    const map = {
      'easy': 'chip-success',
      'medium': 'chip-warning',
      'hard': 'chip-danger'
    };
    return map[difficulty] || 'chip';
  },

  /**
   * Show toast notification
   */
  showToast(message, type = 'info', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const iconMap = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `
      <span>${iconMap[type] || 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeIn 200ms ease reverse';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }
};
