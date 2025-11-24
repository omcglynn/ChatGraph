import { useState, useEffect } from 'react'
import './App.css'
import Homepage from './views/Homepage'
import Entry from './views/Entry'
import supabase from './supabaseClient'
import "@xyflow/react/dist/style.css";



export default function App() {
  const [user, setUser] = useState(null)
  const [path, setPath] = useState(window.location.pathname);

  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Listen for URL changes
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);

    // Check initial path
    setPath(window.location.pathname);

    return () => {
      data?.subscription?.unsubscribe?.();
      window.removeEventListener('popstate', handlePopState);
    };

  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Navigate to login page after logout
    window.history.pushState(null, '', '/login');
    setPath('/login');
  };

  // Check if we're on the /login route
  const isLoginRoute = path === '/login' || path === '/login/';

  // If on /login route or not logged in, show the Entry (login) view
  if (isLoginRoute || !user) {
    // If user is logged in but on /login, redirect to home
    if (user && isLoginRoute) {
      window.history.replaceState(null, '', '/');
      setPath('/');
      return (
        <div className="App">
          <Homepage supabase={supabase} user={user} onLogout={handleLogout} />
        </div>
      );
    }
    return <Entry supabase={supabase} />;
  }

  // When logged in, show the Homepage
  return (
    <div className="App">
      <Homepage supabase={supabase} user={user} onLogout={handleLogout} />
    </div>
  );


}