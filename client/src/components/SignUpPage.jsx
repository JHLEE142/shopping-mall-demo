import { useState, useEffect } from 'react';
import { createUser, loginUser } from '../services/userService';
import { saveSession } from '../utils/sessionStorage';

const INITIAL_FORM_DATA = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  postalCode: '',
  address: '',
  addressDetail: '',
  user_type: 'customer', // UI에서 제거되었지만 서버 전송 시 항상 'customer'로 고정
};

const INITIAL_AGREEMENTS = {
  terms: false,
  privacy: false,
  marketing: false,
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignUpPage({
  onBack,
  onNavigateToLogin = () => {},
  onViewTerms = () => {},
  onViewPrivacy = () => {},
  onViewMarketing = () => {},
  onLoginSuccess = () => {},
}) {
  // localStorage에서 저장된 회원가입 정보 불러오기
  const loadStoredFormData = () => {
    try {
      const stored = localStorage.getItem('signupFormData');
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...INITIAL_FORM_DATA,
          ...parsed,
          // password는 저장하지 않음 (보안)
          password: '',
          confirmPassword: '',
        };
      }
    } catch (error) {
      console.error('저장된 회원가입 정보 불러오기 실패:', error);
    }
    return INITIAL_FORM_DATA;
  };

  const [formData, setFormData] = useState(loadStoredFormData);
  const [agreements, setAgreements] = useState(INITIAL_AGREEMENTS);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 컴포넌트 마운트 시 localStorage와 sessionStorage에서 정보 불러오기
  useEffect(() => {
    // Google 로그인으로 온 경우 sessionStorage에서 정보 불러오기
    const googleSignupData = sessionStorage.getItem('googleSignupData');
    if (googleSignupData) {
      try {
        const googleData = JSON.parse(googleSignupData);
        setFormData((prev) => ({
          ...prev,
          email: googleData.email || prev.email,
          name: googleData.name || prev.name,
        }));
      } catch (error) {
        console.error('Google 회원가입 정보 불러오기 실패:', error);
      }
    }

    // localStorage에서 저장된 정보 불러오기
    const storedData = loadStoredFormData();
    if (storedData.name || storedData.email || storedData.address) {
      setFormData((prev) => ({
        ...prev,
        ...storedData,
        // Google 정보가 있으면 우선 적용
        email: googleSignupData ? JSON.parse(googleSignupData).email : prev.email,
        name: googleSignupData ? JSON.parse(googleSignupData).name : prev.name,
      }));
    }
  }, []);

  // localStorage 변경 감지 (다른 탭이나 채팅 위젯에서 업데이트된 경우)
  useEffect(() => {
    let lastStorageValue = localStorage.getItem('signupFormData');
    
    const handleStorageChange = (e) => {
      if (e.key === 'signupFormData' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setFormData((prev) => ({
            ...prev,
            ...parsed,
            // password는 업데이트하지 않음
            password: prev.password,
            confirmPassword: prev.confirmPassword,
          }));
          lastStorageValue = e.newValue;
        } catch (error) {
          console.error('저장된 회원가입 정보 업데이트 실패:', error);
        }
      }
    };

    // 다른 탭에서의 변경 감지
    window.addEventListener('storage', handleStorageChange);
    
    // 같은 창에서의 localStorage 변경 감지 (storage 이벤트는 다른 탭에서만 발생)
    const checkStorage = setInterval(() => {
      const currentValue = localStorage.getItem('signupFormData');
      if (currentValue !== lastStorageValue) {
        lastStorageValue = currentValue;
        if (currentValue) {
          try {
            const parsed = JSON.parse(currentValue);
            setFormData((prev) => {
              // 이미 같은 값이면 업데이트하지 않음
              if (prev.name === parsed.name && prev.email === parsed.email && prev.address === parsed.address) {
                return prev;
              }
              return {
                ...prev,
                ...parsed,
                password: prev.password,
                confirmPassword: prev.confirmPassword,
              };
            });
          } catch (error) {
            console.error('저장된 회원가입 정보 확인 실패:', error);
          }
        }
      }
    }, 500); // 0.5초마다 체크

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(checkStorage);
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressSearch = () => {
    if (!window.daum || !window.daum.Postcode) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data) {
        // 팝업에서 검색결과 항목을 클릭했을때 실행할 코드
        let addr = ''; // 주소 변수
        let extraAddr = ''; // 참고항목 변수

        // 사용자가 선택한 주소 타입에 따라 해당 주소 값을 가져온다.
        if (data.userSelectedType === 'R') { // 사용자가 도로명 주소를 선택했을 경우
          addr = data.roadAddress;
        } else { // 사용자가 지번 주소를 선택했을 경우(J)
          addr = data.jibunAddress;
        }

        // 사용자가 선택한 주소가 도로명 타입일때 참고항목을 조합한다.
        if(data.userSelectedType === 'R'){
          // 법정동명이 있을 경우 추가한다. (법정리는 제외)
          // 법정동의 경우 마지막 문자가 "동/로/가"로 끝난다.
          if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
            extraAddr += data.bname;
          }
          // 건물명이 있고, 공동주택일 경우 추가한다.
          if(data.buildingName !== '' && data.apartment === 'Y'){
            extraAddr += (extraAddr !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
          if(extraAddr !== ''){
            extraAddr = ' (' + extraAddr + ')';
          }
        }

        // 우편번호와 주소 정보를 해당 필드에 넣는다.
        setFormData((prev) => ({
          ...prev,
          postalCode: data.zonecode,
          address: addr + extraAddr,
        }));

        // 커서를 상세주소 필드로 이동한다.
        document.getElementById('addressDetail').focus();
      },
      width: '100%',
      height: '100%',
    }).open();
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

    // Google 로그인으로 온 경우 비밀번호 검증 건너뛰기
    const googleSignupData = sessionStorage.getItem('googleSignupData');
    const isGoogleSignup = !!googleSignupData;

    if (!isGoogleSignup && formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않아요.');
      return;
    }

    if (!isGoogleSignup && !formData.password) {
      setError('비밀번호를 입력해주세요.');
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

    // Google 로그인으로 온 경우 credential 포함
    const googleSignupData = sessionStorage.getItem('googleSignupData');
    const googleData = googleSignupData ? JSON.parse(googleSignupData) : null;

    const payload = {
      email: trimmedEmail,
      name: trimmedName,
      password: formData.password || '', // Google 로그인인 경우 빈 문자열
      user_type: formData.user_type,
    };

    // Google 로그인으로 온 경우 credential 추가
    if (googleData && googleData.credential) {
      payload.googleCredential = googleData.credential;
    }

    // 주소 정보 조합
    const addressParts = [];
    if (formData.postalCode) addressParts.push(`[${formData.postalCode}]`);
    if (formData.address) addressParts.push(formData.address);
    if (formData.addressDetail) addressParts.push(formData.addressDetail);
    
    const fullAddress = addressParts.join(' ');
    if (fullAddress.trim()) {
      payload.address = fullAddress.trim();
    }

    setStatus('loading');

    try {
      await createUser(payload);

      // 회원가입 성공 시 localStorage의 저장된 정보 삭제
      localStorage.removeItem('signupFormData');

      // Google 로그인으로 온 경우 자동 로그인
      const googleSignupData = sessionStorage.getItem('googleSignupData');
      if (googleSignupData) {
        try {
          const googleData = JSON.parse(googleSignupData);
          // Google credential로 다시 로그인 시도 (이제 사용자가 존재하므로 로그인 성공)
          const loginResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:6500'}/api/users/google-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ credential: googleData.credential }),
          });

          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            const expiresInMs = 60 * 60 * 1000; // 60분
            const expiresAt = Date.now() + expiresInMs;

            saveSession({
              token: loginData.token,
              user: loginData.user,
              expiresAt,
              lastActivityTime: Date.now(),
              deviceId: loginData.deviceId,
              rememberToken: loginData.rememberToken,
              deviceExpiresAt: loginData.deviceExpiresAt,
            });

            // Google 회원가입 정보 삭제
            sessionStorage.removeItem('googleSignupData');

            setFormData(INITIAL_FORM_DATA);
            setAgreements(INITIAL_AGREEMENTS);
            setStatus('success');
            setSuccessMessage('가입이 완료되었어요! 자동으로 로그인됩니다.');

            // 자동 로그인 성공 콜백 호출
            setTimeout(() => {
              onLoginSuccess({ ...loginData, expiresAt });
            }, 1000);
            return;
          }
        } catch (autoLoginError) {
          console.error('자동 로그인 실패:', autoLoginError);
          // 자동 로그인 실패해도 회원가입은 성공했으므로 로그인 페이지로 이동
        }
      }

      // 일반 회원가입 또는 자동 로그인 실패 시
      setFormData(INITIAL_FORM_DATA);
      setAgreements(INITIAL_AGREEMENTS);
      setStatus('success');
      setSuccessMessage('가입이 완료되었어요! 로그인 페이지로 이동합니다.');

      // 성공 메시지를 잠시 보여준 후 로그인 페이지로 이동
      setTimeout(() => {
        onNavigateToLogin();
      }, 1500);
    } catch (submitError) {
      setStatus('error');
      setError(submitError.message || '회원가입에 실패했어요.');
    }
  };

  const isAllAgreed = agreements.terms && agreements.privacy && agreements.marketing;

  const canSubmit = agreements.terms && agreements.privacy && status !== 'loading';

  // Google 로그인으로 온 경우 확인
  const isGoogleSignup = !!sessionStorage.getItem('googleSignupData');

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

          {!isGoogleSignup && (
            <>
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
            </>
          )}
          {isGoogleSignup && (
            <div className="field">
              <small className="helper-text" style={{ color: '#6366f1', fontWeight: 500 }}>
                구글 계정으로 로그인하시므로 비밀번호 입력이 필요 없습니다.
              </small>
            </div>
          )}


          <div className="field">
            <label htmlFor="postalCode">주소 (선택)</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                placeholder="우편번호"
                value={formData.postalCode || ''}
                readOnly
                style={{ flex: '0 0 120px' }}
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                우편번호 찾기
              </button>
            </div>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="기본 주소"
              value={formData.address || ''}
              readOnly
              style={{ marginBottom: '8px' }}
            />
            <input
              id="addressDetail"
              name="addressDetail"
              type="text"
              placeholder="상세 주소를 입력하세요"
              value={formData.addressDetail || ''}
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
              <button type="button" className="link-button" onClick={onViewTerms}>
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
              <button type="button" className="link-button" onClick={onViewPrivacy}>
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
              <button type="button" className="link-button" onClick={onViewMarketing}>
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

