import React, { useState, useEffect } from "react";
import "./styles/index.css";
import Homepage from "./views/Homepage";
import Entry from "./views/Entry";
import supabase from "./supabaseClient";
import "@xyflow/react/dist/style.css";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // initial user load
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    // listen for auth state changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // cleanup - unsubscribe safely
    return () => data?.subscription?.unsubscribe?.();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // If not logged in, show the Entry (login) view
  if (!user) {
    return <Entry supabase={supabase} />;
  }

  // When logged in, show the Homepage
  return (
    <div className="App">
      <Homepage supabase={supabase} user={user} onLogout={handleLogout} />
    </div>
  );
}