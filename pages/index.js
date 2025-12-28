import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../services/supabaseClient';

export default function Index() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setError('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      return;
    }

    const hydrate = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (data?.session?.user) {
        router.replace('/home');
      }
    };

    hydrate();
  }, [router]);

  const validateInvite = async (code) => {
    if (!code) {
      throw new Error('Invite code is required to activate an account.');
    }
    const { data, error: inviteError } = await supabase
      .from('invites')
      .select('id, email, role, revoked, used_at')
      .eq('code', code)
      .maybeSingle();

    if (inviteError) {
      throw new Error(inviteError.message || 'Unable to verify invite.');
    }
    if (!data) {
      throw new Error('Invite not found.');
    }
    if (data.revoked) {
      throw new Error('This invite has been revoked.');
    }
    if (data.used_at) {
      throw new Error('This invite has already been used.');
    }
    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');

    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (!isLogin && (!fullName || !inviteCode)) {
      setError('Name and invite code are required to activate your account.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          throw signInError;
        }
        if (!data?.user) {
          throw new Error('Unable to sign in.');
        }
        setStatusMessage('Welcome back to N&M Movies.');
        router.push('/home');
        return;
      }

      const invite = await validateInvite(inviteCode.trim());
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: invite.role || 'member',
            invite_code: inviteCode.trim(),
          },
        },
      });
      if (signUpError) {
        throw signUpError;
      }
      if (!data?.user) {
        throw new Error('Unable to create account.');
      }

      await Promise.all([
        supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          full_name: fullName,
          role: invite.role || 'member',
          invite_code: inviteCode.trim(),
        }),
        supabase.from('invites').update({ used_at: new Date().toISOString(), used_by: data.user.id }).eq('id', invite.id),
      ]);

      setStatusMessage('Account created. Check your email to confirm and then sign in.');
      setIsLogin(true);
    } catch (submitError) {
      setError(submitError.message || 'Unable to process your request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p className="eyebrow">Invitation-only</p>
          <h1>N&M Movies</h1>
          <p className="subtext">Private catalog access for invited members only.</p>
        </div>

        <div className="auth-toggle">
          <button type="button" className={isLogin ? 'active' : ''} onClick={() => setIsLogin(true)}>
            Login
          </button>
          <button type="button" className={!isLogin ? 'active' : ''} onClick={() => setIsLogin(false)}>
            Activate Invite
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <label>
              Full name
              <input
                type="text"
                placeholder="Nia Thompson"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </label>
          )}
          <label>
            Email address
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {!isLogin && (
            <label>
              Invite code
              <input
                type="text"
                placeholder="NM-XXXXXX"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value)}
              />
            </label>
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing…' : isLogin ? 'Login' : 'Activate'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {statusMessage && <p className="status">{statusMessage}</p>}
      </div>
    </div>
  );
}
