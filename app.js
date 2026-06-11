
require('dotenv').config();
const { App } = require('@slack/bolt');
const Groq = require('groq-sdk');
// const { registerAllSkills } = require('./skills/slack-skills');
const { registerAllSkills } = require('./skills/slack-skills');
const { connectDB, createTicket, logAction, getNextTicketId: getNextTicketIdDB } = require('./skills/slack-database');


const { sendTicketEmail, mockIncomingEmail } = require('./skills/slack-email-integration');
const { handleFileMessage } = require('./skills/slack-file-handler');
const { handleVoiceMessage, isVoiceMessage } = require('./skills/slack-voice-handler');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const skills = registerAllSkills(app);
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function runDemoFlow(client, channelId, threadTs) {
  const ticketId = skills.getNextTicketId();
  await client.chat.postMessage({ channel: channelId, thread_ts: threadTs, text: '🔔 *Step 1:* Issue created in the system.' });
  await sleep(1000);
  await skills.sendApprovalRequest(client, channelId, ticketId, 'Production server is returning 500 errors. Needs immediate escalation.', threadTs);
}

function startEmailPolling(botApp) {
  setInterval(async () => {
    if (process.env.EMAIL_POLLING_ENABLED !== 'true') return;
    const email = mockIncomingEmail();
    const channel = process.env.SLACK_DEFAULT_CHANNEL;
    if (!channel) return;
    try {
      await botApp.client.chat.postMessage({
        channel,
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text: `📨 *New support request received via email*\n>*From:* ${email.from}\n>*Subject:* ${email.subject}\n>*Message:* ${email.body}` } },
          { type: 'actions', block_id: `email_ticket_${email.ticketId}`, elements: [{ type: 'button', text: { type: 'plain_text', text: '🎫 Create Ticket', emoji: true }, style: 'primary', action_id: 'create_ticket_from_email', value: JSON.stringify({ ticketId: email.ticketId, subject: email.subject }) }] }
        ],
        text: `New support request received from ${email.from}`
      });
    } catch (err) { console.error('Email polling error:', err.message); }
  }, 60000);
}

app.action('create_ticket_from_email', async ({ body, ack, client }) => {
  await ack();
  const data = JSON.parse(body.actions[0].value);
  await client.chat.postMessage({ channel: body.channel.id, thread_ts: body.message.ts, text: `✅ Ticket #${data.ticketId} created from email: "${data.subject}"` });
});

