// ============================================
// BREADCRUMB — Context-aware navigation trail
// Max 4 levels, last item non-link
// Mobile: back arrow + parent label only
// ============================================

const Breadcrumb = {

  // ── Route → breadcrumb config map ──
  _routes: {
    home:        [],
    board:       (p) => [{ label: 'Exams', href: '#board' }],
    setup:       (p) => [{ label: 'Practice', href: '#setup' }],
    test:        (p) => [{ label: 'Practice', href: '#setup' }, { label: 'Test in Progress' }],
    result:      (p) => [{ label: 'Practice', href: '#setup' }, { label: 'Results' }],
    analysis:    (p) => [{ label: 'Practice', href: '#setup' }, { label: 'Results', href: '#result' }, { label: 'Analysis' }],
    dashboard:   (p) => [{ label: 'Dashboard' }],
    analytics:   (p) => [{ label: 'Dashboard', href: '#dashboard' }, { label: 'Analytics' }],
    profile:     (p) => [{ label: 'Profile' }],
    battle:      (p) => [{ label: 'AI Battle' }],
    exam:        (p) => {
      const examMap = {
        'ssc-cgl': { label: 'SSC CGL', parent: 'SSC' },
        'ssc-chsl': { label: 'SSC CHSL', parent: 'SSC' },
        'rrb-ntpc': { label: 'Railway NTPC', parent: 'Railway' },
        'ibps-po': { label: 'IBPS PO', parent: 'Banking' },
        'sbi-po': { label: 'SBI PO', parent: 'Banking' },
      };
      const info = examMap[p?.id] || { label: p?.id || 'Exam', parent: 'Exams' };
      return [
        { label: 'Exams', href: '#board' },
        { label: info.parent, href: `#board?id=${info.parent}` },
        { label: info.label }
      ];
    },
    polytechnic: (p) => [{ label: 'Polytechnic' }],
  },

  // ── Render breadcrumb HTML ──
  render(page, params = {}) {
    const configFn = this._routes[page];
    if (!configFn) return '';

    const items = typeof configFn === 'function' ? configFn(params) : configFn;
    if (!items || !items.length) return '';

    const allItems = [{ label: 'Home', href: '#home' }, ...items];
    const parentItem = allItems[allItems.length - 2] || { label: 'Home', href: '#home' };
    const currentItem = allItems[allItems.length - 1];

    const sepSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`;
    const backSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>`;

    const breadcrumbDesktop = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        ${allItems.map((item, i) => {
          const isLast = i === allItems.length - 1;
          return `
            <span class="breadcrumb-item">
              ${i > 0 ? `<span class="breadcrumb-sep">${sepSvg}</span>` : ''}
              ${isLast
                ? `<span class="breadcrumb-current">${this._esc(item.label)}</span>`
                : `<a href="${item.href || '#'}" class="breadcrumb-link">${this._esc(item.label)}</a>`
              }
            </span>
          `;
        }).join('')}
      </nav>
    `;

    const breadcrumbMobile = parentItem.href ? `
      <nav class="breadcrumb-mobile" aria-label="Go back">
        <a href="${parentItem.href}" class="breadcrumb-mobile-link">
          ${backSvg}
          <span>${this._esc(parentItem.label)}</span>
        </a>
      </nav>
    ` : '';

    return breadcrumbDesktop + breadcrumbMobile;
  },

  _esc(str) {
    return String(str).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};
