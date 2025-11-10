import express from "express";
import { supabase, createUserClient } from "../supabaseClient.js";

const router = express.Router();

// ✅ POST /api/chats
// ✅ POST /api/chats (Supports Branching)
router.post("/", async (req, res) => {
	try {
	  const authHeader = req.headers.authorization;
	  if (!authHeader?.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" });
	  }
  
	  const token = authHeader.split(" ")[1];
	  const { graphId, title, parentId } = req.body;
  
	  if (!graphId || !title) {
		return res.status(400).json({ error: "Missing graphId or title" });
	  }
  
	  // Validate token
	  const { data: userData, error: userError } = await supabase.auth.getUser(token);
	  if (userError || !userData?.user) return res.status(401).json({ error: "Invalid token" });
  
	  const userId = userData.user.id;
	  const userClient = createUserClient(token);
  
	  // ✅ If this is a branched chat, gather history
	  let parentSummary = "";
  
	  if (parentId) {
		// Fetch messages from parent chat
		const { data: messages, error: msgError } = await userClient
		  .from("messages")
		  .select("author, content")
		  .eq("chat_id", parentId)
		  .order("created_at", { ascending: true });

		if (msgError) {
		  console.error("❌ Error fetching parent messages:", msgError);
		  return res.status(500).json({ error: "Failed to fetch parent messages" });
		}

		// Use AI summarizer to create a summary of parent chat
		if (messages && messages.length > 0) {
		  const { summarizeChat } = await import("../utils/aiSummarizer.js");
		  parentSummary = await summarizeChat(messages);
		}
	  }

  
	  // ✅ Insert chat with parent_summary if branching
	  const { data, error } = await userClient
		.from("chats")
		.insert([
		  {
			graph_id: graphId,
			title,
			user_id: userId,
			parent_id: parentId || null,
			parent_summary: parentSummary || null,
		  },
		])
		.select("*");
  
	  // Update the graph's created_at to reflect the modification
	  await userClient
		.from("graphs")
		.update({ created_at: new Date().toISOString() })
		.eq("id", graphId)
		.eq("user_id", userId);
  
	  res.json({
		success: true,
		chat: data[0],
	  });
	} catch (err) {
	  res.status(500).json({ error: err.message });
	}
  });

  /* GET /api/chats/:id
   - If the :id has chats where graph_id = :id -> return array of chats for that graph
   - Else try to return a single chat by id
*/
router.get("/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const id = req.params.id;

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: "Invalid token" });

    const userClient = createUserClient(token);

    // First: check for chats that belong to a graph with id === :id
    const { data: chatsForGraph, error: graphErr } = await userClient
      .from("chats")
      .select("*")
      .eq("graph_id", id)
      .order("created_at", { ascending: false });

    if (graphErr) {
      console.error("Error checking chats by graph_id:", graphErr);
      return res.status(500).json({ error: graphErr.message });
    }

    // If we found chats (even if empty array), return them
    // This handles the case where a graph exists but has no chats
    if (Array.isArray(chatsForGraph)) {
      return res.json(chatsForGraph);
    }

    // If the above didn't return, try treating :id as a chat id
    // This handles direct chat access (e.g., /api/chats/chat-id-here)
    const { data: singleChat, error: chatErr } = await userClient
      .from("chats")
      .select("*")
      .eq("id", id)
      .single();

    if (chatErr) {
      // If not found, return 404 to be explicit
      if (chatErr.code === "PGRST116" || /No rows found/i.test(chatErr.message)) {
        return res.status(404).json({ error: "Chat or graph not found" });
      }
      console.error("Error fetching chat by id:", chatErr);
      return res.status(500).json({ error: chatErr.message });
    }

    return res.json(singleChat || null);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* GET /api/chats/:id
   - If the :id has chats where graph_id = :id -> return array of chats for that graph
   - Else try to return a single chat by id
*/
router.get("/:id", async (req, res) => {
	try {
	  const authHeader = req.headers.authorization;
	  if (!authHeader?.startsWith("Bearer ")) {
		return res.status(401).json({ error: "Unauthorized" });
	  }
  
	  const token = authHeader.split(" ")[1];
	  const id = req.params.id;
  
	  const { data: userData, error: userError } = await supabase.auth.getUser(token);
	  if (userError || !userData?.user) return res.status(401).json({ error: "Invalid token" });
  
	  const userClient = createUserClient(token);
  
	  // First: check for chats that belong to a graph with id === :id
	  const { data: chatsForGraph, error: graphErr } = await userClient
		.from("chats")
		.select("*")
		.eq("graph_id", id)
		.order("created_at", { ascending: false });
  
	  if (graphErr) {
		console.error("Error checking chats by graph_id:", graphErr);
		return res.status(500).json({ error: graphErr.message });
	  }
  
	  // If we found chats (even if empty array), return them
	  // This handles the case where a graph exists but has no chats
	  if (Array.isArray(chatsForGraph)) {
		return res.json(chatsForGraph);
	  }
  
	  // If the above didn't return, try treating :id as a chat id
	  // This handles direct chat access (e.g., /api/chats/chat-id-here)
	  const { data: singleChat, error: chatErr } = await userClient
		.from("chats")
		.select("*")
		.eq("id", id)
		.single();
  
	  if (chatErr) {
		// If not found, return 404 to be explicit
		if (chatErr.code === "PGRST116" || /No rows found/i.test(chatErr.message)) {
		  return res.status(404).json({ error: "Chat or graph not found" });
		}
		console.error("Error fetching chat by id:", chatErr);
		return res.status(500).json({ error: chatErr.message });
	  }
  
	  return res.json(singleChat || null);
	} catch (err) {
	  return res.status(500).json({ error: err.message });
	}
  });
  
export default router;
