import { useState } from 'react';
import { loginUser } from '../services/userService';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM = {
  email: '',
  password: '',
  remember: false,
};

function LoginPage({ onBack, onNavigateToSignup = () => {}, onLoginSuccess = () => {} }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [token, setToken] = useState('');

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setToken('');

    const trimmedEmail = form.email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    if (!form.password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setStatus('loading');

    try {
      const data = await loginUser({
        email: trimmedEmail,
        password: form.password,
      });

      if (form.remember) {
        window.localStorage.setItem('authToken', data.token);
      } else {
        window.localStorage.removeItem('authToken');
      }

      setForm((prev) => ({ ...INITIAL_FORM, remember: prev.remember }));
      setStatus('success');
      setSuccessMessage('로그인에 성공했어요!');
      setToken(data.token);
      onLoginSuccess(data);
    } catch (submitError) {
      setStatus('error');
      setError(submitError.message || '로그인에 실패했어요.');
    }
  };

  return (
    <div className="login-wrapper">
      <button className="back-link" type="button" onClick={onBack}>
        ← 메인으로
      </button>

      <section className="login-card">
        <header className="login-header">
          <h1 className="login-title">로그인</h1>
          <p className="login-subtitle">계정에 로그인하여 쇼핑을 시작하세요.</p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="login-email">이메일</label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">비밀번호</label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="login-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
              />
              로그인 상태 유지
            </label>
            <button type="button" className="link-button">
              비밀번호 찾기
            </button>
          </div>

          {error && <p className="status-message error">{error}</p>}
          {status === 'success' && successMessage && (
            <div className="status-success">
              <p className="status-message success">{successMessage}</p>
              {token && (
                <p className="token-info">
                  발급된 토큰: <span className="token-value">{token}</span>
                </p>
              )}
            </div>
          )}

          <button className="primary-button primary-button--dark" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="login-divider">
          <span>또는</span>
        </div>

        <div className="social-login-list">
          <button type="button" className="social-login-button social-login-button--google">
            G Google로 로그인
          </button>
          <button type="button" className="social-login-button social-login-button--facebook">
            f Facebook으로 로그인
          </button>
          <button type="button" className="social-login-button social-login-button--apple">
             Apple로 로그인
          </button>
        </div>

        <div className="auth-footer">
          <span>아직 계정이 없으신가요?</span>
          <button type="button" className="link-button" onClick={onNavigateToSignup}>
            회원가입
          </button>
        </div>

        <p className="login-notice">
          로그인 하시면 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </section>
    </div>
  );
}

export default LoginPage;

