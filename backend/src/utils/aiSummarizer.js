// utils/aiSummarizer.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function summarizeChat(messages) {
  try {
    const text = messages
      .map(m => `${m.author}: ${m.content}`)
      .join("\n");

    const prompt = `
We are creating a summary of the following chat history to provide context for a branched conversation.
Create a concise, but in depth summary that captures all main points that have been discussed.
This summary should be as understandable as possible on its own for a new AI instance, without needing to reference the full chat history.

Chat:
${text}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You summarize chat history for branching purposes." },
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
