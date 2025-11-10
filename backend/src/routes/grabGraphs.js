import express from 'express';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.get('/api/graphs', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userClient = req.userClient;

        const { data, error } = await userClient
            .from('graphs')
            .select('id, title, created_at')
            .eq('user_id', userId);

        if (error) {
            console.error('Error fetching graphs in backend:', error);
            return res.status(500).json({ error: 'Database error', details: error });
        }

        return res.json(data);
    } catch (err) {
        console.error('Unexpected error in /api/graphs:', err);
        return res.status(500).json({ error: err.message || String(err) });
    }
});

export default router;

export async function getGraphs(session){
    const { data, error } = await (await import('../supabaseClient.js')).default
        .from('graphs')
        .select('*')
        .eq('user_id', session.user.id);

    if (error) throw error;
    return data;
}

// POST /api/graphs
router.post('/api/graphs', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const userClient = req.userClient;
        const { title = null } = req.body || {};

        const { data, error } = await userClient
            .from('graphs')
            .insert({ title, user_id: userId })
            .select()
            .single();

        if (error) {
            console.error('Error inserting graph in backend:', error);
            return res.status(500).json({ error: 'Database error', details: error });
        }

        return res.status(201).json(data);
    } catch (err) {
        console.error('Unexpected error in POST /api/graphs:', err);
        return res.status(500).json({ error: err.message || String(err) });
    }
});