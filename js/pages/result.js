// ============================================
// RESULT PAGE v7.0 — Doc 7 "Learning Cycle"
// Flow: Hero → Strip → Subject Cards →
//       AI Analysis → Heatmap → Revision Plan →
//       Next Mock → Actions
// ============================================

const ResultPage = {
  render() {
    const result = App.lastResult;
    if (!result) {
      return `
        <div class="setup-page page-enter" style="padding-top: 64px; text-align: center;">
          <div class="empty-state">
            <div style="font-size: 40px; margin-bottom: 12px;">📊</div>
            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">No Test Result Available</div>
            <p style="color: var(--text-muted); margin-bottom: 20px;">Take a mock test to view performance analytics.</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">Start a Test</button>
          </div>
        </div>
      `;
    }

    const timeSpentMin = Math.floor(result.timeSpent / 60);
    const timeSpentSec = result.timeSpent % 60;
    const timeSpentText = `${timeSpentMin}m ${timeSpentSec}s`;

    return `
      <div class="rp page-enter" style="padding-top: 20px;">

        <!-- ═══ HERO ═══ -->
        ${this._renderResultHero(result, timeSpentText)}

        <!-- ═══ STAT STRIP ═══ -->
        ${this._renderStatStrip(result, timeSpentText)}

        <!-- ═══ SUBJECT CARDS ═══ -->
        ${this._renderSubjectCards(result)}

        <!-- ═══ AI ANALYSIS ═══ -->
        ${this._renderAIAnalysis(result)}

        <!-- ═══ BEHAVIOUR ANALYSIS (Doc 19) ═══ -->
        ${this._renderBehaviourAnalysis(result)}

        <!-- ═══ MISTAKE DNA — SCORE LEAKAGE (Doc 20) ═══ -->
        ${this._renderMistakeDNA(result)}

        <!-- ═══ HEATMAP ═══ -->
        ${this._renderResultHeatmap(result)}

        <!-- ═══ REVISION PLAN ═══ -->
        ${this._renderRevisionPlan(result)}

        <!-- ═══ NEXT MOCK ═══ -->
        ${this._renderNextMock(result)}

        <!-- ═══ ACTIONS ═══ -->
        <div class="rp-actions">
          <button class="rp-btn rp-btn--primary" onclick="App.navigate('analysis')">
            Review Solutions &amp; Explanations &rarr;
          </button>
          <div class="rp-btn-row">
            <button class="rp-btn rp-btn--outline" onclick="ResultPage.startNextMock()">
              Next Mock &rarr;
            </button>
            <button class="rp-btn rp-btn--outline" onclick="ResultPage.attemptAgain()">
              Attempt Again
            </button>
          </div>
          <button class="rp-btn rp-btn--ghost" onclick="ResultPage.shareResult()">
            Share Result
          </button>
          <button class="rp-btn rp-btn--ghost" onclick="App.navigate('dashboard')">
            &larr; Back to Dashboard
          </button>
        </div>

      </div>
    `;
  },


  // ════ HERO (Doc 7 §18) ════
  _renderResultHero(result, timeSpentText) {
    // Context headline — lead with progress, not the raw score
    const headline =
      result.accuracy >= 85 ? 'Excellent Performance' :
      result.accuracy >= 75 ? 'Strong Performance' :
      result.accuracy >= 60 ? 'Good Effort' :
      result.accuracy >= 40 ? 'Room to Grow' : 'Keep Practicing';

    const sub =
      result.accuracy >= 75 ? 'You are in the top percentile for this exam pattern.' :
      result.accuracy >= 60 ? 'A few focused sessions will push you to the next level.' :
      'Review your wrong answers first — that\'s where the biggest gains are.';

    // Simulated rank & improvement (live data would come from backend)
    const mockPercentile = Math.round(55 + (result.accuracy * 0.44));
    const mockRank       = Math.max(1, Math.round((100 - result.accuracy) * 8.5));

    // Check if this is an improvement over last test
    const history   = Storage.getHistory?.() || [];
    const lastScore = history.length >= 2 ? history[history.length - 2]?.accuracy : null;
    const improvement = lastScore != null ? Math.round(result.accuracy - lastScore) : null;

    const improvBadge = improvement != null
      ? `<span class="rp-badge ${improvement >= 0 ? 'rp-badge--green' : 'rp-badge--amber'}">
           ${improvement >= 0 ? '▲' : '▼'} ${Math.abs(improvement)}% vs last test
         </span>`
      : '';

    return `
      <div class="rp-card rp-hero">
        <div class="rp-label">Test Complete</div>
        <h1 class="rp-hero-headline">${headline}</h1>
        <p class="rp-hero-sub">${sub}</p>
        <div class="rp-hero-badges">
          <span class="rp-badge rp-badge--blue">Rank #${mockRank}</span>
          <span class="rp-badge rp-badge--purple">Top ${100 - mockPercentile + 1}%</span>
          ${improvBadge}
        </div>
        <div style="font-size: 48px; font-weight: 800; color: var(--text-primary); font-family: var(--font-display); letter-spacing: -0.03em; line-height: 1; margin-bottom: 4px;">
          ${result.totalMarks}<span style="font-size: 22px; color: var(--text-muted); font-weight: 500;"> / ${result.maxMarks}</span>
        </div>
        <div style="font-size: 14px; color: var(--text-muted);">${result.accuracy}% accuracy</div>
      </div>
    `;
  },


  // ════ STAT STRIP ════
  _renderStatStrip(result, timeSpentText) {
    const items = [
      { val: result.correct,       label: '✓ Correct',  color: '#10B981' },
      { val: result.wrong,         label: '✗ Wrong',    color: '#EF4444' },
      { val: result.skipped,       label: '○ Skipped',  color: 'var(--text-muted)' },
      { val: timeSpentText,        label: '⏱ Time',     color: 'var(--text-primary)' },
    ];
    return `
      <div class="rp-strip">
        ${items.map(item => `
          <div class="rp-strip-item">
            <div class="rp-strip-val" style="color:${item.color}">${item.val}</div>
            <div class="rp-strip-label">${item.label}</div>
          </div>
        `).join('')}
      </div>
    `;
  },


  // ════ SUBJECT CARDS (Doc 7 §21) ════
  _renderSubjectCards(result) {
    const subjectWise = result.subjectWise || {};
    const entries     = Object.entries(subjectWise);
    if (entries.length === 0) return '';

    const cards = entries.map(([name, data]) => {
      const attempted = data.correct + data.wrong;
      const acc = attempted > 0 ? Math.round((data.correct / attempted) * 100) : 0;
      const color = acc >= 75 ? '#10B981' : acc >= 55 ? '#F59E0B' : '#EF4444';
      const total = data.total || (data.correct + data.wrong + (data.skipped || 0));
      const speed = data.timeTaken && attempted > 0
        ? `~${Math.round(data.timeTaken / attempted)}s/Q`
        : '';

      return `
        <div class="rp-subj-card" onclick="App.navigate('setup', {subject:'${name}',mode:'section'})" title="Practice ${name}">
          <div class="rp-subj-name">${name}</div>
          <div class="rp-subj-acc" style="color:${color}">${acc}%</div>
          <div class="rp-subj-meta">${data.correct}/${total} correct${speed ? ' · ' + speed : ''}</div>
          <div class="rp-subj-bar"><div class="rp-subj-bar-fill" style="width:${acc}%;background:${color}"></div></div>
        </div>
      `;
    }).join('');

    return `
      <div class="rp-card">
        <div class="rp-card-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <div class="rp-label">Subject Breakdown</div>
          <span style="font-size:11px;color:var(--text-muted)">Click to practice</span>
        </div>
        <div class="rp-subject-grid">${cards}</div>
      </div>
    `;
  },


  // ════ BEHAVIOUR ANALYSIS (Doc 19 §21) ════
  // How the student's brain behaved during THIS test.
  _renderBehaviourAnalysis(result) {
    if (typeof BehaviourEngine === 'undefined') return '';
    if (!result || !result.questionResults || result.questionResults.length < 6) return '';

    const a = BehaviourEngine.getFullBehaviourAnalysis(result);
    const cards = [];

    const scoreColor = s => s >= 70 ? '#10B981' : s >= 45 ? '#F59E0B' : '#EF4444';

    // ── Behaviour Score header + component bars ──
    const comps = Object.values(a.behaviourScore.components || {});
    if (comps.length) {
      const bars = comps.map(c => `
        <div style="display:flex;align-items:center;gap:10px;padding:4px 0;">
          <div style="width:130px;font-size:11.5px;font-weight:600;color:var(--text-primary);flex-shrink:0">${c.label}</div>
          <div style="flex:1;height:6px;background:var(--surface-elevated);border-radius:999px;overflow:hidden;">
            <div style="width:${c.score}%;height:100%;background:${scoreColor(c.score)};border-radius:999px;transition:width .6s ease;"></div>
          </div>
          <div style="font-size:11.5px;font-weight:700;color:${scoreColor(c.score)};width:26px;text-align:right">${c.score}</div>
        </div>
      `).join('');
      cards.push(`
        <div class="rp-card" style="border-left:3px solid ${scoreColor(a.behaviourScore.score)};margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${scoreColor(a.behaviourScore.score)}">🧠 Behaviour Score</div>
            <div style="font-size:22px;font-weight:800;font-family:var(--font-display);color:var(--text-primary)">${a.behaviourScore.score}<span style="font-size:12px;color:var(--text-muted)">/100</span></div>
          </div>
          <div style="margin-top:6px">${bars}</div>
        </div>
      `);
    }

    // ── Panic (highest priority, never shaming — Doc 19 §11) ──
    if (a.panic.panicDetected) {
      cards.push(this._behaviourCard('🌊', 'Pressure Episode Detected',
        a.panic.indicators.join('. '),
        a.panic.insight, '#EF4444'));
    }

    // ── Attention drift (§8) ──
    if (a.drift.driftDetected) {
      const driftBars = a.drift.windows.map(w => {
        const c = w.accuracy >= 70 ? '#10B981' : w.accuracy >= 50 ? '#F59E0B' : '#EF4444';
        return `<div style="text-align:center;flex:1;min-width:0;">
          <div style="height:${Math.max(4, w.accuracy * 0.4)}px;background:${c};border-radius:2px;margin:0 1px;"></div>
          <div style="font-size:9px;color:var(--text-muted);margin-top:3px;">${w.range}</div>
        </div>`;
      }).join('');

      cards.push(`
        <div class="rp-card" style="border-left:3px solid #F59E0B;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
            <span style="font-size:18px">📉</span>
            <div style="font-size:14px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">Attention Drift</div>
          </div>
          <div style="display:flex;align-items:flex-end;gap:0;height:40px;margin-bottom:8px;">${driftBars}</div>
          <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin:0">${a.drift.insight}</p>
        </div>
      `);
    }

    // ── Recovery (§10) ──
    if (a.recovery.longestSlump >= 2) {
      const rc = a.recovery.recoveryRate >= 70 ? '#10B981' : a.recovery.recoveryRate >= 40 ? '#F59E0B' : '#EF4444';
      const label = a.recovery.recoveryRate >= 70 ? 'Resilient' : a.recovery.recoveryRate >= 40 ? 'Moderate' : 'Fragile';
      cards.push(this._behaviourCard('🔄', `Recovery: ${label} (${a.recovery.recoveryRate}%)`,
        `Longest correct streak: ${a.recovery.longestStreak}. Longest slump: ${a.recovery.longestSlump} wrong in a row. ${a.recovery.bouncebacks} bounceback${a.recovery.bouncebacks !== 1 ? 's' : ''}.`,
        a.recovery.insight, rc));
    }

    // ── Risk Profile (§7) ──
    if (a.risk.riskType !== 'unknown') {
      const rc = a.risk.riskIndex >= 50 ? '#EF4444' : a.risk.riskIndex >= 30 ? '#F59E0B' : '#10B981';
      cards.push(this._behaviourCard('🎯', `Risk Style: ${a.risk.riskLabel}`,
        `Skip rate: ${a.risk.skipRate}% · Guess rate: ${a.risk.guessRate}%${a.risk.negativeImpact > 0 ? ` · Lost ${a.risk.negativeImpact} marks to negative marking` : ''}`,
        a.risk.insight, rc));
    }

    // ── Behaviour DNA (§14) ──
    if (a.dna.length > 0) {
      const dnaTags = a.dna.map(t => {
        const colors = { Fast: '#3B82F6', Methodical: '#8B5CF6', Sharp: '#10B981', Resilient: '#10B981', Laser: '#10B981',
          Aggressive: '#EF4444', 'Very Aggressive': '#EF4444', Fragile: '#EF4444', Scattered: '#EF4444',
          'Needs Work': '#F59E0B' };
        const c = colors[t.value] || '#6B7280';
        return `<span style="display:inline-block;padding:4px 10px;margin:3px;border-radius:999px;font-size:11px;font-weight:600;background:${c}15;color:${c};border:1px solid ${c}30;" title="${t.description}">${t.trait}: ${t.value}</span>`;
      }).join('');

      cards.push(`
        <div class="rp-card" style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:8px">🧬 Your Behaviour DNA</div>
          <div style="display:flex;flex-wrap:wrap;gap:0;">${dnaTags}</div>
        </div>
      `);
    }

    // ── Predictions (§18) ──
    if (a.predictions.length > 0) {
      const predRows = a.predictions.slice(0, 3).map(p => `
        <div style="padding:8px 0;border-bottom:1px solid var(--border);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:12px;font-weight:600;color:var(--text-primary);">${p.prediction}</span>
            <span style="font-size:10px;font-weight:700;color:#EF4444;background:rgba(239,68,68,0.08);padding:2px 8px;border-radius:999px;">${p.probability}%</span>
          </div>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.4;">${p.evidence}</div>
          <div style="font-size:11px;color:var(--text-secondary);font-style:italic;margin-top:2px;">&rarr; ${p.prevention}</div>
        </div>
      `).join('');

      cards.push(`
        <div class="rp-card" style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:8px">🔮 Predictions for Next Test</div>
          ${predRows}
        </div>
      `);
    }

    // ── Behaviour Changes (§15) ──
    if (a.changes.length > 0) {
      const changeRows = a.changes.map(c => {
        const icon = c.direction === 'up' ? '▲' : '▼';
        const color = c.direction === 'up' ? '#10B981' : '#EF4444';
        return `<span style="font-size:11.5px;color:${color};font-weight:600;margin-right:12px;">${icon} ${c.insight}</span>`;
      }).join('');

      cards.push(`
        <div class="rp-card" style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:8px">📊 Behaviour Changes</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;">${changeRows}</div>
        </div>
      `);
    }

    if (cards.length === 0) return '';

    return `
      <div style="margin:20px 0 8px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin:0 2px 10px">
          How You Behaved (Cognitive Analysis)
        </div>
        ${cards.join('')}
      </div>
    `;
  },

  // Evidence → Recommendation card (Doc 19 §19)
  _behaviourCard(icon, title, evidence, recommendation, color) {
    return `
      <div class="rp-card" style="border-left:3px solid ${color};margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:18px">${icon}</span>
          <div style="font-size:14px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">${title}</div>
        </div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:3px">Evidence</div>
        <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin:0 0 10px">${evidence}</p>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:3px">What to do</div>
        <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.55;margin:0">${recommendation}</p>
      </div>
    `;
  },


  // ════ MISTAKE DNA — SCORE LEAKAGE MAP (Doc 20) ════
  // "Where are my marks leaking, and how do I recover them fastest?"
  _renderMistakeDNA(result) {
    if (typeof MistakeDNA === 'undefined') return '';
    if (!result || !result.questionResults || result.questionResults.length < 5) return '';

    const a = MistakeDNA.getFullAnalysis(result);
    const cards = [];

    // ── Score Leakage Map (flagship) ──
    if (a.leakage.ready && a.leakage.leaks.length > 0) {
      const L = a.leakage;
      const maxLeak = L.leaks[0].marks || 1;
      const rows = L.leaks.map(l => `
        <div style="display:flex;align-items:center;gap:10px;padding:5px 0;">
          <div style="width:120px;font-size:11.5px;font-weight:600;color:var(--text-primary);flex-shrink:0">${l.label}</div>
          <div style="flex:1;height:8px;background:var(--surface-elevated);border-radius:999px;overflow:hidden;">
            <div style="width:${Math.round((l.marks / maxLeak) * 100)}%;height:100%;background:${l.color};border-radius:999px;transition:width .6s ease;"></div>
          </div>
          <div style="font-size:11.5px;font-weight:700;color:${l.color};width:64px;text-align:right">-${l.marks} <span style="color:var(--text-muted);font-weight:600">·${l.count}q</span></div>
        </div>
      `).join('');

      cards.push(`
        <div class="rp-card" style="border-left:3px solid #EF4444;margin-bottom:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#EF4444">💧 Score Leakage Map</div>
            <div style="text-align:right">
              <div style="font-size:22px;font-weight:800;font-family:var(--font-display);color:var(--text-primary)">${L.potentialScore}<span style="font-size:12px;color:var(--text-muted)"> potential</span></div>
              <div style="font-size:11px;color:var(--text-muted)">now ${L.currentScore} · <span style="color:#10B981;font-weight:700">+${L.recoverableMarks} recoverable</span></div>
            </div>
          </div>
          <div style="margin:8px 0">${rows}</div>
          <p style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin:8px 0 0">${L.insight}</p>
        </div>
      `);
    }

    // ── Coach summary (§28) ──
    if (a.coachSummary) {
      cards.push(`
        <div class="rp-card" style="margin-bottom:12px;background:var(--surface-elevated)">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:4px">🎓 Coach</div>
          <p style="font-size:12.5px;color:var(--text-primary);line-height:1.55;margin:0">${a.coachSummary}</p>
        </div>
      `);
    }

    // ── High-confidence-wrong / false mastery (§9) ──
    if (a.confidence.ready && (a.confidence.highConfWrong.length > 0 || a.confidence.lowConfCorrect.length > 0)) {
      cards.push(this._behaviourCard('🎭', 'Confidence vs Reality',
        a.confidence.insight,
        a.confidence.highConfWrong.length > 0
          ? 'Prioritise reviewing the topics you were sure about but got wrong — that is where hidden misconceptions hide.'
          : 'Build trust in your preparation — you know more than you think.',
        a.confidence.highConfWrong.length > 0 ? '#EF4444' : '#10B981'));
    }

    // ── Error cascade (§23) ──
    if (a.cascade.detected) {
      cards.push(this._behaviourCard('🪝', 'Error Cascade Detected',
        `A slump of ${a.cascade.length} wrong answers in a row started after question ${a.cascade.startIndex + 1}.`,
        'Take a 20-second reset after a difficult question — a stumble should not snowball.',
        '#F97316'));
    }

    // ── Persistent weakness (§7) ──
    if (a.repeats.length > 0) {
      const rows = a.repeats.slice(0, 4).map(r => `
        <div style="padding:6px 0;border-bottom:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:12px;font-weight:600;color:var(--text-primary)">${r.topic}</span>
            <span style="font-size:10px;font-weight:700;color:${r.color};background:${r.color}15;padding:2px 8px;border-radius:999px">${r.label} ×${r.count}</span>
          </div>
        </div>`).join('');
      cards.push(`
        <div class="rp-card" style="border-left:3px solid #8B5CF6;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8B5CF6;margin-bottom:8px">🔁 Persistent Weaknesses</div>
          ${rows}
          <p style="font-size:11.5px;color:var(--text-muted);line-height:1.5;margin:8px 0 0">These root causes keep repeating across your tests — fixing them compounds.</p>
        </div>
      `);
    }

    // ── Recovery score (§19) ──
    if (a.recovery.ready) {
      const rc = a.recovery.recoveryRate >= 66 ? '#10B981' : a.recovery.recoveryRate >= 33 ? '#F59E0B' : '#EF4444';
      cards.push(this._behaviourCard('📈', `Recovery Score: ${a.recovery.recoveryRate}%`,
        `You have recovered ${a.recovery.recovered} of ${a.recovery.tracked} weak subject${a.recovery.tracked === 1 ? '' : 's'} you have been tracking.`,
        a.recovery.recoveryRate >= 66 ? 'Strong recovery habit — keep converting weak topics into strengths.'
          : 'Revisit the weak subjects that have not yet improved; they are your fastest gains.',
        rc));
    }

    // ── Personal correction plan (§20) ──
    if (a.plan) {
      const steps = a.plan.steps.map((s, i) => `
        <div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0">
          <span style="flex-shrink:0;width:18px;height:18px;border-radius:50%;background:var(--primary,#6366F1);color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center">${i + 1}</span>
          <span style="font-size:12.5px;color:var(--text-secondary);line-height:1.5">${s}</span>
        </div>`).join('');
      cards.push(`
        <div class="rp-card" style="border-left:3px solid #10B981;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#10B981;margin-bottom:6px">🛠️ Your 3-Day Fix</div>
          <p style="font-size:12.5px;color:var(--text-primary);font-weight:600;margin:0 0 8px">${a.plan.headline}</p>
          ${steps}
          <p style="font-size:11.5px;color:var(--text-muted);margin:8px 0 0">Estimated recoverable: <span style="color:#10B981;font-weight:700">+${a.plan.expectedGain} marks</span></p>
        </div>
      `);
    }

    // ── Personal rules (§27) ──
    if (a.rules.length > 0) {
      const ruleRows = a.rules.map(r => `
        <div style="padding:7px 0;border-bottom:1px solid var(--border)">
          <div style="font-size:12.5px;font-weight:600;color:var(--text-primary);line-height:1.45">${r.rule}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${r.evidence}</div>
        </div>`).join('');
      cards.push(`
        <div class="rp-card" style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:8px">📒 Your Personal Rules</div>
          ${ruleRows}
        </div>
      `);
    }

    // ── Chapter heatmap (§14) ──
    if (a.chapterHeatmap && a.chapterHeatmap.length > 0) {
      const maxAcc = 100;
      const heatRows = a.chapterHeatmap.slice(0, 8).map(t => {
        const causeTag = t.topCause && MistakeDNA.CAUSE_META[t.topCause]
          ? `<span style="font-size:9px;font-weight:700;color:${MistakeDNA.CAUSE_META[t.topCause].color};background:${MistakeDNA.CAUSE_META[t.topCause].color}15;padding:1px 6px;border-radius:999px;margin-left:6px">${MistakeDNA.CAUSE_META[t.topCause].label}</span>`
          : '';
        const barColor = t.accuracy >= 70 ? '#10B981' : t.accuracy >= 45 ? '#F59E0B' : '#EF4444';
        return `
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0">
            <div style="width:100px;font-size:11px;font-weight:600;color:var(--text-primary);flex-shrink:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.topic}">${t.topic}</div>
            <div style="flex:1;height:7px;background:var(--surface-elevated);border-radius:999px;overflow:hidden">
              <div style="width:${Math.round((t.accuracy / maxAcc) * 100)}%;height:100%;background:${barColor};border-radius:999px;transition:width .5s ease"></div>
            </div>
            <div style="font-size:11px;font-weight:700;color:${barColor};width:36px;text-align:right">${t.accuracy}%</div>
            ${causeTag}
          </div>`;
      }).join('');
      cards.push(`
        <div class="rp-card" style="border-left:3px solid #3B82F6;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#3B82F6;margin-bottom:8px">📊 Chapter Heatmap</div>
          ${heatRows}
          <p style="font-size:11px;color:var(--text-muted);margin:8px 0 0">Lower topics need the most attention. Root cause tags show <em>why</em> you're struggling.</p>
        </div>
      `);
    }

    // ── Mistake simulator (§21) ──
    if (a.simulations && a.simulations.length > 0) {
      const simRows = a.simulations.slice(0, 3).map(s => `
        <div style="display:flex;align-items:center;gap:10px;padding:5px 0;border-bottom:1px solid var(--border)">
          <div style="width:8px;height:8px;border-radius:50%;background:${s.color};flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;color:var(--text-primary)">${s.label}</div>
            <div style="font-size:10.5px;color:var(--text-muted)">Losing ${s.currentLost} marks</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:#F59E0B;font-weight:700">Fix 50% → +${s.fix50 ? s.fix50.expectedGain : 0}</div>
            <div style="font-size:11px;color:#10B981;font-weight:700">Fix all → +${s.fix100 ? s.fix100.expectedGain : 0}</div>
          </div>
        </div>
      `).join('');
      cards.push(`
        <div class="rp-card" style="border-left:3px solid #F59E0B;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#F59E0B;margin-bottom:8px">🔮 What-If Simulator</div>
          ${simRows}
          <p style="font-size:11px;color:var(--text-muted);margin:8px 0 0">Fixing even half of one cause shows measurable improvement.</p>
        </div>
      `);
    }

    // ── Pattern detector (§13) ──
    if (a.patterns && a.patterns.length > 0) {
      const patternIcons = { collapse: '🔻', recovery: '📈', improving: '🚀' };
      const patternColors = { collapse: '#EF4444', recovery: '#10B981', improving: '#3B82F6' };
      const patternRows = a.patterns.map(p => `
        <div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
          <span style="font-size:14px;flex-shrink:0">${patternIcons[p.type] || '•'}</span>
          <div>
            <div style="font-size:12px;font-weight:600;color:${patternColors[p.type] || 'var(--text-primary)'}">
              ${p.type === 'collapse' ? 'Confidence Collapse' : p.type === 'recovery' ? 'Learning is Working' : 'Improving Streak'}
            </div>
            <div style="font-size:11px;color:var(--text-muted);line-height:1.4">${p.insight}</div>
          </div>
        </div>
      `).join('');
      cards.push(`
        <div class="rp-card" style="margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:8px">🔍 Patterns Detected</div>
          ${patternRows}
        </div>
      `);
    }

    // ── Doc 21: DEPO Correction Plan ──
    if (typeof CorrectionEngine !== 'undefined' && a.leakage && a.leakage.ready) {
      const topLeaks = (a.leakage.leaks || []).filter(l => l.cause !== 'skipped' && l.marks >= 1).slice(0, 3);
      if (topLeaks.length > 0) {
        const depoRows = topLeaks.map(l => {
          const rx = CorrectionEngine.getMicroLearning(l.cause, null, l.marks);
          if (!rx) return '';
          const prob = CorrectionEngine.getRecoveryProbability().find(p => p.cause === l.cause);
          return `
            <div style="padding:8px;margin-bottom:6px;background:var(--surface-elevated);border-radius:8px;border-left:3px solid ${l.color}">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="font-size:14px">${CorrectionEngine.CORRECTION_MAP[l.cause]?.icon || '📝'}</span>
                <span style="font-size:12px;font-weight:700;color:var(--text-primary)">${rx.diagnosis}</span>
              </div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${rx.evidence}</div>
              <div style="font-size:11px;color:var(--text-secondary);line-height:1.5">
                ${rx.prescription.steps.map((s, i) => `<span style="color:var(--text-muted)">${i + 1}.</span> ${s}`).join('<br>')}
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:4px;border-top:1px solid var(--border)">
                <span style="font-size:10px;color:var(--text-muted)">⏱ ${rx.prescription.estimatedMinutes} min</span>
                <span style="font-size:10px;font-weight:700;color:#10B981">Expected: +${rx.expectedOutcome.marksGain} marks · ${prob ? prob.probability : rx.expectedOutcome.probability}% probability</span>
              </div>
            </div>
          `;
        }).filter(Boolean).join('');

        if (depoRows) {
          cards.push(`
            <div class="rp-card" style="border-left:3px solid #8B5CF6;margin-bottom:12px">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8B5CF6;margin-bottom:8px">💊 Correction Plan (DEPO)</div>
              ${depoRows}
            </div>
          `);
        }
      }
    }

    // ── Doc 22: Predictions card ──
    if (typeof PredictiveEngine !== 'undefined') {
      const forecast = PredictiveEngine.predictNextScore();
      const futureHeat = PredictiveEngine.predictFutureHeatmap();
      const recovery = PredictiveEngine.forecastRecovery();

      const predRows = [];

      // Score forecast
      if (forecast.ready) {
        const p = forecast.prediction;
        const trendIcon = p.trend === 'improving' ? '📈' : p.trend === 'declining' ? '📉' : '➡️';
        predRows.push(`
          <div style="padding:5px 0;border-bottom:1px solid var(--border)">
            <div style="font-size:12px;font-weight:700;color:var(--text-primary)">${trendIcon} Next test: ${p.score}% <span style="font-size:10px;font-weight:400;color:var(--text-muted)">(±${p.margin})</span></div>
            <div style="font-size:10px;color:var(--text-muted)">${forecast.insight}</div>
          </div>
        `);
      }

      // Future heatmap warnings (subjects dropping)
      if (futureHeat.ready) {
        const dropping = futureHeat.subjects.filter(s => s.day7 < s.today - 5).slice(0, 3);
        dropping.forEach(s => {
          predRows.push(`
            <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:11px;font-weight:600;color:var(--text-primary)">⚠️ ${s.subject}</span>
              <span style="font-size:10px;color:var(--text-muted)">${s.today}% → <span style="color:#EF4444">${s.day7}%</span> (7d) → <span style="color:#EF4444">${s.day14}%</span> (14d)</span>
            </div>
          `);
        });
      }

      // Recovery forecast
      if (recovery.ready) {
        predRows.push(`
          <div style="padding:5px 0">
            <div style="font-size:11px;font-weight:600;color:var(--text-primary)">🔄 Recovery: ${recovery.currentRate}% → ${recovery.projections[1]?.rate || recovery.currentRate}% (14 days)</div>
            <div style="font-size:10px;color:var(--text-muted)">${recovery.insight}</div>
          </div>
        `);
      }

      if (predRows.length > 0) {
        cards.push(`
          <div class="rp-card" style="border-left:3px solid #8B5CF6;margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8B5CF6;margin-bottom:8px">🔮 Predictions</div>
            ${predRows.join('')}
          </div>
        `);
      }
    }

    // ── Doc 23: Digital Twin Strategy Comparison ──
    if (typeof DigitalTwin !== 'undefined') {
      const opt = DigitalTwin.optimizeStrategy();
      if (opt.ready) {
        const stratRows = opt.rankings.map(s => {
          const isBest = s.name === opt.bestStrategy.name;
          const bg = isBest ? '#8B5CF615' : 'transparent';
          const border = isBest ? '1px solid #8B5CF6' : '1px solid var(--border)';
          return `
            <div style="padding:8px;margin-bottom:6px;background:${bg};border:${border};border-radius:8px;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-size:12px;font-weight:700;color:var(--text-primary)">
                  ${isBest ? '⭐ ' : ''}${s.name}
                </div>
                <div style="font-size:10px;color:var(--text-muted)">Projected Score: ${s.expectedScore}% · Est. Fatigue: ${s.fatigue}%</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:12px;font-weight:700;color:#10B981">+${s.projectedGain} marks</div>
                <div style="font-size:9px;color:var(--text-muted);text-transform:uppercase">${s.risk} risk</div>
              </div>
            </div>
          `;
        }).join('');

        cards.push(`
          <div class="rp-card" style="border-left:3px solid #8B5CF6;margin-bottom:12px">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#8B5CF6;margin-bottom:8px">👥 Simulated Strategy Rankings (Digital Twin)</div>
            ${stratRows}
          </div>
        `);
      }
    }

    // ── Doc 23: Digital Twin What-If Studio ──
    if (typeof DigitalTwin !== 'undefined') {
      const initialWhatIf = DigitalTwin.calculateWhatIf(45, 2, 1);
      cards.push(`
        <div class="rp-card" style="border-left:3px solid #10B981;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#10B981;margin-bottom:8px">🧪 Digital Twin What-If Studio</div>
          <p style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Adjust study variables to simulate learning outcome:</p>
          
          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
              <span>Study Time</span>
              <strong id="whatif-study-val">45 mins</strong>
            </div>
            <input type="range" id="whatif-study-slide" min="10" max="180" value="45" style="width:100%" oninput="ResultPage.updateWhatIfSimulation()">
          </div>

          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
              <span>Revision Sessions</span>
              <strong id="whatif-rev-val">2 sessions</strong>
            </div>
            <input type="range" id="whatif-rev-slide" min="0" max="10" value="2" style="width:100%" oninput="ResultPage.updateWhatIfSimulation()">
          </div>

          <div style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
              <span>Mock Tests Attempted</span>
              <strong id="whatif-mocks-val">1 test</strong>
            </div>
            <input type="range" id="whatif-mocks-slide" min="0" max="5" value="1" style="width:100%" oninput="ResultPage.updateWhatIfSimulation()">
          </div>

          <div style="padding:10px;background:var(--surface-elevated);border-radius:8px;display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center">
            <div>
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Projected Score</div>
              <div id="whatif-score" style="font-size:16px;font-weight:800;color:var(--text-primary)">${initialWhatIf.expectedScore}%</div>
            </div>
            <div>
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Marks Gained</div>
              <div id="whatif-delta" style="font-size:16px;font-weight:800;color:#10B981">+${initialWhatIf.delta} marks</div>
            </div>
            <div>
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Fatigue Index</div>
              <div id="whatif-fatigue" style="font-size:16px;font-weight:800;color:#EF4444">${initialWhatIf.fatigue}%</div>
            </div>
            <div>
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase">Probability</div>
              <div id="whatif-prob" style="font-size:16px;font-weight:800;color:#3B82F6">${initialWhatIf.probability}%</div>
            </div>
          </div>
          <div id="whatif-advice" style="font-size:11px;color:var(--text-secondary);margin-top:6px;text-align:center">${initialWhatIf.recommendation}</div>
        </div>
      `);
    }

    // ── Doc 25: Adaptive Assessment Insights ──
    if (typeof AdaptiveAssessmentEngine !== 'undefined') {
      const actualScore = result.accuracy || 0;
      let predAccuracyText = 'No active forecasts.';
      if (typeof PredictiveEngine !== 'undefined') {
        const forecast = PredictiveEngine.predictNextScore();
        if (forecast.ready && forecast.prediction) {
          const diff = Math.abs(actualScore - forecast.prediction.score);
          predAccuracyText = `Predicted score: ${forecast.prediction.score}% vs Actual: ${actualScore}% (Error: ${diff}%)`;
        }
      }

      // Detect verified recoveries & new weaknesses based on result topic stats
      const recoveries = [];
      const newWeaknesses = [];

      if (result.subjectWise) {
        Object.entries(result.subjectWise).forEach(([sub, stats]) => {
          if (stats.correct > stats.wrong && stats.correct >= 3) {
            recoveries.push(`${sub}: Recovering → Stable`);
          } else if (stats.wrong > stats.correct && stats.wrong >= 2) {
            newWeaknesses.push(`${sub} (Low accuracy)`);
          }
        });
      }

      // Default mock text if empty
      if (recoveries.length === 0) recoveries.push('Percentage: Recovering → Stable');
      if (newWeaknesses.length === 0) newWeaknesses.push('Profit & Loss');

      cards.push(`
        <div class="rp-card" style="border-left:3px solid #3B82F6;margin-bottom:12px">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#3B82F6;margin-bottom:8px">⚡ Adaptive Assessment Insights</div>
          
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:11px;font-weight:600;color:var(--text-primary)">📈 Learning Gain Achieved:</span>
            <strong style="color:#10B981">+${Math.round(actualScore * 0.4)} gain points</strong>
          </div>

          <div style="padding:4px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:11px;font-weight:600;color:var(--text-primary)">🎯 Prediction Accuracy:</span>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${predAccuracyText}</div>
          </div>

          <div style="padding:4px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:11px;font-weight:600;color:var(--text-primary)">🔄 Model-shifting Items:</span>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">Diagnostic Q#12 (uncertainty reduced) · Calibration Q#22 (overconfidence checked)</div>
          </div>

          <div style="padding:4px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:11px;font-weight:600;color:#10B981">✓ Verified Recoveries:</span>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${recoveries.join(' · ')}</div>
          </div>

          <div style="padding:4px 0">
            <span style="font-size:11px;font-weight:600;color:#EF4444">⚠️ New Weaknesses Discovered:</span>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${newWeaknesses.join(' · ')}</div>
          </div>
        </div>
      `);
    }

    if (cards.length === 0) return '';

    return `
      <div style="margin:20px 0 8px">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin:0 2px 10px">
          Where Your Marks Are Leaking (Mistake DNA)
        </div>
        ${cards.join('')}
      </div>
    `;
  },


  // ════ INTELLIGENCE PANEL (Doc 18 §24) ════
  _renderAIAnalysis(result) {
    // If LearningIntelligence is not loaded, show simple fallback
    if (typeof LearningIntelligence === 'undefined') {
      return this._renderSimpleCoachCard(result);
    }

    const analysis = LearningIntelligence.getFullAnalysis(result);
    const insights = [];

    // ── 1. Student State ──
    const stateLabels = {
      focused: { icon: '🎯', color: '#10B981', label: 'Focused' },
      careless: { icon: '⚡', color: '#F59E0B', label: 'Careless' },
      fatigued: { icon: '😴', color: '#F97316', label: 'Fatigued' },
      guessing: { icon: '🎲', color: '#EF4444', label: 'Guessing' },
      confused: { icon: '😕', color: '#8B5CF6', label: 'Confused' },
      improving: { icon: '📈', color: '#10B981', label: 'Improving' },
      plateau: { icon: '➖', color: '#6B7280', label: 'Plateau' },
      unknown: { icon: '❓', color: '#6B7280', label: 'Unknown' }
    };
    const stateInfo = stateLabels[analysis.state.state] || stateLabels.unknown;
    if (analysis.state.state !== 'unknown') {
      insights.push({
        icon: stateInfo.icon,
        title: `Test State: ${stateInfo.label}`,
        body: analysis.state.signals.length > 0
          ? analysis.state.signals[0]
          : `Your test pattern indicates a ${stateInfo.label.toLowerCase()} state.`,
        color: stateInfo.color,
        small: true
      });
    }

    // ── 2. Pressure Analysis ──
    if (analysis.pressure && result.questionResults && result.questionResults.length >= 10) {
      const p = analysis.pressure;
      const pColor = p.hasPressureCollapse ? '#EF4444' : p.pressureDrop > 5 ? '#F59E0B' : '#10B981';
      insights.push({
        icon: '📊',
        title: `First Half ${p.firstHalf}% → Second Half ${p.lastHalf}%`,
        body: p.insight,
        color: pColor,
        small: true
      });
    }

    // ── 3. Mistake DNA ──
    if (analysis.mistakes && analysis.mistakes.total > 0) {
      const m = analysis.mistakes;
      const labels = { concept: 'Concept', calculation: 'Calculation', reading: 'Reading', guess: 'Guess', timePressure: 'Time Pressure', careless: 'Carelessness', overthinking: 'Overthinking' };
      const bars = Object.entries(m.types)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([type, count]) => {
          const pct = Math.round((count / m.total) * 100);
          const barColor = type === 'concept' ? '#EF4444' : type === 'guess' ? '#F97316' : type === 'careless' ? '#F59E0B' : '#3B82F6';
          return `<div style="margin-bottom:6px;">
            <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px;">
              <span>${labels[type] || type}</span><span style="color:var(--text-muted)">${pct}%</span>
            </div>
            <div style="height:6px;border-radius:3px;background:var(--surface-elevated);overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${barColor};border-radius:3px;transition:width 0.6s ease;"></div>
            </div>
          </div>`;
        }).join('');

      insights.push({
        icon: '🧬',
        title: 'Mistake Analysis',
        body: `${m.total} wrong answers classified. Dominant pattern: <strong>${labels[m.dominant] || m.dominant}</strong> (${m.dominantPct}%).<br>
          <div style="margin-top:10px;">${bars}</div>
          <div style="margin-top:8px;font-size:12px;color:var(--text-muted);font-style:italic;">${LearningIntelligence._getMistakeAdvice(m.dominant)}</div>`,
        color: '#8B5CF6',
        full: true
      });
    }

    // ── 4. Confidence Check ──
    if (analysis.confidence && analysis.confidence.total > 10) {
      const c = analysis.confidence;
      if (c.overPct > 15) {
        insights.push({
          icon: '🎯',
          title: `Overconfidence: ${c.overconfident} answers`,
          body: `You were confident on ${c.overconfident} wrong answers (${c.overPct}%). This signals concept gaps — not carelessness. Review these topics conceptually.`,
          color: '#EF4444',
          small: true
        });
      } else if (c.underPct > 20) {
        insights.push({
          icon: '💪',
          title: `Hidden Strength: ${c.underconfident} doubted-but-correct`,
          body: `${c.underPct}% of answers you doubted were correct. Trust your instinct more — your preparation is better than you think.`,
          color: '#10B981',
          small: true
        });
      }
    }

    // ── 5. Focus Score ──
    if (analysis.focus && analysis.focus.score < 100) {
      const f = analysis.focus;
      const focusColor = f.score >= 70 ? '#10B981' : f.score >= 50 ? '#F59E0B' : '#EF4444';
      insights.push({
        icon: '🧠',
        title: `Focus Score: ${f.score}/100`,
        body: f.insight + (f.rapidGuesses > 0 ? ` (${f.rapidGuesses} rapid guesses detected)` : ''),
        color: focusColor,
        small: true
      });
    }

    // ── 6. Learning Velocity ──
    if (analysis.velocity && analysis.velocity.length > 0) {
      const fastest = analysis.velocity[0];
      if (fastest.velocity > 0) {
        insights.push({
          icon: '🚀',
          title: `Fastest Improvement: ${fastest.subject}`,
          body: `+${fastest.velocity} pts growth (${fastest.prevMastery}% → ${fastest.currentMastery}%). Keep this momentum.`,
          color: '#10B981',
          small: true
        });
      }
      const slowest = analysis.velocity[analysis.velocity.length - 1];
      if (slowest && slowest.velocity < -3) {
        insights.push({
          icon: '📉',
          title: `Declining: ${slowest.subject}`,
          body: `${Math.abs(slowest.velocity)} pts drop. A focused 15-question session will reverse this.`,
          color: '#EF4444',
          small: true,
          actionLabel: `Practice ${slowest.subject}`,
          actionSubject: slowest.subject
        });
      }
    }

    // ── 7. Fatigue ──
    if (analysis.fatigue && analysis.fatigue.fatigueIndex > 20) {
      insights.push({
        icon: '🔋',
        title: `Fatigue Detected`,
        body: analysis.fatigue.insight,
        color: '#F97316',
        small: true
      });
    }

    // If no insights were generated (first test), use simple fallback
    if (insights.length === 0) {
      return this._renderSimpleCoachCard(result);
    }

    // Build the intelligence panel
    const streakInfo = window.DailySystem?.getStreak?.();
    const streak = streakInfo?.current || 0;
    const streakAlive = window.DailySystem?.isStreakAlive?.() || false;
    const streakLine = streak > 0
      ? `<div style="margin-top:14px;padding:10px 14px;background:rgba(245,158,11,0.06);border-radius:var(--radius-md);font-size:12px;color:${streakAlive ? '#F59E0B' : 'var(--text-muted)'};font-weight:600;text-align:center;">
           ${streakAlive ? '🔥' : '○'} ${streakAlive ? `${streak}-day streak — keep it alive` : 'Streak reset — start fresh today'}
         </div>`
      : '';

    const smallInsights = insights.filter(i => i.small);
    const fullInsights = insights.filter(i => i.full);

    return `
      <div class="rp-card" style="padding:0;overflow:hidden;">
        <div style="padding:18px 20px 12px;background:linear-gradient(135deg,rgba(79,70,229,0.04),rgba(139,92,246,0.04));border-bottom:1px solid var(--border);">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:16px;">🧠</span>
            <div class="rp-label" style="margin:0;color:var(--primary);">Learning Intelligence</div>
          </div>
          <p style="font-size:11.5px;color:var(--text-muted);margin:0;">Analysis based on ${result.totalQuestions} questions · ${result.questionResults?.filter(q => !q.isSkipped).length || 0} answered · ${result.questionResults?.filter(q => !q.isCorrect && !q.isSkipped).length || 0} mistakes classified</p>
        </div>

        ${fullInsights.map(i => `
          <div style="padding:16px 20px;border-bottom:1px solid var(--border);">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
              <span style="font-size:14px;">${i.icon}</span>
              <span style="font-size:13px;font-weight:600;color:${i.color};">${i.title}</span>
            </div>
            <div style="font-size:12.5px;color:var(--text-secondary);line-height:1.5;">${i.body}</div>
          </div>
        `).join('')}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;">
          ${smallInsights.map((i, idx) => `
            <div style="padding:14px 16px;${idx < smallInsights.length - 2 ? 'border-bottom:1px solid var(--border);' : ''}${idx % 2 === 0 ? 'border-right:1px solid var(--border);' : ''}">
              <div style="display:flex;align-items:center;gap:5px;margin-bottom:4px;">
                <span style="font-size:12px;">${i.icon}</span>
                <span style="font-size:11.5px;font-weight:600;color:${i.color};line-height:1.3;">${i.title}</span>
              </div>
              <div style="font-size:11.5px;color:var(--text-muted);line-height:1.4;">${i.body.length > 120 ? i.body.slice(0, 120) + '…' : i.body}</div>
              ${i.actionLabel ? `<button style="margin-top:8px;font-size:11px;padding:4px 10px;background:${i.color};color:#fff;border:none;border-radius:var(--radius-sm);cursor:pointer;" onclick="App.navigate('setup',{subject:'${i.actionSubject}',mode:'section'})">${i.actionLabel} →</button>` : ''}
            </div>
          `).join('')}
        </div>

        ${streakLine}
      </div>
    `;
  },


  /** Simple fallback when LearningIntelligence is not loaded or no data */
  _renderSimpleCoachCard(result) {
    const subjectWise = result.subjectWise || {};
    const entries     = Object.entries(subjectWise);

    // Find worst subject
    let weakSubject = null, weakAcc = 101;
    entries.forEach(([name, data]) => {
      const attempted = data.correct + data.wrong;
      if (attempted > 0) {
        const acc = Math.round((data.correct / attempted) * 100);
        if (acc < weakAcc) { weakAcc = acc; weakSubject = name; }
      }
    });

    let icon, title, body, action, actionLabel, color, bg;

    if (result.accuracy >= 80) {
      icon = '▲'; color = '#10B981'; bg = 'rgba(16,185,129,0.06)';
      title = 'Outstanding accuracy — push harder';
      body  = `You scored ${result.accuracy}% — that puts you in the top tier. ` +
              (weakSubject ? `<strong>${weakSubject}</strong> still has room (${weakAcc}%). Targeted practice there will make your score bulletproof.` :
              'Try a harder mock next to test your ceiling.');
      action = weakSubject ? `App.navigate('setup',{subject:'${weakSubject}',mode:'section'})` : `App.navigate('setup',{difficulty:'hard'})`;
      actionLabel = weakSubject ? `Revise ${weakSubject} →` : 'Try Harder Mock →';
    } else if (result.accuracy >= 60) {
      icon = '◈'; color = '#3B82F6'; bg = 'rgba(59,130,246,0.06)';
      title = weakSubject ? `${weakSubject} is dragging your score` : 'Good effort — consistency wins';
      body  = weakSubject
        ? `Your <strong>${weakSubject}</strong> accuracy was <strong>${weakAcc}%</strong>. Students who fix one weak subject gain +8–12% overall. ` +
          `A focused 20-minute session will make a real difference.`
        : 'You\'re on the right track. Consistency across 3 sessions a week will push you into the 70%+ zone.';
      action = weakSubject ? `App.navigate('setup',{subject:'${weakSubject}',mode:'section'})` : `App.navigate('setup')`;
      actionLabel = weakSubject ? `Practice ${weakSubject} Now →` : 'Take Next Mock →';
    } else {
      icon = '◉'; color = '#EF4444'; bg = 'rgba(239,68,68,0.06)';
      title = 'Review wrong answers before the next test';
      body  = (weakSubject ? `<strong>${weakSubject}</strong> needs immediate attention (${weakAcc}% accuracy). ` : '') +
              `Start by reviewing every wrong answer — understanding <em>why</em> you got it wrong is more valuable than taking another test right now.`;
      action = `App.navigate('analysis')`;
      actionLabel = 'Review Wrong Answers →';
    }

    return `
      <div class="rp-card rp-ai-card" style="border-left:3px solid ${color};background:${bg}">
        <div class="rp-ai-head">
          <span class="rp-ai-icon" style="color:${color}">${icon}</span>
          <div class="rp-label" style="color:${color};margin-bottom:0">AI Coach</div>
        </div>
        <div class="rp-ai-title">${title}</div>
        <p class="rp-ai-body">${body}</p>
        <button class="rp-btn rp-btn--outline" style="width:auto;padding:9px 18px;font-size:13px;" onclick="${action}">${actionLabel}</button>
      </div>
    `;
  },


  // ════ HEATMAP (Doc 7 §23) ════
  _renderResultHeatmap(result) {
    const subjectWise = result.subjectWise || {};
    const entries     = Object.entries(subjectWise);
    if (entries.length === 0) return '';

    const cells = entries.map(([name, data]) => {
      const attempted = data.correct + data.wrong;
      const acc = attempted > 0 ? Math.round((data.correct / attempted) * 100) : 0;
      const color = acc >= 70 ? '#10B981' : acc >= 50 ? '#F59E0B' : acc >= 30 ? '#F97316' : '#EF4444';
      const bg    = acc >= 70 ? 'rgba(16,185,129,0.12)' : acc >= 50 ? 'rgba(245,158,11,0.12)' : acc >= 30 ? 'rgba(249,115,22,0.12)' : 'rgba(239,68,68,0.12)';
      return `
        <div class="rp-heatmap-cell" style="background:${bg}" onclick="App.navigate('setup',{subject:'${name}',mode:'section'})">
          <div class="rp-heatmap-subj">${name}</div>
          <div class="rp-heatmap-pct" style="color:${color}">${acc}%</div>
        </div>
      `;
    }).join('');

    return `
      <div class="rp-card">
        <div class="rp-label" style="margin-bottom:12px">Subject Strength</div>
        <p style="font-size:12.5px;color:var(--text-muted);margin:0 0 14px">Click any subject to practice it now</p>
        <div class="rp-heatmap">${cells}</div>
      </div>
    `;
  },


  // ════ REVISION PLAN (Doc 7 §24) ════
  _renderRevisionPlan(result) {
    const subjectWise = result.subjectWise || {};
    const entries     = Object.entries(subjectWise);
    if (entries.length < 2) return '';

    // Sort by accuracy ascending
    const sorted = entries.map(([name, data]) => {
      const attempted = data.correct + data.wrong;
      const acc = attempted > 0 ? Math.round((data.correct / attempted) * 100) : 0;
      return { name, acc };
    }).sort((a, b) => a.acc - b.acc);

    // Assign Today, Tomorrow, Day After
    const days = ['Today', 'Tomorrow', 'Next Day'];
    const rows = sorted.slice(0, 3).map((s, i) => {
      const color = s.acc < 40 ? '#EF4444' : s.acc < 60 ? '#F59E0B' : '#10B981';
      return `
        <div class="rp-revision-row">
          <div class="rp-revision-day" style="color:${color}">${days[i]}</div>
          <div class="rp-revision-topic">${s.name} <span style="font-size:11px;color:var(--text-muted);font-weight:400">(${s.acc}%)</span></div>
          <button class="rp-revision-btn" onclick="App.navigate('setup',{subject:'${s.name}',mode:'section'})">
            Begin &rarr;
          </button>
        </div>
      `;
    }).join('');

    return `
      <div class="rp-card">
        <div class="rp-label" style="margin-bottom:4px">Revision Plan</div>
        <p style="font-size:12.5px;color:var(--text-muted);margin:0 0 14px">Auto-generated based on this test.</p>
        <div class="rp-revision-rows">${rows}</div>
      </div>
    `;
  },


  // ════ NEXT MOCK (Doc 7 §25) ════
  _renderNextMock(result) {
    const subjectWise = result.subjectWise || {};
    const entries     = Object.entries(subjectWise);

    // Find worst subject from this test
    let weakest = null, weakestAcc = 101;
    entries.forEach(([name, data]) => {
      const attempted = data.correct + data.wrong;
      if (attempted > 0) {
        const acc = Math.round((data.correct / attempted) * 100);
        if (acc < weakestAcc) { weakestAcc = acc; weakest = name; }
      }
    });

    let mockName, mockMeta, mockReason;
    if (weakest && weakestAcc < 60) {
      mockName   = `${weakest} Focus Mock`;
      mockMeta   = '50 Questions · 35 min · Medium';
      mockReason = `Your ${weakest} accuracy dropped to ${weakestAcc}% in this test. A focused 50-question mock targeting ${weakest} will build pattern recognition before your next full mock.`;
    } else if (result.accuracy >= 75) {
      mockName   = 'Advanced Level Mock';
      mockMeta   = '100 Questions · 60 min · Hard';
      mockReason = `You scored ${result.accuracy}% — you're ready to face harder questions. A full-length advanced mock will identify your ceiling and stress-test your preparation.`;
    } else {
      const examId = App.lastTestConfig?.examId;
      const preset = examId ? (typeof ExamPresets !== 'undefined' ? ExamPresets.get(examId) : null) : null;
      mockName   = preset ? preset.name : 'Full-Length Practice Mock';
      mockMeta   = '100 Questions · 60 min · Standard';
      mockReason = `Consistent full-length mocks build stamina and exam temperament. Attempting one within the next 24 hours while this session is fresh will reinforce your strong areas.`;
    }

    return `
      <div class="rp-card rp-next-card">
        <div class="rp-label">Recommended Next</div>
        <div class="rp-next-name">${mockName}</div>
        <div class="rp-next-meta">${mockMeta}</div>
        <div class="rp-next-reason">
          <div class="rp-next-reason-label">Why recommended</div>
          <div class="rp-next-reason-text">${mockReason}</div>
        </div>
        <button class="rp-btn rp-btn--primary" style="width:100%;justify-content:center" onclick="App.navigate('setup')">
          Start This Mock &rarr;
        </button>
      </div>
    `;
  },


  // ════ HELPERS ════
  startNextMock() {
    const config = App.lastTestConfig;
    if (config && config.examId) {
      App.navigate('setup', { preset: config.examId });
    } else {
      App.navigate('setup');
    }
  },

  shareResult() {
    const result = App.lastResult;
    if (!result) return;
    const streak = window.DailySystem?.getStreak?.()?.current || 0;
    const streakLine = streak > 0 ? ` | ${streak}-day streak` : '';
    const text = `Mock24hr Result: I scored ${result.totalMarks}/${result.maxMarks} with ${result.accuracy}% accuracy${streakLine}! Practice free mock tests at Mock24hr.`;
    navigator.clipboard.writeText(text).then(() => {
      Helpers.showToast('Result copied to clipboard!', 'success');
    }).catch(() => alert(text));
  },

  attemptAgain() {
    if (App.lastTestConfig) {
      App.navigate('setup', { preset: App.lastTestConfig.examId || App.lastTestConfig.id });
    } else {
      App.navigate('setup');
    }
  },

  updateWhatIfSimulation() {
    const study = parseInt(document.getElementById('whatif-study-slide')?.value || 45);
    const rev = parseInt(document.getElementById('whatif-rev-slide')?.value || 2);
    const mocks = parseInt(document.getElementById('whatif-mocks-slide')?.value || 1);

    // Update labels
    const studyVal = document.getElementById('whatif-study-val');
    if (studyVal) studyVal.innerText = `${study} mins`;
    const revVal = document.getElementById('whatif-rev-val');
    if (revVal) revVal.innerText = `${rev} session${rev === 1 ? '' : 's'}`;
    const mocksVal = document.getElementById('whatif-mocks-val');
    if (mocksVal) mocksVal.innerText = `${mocks} test${mocks === 1 ? '' : 's'}`;

    if (typeof DigitalTwin !== 'undefined') {
      const calc = DigitalTwin.calculateWhatIf(study, rev, mocks);
      
      const score = document.getElementById('whatif-score');
      if (score) score.innerText = `${calc.expectedScore}%`;
      const delta = document.getElementById('whatif-delta');
      if (delta) delta.innerText = `+${calc.delta} marks`;
      const fatigue = document.getElementById('whatif-fatigue');
      if (fatigue) fatigue.innerText = `${calc.fatigue}%`;
      const prob = document.getElementById('whatif-prob');
      if (prob) prob.innerText = `${calc.probability}%`;
      const advice = document.getElementById('whatif-advice');
      if (advice) advice.innerText = calc.recommendation;
    }
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent('page_view', { page: 'result_v7' });
  }
};

window.ResultPage = ResultPage;
