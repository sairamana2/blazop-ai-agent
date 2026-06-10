// // require('dotenv').config();
// // const pdfParse = require('pdf-parse');
// // // const pdfParse = require('pdf-parse/lib/pdf-parse.js');
// // const https = require('https');
// // const http = require('http');

// require('dotenv').config();
// const https = require('https');
// const http = require('http');

// // PDF parsing - handle different module export styles
// let pdfParser;
// try {
//   const mod = require('pdf-parse');
//   pdfParser = typeof mod === 'function' ? mod : (mod.default || Object.values(mod).find(v => typeof v === 'function'));
// } catch(e) {
//   pdfParser = null;
// }



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

// async function handleFileMessage(event, client, groq) {
//   const files = event.files || [];
//   if (files.length === 0) return false;
//   const file = files[0];
//   const token = process.env.SLACK_BOT_TOKEN;
//   const userQuestion = event.text ? event.text.replace(/<@[A-Z0-9]+>/g, '').trim() : 'Summarize this document.';

//   console.log(`📎 File: ${file.name} (${file.mimetype})`);

//   await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `📎 Processing *${file.name}*... please wait.` });

//   try {
//     const buffer = await downloadFile(file.url_private_download || file.url_private, token);
//     let text = '';
//     const ext = file.name.split('.').pop().toLowerCase();

//     if (file.mimetype.includes('pdf') || ext === 'pdf') {
//       // const data = await pdfParse(buffer);
//       // const data = await pdfParse.default ? await pdfParse.default(buffer) : await pdfParse(buffer);
//       // text = data.text;
//         if (!pdfParser) throw new Error('PDF parser not available');
// const data = await pdfParser(buffer);
// text = data.text;

//     } else if (file.mimetype.includes('text') || ext === 'txt' || ext === 'csv') {
//       text = buffer.toString('utf-8');
//     } else {
//       await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `⚠️ File type *${ext}* not supported yet. Please share PDF or TXT files.` });
//       return true;
//     }

//     if (!text || text.trim().length < 20) {
//       await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `⚠️ Could not extract text from *${file.name}*. Try a text-based PDF (not scanned image).` });
//       return true;
//     }

//     const truncated = text.length > 8000;
//     const textToSend = truncated ? text.substring(0, 8000) + '...[truncated]' : text;
//     const prompt = userQuestion.length > 5
//       ? `File: "${file.name}"\nUser asked: "${userQuestion}"\n\nContent:\n${textToSend}`
//       : `Summarize this document "${file.name}" with key points:\n\n${textToSend}`;

//     const completion = await groq.chat.completions.create({
//       messages: [
//         { role: 'system', content: 'You are BlaZop-AI-Agent. Analyze documents and give clear structured summaries.' },
//         { role: 'user', content: prompt }
//       ],
//       model: 'llama-3.3-70b-versatile',
//     });

//     const reply = completion.choices[0].message.content;
//     await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `📄 *Analysis of ${file.name}:*\n\n${reply}${truncated ? '\n\n_⚠️ Large file — first 8000 chars analyzed._' : ''}` });
//     return true;

//   } catch (err) {
//     console.error('📎 Error:', err.message);
//     await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `❌ Error reading file: ${err.message}` });
//     return true;
//   }
// }

// module.exports = { handleFileMessage };


const https = require('https');
const http = require('http');

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


