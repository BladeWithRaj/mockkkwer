// ============================================
// ANALYTICS PAGE (Admin Growth Dashboard)
// ============================================

const AnalyticsPage = {
  render() {
    // Show loading state — admin check happens in afterRender
    return `
      <div class="analytics-page container" style="padding: 40px 20px;">
        <div id="analytics-auth-gate" style="min-height: 80vh; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center;">
            <div class="splash-spinner" style="width: 32px; height: 32px; border: 2px solid rgba(255,255,255,0.1); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto;"></div>
            <p style="color: var(--text-muted); margin-top: 15px;">Verifying admin access...</p>
          </div>
        </div>
        <div id="analytics-content" style="display: none;">
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
      </div>
    `;
  },

  async afterRender() {
    const gate = document.getElementById('analytics-auth-gate');
    const content = document.getElementById('analytics-content');

    try {
      // Verify admin role via Supabase
      const supabaseClient = window.supabaseClient;
      if (!supabaseClient) throw new Error("No Supabase client");

      const { data: userData } = await supabaseClient.auth.getUser();
      if (!userData?.user) throw new Error("Not authenticated");

      const { data: roleData, error: roleErr } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .single();

      if (roleErr || !roleData || roleData.role !== 'admin') {
        throw new Error("Not admin");
      }

      // Admin verified — show content
      if (gate) gate.style.display = 'none';
      if (content) content.style.display = 'block';

      // Load analytics data
      await this._loadAnalyticsData();

    } catch (err) {
      // Not admin or error — show access denied
      if (gate) {
        gate.innerHTML = `
          <div style="text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔒</div>
            <h2 style="color: var(--danger); margin-bottom: 8px;">Access Denied</h2>
            <p style="color: var(--text-muted); margin-bottom: 24px;">Admin privileges required to view this page.</p>
            <button class="btn btn-primary" onclick="App.navigate('home')">Go Home</button>
          </div>
        `;
      }
      console.warn("Analytics access denied:", err.message);
    }
  },

  async _loadAnalyticsData() {
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

