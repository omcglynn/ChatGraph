const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export async function fetchWithAuth(sb, path, options = {}) {
    const { data: { session }, error } = await sb.auth.getSession();
    if (error) {
        throw new Error('Failed to get session: ' + error.message);
    }
    const token = session?.access_token;
    if (!token) console.warn("No token found in session");
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    }
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });


    // Return the Response object instead of calling .json()
    // This allows the caller to check res.ok and handle errors appropriately
    return response;
}

export default {
  fetchWithAuth,
};
