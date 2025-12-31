import { useState, useEffect, useRef } from 'react';
import { loginUser } from '../services/userService';
import { saveSession, clearSession } from '../utils/sessionStorage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL_FORM = {
  email: '',
  password: '',
  remember: false,
};

function LoginPage({ onBack, onNavigateToSignup = () => {}, onLoginSuccess = () => {} }) {
  // localStorage에서 저장된 로그인 정보 불러오기
  const loadStoredFormData = () => {
    try {
      const stored = localStorage.getItem('loginFormData');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...INITIAL_FORM,
          ...parsed,
        };
      }
    } catch (error) {
      console.error('저장된 로그인 정보 불러오기 실패:', error);
    }
    return INITIAL_FORM;
  };

  const [form, setForm] = useState(loadStoredFormData);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [token, setToken] = useState('');
  const autoLoginAttempted = useRef(false);

  // 컴포넌트 마운트 시 localStorage에서 정보 불러오기
  useEffect(() => {
    const storedData = loadStoredFormData();
    if (storedData.email || storedData.password) {
      setForm(storedData);
    }
  }, []);

  // localStorage 변경 감지 및 자동 로그인 트리거
  useEffect(() => {
    let lastStorageValue = localStorage.getItem('loginFormData');
    
    const handleStorageChange = (e) => {
      if (e.key === 'loginFormData' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setForm((prev) => ({
            ...prev,
            ...parsed,
          }));
          lastStorageValue = e.newValue;
        } catch (error) {
          console.error('저장된 로그인 정보 업데이트 실패:', error);
        }
      }
    };

    // 다른 탭에서의 변경 감지
    window.addEventListener('storage', handleStorageChange);
    
    // 같은 창에서의 localStorage 변경 감지
    const checkStorage = setInterval(() => {
      const currentValue = localStorage.getItem('loginFormData');
      if (currentValue !== lastStorageValue) {
        lastStorageValue = currentValue;
        if (currentValue) {
          try {
            const parsed = JSON.parse(currentValue);
            setForm((prev) => {
              if (prev.email === parsed.email && prev.password === parsed.password) {
                return prev;
              }
              return {
                ...prev,
                ...parsed,
              };
            });
          } catch (error) {
            console.error('저장된 로그인 정보 확인 실패:', error);
          }
        }
      }
    }, 500);

    // 자동 로그인 트리거 이벤트 리스너
    const handleAutoLoginTrigger = () => {
      if (autoLoginAttempted.current) return;
      
      const storedData = loadStoredFormData();
      if (storedData.email && storedData.password) {
        autoLoginAttempted.current = true;
        setTimeout(() => {
          performLogin(storedData.email, storedData.password, false);
        }, 300);
      }
    };

    window.addEventListener('autoLoginTrigger', handleAutoLoginTrigger);
    
    // autoLoginTrigger 플래그 확인
    const autoLoginFlag = localStorage.getItem('autoLoginTrigger');
    if (autoLoginFlag === 'true') {
      localStorage.removeItem('autoLoginTrigger');
      handleAutoLoginTrigger();
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('autoLoginTrigger', handleAutoLoginTrigger);
      clearInterval(checkStorage);
    };
  }, []);

  // 로그인 수행 함수
  const performLogin = async (email, password, remember) => {
    setError('');
    setSuccessMessage('');
    setToken('');

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    if (!password) {
      setError('비밀번호를 입력해주세요.');
      return;
    }

    setStatus('loading');

    try {
      const data = await loginUser({
        email: trimmedEmail,
        password: password,
        rememberMe: remember,
      });

      const expiresInMs = 60 * 60 * 1000; // 60분
      const expiresAt = Date.now() + expiresInMs;

      saveSession({
        token: data.token,
        user: data.user,
        expiresAt,
        lastActivityTime: Date.now(),
        deviceId: data.deviceId,
        rememberToken: data.rememberToken,
        deviceExpiresAt: data.deviceExpiresAt,
      });

      // 로그인 성공 시 localStorage에서 로그인 정보 삭제
      localStorage.removeItem('loginFormData');
      localStorage.removeItem('autoLoginTrigger');

      setForm((prev) => ({ ...INITIAL_FORM, remember: prev.remember }));
      setStatus('success');
      setSuccessMessage('로그인에 성공했어요!');
      setToken(data.token);
      onLoginSuccess({ ...data, expiresAt });
    } catch (submitError) {
      setStatus('error');
      clearSession();
      setError(submitError.message || '로그인에 실패했어요.');
      autoLoginAttempted.current = false;
    }
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    autoLoginAttempted.current = true;
    await performLogin(form.email, form.password, form.remember);
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
              이 기기에서 자동 로그인 유지
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

