import { useState, useEffect } from 'react'
import './App.css'
import Homepage from './views/Homepage'
import Entry from './views/Entry'
import ResetPassword from './views/ResetPassword'
import supabase from './supabaseClient'
import "@xyflow/react/dist/style.css";



export default function App() {
  const [user, setUser] = useState(null)
  const [path, setPath] = useState(window.location.pathname);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      
      // Detect password recovery event
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
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

  // Handler for when password reset is complete
  const handlePasswordResetComplete = () => {
    setIsRecoveryMode(false);
    window.history.replaceState(null, '', '/');
    setPath('/');
  };

  // If in recovery mode, show the password reset form
  if (isRecoveryMode && user) {
    return <ResetPassword supabase={supabase} onComplete={handlePasswordResetComplete} />;
  }

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