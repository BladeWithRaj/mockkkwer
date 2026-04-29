// ============================================
// LANG MODULE — Bilingual EN/HI Support
// Simple key-value dictionary + toggle
// ============================================

const Lang = {
  current: localStorage.getItem('lang') || 'en',

  // ── Core Methods ──
  get() { return this.current; },
  isHindi() { return this.current === 'hi'; },

  toggle() {
    const next = this.current === 'en' ? 'hi' : 'en';

    // ── OPTIMIZATION: skip if already same language ──
    if (next === this.current) return;

    this.current = next;
    localStorage.setItem('lang', this.current);

    // During active test: swap question display text + re-render (no state loss)
    if (window.TestEngine && TestEngine.state && TestEngine.state.isActive && !TestEngine.state.isSubmitted) {
      const isHi = this.isHindi();

      // ── RACE GUARD: ensure questions array exists ──
      if (!TestEngine.state.questions || !TestEngine.state.questions.length) return;

      // Swap display text for all questions using bilingual fields
      TestEngine.state.questions.forEach(q => {
        if (q && q.questionEN) {
          q.question = isHi ? q.questionHI : q.questionEN;
          q.options = isHi ? [...q.optionsHI] : [...q.optionsEN];
          // correct index stays same — it's position-based, not text-based
        }
      });

      // Re-render question area + nav (timer/answers untouched)
      if (window.TestPage) {
        if (TestPage.refreshQuestion) TestPage.refreshQuestion();
        if (TestPage.refreshNav) TestPage.refreshNav();
      }

      // Update header lang button text
      const langBtn = document.querySelector('.lang-toggle-btn');
      if (langBtn) langBtn.innerHTML = '🌐 ' + (isHi ? 'EN' : 'हिंदी');
      return;
    }

    // All other pages: safe full re-render
    if (window.App && App.handleRoute) {
      App.handleRoute();
    }
  },

  // ── Translation lookup ──
  t(key) {
    const dict = this.current === 'hi' ? this._hi : this._en;
    return dict[key] || this._en[key] || key;
  },

  // ═══════════════════════════════════════
  // ENGLISH DICTIONARY
  // ═══════════════════════════════════════
  _en: {
    // ── Common ──
    app_name: 'MockTestPro',
    loading: 'Loading...',
    retry: 'Retry',
    go_home: 'Go Home',
    back: 'Back',
    cancel: 'Cancel',
    submit: 'Submit',
    error_generic: 'Something went wrong',
    page_not_found: 'Page Not Found',
    page_not_found_desc: "The page you're looking for doesn't exist",

    // ── Username Prompt ──
    welcome: 'Welcome to MockTestPro',
    enter_username: 'Enter a username to start practicing immediately. No signup required.',
    username_placeholder: 'Your name (e.g. Rahul)',
    start_practicing: "Let's Go! 🚀",
    username_error: 'Please enter a valid name (2+ characters)',

    // ── Header Nav ──
    nav_home: 'Home',
    nav_new_test: 'New Test',
    nav_dashboard: 'Dashboard',
    nav_leaderboard: 'Leaderboard',

    // ── Home Page ──
    hero_badge: 'Live Mock Tests',
    hero_title_a: 'Stop Guessing.<br><span class="gradient-text">Start Scoring.</span>',
    hero_title_b: 'Boost Your Score with<br><span class="gradient-text">Smart Practice</span>',
    hero_subtitle: 'Practice real exam-level mock tests. Track your performance. Improve every day.',
    cta_full_test: '🚀 Start Full Test',
    cta_demo: '⚡ Try 2-Min Demo',
    cta_no_pressure: 'No timer pressure',
    cta_skip: 'Skip anytime',
    cta_instant: 'Instant result',
    resume_test: 'Continue where you left off ⏱️ →',
    scroll_hint: '↓ Scroll to explore or start now',
    social_proof: 'Used by students preparing for SSC, Railway & Banking exams',
    trust_exam: 'Designed for SSC, Railway & Banking Exams',
    trust_scoring: 'Server-Verified Scoring System',
    trust_scoring_desc: 'Tamper-proof. Accurate. Reliable.',
    trust_analytics: 'Smart Performance Analytics',
    trust_analytics_desc: 'Topic-wise breakdown & insights',

    // ── Setup Page ──
    setup_title: 'Test Setup',
    setup_subtitle: 'Configure your mock test',
    setup_subject: '📚 Subject',
    setup_all_subjects: 'All Subjects',
    setup_exam: '🎯 Exam',
    setup_all_exams: 'All Exams',
    setup_questions: '📝 Number of Questions',
    setup_questions_hint: 'questions (5–200)',
    setup_time: '⏱️ Time (minutes)',
    setup_timer_on: 'Timer ON',
    setup_no_timer: 'No Timer',
    setup_time_hint: 'minutes (1–300)',
    setup_neg_marking: '⚖️ Negative Marking',
    setup_enabled: 'Enabled',
    setup_disabled: 'Disabled',
    setup_deduction: 'Deduction per wrong answer:',
    setup_start: '🚀 Start Test',
    setup_checking: '⏳ Checking...',
    setup_cannot_start: '⚠️ Cannot Start',
    setup_available: 'questions available',
    setup_not_enough: 'Not enough questions available',
    setup_back: '← Back to Home',
    setup_summary_subject: 'Subject',
    setup_summary_exam: 'Exam',
    setup_summary_questions: 'Questions',
    setup_summary_time: 'Time',
    setup_summary_neg: 'Negative Marking',

    // ── Test Page ──
    test_no_active: 'No Active Test',
    test_no_active_desc: 'Start a new test from the setup page',
    test_go_setup: 'Go to Setup',
    test_clear: '🗑️ Clear',
    test_mark_review: '🔖 Mark for Review',
    test_marked: '🔖 Marked',
    test_prev: '← Prev',
    test_next: 'Next →',
    test_submit_btn: 'Submit Test',
    test_submit_title: 'Submit Test?',
    test_answered: 'Answered',
    test_unanswered: 'Unanswered',
    test_review: 'Review',
    test_unanswered_warn: 'unanswered question(s). Submit anyway?',
    test_confirm_submit: '✅ Submit',
    test_timeout_title: "⏰ Time's Up!",
    test_timeout_desc: 'Your time has expired. The test will be submitted automatically.',
    test_view_results: 'View Results',
    test_60s_title: '⚠️ 60 Seconds Remaining!',
    test_60s_desc: 'You have <strong>1 minute</strong> left. Please review your answers and submit.',
    test_60s_warn: 'Unanswered questions will be marked as skipped.',
    test_continue: 'Continue Test',
    test_submit_now: 'Submit Now',
    test_questions_nav: 'Questions',
    test_legend_current: 'Current',
    test_legend_answered: 'Answered',
    test_legend_review: 'Review',
    test_legend_not_visited: 'Not visited',

    // ── Result Page ──
    result_title: 'Test Result',
    result_score: 'Score',
    result_correct: 'Correct',
    result_wrong: 'Wrong',
    result_skipped: 'Skipped',
    result_time: 'Time Taken',
    result_retry: '🔄 Retry Test',
    result_new: '📝 New Test',
    result_analysis: '📊 Detailed Analysis',
    result_home: '🏠 Go Home',
    result_submitting: 'Submitting result...',
    result_saved: 'Result saved to leaderboard!',
    result_save_failed: 'Could not save to server',

    // ── Leaderboard ──
    lb_title: '🏆 Leaderboard',
    lb_rank: 'Rank',
    lb_name: 'Name',
    lb_score: 'Score',
    lb_empty: 'No results yet. Be the first!',

    // ── Dashboard ──
    dash_title: '📊 Dashboard',
    dash_no_tests: 'No test history yet',
    dash_take_test: 'Take your first test to see stats here'
  },

  // ═══════════════════════════════════════
  // HINDI DICTIONARY
  // ═══════════════════════════════════════
  _hi: {
    // ── Common ──
    app_name: 'MockTestPro',
    loading: 'लोड हो रहा है...',
    retry: 'फिर से कोशिश करें',
    go_home: 'होम पर जाएं',
    back: 'वापस',
    cancel: 'रद्द करें',
    submit: 'जमा करें',
    error_generic: 'कुछ गलत हो गया',
    page_not_found: 'पेज नहीं मिला',
    page_not_found_desc: 'जो पेज आप ढूंढ रहे हैं वो मौजूद नहीं है',

    // ── Username Prompt ──
    welcome: 'MockTestPro में आपका स्वागत है',
    enter_username: 'अभी प्रैक्टिस शुरू करें। कोई साइनअप नहीं चाहिए।',
    username_placeholder: 'आपका नाम (जैसे राहुल)',
    start_practicing: 'चलो शुरू करें! 🚀',
    username_error: 'कृपया सही नाम डालें (कम से कम 2 अक्षर)',

    // ── Header Nav ──
    nav_home: 'होम',
    nav_new_test: 'नया टेस्ट',
    nav_dashboard: 'डैशबोर्ड',
    nav_leaderboard: 'लीडरबोर्ड',

    // ── Home Page ──
    hero_badge: 'लाइव मॉक टेस्ट',
    hero_title_a: 'अंदाज़ा लगाना बंद करो।<br><span class="gradient-text">स्कोर करना शुरू करो।</span>',
    hero_title_b: 'स्मार्ट प्रैक्टिस से<br><span class="gradient-text">स्कोर बढ़ाओ</span>',
    hero_subtitle: 'असली परीक्षा स्तर के मॉक टेस्ट। अपनी तैयारी ट्रैक करो। हर रोज़ सुधार करो।',
    cta_full_test: '🚀 पूरा टेस्ट शुरू करें',
    cta_demo: '⚡ 2 मिनट का डेमो',
    cta_no_pressure: 'कोई टाइमर दबाव नहीं',
    cta_skip: 'कभी भी छोड़ें',
    cta_instant: 'तुरंत रिज़ल्ट',
    resume_test: 'जहां छोड़ा था वहां से जारी रखें ⏱️ →',
    scroll_hint: '↓ और जानने के लिए स्क्रॉल करें',
    social_proof: 'SSC, रेलवे और बैंकिंग परीक्षाओं की तैयारी करने वाले छात्र उपयोग करते हैं',
    trust_exam: 'SSC, रेलवे और बैंकिंग परीक्षाओं के लिए',
    trust_scoring: 'सर्वर-सत्यापित स्कोरिंग',
    trust_scoring_desc: 'छेड़छाड़-रोधी। सटीक। विश्वसनीय।',
    trust_analytics: 'स्मार्ट प्रदर्शन विश्लेषण',
    trust_analytics_desc: 'विषयवार ब्रेकडाउन और इनसाइट्स',

    // ── Setup Page ──
    setup_title: 'टेस्ट सेटअप',
    setup_subtitle: 'अपना मॉक टेस्ट कॉन्फ़िगर करें',
    setup_subject: '📚 विषय',
    setup_all_subjects: 'सभी विषय',
    setup_exam: '🎯 परीक्षा',
    setup_all_exams: 'सभी परीक्षाएं',
    setup_questions: '📝 प्रश्नों की संख्या',
    setup_questions_hint: 'प्रश्न (5–200)',
    setup_time: '⏱️ समय (मिनट)',
    setup_timer_on: 'टाइमर चालू',
    setup_no_timer: 'कोई टाइमर नहीं',
    setup_time_hint: 'मिनट (1–300)',
    setup_neg_marking: '⚖️ नेगेटिव मार्किंग',
    setup_enabled: 'चालू',
    setup_disabled: 'बंद',
    setup_deduction: 'प्रति गलत उत्तर कटौती:',
    setup_start: '🚀 टेस्ट शुरू करें',
    setup_checking: '⏳ जांच रहे हैं...',
    setup_cannot_start: '⚠️ शुरू नहीं कर सकते',
    setup_available: 'प्रश्न उपलब्ध हैं',
    setup_not_enough: 'पर्याप्त प्रश्न उपलब्ध नहीं हैं',
    setup_back: '← होम पर वापस',
    setup_summary_subject: 'विषय',
    setup_summary_exam: 'परीक्षा',
    setup_summary_questions: 'प्रश्न',
    setup_summary_time: 'समय',
    setup_summary_neg: 'नेगेटिव मार्किंग',

    // ── Test Page ──
    test_no_active: 'कोई सक्रिय टेस्ट नहीं',
    test_no_active_desc: 'सेटअप पेज से नया टेस्ट शुरू करें',
    test_go_setup: 'सेटअप पर जाएं',
    test_clear: '🗑️ हटाएं',
    test_mark_review: '🔖 रिव्यू के लिए मार्क',
    test_marked: '🔖 मार्क किया',
    test_prev: '← पिछला',
    test_next: 'अगला →',
    test_submit_btn: 'टेस्ट जमा करें',
    test_submit_title: 'टेस्ट जमा करें?',
    test_answered: 'उत्तर दिए',
    test_unanswered: 'बिना उत्तर',
    test_review: 'रिव्यू',
    test_unanswered_warn: 'बिना उत्तर वाले प्रश्न। फिर भी जमा करें?',
    test_confirm_submit: '✅ जमा करें',
    test_timeout_title: '⏰ समय समाप्त!',
    test_timeout_desc: 'आपका समय समाप्त हो गया। टेस्ट अपने आप जमा हो जाएगा।',
    test_view_results: 'रिज़ल्ट देखें',
    test_60s_title: '⚠️ 60 सेकंड बचे हैं!',
    test_60s_desc: 'आपके पास <strong>1 मिनट</strong> बचा है। कृपया अपने उत्तर जांचें और जमा करें।',
    test_60s_warn: 'बिना उत्तर वाले प्रश्न छोड़ा हुआ माने जाएंगे।',
    test_continue: 'टेस्ट जारी रखें',
    test_submit_now: 'अभी जमा करें',
    test_questions_nav: 'प्रश्न',
    test_legend_current: 'वर्तमान',
    test_legend_answered: 'उत्तर दिया',
    test_legend_review: 'रिव्यू',
    test_legend_not_visited: 'नहीं देखा',

    // ── Result Page ──
    result_title: 'टेस्ट रिज़ल्ट',
    result_score: 'स्कोर',
    result_correct: 'सही',
    result_wrong: 'गलत',
    result_skipped: 'छोड़ा',
    result_time: 'लगा समय',
    result_retry: '🔄 दोबारा टेस्ट',
    result_new: '📝 नया टेस्ट',
    result_analysis: '📊 विस्तृत विश्लेषण',
    result_home: '🏠 होम पर जाएं',
    result_submitting: 'रिज़ल्ट जमा हो रहा है...',
    result_saved: 'रिज़ल्ट लीडरबोर्ड पर सेव हो गया!',
    result_save_failed: 'सर्वर पर सेव नहीं हो सका',

    // ── Leaderboard ──
    lb_title: '🏆 लीडरबोर्ड',
    lb_rank: 'रैंक',
    lb_name: 'नाम',
    lb_score: 'स्कोर',
    lb_empty: 'अभी कोई रिज़ल्ट नहीं। पहले बनो!',

    // ── Dashboard ──
    dash_title: '📊 डैशबोर्ड',
    dash_no_tests: 'अभी कोई टेस्ट इतिहास नहीं',
    dash_take_test: 'स्टैट्स देखने के लिए पहला टेस्ट दें'
  }
};
