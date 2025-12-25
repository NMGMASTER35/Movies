import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../services/supabaseClient';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    if (!supabase) {
      setError('Missing Supabase configuration. Please check your environment settings.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
      const { data, error } = response;
      const authError = error?.message;
      const authUser = data?.user;

      if (authError) {
        setError(authError || 'Something went wrong. Please try again.');
        return;
      }

      if (!authUser) {
        setError('Unable to validate your account. Please try again.');
        return;
      }

      setStatusMessage(isLogin ? 'Welcome back!' : 'Account activated. Check your email to confirm.');
      router.push('/home');
    } catch (submitError) {
      setError(submitError.message || 'Unable to reach the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">Private Cinema</p>
          <h1>Movie Library</h1>
          <p className="subtext">Log in or activate your invite to start browsing.</p>
        </div>

        <div className="auth-toggle">
          <button
            type="button"
            className={isLogin ? 'active' : ''}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            type="button"
            className={!isLogin ? 'active' : ''}
            onClick={() => setIsLogin(false)}
          >
            Activate Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : isLogin ? 'Login' : 'Activate Account'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {statusMessage && <p className="status">{statusMessage}</p>}
      </div>
    </div>
  );
}
