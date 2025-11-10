import { createUserClient, supabase } from "../supabaseClient.js";

export async function getMessages(req, res) {
  try {
    console.log("✅ /api/messages/:graphId HIT");

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const graphId = req.params.graphId;
    const userClient = createUserClient(token);

    const { data, error } = await userClient
      .from("messages")
      .select("*")
      .eq("graph_id", graphId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error fetching messages:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (err) {
    console.error("❌ Unexpected error in getMessages:", err);
    res.status(500).json({ error: err.message });
  }
}
