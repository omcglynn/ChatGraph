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
Summarize the following chat in 4-6 concise bullet points.
Do NOT include personal details or redundant details.
Focus only on the essential context needed to continue in a new direction.

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
