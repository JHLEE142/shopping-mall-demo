import { useState } from 'react';
import './MonochromePage.css';

function ProfileEditPage({ user, onBack }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">프로필 편집</h1>
          <p className="mono-subtitle">회원 정보를 수정할 수 있습니다.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">기본 정보</h2>
          <div className="mono-list">
            <input className="mono-input" value={form.name} onChange={handleChange('name')} placeholder="이름" />
            <input className="mono-input" value={form.email} onChange={handleChange('email')} placeholder="이메일" />
            <input className="mono-input" value={form.phone} onChange={handleChange('phone')} placeholder="전화번호" />
            <input className="mono-input" value={form.address} onChange={handleChange('address')} placeholder="주소" />
            <div className="mono-actions">
              <button type="button" className="mono-button">
                변경 저장
              </button>
              <button type="button" className="mono-button mono-button--ghost" onClick={onBack}>
                취소
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProfileEditPage;
