// ============================================
// CONFIG — App-wide configuration
// ============================================

const CONFIG = {
  // App info
  APP_NAME: "MockTestPro",
  VERSION: "2.0",

  // Auth mode
  AUTH_MODE: "username", // username-based identity (no Clerk, no OTP)

  // Appearance
  APPEARANCE: {
    colorPrimary: "#6366f1",
    colorText: "#1e293b",
    fontFamily: "'Inter', sans-serif",
    borderRadius: "12px"
  }
};

window.CONFIG = CONFIG;
