// ============================================
// RESULT PAGE v2.0 — Scholar Design System
// Focused, clean score breakdown, accuracy donut, sectional table, no gamification fluff
// ============================================

const ResultPage = {
  render() {
    const result = App.lastResult;
    if (!result) {
      return `
        <div class="setup-page page-enter text-center" style="padding-top: var(--space-16); text-align: center;">
          <div class="empty-state">
            <div class="empty-state-icon" style="font-size: 40px;">📊</div>
            <div class="empty-state-title" style="font-weight: 600; color: var(--text-primary); margin-top: 12px;">No Test Result Available</div>
            <p style="color: var(--text-muted); margin-bottom: var(--space-6);">Take a mock test to view performance analytics.</p>
            <button class="btn btn-primary" onclick="App.navigate('setup')">Start a Test</button>
          </div>
        </div>
      `;
    }

    const headingText = result.accuracy >= 60 ? 'Congratulations!' : 'Keep Practicing!';
    const timeSpentMin = Math.floor(result.timeSpent / 60);
    const timeSpentSec = result.timeSpent % 60;
    const timeSpentText = `${timeSpentMin}m ${timeSpentSec}s`;

    // Simulated rank and percentile for student motivation
    const mockPercentile = Math.round(55 + (result.accuracy * 0.44));
    const mockRank = Math.max(1, Math.round((100 - result.accuracy) * 8.5));

    // Donut chart calculations
    const total = result.correct + result.wrong + result.skipped;
    const correctPct = total > 0 ? (result.correct / total) * 100 : 0;
    const wrongPct = total > 0 ? (result.wrong / total) * 100 : 0;
    const skippedPct = total > 0 ? (result.skipped / total) * 100 : 0;

    // SVG dasharray properties for 3 segments (circumference of radius 50 is 314.16)
    const circ = 314.16;
    const strokeCorrect = (correctPct / 100) * circ;
    const strokeWrong = (wrongPct / 100) * circ;
    const strokeSkipped = (skippedPct / 100) * circ;

    const offsetCorrect = 0;
    const offsetWrong = strokeCorrect;
    const offsetSkipped = strokeCorrect + strokeWrong;

    // Section breakdown details
    const subjectWise = result.subjectWise || {};
    const sectionRows = Object.entries(subjectWise).map(([name, data]) => {
      const attempted = data.correct + data.wrong;
      const score = data.correct - (data.wrong * (result.negativeValue || 0.25));
      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px 16px; font-weight: 500; color: var(--text-primary); text-transform: capitalize;">${name}</td>
          <td style="padding: 12px 16px; text-align: center; color: var(--text-secondary);">${attempted} / ${data.total}</td>
          <td style="padding: 12px 16px; text-align: center; color: var(--success); font-weight: 600;">${data.correct}</td>
          <td style="padding: 12px 16px; text-align: right; color: var(--brand-primary); font-weight: 700; font-family: var(--font-mono);">${score.toFixed(1)}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="result-page page-enter" style="padding: 24px var(--sp-4) 80px; max-width: 640px; margin: 0 auto;">
        
        <!-- Score Hero Card -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 24px; text-align: center; box-shadow: var(--shadow-sm); margin-bottom: 20px;">
          <h1 style="font-size: var(--text-2xl); font-weight: var(--font-bold); color: var(--brand-primary); margin: 0 0 4px; font-family: var(--font-display);">${headingText}</h1>
          <p style="color: var(--text-secondary); font-size: var(--text-sm); margin: 0 0 16px;">Test completed successfully</p>
          
          <div style="font-size: 48px; font-weight: 800; color: var(--text-primary); font-family: var(--font-display); letter-spacing: -0.02em; margin-bottom: 8px;">
            ${result.totalMarks} <span style="font-size: var(--text-lg); color: var(--text-muted); font-weight: 500;">/ ${result.maxMarks}</span>
          </div>

          <div style="display: flex; gap: 8px; justify-content: center; margin-top: 12px;">
            <span class="badge" style="background: var(--success-light); color: var(--success); font-size: 11px; padding: 3px 10px; border-radius: var(--radius-full); font-weight: 600;">
              Better than ${mockPercentile}% students
            </span>
            <span class="badge" style="background: var(--brand-light); color: var(--brand-primary); font-size: 11px; padding: 3px 10px; border-radius: var(--radius-full); font-weight: 600;">
              Rank #${mockRank}
            </span>
          </div>
        </div>

        <!-- 4-column Stat Strip -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; text-align: center;">
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 12px 6px;">
            <div style="font-size: var(--text-lg); font-weight: 700; color: var(--success); font-family: var(--font-mono);">${result.correct}</div>
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-top: 2px;">✓ Correct</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 12px 6px;">
            <div style="font-size: var(--text-lg); font-weight: 700; color: var(--danger); font-family: var(--font-mono);">${result.wrong}</div>
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-top: 2px;">✗ Wrong</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 12px 6px;">
            <div style="font-size: var(--text-lg); font-weight: 700; color: var(--skipped); font-family: var(--font-mono);">${result.skipped}</div>
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-top: 2px;">○ Skipped</div>
          </div>
          <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 12px 6px;">
            <div style="font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); font-family: var(--font-mono); line-height: 24px;">${timeSpentText}</div>
            <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-top: 2px;">⏱ Time</div>
          </div>
        </div>

        <!-- Performance Donut Chart Card -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 24px; margin-bottom: 20px; text-align: center; box-shadow: var(--shadow-sm);">
          <div style="position: relative; width: 140px; height: 140px; margin: 0 auto 16px;">
            <svg viewBox="0 0 120 120" style="transform: rotate(-90deg); width: 100%; height: 100%;">
              <!-- Skipped segment -->
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--border-strong)" stroke-width="12"
                      stroke-dasharray="${strokeSkipped} ${circ - strokeSkipped}" stroke-dashoffset="-${offsetSkipped}" />
              <!-- Wrong segment -->
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--danger)" stroke-width="12"
                      stroke-dasharray="${strokeWrong} ${circ - strokeWrong}" stroke-dashoffset="-${offsetWrong}" />
              <!-- Correct segment -->
              <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--success)" stroke-width="12"
                      stroke-dasharray="${strokeCorrect} ${circ - strokeCorrect}" stroke-dashoffset="-${offsetCorrect}" />
            </svg>
            <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
              <div style="font-size: var(--text-2xl); font-weight: 800; color: var(--text-primary); font-family: var(--font-mono);">${result.accuracy}%</div>
              <div style="font-size: 9px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; margin-top: 1px;">Accuracy</div>
            </div>
          </div>

          <!-- Legend below chart -->
          <div style="display: flex; gap: 16px; justify-content: center; font-size: var(--text-xs); color: var(--text-secondary); font-weight: 500;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: var(--success);"></span> Correct (${Math.round(correctPct)}%)
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: var(--danger);"></span> Wrong (${Math.round(wrongPct)}%)
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: var(--border-strong);"></span> Skipped (${Math.round(skippedPct)}%)
            </div>
          </div>
        </div>

        <!-- Section-wise Breakdown Table -->
        ${sectionRows ? `
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 20px; box-shadow: var(--shadow-sm);">
          <div style="padding: 14px 16px; font-weight: 600; border-bottom: 1px solid var(--border-color); font-size: var(--text-sm); color: var(--text-primary);">Section Breakdown</div>
          <table style="width: 100%; border-collapse: collapse; font-size: var(--text-sm);">
            <thead>
              <tr style="background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); color: var(--text-muted); font-size: var(--text-xs); text-transform: uppercase; font-weight: 600;">
                <th style="padding: 10px 16px; text-align: left;">Section</th>
                <th style="padding: 10px 16px; text-align: center;">Attempted</th>
                <th style="padding: 10px 16px; text-align: center;">Correct</th>
                <th style="padding: 10px 16px; text-align: right;">Score</th>
              </tr>
            </thead>
            <tbody>
              ${sectionRows}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Comparison Strip -->
        <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 24px; box-shadow: var(--shadow-sm);">
          <div style="font-size: var(--text-xs); font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Score Comparison</div>
          
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <span style="font-size: var(--text-xs); color: var(--text-secondary); width: 80px;">Topper</span>
            <div style="flex: 1; height: 8px; background: var(--bg-secondary); border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: 89%; height: 100%; background: var(--border-strong);"></div>
            </div>
            <span style="font-size: var(--text-xs); font-weight: 600; color: var(--text-primary); width: 28px; text-align: right;">89</span>
          </div>

          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
            <span style="font-size: var(--text-xs); color: var(--text-secondary); width: 80px;">Your Score</span>
            <div style="flex: 1; height: 8px; background: var(--bg-secondary); border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: ${Math.round((result.totalMarks / result.maxMarks) * 100)}%; height: 100%; background: var(--brand-primary);"></div>
            </div>
            <span style="font-size: var(--text-xs); font-weight: 700; color: var(--brand-primary); width: 28px; text-align: right;">${Math.round(result.totalMarks)}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: var(--text-xs); color: var(--text-secondary); width: 80px;">Average</span>
            <div style="flex: 1; height: 8px; background: var(--bg-secondary); border-radius: var(--radius-full); overflow: hidden;">
              <div style="width: 64%; height: 100%; background: var(--border-strong);"></div>
            </div>
            <span style="font-size: var(--text-xs); font-weight: 600; color: var(--text-primary); width: 28px; text-align: right;">64</span>
          </div>
        </div>

        <!-- ═══ WHAT'S NEXT — Retention Loop ═══ -->
        ${this._renderWhatsNext(result)}

        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
          <button class="btn btn-primary" onclick="App.navigate('analysis')" style="width: 100%; padding: 13px 0; font-size: var(--text-base); font-weight: 600; font-family: var(--font-display); border-radius: var(--radius-md);">
            Review Solutions &amp; Explanations
          </button>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-secondary" onclick="ResultPage.startNextMock()" style="flex: 1; padding: 11px 0; font-weight: 600; border-radius: var(--radius-md);">
              Next Mock &rarr;
            </button>
            <button class="btn btn-secondary" onclick="ResultPage.attemptAgain()" style="flex: 1; padding: 11px 0; font-weight: 500; border-radius: var(--radius-md);">
              Attempt Again
            </button>
          </div>

          <button class="btn btn-ghost" onclick="App.navigate('dashboard')" style="width: 100%; margin-top: 4px; color: var(--text-muted); font-size: var(--text-sm);">
            &larr; Go to Dashboard
          </button>
        </div>

      </div>
    `;
  },

  // ── WHAT'S NEXT section ──
  _renderWhatsNext(result) {
    const subjectWise = result.subjectWise || {};
    const entries = Object.entries(subjectWise);

    // Find weakest subject
    let weakSubject = null;
    let weakAcc = 101;
    entries.forEach(([name, data]) => {
      const attempted = data.correct + data.wrong;
      if (attempted > 0) {
        const acc = Math.round((data.correct / attempted) * 100);
        if (acc < weakAcc) { weakAcc = acc; weakSubject = name; }
      }
    });

    // AI insight based on accuracy band
    let insight, nextAction, nextLabel, nextIcon;
    if (result.accuracy >= 80) {
      insight = `Strong performance! Your accuracy is in the top tier. Push further with harder mocks.`;
      nextAction = () => `App.navigate('setup', {difficulty:'hard'})`;
      nextLabel = 'Try a Harder Mock';
      nextIcon = '&#9651;';
    } else if (result.accuracy >= 60) {
      insight = `Good effort. ${weakSubject ? `Focus on <strong>${weakSubject}</strong> — your accuracy there needs work.` : 'Keep practicing to solidify your score.'}`;
      nextAction = weakSubject
        ? `App.navigate('setup', {subject:'${weakSubject}', mode:'section'})`
        : `App.navigate('setup')`;
      nextLabel = weakSubject ? `Practice ${weakSubject}` : 'Start Next Mock';
      nextIcon = '&#9670;';
    } else {
      insight = `${weakSubject ? `<strong>${weakSubject}</strong> is your biggest opportunity right now.` : 'Your score has room to grow.'} Review your wrong answers first, then take a topic test.`;
      nextAction = `App.navigate('analysis')`;
      nextLabel = 'Review Wrong Answers First';
      nextIcon = '&#9632;';
    }

    // Streak status
    const streak = window.DailySystem?.getStreak?.()?.current || 0;
    const streakAlive = window.DailySystem?.isStreakAlive?.() || false;
    const streakHtml = streak > 0
      ? `<div style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:${streakAlive ? '#EA580C' : 'var(--text-muted)'};font-weight:600;margin-top:12px;">
           <span>${streakAlive ? '&#9733;' : '&#9711;'}</span>
           ${streakAlive ? `${streak}-day streak &mdash; keep it alive!` : `Streak reset &mdash; start fresh today`}
         </div>`
      : `<div style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);margin-top:12px;">
           &#9711; Complete today's challenge to start a streak
         </div>`;

    return `
      <div style="
        background: var(--bg-card);
        border: 1px solid var(--border-color);
        border-left: 3px solid var(--brand-primary);
        border-radius: var(--radius-lg);
        padding: 20px;
        margin-bottom: 20px;
      ">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--brand-primary); margin-bottom: 12px;">
          What&rsquo;s Next?
        </div>

        <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.65; margin: 0 0 16px;">
          ${insight}
        </p>

        <button
          onclick="${nextAction}()"
          style="
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: var(--brand-primary);
            color: #fff;
            border: none;
            border-radius: var(--radius-md);
            padding: 10px 20px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            font-family: var(--font-display);
            transition: opacity 150ms;
          "
          onmouseover="this.style.opacity='0.88'"
          onmouseout="this.style.opacity='1'"
        >
          <span>${nextIcon}</span> ${nextLabel}
        </button>

        ${streakHtml}
      </div>
    `;
  },

  startNextMock() {
    // Navigate to setup, optionally with a preset based on last exam
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
    const text = `Mock24hr Test Result: I scored ${result.totalMarks}/${result.maxMarks} with ${result.accuracy}% accuracy! Practice free mock tests at Mock24hr.`;
    navigator.clipboard.writeText(text).then(() => {
      Helpers.showToast('Result summary copied to clipboard!', 'success');
    }).catch(() => {
      alert(text);
    });
  },

  attemptAgain() {
    if (App.lastTestConfig) {
      App.navigate('setup', { preset: App.lastTestConfig.examId || App.lastTestConfig.id });
    } else {
      App.navigate('setup');
    }
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent("page_view", { page: "result_scholar" });
  }
};

window.ResultPage = ResultPage;
