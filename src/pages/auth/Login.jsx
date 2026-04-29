import React from 'react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginWithPhone, setupRecaptcha, loginWithEmail } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const verifier = setupRecaptcha('recaptcha-container');
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const result = await loginWithPhone(formattedPhone, verifier);
      setConfirmationResult(result);
    } catch (err) {
      console.error(err);
      setError('Failed to send OTP. Please check the number format (+91...).');
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
      console.error(err);
      setError('Invalid OTP.');
    }
    setLoading(false);
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      // Route is automatically handled by Auth listener redirecting to /staff or /admin
      // But we can force a generic navigate that ProtectedRoute will catch
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-primary mb-2">Avar Dairy</h1>
          <p className="text-muted">Smart Order & Management System</p>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
          <button 
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${loginMethod === 'phone' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            onClick={() => setLoginMethod('phone')}
          >
            Phone Login
          </button>
          <button 
            className={`flex-1 py-2 rounded-md font-medium transition-colors ${loginMethod === 'email' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
            onClick={() => setLoginMethod('email')}
          >
            Email Login
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>}

        {loginMethod === 'phone' ? (
          <div>
            {!confirmationResult ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="Enter 10 digit number" 
                    className="input-field"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <div id="recaptcha-container"></div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Enter OTP</label>
                  <input 
                    type="text" 
                    placeholder="6-digit OTP" 
                    className="input-field"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </button>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input 
                type="email" 
                placeholder="user@example.com" 
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input 
                type="password" 
                placeholder="********" 
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
