// ============================================================
// SURVEY CONFIGURATION — Edit your questions and options here
// ============================================================

const SURVEY_CONFIG = {
  // Title shown at the top of the survey modal
  title: "Quarterly Team Survey",

  // Short message sent in the DM before the button
  intro_message: "👋 Hi! It's time for our quarterly team survey. It only takes 2 minutes — your feedback helps us improve. Click below to get started!",

  // Label on the button in the DM
  button_label: "📋 Take the Survey",

  // Message shown after the user submits
  thank_you_message: "✅ Thanks for completing the survey! Your responses have been recorded.",

  // Your 5 survey questions
  questions: [
    {
      id: "q1",
      text: "How satisfied are you with your current workload?",
      options: ["Very Satisfied", "Satisfied", "Neutral", "Unsatisfied", "Very Unsatisfied"]
    },
    {
      id: "q2",
      text: "How would you rate team communication this quarter?",
      options: ["Excellent", "Good", "Average", "Poor", "Very Poor"]
    },
    {
      id: "q3",
      text: "Do you feel supported by your manager?",
      options: ["Always", "Usually", "Sometimes", "Rarely", "Never"]
    },
    {
      id: "q4",
      text: "How likely are you to recommend this company as a great place to work?",
      options: ["Very Likely", "Likely", "Neutral", "Unlikely", "Very Unlikely"]
    },
    {
      id: "q5",
      text: "Overall, how would you rate your experience this quarter?",
      options: ["Excellent", "Good", "Average", "Poor", "Very Poor"]
    }
  ]
};

module.exports = SURVEY_CONFIG;