app.event('app_mention', async ({ event, say, client }) => {
  console.log('📨 Mention received:', event.text);

  // Check for voice message first
  if (event.files && event.files.length > 0) {
    const hasVoice = event.files.some(f => isVoiceMessage(f));
    if (hasVoice) {
      console.log('🎤 Voice message detected');
      const handled = await handleVoiceMessage(event, client, groq);
      if (handled) return;
    } else {
      console.log('📎 File attachment detected');
      const handled = await handleFileMessage(event, client, groq);
      if (handled) return;
    }
  }

  const rawMessage = event.text ? event.text.replace(/<@[A-Z0-9]+>/g, '').trim() : '';
  console.log('👤 User said:', rawMessage);

  if (!rawMessage) {
    await say({ text: `👋 Hi! I'm BlaZop-AI-Agent. You can:\n• Ask me any question\n• Say *"create support ticket"* to raise a ticket\n• Say *"demo"* to see the full workflow\n• Attach a *PDF or document* for me to summarize\n• Send a *voice message* and I'll transcribe + answer it!\n• Type *"help"* for all commands`, thread_ts: event.ts });
    return;
  }

  if (skills.isDemo(rawMessage)) {
    await say({ text: '🚀 Starting end-to-end demo flow...', thread_ts: event.ts });
    await runDemoFlow(client, event.channel, event.ts);
    return;
  }

  if (skills.isCreateTicket(rawMessage)) {
    // const ticketId = skills.getNextTicketId();
    // const ticketData = { ticketId, description: 'Support ticket created via Slack', createdBy: `<@${event.user}>`, channel: event.channel, priority: 'Medium' };
    // // await say({ text: `🎫 *Support Ticket #${ticketId} created!*\nPriority: ${ticketData.priority}`, thread_ts: event.ts });
    // // const emailResult = await sendTicketEmail(ticketData);
    // // await say({ text: emailResult.mock ? `📧 Email notification sent (mock mode) to \`${emailResult.to}\`` : `📧 Email sent successfully!`, thread_ts: event.ts });
    // // await skills.sendApprovalRequest(client, event.channel, ticketId, ticketData.description, event.ts);

    // await say({ text: `🎫 *Support Ticket #${ticketId} created!*\nPriority: ${ticketData.priority}\n\nWaiting for approval before sending email notification...`, thread_ts: event.ts });
    // await skills.sendApprovalRequest(client, event.channel, ticketId, ticketData.description, event.ts);

    const ticketId = await getNextTicketIdDB();
const ticketData = {
  ticketId,
  description: 'Support ticket created via Slack',
  createdBy: `<@${event.user}>`,
  channel: event.channel,
  priority: 'Medium'
};
await createTicket(ticketData);
await logAction('ticket_created', { ticketId, userId: event.user, channel: event.channel });
await say({ text: `🎫 *Support Ticket #${ticketId} created!*\nPriority: ${ticketData.priority}\n\nWaiting for approval before sending email notification...`, thread_ts: event.ts });
await skills.sendApprovalRequest(client, event.channel, ticketId, ticketData.description, event.ts);
    return;
  }

  if (skills.isApproval(rawMessage)) {
    await say({ text: `✅ Approval noted! Use the *Approve* button on the ticket message for specific tickets.`, thread_ts: event.ts });
    return;
  }

  if (skills.isRejection(rawMessage)) {
    await say({ text: `❌ Rejection noted! The action has been cancelled.`, thread_ts: event.ts });
    return;
  }

  if (rawMessage.toLowerCase().includes('approval') || rawMessage.toLowerCase().includes('ticket')) {
    const ticketId = skills.getNextTicketId();
    await say({ text: `🎫 Creating approval request for Ticket #${ticketId}...`, thread_ts: event.ts });
    await skills.sendApprovalRequest(client, event.channel, ticketId, 'Sample issue: Login service is down for 10% of users.', event.ts);
    return;
  }

  if (rawMessage.toLowerCase() === 'help' || rawMessage.toLowerCase() === 'commands') {
    await say({ text: `🤖 *BlaZop-AI-Agent Commands:*\n\n*💬 AI Chat:* Ask me anything!\n*🎫 Tickets:* "create support ticket"\n*✅ Workflow:* "demo"\n*📄 Documents:* Attach a PDF or TXT file\n*🎤 Voice:* Send a voice message\n*👍 Approve:* "yes" or "approve"\n*👎 Reject:* "no" or "reject"`, thread_ts: event.ts });
    return;
  }

  // Original AI Chatbot fallback
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are BlaZop-AI-Agent, a helpful AI assistant in Slack. Keep responses concise and well-formatted.' },
        { role: 'user', content: rawMessage }
      ],
      model: 'llama-3.3-70b-versatile',
    });
    const reply = completion.choices[0].message.content;
    await say({ text: reply, thread_ts: event.ts });
  } catch (error) {
    console.error('❌ Groq error:', error.message);
    await say({ text: '⚠️ Sorry, I had trouble with that. Please try again!', thread_ts: event.ts });
  }
});

// (async () => {
//   await app.start(3000);
//   console.log('⚡ BlaZop-AI-Agent running on port 3000');
(async () => {
  await connectDB();
  await app.start(3000);
  console.log('⚡ BlaZop-AI-Agent running on port 3000');
  console.log('✅ AI Chatbot: Active');
  console.log('✅ Approval Workflow: Active');
  console.log('✅ Intent Matching: Active');
  console.log('✅ Email Integration: Active');
  console.log('✅ Demo Flow: Active');
  console.log('✅ File Handler (PDF/TXT/DOCX): Active');
  console.log('✅ Voice Handler (Whisper): Active');
  startEmailPolling(app);
})();