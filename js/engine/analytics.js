// ============================================
// MOCK TEST PLATFORM — Analytics Engine
// ============================================

const Analytics = {
  /**
   * Get overall performance stats from history
   */
  getOverallStats() {
    const history = Storage.getHistory();
    if (history.length === 0) {
      return {
        totalTests: 0,
        avgAccuracy: 0,
        totalQuestions: 0,
        totalTime: 0,
        bestScore: 0,
        worstScore: 0,
        trend: []
      };
    }

    const totalTests = history.length;
    const avgAccuracy = Math.round(
      history.reduce((sum, t) => sum + (t.accuracy || 0), 0) / totalTests
    );
    const totalQuestions = history.reduce((sum, t) => sum + (t.totalQuestions || 0), 0);
    const totalTime = history.reduce((sum, t) => sum + (t.timeTaken || 0), 0);
    const bestScore = Math.max(...history.map(t => t.accuracy || 0));
    const worstScore = Math.min(...history.map(t => t.accuracy || 0));

    // Performance trend (last 10 tests)
    const trend = history.slice(0, 10).reverse().map(t => ({
      accuracy: t.accuracy || 0,
      date: t.date,
      score: t.totalMarks || 0
    }));

    return { totalTests, avgAccuracy, totalQuestions, totalTime, bestScore, worstScore, trend };
  },

  /**
   * Get subject-wise performance across all tests
   */
  getSubjectPerformance() {
    const history = Storage.getHistory();
    const subjects = {};

    history.forEach(test => {
      if (test.subjectWise) {
        Object.entries(test.subjectWise).forEach(([subject, data]) => {
          if (!subjects[subject]) {
            subjects[subject] = { total: 0, correct: 0, wrong: 0, skipped: 0 };
          }
          subjects[subject].total += data.total;
          subjects[subject].correct += data.correct;
          subjects[subject].wrong += data.wrong;
          subjects[subject].skipped += data.skipped;
        });
      }
    });

    return Object.entries(subjects).map(([name, data]) => ({
      name,
      ...data,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      color: Helpers.getSubjectColor(name),
      icon: Helpers.getSubjectIcon(name)
    }));
  },

  /**
   * Get weak topics across all tests
   */
  getWeakTopics() {
    const history = Storage.getHistory();
    const topics = {};

    history.forEach(test => {
      if (test.topicWise) {
        Object.entries(test.topicWise).forEach(([key, data]) => {
          if (!topics[key]) {
            topics[key] = { total: 0, correct: 0, subject: data.subject, topic: data.topic };
          }
          topics[key].total += data.total;
          topics[key].correct += data.correct;
        });
      }
    });

    return Object.entries(topics)
      .map(([key, data]) => ({
        name: key,
        ...data,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0
      }))
      .filter(t => t.accuracy < 60 && t.total >= 2)
      .sort((a, b) => a.accuracy - b.accuracy);
  },

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
