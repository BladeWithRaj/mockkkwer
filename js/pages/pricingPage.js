// ============================================
// PRICING PAGE — Doc 9 §15–18
// 3-plan pricing: Free | Plus ⭐ | Pro
// No fake scarcity. No countdown timers.
// Honest value communication.
// ============================================

const PricingPage = {

  render() {
    const currentPlan = FeatureFlags.getPlan();
    const isLoggedIn  = window.FirebaseAuth && FirebaseAuth.isLoggedIn();

    // Gather user stats for "what you've achieved" section
    const history = Storage.getHistory?.() || [];
    const streak  = typeof DailySystem !== 'undefined' ? DailySystem.getStreak() : { current: 0 };
    const fcStats = typeof Flashcards !== 'undefined' ? Flashcards.getStats() : { total: 0 };

    return `
      <div class="page-enter" style="min-height:100vh;background:var(--bg-primary);">
        <div style="max-width:920px;margin:0 auto;padding:40px 16px 80px">

          <!-- Header -->
          <div style="text-align:center;margin-bottom:40px">
            <h1 style="font-size:28px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);letter-spacing:-0.03em;margin:0 0 10px">
              Choose Your Plan
            </h1>
            <p style="font-size:15px;color:var(--text-muted);max-width:480px;margin:0 auto;line-height:1.6">
              Every student gets a powerful free plan. Upgrade when you're ready for deeper insights and smarter preparation.
            </p>
          </div>

          <!-- 3-Plan Grid -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin-bottom:40px;">

            ${this._renderPlanCard({
              id: 'free',
              name: 'Free',
              price: '₹0',
              period: 'forever',
              badge: '',
              highlight: false,
              isCurrent: currentPlan === 'free',
              features: [
                { text: 'Daily mock tests',              included: true },
                { text: 'Basic analytics & dashboard',   included: true },
                { text: 'AI daily briefing',             included: true },
                { text: 'Flashcards (up to 50)',         included: true },
                { text: 'BTEUP paper generation',        included: true },
                { text: 'Streak & achievements',         included: true },
                { text: 'Adaptive practice',             included: false },
                { text: 'Advanced AI insights',          included: false },
                { text: 'Smart revision planner',        included: false }
              ],
              cta: currentPlan === 'free' ? 'Current Plan' : 'Downgrade',
              ctaDisabled: currentPlan === 'free'
            })}

            ${this._renderPlanCard({
              id: 'plus',
              name: 'Plus',
              price: '₹149',
              period: '/month',
              badge: '⭐ Most Popular',
              highlight: true,
              isCurrent: currentPlan === 'plus',
              features: [
                { text: 'Everything in Free',            included: true },
                { text: 'Unlimited adaptive practice',   included: true },
                { text: 'Advanced AI insights',          included: true },
                { text: 'Unlimited flashcards',          included: true },
                { text: 'Smart revision planner',        included: true },
                { text: 'Weekly AI report',              included: true },
                { text: 'Extended test history',         included: true },
                { text: 'Advanced analytics',            included: true },
                { text: 'Priority AI processing',        included: false }
              ],
              cta: currentPlan === 'plus' ? 'Current Plan' : 'Upgrade to Plus',
              ctaDisabled: currentPlan === 'plus'
            })}

            ${this._renderPlanCard({
              id: 'pro',
              name: 'Pro',
              price: '₹299',
              period: '/month',
              badge: '',
              highlight: false,
              isCurrent: currentPlan === 'pro',
              features: [
                { text: 'Everything in Plus',            included: true },
                { text: 'Priority AI processing',       included: true },
                { text: 'Long-term trend analysis',     included: true },
                { text: 'Full export & download',       included: true },
                { text: 'Multi-device sync',            included: true },
                { text: 'Early access to new features', included: true }
              ],
              cta: currentPlan === 'pro' ? 'Current Plan' : 'Go Pro',
              ctaDisabled: currentPlan === 'pro'
            })}

          </div>

          <!-- What you've achieved section (for returning users) -->
          ${history.length > 0 ? `
            <div class="rp-card" style="margin-bottom:32px;border-left:3px solid var(--primary)">
              <div class="rp-label" style="margin-bottom:14px">Your Progress So Far</div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1px;background:var(--border-color);border-radius:var(--radius-md);overflow:hidden">
                ${[
                  { val: history.length, label: 'Tests Taken' },
                  { val: streak.current || 0, label: 'Day Streak' },
                  { val: fcStats.total || 0, label: 'Flashcards' },
                  { val: history.length > 0 ? Math.round(history.reduce((s,h) => s + (h.accuracy||0), 0) / history.length) + '%' : '—', label: 'Avg Accuracy' }
                ].map(s => `
                  <div style="background:var(--bg-card);padding:14px 10px;text-align:center">
                    <div style="font-size:22px;font-weight:800;color:var(--text-primary);font-family:var(--font-display)">${s.val}</div>
                    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">${s.label}</div>
                  </div>
                `).join('')}
              </div>
              <p style="font-size:12.5px;color:var(--text-muted);margin:14px 0 0;line-height:1.55">
                You've already built a strong foundation. Upgrading to Plus gives you smarter AI insights to accelerate your progress.
              </p>
            </div>
          ` : ''}

          <!-- FAQ -->
          <div style="margin-bottom:32px">
            <div style="font-size:18px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:16px;letter-spacing:-0.02em">
              Frequently Asked Questions
            </div>
            ${this._renderFAQ([
              {
                q: 'Can I use Mock24hr for free?',
                a: 'Yes. The free plan includes daily mocks, basic analytics, AI briefings, flashcards (up to 50), and BTEUP paper generation. No credit card required.'
              },
              {
                q: 'What does Plus unlock?',
                a: 'Plus gives you unlimited adaptive practice, advanced AI insights that analyze your learning patterns, unlimited flashcards, a smart revision planner, and weekly AI reports summarizing your progress.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. You can cancel your subscription at any time. Your data and free-tier access remain intact after cancellation.'
              },
              {
                q: 'Will my progress be lost if I downgrade?',
                a: 'No. All your test history, flashcards, and achievements are preserved. Some advanced features become view-only on the free plan.'
              }
            ])}
          </div>

          <!-- Trust signals -->
          <div style="text-align:center;padding:24px 16px;background:var(--bg-nested);border-radius:var(--radius-lg)">
            <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;font-size:12px;color:var(--text-muted);font-weight:600">
              <span>🔒 Secure payments</span>
              <span>📧 Email support</span>
              <span>↩️ Cancel anytime</span>
              <span>📱 Works on all devices</span>
            </div>
          </div>

        </div>
      </div>
    `;
  },


  // ════ PLAN CARD ════
  _renderPlanCard({ id, name, price, period, badge, highlight, isCurrent, features, cta, ctaDisabled }) {
    const borderStyle = highlight
      ? 'border:2px solid var(--primary);box-shadow:0 4px 24px rgba(99,102,241,0.15)'
      : 'border:1.5px solid var(--border-color)';

    const ctaStyle = highlight && !ctaDisabled
      ? 'background:var(--primary);color:#fff;border:none'
      : ctaDisabled
        ? 'background:var(--bg-nested);color:var(--text-muted);border:1.5px solid var(--border-color);cursor:default'
        : 'background:transparent;color:var(--primary);border:1.5px solid var(--primary)';

    return `
      <div style="${borderStyle};border-radius:var(--radius-lg);padding:28px 24px;background:var(--bg-card);position:relative;display:flex;flex-direction:column">
        ${badge ? `
          <div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);
            padding:4px 14px;background:var(--primary);color:#fff;border-radius:var(--radius-full);
            font-size:11px;font-weight:700;white-space:nowrap;font-family:var(--font-display)">
            ${badge}
          </div>
        ` : ''}

        <div style="margin-bottom:20px">
          <div style="font-size:18px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:4px">${name}</div>
          <div style="display:flex;align-items:baseline;gap:4px">
            <span style="font-size:32px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);letter-spacing:-0.03em">${price}</span>
            <span style="font-size:13px;color:var(--text-muted);font-weight:600">${period}</span>
          </div>
        </div>

        <div style="flex:1;margin-bottom:20px">
          ${features.map(f => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13.5px;color:${f.included ? 'var(--text-secondary)' : 'var(--text-muted)'}">
              <span style="font-size:14px;width:18px;text-align:center;flex-shrink:0;color:${f.included ? '#10B981' : 'var(--text-muted)'}">${f.included ? '✓' : '—'}</span>
              <span${!f.included ? ' style="text-decoration:line-through;opacity:0.6"' : ''}>${f.text}</span>
            </div>
          `).join('')}
        </div>

        <button ${ctaDisabled ? 'disabled' : `onclick="PricingPage._selectPlan('${id}')"`}
          style="${ctaStyle};width:100%;padding:12px;border-radius:var(--radius-md);
          font-size:14px;font-weight:700;cursor:${ctaDisabled ? 'default' : 'pointer'};
          font-family:var(--font-display);transition:opacity 120ms">
          ${isCurrent ? '✓ ' : ''}${cta}
        </button>
      </div>
    `;
  },


  // ════ FAQ ════
  _renderFAQ(items) {
    return items.map((item, i) => `
      <div style="border-bottom:1px solid var(--border-light);padding:14px 0">
        <button onclick="PricingPage._toggleFAQ(${i})"
          style="width:100%;display:flex;justify-content:space-between;align-items:center;
          background:none;border:none;cursor:pointer;padding:0;text-align:left">
          <span style="font-size:14px;font-weight:700;color:var(--text-primary);font-family:var(--font-display)">${item.q}</span>
          <span id="faq-arrow-${i}" style="font-size:14px;color:var(--text-muted);transition:transform 200ms">▸</span>
        </button>
        <div id="faq-body-${i}" style="display:none;padding:8px 0 0;font-size:13.5px;color:var(--text-secondary);line-height:1.6">
          ${item.a}
        </div>
      </div>
    `).join('');
  },

  _toggleFAQ(i) {
    const body  = document.getElementById(`faq-body-${i}`);
    const arrow = document.getElementById(`faq-arrow-${i}`);
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.display = open ? 'none' : 'block';
    if (arrow) arrow.style.transform = open ? 'rotate(0deg)' : 'rotate(90deg)';
  },


  // ════ PLAN SELECTION ════
  _selectPlan(planId) {
    if (planId === 'free') {
      Helpers.showToast?.('You are already on the Free plan', 'info');
      return;
    }

    // For now, show a coming-soon modal (Doc 9 — no payment provider yet)
    const html = `
      <div class="modal-backdrop" id="plan-modal" onclick="if(event.target===this)this.remove()">
        <div style="
          background:var(--bg-card);border-radius:var(--radius-lg);padding:32px 28px;
          max-width:420px;width:calc(100% - 32px);text-align:center;
          box-shadow:0 8px 40px rgba(0,0,0,0.25)">
          <div style="font-size:32px;margin-bottom:12px">${planId === 'plus' ? '⭐' : '🚀'}</div>
          <h3 style="font-size:20px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin:0 0 8px">
            ${planId === 'plus' ? 'Mock24hr Plus' : 'Mock24hr Pro'}
          </h3>
          <p style="font-size:14px;color:var(--text-muted);line-height:1.6;margin:0 0 20px">
            Payment integration coming soon.<br>
            We'll notify you when ${planId === 'plus' ? 'Plus' : 'Pro'} subscriptions are available.
          </p>
          <div style="display:flex;gap:10px;justify-content:center">
            <button onclick="document.getElementById('plan-modal').remove()"
              style="padding:10px 20px;background:var(--primary);color:#fff;border:none;
              border-radius:var(--radius-md);font-weight:700;font-size:14px;cursor:pointer;
              font-family:var(--font-display)">
              Got It
            </button>
          </div>
          <p style="font-size:11px;color:var(--text-muted);margin:16px 0 0">
            Meanwhile, enjoy the full free plan with daily mocks, AI briefings, and flashcards.
          </p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
  },

  afterRender() {
    if (window.trackEvent) window.trackEvent('page_view', { page: 'pricing' });
  }
};

window.PricingPage = PricingPage;
