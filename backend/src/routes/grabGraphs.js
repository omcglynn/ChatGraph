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

    return res.json({
      success: true,
      graph: data[0]
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
