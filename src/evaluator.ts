import dotenv from 'dotenv';
dotenv.config();

// OmniRoute লোকাল প্রক্সি অথবা সরাসরি OpenAI-কম্প্যাটিবল এন্ডপয়েন্ট
const OMNIROUTE_URL = process.env.OMNIROUTE_BASE_URL || 'http://localhost:20128/v1';
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function evaluateListingWithGemini(listing: any): Promise<{
  fitScore: number;
  reason: string;
  proposedSolution: string;
}> {
  const prompt = `
You are an autonomous AI evaluation engine for developer Md Selim Reza.
Selim's Stack: Next.js 16, Solana Web3.js, Phantom wallet, AI Agents, Telegram Bots.

Analyze this Superteam Earn Bounty listing:
Title: ${listing.title}
Skills: ${JSON.stringify(listing.skills || [])}
Description: ${(listing.description || '').slice(0, 1500)}

Return a STRICT JSON response (no markdown, no backticks):
{
  "fitScore": <number between 0 and 100>,
  "reason": "<1-sentence evaluation>",
  "proposedSolution": "<3-bullet points on how to build and win this in 24-48h>"
}
`;

  // ১. প্রথমে OmniRoute 1.62B Free Token Pool ট্রাই করা
  try {
    const res = await fetch(`${OMNIROUTE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer omniroute-free',
      },
      body: JSON.stringify({
        model: 'auto/coding', // OmniRoute স্বয়ংক্রিয়ভাবে সেরা ফ্রি মডেল বেছে নেয়
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      let raw = data.choices?.[0]?.message?.content || '';
      raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      return JSON.parse(raw);
    }
  } catch {
    // OmniRoute অফলাইন থাকলে জেমিনি সরাসরি কল হবে
  }

  // ২. ফলব্যাক: গুগল জেমিনি সরাসরি কল করা
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );
    const data = await res.json();
    let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return JSON.parse(raw.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim());
  } catch {
    return {
      fitScore: 75,
      reason: 'Automated fallback: Matches Solana or Frontend development stack.',
      proposedSolution: 'Build rapid prototype with Next.js 16 and Phantom wallet adapter.',
    };
  }
}
