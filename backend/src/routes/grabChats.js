import express from "express";
import { supabase, createUserClient } from "../supabaseClient.js";

const router = express.Router();

// ✅ POST /api/chats
// Creates a new chat, optionally as a branch from a parent chat
// Body: { graphId, title, parentId? }
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

	  // ✅ If this is a branched chat, create AI summary
	  let parentSummary = "";

	  if (parentId) {
		// Fetch parent chat to get its parent_summary (if it's also a branch)
		const { data: parentChat, error: parentChatError } = await userClient
		  .from("chats")
		  .select("parent_summary")
		  .eq("id", parentId)
		  .single();

		if (parentChatError) {
		  console.error("❌ Error fetching parent chat:", parentChatError);
		  return res.status(500).json({ error: "Failed to fetch parent chat" });
		}

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

		// Get the parent's parent_summary (inherited context from grandparent)
		const parentParentSummary = parentChat?.parent_summary || "";

		// If parent has messages, create a new summary that includes both messages and inherited context
		if (messages && messages.length > 0) {
		  const { summarizeChat } = await import("../utils/aiSummarizer.js");
		  parentSummary = await summarizeChat(messages, parentParentSummary);
		} else {
		  // If parent has no messages but has inherited context, pass that context along
		  // This ensures branches from empty branches still maintain context chain
		  parentSummary = parentParentSummary;
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

	  if (error) return res.status(500).json({ error: error.message });

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

/* PUT /api/chats/:id
   Updates a chat's title
*/
router.put("/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const chatId = req.params.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Missing title" });
    }

    // Validate token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: "Invalid token" });

    const userId = userData.user.id;
    const userClient = createUserClient(token);

    // First, get the chat to find its graph_id
    const { data: chatData, error: fetchError } = await userClient
      .from("chats")
      .select("graph_id")
      .eq("id", chatId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116" || /No rows found/i.test(fetchError.message)) {
        return res.status(404).json({ error: "Chat not found" });
      }
      return res.status(500).json({ error: fetchError.message });
    }

    // Update the chat (only if it belongs to the user)
    const { data, error } = await userClient
      .from("chats")
      .update({ title })
      .eq("id", chatId)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      console.error("Chat update error:", error);
      if (error.code === "PGRST116" || /No rows found/i.test(error.message)) {
        return res.status(404).json({ error: "Chat not found" });
      }
      return res.status(500).json({ error: error.message });
    }

    // Update the graph's created_at to reflect the modification
    if (chatData?.graph_id) {
      await userClient
        .from("graphs")
        .update({ created_at: new Date().toISOString() })
        .eq("id", chatData.graph_id)
        .eq("user_id", userId);
    }

    return res.json({
      success: true,
      chat: data
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* DELETE /api/chats/:id
   Deletes a chat, all its messages, and recursively deletes all child chats
*/
router.delete("/:id", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const chatId = req.params.id;

    // Validate token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: "Invalid token" });

    const userId = userData.user.id;
    const userClient = createUserClient(token);

    // Recursive function to delete a chat and all its children
    const deleteChatRecursive = async (id) => {
      // First, find all children of this chat
      const { data: children, error: childrenError } = await userClient
        .from("chats")
        .select("id")
        .eq("parent_id", id)
        .eq("user_id", userId);

      if (childrenError) {
        console.error("Error fetching children:", childrenError);
      }

      // Recursively delete all children first
      if (children && children.length > 0) {
        for (const child of children) {
          await deleteChatRecursive(child.id);
        }
      }

      // Delete all messages in this chat
      const { error: messagesError } = await userClient
        .from("messages")
        .delete()
        .eq("chat_id", id);

      if (messagesError) {
        console.error("Error deleting messages:", messagesError);
      }

      // Delete the chat itself
      const { error } = await userClient
        .from("chats")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Chat delete error:", error);
        throw error;
      }
    };

    // Verify the chat exists and belongs to the user before deleting
    // Also get graph_id to update the graph timestamp
    const { data: chat, error: fetchError } = await userClient
      .from("chats")
      .select("id, graph_id")
      .eq("id", chatId)
      .eq("user_id", userId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116" || /No rows found/i.test(fetchError.message)) {
        return res.status(404).json({ error: "Chat not found" });
      }
      return res.status(500).json({ error: fetchError.message });
    }

    // Delete the chat and all its descendants
    await deleteChatRecursive(chatId);

    // Update the graph's created_at to reflect the modification
    if (chat?.graph_id) {
      await userClient
        .from("graphs")
        .update({ created_at: new Date().toISOString() })
        .eq("id", chat.graph_id)
        .eq("user_id", userId);
    }

    return res.json({
      success: true,
      message: "Chat and all children deleted successfully"
    });
  } catch (err) {
    console.error("Error in delete chat:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
