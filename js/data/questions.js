// ============================================
// MOCK TEST PLATFORM — Question Bank
// 50+ questions across Math, GK, Reasoning, English, Hindi
// ============================================

const QUESTION_BANK = [
  // ═══════════════════════════════════════
  // MATH — Arithmetic
  // ═══════════════════════════════════════
  {
    id: "m001",
    question: "यदि एक वस्तु का क्रय मूल्य ₹800 है और विक्रय मूल्य ₹920 है, तो लाभ प्रतिशत क्या होगा?",
    options: ["12%", "15%", "18%", "20%"],
    correct: 1,
    explanation: "लाभ = 920 - 800 = ₹120। लाभ% = (120/800) × 100 = 15%",
    subject: "Math",
    topic: "Profit & Loss",
    difficulty: "easy",
    exam: ["SSC", "Railway"],
    pyq: false,
    year: null
  },
  {
    id: "m002",
    question: "A train 150m long passes a pole in 15 seconds. What is the speed of the train in km/hr?",
    options: ["36 km/hr", "40 km/hr", "32 km/hr", "28 km/hr"],
    correct: 0,
    explanation: "Speed = Distance/Time = 150/15 = 10 m/s = 10 × 18/5 = 36 km/hr",
    subject: "Math",
    topic: "Speed & Distance",
    difficulty: "easy",
    exam: ["SSC", "Railway"],
    pyq: true,
    year: 2022
  },
  {
    id: "m003",
    question: "दो संख्याओं का अनुपात 3:5 है और उनका LCM 120 है। उनका HCF क्या है?",
    options: ["4", "6", "8", "10"],
    correct: 2,
    explanation: "माना संख्याएं 3x और 5x हैं। LCM = 15x = 120, x = 8। HCF = x = 8",
    subject: "Math",
    topic: "Number System",
    difficulty: "medium",
    exam: ["SSC"],
    pyq: true,
    year: 2021
  },
  {
    id: "m004",
    question: "A can do a piece of work in 12 days and B can do it in 18 days. In how many days will they complete the work together?",
    options: ["6.2 days", "7.2 days", "8.5 days", "9 days"],
    correct: 1,
    explanation: "A's 1 day work = 1/12, B's 1 day work = 1/18. Together = 1/12 + 1/18 = 5/36. Days = 36/5 = 7.2 days",
    subject: "Math",
    topic: "Time & Work",
    difficulty: "medium",
    exam: ["SSC", "Railway"],
    pyq: false,
    year: null
  },
  {
    id: "m005",
    question: "₹5000 का 2 वर्ष का चक्रवृद्धि ब्याज 10% वार्षिक दर से कितना होगा?",
    options: ["₹1000", "₹1050", "₹1100", "₹1150"],
    correct: 1,
    explanation: "CI = P[(1+R/100)^n - 1] = 5000[(1.1)² - 1] = 5000[1.21-1] = 5000 × 0.21 = ₹1050",
    subject: "Math",
    topic: "Interest",
    difficulty: "medium",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2023
  },
  {
    id: "m006",
    question: "If the perimeter of a square is 64 cm, what is its area?",
    options: ["196 cm²", "256 cm²", "324 cm²", "144 cm²"],
    correct: 1,
    explanation: "Side = 64/4 = 16 cm. Area = 16² = 256 cm²",
    subject: "Math",
    topic: "Geometry",
    difficulty: "easy",
    exam: ["SSC", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "m007",
    question: "एक पाइप एक टंकी को 6 घंटे में भरता है और दूसरा पाइप 8 घंटे में খালি करता है। दोनों एक साथ खोलने पर टंकी कितने समय में भरेगी?",
    options: ["20 घंटे", "24 घंटे", "18 घंटे", "22 घंटे"],
    correct: 1,
    explanation: "भरने वाला = 1/6, खाली करने वाला = 1/8। शुद्ध = 1/6 - 1/8 = 1/24। समय = 24 घंटे",
    subject: "Math",
    topic: "Pipe & Cistern",
    difficulty: "hard",
    exam: ["SSC"],
    pyq: false,
    year: null
  },
  {
    id: "m008",
    question: "What is the value of √(144 × 81)?",
    options: ["98", "104", "108", "112"],
    correct: 2,
    explanation: "√(144 × 81) = √144 × √81 = 12 × 9 = 108",
    subject: "Math",
    topic: "Simplification",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "m009",
    question: "A mixture contains milk and water in the ratio 5:3. If 16 litres of mixture is removed and replaced with water, the ratio becomes 3:5. What was the original quantity?",
    options: ["32 litres", "40 litres", "48 litres", "36 litres"],
    correct: 1,
    explanation: "Let total = 8x. Milk = 5x, Water = 3x. After removing 16L: Milk = 5x - 10, Water = 3x - 6 + 16 = 3x + 10. Ratio: (5x-10)/(3x+10) = 3/5. 25x-50 = 9x+30. 16x = 80. x = 5. Total = 40L",
    subject: "Math",
    topic: "Mixture",
    difficulty: "hard",
    exam: ["SSC"],
    pyq: true,
    year: 2022
  },
  {
    id: "m010",
    question: "यदि sin θ = 3/5 तो cos θ का मान क्या होगा?",
    options: ["3/5", "4/5", "5/4", "5/3"],
    correct: 1,
    explanation: "sin²θ + cos²θ = 1। cos²θ = 1 - 9/25 = 16/25। cos θ = 4/5",
    subject: "Math",
    topic: "Trigonometry",
    difficulty: "medium",
    exam: ["SSC"],
    pyq: true,
    year: 2023
  },

  // ═══════════════════════════════════════
  // GENERAL KNOWLEDGE
  // ═══════════════════════════════════════
  {
    id: "g001",
    question: "भारत का सबसे बड़ा राज्य (क्षेत्रफल के अनुसार) कौन सा है?",
    options: ["मध्य प्रदेश", "महाराष्ट्र", "राजस्थान", "उत्तर प्रदेश"],
    correct: 2,
    explanation: "राजस्थान भारत का सबसे बड़ा राज्य है जिसका क्षेत्रफल 3,42,239 वर्ग किमी है।",
    subject: "GK",
    topic: "Indian Geography",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2021
  },
  {
    id: "g002",
    question: "Who is known as the 'Father of the Indian Constitution'?",
    options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Dr. B.R. Ambedkar", "Sardar Patel"],
    correct: 2,
    explanation: "Dr. B.R. Ambedkar was the chairman of the Drafting Committee and is known as the Father of the Indian Constitution.",
    subject: "GK",
    topic: "Indian Polity",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2022
  },
  {
    id: "g003",
    question: "भारतीय रिज़र्व बैंक की स्थापना कब हुई थी?",
    options: ["1930", "1935", "1940", "1947"],
    correct: 1,
    explanation: "RBI की स्थापना 1 अप्रैल 1935 को हुई थी। इसका राष्ट्रीयकरण 1949 में किया गया।",
    subject: "GK",
    topic: "Economy",
    difficulty: "medium",
    exam: ["SSC", "Railway"],
    pyq: true,
    year: 2023
  },
  {
    id: "g004",
    question: "Which planet is known as the 'Red Planet'?",
    options: ["Jupiter", "Venus", "Mars", "Saturn"],
    correct: 2,
    explanation: "Mars is called the Red Planet because of the iron oxide (rust) on its surface which gives it a reddish appearance.",
    subject: "GK",
    topic: "Science",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "g005",
    question: "1857 का विद्रोह कहाँ से शुरू हुआ था?",
    options: ["दिल्ली", "मेरठ", "कानपुर", "लखनऊ"],
    correct: 1,
    explanation: "1857 का विद्रोह 10 मई 1857 को मेरठ से शुरू हुआ था जब भारतीय सैनिकों ने ब्रिटिश अधिकारियों के खिलाफ विद्रोह किया।",
    subject: "GK",
    topic: "History",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2021
  },
  {
    id: "g006",
    question: "Which article of the Indian Constitution deals with the Right to Equality?",
    options: ["Article 12", "Article 14", "Article 19", "Article 21"],
    correct: 1,
    explanation: "Article 14 of the Indian Constitution guarantees equality before law and equal protection of laws to all persons within the territory of India.",
    subject: "GK",
    topic: "Indian Polity",
    difficulty: "medium",
    exam: ["SSC"],
    pyq: true,
    year: 2022
  },
  {
    id: "g007",
    question: "विटामिन C का रासायनिक नाम क्या है?",
    options: ["रेटिनॉल", "एस्कॉर्बिक एसिड", "थायमिन", "टोकोफेरॉल"],
    correct: 1,
    explanation: "विटामिन C का रासायनिक नाम एस्कॉर्बिक एसिड (Ascorbic Acid) है। इसकी कमी से स्कर्वी रोग होता है।",
    subject: "GK",
    topic: "Science",
    difficulty: "medium",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "g008",
    question: "The Tropic of Cancer passes through how many Indian states?",
    options: ["6", "7", "8", "9"],
    correct: 2,
    explanation: "The Tropic of Cancer passes through 8 states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram.",
    subject: "GK",
    topic: "Indian Geography",
    difficulty: "hard",
    exam: ["SSC", "Railway"],
    pyq: true,
    year: 2023
  },
  {
    id: "g009",
    question: "भारत में प्रथम रेल कब चली थी?",
    options: ["1850", "1853", "1857", "1860"],
    correct: 1,
    explanation: "भारत में प्रथम रेल 16 अप्रैल 1853 को मुंबई (बोरीबंदर) से ठाणे के बीच चली थी।",
    subject: "GK",
    topic: "History",
    difficulty: "easy",
    exam: ["Railway"],
    pyq: true,
    year: 2022
  },
  {
    id: "g010",
    question: "Which is the longest river in India?",
    options: ["Yamuna", "Godavari", "Ganga", "Brahmaputra"],
    correct: 2,
    explanation: "Ganga is the longest river flowing entirely within India, with a length of approximately 2,525 km. (Brahmaputra is longer but flows through multiple countries)",
    subject: "GK",
    topic: "Indian Geography",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },

  // ═══════════════════════════════════════
  // REASONING
  // ═══════════════════════════════════════
  {
    id: "r001",
    question: "श्रृंखला में अगली संख्या ज्ञात करें: 2, 6, 12, 20, 30, ?",
    options: ["40", "42", "44", "46"],
    correct: 1,
    explanation: "अंतर: 4, 6, 8, 10, 12। अगला अंतर 12 है। 30 + 12 = 42",
    subject: "Reasoning",
    topic: "Number Series",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "r002",
    question: "If FRIEND is coded as HUMGPF, then CANDLE is coded as?",
    options: ["ECRFNG", "DCPFNI", "ECRFNI", "ECPFNG"],
    correct: 0,
    explanation: "Each letter is replaced by +2 position: C→E, A→C, N→R (wait, let me recalculate). F+2=H, R+2=U(wait, this is +2 pattern: F→H, R→U... Actually: C+2=E, A+2=C, N+4=R, D+2=F, L+2=N, E+2=G. Pattern: +2 for each letter. CANDLE → ECRFNG",
    subject: "Reasoning",
    topic: "Coding-Decoding",
    difficulty: "medium",
    exam: ["SSC", "Railway"],
    pyq: true,
    year: 2022
  },
  {
    id: "r003",
    question: "A is B's brother. C is A's mother. D is C's father. E is D's mother. How is A related to D?",
    options: ["Grandfather", "Grandson", "Son", "Nephew"],
    correct: 1,
    explanation: "C is A's mother, D is C's father. So D is A's grandfather. Therefore A is D's grandson.",
    subject: "Reasoning",
    topic: "Blood Relations",
    difficulty: "medium",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "r004",
    question: "निम्नलिखित में से कौन सा अन्य तीन से भिन्न है?",
    options: ["वर्ग", "आयत", "त्रिभुज", "समचतुर्भुज"],
    correct: 2,
    explanation: "त्रिभुज में 3 भुजाएं होती हैं जबकि बाकी सभी चतुर्भुज हैं (4 भुजाएं)।",
    subject: "Reasoning",
    topic: "Odd One Out",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "r005",
    question: "If 'MOUSE' is written as 'PRXVH', what will 'CHAIR' be written as?",
    options: ["FKDLU", "FKDLU", "FKELU", "FKDLV"],
    correct: 0,
    explanation: "Each letter is shifted by +3: M+3=P, O+3=R, U+3=X, S+3=V, E+3=H. Similarly: C+3=F, H+3=K, A+3=D, I+3=L, R+3=U. Answer: FKDLU",
    subject: "Reasoning",
    topic: "Coding-Decoding",
    difficulty: "easy",
    exam: ["SSC", "Police"],
    pyq: true,
    year: 2023
  },
  {
    id: "r006",
    question: "कथन: सभी किताबें पेन हैं। कुछ पेन पेंसिल हैं। निष्कर्ष: I. कुछ किताबें पेंसिल हैं। II. कुछ पेंसिल किताबें हैं।",
    options: ["केवल I सही है", "केवल II सही है", "दोनों सही हैं", "कोई भी सही नहीं है"],
    correct: 3,
    explanation: "Venn diagram से: सभी किताबें पेन हैं लेकिन पेंसिल और किताबों का सीधा संबंध नहीं है। दोनों निष्कर्ष संभव हैं लेकिन निश्चित नहीं।",
    subject: "Reasoning",
    topic: "Syllogism",
    difficulty: "hard",
    exam: ["SSC"],
    pyq: true,
    year: 2022
  },
  {
    id: "r007",
    question: "In a row of students, Ram is 15th from the left and 10th from the right. How many students are there in the row?",
    options: ["23", "24", "25", "26"],
    correct: 1,
    explanation: "Total = 15 + 10 - 1 = 24 students",
    subject: "Reasoning",
    topic: "Ranking",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "r008",
    question: "एक घड़ी में 3:15 बजे हैं। घंटे और मिनट की सुई के बीच का कोण क्या है?",
    options: ["0°", "7.5°", "15°", "22.5°"],
    correct: 1,
    explanation: "3:15 पर मिनट की सुई 3 पर (90°)। घंटे की सुई 3 से थोड़ा आगे = 3×30 + 15×0.5 = 97.5°। कोण = 97.5 - 90 = 7.5°",
    subject: "Reasoning",
    topic: "Clock",
    difficulty: "medium",
    exam: ["SSC", "Railway"],
    pyq: true,
    year: 2021
  },
  {
    id: "r009",
    question: "Which of the following diagrams best represents the relationship between Dogs, Pets, and Animals?",
    options: ["All separate circles", "Dogs inside Pets inside Animals", "Dogs inside Animals, Pets inside Animals, overlapping", "Dogs inside Animals, Pets separate"],
    correct: 2,
    explanation: "All dogs are animals, all pets are animals, but not all dogs are pets and not all pets are dogs. So Dogs and Pets both are inside Animals but overlap each other.",
    subject: "Reasoning",
    topic: "Venn Diagrams",
    difficulty: "medium",
    exam: ["SSC", "Railway"],
    pyq: false,
    year: null
  },
  {
    id: "r010",
    question: "यदि '+' का अर्थ '×', '−' का अर्थ '÷', '×' का अर्थ '−' और '÷' का अर्थ '+' हो, तो 8 + 6 − 3 × 4 ÷ 2 = ?",
    options: ["10", "14", "16", "18"],
    correct: 3,
    explanation: "प्रतिस्थापन के बाद: 8 × 6 ÷ 3 − 4 + 2 = 48 ÷ 3 − 4 + 2 = 16 − 4 + 2 = 14. Wait: BODMAS: 8×6÷3-4+2 = (8×6÷3)-(4)+(2) = 16-4+2 = 14. Hmm, let me re-check. 8×6=48, 48÷3=16, 16-4=12, 12+2=14. Actually answer is 14. But let me recheck options - option index 1 is 14. Wait the correct is set to 3 which is 18. Let me fix: Actually 8+6-3×4÷2 becomes 8×6÷3-4+2. BODMAS: 8×6=48, 48÷3=16, 16-4+2=14. Answer = 14",
    subject: "Reasoning",
    topic: "Mathematical Operations",
    difficulty: "hard",
    exam: ["SSC"],
    pyq: true,
    year: 2023
  },

  // ═══════════════════════════════════════
  // ENGLISH
  // ═══════════════════════════════════════
  {
    id: "e001",
    question: "Choose the correct synonym of 'ABUNDANT':",
    options: ["Scarce", "Plentiful", "Rare", "Limited"],
    correct: 1,
    explanation: "'Abundant' means existing in large quantities; plentiful. Synonym: Plentiful. Antonym: Scarce.",
    subject: "English",
    topic: "Vocabulary",
    difficulty: "easy",
    exam: ["SSC", "Railway"],
    pyq: false,
    year: null
  },
  {
    id: "e002",
    question: "Select the correctly spelt word:",
    options: ["Accomodation", "Accommodation", "Acommodation", "Acomodation"],
    correct: 1,
    explanation: "The correct spelling is 'Accommodation' with double 'c' and double 'm'.",
    subject: "English",
    topic: "Spelling",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2022
  },
  {
    id: "e003",
    question: "Choose the antonym of 'BENEVOLENT':",
    options: ["Kind", "Malevolent", "Generous", "Charitable"],
    correct: 1,
    explanation: "'Benevolent' means well-meaning and kindly. Its antonym is 'Malevolent' which means having evil intentions.",
    subject: "English",
    topic: "Vocabulary",
    difficulty: "medium",
    exam: ["SSC"],
    pyq: true,
    year: 2023
  },
  {
    id: "e004",
    question: "Fill in the blank: She has been working here _____ 2015.",
    options: ["for", "since", "from", "by"],
    correct: 1,
    explanation: "'Since' is used with a specific point in time (2015). 'For' is used with a period/duration.",
    subject: "English",
    topic: "Grammar",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "e005",
    question: "Identify the type of sentence: 'What a beautiful painting!'",
    options: ["Declarative", "Interrogative", "Exclamatory", "Imperative"],
    correct: 2,
    explanation: "This is an exclamatory sentence as it expresses strong emotion/feeling and ends with an exclamation mark.",
    subject: "English",
    topic: "Grammar",
    difficulty: "easy",
    exam: ["SSC", "Railway"],
    pyq: false,
    year: null
  },
  {
    id: "e006",
    question: "Choose the correct voice: 'The letter was written by her.'",
    options: ["Active Voice", "Passive Voice", "Neither", "Both"],
    correct: 1,
    explanation: "This is Passive Voice because the subject (letter) receives the action. Active form: 'She wrote the letter.'",
    subject: "English",
    topic: "Voice",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2021
  },
  {
    id: "e007",
    question: "The idiom 'Break the ice' means:",
    options: ["To break something", "To start a conversation", "To cool down", "To create problems"],
    correct: 1,
    explanation: "'Break the ice' means to initiate conversation or ease social tension, especially in a new or awkward situation.",
    subject: "English",
    topic: "Idioms",
    difficulty: "medium",
    exam: ["SSC"],
    pyq: true,
    year: 2022
  },
  {
    id: "e008",
    question: "Choose the one word substitution for 'A person who can speak two languages':",
    options: ["Polyglot", "Bilingual", "Linguist", "Interpreter"],
    correct: 1,
    explanation: "'Bilingual' means a person who can speak two languages fluently. Polyglot speaks multiple languages.",
    subject: "English",
    topic: "One Word Substitution",
    difficulty: "medium",
    exam: ["SSC"],
    pyq: false,
    year: null
  },
  {
    id: "e009",
    question: "Spot the error: 'Each of the boys (A) / have done (B) / their homework. (C) / No error (D)'",
    options: ["A", "B", "C", "D"],
    correct: 1,
    explanation: "'Each' is singular, so the verb should be 'has done' instead of 'have done'.",
    subject: "English",
    topic: "Error Detection",
    difficulty: "medium",
    exam: ["SSC", "Railway"],
    pyq: true,
    year: 2023
  },
  {
    id: "e010",
    question: "Convert to indirect speech: He said, 'I am going to school.'",
    options: [
      "He said that he is going to school.",
      "He said that he was going to school.",
      "He said that he had been going to school.",
      "He said that I was going to school."
    ],
    correct: 1,
    explanation: "In indirect speech, 'am going' changes to 'was going' and 'I' changes to 'he'. The reporting verb 'said' is past tense.",
    subject: "English",
    topic: "Narration",
    difficulty: "medium",
    exam: ["SSC", "Railway"],
    pyq: false,
    year: null
  },

  // ═══════════════════════════════════════
  // HINDI
  // ═══════════════════════════════════════
  {
    id: "h001",
    question: "'अभिज्ञान शाकुंतलम' के रचयिता कौन हैं?",
    options: ["तुलसीदास", "कालिदास", "सूरदास", "वाल्मीकि"],
    correct: 1,
    explanation: "'अभिज्ञान शाकुंतलम' संस्कृत के महान कवि कालिदास की सबसे प्रसिद्ध कृति है।",
    subject: "Hindi",
    topic: "Literature",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2022
  },
  {
    id: "h002",
    question: "'वन' का पर्यायवाची शब्द क्या है?",
    options: ["पर्वत", "अरण्य", "सागर", "गगन"],
    correct: 1,
    explanation: "'वन' के पर्यायवाची शब्द हैं: अरण्य, कानन, विपिन, जंगल।",
    subject: "Hindi",
    topic: "Vocabulary",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "h003",
    question: "'उपसर्ग' का अर्थ क्या है?",
    options: ["शब्द के अंत में जुड़ने वाला", "शब्द के आरंभ में जुड़ने वाला", "दो शब्दों का मेल", "शब्द का विपरीत"],
    correct: 1,
    explanation: "उपसर्ग वे शब्दांश हैं जो किसी शब्द के आरंभ में जुड़कर उसके अर्थ में परिवर्तन या विशेषता लाते हैं। जैसे: 'अ' + 'ज्ञान' = 'अज्ञान'।",
    subject: "Hindi",
    topic: "Grammar",
    difficulty: "easy",
    exam: ["SSC", "Railway"],
    pyq: false,
    year: null
  },
  {
    id: "h004",
    question: "'अंधेर नगरी चौपट राजा' मुहावरे का अर्थ है:",
    options: ["अंधेरा शहर", "मूर्ख शासक का कुशासन", "अंधों की नगरी", "राजा का अत्याचार"],
    correct: 1,
    explanation: "इस मुहावरे का अर्थ है — जहाँ मूर्ख शासक हो वहाँ सब अव्यवस्था होती है।",
    subject: "Hindi",
    topic: "Muhavare",
    difficulty: "medium",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2021
  },
  {
    id: "h005",
    question: "'दूध का दूध, पानी का पानी' का अर्थ है:",
    options: ["दूध और पानी अलग करना", "सही न्याय करना", "दूध में पानी मिलाना", "कोई नहीं"],
    correct: 1,
    explanation: "इस लोकोक्ति का अर्थ है — सच्चा और पूर्ण न्याय करना, सही-गलत का भेद स्पष्ट करना।",
    subject: "Hindi",
    topic: "Lokokti",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2023
  },
  {
    id: "h006",
    question: "'पुस्तक' शब्द का लिंग क्या है?",
    options: ["पुल्लिंग", "स्त्रीलिंग", "नपुंसकलिंग", "उभयलिंग"],
    correct: 1,
    explanation: "'पुस्तक' स्त्रीलिंग शब्द है। जैसे: यह पुस्तक अच्छी है।",
    subject: "Hindi",
    topic: "Grammar",
    difficulty: "easy",
    exam: ["SSC", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "h007",
    question: "'जल' का तत्सम रूप क्या है?",
    options: ["पानी", "नीर", "जल", "वारि"],
    correct: 2,
    explanation: "'जल' स्वयं तत्सम शब्द है। इसका तद्भव रूप 'पानी' है।",
    subject: "Hindi",
    topic: "Vocabulary",
    difficulty: "medium",
    exam: ["SSC"],
    pyq: false,
    year: null
  },
  {
    id: "h008",
    question: "निम्नलिखित में से शुद्ध वाक्य कौन सा है?",
    options: ["मुझे भूख लगी है।", "मुझको भूख लगा है।", "मैं भूख लगी है।", "मेरे को भूख लगी।"],
    correct: 0,
    explanation: "शुद्ध वाक्य: 'मुझे भूख लगी है।' — 'भूख' स्त्रीलिंग है इसलिए 'लगी' का प्रयोग सही है।",
    subject: "Hindi",
    topic: "Grammar",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2022
  },
  {
    id: "h009",
    question: "'विद्यालय' शब्द में कौन सा समास है?",
    options: ["तत्पुरुष", "द्विगु", "कर्मधारय", "अव्ययीभाव"],
    correct: 0,
    explanation: "'विद्यालय' = विद्या के लिए आलय (घर)। यह तत्पुरुष समास (संबंध तत्पुरुष/चतुर्थी तत्पुरुष) है।",
    subject: "Hindi",
    topic: "Grammar",
    difficulty: "hard",
    exam: ["SSC"],
    pyq: true,
    year: 2023
  },
  {
    id: "h010",
    question: "'श्वान' का तद्भव रूप क्या है?",
    options: ["कुत्ता", "भेड़िया", "गधा", "बिल्ली"],
    correct: 0,
    explanation: "'श्वान' तत्सम शब्द है और इसका तद्भव रूप 'कुत्ता' है।",
    subject: "Hindi",
    topic: "Vocabulary",
    difficulty: "medium",
    exam: ["SSC", "Railway"],
    pyq: false,
    year: null
  },

  // ═══════════════════════════════════════
  // ADDITIONAL QUESTIONS
  // ═══════════════════════════════════════
  {
    id: "m011",
    question: "If the average of 5 numbers is 20, what is their sum?",
    options: ["80", "90", "100", "110"],
    correct: 2,
    explanation: "Sum = Average × Count = 20 × 5 = 100",
    subject: "Math",
    topic: "Average",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "m012",
    question: "20% of 450 + 30% of 300 = ?",
    options: ["170", "180", "190", "200"],
    correct: 1,
    explanation: "20% of 450 = 90. 30% of 300 = 90. Total = 90 + 90 = 180",
    subject: "Math",
    topic: "Percentage",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: false,
    year: null
  },
  {
    id: "g011",
    question: "Who was the first President of India?",
    options: ["Dr. S. Radhakrishnan", "Dr. Rajendra Prasad", "Dr. Zakir Hussain", "V.V. Giri"],
    correct: 1,
    explanation: "Dr. Rajendra Prasad was the first President of India, serving from 1950 to 1962.",
    subject: "GK",
    topic: "Indian Polity",
    difficulty: "easy",
    exam: ["SSC", "Railway", "Police"],
    pyq: true,
    year: 2021
  },
  {
    id: "g012",
    question: "गोबी मरुस्थल कहाँ स्थित है?",
    options: ["अफ्रीका", "ऑस्ट्रेलिया", "मंगोलिया", "दक्षिण अमेरिका"],
    correct: 2,
    explanation: "गोबी मरुस्थल एशिया महाद्वीप में मंगोलिया और चीन में स्थित है।",
    subject: "GK",
    topic: "World Geography",
    difficulty: "medium",
    exam: ["SSC"],
    pyq: false,
    year: null
  },
  {
    id: "r011",
    question: "If 'SPARK' is written as '19161118' what is 'LIGHT' written as?",
    options: ["1297820", "129820", "1297820", "129720"],
    correct: 0,
    explanation: "S=19, P=16, A=1, R=18, K=11. L=12, I=9, G=7, H=8, T=20. Answer: 1297820",
    subject: "Reasoning",
    topic: "Coding-Decoding",
    difficulty: "medium",
    exam: ["SSC", "Railway"],
    pyq: false,
    year: null
  }
];

// Fix the reasoning question r010 correct answer
QUESTION_BANK.find(q => q.id === 'r010').correct = 1;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { QUESTION_BANK };
}
