// ============================================
// RIVAL BATTLE RENDERER — Arcade Competitive
// THIS is where combos, streaks, speed effects,
// neon glow, live battle status belong.
// ============================================
// Currently delegates to the default test page UI
// with gamification overlays enabled.
// Future: full arcade UI with live opponent panel.
// ============================================

const RivalBattleRenderer = {
  // Rival Battle uses the default TestPage UI
  // but with gamification/combo systems ENABLED
  // (they are disabled for all other renderers)

  isShowingInstructions() { return false; },
  resetState() { RendererBase.resetState(); },

  // Rival battle does NOT use CBT-style rendering
  // It returns null to signal TestPage to use its default UI
  // with arcade overlays
  renderInstructions() { return null; },
  renderTest() { return null; },
  refreshQuestion() { /* default UI handles this */ },
  refreshNav() { /* default UI handles this */ },
  updateTimer() { /* default UI handles this */ },

  // Flag: this mode allows combo/gamification
  allowsCombo() { return true; },
  allowsMotivation() { return true; }
};
window.RivalBattleRenderer = RivalBattleRenderer;
