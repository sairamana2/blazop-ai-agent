// const https = require('https');
// const http = require('http');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const FormData = require('form-data');

// function downloadFile(url, token) {
//   return new Promise((resolve, reject) => {
//     const protocol = url.startsWith('https') ? https : http;
//     const options = { headers: { Authorization: `Bearer ${token}` } };
//     const makeRequest = (reqUrl) => {
//       protocol.get(reqUrl, options, (res) => {
//         if (res.statusCode === 301 || res.statusCode === 302) { makeRequest(res.headers.location); return; }
//         const chunks = [];
//         res.on('data', c => chunks.push(c));
//         res.on('end', () => resolve(Buffer.concat(chunks)));
//         res.on('error', reject);
//       }).on('error', reject);
//     };
//     makeRequest(url);
//   });
// }

// async function transcribeAudio(audioBuffer, mimeType, fileName) {
//   const ext = (fileName || 'audio.webm').split('.').pop() || 'webm';
//   const tempPath = path.join(os.tmpdir(), `blazop-audio-${Date.now()}.${ext}`);
//   fs.writeFileSync(tempPath, audioBuffer);

//   try {
//     const form = new FormData();
//     // form.append('file', fs.createReadStream(tempPath), { filename: fileName || `audio.${ext}`, contentType: mimeType || 'audio/webm' });
//     // form.append('file', fs.createReadStream(tempPath), { filename: `audio.mp4`, contentType: 'audio/mp4' });
//     // form.append('model', 'whisper-large-v3');
//     // form.append('response_format', 'json');

//     form.append('file', fs.createReadStream(tempPath), { filename: `audio.m4a`, contentType: 'audio/m4a' });
//     form.append('model', 'whisper-large-v3-turbo');
//     form.append('response_format', 'verbose_json');
//     form.append('language', 'en');

//     const response = await new Promise((resolve, reject) => {
//       const req = https.request({
//         hostname: 'api.groq.com',
//         path: '/openai/v1/audio/transcriptions',
//         method: 'POST',
//         headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
//       }, (res) => {
//         let data = '';
//         res.on('data', c => data += c);
//         res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(new Error(data)); } });
//       });
//       req.on('error', reject);
//       form.pipe(req);
//     });

//     fs.unlinkSync(tempPath);
//     // return response.text || null;
//     console.log('🎤 Whisper response:', JSON.stringify(response));
//     return response.text || response.transcript || null;
//   } catch (err) {
//     if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
//     throw err;
//   }
// }

// function isVoiceMessage(file) {
//   if (!file) return false;
//   const audioMimes = ['audio/webm','audio/mp4','audio/mpeg','audio/mp3','audio/ogg','audio/wav','audio/x-m4a','audio/aac','video/webm','video/mp4'];
//   const audioExts = ['webm','mp4','mp3','ogg','wav','m4a','aac'];
//   const ext = (file.name || '').split('.').pop().toLowerCase();
//   return audioMimes.includes(file.mimetype) || audioExts.includes(ext) || file.subtype === 'slack_audio' || (file.name||'').includes('audio') || (file.name||'').includes('recording');
// }

// async function handleVoiceMessage(event, client, groq) {
//   const files = event.files || [];
//   const voiceFile = files.find(f => isVoiceMessage(f));
//   if (!voiceFile) return false;

//   console.log(`🎤 Voice: ${voiceFile.name} (${voiceFile.mimetype})`);
//   await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: '🎤 Processing your voice message... please wait.' });

//   try {
//     const buffer = await downloadFile(voiceFile.url_private_download || voiceFile.url_private, process.env.SLACK_BOT_TOKEN);
//     console.log(`🎤 Downloaded: ${buffer.length} bytes`);

//     const transcription = await transcribeAudio(buffer, voiceFile.mimetype, voiceFile.name);
//     if (!transcription || transcription.trim().length === 0) {
//       await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: '🎤 Could not detect speech. Please speak clearly and try again, or type your question.' });
//       return true;
//     }

//     console.log(`🎤 Transcribed: "${transcription}"`);
//     await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `🎤 *I heard:* _"${transcription}"_\n⏳ Getting response...` });

