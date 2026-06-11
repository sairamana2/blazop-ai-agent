// // skills/slack-email-integration.js
// // Handles email notifications for support tickets
// // Uses nodemailer with SMTP - falls back to mock if credentials not set

// const nodemailer = require('nodemailer');

// // Create transporter based on available credentials
// function createTransporter() {
//   const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

//   // If real SMTP credentials exist, use them
//   if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
//     console.log('📧 Using real SMTP transporter');
//     // return nodemailer.createTransport({
//     //   host: SMTP_HOST,
//     //   port: parseInt(SMTP_PORT) || 587,
//     //   secure: false,
//     //   auth: {
//     //     user: SMTP_USER,
//     //     pass: SMTP_PASS
//     //   }
//     // });

//     const port = parseInt(SMTP_PORT) || 587;
// return nodemailer.createTransport({
//   host: SMTP_HOST,
//   port: port,
//   secure: port === 465,
//   auth: {
//     user: SMTP_USER,
//     pass: SMTP_PASS
//   }
// });
//   }

//   // Otherwise use Ethereal (free fake SMTP for testing)
//   console.log('📧 Using mock email transporter (Ethereal)');
//   return nodemailer.createTransport({
//     host: 'smtp.ethereal.email',
//     port: 587,
//     auth: {
//       user: process.env.ETHEREAL_USER || 'mock@ethereal.email',
//       pass: process.env.ETHEREAL_PASS || 'mockpassword'
//     }
//   });
// }

// // Send ticket creation email
// async function sendTicketEmail(ticketData) {
//   const { ticketId, description, createdBy, channel, priority = 'Medium' } = ticketData;
//   const toEmail = process.env.SUPPORT_EMAIL || 'support@blazop.com';
//   const apiKey = process.env.BREVO_API_KEY;

//   // Mock mode if no API key
//   if (!apiKey) {
//     console.log('📧 [MOCK EMAIL] Would send to:', toEmail);
//     return { success: true, mock: true, message: `Mock email for Ticket #${ticketId}`, to: toEmail };
//   }

//   try {
//     const https = require('https');
//     const emailData = JSON.stringify({
//       sender: { name: 'BlaZop AI Agent', email: 'sairamana992@gmail.com' },
//       to: [{ email: toEmail }],
//       subject: `[BlaZop] New Support Ticket #${ticketId} - ${priority} Priority`,
//       htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px"><h2 style="color:#4A154B">🎫 New Support Ticket Created</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px;font-weight:bold">Ticket ID:</td><td>#${ticketId}</td></tr><tr><td style="padding:8px;font-weight:bold">Description:</td><td>${description}</td></tr><tr><td style="padding:8px;font-weight:bold">Created By:</td><td>${createdBy}</td></tr><tr><td style="padding:8px;font-weight:bold">Channel:</td><td>${channel}</td></tr><tr><td style="padding:8px;font-weight:bold">Priority:</td><td>${priority}</td></tr><tr><td style="padding:8px;font-weight:bold">Time:</td><td>${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td></tr></table><p style="color:#666;margin-top:20px">Automated notification from BlaZop-AI-Agent.</p></div>`
//     });

//     const result = await new Promise((resolve, reject) => {
//       const req = https.request({
//         hostname: 'api.brevo.com',
//         path: '/v3/smtp/email',
//         method: 'POST',
//         headers: {
//           'accept': 'application/json',
//           'api-key': apiKey,
//           'content-type': 'application/json',
//           'content-length': Buffer.byteLength(emailData)
//         }
//       }, (res) => {
//         let data = '';
//         res.on('data', c => data += c);
//         res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
//       });
//       req.on('error', reject);
//       req.write(emailData);
//       req.end();
//     });

//     console.log('📧 Brevo API:', result.statusCode, result.body);
//     if (result.statusCode === 201) {
//       return { success: true, mock: false, messageId: JSON.parse(result.body).messageId, to: toEmail };
//     }
//     throw new Error(`Brevo error: ${result.body}`);

//   } catch (error) {
//     console.error('📧 Email error:', error.message);
//     return { success: false, error: error.message };
//   }
// }

// // async function sendTicketEmail(ticketData) {
// //   const {
// //     ticketId,
// //     description,
// //     createdBy,
// //     channel,
// //     priority = 'Medium'
// //   } = ticketData;

// //   const toEmail = process.env.SUPPORT_EMAIL || 'support@blazop.com';

