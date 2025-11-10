// utils/aiResponse.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function aiAnswer(prompt, summary = "") {
  try {

    const systemMessage = summary
      ? `This conversation is a branch of a previous chat. Use the following summary as context:\n${summary}\n`
      : `You are a helpful assistant.`

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content;

  } catch (err) {
    console.error("AI ERROR:", err);
    return "Sorry, I could not process your request.";
  }
}
