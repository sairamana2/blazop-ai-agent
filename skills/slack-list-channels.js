// skills/slack-list-channels.js
// Utility: List all channels in the workspace

async function listChannels(client) {
  try {
    const result = await client.conversations.list({
      types: 'public_channel,private_channel',
      limit: 50
    });
    return result.channels || [];
  } catch (error) {
    console.error('Error listing channels:', error.message);
    return [];
  }
}

module.exports = { listChannels };