// //   // Mock mode - just log if no real email setup
// //   if (!process.env.SMTP_HOST && !process.env.ETHEREAL_USER) {
// //     console.log('📧 [MOCK EMAIL] Would send to:', toEmail);
// //     console.log('📧 [MOCK EMAIL] Subject: New Support Ticket #' + ticketId);
// //     console.log('📧 [MOCK EMAIL] Body:', {
// //       ticketId,
// //       description,
// //       createdBy,
// //       channel,
// //       priority,
// //       timestamp: new Date().toISOString()
// //     });

// //     return {
// //       success: true,
// //       mock: true,
// //       message: `Mock email sent for Ticket #${ticketId}`,
// //       to: toEmail
// //     };
// //   }

//   // try {
//   //   const transporter = createTransporter();

//   //   const mailOptions = {
//   //     // from: process.env.SMTP_USER || 'blazop-agent@blazop.com',
//   //     from: 'BlaZop AI Agent <sairamana992@gmail.com>',
//   //     to: toEmail,
//   //     subject: `[BlaZop] New Support Ticket #${ticketId} - ${priority} Priority`,
//   //     html: `
//   //       <div style="font-family: Arial, sans-serif; max-width: 600px;">
//   //         <h2 style="color: #4A154B;">🎫 New Support Ticket Created</h2>
//   //         <table style="width: 100%; border-collapse: collapse;">
//   //           <tr><td style="padding: 8px; font-weight: bold;">Ticket ID:</td><td>#${ticketId}</td></tr>
//   //           <tr><td style="padding: 8px; font-weight: bold;">Description:</td><td>${description}</td></tr>
//   //           <tr><td style="padding: 8px; font-weight: bold;">Created By:</td><td>${createdBy}</td></tr>
//   //           <tr><td style="padding: 8px; font-weight: bold;">Channel:</td><td>${channel}</td></tr>
//   //           <tr><td style="padding: 8px; font-weight: bold;">Priority:</td><td>${priority}</td></tr>

//   //           <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</td></tr>
//   //         </table>
//   //         <p style="color: #666; margin-top: 20px;">This is an automated notification from BlaZop-AI-Agent.</p>
//   //       </div>
//   //     `
//   //   };

//   try {
//     // Use Brevo HTTP API instead of SMTP (works on Railway)
//     const https = require('https');
//     const emailData = JSON.stringify({
//       sender: { name: 'BlaZop AI Agent', email: 'sairamana992@gmail.com' },
//       to: [{ email: toEmail }],
//       subject: `[BlaZop] New Support Ticket #${ticketId} - ${priority} Priority`,
//       htmlContent: `
//         <div style="font-family: Arial, sans-serif; max-width: 600px;">
//           <h2 style="color: #4A154B;">🎫 New Support Ticket Created</h2>
//           <table style="width: 100%; border-collapse: collapse;">
//             <tr><td style="padding: 8px; font-weight: bold;">Ticket ID:</td><td>#${ticketId}</td></tr>
//             <tr><td style="padding: 8px; font-weight: bold;">Description:</td><td>${description}</td></tr>
//             <tr><td style="padding: 8px; font-weight: bold;">Created By:</td><td>${createdBy}</td></tr>
//             <tr><td style="padding: 8px; font-weight: bold;">Channel:</td><td>${channel}</td></tr>
//             <tr><td style="padding: 8px; font-weight: bold;">Priority:</td><td>${priority}</td></tr>
//             <tr><td style="padding: 8px; font-weight: bold;">Time:</td><td>${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td></tr>
//           </table>
//           <p style="color: #666; margin-top: 20px;">This is an automated notification from BlaZop-AI-Agent.</p>
//         </div>
//       `
//     });

//     const info = await new Promise((resolve, reject) => {
//       const req = https.request({
//         hostname: 'api.brevo.com',
//         path: '/v3/smtp/email',
//         method: 'POST',
//         headers: {
//           'accept': 'application/json',
//           'api-key': process.env.BREVO_API_KEY,
//           'content-type': 'application/json',
//           'content-length': Buffer.byteLength(emailData)
//         }
//       }, (res) => {
//         let data = '';
//         res.on('data', chunk => data += chunk);
//         res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
//       });
//       req.on('error', reject);
//       req.write(emailData);
//       req.end();
//     });

//     console.log('📧 Brevo API response:', info.statusCode, info.body);

