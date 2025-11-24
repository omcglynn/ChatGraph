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

    // Fetch parent chat to get its parent_summary (if it's also a branch)
    const { data: parentChat, error: parentChatError } = await userClient
      .from("chats")
      .select("parent_summary")
      .eq("id", parentChatId)
      .single();

    if (parentChatError) {
      console.error("Error fetching parent chat:", parentChatError);
      return res.status(500).json({ error: "Failed to fetch parent chat" });
    }

    // Load parent messages
    const { data: parentMessages, error: msgError } = await userClient
      .from("messages")
      .select("author, content")
      .eq("chat_id", parentChatId)
      .order("created_at", { ascending: true });

    if (msgError) return res.status(500).json({ error: msgError.message });

    // Get the parent's parent_summary (inherited context from grandparent)
    const parentParentSummary = parentChat?.parent_summary || "";

    // Create summary, including parent's parent_summary for full context chain
    let summary = "";
    if (parentMessages && parentMessages.length > 0) {
      summary = await summarizeChat(parentMessages, parentParentSummary);
    } else {
      // If parent has no messages but has inherited context, pass that context along
      // This ensures branches from empty branches still maintain context chain
      summary = parentParentSummary;
    }

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
