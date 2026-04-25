// ============================================
// ANALYTICS PAGE (Dashboard)
// ============================================

const AnalyticsPage = {
  render() {
    // Basic protection
    if (localStorage.getItem("admin") !== "true") {
      return `
        <div style="min-height: 80vh; display: flex; align-items: center; justify-content: center;">
          <h2>Not allowed. Add localStorage.setItem('admin', 'true') to view.</h2>
        </div>
      `;
    }

    return `
      <div class="analytics-page container" style="padding: 40px 20px;">
        <div class="analytics-header" style="margin-bottom: 30px;">
          <h1 style="font-size: 28px; margin-bottom: 8px;">📊 Growth Dashboard</h1>
          <p style="color: var(--text-secondary);">Last 7 days performance</p>
        </div>

        <div class="cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div class="card glass-card" style="padding: 20px; text-align: center; border-radius: 12px;">
            <h3 style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">Page Views</h3>
            <p id="pv" style="font-size: 32px; font-weight: bold; margin: 0;">-</p>
          </div>
          <div class="card glass-card" style="padding: 20px; text-align: center; border-radius: 12px;">
            <h3 style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">CTA Clicks</h3>
            <p id="cta" style="font-size: 32px; font-weight: bold; margin: 0;">-</p>
          </div>
          <div class="card glass-card" style="padding: 20px; text-align: center; border-radius: 12px;">
            <h3 style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">Test Starts</h3>
            <p id="start" style="font-size: 32px; font-weight: bold; margin: 0;">-</p>
          </div>
          <div class="card glass-card" style="padding: 20px; text-align: center; border-radius: 12px;">
            <h3 style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">Submits</h3>
            <p id="submit" style="font-size: 32px; font-weight: bold; margin: 0;">-</p>
          </div>
        </div>

        <div class="cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div class="card glass-card" style="padding: 20px; text-align: center; border-radius: 12px;">
            <h3 style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">CTR</h3>
            <p id="ctr" style="font-size: 32px; font-weight: bold; color: var(--primary-light); margin: 0;">-</p>
          </div>
          <div class="card glass-card" style="padding: 20px; text-align: center; border-radius: 12px;">
            <h3 style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">Start Rate</h3>
            <p id="sr" style="font-size: 32px; font-weight: bold; color: #22c55e; margin: 0;">-</p>
          </div>
          <div class="card glass-card" style="padding: 20px; text-align: center; border-radius: 12px;">
            <h3 style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">Completion</h3>
            <p id="comp" style="font-size: 32px; font-weight: bold; color: #f59e0b; margin: 0;">-</p>
          </div>
        </div>

        <div class="card glass-card" style="padding: 24px; border-radius: 12px;">
          <h3 style="font-size: 18px; margin-bottom: 16px;">A/B Variant Performance</h3>
          <div id="variants" style="display: flex; gap: 24px; font-size: 16px; color: var(--text-secondary);">Loading...</div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    if (localStorage.getItem("admin") !== "true") return;

    try {
      const res = await fetch("/api/analytics");
      const data = await res.json();

      document.getElementById("pv").textContent = data.pageViews || 0;
      document.getElementById("cta").textContent = data.ctaClicks || 0;
      document.getElementById("start").textContent = data.starts || 0;
      document.getElementById("submit").textContent = data.submits || 0;

      document.getElementById("ctr").textContent = (data.ctr || 0) + "%";
      document.getElementById("sr").textContent = (data.startRate || 0) + "%";
      document.getElementById("comp").textContent = (data.completion || 0) + "%";

      const vDiv = document.getElementById("variants");
      if (data.variants && Object.keys(data.variants).length > 0) {
        vDiv.innerHTML = Object.entries(data.variants)
          .map(([k, stats]) => `
            <div style="background: rgba(255,255,255,0.05); padding: 12px 24px; border-radius: 8px;">
              Variant ${k}: 
              <strong style="color:white; font-size: 20px; margin-left: 8px;">${stats.conversion}</strong> 
              <span style="font-size:12px; color:var(--text-muted); margin-left:4px;">(${stats.submits} / ${stats.views})</span>
            </div>`)
          .join("");
      } else {
        vDiv.innerHTML = "No variant data yet.";
      }
    } catch (err) {
      console.error("Failed to load analytics", err);
    }
  }
};