// Extract text from PDF using raw string parsing (no external lib needed)
function extractPDFText(buffer) {
  const str = buffer.toString('binary');
  const results = [];
  
  // Method 1: Extract text from BT/ET blocks
  const btEtRegex = /BT([\s\S]*?)ET/g;
  let match;
  while ((match = btEtRegex.exec(str)) !== null) {
    const block = match[1];
    // Extract strings in parentheses
    const strRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
    let strMatch;
    while ((strMatch = strRegex.exec(block)) !== null) {
      const text = strMatch[1]
        .replace(/\\n/g, ' ').replace(/\\r/g, ' ')
        .replace(/\\t/g, ' ').replace(/\\\\/g, '\\')
        .replace(/\\'/g, "'").replace(/\\"/g, '"')
        .trim();
      if (text.length > 1 && /[a-zA-Z0-9]/.test(text)) {
        results.push(text);
      }
    }
    // Extract hex strings <...>
    const hexRegex = /<([0-9A-Fa-f]+)>/g;
    let hexMatch;
    while ((hexMatch = hexRegex.exec(block)) !== null) {
      const hex = hexMatch[1];
      if (hex.length % 2 === 0 && hex.length > 2) {
        let decoded = '';
        for (let i = 0; i < hex.length; i += 2) {
          const code = parseInt(hex.substr(i, 2), 16);
          if (code > 31 && code < 127) decoded += String.fromCharCode(code);
        }
        if (decoded.length > 1 && /[a-zA-Z]/.test(decoded)) results.push(decoded);
      }
    }
  }

  return results.join(' ').replace(/\s+/g, ' ').trim();
}

async function handleFileMessage(event, client, groq) {
  const files = event.files || [];
  if (files.length === 0) return false;
  const file = files[0];
  const token = process.env.SLACK_BOT_TOKEN;
  const userQuestion = event.text ? event.text.replace(/<@[A-Z0-9]+>/g, '').trim() : 'Summarize this document.';

  console.log(`📎 File: ${file.name} (${file.mimetype})`);
  await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `📎 Processing *${file.name}*... please wait.` });

  try {
    const buffer = await downloadFile(file.url_private_download || file.url_private, token);
    const ext = file.name.split('.').pop().toLowerCase();
    let text = '';

    // if (file.mimetype.includes('pdf') || ext === 'pdf') {
    //   text = extractPDFText(buffer);
    //   console.log(`📎 Extracted ${text.length} chars from PDF`);
    //   if (!text || text.length < 30) {
    //     await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `⚠️ Could not extract text from *${file.name}*.\n\nThis PDF appears to be image-based (scanned). Please:\n• Export your CV from Word/Google Docs as PDF\n• Or paste the text directly` });
    //     return true;

    if (file.mimetype.includes('pdf') || ext === 'pdf') {
      // Install and use pdf-parse v1.1.1
      let pdfMod;
      try { pdfMod = require('pdf-parse'); } catch(e) { pdfMod = null; }
      if (pdfMod) {
        try {
          const result = await new Promise((res, rej) => {
            pdfMod(buffer).then(res).catch(rej);
          });
          text = result.text || '';
        } catch(pe) { console.log('pdf-parse error:', pe.message); text = ''; }
      }
      text = text.replace(/\s+/g, ' ').trim();
      console.log(`📎 Extracted ${text.length} chars from PDF`);
      if (!text || text.length < 30) {
        await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `⚠️ Could not extract text from *${file.name}*. Please paste the CV text directly in the chat.` });
        return true;
      }


    } else if (file.mimetype.includes('text') || ext === 'txt' || ext === 'csv') {
      text = buffer.toString('utf-8');
    } else {
      await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `⚠️ File type *${ext}* not supported. Please share PDF or TXT files.` });
      return true;
    }

    const truncated = text.length > 8000;
    const textToSend = truncated ? text.substring(0, 8000) : text;
    const prompt = userQuestion.length > 5
      ? `File: "${file.name}"\nUser asked: "${userQuestion}"\n\nContent:\n${textToSend}`
      : `Summarize this document "${file.name}" with key points:\n\n${textToSend}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are BlaZop-AI-Agent. Analyze documents and give clear structured summaries.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
    });

    await client.chat.postMessage({
      channel: event.channel, thread_ts: event.ts,
      text: `📄 *Analysis of ${file.name}:*\n\n${completion.choices[0].message.content}${truncated ? '\n\n_⚠️ Large file — first 8000 chars analyzed._' : ''}`
    });
    return true;

  } catch (err) {
    console.error('📎 Error:', err.message);
    await client.chat.postMessage({ channel: event.channel, thread_ts: event.ts, text: `❌ Error: ${err.message}` });
    return true;
  }
}

module.exports = { handleFileMessage };