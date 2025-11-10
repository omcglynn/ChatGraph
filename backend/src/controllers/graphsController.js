import { createUserClient } from "../supabaseClient.js";

export async function getGraphs(req, res) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const userClient = createUserClient(token);

  const { data, error } = await userClient
    .from("graphs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

export async function createGraph(req, res) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const userClient = createUserClient(token);
  const { title } = req.body;

  const { data, error } = await userClient
    .from("graphs")
    .insert([{ title }])
    .select();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
}
