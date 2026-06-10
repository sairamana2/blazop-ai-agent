# BlaZop-AI-Agent — Workflow Automation Agent

## What's Built

| Feature | Status | Trigger |
|---|---|---|
| AI Chatbot (original) | ✅ Working | Any @mention |
| Approval Workflow (buttons) | ✅ New | @bot approval / @bot ticket |
| Text-based Approval | ✅ New | @bot yes / @bot approve |
| Create Support Ticket | ✅ New | @bot create support ticket |
| Email Notification | ✅ New | Auto on ticket creation |
| Email → Slack (mock) | ✅ New | Set EMAIL_POLLING_ENABLED=true |
| End-to-End Demo | ✅ New | @bot demo |

---

## Folder Structure

```
slack-ai-agent/
├── app.js                          ← Main entry point (updated)
├── app.js.backup                   ← Original backup (DO NOT DELETE)
├── .env                            ← Your credentials
├── .env.example                    ← Template for new variables
├── package.json
└── skills/
    ├── slack-skills.js             ← Unified entry point for all skills
    ├── slack-approval-workflow.js  ← Block Kit buttons + action handlers
    ├── slack-intent-matcher.js     ← Text intent detection
    ├── slack-email-integration.js  ← Email sending (mock + real SMTP)
    ├── slack-list-channels.js      ← List workspace channels
    ├── slack-post-message.js       ← Post message utility
    └── slack-reply-thread.js       ← Thread reply utility
```

---

## Setup

### 1. Install new dependency
```bash
npm install nodemailer
```

### 2. Update .env
Add these to your existing .env (existing variables stay unchanged):
```
SUPPORT_EMAIL=support@blazop.com
EMAIL_POLLING_ENABLED=false
SLACK_DEFAULT_CHANNEL=your-channel-id
```

### 3. Start the bot
```bash
node app.js
```

---

## Testing Instructions

### Test 1 — Original AI Chatbot (must still work)
```
@BlaZop-AI-Agent what is machine learning?
```
Expected: Full AI response from LLaMA 3.3 70B

### Test 2 — Approval Workflow (buttons)
```
@BlaZop-AI-Agent show approval
```
Expected: Message with ✅ Approve and ❌ Reject buttons
- Click Approve → "Ticket escalated successfully."
- Click Reject → "Escalation rejected."

### Test 3 — Text-based approval
```
@BlaZop-AI-Agent yes
@BlaZop-AI-Agent approve
@BlaZop-AI-Agent no
@BlaZop-AI-Agent reject
```
Expected: Confirmation messages for each

### Test 4 — Create Support Ticket + Email
```
@BlaZop-AI-Agent create support ticket
```
Expected:
1. Ticket created message
2. Mock email log in terminal
3. Approval request with buttons

### Test 5 — End-to-End Demo
```
@BlaZop-AI-Agent demo
```
Expected: Full flow — issue created → Slack notification → approval buttons

### Test 6 — Email → Slack (mock polling)
Set in .env:
```
EMAIL_POLLING_ENABLED=true
SLACK_DEFAULT_CHANNEL=C0B97CB84AU
```
Restart bot → wait 60 seconds → check channel for incoming email notification.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| SLACK_BOT_TOKEN | ✅ Yes | Bot OAuth token |
| SLACK_SIGNING_SECRET | ✅ Yes | Slack signing secret |
| GROQ_API_KEY | ✅ Yes | Groq API key |
| SUPPORT_EMAIL | Optional | Email to receive ticket notifications |
| SMTP_HOST | Optional | SMTP server (e.g. smtp.gmail.com) |
| SMTP_PORT | Optional | SMTP port (default 587) |
| SMTP_USER | Optional | SMTP username/email |
| SMTP_PASS | Optional | SMTP password/app password |
| EMAIL_POLLING_ENABLED | Optional | true/false — enables mock polling |
| SLACK_DEFAULT_CHANNEL | Optional | Channel ID for email→Slack posts |

---

## Rollback Instructions

If anything breaks, restore the original working bot in 3 steps:

```bash
# Step 1: Replace app.js with backup
copy app.js.backup app.js

# Step 2: Restart
node app.js
```

The backup contains the exact original working code. All new features are in the /skills folder and won't affect the backup.

---

## New Slack App Scopes Required

Go to api.slack.com → BlaZop-AI-Agent → OAuth & Permissions and add:
- `chat:write` (already have)
- `channels:read` (already have)  
- `reactions:write` (new — for emoji reactions)

Then reinstall the app.
