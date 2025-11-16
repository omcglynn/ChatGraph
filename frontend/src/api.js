const API_BASE_URL= import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export async function fetchData(sb,path,options={}) {
    const {data :{session},error} = await sb.auth.getSession();
    if (error) {
        throw new Error('Failed to get session: ' + error.message);
    }
    const token = session?.access_token;
    if(!token) console.warn("No token found in session");
    const headers ={
        "Content-Type": "application/json",
        ...(options.headers || {}), 
    }
    if(token) headers["Authorization"] =`Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
    });

    if(!response.ok){
        throw new Error(await response.text()||"API request failed")
    }
    return response.json();


}
