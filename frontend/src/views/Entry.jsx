import { useState, useEffect } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import logo from '../assets/logo.png'
import supabase from '../supabaseClient'
import '../styles/index.css'
import ThemeToggle from '../components/ThemeToggle';

export default function Entry({user}){
    const [showLogin, setShowLogin] = useState(false)
    const [theme, setTheme] = useState('light')

    // Check if we're on /login route and show login form automatically
    useEffect(() => {
        const path = window.location.pathname;
        if (path === '/login' || path === '/login/') {
            setShowLogin(true);
            // Update URL to /login if not already there
            if (path !== '/login') {
                window.history.replaceState(null, '', '/login');
            }
        }
    }, []);

    // Get current theme from localStorage or system preference
    useEffect(() => {
        const getTheme = () => {
            const saved = localStorage.getItem('cg-theme');
            if (saved === 'dark' || saved === 'light') {
                return saved;
            }
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        };
        
        setTheme(getTheme());
        
        // Listen for theme changes
        const handleThemeChange = (e) => {
            if (e.detail === 'dark' || e.detail === 'light') {
                setTheme(e.detail);
            }
        };
        
        window.addEventListener('cg-theme-change', handleThemeChange);
        return () => window.removeEventListener('cg-theme-change', handleThemeChange);
    }, []);

    // Create theme for Supabase Auth based on current theme
    const authTheme = theme === 'dark' 
        ? {
            ...ThemeSupa,
            default: {
                ...ThemeSupa.default,
                colors: {
                    ...ThemeSupa.default.colors,
                    brand: '#60a5fa',
                    brandAccent: '#3b82f6',
                    inputBackground: '#0b1220',
                    inputBorder: 'rgba(255,255,255,0.06)',
                    inputText: '#e6eefc',
                    inputLabelText: '#94a3b8',
                    anchorTextColor: '#60a5fa',
                    buttonText: '#0b1220',
                    dividerBackground: 'rgba(255,255,255,0.06)',
                    messageText: '#e6eefc',
                    messageTextDanger: '#f87171',
                },
            },
        }
        : {
            ...ThemeSupa,
            default: {
                ...ThemeSupa.default,
                colors: {
                    ...ThemeSupa.default.colors,
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                    inputBackground: '#ffffff',
                    inputBorder: '#cbd5e1',
                    inputText: '#0f172a',
                    inputLabelText: '#6b7280',
                    anchorTextColor: '#3b82f6',
                    buttonText: '#ffffff',
                    dividerBackground: '#c7d2fe',
                    messageText: '#0f172a',
                    messageTextDanger: '#dc2626',
                },
            },
        };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--cg-bg)',
            color: 'var(--cg-text)',
            padding: '20px',
        }}>
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
            }}>
                <ThemeToggle />
            </div>

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '24px',
                maxWidth: '500px',
                width: '100%',
            }}>
                <img 
                    src={logo} 
                    alt="ChatGraph Logo" 
                    style={{
                        maxWidth: '200px',
                        width: '100%',
                        height: 'auto',
                        marginBottom: '8px',
                    }} 
                />
                
                {!showLogin ? (
                    <>
                        <h1 style={{
                            margin: 0,
                            fontSize: '2rem',
                            fontWeight: 700,
                            color: 'var(--cg-text)',
                            textAlign: 'center',
                        }}>
                            Welcome to ChatGraph
                        </h1>
                        <p style={{
                            margin: 0,
                            fontSize: '1rem',
                            color: 'var(--cg-muted)',
                            textAlign: 'center',
                        }}>
                            Create and explore branching conversations with AI
                        </p>
                        <button
                            onClick={() => {
                                setShowLogin(true);
                                // Navigate to /login route
                                window.history.pushState(null, '', '/login');
                            }}
                            className="cg-button"
                            style={{
                                marginTop: '16px',
                                padding: '12px 24px',
                                fontSize: '1rem',
                                transition: 'opacity 0.2s, transform 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.9';
                                e.currentTarget.style.transform = 'scale(1.02)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            Login / Signup
                        </button>
                    </>
                ) : (
                    <div style={{
                        width: '100%',
                        maxWidth: '400px',
                        background: 'var(--cg-panel)',
                        borderRadius: 'var(--cg-radius)',
                        padding: '24px',
                        boxShadow: 'var(--cg-shadow)',
                        border: '1px solid var(--cg-border)',
                    }}>
                        <Auth
                            supabaseClient={supabase}
                            appearance={{ theme: authTheme }}
                            providers={['github', 'google']}
                            redirectTo={window.location.origin}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}