//     if (info.statusCode === 201) {
//       return { success: true, mock: false, messageId: JSON.parse(info.body).messageId, to: toEmail };
//     } else {
//       throw new Error(`Brevo API error: ${info.body}`);
//     }
//     // ----------

//     const info = await transporter.sendMail(mailOptions);
//     console.log('📧 Email sent:', info.messageId);

//     return {
//       success: true,
//       mock: false,
//       messageId: info.messageId,
//       to: toEmail
//     };

//   } catch (error) {
//     console.error('📧 Email error:', error.message);
//     return {
//       success: false,
//       error: error.message
//     };
//   }
// }

// // Send escalation notification email
// async function sendEscalationEmail(ticketId, approvedBy, action) {
//   const toEmail = process.env.SUPPORT_EMAIL || 'support@blazop.com';
//   const actionText = action === 'approved' ? 'APPROVED - Escalated' : 'REJECTED - Not Escalated';

//   console.log(`📧 [EMAIL] Ticket #${ticketId} escalation ${actionText} by ${approvedBy} → ${toEmail}`);

//   return {
//     success: true,
//     mock: true,
//     message: `Escalation email sent for Ticket #${ticketId}`
//   };
// }

// // Mock: Simulate receiving a new email and return structured data
// function mockIncomingEmail() {
//   return {
//     from: 'customer@example.com',
//     subject: 'Issue with login feature',
//     body: 'I am unable to log in to the system. Please help.',
//     receivedAt: new Date().toISOString(),
//     ticketId: Math.floor(Math.random() * 900) + 100
//   };
// }

// module.exports = {
//   sendTicketEmail,
//   sendEscalationEmail,
//   mockIncomingEmail
// };


const nodemailer = require('nodemailer');

async function sendTicketEmail(ticketData) {
  const { ticketId, description, createdBy, channel, priority = 'Medium' } = ticketData;
  const toEmail = process.env.SUPPORT_EMAIL || 'support@blazop.com';
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.log('📧 [MOCK EMAIL] Would send to:', toEmail);
    return { success: true, mock: true, message: `Mock email for Ticket #${ticketId}`, to: toEmail };
  }

  try {
    const https = require('https');
    const emailData = JSON.stringify({
      sender: { name: 'BlaZop AI Agent', email: 'sairamana992@gmail.com' },
      to: [{ email: toEmail }],
      subject: `[BlaZop] New Support Ticket #${ticketId} - ${priority} Priority`,
      htmlContent: `<div style="font-family:Arial,sans-serif;max-width:600px"><h2 style="color:#4A154B">🎫 New Support Ticket Created</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px;font-weight:bold">Ticket ID:</td><td>#${ticketId}</td></tr><tr><td style="padding:8px;font-weight:bold">Description:</td><td>${description}</td></tr><tr><td style="padding:8px;font-weight:bold">Created By:</td><td>${createdBy}</td></tr><tr><td style="padding:8px;font-weight:bold">Channel:</td><td>${channel}</td></tr><tr><td style="padding:8px;font-weight:bold">Priority:</td><td>${priority}</td></tr><tr><td style="padding:8px;font-weight:bold">Time:</td><td>${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</td></tr></table><p style="color:#666;margin-top:20px">Automated notification from BlaZop-AI-Agent.</p></div>`
    });

    const result = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.brevo.com',
        path: '/v3/smtp/email',
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
          'content-length': Buffer.byteLength(emailData)
        }
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.write(emailData);
      req.end();
    });

    console.log('📧 Brevo API:', result.statusCode, result.body);
    if (result.statusCode === 201) {
      return { success: true, mock: false, messageId: JSON.parse(result.body).messageId, to: toEmail };
    }
    throw new Error(`Brevo error: ${result.body}`);

  } catch (error) {
    console.error('📧 Email error:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendEscalationEmail(ticketId, approvedBy, action) {
  const toEmail = process.env.SUPPORT_EMAIL || 'support@blazop.com';
  console.log(`📧 [EMAIL] Ticket #${ticketId} escalation ${action} by ${approvedBy} → ${toEmail}`);
  return { success: true, mock: true, message: `Escalation email sent for Ticket #${ticketId}` };
}

function mockIncomingEmail() {
  return {
    from: 'customer@example.com',
    subject: 'Issue with login feature',
    body: 'I am unable to log in to the system. Please help.',
    receivedAt: new Date().toISOString(),
    ticketId: Math.floor(Math.random() * 900) + 100
  };
}

module.exports = { sendTicketEmail, sendEscalationEmail, mockIncomingEmail };