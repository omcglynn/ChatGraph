import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET /api/messages?chat_id=<id>
router.get('/api/messages', authMiddleware, async (req, res) => {
  try {
    const userClient = req.userClient;
    const chatId = req.query.chat_id;
    if (!chatId) return res.status(400).json({ error: 'Missing chat_id query parameter' });

    const { data, error } = await userClient
      .from('messages')
      .select('id, chat_id, author, content, created_at')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages in backend:', error);
      return res.status(500).json({ error: 'Database error', details: error });
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Unexpected error in /api/messages:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;

export async function getMessagesForChat(chatId) {
  const { data, error } = await (await import('../supabaseClient.js')).default
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

// POST /api/messages
router.post('/api/messages', authMiddleware, async (req, res) => {
  try {
    const userClient = req.userClient;
    const { chat_id, author = 'user', content } = req.body || {};
    if (!chat_id || !content) return res.status(400).json({ error: 'Missing chat_id or content' });

    const { data, error } = await userClient
      .from('messages')
      .insert({ chat_id, author, content })
      .select()
      .single();

    if (error) {
      console.error('Error inserting message in backend:', error);
      return res.status(500).json({ error: 'Database error', details: error });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error('Unexpected error in POST /api/messages:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});
