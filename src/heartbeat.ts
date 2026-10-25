import dotenv from 'dotenv';
dotenv.config();

export function getAgentHeartbeat(lastAction = 'Scanned active listings') {
  const heartbeat = {
    status: 'ok',
    agentName: process.env.SUPERTEAM_AGENT_NAME || 'selim-solana-agent',
    time: new Date().toISOString(),
    version: '1.0.0',
    capabilities: ['register', 'listings', 'submit', 'claim', 'gemini-eval'],
    lastAction,
    nextAction: 'Waiting for next scheduled scan',
  };

  console.log('💓 AGENT HEARTBEAT STATUS:');
  console.log(JSON.stringify(heartbeat, null, 2));
  return heartbeat;
}

getAgentHeartbeat();
