// utils/aiResponse.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate AI response with full conversation history and optional parent summary
 * @param {string} prompt - Current user message
 * @param {Array} conversationHistory - Array of {author: 'user'|'ai', content: string} messages from current chat
 * @param {string} parentSummary - Optional summary from parent chat (for branched conversations)
 */
export async function aiAnswer(prompt, conversationHistory = [], parentSummary = "") {
  try {
    const messages = [];

    // System message with parent summary if this is a branched chat
    if (parentSummary) {
      messages.push({
        role: "system",
        content: `You are a helpful assistant in a program called "ChatGraph", a conversation branching AI program. The user may create a branch off of this conversation at any time at which point a summary of this chat will be provided to the new assistant.
        
        This conversation is a branch of a previous chat. Use the following summary as context:\n${parentSummary}\n\n`
      });
    } else {
      messages.push({
        role: "system",
        content: `You are a helpful assistant in a program called "ChatGraph", a conversation branching AI program. The user may create a branch off of this conversation at any time at which point a summary of this chat will be provided to the new assistant.`
      });
    }

    // Add full conversation history (from current chat only, not children)
    conversationHistory.forEach((msg) => {
      if (msg.author === "user") {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.author === "ai" || msg.author === "assistant") {
        messages.push({ role: "assistant", content: msg.content });
      }
    });

    // Add current user prompt
    messages.push({ role: "user", content: prompt });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
    });

    return response.choices[0].message.content;

  } catch (err) {
    console.error("AI ERROR:", err);
    return "Sorry, I could not process your request.";
  }
}
