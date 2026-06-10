// skills/slack-skills.js
// Unified entry point for all Slack skills
// Import this single file to access all workflow capabilities

const { registerApprovalWorkflow } = require('./slack-approval-workflow');
const { detectIntent, isApproval, isRejection, isCreateTicket, isDemo } = require('./slack-intent-matcher');
const { sendTicketEmail, sendEscalationEmail, mockIncomingEmail } = require('./slack-email-integration');
const { listChannels } = require('./slack-list-channels');
const { postMessage } = require('./slack-post-message');
const { replyInThread } = require('./slack-reply-thread');

// Ticket ID counter (in production, use a database)
// let ticketCounter = 100;

// function getNextTicketId() {
//   return ++ticketCounter;
// }
let ticketCounter = Math.floor(Date.now() / 1000) % 10000;
function getNextTicketId() {
  return ++ticketCounter;
}


// Register all workflow handlers on the Bolt app
function registerAllSkills(app) {
  // Register button-based approval workflow
  const { sendApprovalRequest } = registerApprovalWorkflow(app);

  return {
    sendApprovalRequest,
    detectIntent,
    isApproval,
    isRejection,
    isCreateTicket,
    isDemo,
    sendTicketEmail,
    sendEscalationEmail,
    mockIncomingEmail,
    listChannels,
    postMessage,
    replyInThread,
    getNextTicketId
  };
}

module.exports = { registerAllSkills };
