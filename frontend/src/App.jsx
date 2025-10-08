import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import logo from './ChatGraphImage1.png'
import './App.css'

const supabase = createClient(
  'https://rpwqxdsidtbqtiitlnhr.supabase.co',     
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwd3F4ZHNpZHRicXRpaXRsbmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NDY3MjIsImV4cCI6MjA3NDMyMjcyMn0.5TWbLmF3iLGFjTY3Ms_CeRUzx8ncVU7sBYe4sku7qFQ'                      
)

export default function App() {
  const [showLogin, setShowLogin] = useState(false)
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
    setShowLogin(false)
  }
  if (user) {
    return (
      <div className="App">
        <header className="App-header">
          <h2>Welcome, {user.email} </h2>
          <p>This is your logged-in page. </p>
          <button onClick={handleLogout}>Logout</button>
        </header>
      </div>
    )
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Welcome to ChatGraph! Login or signup below.</p>
        <p>Click "About" to learn more.</p>

        {user ? (
          <>
            <p>Logged in as <strong>{user.email}</strong></p>
            <button className="App-link" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            {!showLogin ? (
              <>
                <button className="App-link" onClick={() => setShowLogin(true)}>
                  Login / Signup
                </button>
                <div>
                  <a className="App-link" href="/about">
                    About
                  </a>
                </div>
              </>
            ) : (
              <div style={{ width: 400 }}>
                <Auth
                  supabaseClient={supabase}
                  appearance={{ theme: ThemeSupa }}
                  providers={['github', 'google']}
                  redirectTo="http://localhost:5177"
                />
              </div>
            )}
          </>
        )}
      </header>
    </div>
  )
}