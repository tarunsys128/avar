import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const MASTER_ACCOUNTS = [
  { label: '👑 Admin', email: 'admin@avardairy.com', password: 'admin@123', role: 'admin', color: '#7C3AED' },
  { label: '🧑‍💼 Staff', email: 'staff@avardairy.com', password: 'staff@123', role: 'staff', color: '#059669' },
  { label: '🛒 Customer', email: 'customer@avardairy.com', password: 'customer@123', role: 'customer', color: '#2563EB' },
];

const EyeIcon = ({ show }) => (
  show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
);

const Login = () => {
  const [tab, setTab] = useState('email'); // 'email' | 'phone'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMasterPanel, setShowMasterPanel] = useState(false);

  const { loginWithPhone, setupRecaptcha, loginWithEmail, masterLogin } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password. Try the master accounts below.');
    }
    setLoading(false);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const verifier = setupRecaptcha('recaptcha-container');
      const formatted = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const result = await loginWithPhone(formatted, verifier);
      setConfirmationResult(result);
    } catch (err) {
      setError('Failed to send OTP. Check the phone number.');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      navigate('/');
    } catch (err) {
      setError('Invalid OTP. Please try again.');
    }
    setLoading(false);
  };

  const handleMasterLogin = async (account) => {
    setError('');
    setLoading(true);
    try {
      await masterLogin(account.email, account.password, account.role);
      navigate('/');
    } catch (err) {
      setError('Master login failed.');
    }
    setLoading(false);
  };

  return (
    <div className="login-root">
      {/* Background blobs */}
      <div className="login-blob blob-1" />
      <div className="login-blob blob-2" />
      <div className="login-blob blob-3" />

      <div className="login-card">
        {/* Logo / Brand */}
        <div className="login-brand">
          <div className="login-logo">
            <span>🥛</span>
          </div>
          <h1 className="login-title">Avar Dairy</h1>
          <p className="login-subtitle">Smart Order & Management System</p>
        </div>

        {/* Tab switcher */}
        <div className="login-tabs">
          <button
            className={`login-tab${tab === 'email' ? ' active' : ''}`}
            onClick={() => { setTab('email'); setError(''); }}
          >
            📧 Email
          </button>
          <button
            className={`login-tab${tab === 'phone' ? ' active' : ''}`}
            onClick={() => { setTab('phone'); setError(''); }}
          >
            📱 Phone
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="login-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Email Form */}
        {tab === 'email' && (
          <form onSubmit={handleEmailLogin} className="login-form">
            <div className="login-field">
              <label>Email Address</label>
              <div className="input-wrap">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="login-field">
              <label>Password</label>
              <div className="input-wrap">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="toggle-eye"
                  onClick={() => setShowPassword(p => !p)}
                  tabIndex={-1}
                >
                  <EyeIcon show={showPassword} />
                </button>
              </div>
            </div>
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Phone Form */}
        {tab === 'phone' && (
          <div className="login-form">
            {!confirmationResult ? (
              <form onSubmit={handleSendOtp} className="login-form-inner">
                <div className="login-field">
                  <label>Phone Number</label>
                  <div className="input-wrap">
                    <span className="input-icon">📱</span>
                    <input
                      type="tel"
                      placeholder="10-digit number"
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div id="recaptcha-container" />
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? <span className="spinner" /> : null}
                  {loading ? 'Sending OTP…' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="login-form-inner">
                <div className="login-field">
                  <label>Enter OTP</label>
                  <div className="input-wrap">
                    <span className="input-icon">🔑</span>
                    <input
                      type="text"
                      placeholder="6-digit OTP"
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      required
                      maxLength={6}
                    />
                  </div>
                </div>
                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? <span className="spinner" /> : null}
                  {loading ? 'Verifying…' : 'Verify & Login'}
                </button>
                <button
                  type="button"
                  className="login-back"
                  onClick={() => setConfirmationResult(null)}
                >
                  ← Change number
                </button>
              </form>
            )}
          </div>
        )}

        {/* Master Login */}
        <div className="master-section">
          <button
            className="master-toggle"
            onClick={() => setShowMasterPanel(p => !p)}
          >
            <span>🔐 Master / Demo Accounts</span>
            <span className={`chevron${showMasterPanel ? ' open' : ''}`}>▾</span>
          </button>

          {showMasterPanel && (
            <div className="master-panel">
              <p className="master-hint">Tap to login instantly</p>
              {MASTER_ACCOUNTS.map(acc => (
                <button
                  key={acc.role}
                  className="master-card"
                  style={{ '--accent': acc.color }}
                  onClick={() => handleMasterLogin(acc)}
                  disabled={loading}
                >
                  <div className="master-card-left">
                    <span className="master-label">{acc.label}</span>
                    <span className="master-email">{acc.email}</span>
                  </div>
                  <div className="master-card-right">
                    <span className="master-pwd">{acc.password}</span>
                    <span className="master-arrow">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
