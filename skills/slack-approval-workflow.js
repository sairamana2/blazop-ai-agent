// skills/slack-approval-workflow.js
// Handles approval workflow with Slack Block Kit buttons
// MODULAR - does not affect existing AI chatbot functionality

// const activeApprovals = new Map();
// const activeApprovals = new Map();
// const { sendTicketEmail } = require('./slack-email-integration');
const activeApprovals = new Map();
const { sendTicketEmail } = require('./slack-email-integration');
const { updateTicketStatus, logAction } = require('./slack-database');

function registerApprovalWorkflow(app) {

  // Send an approval request message with Approve/Reject buttons
  async function sendApprovalRequest(client, channelId, ticketId, description, threadTs = null) {
    const message = {
      channel: channelId,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎫 *Support Ticket #${ticketId} has been raised.*\n>${description}\n\n*Approve escalation?*`
          }
        },
        {
          type: 'actions',
          block_id: `approval_${ticketId}`,
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '✅ Approve', emoji: true },
              style: 'primary',
              action_id: 'approve_ticket',
              value: ticketId.toString()
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '❌ Reject', emoji: true },
              style: 'danger',
              action_id: 'reject_ticket',
              value: ticketId.toString()
            }
          ]
        }
      ],
      text: `Support Ticket #${ticketId} requires approval.`
    };

    if (threadTs) message.thread_ts = threadTs;

    const result = await client.chat.postMessage(message);

    // Store active approval for reference
    activeApprovals.set(ticketId.toString(), {
      channelId,
      messageTs: result.ts,
      description,
      status: 'pending'
    });

    return result;
  }

  // Handle Approve button click
  app.action('approve_ticket', async ({ body, ack, client }) => {
    await ack();

    const ticketId = body.actions[0].value;
    const channelId = body.channel.id;
    const userId = body.user.id;
    const messageTs = body.message.ts;

    console.log(`✅ Ticket #${ticketId} approved by ${userId}`);

    // Update the original message to show approved state
    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎫 *Support Ticket #${ticketId}*\n✅ *Escalation approved by <@${userId}>*`
          }
        }
      ],
      text: `Ticket #${ticketId} approved.`
    });

    // Send confirmation message
    // await client.chat.postMessage({
    //   channel: channelId,
    //   thread_ts: messageTs,
    //   text: `✅ *Ticket escalated successfully.* Ticket #${ticketId} has been escalated. <@${userId}> approved this action.`
    // });

    // Send email on approval
// const { sendTicketEmail } = require('./slack-email-integration');
// const emailResult = await sendTicketEmail({
//   ticketId,
//   description: 'Ticket escalated after approval',
//   createdBy: `<@${userId}>`,
//   channel: channelId,
//   priority: 'High'
// });

// Get stored ticket info
const ticketInfo = activeApprovals.get(ticketId) || {};
const emailResult = await sendTicketEmail({
  ticketId,
  description: ticketInfo.description || 'Support ticket escalated',
  createdBy: `User ${userId}`,
  channel: `#bot-testing`,
  priority: 'High'
});

await client.chat.postMessage({
  channel: channelId,
  thread_ts: messageTs,
  text: `✅ *Ticket escalated successfully.* Ticket #${ticketId} has been escalated. <@${userId}> approved this action.\n📧 Email notification sent!`
});
   await updateTicketStatus(parseInt(ticketId), 'approved', userId);
   await logAction('ticket_approved', { ticketId: parseInt(ticketId), userId, channel: channelId });
    // Update active approvals map
    if (activeApprovals.has(ticketId)) {
      activeApprovals.get(ticketId).status = 'approved';
    }
  });

  // Handle Reject button click
  app.action('reject_ticket', async ({ body, ack, client }) => {
    await ack();

    const ticketId = body.actions[0].value;
    const channelId = body.channel.id;
    const userId = body.user.id;
    const messageTs = body.message.ts;

    console.log(`❌ Ticket #${ticketId} rejected by ${userId}`);

    // Update the original message to show rejected state
    await client.chat.update({
      channel: channelId,
      ts: messageTs,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎫 *Support Ticket #${ticketId}*\n❌ *Escalation rejected by <@${userId}>*`
          }
        }
      ],
      text: `Ticket #${ticketId} rejected.`
    });

    // Send confirmation message
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: messageTs,
      text: `❌ *Escalation rejected.* Ticket #${ticketId} will not be escalated. <@${userId}> rejected this action.`
    });
    
    await updateTicketStatus(parseInt(ticketId), 'rejected', userId);
    await logAction('ticket_rejected', { ticketId: parseInt(ticketId), userId, channel: channelId });
    // Update active approvals map
    if (activeApprovals.has(ticketId)) {
      activeApprovals.get(ticketId).status = 'rejected';
    }
  });

  return { sendApprovalRequest, activeApprovals };
}

module.exports = { registerApprovalWorkflow };
