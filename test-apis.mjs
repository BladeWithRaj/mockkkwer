// API Test Script — Gemini, Groq, DeepSeek
// Run: node test-apis.mjs
// Reads keys from .env.local

import { readFileSync } from 'fs';

// ── Load .env.local ──
const envLines = readFileSync('.env.local', 'utf8').split('\n');
const env = {};
for (const line of envLines) {
  const m = line.match(/^([A-Z_]+)="?([^"]*)"?/);
  if (m) env[m[1]] = m[2];
}

const GEMINI_KEY  = env.GEMINI_API_KEY   || '';
const GROQ_KEY    = env.GROQ_API_KEY     || '';
const DEEPSEEK_KEY= env.DEEPSEEK_API_KEY || '';

const PASS = '✅ WORKING';
const FAIL = '❌ FAILED ';
const MISS = '⚠️  KEY EMPTY';

// ── Test Gemini ──
async function testGemini() {
  if (!GEMINI_KEY) return { status: MISS, detail: 'GEMINI_API_KEY is empty in .env.local' };
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Reply with exactly: OK' }] }],
        generationConfig: { maxOutputTokens: 10, temperature: 0 }
      })
    });
    const data = await res.json();
    if (!res.ok) return { status: FAIL, detail: `HTTP ${res.status}: ${data.error?.message || JSON.stringify(data).substring(0,120)}` };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { status: PASS, detail: `Response: "${text.trim()}"` };
  } catch(e) {
    return { status: FAIL, detail: e.message };
  }
}

// ── Test Groq ──
async function testGroq() {
  if (!GROQ_KEY) return { status: MISS, detail: 'GROQ_API_KEY is empty in .env.local' };
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 10, temperature: 0
      })
    });
    const data = await res.json();
    if (!res.ok) return { status: FAIL, detail: `HTTP ${res.status}: ${data.error?.message || JSON.stringify(data).substring(0,120)}` };
    const text = data?.choices?.[0]?.message?.content || '';
    return { status: PASS, detail: `Response: "${text.trim()}"` };
  } catch(e) {
    return { status: FAIL, detail: e.message };
  }
}

// ── Test DeepSeek ──
async function testDeepSeek() {
  if (!DEEPSEEK_KEY) return { status: MISS, detail: 'DEEPSEEK_API_KEY is empty in .env.local' };
  try {
    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 10, temperature: 0
      })
    });
    const data = await res.json();
    if (!res.ok) return { status: FAIL, detail: `HTTP ${res.status}: ${data.error?.message || JSON.stringify(data).substring(0,120)}` };
    const text = data?.choices?.[0]?.message?.content || '';
    return { status: PASS, detail: `Response: "${text.trim()}"` };
  } catch(e) {
    return { status: FAIL, detail: e.message };
  }
}

// ── Run All ──
console.log('\n═══════════════════════════════════════');
console.log('   API KEY STATUS CHECK — MockTestPro  ');
console.log('═══════════════════════════════════════\n');

const [gemini, groq, deepseek] = await Promise.all([testGemini(), testGroq(), testDeepSeek()]);

console.log(`GEMINI   (gemini-2.0-flash) : ${gemini.status}`);
console.log(`  → ${gemini.detail}\n`);

console.log(`GROQ     (llama-3.3-70b)    : ${groq.status}`);
console.log(`  → ${groq.detail}\n`);

console.log(`DEEPSEEK (deepseek-chat)    : ${deepseek.status}`);
console.log(`  → ${deepseek.detail}\n`);

console.log('═══════════════════════════════════════');

const working = [gemini, groq, deepseek].filter(r => r.status === PASS).length;
console.log(`\nSummary: ${working}/3 APIs working\n`);

if (working === 0) {
  console.log('ACTION NEEDED: Sari keys .env.local mein empty hain.');
  console.log('Vercel Dashboard → Settings → Environment Variables se keys copy karo.\n');
}
