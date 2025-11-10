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
	  let parentHistory = [];
	  let parentSummary = "";
  
	  if (parentId) {
		// Fetch messages from parent chat
		const { data: messages, error: msgError } = await userClient
		  .from("messages")
		  .select("author, content, created_at")
		  .eq("chat_id", parentId)
		  .order("created_at", { ascending: true });
  
		if (msgError) {
		  console.error("❌ Error fetching parent messages:", msgError);
		  return res.status(500).json({ error: "Failed to fetch parent messages" });
		}
  
		parentHistory = messages || [];
  
		// ✅ Very simple summary — you can replace later with better AI summary
		parentSummary = messages
		  .slice(-5)
		  .map((m) => `${m.author}: ${m.content}`)
		  .join("\n");
	  }
  
	  // ✅ Insert with parentHistory if branching
	  const { data, error } = await userClient
		.from("chats")
		.insert([
		  {
			graph_id: graphId,
			title,
			user_id: userId,
			parent_id: parentId || null,
			parent_history: parentHistory,
			parent_summary: parentSummary,
		  },
		])
		.select("*");
  
	  if (error) return res.status(500).json({ error: error.message });
  
	  res.json({
		success: true,
		chat: data[0],
	  });
	} catch (err) {
	  res.status(500).json({ error: err.message });
	}
  });
  
export default router;
