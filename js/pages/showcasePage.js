// ============================================
// COMPONENT SHOWCASE — Doc 10 §29E
// Internal dev route at #dev
// Living design system + component inventory.
// Not user-facing. Hidden from production nav.
// ============================================

const ShowcasePage = {

  render() {
    const tokens = this._getDesignTokens();

    return `
      <div class="page-enter" style="min-height:100vh;background:var(--bg-primary)">
        <div style="max-width:960px;margin:0 auto;padding:40px 16px 80px">

          <!-- Header -->
          <div style="margin-bottom:40px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--warning);background:rgba(245,158,11,0.12);padding:3px 8px;border-radius:var(--radius-full)">Dev Only</span>
            </div>
            <h1 style="font-size:28px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);letter-spacing:-0.03em;margin:0 0 8px">
              Component Showcase
            </h1>
            <p style="font-size:14px;color:var(--text-muted);line-height:1.6;margin:0">
              Living design system for Mock24hr. Every reusable component with all states.
            </p>
          </div>

          <!-- Quick nav -->
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:32px">
            ${['Colors', 'Typography', 'Spacing', 'Buttons', 'Cards', 'Badges', 'Feedback', 'Icons', 'Storage'].map(s =>
              `<a href="#dev" onclick="document.getElementById('sc-${s.toLowerCase()}')?.scrollIntoView({behavior:'smooth'})" style="padding:5px 12px;background:var(--bg-nested);border-radius:var(--radius-full);font-size:12px;font-weight:700;color:var(--text-secondary);text-decoration:none">${s}</a>`
            ).join('')}
          </div>


          <!-- ═══ COLORS ═══ -->
          <section id="sc-colors" style="margin-bottom:40px">
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:12px;letter-spacing:-0.02em">Colors</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
              ${[
                { name: 'Primary', var: '--primary' },
                { name: 'Primary BG', var: '--primary-bg' },
                { name: 'Success', var: '--success' },
                { name: 'Warning', var: '--warning' },
                { name: 'Danger', var: '--danger' },
                { name: 'Text Primary', var: '--text-primary' },
                { name: 'Text Secondary', var: '--text-secondary' },
                { name: 'Text Muted', var: '--text-muted' },
                { name: 'BG Primary', var: '--bg-primary' },
                { name: 'BG Card', var: '--bg-card' },
                { name: 'BG Nested', var: '--bg-nested' },
                { name: 'Border', var: '--border-color' }
              ].map(c => `
                <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);overflow:hidden">
                  <div style="height:48px;background:var(${c.var})"></div>
                  <div style="padding:8px">
                    <div style="font-size:11px;font-weight:700;color:var(--text-primary)">${c.name}</div>
                    <div style="font-size:10px;color:var(--text-muted);font-family:monospace">${c.var}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </section>


          <!-- ═══ TYPOGRAPHY ═══ -->
          <section id="sc-typography" style="margin-bottom:40px">
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:12px;letter-spacing:-0.02em">Typography</div>
            <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:20px">
              <div style="font-size:28px;font-weight:800;font-family:var(--font-display);color:var(--text-primary);letter-spacing:-0.03em;margin-bottom:12px">Heading 1 — Display (28px, 800)</div>
              <div style="font-size:20px;font-weight:800;font-family:var(--font-display);color:var(--text-primary);letter-spacing:-0.02em;margin-bottom:12px">Heading 2 — Section (20px, 800)</div>
              <div style="font-size:16px;font-weight:700;font-family:var(--font-display);color:var(--text-primary);margin-bottom:12px">Heading 3 — Card (16px, 700)</div>
              <div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:12px">Body Bold (14px, 600)</div>
              <div style="font-size:14px;color:var(--text-secondary);line-height:1.6;margin-bottom:12px">Body Regular — This is how normal body text looks across the platform. Line height is 1.6 for readability.</div>
              <div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Small (13px) — Used for meta text, labels, secondary info</div>
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Caption (11px, 700, uppercase) — Section labels, card headers</div>
            </div>
          </section>


          <!-- ═══ SPACING ═══ -->
          <section id="sc-spacing" style="margin-bottom:40px">
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:12px;letter-spacing:-0.02em">Spacing Scale</div>
            <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:20px">
              ${[4, 8, 12, 16, 20, 24, 32, 40, 48, 64].map(s => `
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
                  <div style="width:${s}px;height:12px;background:var(--primary);border-radius:2px;flex-shrink:0"></div>
                  <span style="font-size:12px;font-family:monospace;color:var(--text-muted);min-width:50px">${s}px</span>
                </div>
              `).join('')}
            </div>
          </section>


          <!-- ═══ BUTTONS ═══ -->
          <section id="sc-buttons" style="margin-bottom:40px">
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:12px;letter-spacing:-0.02em">Buttons</div>
            <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:20px">

              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:8px">Default</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
                <button class="btn btn-primary">Primary</button>
                <button class="btn btn-secondary">Secondary</button>
                <button class="dp-btn dp-btn--outline">Outline</button>
                <button class="btn btn-primary" style="opacity:0.5;pointer-events:none">Disabled</button>
              </div>

              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:8px">Dashboard Buttons</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">
                <button class="dp-btn dp-btn--primary">Primary Action</button>
                <button class="dp-btn dp-btn--outline">Outline Action</button>
                <button class="dp-btn dp-btn--primary dp-btn--full" style="max-width:300px">Full Width &rarr;</button>
              </div>
            </div>
          </section>


          <!-- ═══ CARDS ═══ -->
          <section id="sc-cards" style="margin-bottom:40px">
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:12px;letter-spacing:-0.02em">Cards</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px">

              <!-- Standard card -->
              <div class="dp-card">
                <div class="dp-card-label">Standard Card</div>
                <p style="font-size:13px;color:var(--text-secondary);margin:8px 0 0">This is the default card style used across dashboard and pages.</p>
              </div>

              <!-- Accent border card -->
              <div class="dp-card" style="border-left:3px solid var(--primary)">
                <div class="dp-card-label" style="color:var(--primary)">Accent Card</div>
                <p style="font-size:13px;color:var(--text-secondary);margin:8px 0 0">Used for important callouts, re-engagement, and featured content.</p>
              </div>

              <!-- Rec card -->
              <div class="dp-card dp-rec-card">
                <div class="dp-card-label">Recommendation Card</div>
                <div class="dp-rec-name">Subject Focus Mock</div>
                <div class="dp-rec-meta">
                  <span>50 Questions</span>
                  <span class="dp-rec-dot">·</span>
                  <span>35 min</span>
                </div>
              </div>

            </div>
          </section>


          <!-- ═══ BADGES ═══ -->
          <section id="sc-badges" style="margin-bottom:40px">
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:12px;letter-spacing:-0.02em">Badges & Tags</div>
            <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:20px;display:flex;flex-wrap:wrap;gap:8px">
              <span style="padding:3px 10px;background:var(--primary-bg);color:var(--primary);border-radius:var(--radius-full);font-size:11px;font-weight:700">+100 XP</span>
              <span style="padding:3px 10px;background:rgba(16,185,129,0.12);color:#10B981;border-radius:var(--radius-full);font-size:11px;font-weight:700">✓ Complete</span>
              <span style="padding:3px 10px;background:rgba(245,158,11,0.12);color:#F59E0B;border-radius:var(--radius-full);font-size:11px;font-weight:700">In Progress</span>
              <span style="padding:3px 10px;background:rgba(239,68,68,0.12);color:#EF4444;border-radius:var(--radius-full);font-size:11px;font-weight:700">Critical</span>
              <span style="padding:3px 10px;background:var(--bg-nested);color:var(--text-muted);border-radius:var(--radius-full);font-size:11px;font-weight:700">Locked</span>
              <span style="padding:4px 14px;background:var(--primary);color:#fff;border-radius:var(--radius-full);font-size:11px;font-weight:700">⭐ Most Popular</span>
            </div>
          </section>


          <!-- ═══ FEEDBACK ═══ -->
          <section id="sc-feedback" style="margin-bottom:40px">
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:12px;letter-spacing:-0.02em">Feedback</div>
            <div style="display:grid;gap:10px">
              <div style="padding:12px 16px;background:rgba(59,130,246,0.08);border-left:3px solid #3B82F6;border-radius:var(--radius-md);font-size:13px;color:var(--text-secondary)">
                <strong style="color:#3B82F6">Info:</strong> This is an informational banner.
              </div>
              <div style="padding:12px 16px;background:rgba(16,185,129,0.08);border-left:3px solid #10B981;border-radius:var(--radius-md);font-size:13px;color:var(--text-secondary)">
                <strong style="color:#10B981">Success:</strong> Operation completed successfully.
              </div>
              <div style="padding:12px 16px;background:rgba(245,158,11,0.08);border-left:3px solid #F59E0B;border-radius:var(--radius-md);font-size:13px;color:var(--text-secondary)">
                <strong style="color:#F59E0B">Warning:</strong> This action cannot be undone.
              </div>
              <div style="padding:12px 16px;background:rgba(239,68,68,0.08);border-left:3px solid #EF4444;border-radius:var(--radius-md);font-size:13px;color:var(--text-secondary)">
                <strong style="color:#EF4444">Error:</strong> Unable to load data. Please retry.
              </div>

              <!-- Skeleton -->
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-top:8px">Skeleton Loading</div>
              <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:16px">
                <div style="height:14px;width:40%;background:var(--bg-nested);border-radius:var(--radius-md);margin-bottom:10px;animation:pulse 1.5s infinite"></div>
                <div style="height:10px;width:80%;background:var(--bg-nested);border-radius:var(--radius-md);margin-bottom:6px;animation:pulse 1.5s infinite"></div>
                <div style="height:10px;width:60%;background:var(--bg-nested);border-radius:var(--radius-md);animation:pulse 1.5s infinite"></div>
              </div>

              <!-- Empty state -->
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-top:8px">Empty State</div>
              <div class="dp-card-empty" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:32px;text-align:center">
                ${typeof Icons !== 'undefined' ? Icons.get('clipboard', 32) : '📋'}
                <p style="color:var(--text-muted);font-size:13px;margin:8px 0 0">No data yet. Take your first test to see results.</p>
              </div>
            </div>
          </section>


          <!-- ═══ ICONS ═══ -->
          <section id="sc-icons" style="margin-bottom:40px">
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:12px;letter-spacing:-0.02em">Icon Library</div>
            <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(80px,1fr));gap:12px">
              ${typeof Icons !== 'undefined' ? [
                'home','search','bookOpen','fileText','target','zap','flame',
                'award','crown','star','trophy','checkCircle','alertTriangle',
                'trendingUp','trendingDown','user','settings','shield','rocket',
                'coins','sparkles','clipboard','edit','trash','eye','lock'
              ].map(name => {
                try {
                  return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px" title="${name}">
                    ${Icons.get(name, 20)}
                    <span style="font-size:9px;color:var(--text-muted);font-family:monospace">${name}</span>
                  </div>`;
                } catch(e) { return ''; }
              }).join('') : '<p style="color:var(--text-muted)">Icons module not loaded</p>'}
            </div>
          </section>


          <!-- ═══ STORAGE DIAGNOSTICS ═══ -->
          <section id="sc-storage" style="margin-bottom:40px">
            <div style="font-size:16px;font-weight:800;color:var(--text-primary);font-family:var(--font-display);margin-bottom:12px;letter-spacing:-0.02em">Storage Diagnostics</div>
            <div id="sc-storage-content" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:20px">
              <p style="color:var(--text-muted);font-size:13px">Loading...</p>
            </div>
          </section>

        </div>
      </div>
    `;
  },


  afterRender() {
    // Populate storage diagnostics
    requestAnimationFrame(() => {
      const el = document.getElementById('sc-storage-content');
      if (!el || typeof Storage === 'undefined') return;

      const diag = Storage.getDiagnostics?.();
      if (!diag) {
        el.innerHTML = '<p style="color:var(--text-muted);font-size:13px">Storage.getDiagnostics not available</p>';
        return;
      }

      el.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border-color);border-radius:var(--radius-md);overflow:hidden;margin-bottom:16px">
          <div style="background:var(--bg-card);padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--text-primary);font-family:var(--font-display)">${diag.keyCount}</div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Keys Used</div>
          </div>
          <div style="background:var(--bg-card);padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--text-primary);font-family:var(--font-display)">${diag.totalKB} KB</div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Total Size</div>
          </div>
          <div style="background:var(--bg-card);padding:12px;text-align:center">
            <div style="font-size:22px;font-weight:800;color:var(--text-primary);font-family:var(--font-display)">${Storage.ALL_KEYS?.length || '?'}</div>
            <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted)">Registered Keys</div>
          </div>
        </div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);margin-bottom:8px">Key Breakdown (by size)</div>
        ${diag.keys.map(k => `
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--border-light)">
            <span style="flex:1;font-size:12px;font-family:monospace;color:var(--text-secondary)">${k.key}</span>
            <span style="font-size:11px;font-weight:700;color:var(--text-muted)">${(k.bytes / 1024).toFixed(1)} KB</span>
          </div>
        `).join('')}
      `;
    });
  },


  _getDesignTokens() {
    // Read computed CSS variables
    try {
      const root = getComputedStyle(document.documentElement);
      return {
        primary:    root.getPropertyValue('--primary').trim(),
        fontDisplay: root.getPropertyValue('--font-display').trim()
      };
    } catch(e) {
      return {};
    }
  }
};

window.ShowcasePage = ShowcasePage;