//     const completion = await groq.chat.completions.create({
//       messages: [
//         { role: 'system', content: 'You are BlaZop-AI-Agent. The user sent a voice message. Respond helpfully and concisely.' },
//         { role: 'user', content: transcription }
//       ],
//       model: 'llama-3.3-70b-versatile',
//     });

//     await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `🤖 *Response:*\n\n${completion.choices[0].message.content}` });
//     return true;

//   } catch (err) {
//     console.error('🎤 Error:', err.message);
//     await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `❌ Voice error: ${err.message}\nPlease type your question instead.` });
//     return true;
//   }
// }

// module.exports = { handleVoiceMessage, isVoiceMessage };


const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const FormData = require('form-data');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

// function downloadFile(url, token) {
//   return new Promise((resolve, reject) => {
//     const protocol = url.startsWith('https') ? https : http;
//     const options = { headers: { Authorization: `Bearer ${token}` } };
//     const makeRequest = (reqUrl) => {
//       protocol.get(reqUrl, options, (res) => {
//         if (res.statusCode === 301 || res.statusCode === 302) { makeRequest(res.headers.location); return; }
//         const chunks = [];
//         res.on('data', c => chunks.push(c));
//         res.on('end', () => resolve(Buffer.concat(chunks)));
//         res.on('error', reject);
//       }).on('error', reject);
//     };
//     makeRequest(url);
//   });
// }

