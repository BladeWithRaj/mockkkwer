// ============================================
// RENDERER ROUTER — Mode-based dispatch
// Maps exam category → specific renderer
// Exposes behavior config for renderers
// ============================================

const RendererRouter = {
  // Category → Renderer mapping
  _rendererMap: {
    'SSC':      'SSCRenderer',
    'Railway':  'RailwayRenderer',
    'Banking':  'BankingRenderer',
    'UPSC':     'UPSCRenderer',
    'Defence':  'SSCRenderer',      // Defence uses SSC-style CBT
    'State':    'SSCRenderer',      // State exams use SSC-style CBT
    'Teaching': 'SSCRenderer',      // Teaching uses SSC-style CBT
    'Quick':    null,               // Quick mode = default UI
    'Daily':    null                // Daily mode = default UI
  },

  /**
   * Get the active renderer for the current test
   * @returns {Object|null} The renderer object, or null for default UI
   */
  getActiveRenderer() {
    const preset = this._getPreset();
    if (!preset) return null;

    // Check if mode is rival-battle → always use RivalBattleRenderer
    if (TestEngine.state?.config?.mode === 'rival-battle' ||
        window._currentTestMode === 'rival-battle') {
      return typeof RivalBattleRenderer !== 'undefined' ? RivalBattleRenderer : null;
    }

    const rendererName = this._rendererMap[preset.category];
    if (!rendererName) return null;

    // Resolve renderer by name
    const renderer = window[rendererName];
    return renderer || null;
  },

  /**
   * Check if current test should use a board-specific renderer
   */
  shouldUseBoardRenderer() {
    return this.getActiveRenderer() !== null;
  },

  /**
   * Get the renderer type string for the current test
   */
  getRendererType() {
    const preset = this._getPreset();
    if (!preset) return 'default';

    if (TestEngine.state?.config?.mode === 'rival-battle') return 'rival-battle';

    const rendererName = this._rendererMap[preset.category];
    if (!rendererName) return 'default';
    return rendererName.replace('Renderer', '').toLowerCase();
  },

  // ══════════════════════════════════════
  //  BEHAVIOR CONFIG API
  //  Renderers read these to determine
  //  exam behavior, NOT just UI style.
  // ══════════════════════════════════════

  /**
   * Get the full behavior config for the current exam.
   * Merges preset-level config with category defaults.
   */
  getBehaviorConfig() {
    const preset = this._getPreset();
    if (!preset) return this._defaultBehavior();

    return {
      sectionLocking:  preset.sectionLocking  ?? false,
      sectionTimers:   preset.sectionTimers   ?? false,
      calculator:      preset.calculator      ?? false,
      keyboardNav:     preset.keyboardNav     ?? false,
      paletteType:     preset.paletteType     ?? 'default',
      negativeMarking: preset.negativeMarking ?? false,
      negativeValue:   preset.negativeValue   ?? 0,
      marksPerQuestion: preset.marksPerQuestion ?? 1,
      totalTime:       preset.totalTime       ?? 3600,
      sections:        preset.sections        ?? [],
      renderer:        preset.renderer        ?? null
    };
  },

  /** Should calculator be shown? */
  hasCalculator() {
    return this.getBehaviorConfig().calculator;
  },

  /** Are sections locked (can't go back)? */
  hasSectionLocking() {
    return this.getBehaviorConfig().sectionLocking;
  },

  /** Does each section have its own timer? */
  hasSectionTimers() {
    return this.getBehaviorConfig().sectionTimers;
  },

  /** Is keyboard navigation enabled? */
  hasKeyboardNav() {
    return this.getBehaviorConfig().keyboardNav;
  },

  /** Get section time for current section */
  getSectionTime(sectionIdx) {
    const config = this.getBehaviorConfig();
    const section = config.sections[sectionIdx];
    if (!section?.sectionTime) return null;
    return section.sectionTime;
  },

  _defaultBehavior() {
    return {
      sectionLocking: false,
      sectionTimers: false,
      calculator: false,
      keyboardNav: false,
      paletteType: 'default',
      negativeMarking: false,
      negativeValue: 0,
      marksPerQuestion: 1,
      totalTime: 3600,
      sections: [],
      renderer: null
    };
  },

  _getPreset() {
    if (!TestEngine.state?.config?.examId) return null;
    return ExamPresets.get(TestEngine.state.config.examId);
  }
};
window.RendererRouter = RendererRouter;
