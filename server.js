// ============================================================
// server.js — Always-on server hosted on Render (free tier)
// Receives Slack button clicks, opens modal, saves to Sheets
// ============================================================

const express = require("express");
const crypto = require("crypto");
const { WebClient } = require("@slack/web-api");
const { google } = require("googleapis");
const SURVEY_CONFIG = require("./survey_config");

const app = express();
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// ============================================================
// Middleware — parse raw body for Slack signature verification
// ============================================================
app.use(
  express.urlencoded({
    extended: true,
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    }
  })
);
app.use(express.json());

// ============================================================
// Slack Signature Verification — keeps your endpoint secure
// ============================================================
function verifySlackSignature(req) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const timestamp = req.headers["x-slack-request-timestamp"];
  const slackSignature = req.headers["x-slack-signature"];

  // Reject requests older than 5 minutes
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false;

  const baseString = `v0:${timestamp}:${req.rawBody}`;
  const hmac = crypto.createHmac("sha256", signingSecret);
  hmac.update(baseString);
  const mySignature = `v0=${hmac.digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(slackSignature)
  );
}

// ============================================================
// Build the Survey Modal — shown when user clicks the button
// ============================================================
function buildSurveyModal() {
  return {
    type: "modal",
    callback_id: "survey_submission",
    title: { type: "plain_text", text: SURVEY_CONFIG.title },
    submit: { type: "plain_text", text: "Submit" },
    close: { type: "plain_text", text: "Cancel" },
    blocks: SURVEY_CONFIG.questions.map((q) => ({
      type: "input",
      block_id: q.id,
      label: { type: "plain_text", text: q.text, emoji: true },
      element: {
        type: "static_select",
        action_id: "answer",
        placeholder: { type: "plain_text", text: "Select an option" },
        options: q.options.map((opt) => ({
          text: { type: "plain_text", text: opt },
          value: opt
        }))
      }
    }))
  };
}

// ============================================================
// Google Sheets — append a row of survey responses
// ============================================================
async function appendToGoogleSheets(userName, userId, answers) {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
  });

  const sheets = google.sheets({ version: "v4", auth });

  const timestamp = new Date().toISOString();

  // Build the row: timestamp, user name, user ID, then one column per answer
  const row = [
    timestamp,
    userName,
    userId,
    ...SURVEY_CONFIG.questions.map(
      (q) => answers[q.id]?.answer?.selected_option?.value || ""
    )
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: "Sheet1!A1",
    valueInputOption: "RAW",
    requestBody: { values: [row] }
  });

  console.log(`📊 Saved response from ${userName} to Google Sheets`);
}

// ============================================================
// POST /slack/interactions — main Slack interaction handler
// ============================================================
app.post("/slack/interactions", async (req, res) => {
  // Verify the request is from Slack
  if (!verifySlackSignature(req)) {
    return res.status(401).send("Unauthorized");
  }

  const payload = JSON.parse(req.body.payload);

  // ── User clicked the "Take Survey" button ──
  if (
    payload.type === "block_actions" &&
    payload.actions?.[0]?.action_id === "open_survey_modal"
  ) {
    // Acknowledge immediately (Slack requires response within 3 seconds)
    res.sendStatus(200);

    try {
      await slack.views.open({
        trigger_id: payload.trigger_id,
        view: buildSurveyModal()
      });
    } catch (err) {
      console.error("Failed to open modal:", err.message);
    }

    return;
  }

  // ── User submitted the survey modal ──
  if (
    payload.type === "view_submission" &&
    payload.view?.callback_id === "survey_submission"
  ) {
    // Acknowledge the submission immediately
    res.json({ response_action: "clear" });

    try {
      const userName = payload.user.name;
      const userId = payload.user.id;
      const answers = payload.view.state.values;

      await appendToGoogleSheets(userName, userId, answers);

      // Send a thank-you DM
      const dm = await slack.conversations.open({ users: userId });
      await slack.chat.postMessage({
        channel: dm.channel.id,
        text: SURVEY_CONFIG.thank_you_message
      });
    } catch (err) {
      console.error("Failed to process submission:", err.message);
    }

    return;
  }

  // Default acknowledgement for any other interactions
  res.sendStatus(200);
});

// ============================================================
// Health check endpoint — Render uses this to verify the server
// ============================================================
app.get("/", (req, res) => {
  res.send("✅ Slack Survey Server is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
