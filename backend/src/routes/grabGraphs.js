import express from 'express';
import { supabase, createUserClient } from '../supabaseClient.js';

const router = express.Router();

/* ==========================
   CREATE NEW GRAPH  ✅ POST /api/graphs
========================== */
router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    // validate token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = userData.user.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Missing title' });
    }

    const userClient = createUserClient(token);

    const { data, error } = await userClient
      .from('graphs')
      .insert([
        {
          title,
          user_id: userId
        }
      ])
      .select('*'); // return row

    if (error) {
      console.error('Graph insert error:', error);
      return res.status(500).json({ error: error.message });
    }


    const graph = data[0];

    // Automatically create a root chat for this graph
    const { data: rootChatData, error: rootChatError } = await userClient
      .from('chats')
      .insert([
        {
          graph_id: graph.id,
          title,
          user_id: userId,
          parent_id: null,
          parent_summary: null,
        },
      ])
      .select('*')
      .maybeSingle();

    if (rootChatError) {
      console.error('Root chat insert error:', rootChatError);
      // Attempt to clean up the graph if root chat creation fails
      await userClient.from('graphs').delete().eq('id', graph.id).eq('user_id', userId);
      return res.status(500).json({ error: rootChatError.message });
    }

    return res.json({
      success: true,
      graph,
      rootChat: rootChatData,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ==========================
   LIST GRAPHS  ✅ GET /api/graphs
   Returns an array of graphs for the authenticated user
========================== */
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid token' });

    const userId = userData.user.id;
    const userClient = createUserClient(token);

    const { data, error } = await userClient
      .from('graphs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching graphs:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json(data || []);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
