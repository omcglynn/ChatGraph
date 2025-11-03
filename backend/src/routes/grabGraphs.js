import express from 'express';
import supabase, {createUserClient} from "../supabaseClient.js";

const router = express.Router();

router.get('/api/graphs', async (req, res) => {
    try {
        const auth = req.headers.authorization || '';
        if(!auth.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const token = auth.split(' ')[1];

        const { data: userData, error: getUserError } = await supabase.auth.getUser(token);
        if (getUserError || !userData?.user) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        const userId = userData.user.id;

        const userClient = createUserClient(token);
        
        const { data, error } = await userClient
            .from('graphs')
            .select('id, title, created_at')
            .eq('user_id', userId);
        
        userClient.auth.signOut; // cleanup
        if (error) {
            console.error('Error fetching graphs in backend:', error);
            return res.status(500).json({ error: 'Database error', details: error });
        }
        console.log(res.json(data))
        return res.json(data);
    } catch (err) {
        console.error('Unexpected error in /api/graphs:', err);
        return res.status(500).json({ error: err.message || String(err) });
    }
});

export default router;

export async function getGraphs(session){
    const { data, error } = await supabase
        .from('graphs')
        .select('*')
        .eq('user_id', session.user.id);

    if (error) throw error;
    return data;
}