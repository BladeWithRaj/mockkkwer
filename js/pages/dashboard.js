// ============================================
// DASHBOARD PAGE v6.0 — Doc 6 "Daily Study Workspace"
// Mission: Tell students exactly what to do next.
// Flow: Hero → Mission → Continue → AI Coach →
//       Rec Mock → Heatmap → Revision Queue →
//       Weekly Timeline → Performance → Achievements
//       → Recent Activity
// ============================================

const DashboardPage = {
  _isRendering: false,

  render() {
    return `
      <div class="dp page-enter">
        <div class="dp-loading">
          <div class="dp-spinner"></div>
          <p>Preparing your workspace...</p>
        </div>
      </div>
    `;
  },

  async afterRender() {
    try {
      const stats = await Analytics.loadDashboardStats();
      this._buildUI(stats);
    } catch (err) {
      console.error('Dashboard error:', err);
      const el = document.querySelector('.dp');
      if (el) el.innerHTML = `
        <div class="dp-error">
          ${Icons.get('alertTriangle', 36)}
          <h2>Dashboard failed to load</h2>
          <p>${err.message}</p>
          <button class="dp-btn dp-btn--primary" onclick="App.navigate('home')">Go Home</button>
        </div>`;
    }
  },

  async _handleRealtimeUpdate() {
    if (this._isRendering) return;
    this._isRendering = true;
    try {
      const stats = await Analytics.loadDashboardStats(true);
      if (document.querySelector('.dp')) this._buildUI(stats);
    } catch (e) { console.error('Realtime update failed:', e); }
    finally { this._isRendering = false; }
  },

  // ════════════════════════════════════════════
  // MAIN BUILD
  // ════════════════════════════════════════════
  _buildUI(stats) {
    const container = document.querySelector('.dp');
    if (!container) return;

    // ── Gather all data ──
    const streak   = typeof DailySystem !== 'undefined' ? DailySystem.getStreak()         : { current: 0, best: 0 };
    const goal     = typeof DailySystem !== 'undefined' ? DailySystem.getDailyGoal()       : { testsToday: 0, target: 3, questionsToday: 0, accuracyToday: 0 };
    const heatmap  = typeof DailySystem !== 'undefined' ? DailySystem.getTopicHeatmap()    : [];
    const patterns = typeof DailySystem !== 'undefined' ? DailySystem.getMistakePatterns() : [];
    const recent   = typeof DailySystem !== 'undefined' ? DailySystem.getRecentProgress(7) : [];
    const alive    = typeof DailySystem !== 'undefined' ? DailySystem.isStreakAlive()       : false;
    const dailyDone= typeof DailySystem !== 'undefined' ? DailySystem.isDailyDone()        : false;

    const username   = Storage.getUsername() || 'Student';
    const history    = Storage.getHistory?.() || [];
    const currentTest= Storage.getCurrentTest?.();

    const totalTests = stats?.totalTests  ?? history.length;
    const avgScore   = stats?.avgScore    ?? (recent.length ? Math.round(recent.reduce((s,e) => s+e.accuracy,0)/recent.length) : 0);
    const bestScore  = stats?.bestScore   ?? (recent.length ? Math.max(...recent.map(e => e.accuracy)) : 0);
    const weakArea   = stats?.weakArea    ?? (heatmap.length ? heatmap[0].subject : null);
    const impRate    = stats?.improvementRate ?? 0;

    // Empty state — first-time users
    if (!stats && history.length === 0) {
      container.innerHTML = this._renderEmptyState(username);
      return;
    }

    container.innerHTML = `

      <!-- ═══ WS1: CONTEXT-AWARE HERO ═══ -->
      ${this._renderHero(username, streak, alive, goal, stats, avgScore)}

      <div class="dp-workspace">

        <!-- ═══ WS2: TODAY'S MISSION ═══ -->
        ${this._renderMission(dailyDone, streak, heatmap, weakArea, currentTest, goal)}

        <!-- ═══ WS3: CONTINUE PREPARATION ═══ -->
        ${this._renderContinue(currentTest)}

        <!-- ═══ WS4: AI COACH ═══ -->
        ${this._renderAICoach(patterns, heatmap, impRate, alive, streak)}

        <!-- ═══ Doc 24: DAILY DECISION ═══ -->
        ${this._renderDailyDecisionCard()}

        <!-- ═══ Doc 22: LEARNING WEATHER ═══ -->
        ${this._renderLearningWeatherCard()}

        <!-- ═══ Doc 22: PREDICTIONS ═══ -->
        ${this._renderPredictionsCard()}

        <!-- ═══ Doc 23: DIGITAL TWIN ═══ -->
        ${this._renderDigitalTwinCard()}
        ${this._renderDigitalTwinStrategyCard()}

        <!-- ═══ Doc 18: LEARNING INTELLIGENCE ═══ -->
        ${this._renderIntelligenceCard()}

        <!-- ═══ Doc 19: COGNITIVE BEHAVIOUR ═══ -->
        ${this._renderBehaviourCard()}

        <!-- ═══ Doc 20: MISTAKE DNA ═══ -->
        ${this._renderMistakeDNACard()}

        <!-- ═══ Doc 21: RECOVERY PASSPORT ═══ -->
        ${this._renderRecoveryPassportCard()}

        <!-- ═══ Doc 9: DAILY MISSIONS ═══ -->
        ${this._renderDailyMissions()}

        <!-- ═══ Doc 9: CHURN RE-ENGAGEMENT ═══ -->
        ${this._renderChurnCard()}

        <!-- ═══ WS5: RECOMMENDED MOCK ═══ -->
        ${this._renderRecommendedMock(heatmap, history, weakArea)}

        <!-- ═══ WS6: WEAK TOPICS HEATMAP ═══ -->
        ${this._renderHeatmap(heatmap)}

        <!-- ═══ WS7: REVISION QUEUE ═══ -->
        ${this._renderRevisionQueue(heatmap, history)}

        <!-- ═══ WS8: WEEKLY TIMELINE ═══ -->
        ${this._renderWeeklyTimeline(recent)}

        <!-- ═══ PERFORMANCE — 3 metrics ═══ -->
        ${this._renderPerformance(avgScore, history, impRate)}

        <!-- ═══ ACHIEVEMENTS ═══ -->
        ${this._renderAchievements(history, streak, bestScore)}

        <!-- ═══ Doc 9: PROGRESS TIMELINE ═══ -->
        ${this._renderProgressTimeline()}

        <!-- ═══ WS9: RECENT ACTIVITY ═══ -->
        ${this._renderRecentActivity(history)}

      </div>
    `;

    // Post-render: animate mission progress bar
    requestAnimationFrame(() => {
      const bar = document.querySelector('.dp-mission-prog-fill');
      if (bar) bar.style.width = bar.dataset.pct + '%';
    });
  },


  // ════════════════════════════════════════════
  // WS1 — CONTEXT-AWARE HERO (Doc 6 §4)
  // ════════════════════════════════════════════
  _renderHero(username, streak, alive, goal, stats, avgScore) {
    const hour = new Date().getHours();
    const greet = hour < 5  ? 'Working late' :
                  hour < 12 ? 'Good morning' :
                  hour < 17 ? 'Good afternoon' :
                  hour < 21 ? 'Good evening' : 'Night session';

    // Context line — what's the most useful next thing to say?
    const goalPct = Math.min(100, Math.round((goal.testsToday / (goal.target || 3)) * 100));
    let contextLine = '';
    if (alive && streak.current >= 3) {
      contextLine = `You're on a <strong>${streak.current}-day streak</strong>. Keep it going today.`;
    } else if (goalPct >= 66) {
      contextLine = `You're <strong>${goalPct}%</strong> through today's goal. Almost there.`;
    } else if (avgScore >= 75) {
      contextLine = `Avg accuracy at <strong>${avgScore}%</strong> — you're performing well this week.`;
    } else if (goal.testsToday === 0) {
      contextLine = `No tests today yet. Your workspace is ready.`;
    } else {
      contextLine = `${goal.testsToday} test${goal.testsToday !== 1 ? 's' : ''} done today &middot; ${goal.questionsToday} questions answered.`;
    }

    const primaryBtn = Storage.getCurrentTest?.()
      ? `<button class="dp-btn dp-btn--primary" onclick="DashboardPage._resumeTest()">Resume Test &rarr;</button>`
      : `<button class="dp-btn dp-btn--primary" onclick="DashboardPage._missionStartDaily()">Start Today's Challenge &rarr;</button>`;

    return `
      <section class="dp-hero">
        <div class="dp-hero-inner">
          <div class="dp-hero-text">
            <p class="dp-hero-greet">${greet}, ${username}.</p>
            <p class="dp-hero-context">${contextLine}</p>
          </div>
          <div class="dp-hero-action">
            ${primaryBtn}
          </div>
        </div>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // WS2 — TODAY'S MISSION (Doc 6 §5)
  // ════════════════════════════════════════════
  _renderMission(dailyDone, streak, heatmap, weakArea, currentTest, goal) {
    const date = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

    // Build task list in priority order
    const tasks = [];

    // Priority 1: Resume test (if in-progress)
    if (currentTest) {
      const q = currentTest.currentQuestion || 0;
      const total = currentTest.questions?.length || 100;
      const pct = Math.round((q / total) * 100);
      tasks.push({
        id: 'resume',
        done: false,
        symbol: '▶',
        symbolColor: '#3B82F6',
        title: `Resume: ${currentTest.config?.name || 'In-Progress Test'}`,
        sub: `Q.${q + 1} of ${total} &middot; ${pct}% complete &middot; ~${Math.round((total - q) * 0.75)} min`,
        action: `DashboardPage._resumeTest()`,
        btnLabel: 'Resume &rarr;',
        urgent: true
      });
    }

    // Priority 2: Daily challenge
    tasks.push({
      id: 'daily',
      done: dailyDone,
      symbol: '★',
      symbolColor: dailyDone ? '#10B981' : '#F59E0B',
      title: dailyDone ? 'Daily Challenge — Done ✓' : 'Daily Challenge',
      sub: `15 questions &middot; Adaptive difficulty &middot; ~20 min`,
      action: `DashboardPage._missionStartDaily()`,
      btnLabel: dailyDone ? 'Completed' : 'Start &rarr;'
    });

    // Priority 3: Weak topic revision
    const weakTopic = heatmap?.length > 0 ? heatmap[0] : null;
    tasks.push({
      id: 'revise',
      done: false,
      symbol: '◎',
      symbolColor: '#EF4444',
      title: weakTopic ? `Revise: ${weakTopic.subject}` : 'Review Weak Topics',
      sub: weakTopic
        ? `${weakTopic.accuracy}% accuracy &middot; needs work &middot; ~15 min`
        : 'Take a test to identify weak areas',
      action: weakTopic
        ? `App.navigate('setup', {subject:'${weakTopic.subject}',mode:'section'})`
        : `App.navigate('setup')`,
      btnLabel: 'Revise &rarr;'
    });

    // Priority 4: Full mock
    tasks.push({
      id: 'mock',
      done: false,
      symbol: '◈',
      symbolColor: '#8B5CF6',
      title: 'Recommended Mock',
      sub: weakArea ? `Focus on ${weakArea} &middot; full-pattern test &middot; ~60 min` : 'Full-length mock based on your level',
      action: `App.navigate('setup')`,
      btnLabel: 'Take Mock &rarr;'
    });

    const doneTasks = tasks.filter(t => t.done).length;
    const totalTasks = tasks.length;
    const progPct = Math.round((doneTasks / totalTasks) * 100);

    return `
      <section class="dp-card dp-mission-card">
        <div class="dp-mission-head">
          <div>
            <div class="dp-card-label">Today&rsquo;s Mission</div>
            <div class="dp-mission-date">${date}</div>
          </div>
          <div class="dp-mission-count">${doneTasks} / ${totalTasks} done</div>
        </div>

        <!-- Progress bar -->
        <div class="dp-mission-prog">
          <div class="dp-mission-prog-fill" data-pct="${progPct}" style="width:0%"></div>
        </div>

        <!-- Task list -->
        <div class="dp-mission-list">
          ${tasks.map(t => `
            <div class="dp-mission-item ${t.done ? 'dp-mission-item--done' : ''} ${t.urgent ? 'dp-mission-item--urgent' : ''}">
              <div class="dp-mission-symbol" style="color:${t.symbolColor}">${t.symbol}</div>
              <div class="dp-mission-body">
                <div class="dp-mission-title">${t.title}</div>
                <div class="dp-mission-sub">${t.sub}</div>
              </div>
              <button class="dp-mission-btn ${t.done ? 'dp-mission-btn--done' : ''}"
                onclick="${t.action}" ${t.done ? 'disabled' : ''}>
                ${t.btnLabel}
              </button>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // WS3 — CONTINUE PREPARATION (Doc 6 §6)
  // ════════════════════════════════════════════
  _renderContinue(currentTest) {
    if (!currentTest) {
      // Fallback: start recommended mock
      return `
        <section class="dp-card dp-continue-card dp-continue-card--empty">
          <div class="dp-continue-icon">▶</div>
          <div class="dp-continue-body">
            <div class="dp-continue-title">Ready to practice?</div>
            <div class="dp-continue-sub">No test in progress. Start today's recommended mock.</div>
          </div>
          <button class="dp-btn dp-btn--primary" onclick="App.navigate('setup')">Begin &rarr;</button>
        </section>
      `;
    }

    const name  = currentTest.config?.name || 'In-Progress Test';
    const q     = currentTest.currentQuestion || 0;
    const total = currentTest.questions?.length || 100;
    const pct   = Math.round((q / total) * 100);
    const remaining = total - q;

    return `
      <section class="dp-card dp-continue-card">
        <div class="dp-continue-tag">In Progress</div>
        <div class="dp-continue-head">
          <div>
            <div class="dp-continue-title">${name}</div>
            <div class="dp-continue-sub">Q.${q + 1} of ${total} &middot; ~${Math.round(remaining * 0.75)} min remaining</div>
          </div>
          <button class="dp-btn dp-btn--primary" onclick="DashboardPage._resumeTest()">Resume &rarr;</button>
        </div>
        <div class="dp-continue-bar">
          <div class="dp-continue-fill" style="width:${pct}%"></div>
        </div>
        <div class="dp-continue-pct">${pct}% complete</div>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // WS4 — AI COACH CARD (Doc 6 §7 + Doc 8 §4)
  // Live from AICoach engine — not hardcoded
  // ════════════════════════════════════════════
  _renderAICoach(patterns, heatmap, impRate, alive, streak) {
    // Use the new AI Coach engine if available; fall back to local pattern logic
    if (typeof AICoach !== 'undefined') {
      const brief = AICoach.getDailyBriefing();
      const typeColor = {
        misconception: '#8B5CF6',
        redirect:      '#EF4444',
        focus_weak:    '#F59E0B',
        revision:      '#3B82F6',
        celebrate:     '#10B981',
        encourage:     '#3B82F6',
        steady:        '#3B82F6'
      };
      const color = typeColor[brief.type] || '#3B82F6';
      const bg    = `${color}0d`;

      return `
        <section class="dp-card dp-coach-card" style="border-left:3px solid ${color};background:${bg}">
          <div class="dp-coach-head">
            <span class="dp-coach-icon" style="color:${color}">◉</span>
            <div class="dp-card-label" style="color:${color}">AI Coach</div>
          </div>
          <div class="dp-coach-title">${brief.focus}</div>
          <p class="dp-coach-body">${brief.summary}</p>
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <button class="dp-btn dp-btn--outline"
              onclick="App.navigate('${brief.recommendation.action}', ${JSON.stringify(brief.recommendation.params || {})})">
              ${brief.recommendation.label} &rarr;
            </button>
            <button style="background:none;border:none;color:var(--text-muted);font-size:12px;cursor:pointer;font-weight:600;font-family:var(--font-display)"
              onclick="App.navigate('coach')">
              Open AI Coach &rarr;
            </button>
          </div>
        </section>
      `;
    }

    // ── Legacy fallback (used when AICoach engine not yet loaded) ──
    const highSeverity = patterns?.find(p => p.severity === 'high');
    const anyPattern   = patterns?.[0];
    let insight = null;

    if (highSeverity) {
      insight = {
        type: 'warn', color: '#EF4444', bg: 'rgba(239,68,68,0.06)', icon: '◉',
        title: highSeverity.title, body: highSeverity.desc,
        action: `App.navigate('setup')`, btnLabel: 'Practice Now &rarr;'
      };
    } else if (heatmap?.length > 0 && heatmap[0].accuracy < 50) {
      const w = heatmap[0];
      insight = {
        type: 'warn', color: '#F59E0B', bg: 'rgba(245,158,11,0.06)', icon: '◈',
        title: `${w.subject} needs attention`,
        body: `Your accuracy in ${w.subject} is ${w.accuracy}%. A focused 15-min revision session today will move the needle.`,
        action: `App.navigate('setup', {subject:'${w.subject}',mode:'section'})`, btnLabel: 'Revise Now &rarr;'
      };
    } else if (impRate > 5) {
      insight = {
        type: 'positive', color: '#10B981', bg: 'rgba(16,185,129,0.06)', icon: '▲',
        title: `Accuracy up ${impRate}% this week`,
        body: `You're improving consistently. Keep the momentum — take a full-length mock today to lock in these gains.`,
        action: `App.navigate('setup')`, btnLabel: 'Take Full Mock &rarr;'
      };
    } else if (alive && streak.current >= 7) {
      insight = {
        type: 'positive', color: '#8B5CF6', bg: 'rgba(139,92,246,0.06)', icon: '★',
        title: `${streak.current}-day streak — impressive`,
        body: `Consistency is your superpower. Students who practice daily for 2 weeks score 23% higher on average.`,
        action: `DashboardPage._missionStartDaily()`, btnLabel: 'Continue Streak &rarr;'
      };
    } else {
      insight = {
        type: 'neutral', color: '#3B82F6', bg: 'rgba(59,130,246,0.06)', icon: '◎',
        title: 'Build your baseline',
        body: `Take 3+ tests this week to unlock personalized AI insights and weakness detection tailored to your pattern.`,
        action: `App.navigate('setup')`, btnLabel: 'Start Practice &rarr;'
      };
    }

    return `
      <section class="dp-card dp-coach-card" style="border-left:3px solid ${insight.color};background:${insight.bg}">
        <div class="dp-coach-head">
          <span class="dp-coach-icon" style="color:${insight.color}">${insight.icon}</span>
          <div class="dp-card-label" style="color:${insight.color}">AI Coach</div>
        </div>
        <div class="dp-coach-title">${insight.title}</div>
        <p class="dp-coach-body">${insight.body}</p>
        <button class="dp-btn dp-btn--outline" onclick="${insight.action}">${insight.btnLabel}</button>
      </section>
    `;
  },




  // ════════════════════════════════════════════
  // WS5 — RECOMMENDED MOCK (Doc 10 §19 — via RecommendationEngine)
  // ════════════════════════════════════════════
  _renderRecommendedMock(heatmap, history, weakArea) {
    // Doc 10 §19: All recommendations from a single source of truth
    const recMock = typeof RecommendationEngine !== 'undefined'
      ? RecommendationEngine.getNextMock()
      : { name: 'SSC CGL Full Mock', questions: 100, minutes: 60, difficulty: 'Medium', reason: 'Most popular mock for your level.' };

    let adaptiveDetailsHtml = '';
    if (typeof AdaptiveAssessmentEngine !== 'undefined') {
      try {
        const profile = typeof DigitalTwin !== 'undefined' ? DigitalTwin.buildProfile() : null;
        const bp = AdaptiveAssessmentEngine.generateAdaptiveBlueprint(AdaptiveAssessmentEngine.PAPER_TYPES.READINESS, 10, profile);
        const mockQs = Object.keys(bp.subjects).map((sub, i) => ({ id: `q_${i}`, subject: sub, topic: sub, averageAccuracy: 60 - i * 5, learningGainScore: 70 + (5 - i) * 3 }));
        const quality = AdaptiveAssessmentEngine.evaluatePaperQuality(mockQs, AdaptiveAssessmentEngine.PAPER_TYPES.READINESS, profile);

        adaptiveDetailsHtml = `
          <div style="margin:8px 0;padding:8px;background:var(--surface-elevated);border-radius:8px;border:1px dashed var(--border)">
            <div style="font-size:10px;font-weight:700;color:#10B981;text-transform:uppercase;margin-bottom:4px">⚡ Adaptive Paper Projections</div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
              <span>Projected Learning Gain:</span>
              <strong style="color:#10B981">+${quality.learningGain}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
              <span>Evaluated Skills:</span>
              <strong>${quality.evaluatedSkills.join(', ')}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
              <span>Targeted Topics:</span>
              <strong>${quality.topicsExpectedToImprove.join(', ') || 'GK/English'}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:11px">
              <span>Paper Quality Score:</span>
              <strong>${quality.qualityScore}/100</strong>
            </div>
          </div>
        `;
      } catch (e) {
        console.warn('[Dashboard] AAE projections error:', e.message);
      }
    }

    return `
      <section class="dp-card dp-rec-card">
        <div class="dp-card-label">Recommended Mock</div>
        <div class="dp-rec-name">${recMock.name}</div>
        <div class="dp-rec-meta">
          <span>${recMock.questions || recMock.q || 100} Questions</span>
          <span class="dp-rec-dot">·</span>
          <span>${recMock.minutes || recMock.min || 60} min</span>
          <span class="dp-rec-dot">·</span>
          <span>${recMock.difficulty || recMock.diff || 'Medium'}</span>
        </div>
        <div class="dp-rec-reason">
          <span class="dp-rec-reason-label">Why recommended</span>
          <span>${recMock.reason}</span>
        </div>
        ${adaptiveDetailsHtml}
        <button class="dp-btn dp-btn--primary dp-btn--full" onclick="App.navigate('setup')">Start This Mock &rarr;</button>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // WS6 — WEAK TOPICS HEATMAP (Doc 6 §9)
  // ════════════════════════════════════════════
  _renderHeatmap(heatmap) {
    if (!heatmap || heatmap.length === 0) {
      return `
        <section class="dp-card">
          <div class="dp-card-label">Subject Strength</div>
          <div class="dp-card-empty">
            ${Icons.get('clipboard', 28)}
            <p>Take 2+ tests to see your subject heatmap</p>
          </div>
        </section>
      `;
    }

    const cells = heatmap.map(t => {
      const color = t.accuracy >= 70 ? '#10B981' :
                    t.accuracy >= 50 ? '#F59E0B' :
                    t.accuracy >= 30 ? '#F97316' : '#EF4444';
      const bg    = t.accuracy >= 70 ? 'rgba(16,185,129,0.12)' :
                    t.accuracy >= 50 ? 'rgba(245,158,11,0.12)' :
                    t.accuracy >= 30 ? 'rgba(249,115,22,0.12)' : 'rgba(239,68,68,0.12)';
      const label = t.accuracy >= 70 ? 'Strong' :
                    t.accuracy >= 50 ? 'OK' :
                    t.accuracy >= 30 ? 'Weak' : 'Critical';

      return `
        <button class="dp-heatmap-cell"
          style="--hm-color:${color};--hm-bg:${bg}"
          onclick="App.navigate('setup', {subject:'${t.subject}',mode:'section'})"
          title="Click to practice ${t.subject}">
          <div class="dp-heatmap-subject">${t.subject}</div>
          <div class="dp-heatmap-pct" style="color:${color}">${t.accuracy}%</div>
          <div class="dp-heatmap-label">${label}</div>
        </button>
      `;
    }).join('');

    return `
      <section class="dp-card">
        <div class="dp-card-header">
          <div class="dp-card-label">Subject Strength</div>
          <span class="dp-card-hint">Click any subject to practice</span>
        </div>
        <div class="dp-heatmap-legend">
          <span style="color:#10B981">● Strong ≥70%</span>
          <span style="color:#F59E0B">● OK 50–69%</span>
          <span style="color:#F97316">● Weak 30–49%</span>
          <span style="color:#EF4444">● Critical &lt;30%</span>
        </div>
        <div class="dp-heatmap-grid">
          ${cells}
        </div>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // WS7 — REVISION QUEUE (Doc 6 §8)
  // ════════════════════════════════════════════
  _renderRevisionQueue(heatmap, history) {
    if (!heatmap || heatmap.length === 0) return '';

    // Sort: accuracy ascending (worst first)
    const sorted = [...heatmap].sort((a, b) => a.accuracy - b.accuracy);

    // Overdue: accuracy < 40%, tests > 2
    const overdue = sorted.filter(t => t.accuracy < 40 && t.tests >= 2);
    // Today: accuracy 40–60%
    const today   = sorted.filter(t => t.accuracy >= 40 && t.accuracy < 60);
    // Tomorrow: accuracy 60–70%
    const tomorrow= sorted.filter(t => t.accuracy >= 60 && t.accuracy < 70);

    if (overdue.length === 0 && today.length === 0 && tomorrow.length === 0) return '';

    const renderGroup = (label, items, color) => {
      if (items.length === 0) return '';
      return `
        <div class="dp-revision-group">
          <div class="dp-revision-group-label" style="color:${color}">${label}</div>
          ${items.slice(0, 3).map(t => `
            <div class="dp-revision-row">
              <div class="dp-revision-subject">${t.subject}</div>
              <div class="dp-revision-acc" style="color:${color}">${t.accuracy}%</div>
              <button class="dp-revision-btn" onclick="App.navigate('setup', {subject:'${t.subject}',mode:'section'})">
                Revise &rarr;
              </button>
            </div>
          `).join('')}
        </div>
      `;
    };

    return `
      <section class="dp-card">
        <div class="dp-card-label">Revision Queue</div>
        <p class="dp-card-desc">Auto-generated based on your accuracy. No manual planning needed.</p>
        ${renderGroup('⚠ Overdue', overdue, '#EF4444')}
        ${renderGroup('Today', today, '#F59E0B')}
        ${renderGroup('Tomorrow', tomorrow, '#10B981')}
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // WS8 — WEEKLY TIMELINE (Doc 6 §12)
  // ════════════════════════════════════════════
  _renderWeeklyTimeline(recent) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const todayDay = today.getDay();

    // Build a set of days practiced (within last 7 days)
    const practicedDays = new Set();
    if (recent && recent.length > 0) {
      recent.forEach(entry => {
        if (entry.date) {
          const d = new Date(entry.date);
          const diff = Math.round((today - d) / 86400000);
          if (diff >= 0 && diff < 7) {
            const day = d.getDay();
            practicedDays.add(day);
          }
        }
      });
    }

    // Build 7-day row starting from Monday
    const ordered = [1,2,3,4,5,6,0]; // Mon→Sun
    const cells = ordered.map(d => {
      const practiced = practicedDays.has(d);
      const isToday   = d === todayDay;
      return `
        <div class="dp-week-cell ${practiced ? 'dp-week-cell--done' : ''} ${isToday ? 'dp-week-cell--today' : ''}">
          <div class="dp-week-day">${days[d]}</div>
          <div class="dp-week-dot">${practiced ? '✓' : '—'}</div>
        </div>
      `;
    }).join('');

    const practicedCount = practicedDays.size;

    return `
      <section class="dp-card">
        <div class="dp-card-header">
          <div class="dp-card-label">This Week</div>
          <span class="dp-card-hint">${practicedCount}/7 days practiced</span>
        </div>
        <div class="dp-week-row">
          ${cells}
        </div>
        ${practicedCount === 0 ? `<p class="dp-week-empty">No practice recorded this week. Start today!</p>` : ''}
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // PERFORMANCE — 3 metrics (Doc 6 §11)
  // ════════════════════════════════════════════
  _renderPerformance(avgScore, history, impRate) {
    // Speed: avg time per question across last 5 tests
    const recent5 = history.slice(-5);
    let avgTimePerQ = 0;
    if (recent5.length > 0) {
      const times = recent5.filter(t => t.timeTaken && t.questions).map(t => t.timeTaken / t.questions);
      avgTimePerQ = times.length > 0 ? Math.round(times.reduce((a,b) => a+b, 0) / times.length) : 0;
    }

    // Consistency: % of weeks with 3+ tests (last 4 weeks)
    const fourWeeksAgo = Date.now() - 28 * 86400000;
    const recentH = history.filter(t => new Date(t.date || t.timestamp).getTime() > fourWeeksAgo);
    const consistency = recentH.length >= 12 ? 'High' : recentH.length >= 6 ? 'Medium' : 'Low';
    const consistencyColor = recentH.length >= 12 ? '#10B981' : recentH.length >= 6 ? '#F59E0B' : '#EF4444';

    const speedLabel = avgTimePerQ === 0 ? '—' :
                       avgTimePerQ <= 45 ? 'Fast' :
                       avgTimePerQ <= 75 ? 'Good' : 'Slow';
    const speedColor = avgTimePerQ === 0 ? 'var(--text-muted)' :
                       avgTimePerQ <= 45 ? '#10B981' :
                       avgTimePerQ <= 75 ? '#F59E0B' : '#EF4444';

    const accColor = avgScore >= 75 ? '#10B981' : avgScore >= 55 ? '#F59E0B' : '#EF4444';

    return `
      <section class="dp-card">
        <div class="dp-card-header">
          <div class="dp-card-label">Performance</div>
          <button class="dp-link-btn" onclick="App.navigate('analytics')">View Details &rarr;</button>
        </div>
        <div class="dp-perf-grid">
          <div class="dp-perf-item">
            <div class="dp-perf-value" style="color:${accColor}">${avgScore}%</div>
            <div class="dp-perf-label">Accuracy</div>
            <div class="dp-perf-sub">${impRate >= 0 ? '+' : ''}${impRate}% vs last week</div>
          </div>
          <div class="dp-perf-item">
            <div class="dp-perf-value" style="color:${speedColor}">${speedLabel}</div>
            <div class="dp-perf-label">Speed</div>
            <div class="dp-perf-sub">${avgTimePerQ > 0 ? `~${avgTimePerQ}s per question` : 'No data yet'}</div>
          </div>
          <div class="dp-perf-item">
            <div class="dp-perf-value" style="color:${consistencyColor}">${consistency}</div>
            <div class="dp-perf-label">Consistency</div>
            <div class="dp-perf-sub">${recentH.length} tests in 4 weeks</div>
          </div>
        </div>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // ACHIEVEMENTS (Doc 6 §14)
  // ════════════════════════════════════════════
  _renderAchievements(history, streak, bestScore) {
    const totalQ = history.reduce((s, t) => s + (t.questions || 0), 0);
    const bteupPapers = (Storage.getBTEUPHistory?.() || []).length;

    const badges = [
      { id: 'first',    icon: '▶', label: 'First Mock',        earned: history.length >= 1,         sub: history.length >= 1 ? 'Unlocked' : '0/1 tests' },
      { id: 'q100',     icon: '◈', label: '100 Questions',     earned: totalQ >= 100,               sub: totalQ >= 100 ? 'Unlocked' : `${totalQ}/100` },
      { id: 'q500',     icon: '◈', label: '500 Questions',     earned: totalQ >= 500,               sub: totalQ >= 500 ? 'Unlocked' : `${totalQ}/500` },
      { id: 'streak7',  icon: '★', label: '7-Day Streak',      earned: streak.best >= 7,            sub: streak.best >= 7 ? 'Unlocked' : `Best: ${streak.best} days` },
      { id: 'streak30', icon: '★', label: '30-Day Streak',     earned: streak.best >= 30,           sub: streak.best >= 30 ? 'Unlocked' : `Best: ${streak.best} days` },
      { id: 'acc90',    icon: '▲', label: '90% Accuracy',      earned: bestScore >= 90,             sub: bestScore >= 90 ? 'Unlocked' : `Best: ${bestScore}%` },
      { id: 'tests10',  icon: '◎', label: '10 Tests',          earned: history.length >= 10,        sub: history.length >= 10 ? 'Unlocked' : `${history.length}/10` },
      { id: 'bteup',    icon: '▦', label: 'Paper Generator',   earned: bteupPapers >= 1,            sub: bteupPapers >= 1 ? 'Unlocked' : 'Generate 1 paper' },
    ];

    const earnedCount = badges.filter(b => b.earned).length;

    return `
      <section class="dp-card">
        <div class="dp-card-header">
          <div class="dp-card-label">Achievements</div>
          <span class="dp-card-hint">${earnedCount} / ${badges.length} unlocked</span>
        </div>
        <div class="dp-achievements-grid">
          ${badges.map(b => `
            <div class="dp-badge ${b.earned ? 'dp-badge--earned' : 'dp-badge--locked'}" title="${b.label}">
              <div class="dp-badge-icon">${b.icon}</div>
              <div class="dp-badge-label">${b.label}</div>
              <div class="dp-badge-sub">${b.sub}</div>
            </div>
          `).join('')}
        </div>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // WS9 — RECENT ACTIVITY (Doc 6 §15)
  // ════════════════════════════════════════════
  _renderRecentActivity(history) {
    if (!history || history.length === 0) return '';

    const items = history.slice(-6).reverse().map(t => {
      const date = t.date ? new Date(t.date) : new Date(t.timestamp || Date.now());
      const diff = Math.round((Date.now() - date.getTime()) / 60000); // minutes
      const timeAgo = diff < 60 ? `${diff}m ago` :
                      diff < 1440 ? `${Math.round(diff/60)}h ago` :
                      `${Math.round(diff/1440)}d ago`;

      const score = t.score ?? t.accuracy ?? 0;
      const icon  = t.type === 'bteup' ? '▦' : '◎';
      const label = t.type === 'bteup'
        ? `Generated BTEUP Paper`
        : `Completed ${t.name || t.config?.name || 'Mock Test'}`;
      const meta  = t.type === 'bteup'
        ? `${t.semester ? t.semester + ' Sem' : ''} · ${timeAgo}`
        : `${score}% · ${t.questions || 0}Q · ${timeAgo}`;
      const color = t.type === 'bteup' ? '#8B5CF6' :
                    score >= 75 ? '#10B981' : score >= 55 ? '#F59E0B' : '#EF4444';

      return `
        <div class="dp-activity-row">
          <div class="dp-activity-icon" style="color:${color}">${icon}</div>
          <div class="dp-activity-body">
            <div class="dp-activity-label">${label}</div>
            <div class="dp-activity-meta">${meta}</div>
          </div>
          <div class="dp-activity-score" style="color:${color}">${t.type === 'bteup' ? '' : score + '%'}</div>
        </div>
      `;
    }).join('');

    return `
      <section class="dp-card">
        <div class="dp-card-header">
          <div class="dp-card-label">Recent Activity</div>
          <button class="dp-link-btn" onclick="App.navigate('analytics')">View all &rarr;</button>
        </div>
        <div class="dp-activity-list">
          ${items}
        </div>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // WS10 — EMPTY STATE (Doc 6 §18)
  // ════════════════════════════════════════════
  _renderEmptyState(username) {
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    return `
      <div class="dp-empty-state">
        <div class="dp-empty-welcome">
          <div class="dp-empty-greet">${greet}, ${username}.</div>
          <h2 class="dp-empty-title">Your study workspace is ready.</h2>
          <p class="dp-empty-sub">
            Complete your first mock test to unlock personalized insights,
            AI coaching, weakness detection, and your full study dashboard.
          </p>
        </div>
        <div class="dp-empty-steps">
          <div class="dp-empty-step">
            <div class="dp-empty-step-num">1</div>
            <div>
              <div class="dp-empty-step-title">Choose your exam</div>
              <div class="dp-empty-step-desc">SSC, Railway, Banking, UPSC, or BTEUP</div>
            </div>
          </div>
          <div class="dp-empty-step">
            <div class="dp-empty-step-num">2</div>
            <div>
              <div class="dp-empty-step-title">Take your first test</div>
              <div class="dp-empty-step-desc">Any length — even 10 questions counts</div>
            </div>
          </div>
          <div class="dp-empty-step">
            <div class="dp-empty-step-num">3</div>
            <div>
              <div class="dp-empty-step-title">See your workspace</div>
              <div class="dp-empty-step-desc">AI identifies what to study next</div>
            </div>
          </div>
        </div>
        <div class="dp-empty-actions">
          <button class="dp-btn dp-btn--primary" onclick="App.navigate('board')">Choose Your Exam &rarr;</button>
          <button class="dp-btn dp-btn--outline" onclick="App.navigate('setup')">Take a Quick Test</button>
        </div>
      </div>
    `;
  },


  // ════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════
  _missionStartDaily() {
    if (window.DailySystem?.isDailyDone?.()) {
      window.Helpers?.showToast?.('Daily challenge already completed today!', 'info');
      return;
    }
    App.navigate('setup', { preset: 'daily-challenge', daily: '1' });
  },

  _resumeTest() {
    const t = Storage.getCurrentTest?.();
    if (t) {
      App.navigate('test');
    } else {
      App.navigate('setup');
    }
  },

  _grade(score) {
    if (score >= 90) return { label:'A+', color:'#10B981', bg:'rgba(16,185,129,0.12)' };
    if (score >= 80) return { label:'A',  color:'#3B82F6', bg:'rgba(59,130,246,0.12)' };
    if (score >= 70) return { label:'B+', color:'#8B5CF6', bg:'rgba(139,92,246,0.12)' };
    if (score >= 60) return { label:'B',  color:'#F59E0B', bg:'rgba(245,158,11,0.12)' };
    if (score >= 40) return { label:'C',  color:'#F97316', bg:'rgba(249,115,22,0.12)' };
    return              { label:'D',  color:'#EF4444', bg:'rgba(239,68,68,0.12)' };
  },


  // ════════════════════════════════════════════
  // Doc 9: DAILY MISSIONS (§6)
  // ════════════════════════════════════════════
  _renderDailyMissions() {
    if (typeof MissionEngine === 'undefined') return '';

    const missions = MissionEngine.getDailyMissions();
    if (!missions || missions.length === 0) return '';

    const stats = MissionEngine.getStats();
    const phase = stats.monthlyPhase;

    const missionRows = missions.map(m => {
      const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
      const color = m.done ? '#10B981' : 'var(--primary)';

      return `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-light)">
          <div style="font-size:20px;width:28px;text-align:center;flex-shrink:0;opacity:${m.done?'0.5':'1'}">${m.done ? '✓' : m.icon}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:13.5px;font-weight:${m.done?'600':'700'};color:${m.done?'var(--text-muted)':'var(--text-primary)'};font-family:var(--font-display);${m.done?'text-decoration:line-through':''}">
              ${m.label}
            </div>
            <div style="margin-top:4px;height:4px;background:var(--bg-nested);border-radius:var(--radius-full);overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${color};border-radius:var(--radius-full);transition:width 0.4s ease"></div>
            </div>
          </div>
          <div style="font-size:11px;font-weight:700;color:${m.done?'#10B981':'var(--text-muted)'};flex-shrink:0">
            ${m.done ? 'Done' : `${m.progress}/${m.target}`}
          </div>
          ${!m.done && m.xp ? `<span style="font-size:10px;font-weight:700;color:var(--primary);background:var(--primary-bg);padding:2px 6px;border-radius:var(--radius-full)">+${m.xp}XP</span>` : ''}
        </div>
      `;
    }).join('');

    return `
      <section class="dp-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div class="dp-card-label">Daily Missions</div>
          <span style="font-size:11px;font-weight:700;color:${stats.dailyAllDone?'#10B981':'var(--text-muted)'}">${stats.dailyCompleted}/${stats.dailyTotal} ${stats.dailyAllDone?'✓ Complete':''}</span>
        </div>
        ${phase ? `<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">${phase.icon} ${phase.name} Phase — ${phase.desc.split('—')[0]}</div>` : ''}
        ${missionRows}
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // Doc 9: CHURN RE-ENGAGEMENT (§25)
  // Gentle, not guilt-inducing.
  // ════════════════════════════════════════════
  // ════════════════════════════════════════════
  // Doc 18: LEARNING INTELLIGENCE CARD
  // Genome strength + top prediction + biggest concern.
  // Purely additive — links to the full report in AI Coach.
  // ════════════════════════════════════════════
  _renderIntelligenceCard() {
    if (typeof LearningIntelligence === 'undefined') return '';

    const genome = LearningIntelligence.getGenome();
    if (!genome.ready) return '';

    const preds = LearningIntelligence.getPredictions();
    const report = LearningIntelligence.generateDailyReport();

    const gColor = genome.overall >= 70 ? '#10B981' : genome.overall >= 45 ? '#F59E0B' : '#EF4444';

    // Strongest + weakest genome traits
    const sorted = [...genome.indicators].sort((a, b) => b.score - a.score);
    const top = sorted[0];
    const low = sorted[sorted.length - 1];

    // A "concern" section from the daily report, if any
    const concern = (report.sections || []).find(s => s.title === 'Needs Attention' || s.title === 'Forgetting Risk');

    const predLine = preds.scoreRange
      ? `Next mock likely <strong style="color:var(--text-primary)">${preds.scoreRange.low}–${preds.scoreRange.high}%</strong> (${preds.scoreRange.confidence} confidence)`
      : '';

    return `
      <section class="dp-card" style="border-left:3px solid ${gColor}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div class="dp-card-label" style="color:${gColor};margin:0">🧬 Learning Genome</div>
          <div style="font-size:22px;font-weight:800;font-family:var(--font-display);color:var(--text-primary)">${genome.overall}<span style="font-size:12px;color:var(--text-muted)">/100</span></div>
        </div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin:0 0 10px">
          Strongest: <strong style="color:var(--text-primary)">${top.label}</strong> (${top.score}). Focus area: <strong style="color:var(--text-primary)">${low.label}</strong> (${low.score}).
          ${predLine ? `<br>${predLine}.` : ''}
        </p>
        ${concern ? `<div style="padding:8px 12px;background:var(--bg-nested);border-radius:var(--radius-md);font-size:12px;color:var(--text-muted);margin-bottom:12px">${concern.icon} ${concern.body}</div>` : ''}
        <button class="dp-btn dp-btn--outline" onclick="App.navigate('coach', {tab:'insights'})">
          View Full Intelligence Report &rarr;
        </button>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // Doc 19: COGNITIVE BEHAVIOUR CARD
  // Behaviour score + DNA tags + trend vs past self.
  // ════════════════════════════════════════════
  _renderBehaviourCard() {
    if (typeof CognitiveBehaviour === 'undefined') return '';

    const dna = CognitiveBehaviour.getBehaviourDNA();
    if (!dna.ready) return '';

    const changes = CognitiveBehaviour.getBehaviourChanges();
    const predictions = CognitiveBehaviour.predictBehaviour();

    const score = dna.behaviourScore;
    const sColor = score == null ? 'var(--primary)' : score >= 70 ? '#10B981' : score >= 45 ? '#F59E0B' : '#EF4444';

    const tags = dna.tags.map(t => `
      <span style="display:inline-block;padding:4px 10px;background:var(--bg-nested);border-radius:var(--radius-full);font-size:11.5px;font-weight:600;color:var(--text-secondary);margin:0 6px 6px 0">${t}</span>
    `).join('');

    // Most significant change vs past self (§15/§17)
    const change = changes[0];
    const changeLine = change
      ? `<div style="padding:8px 12px;background:var(--bg-nested);border-radius:var(--radius-md);font-size:12px;color:var(--text-muted);margin-bottom:12px">
           ${change.direction === 'improved' ? '📈' : '📉'} ${change.metric} ${change.direction} (${change.from} → ${change.to}). ${change.recommendation}
         </div>`
      : '';

    // Top behaviour prediction
    const pred = predictions[0];
    const predLine = pred
      ? `<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px">🔮 Likely next mock: <strong style="color:var(--text-primary)">${pred.risk}</strong> (${pred.likelihood}%, ${pred.confidence} confidence)</div>`
      : '';

    return `
      <section class="dp-card" style="border-left:3px solid ${sColor}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div class="dp-card-label" style="color:${sColor};margin:0">🧠 Behaviour Profile</div>
          ${score != null ? `<div style="font-size:22px;font-weight:800;font-family:var(--font-display);color:var(--text-primary)">${score}<span style="font-size:12px;color:var(--text-muted)">/100</span></div>` : ''}
        </div>
        <div style="margin-bottom:12px">${tags}</div>
        ${changeLine}
        ${predLine}
        <button class="dp-btn dp-btn--outline" onclick="App.navigate('coach', {tab:'insights'})">
          See Behaviour Coaching &rarr;
        </button>
      </section>
    `;
  },


  _renderChurnCard() {
    if (typeof MissionEngine === 'undefined') return '';

    const signals = MissionEngine.getChurnSignals();
    if (signals.length === 0) return '';

    // Show only the highest severity signal
    const signal = signals.sort((a, b) => {
      const sev = { high: 3, medium: 2, low: 1 };
      return (sev[b.severity] || 0) - (sev[a.severity] || 0);
    })[0];

    const colors = {
      high:   { border: '#F59E0B', bg: 'rgba(245,158,11,0.06)' },
      medium: { border: '#3B82F6', bg: 'rgba(59,130,246,0.06)' },
      low:    { border: 'var(--border-strong)', bg: 'var(--bg-nested)' }
    };
    const c = colors[signal.severity] || colors.low;

    return `
      <section class="dp-card" style="border-left:3px solid ${c.border};background:${c.bg}">
        <div class="dp-card-label" style="color:${c.border};margin-bottom:8px">Welcome Back</div>
        <p style="font-size:13.5px;color:var(--text-secondary);line-height:1.6;margin:0 0 12px">${signal.message}</p>
        <button class="dp-btn dp-btn--outline" onclick="App.navigate('${signal.action.page}', ${JSON.stringify(signal.action.params || {})})">
          ${signal.action.label} &rarr;
        </button>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // Doc 9: PROGRESS TIMELINE (§27E)
  // Unified chronological feed
  // ════════════════════════════════════════════
  _renderProgressTimeline() {
    if (typeof EventBus === 'undefined') return '';

    const timeline = EventBus.getTimeline(15);
    if (timeline.length === 0) return '';

    const eventIcons = {
      mock_completed:       '📝',
      revision_completed:   '📖',
      flashcard_reviewed:   '🃏',
      paper_generated:      '📄',
      achievement_unlocked: '🏆',
      daily_mission_done:   '✅',
      streak_extended:      '🔥',
      level_up:             '⬆️'
    };

    const eventLabels = {
      mock_completed: d => `Completed ${d.examName || 'Mock Test'} — ${d.accuracy || 0}%`,
      revision_completed: d => `Completed revision — ${d.subject || 'General'}`,
      flashcard_reviewed: () => 'Reviewed flashcard',
      paper_generated: d => `Generated ${d.examType || 'BTEUP'} paper`,
      achievement_unlocked: d => `Achievement: ${d.title || 'Unlocked'}`,
      daily_mission_done: d => `Mission: ${d.label || 'Completed'}`,
      streak_extended: d => `Streak extended to ${d.count || 0} days`,
      level_up: d => `Leveled up to ${d.title || 'new tier'}`
    };

    // Group by day
    const grouped = {};
    timeline.forEach(e => {
      const dateStr = new Date(e.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(e);
    });

    let html = '';
    Object.entries(grouped).forEach(([date, entries]) => {
      html += `<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);padding:10px 0 4px">${date}</div>`;
      entries.forEach(e => {
        const icon = eventIcons[e.event] || '•';
        const labelFn = eventLabels[e.event];
        const label = labelFn ? labelFn(e.data || {}) : e.event.replace(/_/g, ' ');
        const time = new Date(e.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        html += `
          <div style="display:flex;align-items:center;gap:10px;padding:6px 0">
            <span style="font-size:16px;width:22px;text-align:center;flex-shrink:0">${icon}</span>
            <span style="flex:1;font-size:13px;color:var(--text-secondary)">${label}</span>
            <span style="font-size:11px;color:var(--text-muted);flex-shrink:0">${time}</span>
          </div>
        `;
      });
    });

    return `
      <section class="dp-card">
        <div class="dp-card-label" style="margin-bottom:8px">Progress Timeline</div>
        ${html}
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // Doc 20 — MISTAKE DNA CARD
  // ════════════════════════════════════════════
  _renderMistakeDNACard() {
    if (typeof MistakeDNA === 'undefined') return '';
    const snaps = MistakeDNA._getSnapshots();
    if (snaps.length === 0) return '';

    const latest = snaps[snaps.length - 1];
    const repeats = MistakeDNA.getRepeatMistakes();
    const recovery = MistakeDNA.getRecoveryScore();

    // Dominant cause from last test
    const dominantCause = latest.dominantCause;
    const causeMeta = dominantCause ? MistakeDNA.CAUSE_META[dominantCause] : null;

    // Recovery gauge colour
    const recColor = recovery.ready
      ? (recovery.recoveryRate >= 66 ? '#10B981' : recovery.recoveryRate >= 33 ? '#F59E0B' : '#EF4444')
      : '#6B7280';

    // Persistent weaknesses (top 3)
    const weakRows = repeats.slice(0, 3).map(r => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid var(--border)">
        <span style="font-size:12px;color:var(--text-primary);font-weight:600">${r.topic}</span>
        <span style="font-size:10px;font-weight:700;color:${r.color};background:${r.color}15;padding:2px 8px;border-radius:999px">${r.label} ×${r.count}</span>
      </div>
    `).join('');

    return `
      <section class="dp-card" style="border-left:3px solid #EF4444">
        <div class="dp-card-label" style="color:#EF4444">💧 Mistake DNA</div>

        ${causeMeta ? `
          <div style="display:flex;align-items:center;gap:10px;margin:8px 0">
            <div style="width:8px;height:8px;border-radius:50%;background:${causeMeta.color};flex-shrink:0"></div>
            <div>
              <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${causeMeta.label}</div>
              <div style="font-size:11px;color:var(--text-muted)">Biggest leak last test · ${latest.recoverableMarks || 0} marks recoverable</div>
            </div>
          </div>
        ` : ''}

        ${recovery.ready ? `
          <div style="margin:10px 0">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:11px;font-weight:600;color:var(--text-muted)">Recovery Score</span>
              <span style="font-size:11px;font-weight:700;color:${recColor}">${recovery.recoveryRate}%</span>
            </div>
            <div style="height:6px;background:var(--surface-elevated);border-radius:999px;overflow:hidden">
              <div style="width:${recovery.recoveryRate}%;height:100%;background:${recColor};border-radius:999px;transition:width .6s ease"></div>
            </div>
            <div style="font-size:10px;color:var(--text-muted);margin-top:3px">${recovery.recovered} of ${recovery.tracked} weak subjects recovered</div>
          </div>
        ` : ''}

        ${weakRows ? `
          <div style="margin-top:8px">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:4px">Persistent Weaknesses</div>
            ${weakRows}
          </div>
        ` : ''}

        ${typeof CorrectionEngine !== 'undefined' ? (() => {
          const rx = CorrectionEngine.getDailyPrescription();
          if (!rx) return '';
          return `
            <div style="margin-top:10px;padding:8px;background:var(--surface-elevated);border-radius:8px">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#8B5CF6;margin-bottom:4px">💊 Today's Correction</div>
              <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${rx.prescription.summaryLine}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Expected: +${rx.expectedOutcome.marksGain} marks · ${rx.expectedOutcome.probability}% probability</div>
            </div>
          `;
        })() : ''}

        ${!causeMeta && !recovery.ready && repeats.length === 0 ? `
          <p style="font-size:12px;color:var(--text-muted);margin:8px 0">Take more tests to build your Mistake DNA profile.</p>
        ` : ''}
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // Doc 21 — RECOVERY PASSPORT CARD
  // ════════════════════════════════════════════
  _renderRecoveryPassportCard() {
    if (typeof CorrectionEngine === 'undefined') return '';

    const passport = CorrectionEngine.getRecoveryPassport();
    if (!passport.ready) return '';

    const stats = passport.stats;
    const score = passport.correctionScore;
    const longTerm = passport.longTermRecovery;

    // Lifecycle dots
    const dotData = [
      { label: 'Detected',   count: stats.mistake,    color: '#EF4444' },
      { label: 'Treating',   count: stats.treating,   color: '#F59E0B' },
      { label: 'Recovering', count: stats.recovering, color: '#3B82F6' },
      { label: 'Stable',     count: stats.stable,     color: '#10B981' },
      { label: 'Mastered',   count: stats.mastered,   color: '#059669' }
    ].filter(d => d.count > 0);

    const dots = dotData.map(d => `
      <div style="display:flex;align-items:center;gap:4px">
        <div style="width:8px;height:8px;border-radius:50%;background:${d.color};flex-shrink:0"></div>
        <span style="font-size:10px;color:var(--text-muted)">${d.count} ${d.label}</span>
      </div>
    `).join('');

    // Monthly recovery bars (last 4)
    let monthBars = '';
    if (longTerm.ready && longTerm.months.length > 0) {
      const recent = longTerm.months.slice(-4);
      const maxCum = Math.max(...recent.map(m => m.cumulative || 1));
      monthBars = recent.map(m => `
        <div style="display:flex;align-items:center;gap:6px;padding:2px 0">
          <span style="font-size:10px;width:52px;color:var(--text-muted);flex-shrink:0">${m.label}</span>
          <div style="flex:1;height:5px;background:var(--surface-elevated);border-radius:999px;overflow:hidden">
            <div style="width:${Math.round(((m.cumulative || 0) / maxCum) * 100)}%;height:100%;background:#10B981;border-radius:999px;transition:width .5s ease"></div>
          </div>
          <span style="font-size:10px;font-weight:700;color:#10B981;width:24px;text-align:right">+${m.cumulative}</span>
        </div>
      `).join('');
    }

    return `
      <section class="dp-card" style="border-left:3px solid #059669">
        <div class="dp-card-label" style="color:#059669">🛂 Recovery Passport</div>

        ${score.ready ? `
          <div style="display:flex;align-items:center;gap:10px;margin:6px 0 10px">
            <div style="width:44px;height:44px;border-radius:50%;border:3px solid ${score.score >= 70 ? '#10B981' : score.score >= 40 ? '#F59E0B' : '#EF4444'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <span style="font-size:15px;font-weight:800;color:var(--text-primary)">${score.score}</span>
            </div>
            <div>
              <div style="font-size:12px;font-weight:700;color:var(--text-primary)">Correction Score</div>
              <div style="font-size:10px;color:var(--text-muted)">${score.summary.recovered} recovered · ${score.summary.treating} treating · ${score.summary.mastered} mastered</div>
            </div>
          </div>
        ` : ''}

        ${dots ? `
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin:6px 0">
            ${dots}
          </div>
        ` : ''}

        ${monthBars ? `
          <div style="margin-top:8px">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:4px">Recovered Marks</div>
            ${monthBars}
          </div>
        ` : ''}

        ${passport.active.length > 0 ? `
          <div style="margin-top:8px">
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:4px">Active Corrections (${passport.active.length})</div>
            ${passport.active.slice(0, 4).map(e => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
                <div style="display:flex;align-items:center;gap:6px">
                  <span style="font-size:12px">${e.correctionIcon}</span>
                  <span style="font-size:11px;font-weight:600;color:var(--text-primary)">${e.topic}</span>
                </div>
                <span style="font-size:9px;font-weight:700;color:${e.lifecycleColor};background:${e.lifecycleColor}15;padding:2px 6px;border-radius:999px">${e.lifecycleLabel}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // Doc 22 — LEARNING WEATHER CARD
  // ════════════════════════════════════════════
  _renderLearningWeatherCard() {
    if (typeof PredictiveEngine === 'undefined') return '';

    const weather = PredictiveEngine.getLearningWeather();
    if (!weather.ready) return '';

    const factors = Object.values(weather.factors);
    const factorBars = factors.map(f => `
      <div style="display:flex;align-items:center;gap:6px;padding:2px 0">
        <span style="font-size:11px;width:16px">${f.icon}</span>
        <span style="font-size:10px;width:56px;color:var(--text-muted)">${f.label}</span>
        <div style="flex:1;height:5px;background:var(--surface-elevated);border-radius:999px;overflow:hidden">
          <div style="width:${f.score}%;height:100%;background:${f.score >= 70 ? '#10B981' : f.score >= 40 ? '#F59E0B' : '#EF4444'};border-radius:999px;transition:width .5s ease"></div>
        </div>
        <span style="font-size:10px;font-weight:700;color:var(--text-muted);width:28px;text-align:right">${f.score}</span>
      </div>
    `).join('');

    return `
      <section class="dp-card" style="border-left:3px solid ${weather.color}">
        <div class="dp-card-label" style="color:${weather.color}">${weather.icon} Learning Weather</div>
        <div style="display:flex;align-items:center;gap:10px;margin:6px 0">
          <span style="font-size:28px">${weather.icon}</span>
          <div>
            <div style="font-size:14px;font-weight:800;color:var(--text-primary)">${weather.label}</div>
            <div style="font-size:11px;color:var(--text-muted)">${weather.advice}</div>
          </div>
        </div>
        <div style="margin-top:6px">${factorBars}</div>
      </section>
    `;
  },


  // ════════════════════════════════════════════
  // Doc 22 — PREDICTIONS CARD
  // ════════════════════════════════════════════
  _renderPredictionsCard() {
    if (typeof PredictiveEngine === 'undefined') return '';

    const forecast = PredictiveEngine.predictNextScore();
    const priority = PredictiveEngine.getTodaysPriority();
    const readiness = PredictiveEngine.forecastExamReadiness();
    const churn = PredictiveEngine.predictChurn();
    const monteCarlo = PredictiveEngine.monteCarloSimulation();

    if (!forecast.ready && !priority.ready) return '';

    let rows = '';

    // Score forecast
    if (forecast.ready) {
      const p = forecast.prediction;
      const trendIcon = p.trend === 'improving' ? '📈' : p.trend === 'declining' ? '📉' : '➡️';
      rows += `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:12px;font-weight:700;color:var(--text-primary)">${trendIcon} Next Score: ${p.score}% <span style="font-size:10px;font-weight:400;color:var(--text-muted)">(±${p.margin})</span></div>
            <div style="font-size:10px;color:var(--text-muted)">Range: ${p.low}% — ${p.high}%</div>
          </div>
          <span style="font-size:9px;font-weight:700;color:${p.trend === 'improving' ? '#10B981' : p.trend === 'declining' ? '#EF4444' : '#6B7280'};background:${p.trend === 'improving' ? '#10B981' : p.trend === 'declining' ? '#EF4444' : '#6B7280'}15;padding:2px 8px;border-radius:999px">${p.trend}</span>
        </div>
      `;
    }

    // Priority advisor
    if (priority.ready && priority.study) {
      rows += `
        <div style="padding:6px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:11px;font-weight:600;color:var(--text-primary)">📌 Today: Study <span style="color:#3B82F6">${priority.study}</span>${priority.skip ? ` · Skip <span style="color:var(--text-muted)">${priority.skip}</span>` : ''}</div>
          <div style="font-size:10px;color:var(--text-muted)">${priority.reason}</div>
        </div>
      `;
    }

    // Exam readiness
    if (readiness.ready) {
      const lvl = readiness.readinessLevel;
      rows += `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:11px;font-weight:600;color:var(--text-primary)">${lvl.icon} Exam Readiness: ${readiness.currentReadiness}%</div>
          <span style="font-size:9px;font-weight:700;color:${lvl.color};background:${lvl.color}15;padding:2px 8px;border-radius:999px">${lvl.label}</span>
        </div>
      `;
    }

    // Monte Carlo
    if (monteCarlo.ready) {
      rows += `
        <div style="padding:6px 0">
          <div style="font-size:11px;font-weight:600;color:var(--text-primary)">🎲 ${monteCarlo.runs} Simulations: Most likely <span style="color:#8B5CF6">${monteCarlo.mostLikely}%</span> (${monteCarlo.mostLikelyProb}% prob)</div>
          <div style="font-size:10px;color:var(--text-muted)">Range: ${monteCarlo.percentiles.p10}% — ${monteCarlo.percentiles.p90}%</div>
        </div>
      `;
    }

    // Churn risk indicator
    if (churn.ready && churn.risk !== 'low') {
      const riskColors = { critical: '#EF4444', high: '#F59E0B', medium: '#3B82F6' };
      rows += `
        <div style="margin-top:4px;padding:6px 8px;background:${riskColors[churn.risk] || '#6B7280'}10;border-radius:6px;border-left:3px solid ${riskColors[churn.risk] || '#6B7280'}">
          <div style="font-size:10px;font-weight:700;color:${riskColors[churn.risk] || '#6B7280'}">⚠️ Churn Risk: ${churn.risk.toUpperCase()}</div>
          <div style="font-size:10px;color:var(--text-muted)">${churn.insight}</div>
        </div>
      `;
    }

    return `
      <section class="dp-card" style="border-left:3px solid #8B5CF6">
        <div class="dp-card-label" style="color:#8B5CF6">🔮 Predictions</div>
        ${rows}
      </section>
    `;
  },

  // ════════════════════════════════════════════
  // Doc 23 — STUDENT DIGITAL TWIN CARD
  // ════════════════════════════════════════════
  _renderDigitalTwinCard() {
    if (typeof DigitalTwin === 'undefined') return '';

    const profile = DigitalTwin.buildProfile();
    const metrics = [
      { label: 'Focus', value: profile.behaviourState.focus, color: '#10B981', icon: '🧠' },
      { label: 'Fatigue', value: profile.mentalState.fatigue, color: '#EF4444', icon: '😴' },
      { label: 'Pressure', value: profile.mentalState.pressure, color: '#F59E0B', icon: '😰' },
      { label: 'Confidence', value: profile.confidence, color: '#3B82F6', icon: '💪' }
    ];

    const metricBars = metrics.map(m => `
      <div style="display:flex;align-items:center;gap:6px;padding:3px 0">
        <span style="font-size:11px;width:16px">${m.icon}</span>
        <span style="font-size:10px;width:64px;color:var(--text-muted)">${m.label}</span>
        <div style="flex:1;height:5px;background:var(--surface-elevated);border-radius:999px;overflow:hidden">
          <div style="width:${m.value}%;height:100%;background:${m.color};border-radius:999px;transition:width .5s ease"></div>
        </div>
        <span style="font-size:10px;font-weight:700;color:var(--text-muted);width:28px;text-align:right">${m.value}%</span>
      </div>
    `).join('');

    return `
      <section class="dp-card" style="border-left:3px solid #10B981">
        <div class="dp-card-label" style="color:#10B981">👥 Digital Twin State</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Simulated replica status: Synced</div>
        <div style="margin-top:4px">${metricBars}</div>
        <div style="margin-top:6px;font-size:10px;color:var(--text-muted);border-top:1px solid var(--border);padding-top:4px;display:flex;justify-content:space-between">
          <span>Active weaknesses: <strong>${profile.recoveryState.activeWeaknesses}</strong></span>
          <span>Recovery score: <strong>${profile.recoveryState.score}%</strong></span>
        </div>
      </section>
    `;
  },

  // ════════════════════════════════════════════
  // Doc 23 — BEST STRATEGY CARD
  // ════════════════════════════════════════════
  _renderDigitalTwinStrategyCard() {
    if (typeof DigitalTwin === 'undefined') return '';

    const opt = DigitalTwin.optimizeStrategy();
    if (!opt.ready) return '';

    const strat = opt.bestStrategy;
    const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const plan = DigitalTwin.getStudyPlan();
    const todayPlan = plan[weekday] || null;

    let planHtml = '';
    if (todayPlan && todayPlan.slots) {
      planHtml = `
        <div style="margin-top:8px;padding:6px;background:var(--surface-elevated);border-radius:6px">
          <div style="font-size:10px;font-weight:700;color:#8B5CF6;text-transform:uppercase;margin-bottom:4px">📅 ${weekday}'s Optimized Plan</div>
          ${todayPlan.slots.map(s => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:2px 0;font-size:11px">
              <span>${s.icon} ${s.type} (${s.topic})</span>
              <span style="color:var(--text-muted)">${s.time}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <section class="dp-card" style="border-left:3px solid #8B5CF6">
        <div class="dp-card-label" style="color:#8B5CF6">🎯 Best Strategy Today</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin:6px 0">
          <span style="font-size:13px;font-weight:700;color:var(--text-primary)">${strat.name}</span>
          <span style="font-size:10px;font-weight:700;color:#10B981;background:#10B98115;padding:2px 8px;border-radius:999px">Gain: +${strat.projectedGain} marks</span>
        </div>
        <p style="font-size:11px;color:var(--text-secondary);line-height:1.4">${strat.explanation}</p>
        
        <div style="margin-top:6px;font-size:10px;color:var(--text-muted);display:flex;gap:12px">
          <span>Confidence: <strong style="color:var(--text-primary)">${strat.confidence}</strong></span>
          <span>Risk: <strong style="color:${strat.risk === 'low' ? '#10B981' : strat.risk === 'medium' ? '#F59E0B' : '#EF4444'}">${strat.risk}</strong></span>
          <span>Est. Fatigue: <strong style="color:var(--text-primary)">${strat.fatigue}%</strong></span>
        </div>

        ${planHtml}
      </section>
    `;
  },

  // ════════════════════════════════════════════
  // Doc 24 — LODE DAILY DECISION CARD
  // ════════════════════════════════════════════
  _renderDailyDecisionCard() {
    if (typeof LearningOrchestrator === 'undefined') return '';

    try {
      // Check if we already have a pending/accepted decision for today (avoid duplicate generation)
      const existing = LearningOrchestrator._getHistory();
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayDecision = existing.find(d => d.timestamp && d.timestamp.startsWith(todayStr) && (d.status === 'pending' || d.status === 'accepted'));

      let res;
      if (todayDecision) {
        res = { ready: true, decision: todayDecision };
      } else {
        res = LearningOrchestrator.generateDailyDecision();
      }
      if (!res.ready || !res.decision) return '';

    const d = res.decision;
    
    // Check if it was ignored recently
    const history = LearningOrchestrator._getHistory();
    const latestIgnored = history.some(item => item.id === d.id && item.status === 'ignored');
    if (latestIgnored) return '';

    return `
      <section id="daily-decision-section" class="dp-card" style="border-left:3px solid #8B5CF6; background: linear-gradient(135deg, var(--surface) 0%, var(--surface-elevated) 100%)">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div class="dp-card-label" style="color:#8B5CF6;font-size:11px;font-weight:800;letter-spacing:.05em">🧠 TODAY'S MOST IMPORTANT ACTION</div>
          <button style="background:none;border:none;color:var(--text-muted);font-size:14px;cursor:pointer" onclick="DashboardPage.ignoreDecision('${d.id}')">✕</button>
        </div>

        <div style="margin:8px 0">
          <div style="font-size:15px;font-weight:800;color:var(--text-primary);line-height:1.3">${d.action}</div>
          <div style="display:flex;gap:12px;margin-top:6px;font-size:10px;color:var(--text-muted)">
            <span>Expected outcome: <strong style="color:#10B981">+${d.expectedGain} marks</strong></span>
            <span>Confidence Index: <strong style="color:var(--text-primary)">${d.confidence * 10}%</strong></span>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary" style="padding:6px 12px;font-size:11px;background:#8B5CF6;border-color:#8B5CF6" onclick="DashboardPage.handleDecisionAction('${d.id}', '${d.actionType}', '${d.targetSubject}')">Execute Action</button>
        </div>

        <details style="margin-top:10px;font-size:11px;color:var(--text-muted);cursor:pointer">
          <summary style="font-weight:600;color:#8B5CF6">🔍 Show AI Governance Audit Trail</summary>
          <div style="margin-top:6px;padding:6px;background:var(--surface-elevated);border-radius:6px;border:1px dashed var(--border)">
            ${d.reason}
            <div style="margin-top:6px;border-top:1px solid var(--border);padding-top:4px;display:flex;justify-content:space-between;font-size:9px">
              <span>Consensus Category: <strong>${d.consensus}</strong></span>
              <span>LODE Timestamp: <strong>${new Date(d.timestamp).toLocaleTimeString()}</strong></span>
            </div>
          </div>
        </details>
      </section>
    `;
    } catch (e) {
      console.warn('[Dashboard] Daily Decision card error:', e.message);
      return '';
    }
  },

  handleDecisionAction(id, type, subject) {
    if (typeof LearningOrchestrator !== 'undefined') {
      LearningOrchestrator.recordUserAction(id, 'accepted');
    }
    if (type === 'mock') {
      App.navigate('setup');
    } else {
      App.navigate('setup', { subject, mode: 'section' });
    }
  },

  ignoreDecision(id) {
    if (typeof LearningOrchestrator !== 'undefined') {
      LearningOrchestrator.recordUserAction(id, 'ignored');
    }
    const el = document.getElementById('daily-decision-section');
    if (el) el.style.display = 'none';
    Helpers.showToast('Decision dismissed. Learning model adjusted.', 'info');
  }
};

window.DashboardPage = DashboardPage;
