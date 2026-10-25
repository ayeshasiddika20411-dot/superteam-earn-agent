import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.SUPERTEAM_BASE_URL || 'https://superteam.fun';
const AGENT_NAME = process.env.SUPERTEAM_AGENT_NAME || 'selim-solana-agent';

async function registerAgent() {
  console.log(`🤖 Registering agent: "${AGENT_NAME}" on Superteam Earn...`);

  try {
    const res = await fetch(`${BASE_URL}/api/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: AGENT_NAME }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Registration failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    console.log('\n🎉 AGENT SUCCESSFULLY REGISTERED!');
    console.log('--------------------------------------------------');
    console.log(`Agent ID   : ${data.agentId}`);
    console.log(`Username   : ${data.username}`);
    console.log(`API Key    : ${data.apiKey}`);
    console.log(`Claim Code : ${data.claimCode} (⚠️ SAVE THIS FOR PAYOUTS)`);
    console.log('--------------------------------------------------\n');

    // .env ফাইলে স্বয়ংক্রিয়ভাবে চাবিগুলো সেভ করা
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/SUPERTEAM_API_KEY=.*/, `SUPERTEAM_API_KEY=${data.apiKey}`);
    envContent = envContent.replace(/SUPERTEAM_CLAIM_CODE=.*/, `SUPERTEAM_CLAIM_CODE=${data.claimCode}`);
    envContent = envContent.replace(/SUPERTEAM_AGENT_ID=.*/, `SUPERTEAM_AGENT_ID=${data.agentId}`);
    fs.writeFileSync(envPath, envContent, 'utf8');

    console.log('✅ Credentials automatically written to your .env file!');
  } catch (error: any) {
    console.error('❌ Error registering agent:', error.message);
  }
}

registerAgent();
