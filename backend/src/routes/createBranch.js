// routes/createBranch.js

import express from "express";
import { supabase, createUserClient } from "../supabaseClient.js";
import { summarizeChat } from "../utils/aiSummarizer.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const { parentChatId, graphId, title } = req.body;

    if (!parentChatId || !graphId || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Validate token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: "Invalid token" });
    const userId = userData.user.id;

    const userClient = createUserClient(token);

    // Load parent messages
    const { data: parentMessages, error: msgError } = await userClient
      .from("messages")
      .select("author, content")
      .eq("chat_id", parentChatId)
      .order("created_at", { ascending: true });

    if (msgError) return res.status(500).json({ error: msgError.message });

    // Create summary
    const summary = await summarizeChat(parentMessages);

    // Insert new branch
    const { data: newChat, error: insertError } = await userClient
      .from("chats")
      .insert({
        graph_id: graphId,
        user_id: userId,
        title,
        parent_id: parentChatId,
        parent_summary: summary
      })
      .select("*")
      .single();

    if (insertError) return res.status(500).json({ error: insertError.message });

    return res.json({
      success: true,
      newChat,
      summaryUsed: summary
    });

  } catch (err) {
    console.error("Branch creation error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
