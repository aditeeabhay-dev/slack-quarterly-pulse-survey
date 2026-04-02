// ============================================================
// send_survey.js — Run by GitHub Actions every 3 months
// Fetches all Slack workspace members and DMs each one
// ============================================================

const { WebClient } = require("@slack/web-api");
const SURVEY_CONFIG = require("./survey_config");

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

async function getAllUsers() {
  const users = [];
  let cursor;

  do {
    const response = await slack.users.list({ cursor, limit: 200 });

    for (const member of response.members) {
      // Skip bots, deactivated users, and the Slackbot
      if (!member.is_bot && !member.deleted && member.id !== "USLACKBOT") {
        users.push(member);
      }
    }

    cursor = response.response_metadata?.next_cursor;
  } while (cursor);

  return users;
}

async function sendSurveyDM(userId) {
  // Open a DM channel with the user
  const dm = await slack.conversations.open({ users: userId });
  const channelId = dm.channel.id;

  // Send the DM with an intro message and a "Take Survey" button
  await slack.chat.postMessage({
    channel: channelId,
    text: SURVEY_CONFIG.intro_message,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: SURVEY_CONFIG.intro_message
        }
      },
      {
        type: "actions",
        block_id: "survey_trigger",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: SURVEY_CONFIG.button_label,
              emoji: true
            },
            style: "primary",
            action_id: "open_survey_modal",
            value: "open_survey"
          }
        ]
      }
    ]
  });
}

async function main() {
  console.log("🚀 Starting quarterly survey send...");

  const users = await getAllUsers();
  console.log(`📋 Found ${users.length} users to message`);

  let successCount = 0;
  let failCount = 0;

  for (const user of users) {
    try {
      await sendSurveyDM(user.id);
      console.log(`✅ Sent to @${user.name}`);
      successCount++;

      // Small delay to avoid hitting Slack rate limits
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`❌ Failed to send to @${user.name}: ${err.message}`);
      failCount++;
    }
  }

  console.log(`\n📊 Done! ${successCount} sent, ${failCount} failed.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
