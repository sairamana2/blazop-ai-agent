// skills/slack-intent-matcher.js
// Reusable intent detection for text-based approvals and commands
// MODULAR - pure utility, no Slack dependencies

const INTENTS = {
  APPROVE: {
    keywords: ['yes', 'approve', 'approved', 'accept', 'accepted', 'confirm', 'confirmed', 'ok', 'okay', 'go ahead', 'proceed'],
    response: 'approve'
  },
  REJECT: {
    keywords: ['no', 'reject', 'rejected', 'deny', 'denied', 'decline', 'declined', 'cancel', 'cancelled', 'stop'],
    response: 'reject'
  },
  CREATE_TICKET: {
    keywords: ['create support ticket', 'new ticket', 'raise ticket', 'open ticket', 'create ticket', 'support ticket'],
    response: 'create_ticket'
  },
  LIST_CHANNELS: {
    keywords: ['list channels', 'show channels', 'all channels'],
    response: 'list_channels'
  },
  DEMO_FLOW: {
    keywords: ['demo', 'start demo', 'show demo', 'run demo', 'test workflow'],
    response: 'demo'
  }
};

// Detect intent from a message string
function detectIntent(message) {
  if (!message) return null;

  const lower = message.toLowerCase().trim();

  for (const [intentName, intentData] of Object.entries(INTENTS)) {
    for (const keyword of intentData.keywords) {
      if (lower === keyword || lower.startsWith(keyword + ' ') || lower.includes(keyword)) {
        return {
          intent: intentName,
          action: intentData.response,
          matched: keyword,
          original: message
        };
      }
    }
  }

  return null;
}

// Check specifically for approval intent
function isApproval(message) {
  const result = detectIntent(message);
  return result && result.action === 'approve';
}

// Check specifically for rejection intent
function isRejection(message) {
  const result = detectIntent(message);
  return result && result.action === 'reject';
}

// Check for ticket creation intent
function isCreateTicket(message) {
  const result = detectIntent(message);
  return result && result.action === 'create_ticket';
}

// Check for demo flow intent
function isDemo(message) {
  const result = detectIntent(message);
  return result && result.action === 'demo';
}

module.exports = {
  detectIntent,
  isApproval,
  isRejection,
  isCreateTicket,
  isDemo,
  INTENTS
};
