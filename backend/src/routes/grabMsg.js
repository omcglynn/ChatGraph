// inside routes/messages.js
import express from "express";
import { supabase, createUserClient } from "../supabaseClient.js";
import { aiAnswer } from "../utils/aiResponse.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const { chatId, content } = req.body;

    if (!chatId || !content) return res.status(400).json({ error: "Missing chatId or content" });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: "Invalid token" });

    const userClient = createUserClient(token);

    // Get parent summary, graph_id, and full conversation history
    const { data: chatInfo, error: chatError } = await userClient
      .from("chats")
      .select("parent_summary, graph_id")
      .eq("id", chatId)
      .single();

    if (chatError) return res.status(500).json({ error: chatError.message });

    const parentSummary = chatInfo?.parent_summary || "";
    const graphId = chatInfo?.graph_id;

    // Fetch full conversation history from current chat (all previous messages)
    // Note: We fetch before inserting the new message, so this contains only previous messages
    const { data: conversationHistory, error: historyError } = await userClient
      .from("messages")
      .select("author, content")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (historyError) {
      console.error("Error fetching conversation history:", historyError);
      // Continue without history if fetch fails
    }

    // Insert USER message
    const { data: userMessage, error: msgError } = await userClient
      .from("messages")
      .insert({
        chat_id: chatId,
        content,
        author: "user"
      })
      .select("*")
      .single();

    if (msgError) return res.status(500).json({ error: msgError.message });

    // AI answer with system prompt + summary
    const aiText = await aiAnswer(content, systemContext);

    // Insert AI reply
    await userClient
      .from("messages")
      .insert({
        chat_id: chatId,
        content: aiText,
        author: "ai"
      });

      return res.json({
        success: true,
        userMessage,
        aiMessage: aiText,
        contextUsed: {
          parentSummary: systemContext
        }
      });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* GET /api/messages/:chatId
   - Returns all messages for the specified chatId, ordered ascending by created_at
*/
router.get("/:chatId", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const chatId = req.params.chatId;

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: "Invalid token" });

    const userClient = createUserClient(token);

    const { data, error } = await userClient
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;