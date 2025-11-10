const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export async function fetchWithAuth(supabase, path, opts = {}) {
  const { data: { session } = {} } = await supabase.auth.getSession();
  const token = session?.access_token;
  const headers = { ...(opts.headers || {}), Authorization: token ? `Bearer ${token}` : '' };
  return fetch(`${API_BASE}${path}`, { ...opts, headers });
}

export default {
  fetchWithAuth,
};
