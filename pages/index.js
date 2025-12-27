import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../services/supabaseClient';

export default function Home() {
  const DEMO_USER = {
    id: 'demo-user',
    email: 'demo@movielibrary.app',
    user_metadata: {
      full_name: 'Demo Member',
      bio: 'Exploring the catalog in demo mode.',
    },
  };
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const enableDemoMode = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('demo-user', JSON.stringify(DEMO_USER));
    }
    setStatusMessage('Demo mode enabled. Loading the library...');
    router.push('/home');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatusMessage('');

    if (!email || !password || (!isLogin && !fullName)) {
      setError(isLogin ? 'Email and password are required.' : 'Name, email, and password are required.');
      return;
    }

    if (!supabase) {
      enableDemoMode();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = isLogin
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                invite_code: inviteCode || null,
              },
            },
          });
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

      if (isLogin) {
        setStatusMessage('Welcome back!');
      } else if (inviteCode) {
        setStatusMessage('Invite accepted! Check your email to confirm activation.');
      } else {
        setStatusMessage('Check your email to confirm your account.');
      }
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

        {!supabase && (
          <div className="demo-banner" role="status">
            <strong>Demo mode</strong>
            <p>No Supabase credentials detected. Continue in demo mode to try the full experience.</p>
          </div>
        )}

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
          {!isLogin && (
            <label>
              Full name
              <input
                type="text"
                placeholder="Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </label>
          )}
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
          {!isLogin && (
            <label>
              Invite code (optional)
              <input
                type="text"
                placeholder="MOVIES-2024"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </label>
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : isLogin ? 'Login' : 'Activate Account'}
          </button>
        </form>

        <div className="demo-actions">
          <p className="subtext">Just exploring? Skip account creation.</p>
          <button type="button" className="secondary" onClick={enableDemoMode}>
            Continue in demo mode
          </button>
        </div>

        {error && <p className="error">{error}</p>}
        {statusMessage && <p className="status">{statusMessage}</p>}
      </div>
    </div>
  );
}