function downloadFile(url, token) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0',
        Accept: 'application/octet-stream,*/*'
      }
    };
    https.get(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirected = new URL(res.headers.location);
        https.get({
          hostname: redirected.hostname,
          path: redirected.pathname + redirected.search,
          headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Mozilla/5.0', Accept: '*/*' }
        }, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function downloadFile(url, token) {
  // Use Slack files.info API to get a fresh download URL
  const fileId = url.match(/\/([A-Z0-9]+)\//)?.[1];
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'slack.com',
      path: `/api/files.getUploadURLExternal`,
      headers: { Authorization: `Bearer ${token}` }
    };

    // Direct download with proper headers
    const downloadUrl = new URL(url);
    const reqOptions = {
      hostname: downloadUrl.hostname,
      path: downloadUrl.pathname + downloadUrl.search,
      headers: { 
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0'
      }
    };

    https.get(reqOptions, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirectOptions = new URL(res.headers.location);
        https.get({
          hostname: redirectOptions.hostname,
          path: redirectOptions.pathname + redirectOptions.search,
          headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'Mozilla/5.0' }
        }, (res2) => {
          const chunks = [];
          res2.on('data', c => chunks.push(c));
          res2.on('end', () => resolve(Buffer.concat(chunks)));
          res2.on('error', reject);
        }).on('error', reject);
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}




async function transcribeAudio(audioBuffer, mimeType, fileName) {
  const ext = (fileName || 'audio').split('.').pop() || 'm4a';
  // const inputPath = path.join(os.tmpdir(), `blazop-in-${Date.now()}.${ext}`);
  // const inputPath = path.join(os.tmpdir(), `blazop-in-${Date.now()}.mp4`);
  const inputPath = path.join(os.tmpdir(), `blazop-in-${Date.now()}.m4a`);
  const outputPath = path.join(os.tmpdir(), `blazop-out-${Date.now()}.mp3`);
  
  fs.writeFileSync(inputPath, audioBuffer);

  try {
    // Convert to mp3 using ffmpeg
    console.log('🎤 Converting audio to mp3...');
    // execSync(`"${ffmpegPath}" -i "${inputPath}" -ar 16000 -ac 1 -c:a libmp3lame "${outputPath}" -y`, { stdio: 'pipe' });
    // execSync(`"${ffmpegPath}" -f mp4 -i "${inputPath}" -ar 16000 -ac 1 -c:a libmp3lame "${outputPath}" -y 2>&1 || "${ffmpegPath}" -i "${inputPath}" -ar 16000 -ac 1 "${outputPath}" -y`, { stdio: 'pipe', shell: true });

    execSync(`"${ffmpegPath}" -i "${inputPath}" -vn -ar 16000 -ac 1 -b:a 128k "${outputPath}" -y`, { stdio: 'pipe' });
    console.log('🎤 Conversion done, sending to Whisper...');

    const form = new FormData();
    form.append('file', fs.createReadStream(outputPath), { filename: 'audio.mp3', contentType: 'audio/mpeg' });
    form.append('model', 'whisper-large-v3-turbo');
    form.append('response_format', 'json');
    form.append('language', 'en');

    const response = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.groq.com',
        path: '/openai/v1/audio/transcriptions',
        method: 'POST',
        headers: { ...form.getHeaders(), Authorization: `Bearer ${process.env.GROQ_API_KEY}` }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(new Error(data)); } });
      });
      req.on('error', reject);
      form.pipe(req);
    });

    console.log('🎤 Whisper response:', JSON.stringify(response));
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    return response.text || null;

  } catch (err) {
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    throw err;
  }
}

function isVoiceMessage(file) {
  if (!file) return false;
  const audioMimes = ['audio/webm','audio/mp4','audio/mpeg','audio/mp3','audio/ogg','audio/wav','audio/x-m4a','audio/aac','video/webm','video/mp4'];
  const audioExts = ['webm','mp4','mp3','ogg','wav','m4a','aac'];
  const ext = (file.name || '').split('.').pop().toLowerCase();
  return audioMimes.includes(file.mimetype) || audioExts.includes(ext) || file.subtype === 'slack_audio';
}

async function handleVoiceMessage(event, client, groq) {
  const voiceFile = (event.files || []).find(f => isVoiceMessage(f));
  if (!voiceFile) return false;

  console.log(`🎤 Voice: ${voiceFile.name} (${voiceFile.mimetype})`);
  await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: '🎤 Processing your voice message... please wait.' });

  try {
    const buffer = await downloadFile(voiceFile.url_private_download || voiceFile.url_private, process.env.SLACK_BOT_TOKEN);
    console.log(`🎤 Downloaded: ${buffer.length} bytes`);

    const transcription = await transcribeAudio(buffer, voiceFile.mimetype, voiceFile.name);
    if (!transcription || !transcription.trim()) {
      await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: '🎤 Could not detect speech. Please speak clearly and try again.' });
      return true;
    }

    // console.log(`🎤 Transcribed: "${transcription}"`);
    // await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `🎤 *I heard:* _"${transcription}"_\n⏳ Getting response...` });

    // const completion = await groq.chat.completions.create({
    //   messages: [
    //     { role: 'system', content: 'You are BlaZop-AI-Agent. The user sent a voice message. Respond helpfully and concisely.' },
    //     { role: 'user', content: transcription }
    //   ],
    //   model: 'llama-3.3-70b-versatile',
    // });

    console.log(`🎤 Raw transcription: "${transcription}"`);

// Auto-correct the transcription
const correctionResponse = await groq.chat.completions.create({
  messages: [
    {
      role: 'system',
      content: `You are a transcription corrector. The user spoke a message that was transcribed by speech-to-text software. 
Fix any obvious mishearings, spelling errors, or grammar issues. 
Common corrections: "Water" → "What are", "Eye" → "AI", "elm" → "LLM", etc.
Return ONLY the corrected text, nothing else. No explanation.`
    },
    { role: 'user', content: `Fix this transcription: "${transcription}"` }
  ],
  model: 'llama-3.3-70b-versatile',
  max_tokens: 100
});

const corrected = correctionResponse.choices[0].message.content.trim();
console.log(`🎤 Corrected: "${corrected}"`);

const displayText = corrected !== transcription 
  ? `🎤 *I heard:* _"${transcription}"_\n✏️ *Corrected to:* _"${corrected}"_\n⏳ Getting response...`
  : `🎤 *I heard:* _"${transcription}"_\n⏳ Getting response...`;

await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: displayText });

const completion = await groq.chat.completions.create({
  messages: [
    { role: 'system', content: 'You are BlaZop-AI-Agent. The user sent a voice message. Respond helpfully and concisely.' },
    { role: 'user', content: corrected }
  ],
  model: 'llama-3.3-70b-versatile',
});

    await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `🤖 *Response:*\n\n${completion.choices[0].message.content}` });
    return true;

  } catch (err) {
    console.error('🎤 Error:', err.message);
    await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `❌ Voice error: ${err.message}` });
    return true;
  }
}

module.exports = { handleVoiceMessage, isVoiceMessage };