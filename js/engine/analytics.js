// ============================================
// MOCK TEST PLATFORM — Analytics Engine
// ============================================

const Analytics = {

  // ── CACHE STATE ──
  _cache: {
    data: null,
    timestamp: 0,
    ttl: 60 * 1000 // 1 minute
  },

  // ── SUPABASE DRIVEN ANALYTICS ──

  async loadDashboardStats(forceRefresh = false) {
    // Check Cache first
    if (!forceRefresh && this._cache.data && (Date.now() - this._cache.timestamp < this._cache.ttl)) {
      console.log("📊 Serving dashboard from Cache");
      return this._cache.data;
    }

    console.log("🔄 Fetching fresh dashboard data from Supabase");
    window.USER_RESULTS = await window.getUserResults();
    
    const results = window.USER_RESULTS || [];
    
    if (results.length === 0) {
      return null; // No data
    }

    // Quick Stats
    const totalTests = results.length;
    const avgScore = Math.round(results.reduce((sum, r) => sum + (r.score_percent || 0), 0) / totalTests);
    const bestScore = Math.max(...results.map(r => r.score_percent || 0));

    // Accuracy Trend (Last 10 Tests from oldest to newest)
    const recentTests = results.slice(0, 10).reverse();
    const accuracyTrendArray = recentTests.map(r => r.score_percent || 0);
    const trendData = recentTests.map((r, idx) => ({ value: r.score_percent || 0, label: `T${idx+1}` }));

    // Improvement Rate (last 5 vs prev 5)
    let improvementRate = 0;
    if (results.length >= 2) {
      const last5 = results.slice(0, 5);
      const prev5 = results.slice(5, 10);
      const last5Avg = last5.length ? Math.round(last5.reduce((sum, r) => sum + r.score_percent, 0) / last5.length) : 0;
      const prev5Avg = prev5.length ? Math.round(prev5.reduce((sum, r) => sum + r.score_percent, 0) / prev5.length) : 0;
      
      if (prev5Avg > 0) {
        improvementRate = last5Avg - prev5Avg;
      } else {
        // If less than 6 tests, just compare the most recent with the average of the rest
        const recent = results[0].score_percent;
        const restAvg = results.length > 1 ? Math.round(results.slice(1).reduce((sum, r) => sum + r.score_percent, 0) / (results.length - 1)) : recent;
        improvementRate = recent - restAvg;
      }
    }

    // Topic Breakdown
    const topicStats = {};
    let totalQuestionsTime = 0;
    let totalQuestionsCount = 0;

    results.forEach(test => {
      // Time calculations - approx for now since time_per_question wasn't in DB fully
      // We will estimate based on total time / (correct+wrong+skipped)
      const qCount = (test.correct || 0) + (test.wrong || 0) + (test.skipped || 0);
      const avgTime = qCount > 0 ? (test.time_taken || 0) / qCount : 0;

      if (test.topic_wise_accuracy) {
        Object.entries(test.topic_wise_accuracy).forEach(([topic, data]) => {
          if (!topicStats[topic]) {
            topicStats[topic] = { correct: 0, wrong: 0, tests: 0, timeTotal: 0, qTotal: 0 };
          }
          topicStats[topic].correct += data.correct || 0;
          topicStats[topic].wrong += data.wrong || 0;
          topicStats[topic].tests += 1;
          
          const tq = (data.correct || 0) + (data.wrong || 0);
          topicStats[topic].qTotal += tq;
          topicStats[topic].timeTotal += (tq * avgTime); // rough estimate
        });
      }
    });

    // Format Topics
    const formattedTopics = Object.entries(topicStats).map(([topic, data]) => {
      const totalAttempted = data.correct + data.wrong;
      const accuracy = totalAttempted > 0 ? Math.round((data.correct / totalAttempted) * 100) : 0;
      const avgTimePerQ = data.qTotal > 0 ? Math.round(data.timeTotal / data.qTotal) : 0;
      
      return {
        topic,
        accuracy,
        tests: data.tests,
        avgTimePerQ
      };
    });

    // Weak & Slow logic
    const sortedByAcc = [...formattedTopics].sort((a, b) => a.accuracy - b.accuracy);
    const sortedByTime = [...formattedTopics].sort((a, b) => b.avgTimePerQ - a.avgTimePerQ);

    const weakTopic = sortedByAcc.length > 0 ? sortedByAcc[0] : null;
    const slowTopic = sortedByTime.length > 0 ? sortedByTime[0] : null;

    const finalStats = {
      totalTests,
      avgScore,
      bestScore,
      weakArea: weakTopic ? weakTopic.topic : 'None',
      accuracyTrendArray,
      trendData,
      improvementRate,
      topics: sortedByAcc, // weak to strong
      weakTopic,
      slowTopic
    };

    // Update Cache
    this._cache.data = finalStats;
    this._cache.timestamp = Date.now();

    return finalStats;
  },

  // ── LEGACY RETAINED FOR RESULTS PAGE ──

  /**
   * Draw a donut chart on canvas
   */
  drawDonutChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    const innerRadius = radius * 0.65;

    ctx.clearRect(0, 0, width, height);

    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return;

    let startAngle = -Math.PI / 2;

    data.forEach(item => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();

      startAngle += sliceAngle;
    });

    // Center text
    if (options.centerText) {
      ctx.fillStyle = '#F1F5F9';
      ctx.font = `bold ${Math.round(radius * 0.35)}px Outfit, Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(options.centerText, centerX, centerY - 8);

      if (options.centerSubText) {
        ctx.fillStyle = '#64748B';
        ctx.font = `${Math.round(radius * 0.15)}px Inter, sans-serif`;
        ctx.fillText(options.centerSubText, centerX, centerY + 16);
      }
    }
  },

  /**
   * Draw a bar chart on canvas
   */
  drawBarChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    if (data.length === 0) return;

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.min(40, (chartWidth / data.length) * 0.6);
    const gap = (chartWidth - barWidth * data.length) / (data.length + 1);

    // Draw bars
    data.forEach((item, i) => {
      const x = padding.left + gap + i * (barWidth + gap);
      const barHeight = (item.value / maxValue) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      // Bar gradient
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
      gradient.addColorStop(0, item.color || '#3B82F6');
      gradient.addColorStop(1, item.color ? item.color + '80' : '#3B82F680');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.label, x + barWidth / 2, height - 10);

      // Value
      ctx.fillStyle = '#F1F5F9';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`${item.value}%`, x + barWidth / 2, y - 8);
    });
  },

  /**
   * Draw a line chart on canvas
   */
  drawLineChart(canvas, data, options = {}) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    if (data.length < 2) return;

    const maxValue = Math.max(...data.map(d => d.value), 100);
    const minValue = 0;
    const range = maxValue - minValue;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Plot points and line
    const points = data.map((d, i) => ({
      x: padding.left + (i / (data.length - 1)) * chartWidth,
      y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight
    }));

    // Gradient fill under line
    const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

    ctx.beginPath();
    ctx.moveTo(points[0].x, height - padding.bottom);
    points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Dots
    points.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3B82F6';
      ctx.fill();
      ctx.strokeStyle = '#0c1222';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }
};
