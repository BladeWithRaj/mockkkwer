// ============================================
// MOCK TEST PLATFORM — Home Page (Final High Conversion)
// ============================================

const HomePage = {
  render() {
    let variant = localStorage.getItem("variant");
    if (!variant) {
      variant = Math.random() < 0.5 ? "A" : "B";
      localStorage.setItem("variant", variant);
    }
    
    // A/B Test Headline
    const headline = variant === "A" 
      ? `Stop Guessing.<br><span class="gradient-text">Start Scoring.</span>`
      : `Boost Your Score with<br><span class="gradient-text">Smart Practice</span>`;

    return `
      <div class="page-enter">
        <!-- 1. HERO SECTION -->
        <section class="home-hero container text-center" style="padding-top: var(--space-16); padding-bottom: var(--space-12);">
          <div class="hero-badge animate-fadeInDown" style="display: inline-flex; align-items: center; gap: 8px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); padding: 6px 16px; border-radius: 20px; color: var(--primary-light); font-size: 14px; font-weight: 500; margin-bottom: 20px;">
            <span class="dot" style="width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 10px #22c55e;"></span>
            <span>Live Mock Tests</span>
          </div>

          <h1 class="hero-title animate-fadeInUp stagger-1" style="font-size: clamp(40px, 8vw, 64px); line-height: 1.1; font-weight: 800; margin-bottom: 24px; letter-spacing: -0.02em;">
            ${headline}
          </h1>

          <p class="hero-subtitle animate-fadeInUp stagger-2" style="font-size: clamp(16px, 4vw, 20px); color: var(--text-secondary); max-width: 600px; margin: 0 auto 32px; line-height: 1.6;">
            Practice real exam-level mock tests. Track your performance. Improve every day.
          </p>

          <div class="hero-cta animate-fadeInUp stagger-3" style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
            <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;">
              <button class="btn btn-primary btn-lg pulse-glow" onclick="if(window.trackEvent) window.trackEvent('cta_click', {type: 'full_test', variant: localStorage.getItem('variant')}); App.navigate('setup');" style="font-size: 18px; padding: 16px 32px; border-radius: 12px; font-weight: 600; box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); transition: transform 0.2s, box-shadow 0.2s;">
                🚀 Start Full Test
              </button>
              <button class="btn btn-secondary btn-lg" onclick="if(window.trackEvent) window.trackEvent('cta_click', {type: 'demo_test', variant: localStorage.getItem('variant')}); App.navigate('setup', {exam: 'All', mode: 'demo', limit: 5});" style="font-size: 18px; padding: 16px 32px; border-radius: 12px; font-weight: 600; background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); transition: all 0.2s;">
                ⚡ Try 2-Min Demo
              </button>
            </div>
            
            <div style="color: var(--text-muted); font-size: 13px; font-weight: 500; letter-spacing: 0.5px; display: flex; align-items: center; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 8px;">
              <span>No timer pressure</span>
              <span style="opacity: 0.5">•</span>
              <span>Skip anytime</span>
              <span style="opacity: 0.5">•</span>
              <span>Instant result</span>
            </div>

            <!-- Session Hook (Injected dynamically) -->
            ${Storage.getCurrentTest() ? `
              <div style="margin-top: 10px; cursor: pointer; color: var(--primary-light); font-size: 15px; font-weight: 600; background: rgba(99,102,241,0.1); padding: 8px 16px; border-radius: 20px; border: 1px solid var(--primary);" onclick="App.navigate('test')">
                Continue where you left off ⏱️ →
              </div>
            ` : ''}
            
            <div style="margin-top: 24px; color: var(--text-secondary); font-size: 12px; animation: bounce 2s infinite; opacity: 0.7;">
              ↓ Scroll to explore or start now
            </div>
          </div>
        </section>

        <!-- SOCIAL PROOF -->
        <section class="container text-center" style="padding-bottom: var(--space-8);">
          <div class="animate-fadeInUp stagger-3" style="color: var(--text-muted); font-size: 14px; font-weight: 500; letter-spacing: 0.5px; border-top: 1px solid var(--border-light); border-bottom: 1px solid var(--border-light); padding: 12px 0;">
            Used by students preparing for SSC, Railway & Banking exams
          </div>
        </section>

        <!-- 2. TRUST STATS -->
        <section class="container" style="padding-bottom: var(--space-12);">
          <div class="stats-row animate-fadeInUp stagger-4" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <div class="card glass-card" style="text-align: center; padding: 24px;">
              <div style="font-size: 32px; margin-bottom: 12px;">🛡️</div>
              <div style="font-size: 16px; font-weight: 600; color: var(--text-primary);">Designed for SSC, Railway & Banking Exams</div>
            </div>
            <div class="card glass-card" style="text-align: center; padding: 24px;">
              <div style="font-size: 32px; margin-bottom: 12px;">🎯</div>
              <div style="font-size: 16px; font-weight: 600; color: var(--text-primary);">Real exam-style questions</div>
            </div>
            <div class="card glass-card" style="text-align: center; padding: 24px;">
              <div style="font-size: 32px; margin-bottom: 12px;">🧘</div>
              <div style="font-size: 16px; font-weight: 600; color: var(--text-primary);">Practice without distractions</div>
            </div>
          </div>
        </section>

        <!-- 3. EXAM CARDS -->
        <section class="exam-section container" style="padding-bottom: var(--space-12);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
             <h2 class="section-title animate-fadeInUp" style="font-size: 28px; margin: 0;">Choose Your Target Exam</h2>
             <button class="btn btn-outline" onclick="App.navigate('setup')" style="font-size: 14px; padding: 6px 16px;">View All →</button>
          </div>

          <div class="exam-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
            ${this._renderExamCard('SSC', '📋')}
            ${this._renderExamCard('Railway', '🚂')}
            ${this._renderExamCard('Banking', '🏦')}
            ${this._renderExamCard('General', '🎯')}
          </div>
        </section>

        <!-- 4. WHY CHOOSE US -->
        <section class="container" style="padding-bottom: var(--space-12);">
          <h2 class="section-title text-center animate-fadeInUp" style="font-size: 28px; margin-bottom: 30px;">Why Practice Here?</h2>

          <div class="features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
            <div class="feature-card glass-card animate-fadeInUp stagger-1" style="padding: 24px; border-radius: 16px;">
              <div class="feature-icon" style="font-size: 28px; margin-bottom: 12px;">⚡</div>
              <h4 class="feature-title" style="font-size: 16px; margin-bottom: 8px;">Start Test in 1 Click</h4>
            </div>
            <div class="feature-card glass-card animate-fadeInUp stagger-2" style="padding: 24px; border-radius: 16px;">
              <div class="feature-icon" style="font-size: 28px; margin-bottom: 12px;">🎯</div>
              <h4 class="feature-title" style="font-size: 16px; margin-bottom: 8px;">Questions That Match Real Exams</h4>
            </div>
            <div class="feature-card glass-card animate-fadeInUp stagger-3" style="padding: 24px; border-radius: 16px;">
              <div class="feature-icon" style="font-size: 28px; margin-bottom: 12px;">📊</div>
              <h4 class="feature-title" style="font-size: 16px; margin-bottom: 8px;">Clear Score — No Confusion</h4>
            </div>
            <div class="feature-card glass-card animate-fadeInUp stagger-4" style="padding: 24px; border-radius: 16px;">
              <div class="feature-icon" style="font-size: 28px; margin-bottom: 12px;">📱</div>
              <h4 class="feature-title" style="font-size: 16px; margin-bottom: 8px;">Works Smooth on Mobile</h4>
            </div>
          </div>
        </section>

        <!-- 5. HOW IT WORKS -->
        <section class="container" style="padding-bottom: var(--space-16);">
          <h2 class="section-title text-center animate-fadeInUp" style="font-size: 24px; margin-bottom: 30px;">How It Works</h2>
          <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; text-align: center;">
            <div class="animate-fadeInUp stagger-1" style="background: var(--bg-surface); padding: 16px 24px; border-radius: 12px; border: 1px solid var(--border-light);">
               <span style="font-weight: bold; color: var(--primary);">1.</span> Choose Test
            </div>
            <div class="animate-fadeInUp stagger-2" style="background: var(--bg-surface); padding: 16px 24px; border-radius: 12px; border: 1px solid var(--border-light);">
               <span style="font-weight: bold; color: var(--primary);">2.</span> Attempt Questions
            </div>
            <div class="animate-fadeInUp stagger-3" style="background: var(--bg-surface); padding: 16px 24px; border-radius: 12px; border: 1px solid var(--border-light);">
               <span style="font-weight: bold; color: var(--primary);">3.</span> Get Result Instantly
            </div>
          </div>
        </section>

        <!-- 6. FINAL CTA -->
        <section class="container text-center" style="padding-bottom: var(--space-20);">
          <div class="glass-card animate-fadeInUp" style="padding: 60px 20px; border-radius: 24px; background: linear-gradient(145deg, rgba(30,30,40,0.8), rgba(20,20,30,0.9)); border: 1px solid var(--border-light);">
            <h2 style="font-size: clamp(24px, 5vw, 36px); margin-bottom: 12px; font-weight: 800;">Start Your First Mock Test Now</h2>
            <p style="color: var(--text-secondary); margin-bottom: 32px; font-size: 16px;">It takes less than 5 seconds</p>
            <button class="btn btn-primary btn-lg pulse-glow" onclick="App.navigate('setup')" style="font-size: 18px; padding: 16px 48px; border-radius: 12px; font-weight: 600; box-shadow: 0 0 40px rgba(99, 102, 241, 0.5);">
              🔥 Take a Free Mock Test Now
            </button>
          </div>
        </section>
      </div>

      <style>
        /* Pulse Glow Animation */
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
          50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.7); }
          100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.4); }
        }
        .pulse-glow {
          animation: pulse-glow 2s infinite;
        }
        .pulse-glow:hover {
          transform: scale(1.05);
        }

        /* Hover button effects */
        .btn-secondary:hover {
          background: rgba(34, 197, 94, 0.2) !important;
          transform: translateY(-2px);
        }
        
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        /* Glass Card */
        .glass-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
        }
        
        /* Exam Card Hover Effects */
        .exam-card-new {
          background: var(--bg-surface);
          border: 1px solid var(--border-light);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          position: relative;
          overflow: hidden;
        }
        .exam-card-new .card-cta {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-glass);
          color: var(--text-secondary);
          padding: 10px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          border-top: 1px solid var(--border-light);
        }
        .exam-card-new:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 10px 30px rgba(99, 102, 241, 0.2);
          border-color: var(--primary);
        }
        .exam-card-new:hover .card-cta {
          background: var(--primary);
          color: white;
        }
        .hover-opacity:hover {
          opacity: 0.8;
        }
      </style>
    `;
  },

  _renderExamCard(exam, icon) {
    // Map internal DB names if needed
    let mappedExam = exam;
    if (exam === 'General') mappedExam = 'All';

    return `
      <div class="exam-card-new animate-fadeInUp"
           onclick="App.navigate('setup', {exam: '${mappedExam}'})">
        <div style="font-size: 40px; margin-bottom: 12px; transition: transform 0.3s;">${icon}</div>
        <div style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 30px;">${exam}</div>
        <div class="card-cta">
          <span class="default-text">Start →</span>
          <span class="hover-text" style="display: none;">Start ${exam} Test →</span>
        </div>
      </div>
    `;
  },

  afterRender() {
    // ── 1. Track Page View with Variant ──
    const variant = localStorage.getItem("variant") || "A";
    if (window.trackEvent) {
      window.trackEvent("page_view", { variant });
    }

    // ── 2. Track Bounce (user leaves within 5s) ──
    if (!HomePage._bounceAttached) {
      let engaged = false;
      
      ["click", "scroll", "keydown"].forEach(evt => {
        window.addEventListener(evt, () => {
          engaged = true;
        });
      });

      setTimeout(() => {
        if (!engaged && window.trackEvent) window.trackEvent("bounce");
      }, 5000);

      HomePage._bounceAttached = true;
    }

    // ── 3. Track Scroll Depth ──
    if (!HomePage._scrollAttached) {
      let scrollTracked = false;
      window.addEventListener("scroll", () => {
        const scrollPercent = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
        if (!scrollTracked && scrollPercent > 0.5) {
          scrollTracked = true;
          if (window.trackEvent) window.trackEvent("scroll_50", { variant });
        }
      });
      HomePage._scrollAttached = true;
    }
  }
};

// Add a tiny bit of JS to handle the text swap cleanly without complex CSS selectors
document.addEventListener('mouseover', (e) => {
  const card = e.target.closest('.exam-card-new');
  if (card) {
    card.querySelector('.default-text').style.display = 'none';
    card.querySelector('.hover-text').style.display = 'inline';
  }
});
document.addEventListener('mouseout', (e) => {
  const card = e.target.closest('.exam-card-new');
  if (card) {
    card.querySelector('.default-text').style.display = 'inline';
    card.querySelector('.hover-text').style.display = 'none';
  }
});
