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

export default router;  

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

/* ==========================
   UPDATE GRAPH  ✅ PUT /api/graphs/:id
   Updates a graph's title
========================== */
router.put('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const graphId = req.params.id;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Missing title' });
    }

    // validate token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = userData.user.id;
    const userClient = createUserClient(token);

    // Update the graph (only if it belongs to the user)
    // Also update created_at to reflect the modification time
    const { data, error } = await userClient
      .from('graphs')
      .update({ 
        title,
        created_at: new Date().toISOString()
      })
      .eq('id', graphId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      console.error('Graph update error:', error);
      if (error.code === 'PGRST116' || /No rows found/i.test(error.message)) {
        return res.status(404).json({ error: 'Graph not found' });
      }
      return res.status(500).json({ error: error.message });
    }

    // Ensure root chat stays in sync with the graph title
    let rootChat = null;
    const { data: updatedRootChat, error: rootChatError } = await userClient
      .from('chats')
      .update({ title })
      .eq('graph_id', graphId)
      .eq('parent_id', null)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (rootChatError && rootChatError.code !== 'PGRST116') {
      console.error('Root chat update error:', rootChatError);
    }

    if (updatedRootChat) {
      rootChat = updatedRootChat;
    } else if (rootChatError && rootChatError.code === 'PGRST116') {
      // No root chat exists yet; create one
      const { data: createdRootChat, error: createRootError } = await userClient
        .from('chats')
        .insert([
          {
            graph_id: graphId,
            title,
            user_id: userId,
            parent_id: null,
            parent_summary: null,
          },
        ])
        .select('*')
        .maybeSingle();

      if (createRootError) {
        console.error('Failed to create root chat during graph update:', createRootError);
      } else {
        rootChat = createdRootChat;
      }
    }

    return res.json({
      success: true,
      graph: data,
      rootChat
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/* ==========================
   DELETE GRAPH  ✅ DELETE /api/graphs/:id
   Deletes a graph and all its chats
========================== */
router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const graphId = req.params.id;

    // validate token
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = userData.user.id;
    const userClient = createUserClient(token);

    // Delete all chats in the graph first (cascade delete should handle this, but we'll do it explicitly)
    const { error: chatsError } = await userClient
      .from('chats')
      .delete()
      .eq('graph_id', graphId)
      .eq('user_id', userId);

    if (chatsError) {
      console.error('Error deleting chats:', chatsError);
      // Continue anyway - the graph delete might still work
    }

    // Delete the graph (only if it belongs to the user)
    const { error } = await userClient
      .from('graphs')
      .delete()
      .eq('id', graphId)
      .eq('user_id', userId);

    if (error) {
      console.error('Graph delete error:', error);
      if (error.code === 'PGRST116' || /No rows found/i.test(error.message)) {
        return res.status(404).json({ error: 'Graph not found' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      success: true,
      message: 'Graph deleted successfully'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

