// skills/slack-post-message.js
// Utility: Post a message to any channel

async function postMessage(client, channelId, text, blocks = null) {
  try {
    const payload = { channel: channelId, text };
    if (blocks) payload.blocks = blocks;
    const result = await client.chat.postMessage(payload);
    return result;
  } catch (error) {
    console.error('Error posting message:', error.message);
    throw error;
  }
}

module.exports = { postMessage };
