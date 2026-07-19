// ============================================
// AI COACH PAGE — Doc 8 §24
// 6-Tab Command Center:
// Coach | Calendar | Flashcards | Insights | Plan | History
// ============================================

const AICoachPage = {
  _activeTab: 'coach',
  _flashcardIdx: 0,
  _flashcardFlipped: false,
  _planMinutes: 45,

  render(params = {}) {
    if (params.tab) this._activeTab = params.tab;

    const tabs = [
      { id: 'coach',      label: 'Coach',      icon: '◉' },
      { id: 'calendar',   label: 'Calendar',   icon: '📅' },
      { id: 'flashcards', label: 'Flashcards', icon: '🃏' },
      { id: 'insights',   label: 'Insights',   icon: '▲' },
      { id: 'plan',       label: 'Plan',       icon: '📋' },
      { id: 'history',    label: 'History',    icon: '◈' }
    ];

    const tabBar = `
      <div style="position:sticky;top:56px;background:var(--bg-surface);border-bottom:1px solid var(--border-color);z-index:var(--z-sticky);overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <div style="display:flex;min-width:max-content;padding:0 16px;">
          ${tabs.map(t => `
            <button onclick="AICoachPage.setTab('${t.id}')"
              style="padding:12px 16px;border:none;background:none;font-size:13px;font-weight:${this._activeTab===t.id?'700':'500'};
              color:${this._activeTab===t.id?'var(--primary)':'var(--text-muted)'};
              border-bottom:2px solid ${this._activeTab===t.id?'var(--primary)':'transparent'};
              cursor:pointer;white-space:nowrap;font-family:var(--font-display);transition:all 120ms;">
              ${t.icon} ${t.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    let content = '';
    switch(this._activeTab) {
      case 'coach':      content = this._renderCoachTab();      break;
      case 'calendar':   content = this._renderCalendarTab();   break;
      case 'flashcards': content = this._renderFlashcardsTab(); break;
      case 'insights':   content = this._renderInsightsTab();   break;
      case 'plan':       content = this._renderPlanTab();       break;
      case 'history':    content = this._renderHistoryTab();    break;
      default:           content = this._renderCoachTab();
    }

    return `
      <div class="page-enter" style="min-height:100vh;background:var(--bg-primary);">
        ${tabBar}
        <div style="max-width:680px;margin:0 auto;padding:20px 16px 80px;">
          ${content}
        </div>
      </div>
    `;
  },

  setTab(id) {
    this._activeTab = id;
    if (id === 'flashcards') { this._flashcardIdx = 0; this._flashcardFlipped = false; }
    App.renderPage('coach');
  },


  // ════════════════════════════════════════════
  // COACH TAB (Doc 8 §4, §5)
  // ════════════════════════════════════════════
  _renderCoachTab() {
    const brief   = typeof AICoach !== 'undefined' ? AICoach.getDailyBriefing() : { items: [] };
    const profile = typeof LearningProfile !== 'undefined' ? LearningProfile.get() : null;
    const heatmap = typeof DailySystem !== 'undefined' ? DailySystem.getTopicHeatmap() : [];
    const ready   = typeof AICoach !== 'undefined' ? AICoach.getReadinessText() : 'Ready';
    const weakRank = typeof LearningProfile !== 'undefined' ? LearningProfile.getWeaknessRanking() : [];

    const typeColor = {
      misconception: '#8B5CF6',
      redirect:      '#EF4444',
      focus_weak:    '#F59E0B',
      revision:      '#3B82F6',
      celebrate:     '#10B981',
      encourage:     '#3B82F6',
      steady:        'var(--primary)'
    };
    const color = typeColor[brief.type] || 'var(--primary)';
    const streakBadge = brief.streakAlive && brief.streakCount > 0
      ? `<span class="rp-badge rp-badge--amber">&#9733; ${brief.streakCount}-day streak</span>`
      : '';

    // Subject strength bars
    const strengthBars = weakRank.slice(0, 6).map(w => {
      const barColor = w.accuracy >= 70 ? '#10B981' : w.accuracy >= 50 ? '#F59E0B' : '#EF4444';
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:6px 0;">
          <div style="width:80px;font-size:12px;font-weight:600;color:var(--text-primary);flex-shrink:0">${w.subject}</div>
          <div style="flex:1;height:6px;background:var(--bg-nested);border-radius:var(--radius-full);overflow:hidden;">
            <div style="width:${w.accuracy}%;height:100%;background:${barColor};border-radius:var(--radius-full);transition:width 0.6s ease;"></div>
          </div>
          <div style="font-size:12px;font-weight:700;color:${barColor};width:32px;text-align:right">${w.accuracy}%</div>
        </div>
      `;
    }).join('');

    return `
      <!-- Daily Briefing Card -->
      <div class="rp-card" style="border-left:3px solid ${color};margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${color};margin-bottom:6px;">
          AI Coach
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">${brief.greeting}</div>
        <div style="font-size:19px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);letter-spacing:-.02em;margin-bottom:8px;line-height:1.25">
          ${brief.focus}
        </div>
        <p style="font-size:13.5px;color:var(--text-secondary);line-height:1.65;margin:0 0 16px">${brief.summary}</p>
        ${streakBadge ? `<div style="margin-bottom:14px">${streakBadge}</div>` : ''}
        ${brief.yesterdaySummary ? `
          <div style="padding:8px 12px;background:var(--bg-nested);border-radius:var(--radius-md);font-size:12px;color:var(--text-muted);margin-bottom:14px">
            ${brief.yesterdaySummary}
          </div>` : ''}
        <button class="rp-btn rp-btn--primary" style="width:auto;padding:9px 20px;font-size:13px"
          onclick="App.navigate('${brief.recommendation.action}', ${JSON.stringify(brief.recommendation.params || {})})">
          ${brief.recommendation.label}
        </button>
        <div style="margin-top:12px;font-size:11.5px;color:var(--text-muted)">
          Estimated study time today: <strong style="color:var(--text-primary)">${brief.estimatedMinutes} min</strong>
          ${brief.revisionDue > 0 ? `· <strong style="color:#F59E0B">${brief.revisionDue} subject${brief.revisionDue>1?'s':''} need revision</strong>` : ''}
        </div>
      </div>

      <!-- Strength Overview -->
      ${weakRank.length > 0 ? `
        <div class="rp-card" style="margin-bottom:12px">
          <div class="rp-label" style="margin-bottom:14px">Subject Strength</div>
          ${strengthBars}
        </div>` : ''}

      <!-- Readiness text -->
      ${ready ? `
        <div class="rp-card" style="border-left:3px solid var(--border-strong);margin-bottom:12px">
          <div class="rp-label" style="margin-bottom:6px">Preparation Readiness</div>
          <p style="font-size:13.5px;color:var(--text-secondary);line-height:1.65;margin:0">${ready}</p>
          <p style="font-size:11px;color:var(--text-muted);margin:10px 0 0">&#9432; Based on your own test history. Not a prediction of exam outcome.</p>
        </div>` : ''}

      <!-- Privacy notice (Doc 8 §29) -->
      <div style="padding:12px 14px;background:var(--bg-nested);border-radius:var(--radius-md);font-size:11.5px;color:var(--text-muted);line-height:1.55">
        &#9432; All recommendations are generated from your test history, stored locally in your browser. No data is sent to external AI services without your permission.
      </div>
    `;
  },


  // ════════════════════════════════════════════
  // CALENDAR TAB (Doc 8 §15)
  // ════════════════════════════════════════════
  _renderCalendarTab() {
    const progress = typeof DailySystem !== 'undefined' ? DailySystem.getProgress() : [];
    const today    = this._today();
    const progressByDate = {};
    progress.forEach(e => {
      if (!progressByDate[e.date]) progressByDate[e.date] = [];
      progressByDate[e.date].push(e);
    });

    // Build last 35 days (5 weeks)
    const days = [];
    for (let i = 34; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const entries = progressByDate[key] || [];
      const avgAcc  = entries.length
        ? Math.round(entries.reduce((s,e) => s + e.accuracy, 0) / entries.length)
        : 0;
      const isToday = key === today;

      let bg = 'var(--bg-nested)';
      let label = '';
      if (entries.length > 0) {
        if (avgAcc >= 70) { bg = 'rgba(16,185,129,0.25)'; label = `${avgAcc}%`; }
        else if (avgAcc >= 50) { bg = 'rgba(245,158,11,0.2)'; label = `${avgAcc}%`; }
        else { bg = 'rgba(239,68,68,0.15)'; label = `${avgAcc}%`; }
      }

      days.push({ key, bg, label, tests: entries.length, isToday, dayNum: d.getDate(), month: d.getMonth() });
    }

    const weekLabels = ['S','M','T','W','T','F','S'];
    const grid = days.map(d => `
      <div title="${d.key}: ${d.tests} test${d.tests!==1?'s':''} ${d.label?'('+d.label+')':''}"
           style="aspect-ratio:1;background:${d.bg};border-radius:6px;
           border:${d.isToday?'2px solid var(--primary)':'1.5px solid transparent'};
           display:flex;align-items:center;justify-content:center;
           font-size:9px;font-weight:700;color:${d.tests>0?'var(--text-primary)':'var(--text-muted)'};
           position:relative;cursor:default;transition:transform 80ms ease;"
           onmouseover="this.style.transform='scale(1.15)'"
           onmouseout="this.style.transform='scale(1)'">
        ${d.dayNum}
      </div>
    `).join('');

    const totalTests = progress.length;
    const studyDays  = Object.keys(progressByDate).length;
    const streak     = typeof DailySystem !== 'undefined' ? DailySystem.getStreak() : { current: 0, best: 0 };
    const avgAccAll  = totalTests > 0
      ? Math.round(progress.reduce((s, e) => s + e.accuracy, 0) / totalTests)
      : 0;

    return `
      <div class="rp-card" style="margin-bottom:12px">
        <div class="rp-label" style="margin-bottom:4px">Study Calendar</div>
        <p style="font-size:12px;color:var(--text-muted);margin:0 0 16px">Last 35 days</p>

        <!-- Week headers -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:4px">
          ${weekLabels.map(w => `<div style="text-align:center;font-size:10px;font-weight:700;color:var(--text-muted)">${w}</div>`).join('')}
        </div>
        <!-- Grid -->
        <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;margin-bottom:16px">
          ${grid}
        </div>

        <!-- Legend -->
        <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--text-muted);margin-bottom:16px">
          <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;background:rgba(16,185,129,0.3);border-radius:3px;display:inline-block"></span>Strong (≥70%)</span>
          <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;background:rgba(245,158,11,0.25);border-radius:3px;display:inline-block"></span>Moderate (50–69%)</span>
          <span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:12px;background:rgba(239,68,68,0.2);border-radius:3px;display:inline-block"></span>Needs work (&lt;50%)</span>
        </div>

        <!-- Stats row -->
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border-color);border-radius:var(--radius-md);overflow:hidden">
          ${[
            { val: totalTests,   label: 'Tests' },
            { val: studyDays,    label: 'Days' },
            { val: streak.current, label: 'Streak' },
            { val: avgAccAll+'%', label: 'Avg Acc' }
          ].map(s => `
            <div style="background:var(--bg-card);padding:12px 8px;text-align:center">
              <div style="font-size:20px;font-weight:800;color:var(--text-primary);font-family:var(--font-display)">${s.val}</div>
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">${s.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },


  // ════════════════════════════════════════════
  // FLASHCARDS TAB (Doc 8 §12)
  // ════════════════════════════════════════════
  _renderFlashcardsTab() {
    const due   = Flashcards.getDue();
    const stats = Flashcards.getStats();

    if (stats.total === 0) {
      return `
        <div class="rp-card" style="text-align:center;padding:48px 20px">
          <div style="font-size:36px;margin-bottom:12px">🃏</div>
          <div style="font-size:17px;font-weight:700;color:var(--text-primary);font-family:var(--font-display);margin-bottom:8px">
            No Flashcards Yet
          </div>
          <p style="color:var(--text-muted);font-size:13.5px;line-height:1.6;margin:0 0 20px">
            Flashcards are automatically created from questions you get wrong.<br>
            Complete a test to generate your first cards.
          </p>
          <button class="rp-btn rp-btn--primary" style="width:auto;padding:10px 24px" onclick="App.navigate('setup')">
            Start a Test &rarr;
          </button>
        </div>
      `;
    }

    // Stats strip
    const statsHtml = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border-color);border-radius:var(--radius-md);overflow:hidden;margin-bottom:16px">
        ${[
          { val: stats.total,    label: 'Total',    color: 'var(--text-primary)' },
          { val: stats.due,      label: 'Due Today', color: stats.due>0?'#EF4444':'#10B981' },
          { val: stats.mastered, label: 'Mastered',  color: '#10B981' }
        ].map(s => `
          <div style="background:var(--bg-card);padding:12px 8px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:${s.color};font-family:var(--font-display)">${s.val}</div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">${s.label}</div>
          </div>
        `).join('')}
      </div>
    `;

    if (due.length === 0) {
      return `
        <div class="rp-card">
          ${statsHtml}
          <div style="text-align:center;padding:24px 0">
            <div style="font-size:28px;margin-bottom:10px">✓</div>
            <div style="font-size:16px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">All cards reviewed!</div>
            <p style="color:var(--text-muted);font-size:13px;margin:8px 0 0">Check back tomorrow for the next due cards.</p>
          </div>
        </div>
      `;
    }

    // Current card
    const card  = due[Math.min(this._flashcardIdx, due.length - 1)];
    const total = due.length;
    const curr  = Math.min(this._flashcardIdx, total - 1) + 1;

    return `
      <div class="rp-card" style="margin-bottom:12px">
        ${statsHtml}

        <div style="font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:12px">
          Card ${curr} of ${total} due today &nbsp;·&nbsp; ${card.subject}
          ${card.topic ? `&nbsp;·&nbsp; ${card.topic}` : ''}
        </div>

        <!-- Flashcard flip -->
        <div id="fc-card-${card.id}"
             onclick="AICoachPage.flipCard()"
             style="min-height:200px;background:var(--bg-nested);border:2px solid var(--border-color);border-radius:var(--radius-lg);padding:28px 20px;text-align:center;cursor:pointer;transition:transform 0.3s ease;position:relative">

          ${!this._flashcardFlipped ? `
            <!-- FRONT -->
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:12px">Question</div>
            <div style="font-size:15px;line-height:1.6;color:var(--text-primary)">${card.front}</div>
            <div style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font-size:11px;color:var(--text-muted)">Tap to reveal answer</div>
          ` : `
            <!-- BACK -->
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--primary);margin-bottom:12px">Answer (${card.correctLabel})</div>
            <div style="font-size:16px;font-weight:700;color:var(--text-primary);margin-bottom:12px">${card.back}</div>
            ${card.explanation ? `<div style="font-size:13px;color:var(--text-secondary);line-height:1.55;border-top:1px solid var(--border-light);padding-top:12px;text-align:left">${card.explanation.slice(0,200)}${card.explanation.length>200?'…':''}</div>` : ''}
            ${card.memoryTrick ? `<div style="margin-top:10px;padding:8px 12px;background:rgba(245,158,11,0.1);border-radius:var(--radius-md);font-size:12px;color:#F59E0B;text-align:left"><strong>Trick:</strong> ${card.memoryTrick}</div>` : ''}
          `}
        </div>

        ${this._flashcardFlipped ? `
          <!-- Review buttons -->
          <div style="display:flex;gap:10px;margin-top:14px">
            <button onclick="AICoachPage.reviewCard('${card.id}', false)"
              style="flex:1;padding:12px;border:1.5px solid #EF4444;border-radius:var(--radius-md);background:rgba(239,68,68,0.08);color:#EF4444;font-weight:700;font-size:14px;cursor:pointer;font-family:var(--font-display)">
              ✗ Try Again
            </button>
            <button onclick="AICoachPage.reviewCard('${card.id}', true)"
              style="flex:1;padding:12px;border:1.5px solid #10B981;border-radius:var(--radius-md);background:rgba(16,185,129,0.08);color:#10B981;font-weight:700;font-size:14px;cursor:pointer;font-family:var(--font-display)">
              ✓ Got It
            </button>
          </div>
        ` : `
          <button onclick="AICoachPage.flipCard()"
            style="width:100%;margin-top:12px;padding:11px;border:1.5px solid var(--primary);border-radius:var(--radius-md);background:var(--primary-bg);color:var(--primary);font-weight:700;font-size:14px;cursor:pointer;font-family:var(--font-display)">
            Reveal Answer
          </button>
        `}
      </div>
    `;
  },

  flipCard() {
    this._flashcardFlipped = !this._flashcardFlipped;
    App.renderPage('coach');
  },

  reviewCard(cardId, wasCorrect) {
    Flashcards.recordReview(cardId, wasCorrect);
    this._flashcardFlipped = false;
    const due = Flashcards.getDue();
    if (this._flashcardIdx >= due.length) this._flashcardIdx = 0;
    App.renderPage('coach');
  },


  // ════════════════════════════════════════════
  // INSIGHTS TAB (Doc 8 §17, §28E)
  // ════════════════════════════════════════════
  // ════════════════════════════════════════════
  // DOC 18: LEARNING INTELLIGENCE REPORT
  // Genome + Daily Report + Predictions + Style.
  // Every number has a formula; nothing is hallucinated.
  // ════════════════════════════════════════════
  _renderIntelligenceReport() {
    // Doc 19: behaviour-first coaching leads (§16) — "how you think" before "what to study"
    const behaviourBlock = this._renderBehaviourCoaching();

    if (typeof LearningIntelligence === 'undefined') return behaviourBlock;

    const genome = LearningIntelligence.getGenome();
    if (!genome.ready) return behaviourBlock; // not enough data — let AICoach insights handle empty state

    const report  = LearningIntelligence.generateDailyReport();
    const style   = LearningIntelligence.getLearningStyle();
    const preds   = LearningIntelligence.getPredictions();

    // ── Genome overview card ──
    const barColor = s => s >= 70 ? '#10B981' : s >= 45 ? '#F59E0B' : '#EF4444';
    const topIndicators = [...genome.indicators].sort((a, b) => b.score - a.score).slice(0, 6);
    const genomeBars = topIndicators.map(ind => `
      <div style="display:flex;align-items:center;gap:10px;padding:5px 0;">
        <div style="width:110px;font-size:12px;font-weight:600;color:var(--text-primary);flex-shrink:0">${ind.label}</div>
        <div style="flex:1;height:6px;background:var(--bg-nested);border-radius:var(--radius-full);overflow:hidden;">
          <div style="width:${ind.score}%;height:100%;background:${barColor(ind.score)};border-radius:var(--radius-full);transition:width 0.6s ease;"></div>
        </div>
        <div style="font-size:12px;font-weight:700;color:${barColor(ind.score)};width:26px;text-align:right">${ind.score}</div>
      </div>
    `).join('');

    const genomeCard = `
      <div class="rp-card" style="border-left:3px solid var(--primary);margin-bottom:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--primary)">🧬 Learning Genome</div>
          <div style="font-size:22px;font-weight:800;font-family:var(--font-display);color:var(--text-primary)">${genome.overall}<span style="font-size:12px;color:var(--text-muted)">/100</span></div>
        </div>
        <div style="margin-top:8px">${genomeBars}</div>
        <div style="margin-top:10px;font-size:11px;color:var(--text-muted)">Built from ${genome.dataPoints} answered questions across ${genome.testsAnalyzed} analyzed tests.</div>
      </div>
    `;

    // ── Learning style card ──
    const styleCard = style.style === 'unknown' ? '' : `
      <div class="rp-card" style="border-left:3px solid #8B5CF6;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8B5CF6;margin-bottom:6px">🎓 Learning Style</div>
        <div style="font-size:16px;font-weight:800;font-family:var(--font-display);color:var(--text-primary);margin-bottom:6px">${style.label}</div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0 0 8px">${style.description}</p>
        ${style.evidence.length ? `<div style="font-size:11px;color:var(--text-muted)">Based on: ${style.evidence.join(' · ')}</div>` : ''}
      </div>
    `;

    // ── Prediction card ──
    let predCard = '';
    if (preds.scoreRange || preds.streakRisk) {
      const rows = [];
      if (preds.scoreRange) {
        rows.push(`<div style="margin-bottom:8px"><div style="font-size:13px;font-weight:700;color:var(--text-primary)">Next mock: ${preds.scoreRange.low}–${preds.scoreRange.high}%</div><div style="font-size:11px;color:var(--text-muted)">Expected ~${preds.scoreRange.expected}% · ${preds.scoreRange.confidence} confidence</div></div>`);
      }
      if (preds.streakRisk) {
        const rc = preds.streakRisk.risk === 'low' ? '#10B981' : preds.streakRisk.risk === 'high' ? '#EF4444' : '#F59E0B';
        rows.push(`<div style="margin-bottom:8px"><div style="font-size:13px;font-weight:700;color:${rc}">Streak risk: ${preds.streakRisk.risk}</div><div style="font-size:11px;color:var(--text-muted)">${preds.streakRisk.message}</div></div>`);
      }
      if (preds.completionProbability) {
        rows.push(`<div><div style="font-size:13px;font-weight:700;color:var(--text-primary)">Mock completion: ${preds.completionProbability.probability}%</div><div style="font-size:11px;color:var(--text-muted)">${preds.completionProbability.confidence} confidence</div></div>`);
      }
      predCard = `
        <div class="rp-card" style="border-left:3px solid #3B82F6;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#3B82F6;margin-bottom:10px">🔮 Predictions</div>
          ${rows.join('')}
        </div>
      `;
    }

    // ── Daily report sections ──
    const reportCards = (report.sections || []).map(sec => `
      <div class="rp-card" style="margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:18px">${sec.icon || '•'}</span>
          <div style="font-size:14px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">${sec.title}</div>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0${sec.actionLabel ? ' 0 10px' : ''}">${sec.body}</p>
        ${sec.actionLabel && sec.actionSubject ? `
          <button onclick="App.navigate('setup')"
            style="padding:7px 16px;border:1.5px solid var(--primary);border-radius:var(--radius-md);background:transparent;color:var(--primary);font-weight:700;font-size:12px;cursor:pointer;font-family:var(--font-display)">
            ${sec.actionLabel}
          </button>` : ''}
      </div>
    `).join('');

    const header = `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin:4px 2px 10px">
        Learning Intelligence
      </div>
    `;

    return behaviourBlock + header + genomeCard + predCard + styleCard + reportCards;
  },


  // ════════════════════════════════════════════
  // DOC 19 §16: BEHAVIOUR-FIRST COACHING
  // "Your maths isn't the problem — you rush the final 15 min."
  // ════════════════════════════════════════════
  _renderBehaviourCoaching() {
    if (typeof CognitiveBehaviour === 'undefined') return '';

    const dna = CognitiveBehaviour.getBehaviourDNA();
    if (!dna.ready) return '';

    const predictions = CognitiveBehaviour.predictBehaviour();
    const changes = CognitiveBehaviour.getBehaviourChanges();
    const calibration = CognitiveBehaviour.getCalibration();

    const cards = [];

    // Behaviour prediction cards (evidence-backed, §19)
    predictions.slice(0, 2).forEach(p => {
      cards.push(`
        <div class="rp-card" style="border-left:3px solid #EF4444;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:18px">🔮</span>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">Watch for: ${p.risk}</div>
          </div>
          <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin:0 0 6px">${p.evidence}</p>
          <div style="font-size:11px;color:var(--text-muted)">Likelihood ${p.likelihood}% · ${p.confidence} confidence</div>
        </div>
      `);
    });

    // Biggest behaviour change vs past self (§15)
    if (changes[0]) {
      const ch = changes[0];
      const color = ch.direction === 'improved' ? '#10B981' : '#F59E0B';
      cards.push(`
        <div class="rp-card" style="border-left:3px solid ${color};margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:18px">${ch.direction === 'improved' ? '📈' : '📉'}</span>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">${ch.metric} ${ch.direction}</div>
          </div>
          <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin:0 0 6px">${ch.reason} (${ch.from} → ${ch.to})</p>
          <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin:0">${ch.recommendation}</p>
        </div>
      `);
    }

    // Calibration coaching
    if (calibration.ready && calibration.recommendation) {
      cards.push(`
        <div class="rp-card" style="border-left:3px solid #8B5CF6;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
            <span style="font-size:18px">🎯</span>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">Confidence Calibration: ${calibration.calibration}/100</div>
          </div>
          <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin:0 0 6px">${calibration.evidence}</p>
          <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin:0">${calibration.recommendation}</p>
        </div>
      `);
    }

    if (cards.length === 0) return '';

    const header = `
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin:4px 2px 10px">
        Behaviour Coaching
      </div>
    `;
    return header + cards.join('');
  },


  _renderInsightsTab() {
    // ── Doc 18: Learning Intelligence report (pure computation, no LLM) ──
    const intel = this._renderIntelligenceReport();

    const insights = AICoach.getInsights();

    if (insights.length === 0) {
      // Still show the intelligence report if it has data
      const empty = `
        <div class="rp-card" style="text-align:center;padding:40px 20px">
          <div style="font-size:32px;margin-bottom:12px">▲</div>
          <div style="font-size:16px;font-weight:700;color:var(--text-primary);font-family:var(--font-display);margin-bottom:8px">No Insights Yet</div>
          <p style="color:var(--text-muted);font-size:13.5px">Complete at least 3 tests to see personalized insights.</p>
        </div>
      `;
      return intel + (intel ? '' : empty);
    }

    const feedback = Storage.getInsightFeedback();

    return intel + insights.map((ins, i) => {
      const fb = feedback[ins.id];
      return `
        <div class="rp-card" style="border-left:3px solid ${ins.color};margin-bottom:12px;animation:te-fadeUp ${0.3+i*0.1}s ease both">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <span style="font-size:20px;color:${ins.color}">${ins.icon}</span>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">${ins.observation}</div>
          </div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:4px">Why</div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0 0 12px">${ins.reason}</p>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:4px">What to do</div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0 0 14px">${ins.action}</p>
          <div style="display:flex;align-items:center;justify-content:space-between">
            <button onclick="App.navigate('${ins.actionNav.page}', ${JSON.stringify(ins.actionNav.params || {})})"
              style="padding:7px 16px;border:1.5px solid ${ins.color};border-radius:var(--radius-md);background:transparent;color:${ins.color};font-weight:700;font-size:12px;cursor:pointer;font-family:var(--font-display)">
              ${ins.actionLabel}
            </button>
            <!-- Feedback (Doc 8 §28E) -->
            <div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:11px;color:var(--text-muted)">Helpful?</span>
              <button onclick="AICoachPage.rateInsight('${ins.id}','up')"
                style="padding:4px 10px;border:1px solid ${fb?.vote==='up'?'#10B981':'var(--border-color)'};border-radius:var(--radius-sm);background:${fb?.vote==='up'?'rgba(16,185,129,0.1)':'transparent'};cursor:pointer;font-size:13px">
                👍
              </button>
              <button onclick="AICoachPage.rateInsight('${ins.id}','down')"
                style="padding:4px 10px;border:1px solid ${fb?.vote==='down'?'#EF4444':'var(--border-color)'};border-radius:var(--radius-sm);background:${fb?.vote==='down'?'rgba(239,68,68,0.1)':'transparent'};cursor:pointer;font-size:13px">
                👎
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  rateInsight(id, vote) {
    Storage.saveInsightFeedback(id, vote);
    App.renderPage('coach');
  },


  // ════════════════════════════════════════════
  // PLAN TAB (Doc 8 §14, §11)
  // ════════════════════════════════════════════
  _renderPlanTab() {
    const plan     = AICoach.getStudyPlan(this._planMinutes);
    const weekPlan = AICoach.getWeeklyPlan();

    const typeColor = { revision:'#3B82F6', mock:'#8B5CF6', weak_topic:'#EF4444', focus:'#F59E0B', advanced_mock:'#10B981' };

    const blocks = plan.blocks.map(b => `
      <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--border-light)">
        <div style="font-size:22px;width:32px;text-align:center;flex-shrink:0">${b.icon}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">${b.label}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${b.minutes} minutes</div>
        </div>
        <button onclick="App.navigate('${b.action.page}', ${JSON.stringify(b.action.params || {})})"
          style="padding:6px 14px;border:1.5px solid ${typeColor[b.type]||'var(--primary)'};border-radius:var(--radius-md);background:transparent;color:${typeColor[b.type]||'var(--primary)'};font-weight:700;font-size:12px;cursor:pointer;font-family:var(--font-display)">
          Start
        </button>
      </div>
    `).join('');

    const timeOpts = [25, 45, 60, 90];
    const timeSelector = `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
        <span style="font-size:12px;color:var(--text-muted);font-weight:600;align-self:center">Available time:</span>
        ${timeOpts.map(t => `
          <button onclick="AICoachPage.setPlanTime(${t})"
            style="padding:5px 12px;border:1.5px solid ${this._planMinutes===t?'var(--primary)':'var(--border-color)'};border-radius:var(--radius-full);background:${this._planMinutes===t?'var(--primary-bg)':'transparent'};color:${this._planMinutes===t?'var(--primary)':'var(--text-muted)'};font-size:12px;font-weight:700;cursor:pointer;font-family:var(--font-display)">
            ${t} min
          </button>
        `).join('')}
      </div>
    `;

    const weekRows = weekPlan.map(d => {
      const c = typeColor[d.type] || 'var(--primary)';
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light)">
          <div style="font-size:12px;font-weight:700;color:${d.done?'#10B981':c};width:72px;flex-shrink:0">${d.day}</div>
          <div style="flex:1;font-size:13.5px;font-weight:600;color:var(--text-primary)">${d.label}</div>
          ${d.done
            ? `<span style="font-size:11px;font-weight:700;color:#10B981">&#10003; Done</span>`
            : `<button onclick="App.navigate('${d.action.page}',${JSON.stringify(d.action.params||{})})"
                 style="padding:4px 12px;border:1.5px solid ${c};border-radius:var(--radius-sm);background:transparent;color:${c};font-size:11px;font-weight:700;cursor:pointer;font-family:var(--font-display)">
                 Start
               </button>`}
        </div>
      `;
    }).join('');

    return `
      <!-- Today's Plan -->
      <div class="rp-card" style="margin-bottom:12px">
        <div class="rp-label" style="margin-bottom:4px">Today's Study Plan</div>
        <p style="font-size:12px;color:var(--text-muted);margin:0 0 14px">Personalized based on your weaknesses</p>
        ${timeSelector}
        <div>${plan.blocks.length > 0 ? blocks : '<p style="color:var(--text-muted);font-size:13px">Not enough data yet — take a few tests first.</p>'}</div>
      </div>

      <!-- 7-day plan -->
      <div class="rp-card">
        <div class="rp-label" style="margin-bottom:14px">7-Day Plan</div>
        ${weekRows}
      </div>
    `;
  },

  setPlanTime(min) {
    this._planMinutes = min;
    App.renderPage('coach');
  },


  // ════════════════════════════════════════════
  // HISTORY TAB (Doc 8 §19)
  // ════════════════════════════════════════════
  _renderHistoryTab() {
    const history = ProgressEngine.getHistory ? ProgressEngine.getHistory() : (Storage.getHistory ? Storage.getHistory() : []);
    const last20  = history.slice(-20).reverse();

    if (last20.length === 0) {
      return `
        <div class="rp-card" style="text-align:center;padding:40px 20px">
          <div style="font-size:32px;margin-bottom:12px">◈</div>
          <div style="font-size:16px;font-weight:700;color:var(--text-primary);font-family:var(--font-display);margin-bottom:8px">No History Yet</div>
          <p style="color:var(--text-muted);font-size:13.5px">Complete your first test to see your history.</p>
          <button class="rp-btn rp-btn--primary" style="margin-top:16px;width:auto;padding:10px 24px" onclick="App.navigate('setup')">Start a Test &rarr;</button>
        </div>
      `;
    }

    const rows = last20.map((h, i) => {
      const acc   = h.accuracy || 0;
      const color = acc >= 70 ? '#10B981' : acc >= 50 ? '#F59E0B' : '#EF4444';
      const date  = h.date ? new Date(h.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '-';
      const name  = h.examName || 'Practice Test';
      const subjectEntries = h.subjectStats ? Object.entries(h.subjectStats) : [];

      return `
        <div style="padding:14px 0;border-bottom:1px solid var(--border-light)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <div>
              <div style="font-size:14px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">${name}</div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px">${date}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:22px;font-weight:800;color:${color};font-family:var(--font-display)">${acc}%</div>
              <div style="font-size:11px;color:var(--text-muted)">${h.correct||0}✓ ${h.wrong||0}✗</div>
            </div>
          </div>
          ${subjectEntries.length > 0 ? `
            <div style="display:flex;gap:6px;flex-wrap:wrap">
              ${subjectEntries.map(([s, sd]) => `
                <span style="font-size:10.5px;font-weight:600;padding:2px 8px;border-radius:var(--radius-full);background:${(sd.accuracy||0)>=70?'rgba(16,185,129,0.1)':(sd.accuracy||0)>=50?'rgba(245,158,11,0.1)':'rgba(239,68,68,0.1)'};color:${(sd.accuracy||0)>=70?'#10B981':(sd.accuracy||0)>=50?'#F59E0B':'#EF4444'}">
                  ${s} ${sd.accuracy||0}%
                </span>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      ${this._renderBehaviourTimeline()}
      <div class="rp-card">
        <div class="rp-label" style="margin-bottom:14px">Test History (Last 20)</div>
        ${rows}
      </div>
    `;
  },

  // ════ DOC 19 §2/§17: BEHAVIOUR TIMELINE (vs past self) ════
  _renderBehaviourTimeline() {
    if (typeof CognitiveBehaviour === 'undefined') return '';
    const timeline = CognitiveBehaviour.getBehaviourTimeline(12).filter(t => t.behaviourScore != null);
    if (timeline.length < 2) return '';

    const max = 100;
    const barColor = s => s >= 70 ? '#10B981' : s >= 45 ? '#F59E0B' : '#EF4444';
    const bars = timeline.map(t => {
      const h = Math.max(4, Math.round((t.behaviourScore / max) * 80));
      const date = t.date ? new Date(t.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' }) : '';
      return `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:0">
          <div style="font-size:10px;font-weight:700;color:${barColor(t.behaviourScore)}">${t.behaviourScore}</div>
          <div style="width:14px;height:${h}px;background:${barColor(t.behaviourScore)};border-radius:3px 3px 0 0"></div>
          <div style="font-size:9px;color:var(--text-muted);white-space:nowrap;transform:rotate(-45deg);transform-origin:center;margin-top:4px">${date}</div>
        </div>
      `;
    }).join('');

    const first = timeline[0].behaviourScore;
    const last = timeline[timeline.length - 1].behaviourScore;
    const delta = last - first;
    const trendText = Math.abs(delta) < 5
      ? 'Your behaviour score has held steady — consistency is its own strength.'
      : delta > 0
      ? `Your behaviour score climbed ${delta} points vs. your earlier self. The habits are compounding.`
      : `Your behaviour score slipped ${Math.abs(delta)} points vs. your earlier self — worth a look at focus and pacing.`;

    return `
      <div class="rp-card" style="margin-bottom:12px">
        <div class="rp-label" style="margin-bottom:14px">🧠 Behaviour Timeline (vs your past self)</div>
        <div style="display:flex;align-items:flex-end;gap:6px;height:120px;padding:0 4px 16px">${bars}</div>
        <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin:8px 0 0">${trendText}</p>
      </div>
    `;
  },


  // ════ HELPERS ════
  _today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent('page_view', { page: 'ai_coach', tab: this._activeTab });
  }
};

window.AICoachPage = AICoachPage;
