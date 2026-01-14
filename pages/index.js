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
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedInviteCode = inviteCode.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Email and password are required.');
      return;
    }
    if (!isLogin && (!fullName || !trimmedInviteCode)) {
      setError('Name and invite code are required to activate your account.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        });
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

      const invite = await validateInvite(trimmedInviteCode);
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            full_name: fullName,
            role: invite.role || 'member',
            invite_code: trimmedInviteCode,
          },
        },
      });
      if (signUpError) {
        throw signUpError;
      }
      if (!data?.user) {
        throw new Error('Unable to create account.');
      }

      const [profileResult, inviteResult] = await Promise.all([
        supabase.from('profiles').upsert({
          id: data.user.id,
          email: trimmedEmail,
          full_name: fullName,
          role: invite.role || 'member',
          invite_code: trimmedInviteCode,
        }),
        supabase
          .from('invites')
          .update({ used_at: new Date().toISOString(), used_by: data.user.id })
          .eq('id', invite.id),
      ]);

      if (profileResult.error) {
        throw new Error(profileResult.error.message || 'Unable to save your profile.');
      }
      if (inviteResult.error) {
        throw new Error(inviteResult.error.message || 'Unable to mark invite as used.');
      }

      let activationMessage = 'Account created. Check your email to confirm and then sign in.';
      if (data.user?.id) {
        try {
          const response = await fetch('/api/auth/confirm-invite', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: data.user.id }),
          });
          const confirmation = await response.json();
          if (response.ok && confirmation?.user) {
            activationMessage = 'Account activated. You can sign in now.';
          } else if (confirmation?.error) {
            activationMessage = `${activationMessage} (${confirmation.error})`;
          }
        } catch (confirmationError) {
          activationMessage = confirmationError.message || activationMessage;
        }
      }

      setStatusMessage(activationMessage);
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
          <button
            type="button"
            className={isLogin ? 'active' : ''}
            onClick={() => setIsLogin(true)}
            aria-pressed={isLogin}
          >
            Login
          </button>
          <button
            type="button"
            className={!isLogin ? 'active' : ''}
            onClick={() => setIsLogin(false)}
            aria-pressed={!isLogin}
          >
            Activate Invite
          </button>
        </div>

        <p className="auth-helper">
          {isLogin
            ? 'Sign in with the email associated with your invite. Need access? Activate your invite first.'
            : 'Enter the invite code you received along with your name to activate your account.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <label>
              Full name
              <input
                type="text"
                placeholder="Nia Thompson"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoComplete="name"
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
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
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
                autoComplete="one-time-code"
              />
            </label>
          )}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing…' : isLogin ? 'Login' : 'Activate'}
          </button>
        </form>

        <div className="auth-feedback" aria-live="polite">
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {statusMessage && <p className="status">{statusMessage}</p>}
        </div>
      </div>
    </div>
  );
}
