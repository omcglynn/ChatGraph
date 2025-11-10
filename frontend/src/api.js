const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export async function fetchWithAuth(supabase, path, opts = {}) {
  try {
    if (!supabase || !supabase.auth) {
      console.error('Supabase client is not available');
      throw new Error('Supabase client is not available');
    }
    
    const { data: { session } = {} } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      console.warn('No authentication token available');
    }
    
    const headers = {
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': opts.headers?.['Content-Type'] || 'application/json',
    };
    
    return fetch(`${API_BASE}${path}`, { ...opts, headers });
  } catch (error) {
    console.error('Error in fetchWithAuth:', error);
    throw error;
  }
}

export default {
  fetchWithAuth,
};
