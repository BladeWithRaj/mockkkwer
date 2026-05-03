// ============================================
// CONFIG — App-wide configuration
// ============================================

const CONFIG = {
  // ⚠️ REPLACE THIS with your Clerk publishable key from:
  // https://dashboard.clerk.com → Your App → API Keys
  CLERK_PUBLISHABLE_KEY: "pk_test_YmlnLXJheS05NC5jbGVyay5hY2NvdW50cy5kZXYk",

  // Clerk appearance (optional customization)
  CLERK_APPEARANCE: {
    variables: {
      colorPrimary: "#6366f1",
      colorText: "#1e293b",
      fontFamily: "'Inter', sans-serif",
      borderRadius: "12px"
    }
  }
};

window.CONFIG = CONFIG;
