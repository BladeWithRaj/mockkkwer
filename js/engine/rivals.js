// ============================================
// RIVAL POOL — 100 Realistic Indian Names
// Each rival has: name, speed, personality
// ============================================

const RivalPool = {

  _lastRivalIdx: -1,

  RIVALS: [
    // Male names
    { name: 'Aman Verma', gender: 'm' },
    { name: 'Rohit Kumar', gender: 'm' },
    { name: 'Aditya Yadav', gender: 'm' },
    { name: 'Kunal Mishra', gender: 'm' },
    { name: 'Vikas Pandey', gender: 'm' },
    { name: 'Rahul Sharma', gender: 'm' },
    { name: 'Deepak Gupta', gender: 'm' },
    { name: 'Harsh Tiwari', gender: 'm' },
    { name: 'Sachin Jain', gender: 'm' },
    { name: 'Mohit Chauhan', gender: 'm' },
    { name: 'Suraj Patel', gender: 'm' },
    { name: 'Ankur Singh', gender: 'm' },
    { name: 'Gaurav Dubey', gender: 'm' },
    { name: 'Pawan Rajput', gender: 'm' },
    { name: 'Nitin Thakur', gender: 'm' },
    { name: 'Ravi Meena', gender: 'm' },
    { name: 'Sonu Kashyap', gender: 'm' },
    { name: 'Vivek Rathore', gender: 'm' },
    { name: 'Manish Joshi', gender: 'm' },
    { name: 'Ajay Saxena', gender: 'm' },
    { name: 'Arjun Negi', gender: 'm' },
    { name: 'Karan Rawat', gender: 'm' },
    { name: 'Prakash Bhatt', gender: 'm' },
    { name: 'Sumit Maurya', gender: 'm' },
    { name: 'Vikrant Soni', gender: 'm' },
    { name: 'Ashish Goswami', gender: 'm' },
    { name: 'Rajat Chaudhary', gender: 'm' },
    { name: 'Tushar Bhandari', gender: 'm' },
    { name: 'Aakash Nagar', gender: 'm' },
    { name: 'Shivam Dwivedi', gender: 'm' },
    { name: 'Amit Saini', gender: 'm' },
    { name: 'Vishal Ahuja', gender: 'm' },
    { name: 'Naveen Bisht', gender: 'm' },
    { name: 'Prateek Aggarwal', gender: 'm' },
    { name: 'Yogesh Chahar', gender: 'm' },
    { name: 'Dheeraj Pal', gender: 'm' },
    { name: 'Sandeep Gill', gender: 'm' },
    { name: 'Varun Choudhary', gender: 'm' },
    { name: 'Himanshu Malik', gender: 'm' },
    { name: 'Neeraj Tanwar', gender: 'm' },
    { name: 'Siddharth Sen', gender: 'm' },
    { name: 'Ankit Bhatia', gender: 'm' },
    { name: 'Ritesh Bansal', gender: 'm' },
    { name: 'Tarun Kapoor', gender: 'm' },
    { name: 'Mayank Vashishth', gender: 'm' },
    { name: 'Akshay Trivedi', gender: 'm' },
    { name: 'Lokesh Parmar', gender: 'm' },
    { name: 'Anurag Deshpande', gender: 'm' },
    { name: 'Lakshya Chauhan', gender: 'm' },
    { name: 'Devendra Solanki', gender: 'm' },

    // Female names
    { name: 'Priya Singh', gender: 'f' },
    { name: 'Neha Sharma', gender: 'f' },
    { name: 'Anjali Gupta', gender: 'f' },
    { name: 'Swati Verma', gender: 'f' },
    { name: 'Pooja Yadav', gender: 'f' },
    { name: 'Ritu Pandey', gender: 'f' },
    { name: 'Kavita Mishra', gender: 'f' },
    { name: 'Meena Tiwari', gender: 'f' },
    { name: 'Sunita Jain', gender: 'f' },
    { name: 'Deepika Patel', gender: 'f' },
    { name: 'Nisha Rajput', gender: 'f' },
    { name: 'Sakshi Thakur', gender: 'f' },
    { name: 'Divya Chauhan', gender: 'f' },
    { name: 'Komal Dubey', gender: 'f' },
    { name: 'Sneha Meena', gender: 'f' },
    { name: 'Pallavi Joshi', gender: 'f' },
    { name: 'Shalini Saxena', gender: 'f' },
    { name: 'Ananya Rathore', gender: 'f' },
    { name: 'Shreya Negi', gender: 'f' },
    { name: 'Aarti Rawat', gender: 'f' },
    { name: 'Megha Bhatt', gender: 'f' },
    { name: 'Tanvi Soni', gender: 'f' },
    { name: 'Nikita Goswami', gender: 'f' },
    { name: 'Kriti Maurya', gender: 'f' },
    { name: 'Garima Chaudhary', gender: 'f' },
    { name: 'Isha Bhandari', gender: 'f' },
    { name: 'Akansha Nagar', gender: 'f' },
    { name: 'Bhavna Dwivedi', gender: 'f' },
    { name: 'Payal Saini', gender: 'f' },
    { name: 'Jyoti Ahuja', gender: 'f' },
    { name: 'Shikha Aggarwal', gender: 'f' },
    { name: 'Mansi Bisht', gender: 'f' },
    { name: 'Tanu Chahar', gender: 'f' },
    { name: 'Rachna Pal', gender: 'f' },
    { name: 'Suman Gill', gender: 'f' },
    { name: 'Varsha Malik', gender: 'f' },
    { name: 'Kiran Tanwar', gender: 'f' },
    { name: 'Lata Sen', gender: 'f' },
    { name: 'Aditi Bhatia', gender: 'f' },
    { name: 'Aparna Bansal', gender: 'f' },
    { name: 'Roshni Kapoor', gender: 'f' },
    { name: 'Simran Trivedi', gender: 'f' },
    { name: 'Kirti Parmar', gender: 'f' },
    { name: 'Charu Deshpande', gender: 'f' },
    { name: 'Aisha Solanki', gender: 'f' },
    { name: 'Vandana Vashishth', gender: 'f' },
    { name: 'Poonam Kashyap', gender: 'f' },
    { name: 'Rekha Choudhary', gender: 'f' },
    { name: 'Sonali Kumar', gender: 'f' }
  ],

  // Speed profiles (seconds range for answer delay)
  SPEED_PROFILES: {
    fast:     { min: 1.5, max: 3.5 },
    normal:   { min: 3.5, max: 7 },
    slow:     { min: 6, max: 11 }
  },

  // Personality types affect behavior patterns
  PERSONALITIES: [
    'aggressive',  // fast, confident, occasional big mistakes
    'steady',      // consistent pace, reliable accuracy
    'cautious',    // slow, high accuracy, skips hard ones
    'clutch',      // starts slow, finishes strong
    'shaky'        // good start, accuracy drops under pressure
  ],

  /**
   * Pick a random rival (avoids consecutive repeat)
   */
  pickRival(difficulty) {
    const pool = [...this.RIVALS];
    let idx;
    do {
      idx = Math.floor(Math.random() * pool.length);
    } while (idx === this._lastRivalIdx && pool.length > 1);

    this._lastRivalIdx = idx;
    const base = pool[idx];

    // Assign random speed profile based on difficulty
    const speedKeys = Object.keys(this.SPEED_PROFILES);
    let speedProfile;
    if (difficulty === 'expert') {
      speedProfile = Math.random() < 0.6 ? 'fast' : 'normal';
    } else if (difficulty === 'beginner') {
      speedProfile = Math.random() < 0.5 ? 'slow' : 'normal';
    } else {
      speedProfile = speedKeys[Math.floor(Math.random() * speedKeys.length)];
    }

    // Assign random personality
    const personality = this.PERSONALITIES[Math.floor(Math.random() * this.PERSONALITIES.length)];

    return {
      name: base.name,
      gender: base.gender,
      difficulty,
      speedProfile,
      personality,
      emoji: base.gender === 'f' ? '👩' : '👨'
    };
  }
};
