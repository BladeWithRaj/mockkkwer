// ============================================
// QUANTITATIVE APTITUDE FLOW — v2.0
// Curated Practice & Study Hub with Interactive Testing
// Matches mocktestpro.com layout & scrollable test system
// ============================================

const AptitudePage = {
  _activeCategory: null,
  _searchQuery: '',
  _timerInterval: null,
  _testAnswers: {}, // key: questionId, value: selectedOptionIndex

  _categories: [
    {
      name: 'Arithmetic',
      description: 'Master basic mathematical calculations essential for all competitive exams',
      topics: [
        { id: 'percentage', name: 'Percentage', description: 'Problems on calculating percentages, increases and decreases', difficulty: 'Easy', examFrequency: 'Very High' },
        { id: 'profit-and-loss', name: 'Profit and Loss', description: 'Questions on calculating profit, loss, and discounts', difficulty: 'Medium', examFrequency: 'Very High' },
        { id: 'time-and-work', name: 'Time and Work', description: 'Problems on work efficiency, time taken, and multiple workers', difficulty: 'Medium', examFrequency: 'Very High' }
      ]
    },
    {
      name: 'Algebra',
      description: 'Equations and variables for aptitude tests',
      topics: [
        { id: 'quadratic-equations', name: 'Quadratic Equations', description: 'Solving quadratic equations and finding roots', difficulty: 'Medium', examFrequency: 'Medium' }
      ]
    },
    {
      name: 'Geometry',
      description: 'Properties of shapes for quantitative questions',
      topics: [
        { id: 'circles', name: 'Circles', description: 'Problems on tangents, chords, and theorems of circles', difficulty: 'Hard', examFrequency: 'High' }
      ]
    }
  ],

  // Quantitative Questions & Tests Database
  _questionsDb: {
    'percentage': {
      title: 'Percentage Questions',
      description: 'Practice questions on calculating percentages, increases and decreases, and success rates.',
      keyInformation: [
        { info: 'Total 2 Tests available for topic-wise mastery.' },
        { info: 'Covers successive percentage changes, population changes, and ratio problems.' },
        { info: 'Detailed step-by-step explanations in English & Hindi provided post-submission.' }
      ],
      tests: {
        'test-1': {
          title: 'Percentage Practice Test 1',
          duration: 5, // 5 minutes
          totalQuestions: 5,
          totalMarks: 5,
          marksPerQuestion: 1,
          negativeMarksPerQuestion: 0.25,
          questions: [
            {
              questionId: 'pct_t1_q1',
              questionText: 'If 20% of a number is 240, then what will be 120% of that number?',
              questionImage: null,
              options: [
                { text: '1440' }, { text: '1200' }, { text: '1080' }, { text: '960' }
              ],
              correctAnswer: 0,
              explanation: 'Let the number be x.<br>Given: 20% of x = 240 => x = 1200.<br>Now, 120% of 1200 = 1440.<br><b>Hindi:</b> माना संख्या x है। x का 20% = 240 => x = 1200. अतः 1200 का 120% = 1440.'
            },
            {
              questionId: 'pct_t1_q2',
              questionText: 'A fruit seller had some apples. He sells 40% apples and still has 420 apples. Originally, he had:',
              questionImage: null,
              options: [
                { text: '588 apples' }, { text: '600 apples' }, { text: '672 apples' }, { text: '700 apples' }
              ],
              correctAnswer: 3,
              explanation: 'Supposing he had x apples originally.<br>Sold = 40% => Remaining = 60%.<br>Given: 60% of x = 420 => x = (420 * 100) / 60 = 700 apples.<br><b>Hindi:</b> माना कुल सेब x थे। 40% बेचने के बाद बचे = 60%. दिया है: x का 60% = 420 => x = 700.'
            },
            {
              questionId: 'pct_t1_q3',
              questionText: 'What percentage of numbers from 1 to 70 have 1 or 9 in the unit\'s digit?',
              questionImage: null,
              options: [
                { text: '12%' }, { text: '14%' }, { text: '20%' }, { text: '21%' }
              ],
              correctAnswer: 2,
              explanation: 'Numbers ending in 1 are 1, 11, 21, 31, 41, 51, 61 (7 numbers).<br>Numbers ending in 9 are 9, 19, 29, 39, 49, 59, 69 (7 numbers).<br>Total numbers = 14.<br>Percentage = (14 / 70) * 100 = 20%.<br><b>Hindi:</b> 1 और 9 इकाई अंक वाली संख्याएं कुल 14 हैं। प्रतिशत = (14 / 70) * 100 = 20%.'
            },
            {
              questionId: 'pct_t1_q4',
              questionText: 'If A\'s income is 25% less than B\'s income, by how much percent is B\'s income more than A\'s income?',
              questionImage: null,
              options: [
                { text: '20%' }, { text: '25%' }, { text: '30%' }, { text: '33.33%' }
              ],
              correctAnswer: 3,
              explanation: 'Let B\'s income = 100.<br>A\'s income = 75.<br>B\'s income is more than A\'s by 25.<br>Percentage = (25 / 75) * 100 = 33.33%.<br><b>Hindi:</b> माना B की आय = 100, तो A = 75. B की आय A से 25 अधिक है। प्रतिशत = (25/75)*100 = 33.33%.'
            },
            {
              questionId: 'pct_t1_q5',
              questionText: 'A student has to obtain 33% of the total marks to pass. He got 125 marks and failed by 40 marks. The maximum marks are:',
              questionImage: null,
              options: [
                { text: '300' }, { text: '500' }, { text: '800' }, { text: '1000' }
              ],
              correctAnswer: 1,
              explanation: 'Passing marks = 125 + 40 = 165.<br>Given: 33% of Max Marks = 165.<br>=> Max Marks = (165 * 100) / 33 = 500.<br><b>Hindi:</b> उत्तीर्ण अंक = 125 + 40 = 165. 33% = 165 => कुल अंक = (165 * 100)/33 = 500.'
            }
          ]
        },
        'test-2': {
          title: 'Percentage Practice Test 2',
          duration: 5,
          totalQuestions: 3,
          totalMarks: 3,
          marksPerQuestion: 1,
          negativeMarksPerQuestion: 0.25,
          questions: [
            {
              questionId: 'pct_t2_q1',
              questionText: 'If the price of a commodity is increased by 50%, by how much must a consumer reduce consumption to keep expenditure constant?',
              options: [
                { text: '25%' }, { text: '33.33%' }, { text: '50%' }, { text: '20%' }
              ],
              correctAnswer: 1,
              explanation: 'Reduction in consumption = [R / (100 + R)] * 100 = [50 / 150] * 100 = 33.33%.<br><b>Hindi:</b> उपभोग में कमी = [R / (100 + R)] * 100 = [50 / 150] * 100 = 33.33%.'
            },
            {
              questionId: 'pct_t2_q2',
              questionText: 'The population of a town increases by 5% annually. If its present population is 92610, what was it 3 years ago?',
              options: [
                { text: '75000' }, { text: '80000' }, { text: '85000' }, { text: '90000' }
              ],
              correctAnswer: 1,
              explanation: 'Let population 3 years ago be P.<br>P * (1 + 5/100)³ = 92610 => P * (21/20)³ = 92610.<br>=> P * 9261 / 8000 = 92610 => P = 80000.<br><b>Hindi:</b> 3 वर्ष पूर्व जनसंख्या P थी। P * (21/20)³ = 92610 => P = 80000.'
            },
            {
              questionId: 'pct_t2_q3',
              questionText: 'In an election between two candidates, one got 55% of the total valid votes. 20% of the votes were invalid. If the total number of votes was 7500, the number of valid votes that the other candidate got was:',
              options: [
                { text: '2700' }, { text: '2900' }, { text: '3000' }, { text: '3100' }
              ],
              correctAnswer: 0,
              explanation: 'Total votes = 7500. Valid votes = 80% of 7500 = 6000.<br>One candidate got 55% of 6000 => Other candidate got 45% of 6000 = 2700.<br><b>Hindi:</b> कुल वोट = 7500, वैध वोट = 6000. दूसरे उम्मीदवार को मिले = 6000 का 45% = 2700.'
            }
          ]
        }
      }
    },
    'profit-and-loss': {
      title: 'Profit and Loss Questions',
      description: 'Practice questions on calculating profit, loss, and discounts in business transactions.',
      keyInformation: [
        { info: 'Total 2 Tests available for topic-wise mastery.' },
        { info: 'Covers CP, SP, MP, Successive Discounts, and Dishonest Dealer problems.' }
      ],
      tests: {
        'test-1': {
          title: 'Profit and Loss Practice Test 1',
          duration: 5,
          totalQuestions: 3,
          totalMarks: 3,
          marksPerQuestion: 1,
          negativeMarksPerQuestion: 0.25,
          questions: [
            {
              questionId: 'pl_t1_q1',
              questionText: 'An article is sold at a loss of 10%. Had it been sold for Rs. 90 more, there would have been a profit of 5%. What is the cost price of the article?',
              options: [
                { text: 'Rs. 500' }, { text: 'Rs. 600' }, { text: 'Rs. 650' }, { text: 'Rs. 700' }
              ],
              correctAnswer: 1,
              explanation: 'Difference in selling prices = 5% - (-10%) = 15% of CP.<br>Given: 15% of CP = Rs. 90 => CP = 600.<br><b>Hindi:</b> अंतर = 5% - (-10%) = 15%. 15% = 90 रुपये => क्रय मूल्य = 600 रुपये.'
            },
            {
              questionId: 'pl_t1_q2',
              questionText: 'A dishonest dealer claims to sell his goods at cost price but uses a weight of 900 grams for a kg. Find his gain percentage.',
              options: [
                { text: '10%' }, { text: '11.11%' }, { text: '12.5%' }, { text: '9%' }
              ],
              correctAnswer: 1,
              explanation: 'Gain % = [Error / (True Weight - Error)] * 100 = [100 / 900] * 100 = 11.11%.<br><b>Hindi:</b> लाभ % = [त्रुटि / (सही वजन - त्रुटि)] * 100 = [100/900] * 100 = 11.11%.'
            },
            {
              questionId: 'pl_t1_q3',
              questionText: 'By selling 45 lemons for Rs. 40, a man loses 20%. How many should he sell for Rs. 24 to gain 20% in the transaction?',
              options: [
                { text: '18' }, { text: '20' }, { text: '22' }, { text: '24' }
              ],
              correctAnswer: 0,
              explanation: 'Let CP of 45 lemons be x. 0.8x = 40 => CP of 45 lemons = 50. CP of 1 lemon = 50/45 = 10/9.<br>To gain 20%, SP of 1 lemon = (10/9) * 1.2 = 4/3.<br>Number of lemons for Rs. 24 = 24 / (4/3) = 18 lemons.<br><b>Hindi:</b> 45 नीबू का क्रय मूल्य = 50 रुपये। 20% लाभ पर 1 नीबू का विक्रय मूल्य = 4/3 रुपये। 24 रुपये में कुल नीबू = 24 / (4/3) = 18.'
            }
          ]
        }
      }
    },
    'time-and-work': {
      title: 'Time and Work Questions',
      description: 'Practice questions on work efficiency, pipes, cisterns, and collaborative work tasks.',
      keyInformation: [
        { info: 'Total 1 Test available.' },
        { info: 'Covers worker efficiency, combined task ratios, and alternate day schedules.' }
      ],
      tests: {
        'test-1': {
          title: 'Time and Work Practice Test 1',
          duration: 5,
          totalQuestions: 2,
          totalMarks: 2,
          marksPerQuestion: 1,
          negativeMarksPerQuestion: 0.25,
          questions: [
            {
              questionId: 'tw_t1_q1',
              questionText: 'A can complete a piece of work in 12 days and B can do it in 15 days. In how many days can they complete the work together?',
              options: [
                { text: '6 days' }, { text: '6 2/3 days' }, { text: '5 5/9 days' }, { text: '8 days' }
              ],
              correctAnswer: 1,
              explanation: 'Combined rate = 1/12 + 1/15 = 9/60 = 3/20.<br>Time taken = 20/3 = 6 2/3 days.<br><b>Hindi:</b> संयुक्त दर = 1/12 + 1/15 = 3/20. समय = 20/3 = 6 2/3 दिन.'
            },
            {
              questionId: 'tw_t1_q2',
              questionText: 'A is thrice as efficient as B and is therefore able to finish a job in 60 days less than B. Working together, they can do it in:',
              options: [
                { text: '20 days' }, { text: '22.5 days' }, { text: '25 days' }, { text: '30 days' }
              ],
              correctAnswer: 1,
              explanation: 'Efficiency ratio A:B = 3:1. Time ratio A:B = 1:3.<br>Difference = 3x - x = 2x = 60 => x = 30 days.<br>A takes 30 days, B takes 90 days.<br>Working together: (30 * 90) / (30 + 90) = 22.5 days.<br><b>Hindi:</b> दक्षता अनुपात A:B = 3:1, समय का अनुपात = 1:3. अंतर 2x = 60 => A = 30 दिन, B = 90 दिन। साथ मिलकर = (30 * 90) / 120 = 22.5 दिन.'
            }
          ]
        }
      }
    }
  },

  render(params = {}) {
    // Clean up timer when switching away from test view
    if (params.view !== 'test' && this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }

    if (params.view === 'exam' && params.id) {
      return this._renderExamView(params.id);
    }
    if (params.view === 'test' && params.examId && params.testId) {
      return this._renderTestView(params.examId, params.testId);
    }
    if (params.view === 'result' && params.examId && params.testId) {
      return this._renderResultView(params.examId, params.testId);
    }

    return this._renderCategoryView();
  },

  // ════════════════════════════════════════════
  // VIEW 1: CATEGORY DIRECTORY LISTING
  // ════════════════════════════════════════════
  _renderCategoryView() {
    const search = this._searchQuery.toLowerCase();

    const filteredCategories = this._categories.map(cat => {
      const filteredTopics = cat.topics.filter(t => {
        return !search || 
               t.name.toLowerCase().includes(search) || 
               t.description.toLowerCase().includes(search) || 
               cat.name.toLowerCase().includes(search);
      });
      return { ...cat, topics: filteredTopics };
    }).filter(cat => cat.topics.length > 0);

    const categoriesHtml = filteredCategories.map(cat => {
      const topicsHtml = cat.topics.map(t => {
        const dbEntry = this._questionsDb[t.id];
        const testsCount = dbEntry ? Object.keys(dbEntry.tests).length : 0;
        return `
          <div data-topic-search="${cat.name} ${t.name} ${t.description}" style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:var(--shadow-sm);transition:all 0.2s;" onmouseover="this.style.borderColor='#3B82F660'" onmouseout="this.style.borderColor='var(--border)'">
            <div>
              <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
                <span style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);background:var(--surface-elevated);padding:2px 8px;border-radius:999px;">${t.difficulty}</span>
                <span style="font-size:10px;font-weight:700;color:#3B82F6;">${t.examFrequency} Freq</span>
              </div>
              <h3 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 8px;">${t.name}</h3>
              <p style="font-size:12.5px;color:var(--text-secondary);line-height:1.5;margin-bottom:16px;">${t.description}</p>
            </div>
            <div>
              <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;display:flex;align-items:center;gap:6px;">
                📚 <strong>${testsCount} Mock Tests</strong> Available
              </div>
              ${testsCount > 0 
                ? `<a href="#aptitude?view=exam&id=${t.id}" class="btn btn-primary" style="width:100%;text-align:center;padding:10px;font-size:12.5px;font-weight:700;border-radius:8px;display:block;text-decoration:none;">Take Aptitude Mock Test</a>`
                : `<button class="btn btn-secondary" style="width:100%;text-align:center;padding:10px;font-size:12.5px;font-weight:700;border-radius:8px;" disabled>Coming Soon</button>`
              }
            </div>
          </div>
        `;
      }).join('');

      return `
        <div data-category-section style="margin-bottom:32px;">
          <div style="border-left:3px solid #3B82F6;padding-left:12px;margin-bottom:16px;">
            <h2 style="font-size:20px;font-weight:800;color:var(--text-primary);margin:0;">${cat.name}</h2>
            <p style="font-size:13px;color:var(--text-muted);margin:2px 0 0;">${cat.description}</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:20px;">
            ${topicsHtml}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="max-width:1100px;margin:0 auto;padding:24px 16px 80px;">
        <div style="background:linear-gradient(135deg, #1E3A8A, #3B82F6);color:white;border-radius:18px;padding:32px;margin-bottom:24px;box-shadow:0 8px 20px rgba(59,130,246,0.2);">
          <h1 style="font-size:28px;font-weight:800;margin:0 0 8px;font-family:var(--font-display);">Quantitative Aptitude Hub</h1>
          <p style="font-size:14px;opacity:0.9;margin:0;max-width:650px;line-height:1.5;">Master numerical problem-solving for competitive exams. Select a topic, explore available timed tests, and analyze your performance with step-by-step logic sheets.</p>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:24px;display:flex;align-items:center;position:relative;">
          <span style="position:absolute;left:20px;color:var(--text-muted);font-size:16px;">🔍</span>
          <input type="text" placeholder="Search for quantitative aptitude topics (e.g. percentage, profit and loss, ratio)..." 
            style="width:100%;height:40px;border:none;background:transparent;padding-left:32px;font-size:14px;color:var(--text-primary);outline:none;" 
            value="${this._searchQuery}" oninput="AptitudePage.handleSearch(this.value)">
        </div>

        <div id="aptitude-categories-container">
          ${categoriesHtml || `<div style="text-align:center;padding:40px;color:var(--text-muted);">No topics found matching search query.</div>`}
        </div>
      </div>
    `;
  },

  // ════════════════════════════════════════════
  // VIEW 2: EXAM DETAIL TEST SELECTION VIEW
  // ════════════════════════════════════════════
  _renderExamView(topicId) {
    const topic = this._questionsDb[topicId];
    if (!topic) return '<div style="padding:40px;text-align:center;">Topic not found.</div>';

    const testCardsHtml = Object.entries(topic.tests).map(([testId, test]) => {
      return `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;justify-content:space-between;align-items:center;box-shadow:var(--shadow-sm);transition:all 0.2s;" onmouseover="this.style.borderColor='#3B82F6'" onmouseout="this.style.borderColor='var(--border)'">
          <div>
            <h3 style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0 0 6px;">${test.title}</h3>
            <div style="display:flex;gap:16px;font-size:12px;color:var(--text-muted);">
              <span>📋 <strong>${test.totalQuestions}</strong> Questions</span>
              <span>💯 <strong>${test.totalMarks}</strong> Marks</span>
              <span>⏱️ <strong>${test.duration}</strong> Minutes</span>
            </div>
          </div>
          <a href="#aptitude?view=test&examId=${topicId}&testId=${testId}" class="btn btn-primary" style="padding:8px 16px;font-size:12.5px;font-weight:700;border-radius:8px;text-decoration:none;">Start Test</a>
        </div>
      `;
    }).join('');

    return `
      <div style="max-width:800px;margin:0 auto;padding:24px 16px 80px;">
        <div style="margin-bottom:16px;">
          <a href="#aptitude" style="text-decoration:none;color:#3B82F6;font-size:13px;font-weight:600;">&larr; Back to Topics</a>
        </div>

        <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:24px;box-shadow:var(--shadow-sm);">
          <h1 style="font-size:22px;font-weight:800;color:var(--text-primary);margin:0 0 8px;">${topic.title}</h1>
          <p style="font-size:13.5px;color:var(--text-secondary);line-height:1.6;margin:0 0 16px;">${topic.description}</p>
          
          <div style="border-top:1px solid var(--border);padding-top:16px;">
            <h4 style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin:0 0 8px;">Key Guidelines:</h4>
            <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--text-secondary);line-height:1.7;">
              ${topic.keyInformation.map(k => `<li>${k.info}</li>`).join('')}
            </ul>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:16px;">
          <h2 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">Available Mock Tests:</h2>
          ${testCardsHtml}
        </div>
      </div>
    `;
  },

  // ════════════════════════════════════════════
  // VIEW 3: SCROLLABLE MOCK TEST SCREEN
  // ════════════════════════════════════════════
  _renderTestView(examId, testId) {
    const topic = this._questionsDb[examId];
    const test = topic ? topic.tests[testId] : null;
    if (!test) return '<div style="padding:40px;text-align:center;">Test not found.</div>';

    // Initialize timer if not already running
    if (!this._timerInterval) {
      this._testRemainingTime = test.duration * 60;
      this._testAnswers = {};
      this._startTestTimer(examId, testId);
    }

    const minutes = Math.floor(this._testRemainingTime / 60);
    const seconds = this._testRemainingTime % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const questionsHtml = test.questions.map((q, qIdx) => {
      const selected = this._testAnswers[q.questionId];
      const optionsHtml = q.options.map((opt, oIdx) => {
        const isChecked = selected === oIdx;
        return `
          <label style="display:flex;align-items:flex-start;gap:12px;padding:12px;background:var(--surface-elevated);border:1px solid ${isChecked ? '#3B82F6' : 'var(--border)'};border-radius:10px;cursor:pointer;transition:border-color 0.2s;">
            <input type="radio" name="q_${q.questionId}" value="${oIdx}" ${isChecked ? 'checked' : ''} 
              onchange="AptitudePage.handleOptionSelect('${q.questionId}', ${oIdx})" 
              style="margin-top:4px;">
            <span style="font-size:13.5px;color:var(--text-secondary);line-height:1.4;">
              <strong style="color:var(--text-primary);margin-right:6px;">${String.fromCharCode(65 + oIdx)}.</strong>
              ${opt.text}
            </span>
          </label>
        `;
      }).join('');

      return `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:var(--shadow-sm);">
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:8px;">QUESTION ${qIdx + 1} OF ${test.totalQuestions}</div>
          <div style="font-size:15px;font-weight:600;color:var(--text-primary);line-height:1.5;margin-bottom:16px;">${q.questionText}</div>
          <div style="display:grid;grid-template-columns:1fr;gap:10px;">
            ${optionsHtml}
          </div>
        </div>
      `;
    }).join('');

    return `
      <!-- Sticky Header -->
      <div style="position:sticky;top:0;z-index:100;background:var(--surface);border-bottom:1px solid var(--border);padding:14px 20px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h1 style="font-size:15px;font-weight:800;color:var(--text-primary);margin:0;">${test.title}</h1>
          <span style="font-size:11px;color:var(--text-muted);">Mode: Scrollable Practice Test</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div id="aptitude-timer" style="background:rgba(239,68,68,0.1);color:#EF4444;font-size:14px;font-weight:700;padding:6px 12px;border-radius:8px;font-family:monospace;letter-spacing:1px;">
            ⏱️ ${timeStr}
          </div>
          <button class="btn btn-primary" onclick="AptitudePage.submitTest('${examId}', '${testId}')" style="padding:8px 16px;font-size:12.5px;font-weight:700;border-radius:8px;">Submit Test</button>
        </div>
      </div>

      <!-- Questions List -->
      <div style="max-width:760px;margin:24px auto 80px;padding:0 16px;">
        ${questionsHtml}
        
        <div style="text-align:center;margin-top:32px;">
          <button class="btn btn-primary" onclick="AptitudePage.submitTest('${examId}', '${testId}')" style="padding:12px 32px;font-size:14px;font-weight:700;border-radius:10px;box-shadow:0 4px 10px rgba(59,130,246,0.2);">Submit Mock Test</button>
        </div>
      </div>
    `;
  },

  // ════════════════════════════════════════════
  // VIEW 4: TEST RESULTS & SOLUTION SHEETS VIEW
  // ════════════════════════════════════════════
  _renderResultView(examId, testId) {
    const topic = this._questionsDb[examId];
    const test = topic ? topic.tests[testId] : null;
    if (!test) return '<div style="padding:40px;text-align:center;">Test results not found.</div>';

    // Calculate scores
    let correctCount = 0;
    let wrongCount = 0;
    let unansweredCount = 0;

    test.questions.forEach(q => {
      const ans = this._testAnswers[q.questionId];
      if (ans === undefined) {
        unansweredCount++;
      } else if (ans === q.correctAnswer) {
        correctCount++;
      } else {
        wrongCount++;
      }
    });

    const marksObtained = (correctCount * test.marksPerQuestion) - (wrongCount * test.negativeMarksPerQuestion);
    const maxMarks = test.totalQuestions * test.marksPerQuestion;
    const accuracyPct = test.totalQuestions > 0 ? Math.round((correctCount / test.totalQuestions) * 100) : 0;
    const isPassed = accuracyPct >= 50;

    const reviewCardsHtml = test.questions.map((q, qIdx) => {
      const userAns = this._testAnswers[q.questionId];
      const isUserCorrect = userAns === q.correctAnswer;

      const optionsHtml = q.options.map((opt, oIdx) => {
        const isCorrectOpt = oIdx === q.correctAnswer;
        const isUserOpt = oIdx === userAns;
        
        let bg = 'transparent';
        let border = 'var(--border)';
        let color = 'var(--text-secondary)';
        let labelSuffix = '';

        if (isCorrectOpt) {
          bg = 'rgba(16,185,129,0.08)';
          border = '#10B981';
          color = '#10B981';
          labelSuffix = ' <span style="font-size:10px;font-weight:700;color:#10B981;margin-left:6px;">(Correct Answer)</span>';
        } else if (isUserOpt && !isCorrectOpt) {
          bg = 'rgba(239,68,68,0.08)';
          border = '#EF4444';
          color = '#EF4444';
          labelSuffix = ' <span style="font-size:10px;font-weight:700;color:#EF4444;margin-left:6px;">(Your Answer)</span>';
        }

        return `
          <div style="display:flex;padding:12px;background:${bg};border:1px solid ${border};border-radius:10px;margin-bottom:8px;">
            <span style="font-size:13.5px;color:${color};line-height:1.4;">
              <strong style="color:var(--text-primary);margin-right:6px;">${String.fromCharCode(65 + oIdx)}.</strong>
              ${opt.text} ${labelSuffix}
            </span>
          </div>
        `;
      }).join('');

      return `
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;margin-bottom:20px;box-shadow:var(--shadow-sm);">
          <div style="display:flex;justify-content:between;align-items:center;margin-bottom:12px;">
            <span style="font-size:12px;font-weight:700;color:var(--text-muted);">QUESTION ${qIdx + 1} OF ${test.totalQuestions}</span>
            <span style="font-size:11px;font-weight:700;color:${isUserCorrect ? '#10B981' : userAns === undefined ? 'var(--text-muted)' : '#EF4444'};margin-left:auto;">
              ${isUserCorrect ? '✅ Correct' : userAns === undefined ? '⚪ Unanswered' : '❌ Incorrect'}
            </span>
          </div>

          <div style="font-size:15px;font-weight:600;color:var(--text-primary);line-height:1.5;margin-bottom:16px;">${q.questionText}</div>
          
          <div style="display:grid;grid-template-columns:1fr;gap:4px;">
            ${optionsHtml}
          </div>

          <!-- Detailed Solution -->
          <div style="margin-top:16px;padding:16px;background:var(--surface-elevated);border-radius:10px;border-left:3px solid #3B82F6;">
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;color:#3B82F6;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
              💡 Detailed Solution / व्याख्या:
            </div>
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">${q.explanation}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="max-width:760px;margin:24px auto 80px;padding:0 16px;">
        <div style="margin-bottom:16px;">
          <a href="#aptitude?view=exam&id=${examId}" style="text-decoration:none;color:#3B82F6;font-size:13px;font-weight:600;">&larr; Back to Test List</a>
        </div>

        <!-- Score Dashboard -->
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:18px;padding:28px;margin-bottom:24px;text-align:center;box-shadow:var(--shadow-sm);">
          <h1 style="font-size:22px;font-weight:800;color:var(--text-primary);margin:0 0 8px;">Test Results & Analysis</h1>
          
          <div style="margin:20px 0;display:flex;justify-content:center;gap:40px;">
            <div>
              <div style="font-size:32px;font-weight:800;color:#3B82F6;">${marksObtained.toFixed(2)}/${maxMarks}</div>
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Score</div>
            </div>
            <div>
              <div style="font-size:32px;font-weight:800;color:${isPassed ? '#10B981' : '#EF4444'};">${accuracyPct}%</div>
              <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;">Accuracy</div>
            </div>
          </div>

          <div style="background:var(--surface-elevated);border-radius:12px;padding:12px;display:flex;justify-content:space-around;font-size:12.5px;color:var(--text-secondary);margin-bottom:16px;">
            <span>Correct: <strong style="color:#10B981">${correctCount}</strong></span>
            <span>Wrong: <strong style="color:#EF4444">${wrongCount}</strong></span>
            <span>Unanswered: <strong>${unansweredCount}</strong></span>
          </div>

          <p style="font-size:13.5px;color:var(--text-secondary);line-height:1.5;margin:0;">
            ${isPassed 
              ? '🎉 <strong>Congratulations!</strong> You did great in this topic mock test. Review the step-by-step logic sheets below to ensure you have no residual gaps.'
              : '💪 <strong>Keep practicing!</strong> Review the explanations below, identify the formula gaps, and try again to improve your score.'
            }
          </p>
        </div>

        <!-- Question Review list -->
        <div>
          <h2 style="font-size:16px;font-weight:700;color:var(--text-primary);margin:0 0 16px;">Question Review & Explanations:</h2>
          ${reviewCardsHtml}
        </div>
      </div>
    `;
  },

  handleSearch(val) {
    this._searchQuery = val;
    // Update DOM in-place instead of full re-render to preserve input focus
    const container = document.getElementById('aptitude-categories-container');
    if (container) {
      const search = val.toLowerCase();
      const allCards = container.querySelectorAll('[data-topic-search]');
      allCards.forEach(card => {
        const text = (card.dataset.topicSearch || '').toLowerCase();
        card.style.display = (!search || text.includes(search)) ? '' : 'none';
      });
      // Show/hide category headers if all children hidden
      const sections = container.querySelectorAll('[data-category-section]');
      sections.forEach(section => {
        const visible = section.querySelectorAll('[data-topic-search]:not([style*="display: none"])');
        section.style.display = visible.length > 0 ? '' : 'none';
      });
    } else {
      this.refresh();
    }
  },

  selectTopic(topicId) {
    if (window.App) {
      App.navigate('aptitude', { view: 'exam', id: topicId });
    }
  },

  handleOptionSelect(qId, oIdx) {
    this._testAnswers[qId] = oIdx;
    // Don't fully refresh the DOM to prevent input glitches, just update CSS classes on target options
    const options = document.getElementsByName(`q_${qId}`);
    options.forEach((opt, idx) => {
      const parent = opt.parentElement;
      if (parent) {
        if (idx === oIdx) {
          parent.style.borderColor = '#3B82F6';
          opt.checked = true;
        } else {
          parent.style.borderColor = 'var(--border)';
        }
      }
    });
  },

  _startTestTimer(examId, testId) {
    this._timerInterval = setInterval(() => {
      if (this._testRemainingTime > 0) {
        this._testRemainingTime--;
        
        // Update DOM timer element directly for 60fps responsiveness
        const timerEl = document.getElementById('aptitude-timer');
        if (timerEl) {
          const minutes = Math.floor(this._testRemainingTime / 60);
          const seconds = this._testRemainingTime % 60;
          timerEl.textContent = `⏱️ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      } else {
        // Time is up! Submit automatically
        clearInterval(this._timerInterval);
        this._timerInterval = null;
        AptitudePage.submitTest(examId, testId);
      }
    }, 1000);
  },

  submitTest(examId, testId) {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
    
    // Process results
    const topic = this._questionsDb[examId];
    const test = topic ? topic.tests[testId] : null;

    if (test && window.EventBus) {
      // Emit stats to mistake DNA and LODE decisions systems
      let correct = 0;
      test.questions.forEach(q => {
        if (this._testAnswers[q.questionId] === q.correctAnswer) {
          correct++;
        }
      });
      const pct = Math.round((correct / test.totalQuestions) * 100);

      // Past tense, underscores, lowercase
      EventBus.emit('mock_completed', {
        examId,
        testId,
        accuracy: pct,
        correct,
        totalQuestions: test.totalQuestions,
        timestamp: Date.now()
      });
    }

    if (window.App) {
      App.navigate('aptitude', { view: 'result', examId, testId });
    }
  },

  refresh() {
    if (window.App && App.currentPage === 'aptitude') {
      const footer = App._renderFooter ? App._renderFooter() : '';
      const appEl = document.getElementById('app');
      appEl.innerHTML = App._renderHeader('aptitude') + this.render(App.params) + footer;
      if (this.afterRender) this.afterRender();
    }
  },

  afterRender() {},
  destroy() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }
};

window.AptitudePage = AptitudePage;
