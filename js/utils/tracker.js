let queue = [];

function trackEvent(event, data = {}) {
  try {
    const user_id = localStorage.getItem("user_id") || "anonymous";
    const variant = localStorage.getItem("variant") || "A";
    
    // Enforce consistent schema
    const payload = { 
      event, 
      data: {
        ...data,
        user_id,
        variant
      }, 
      ts: Date.now() 
    };

    queue.push(payload);
    
    // local debug
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
      console.log("📊 TRACK:", payload);
    }

    if (queue.length >= 5) flushTracker();
  } catch (e) {}
}

function flushTracker() {
  if (queue.length === 0) return;
  const payload = [...queue];
  queue = [];

  // Use sendBeacon for beforeunload if supported
  if (document.visibilityState === 'hidden' && navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", JSON.stringify(payload));
    return;
  }

  fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(() => {
    // Retry system
    queue = payload.concat(queue);
  });
}

// Flush on page leave
window.addEventListener('beforeunload', flushTracker);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushTracker();
});

window.trackEvent = trackEvent;
window.flushTracker = flushTracker;
