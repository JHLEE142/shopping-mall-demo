import { useState } from 'react';
import { createUser } from '../services/userService';

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  address: '',
  user_type: 'customer',
};

const INITIAL_AGREEMENTS = {
  terms: false,
  privacy: false,
  marketing: false,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignUpPage({ onBack, onNavigateToLogin = () => {} }) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [agreements, setAgreements] = useState(INITIAL_AGREEMENTS);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAgreementChange = (event) => {
    const { name, checked } = event.target;
    setAgreements((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSelectAll = (event) => {
    const { checked } = event.target;
    setAgreements({
      terms: checked,
      privacy: checked,
      marketing: checked,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setError('이름을 입력해주세요.');
      return;
    }

    const trimmedEmail = formData.email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('올바른 이메일 주소를 입력해주세요.');
      return;
    }

    const payload = {
      email: trimmedEmail,
      name: trimmedName,
      password: formData.password,
      user_type: formData.user_type,
    };

    const addressValue = formData.address.trim();
    if (addressValue) {
      payload.address = addressValue;
    }

    setStatus('loading');

    try {
      await createUser(payload);

      setFormData(INITIAL_FORM_DATA);
      setAgreements(INITIAL_AGREEMENTS);
      setStatus('success');
      setSuccessMessage('가입이 완료되었어요! 이제 쇼핑을 시작해보세요.');
    } catch (submitError) {
      setStatus('error');
      setError(submitError.message || '회원가입에 실패했어요.');
    }
  };

  const isAllAgreed = agreements.terms && agreements.privacy && agreements.marketing;

  const canSubmit = agreements.terms && agreements.privacy && status !== 'loading';

  return (
    <div className="signup-wrapper">
      <button className="back-link" type="button" onClick={onBack}>
        ← 메인으로
      </button>

      <section className="signup-card">
        <header className="signup-header">
          <h1 className="signup-title">회원가입</h1>
          <p className="signup-subtitle">새로운 계정을 만들어 쇼핑을 시작하세요.</p>
        </header>

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="name">이름</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
            />
            <small className="helper-text">8자 이상, 영문, 숫자, 특수문자 포함을 권장드려요.</small>
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">비밀번호 확인</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="user_type">회원 유형</label>
            <select
              id="user_type"
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              required
            >
              <option value="customer">일반 회원</option>
              <option value="admin">관리자</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="address">주소 (선택)</label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="배송받을 주소를 입력하세요"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="agreements">
            <div className="agreement-all">
              <label>
                <input
                  type="checkbox"
                  name="all"
                  checked={isAllAgreed}
                  onChange={handleSelectAll}
                />
                전체 동의
              </label>
            </div>

            <div className="agreement-item">
              <label>
                <input
                  type="checkbox"
                  name="terms"
                  checked={agreements.terms}
                  onChange={handleAgreementChange}
                  required
                />
                이용약관 동의 (필수)
              </label>
              <button type="button" className="link-button">
                보기
              </button>
            </div>

            <div className="agreement-item">
              <label>
                <input
                  type="checkbox"
                  name="privacy"
                  checked={agreements.privacy}
                  onChange={handleAgreementChange}
                  required
                />
                개인정보처리방침 동의 (필수)
              </label>
              <button type="button" className="link-button">
                보기
              </button>
            </div>

            <div className="agreement-item">
              <label>
                <input
                  type="checkbox"
                  name="marketing"
                  checked={agreements.marketing}
                  onChange={handleAgreementChange}
                />
                마케팅 정보 수신 동의 (선택)
              </label>
              <button type="button" className="link-button">
                보기
              </button>
            </div>
          </div>

          {error && <p className="status-message error">{error}</p>}
          {status === 'success' && successMessage && (
            <p className="status-message success">{successMessage}</p>
          )}

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={!canSubmit}>
              {status === 'loading' ? '처리 중...' : '가입하기'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <span>이미 계정이 있으신가요?</span>
          <button type="button" className="link-button" onClick={onNavigateToLogin}>
            로그인
          </button>
        </div>
      </section>
    </div>
  );
}

export default SignUpPage;

