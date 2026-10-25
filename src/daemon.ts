import { SuperteamClient } from './client.js';
import { evaluateListingWithGemini } from './evaluator.js';
import { sendTelegramAlert } from './telegram.js';
import { getAgentHeartbeat } from './heartbeat.js';

// প্রতি ১৫ মিনিট পর পর চেক করবে (১৫ * ৬০ * ১০০০ ms)
const POLL_INTERVAL = 15 * 60 * 1000;
const seenListings = new Set<string>();

async function pollListings() {
  console.log(`\n⏰ [${new Date().toLocaleTimeString()}] Running automated bounty scan...`);

  try {
    const listings = await SuperteamClient.getLiveListings(20);
    console.log(`📡 Live listings found: ${listings.length}`);

    for (const item of listings) {
      if (seenListings.has(item.id)) continue;
      seenListings.add(item.id);

      console.log(`🎯 New Listing Detected: "${item.title}"`);
      const details = await SuperteamClient.getListingDetails(item.slug || item.id);
      const evalResult = await evaluateListingWithGemini(details);

      const alertText = `
🚨 <b>New Superteam Earn Bounty!</b>

<b>Title:</b> ${item.title}
<b>Type:</b> ${(item.type || 'Bounty').toUpperCase()}
<b>Reward:</b> ${item.rewardAmount || 'Reward'} ${item.token || 'USDC'}
<b>Match Score:</b> ${evalResult.fitScore}/100

💡 <b>Analysis:</b> ${evalResult.reason}
🛠️ <b>Plan:</b> ${evalResult.proposedSolution}

🔗 https://superteam.fun/listings/${item.slug}
`;
      await sendTelegramAlert(alertText);
      console.log(`✅ Alert sent to Telegram for: ${item.title}`);
    }

    getAgentHeartbeat(`Polled at ${new Date().toISOString()}`);
  } catch (err: any) {
    console.error('Polling error:', err.message);
  }
}

console.log('🤖 Superteam Earn Watchdog Daemon Started! Press Ctrl+C to stop.');
pollListings();
setInterval(pollListings, POLL_INTERVAL);
