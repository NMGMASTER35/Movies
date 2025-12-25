import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (isLogin) {
      console.log('Logging in...', email, password);
    } else {
      console.log('Activating account...', email, password);
    }
    router.push('/home');
  };

  return (
    <div className="container">
      <h1>Welcome to the Movie Library</h1>
      <p className="subtext">Restricted Access - Members Only</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{isLogin ? 'Login' : 'Activate Account'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      <div className="toggle">
        <p onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need to activate your account?' : 'Already have an account? Login'}
        </p>
      </div>
    </div>
  );
}
