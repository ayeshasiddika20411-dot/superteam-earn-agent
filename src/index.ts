import { SuperteamClient } from './client.js';
import { evaluateListingWithGemini } from './evaluator.js';
import { sendTelegramAlert } from './telegram.js';
import { getAgentHeartbeat } from './heartbeat.js';

async function runBountyHunter() {
  console.log('🚀 Superteam Earn Agent Scanner Starting...\n');

  try {
    const listings = await SuperteamClient.getLiveListings(15);
    console.log(`📡 Discovered ${listings.length} live listings from Superteam API.\n`);

    if (listings.length === 0) {
      console.log('ℹ️ No active AGENT_ALLOWED listings currently open. Will poll again on next cycle.');
      getAgentHeartbeat('Idle: No open agent listings');
      return;
    }

    for (const item of listings) {
      console.log(`🔍 Evaluating: "${item.title}" [${item.type}]`);
      const details = await SuperteamClient.getListingDetails(item.slug || item.id);
      const evalResult = await evaluateListingWithGemini(details);

      console.log(`   Fit Score: ${evalResult.fitScore}/100`);
      console.log(`   Verdict  : ${evalResult.reason}\n`);

      // যদি ফিট স্কোর ৭৫ এর বেশি হয়, ফোনে মেসেজ পাঠাও
      if (evalResult.fitScore >= 75) {
        const alertText = `
🎯 <b>New Superteam Opportunity Detected!</b>

<b>Title:</b> ${item.title}
<b>Type:</b> ${item.type.toUpperCase()}
<b>Reward:</b> ${item.rewardAmount || 'Bounty Prize'} ${item.token || 'USDC'}
<b>Match Score:</b> ${evalResult.fitScore}/100

💡 <b>Gemini Assessment:</b>
${evalResult.reason}

🛠️ <b>Proposed Solution:</b>
${evalResult.proposedSolution}

🔗 <b>Link:</b> https://superteam.fun/listings/${item.slug}
`;
        await sendTelegramAlert(alertText);
      }
    }

    getAgentHeartbeat(`Successfully evaluated ${listings.length} listings`);
  } catch (err: any) {
    console.error('❌ Scanner Error:', err.message);
  }
}

runBountyHunter();
