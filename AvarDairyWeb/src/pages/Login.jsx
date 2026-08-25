import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="login-page fade-in">
      {/* Left panel: Form */}
      <div className="login-left">
        <div className="login-form-container">
          <img src="/logo.png" alt="Avar Dairy" className="login-logo-mobile" />
          
          <div className="login-header">
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Sign in to your management panel</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            {error && <div className="login-error">{error}</div>}

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                className="input-field"
                type="email"
                placeholder="admin@avardairy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* Right panel: Brand side */}
      <div className="login-right">
        <div className="login-right-content">
          <img src="/logo.png" alt="Avar Dairy" className="login-logo-large" />
          <p className="login-quote">Pure Food,<br/>Healthy India.</p>
          <p className="login-author">Avar Dairy Administration</p>
        </div>
      </div>
    </div>
  )
}
