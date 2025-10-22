import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import logo from './assets/ChatGraphImage1.png'
import './App.css'
import Homepage from './Homepage'
import supabase from './supabaseClient'

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
        <Homepage supabase={supabase} user={user} onLogout={handleLogout} />
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