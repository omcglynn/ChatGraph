// utils/aiSummarizer.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Summarize chat messages, optionally including parent summary context
 * @param {Array} messages - Array of {author, content} message objects from the chat
 * @param {string} parentSummary - Optional summary from the parent chat (for branching from branches)
 * @returns {Promise<string>} Generated summary
 */
export async function summarizeChat(messages, parentSummary = "") {
  try {
    const text = messages
      .map(m => `${m.author}: ${m.content}`)
      .join("\n");

    let prompt = `
We are creating a summary of the following chat history to provide context for a branched conversation.
Create a concise, but in depth summary that captures all main points that have been discussed.
This summary should be as understandable as possible on its own for a new AI instance, without needing to reference the full chat history.
`;

    // If there's a parent summary, include it as context
    if (parentSummary) {
      prompt += `
IMPORTANT: This chat is itself a branch from a previous conversation. Below is the summary of that previous conversation, which provides important context:
${parentSummary}

Now, here is the current chat that branched from that conversation:
`;
    }

    prompt += `
Chat:
${text}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You summarize chat history for branching purposes. When a parent summary is provided, integrate it into your summary so that all context is preserved for future branches." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
    });

    return response.choices[0].message.content;

  } catch (err) {
    console.error("Summary generation error:", err);
    return "";
  }
}
