import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import './App.css'
import Homepage from './views/Homepage'
import Entry from './views/Entry'
import supabase from './supabaseClient'

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }
  if (!user) {
    return (
      <Entry supabase={supabase} />
    )
  }

  return (
      <div className="App">
        <Homepage supabase={supabase} user={user} onLogout={handleLogout} />
      </div>
  )

  
}