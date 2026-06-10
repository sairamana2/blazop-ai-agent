// skills/slack-reply-thread.js
// Utility: Reply in a Slack thread

async function replyInThread(client, channelId, threadTs, text, blocks = null) {
  try {
    const payload = { channel: channelId, thread_ts: threadTs, text };
    if (blocks) payload.blocks = blocks;
    const result = await client.chat.postMessage(payload);
    return result;
  } catch (error) {
    console.error('Error replying in thread:', error.message);
    throw error;
  }
}

module.exports = { replyInThread };
