# 📋 Slack Quarterly Survey Bot

A fully automated quarterly survey system that:
- **DMs every Slack user** a survey button every 3 months via GitHub Actions
- **Opens a clean modal** inside Slack with all 5 questions
- **Saves every response** to Google Sheets in real time
- **Sends a thank-you DM** after each submission

---

## 🏗️ Architecture

```
GitHub Actions (every 3 months)
    → send_survey.js DMs all users a button

User clicks button
    → Slack sends click to Render server (server.js)
    → Server opens a modal with 5 questions

User submits modal
    → Server writes answers to Google Sheets
    → Server sends thank-you DM
```

---

## 🚀 Setup Guide (one time)

### Step 1 — Create a Slack App

1. Go to https://api.slack.com/apps and click **Create New App → From Scratch**
2. Name it (e.g. "Quarterly Survey") and select your workspace
3. Go to **OAuth & Permissions** → add these Bot Token Scopes:
   - `users:read`
   - `im:write`
   - `chat:write`
   - `views:open`
4. Click **Install to Workspace** and copy the **Bot User OAuth Token** (starts with `xoxb-`)
5. Go to **Basic Information** → copy the **Signing Secret**
6. Go to **Interactivity & Shortcuts** → toggle ON → set Request URL to:
   ```
   https://YOUR-RENDER-APP.onrender.com/slack/interactions
   ```
   *(You'll fill this in after Step 3)*

---

### Step 2 — Set up Google Sheets

1. Create a new Google Sheet at https://sheets.google.com
2. In the first row, add these headers:
   ```
   Timestamp | Username | User ID | Q1 | Q2 | Q3 | Q4 | Q5
   ```
3. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS-PART-HERE/edit
   ```
4. Go to https://console.cloud.google.com
5. Create a new project → Enable **Google Sheets API**
6. Go to **IAM & Admin → Service Accounts** → Create a service account
7. Click the service account → **Keys → Add Key → JSON** → download the file
8. Open your Google Sheet → **Share** → paste the service account email → give Editor access

---

### Step 3 — Deploy to Render (free server)

1. Push this repo to GitHub
2. Go to https://render.com and sign up (free)
3. Click **New → Web Service** → connect your GitHub repo
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free
5. Add these **Environment Variables** in Render:
   | Key | Value |
   |-----|-------|
   | `SLACK_BOT_TOKEN` | `xoxb-your-token-here` |
   | `SLACK_SIGNING_SECRET` | Your Slack signing secret |
   | `GOOGLE_SHEET_ID` | Your Google Sheet ID |
   | `GOOGLE_SERVICE_ACCOUNT_JSON` | Paste the full contents of the JSON key file |
6. Deploy — copy the Render URL (e.g. `https://my-survey.onrender.com`)
7. Go back to your Slack App → **Interactivity & Shortcuts** → paste:
   ```
   https://my-survey.onrender.com/slack/interactions
   ```

---

### Step 4 — Set up GitHub Actions

1. In your GitHub repo, go to **Settings → Secrets and variables → Actions**
2. Add this secret:
   | Name | Value |
   |------|-------|
   | `SLACK_BOT_TOKEN` | `xoxb-your-token-here` |

---

### Step 5 — Customize your survey

Open `survey_config.js` and edit:
- The 5 questions and their answer options
- The intro message sent in the DM
- The thank-you message after submission

---

## 🧪 Testing

To test before the first quarterly send, go to your GitHub repo → **Actions → Send Quarterly Survey → Run workflow**.

This will DM all users immediately — great for a dry run!

---

## 📅 Schedule

The survey sends automatically at **9:00 AM UTC** on:
- January 1
- April 1
- July 1
- October 1

To change the schedule, edit the `cron` line in `.github/workflows/survey.yml`.

---

## 📊 Google Sheet Output

Each submission adds one row:

| Timestamp | Username | User ID | Q1 Answer | Q2 Answer | Q3 Answer | Q4 Answer | Q5 Answer |
|-----------|----------|---------|-----------|-----------|-----------|-----------|-----------|
| 2026-04-01T09:03:11Z | john.doe | U12345 | Satisfied | Good | Always | Likely | Excellent |
