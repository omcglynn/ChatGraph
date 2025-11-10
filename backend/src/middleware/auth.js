import supabase, { createUserClient } from '../supabaseClient.js';

// Auth middleware: validates Bearer token, attaches user and userClient to req
export default async function authMiddleware(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    const token = auth.split(' ')[1];

    const { data: userData, error: getUserError } = await supabase.auth.getUser(token);
    if (getUserError || !userData?.user) return res.status(401).json({ error: 'Invalid token' });

    req.user = userData.user;
    req.userClient = createUserClient(token);
    return next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
}
