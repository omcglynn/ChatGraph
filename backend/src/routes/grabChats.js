import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/chats?graph_id=<id>
router.get('/api/chats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userClient = req.userClient;

    const graphId = req.query.graph_id;
    let query = userClient.from('chats').select('id, title, created_at, parent_id, graph_id, parent_summary');
    if (graphId) query = query.eq('graph_id', graphId);
    else query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching chats in backend:', error);
      return res.status(500).json({ error: 'Database error', details: error });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Unexpected error in /api/chats:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;

export async function getChats(session) {
  const { data, error } = await (await import('../supabaseClient.js')).default
    .from('chats')
    .select('*')
    .eq('user_id', session.user.id);

  if (error) throw error;
  return data;
}

// POST /api/chats
router.post('/api/chats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userClient = req.userClient;

    const { title = null, graph_id = null, parent_id = null, parent_summary = null, initial_message = null } = req.body || {};

    const insertObj = {
      title,
      graph_id,
      parent_id,
      parent_summary,
      user_id: userId,
    };

    const { data: chatData, error: insertErr } = await userClient
      .from('chats')
      .insert(insertObj)
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting chat in backend:', insertErr);
      return res.status(500).json({ error: 'Database error', details: insertErr });
    }

    // If an initial message was provided, create it and return both
    let messageRow = null;
    if (initial_message) {
      const { data: msgData, error: msgErr } = await userClient
        .from('messages')
        .insert({ chat_id: chatData.id, author: 'user', content: initial_message })
        .select()
        .single();
      if (msgErr) {
        console.error('Error inserting initial message:', msgErr);
      } else {
        messageRow = msgData;
      }
    }

    return res.status(201).json({ chat: chatData, initial_message: messageRow });
  } catch (err) {
    console.error('Unexpected error in POST /api/chats:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});
