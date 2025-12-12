import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import '../styles/index.css'
import ThemeToggle from '../components/ThemeToggle';

export default function ResetPassword({ supabase, onComplete }) {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const [theme, setTheme] = useState('light')

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validate passwords
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                setError(error.message);
            } else {
                setSuccess(true);
                // Wait a moment to show success message, then redirect
                setTimeout(() => {
                    if (onComplete) onComplete();
                }, 2000);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
            console.error('Password reset error:', err);
        } finally {
            setLoading(false);
        }
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
                
                <div style={{
                    width: '100%',
                    maxWidth: '400px',
                    background: 'var(--cg-panel)',
                    borderRadius: 'var(--cg-radius)',
                    padding: '24px',
                    boxShadow: 'var(--cg-shadow)',
                    border: '1px solid var(--cg-border)',
                }}>
                    <h2 style={{
                        margin: '0 0 8px 0',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--cg-text)',
                        textAlign: 'center',
                    }}>
                        Reset Your Password
                    </h2>
                    <p style={{
                        margin: '0 0 24px 0',
                        fontSize: '0.9rem',
                        color: 'var(--cg-muted)',
                        textAlign: 'center',
                    }}>
                        Enter your new password below
                    </p>

                    {success ? (
                        <div style={{
                            padding: '16px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: 'var(--cg-radius)',
                            color: '#22c55e',
                            textAlign: 'center',
                            fontSize: '0.95rem',
                        }}>
                            Password updated successfully! Redirecting...
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '0.9rem',
                                    color: 'var(--cg-muted)',
                                }}>
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    className="cg-input"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 'var(--cg-radius)',
                                        border: '1px solid var(--cg-input-border)',
                                        background: 'var(--cg-input-bg)',
                                        color: 'var(--cg-text)',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    display: 'block',
                                    marginBottom: '6px',
                                    fontSize: '0.9rem',
                                    color: 'var(--cg-muted)',
                                }}>
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    className="cg-input"
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        borderRadius: 'var(--cg-radius)',
                                        border: '1px solid var(--cg-input-border)',
                                        background: 'var(--cg-input-bg)',
                                        color: 'var(--cg-text)',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            {error && (
                                <div style={{
                                    padding: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: 'var(--cg-radius)',
                                    color: '#ef4444',
                                    fontSize: '0.9rem',
                                }}>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="cg-button"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '1rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

