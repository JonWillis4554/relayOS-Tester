import { useState, FormEvent } from 'react';

interface Props {
  onLogin: (password: string) => boolean;
}

export default function Login({ onLogin }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    if (!onLogin(password)) {
      setError('Incorrect password.');
      setPassword('');
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">
          <div className="login-glyph" aria-hidden="true">OB</div>
          <div className="login-brand">
            <span className="login-brand-name">Operational Bank</span>
            <span className="login-brand-sub">Operator Access</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="password" className="sr-only">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="login-input"
            autoFocus
          />
          {error && <p className="login-error" role="alert">{error}</p>}
          <button type="submit" className="login-btn">Sign In</button>
        </form>
      </div>
    </div>
  );
}
