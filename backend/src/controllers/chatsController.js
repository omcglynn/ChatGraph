import { supabase, createUserClient } from "../supabaseClient.js";

export async function getChats(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const userClient = createUserClient(token);
    const graphId = req.params.graphId;

    const { data, error } = await userClient
      .from("chats")
      .select("id, title, created_at, parent_id, branch_point_message_id")
      .eq("graph_id", graphId)
      .order("created_at", { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createChat(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const userClient = createUserClient(token);

    const { graphId, title, parent_id, branch_point_message_id } = req.body;

    const { data, error } = await userClient
      .from("chats")
      .insert([
        {
          graph_id: graphId,
          title,
          parent_id,
          branch_point_message_id,
        },
      ])
      .select();

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ success: true, newChat: data[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function updateChat(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const userClient = createUserClient(token);
    const chatId = req.params.chatId;
    const { title } = req.body;

    const { data, error } = await userClient
      .from("chats")
      .update({ title })
      .eq("id", chatId)
      .select();

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ success: true, updated: data[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function deleteChat(req, res) {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const userClient = createUserClient(token);
    const chatId = req.params.chatId;

    const { error } = await userClient.from("chats").delete().eq("id", chatId);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
