import { useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import logo from '../assets/ChatGraphImage1.png'
import supabase from '../supabaseClient'
import '../App.css'
import "@xyflow/react/dist/style.css";


export default function Entry({user}){
    const [showLogin, setShowLogin] = useState(false)

    return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>Welcome to ChatGraph! Login or signup below.</p>
        <p>Click "About" to learn more.</p>

        {user ? (
          <>
            <p>Logged in as <strong>{user.email}</strong></p>
            <button className="App-link" onClick={() =>setShowLogin(true)}>
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