-- =============================================
-- SEED DATA: 20 Sample Questions
-- Run this in Supabase SQL Editor
-- =============================================

-- First, check which columns exist and add missing ones
DO $$
BEGIN
  -- Add options_en if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='options_en') THEN
    ALTER TABLE questions ADD COLUMN options_en JSONB;
  END IF;
  -- Add options_hi if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='options_hi') THEN
    ALTER TABLE questions ADD COLUMN options_hi JSONB;
  END IF;
  -- Add correct_index if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='correct_index') THEN
    ALTER TABLE questions ADD COLUMN correct_index INTEGER DEFAULT 0;
  END IF;
  -- Add question_en if missing (rename question to question_en)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='question_en') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='question') THEN
      ALTER TABLE questions RENAME COLUMN question TO question_en;
    ELSE
      ALTER TABLE questions ADD COLUMN question_en TEXT;
    END IF;
  END IF;
  -- Add question_hi if missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='questions' AND column_name='question_hi') THEN
    ALTER TABLE questions ADD COLUMN question_hi TEXT;
  END IF;
END $$;

-- Insert 20 sample questions across different subjects
INSERT INTO questions (question_en, question_hi, options_en, options_hi, correct_index, subject, difficulty) VALUES
-- MATH (5 questions)
('What is 15 × 12?', '15 × 12 कितना होता है?', '["160","170","180","190"]', '["160","170","180","190"]', 2, 'math', 'easy'),
('If x + 5 = 12, what is x?', 'अगर x + 5 = 12, तो x क्या है?', '["5","6","7","8"]', '["5","6","7","8"]', 2, 'math', 'easy'),
('What is the square root of 144?', '144 का वर्गमूल क्या है?', '["10","11","12","13"]', '["10","11","12","13"]', 2, 'math', 'medium'),
('What is 25% of 200?', '200 का 25% कितना है?', '["25","40","50","75"]', '["25","40","50","75"]', 2, 'math', 'easy'),
('If a train travels 60 km in 1 hour, how far will it go in 3.5 hours?', 'अगर ट्रेन 1 घंटे में 60 किमी चलती है, तो 3.5 घंटे में कितनी दूर जाएगी?', '["180 km","200 km","210 km","240 km"]', '["180 किमी","200 किमी","210 किमी","240 किमी"]', 2, 'math', 'medium'),

-- GK (5 questions)
('What is the capital of India?', 'भारत की राजधानी क्या है?', '["Mumbai","Delhi","Kolkata","Chennai"]', '["मुंबई","दिल्ली","कोलकाता","चेन्नई"]', 1, 'gk', 'easy'),
('Who wrote the Indian National Anthem?', 'भारत का राष्ट्रगान किसने लिखा?', '["Bankim Chandra","Rabindranath Tagore","Mahatma Gandhi","Jawaharlal Nehru"]', '["बंकिम चंद्र","रबींद्रनाथ टैगोर","महात्मा गांधी","जवाहरलाल नेहरू"]', 1, 'gk', 'easy'),
('Which planet is known as the Red Planet?', 'किस ग्रह को लाल ग्रह कहा जाता है?', '["Venus","Mars","Jupiter","Saturn"]', '["शुक्र","मंगल","बृहस्पति","शनि"]', 1, 'gk', 'easy'),
('What is the largest ocean on Earth?', 'पृथ्वी पर सबसे बड़ा महासागर कौन सा है?', '["Atlantic","Indian","Pacific","Arctic"]', '["अटलांटिक","हिंद","प्रशांत","आर्कटिक"]', 2, 'gk', 'medium'),
('In which year did India gain independence?', 'भारत को किस वर्ष आज़ादी मिली?', '["1945","1946","1947","1948"]', '["1945","1946","1947","1948"]', 2, 'gk', 'easy'),

-- REASONING (3 questions)
('Complete the series: 2, 6, 12, 20, ?', 'श्रृंखला पूरी करें: 2, 6, 12, 20, ?', '["28","30","32","36"]', '["28","30","32","36"]', 1, 'reasoning', 'medium'),
('If APPLE is coded as ELPPA, how is MANGO coded?', 'अगर APPLE को ELPPA कोड किया जाता है, तो MANGO को कैसे कोड करेंगे?', '["OGNAM","GNAMO","OGANM","NAMOG"]', '["OGNAM","GNAMO","OGANM","NAMOG"]', 0, 'reasoning', 'medium'),
('Find the odd one out: 3, 5, 11, 14, 17', 'विषम खोजें: 3, 5, 11, 14, 17', '["3","5","14","17"]', '["3","5","14","17"]', 2, 'reasoning', 'easy'),

-- ENGLISH (3 questions)
('Choose the correct spelling:', 'सही स्पेलिंग चुनें:', '["Accomodation","Accommodation","Acomodation","Acommodation"]', '["Accomodation","Accommodation","Acomodation","Acommodation"]', 1, 'english', 'medium'),
('What is the synonym of "Brave"?', '"Brave" का पर्यायवाची क्या है?', '["Coward","Timid","Courageous","Afraid"]', '["कायर","डरपोक","साहसी","भयभीत"]', 2, 'english', 'easy'),
('Fill in the blank: She ___ to school every day.', 'रिक्त स्थान भरें: She ___ to school every day.', '["go","goes","going","gone"]', '["go","goes","going","gone"]', 1, 'english', 'easy'),

-- HINDI (2 questions)
('हिंदी दिवस कब मनाया जाता है?', 'हिंदी दिवस कब मनाया जाता है?', '["14 सितंबर","26 जनवरी","15 अगस्त","2 अक्टूबर"]', '["14 सितंबर","26 जनवरी","15 अगस्त","2 अक्टूबर"]', 0, 'hindi', 'easy'),
('"सूर्योदय" में कौन सा समास है?', '"सूर्योदय" में कौन सा समास है?', '["तत्पुरुष","द्वंद्व","कर्मधारय","बहुव्रीहि"]', '["तत्पुरुष","द्वंद्व","कर्मधारय","बहुव्रीहि"]', 0, 'hindi', 'medium'),

-- SCIENCE (2 questions)
('What is the chemical symbol for water?', 'पानी का रासायनिक सूत्र क्या है?', '["HO","H2O","H2O2","OH"]', '["HO","H2O","H2O2","OH"]', 1, 'science', 'easy'),
('Which gas do plants absorb from the atmosphere?', 'पौधे वातावरण से कौन सी गैस अवशोषित करते हैं?', '["Oxygen","Nitrogen","Carbon Dioxide","Hydrogen"]', '["ऑक्सीजन","नाइट्रोजन","कार्बन डाइऑक्साइड","हाइड्रोजन"]', 2, 'science', 'easy');

-- Verify
SELECT count(*) as total_questions, 
       count(DISTINCT subject) as total_subjects
FROM questions;
