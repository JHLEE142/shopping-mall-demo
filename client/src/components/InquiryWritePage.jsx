import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { createInquiry } from '../services/inquiryService';
import './InquiryWritePage.css';

function InquiryWritePage({ user, onBack }) {
  const [formData, setFormData] = useState({
    type: 'general',
    title: '',
    content: '',
    isSecret: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    if (!user) {
      setError('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createInquiry(formData);
      alert('1:1 문의가 등록되었습니다.');
      onBack();
    } catch (err) {
      setError(err.message || '1:1 문의 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inquiry-write-page">
      <div className="inquiry-write-page__container">
        <button
          type="button"
          className="inquiry-write-page__back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          뒤로가기
        </button>

        <div className="inquiry-write-page__header">
          <h1 className="inquiry-write-page__title">1:1 문의하기</h1>
          <p className="inquiry-write-page__subtitle">문의하실 내용을 작성해주세요.</p>
        </div>

        {!user && (
          <div className="inquiry-write-page__alert">
            로그인이 필요합니다. 로그인 후 문의를 작성하실 수 있습니다.
          </div>
        )}

        <form className="inquiry-write-page__form" onSubmit={handleSubmit}>
          <div className="inquiry-write-page__form-group">
            <label htmlFor="type">문의 유형 *</label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              disabled={!user || isSubmitting}
            >
              <option value="general">일반</option>
              <option value="order">주문</option>
              <option value="product">상품</option>
              <option value="payment">결제</option>
              <option value="delivery">배송</option>
              <option value="return">반품/교환</option>
              <option value="other">기타</option>
            </select>
          </div>

          <div className="inquiry-write-page__form-group">
            <label htmlFor="title">제목 *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="문의 제목을 입력해주세요"
              required
              maxLength={200}
              disabled={!user || isSubmitting}
            />
          </div>

          <div className="inquiry-write-page__form-group">
            <label htmlFor="content">내용 *</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="문의 내용을 입력해주세요"
              rows={10}
              required
              disabled={!user || isSubmitting}
            />
          </div>

          <div className="inquiry-write-page__form-group">
            <label className="inquiry-write-page__checkbox-label">
              <input
                type="checkbox"
                checked={formData.isSecret}
                onChange={(e) => setFormData({ ...formData, isSecret: e.target.checked })}
                disabled={!user || isSubmitting}
              />
              <span>비밀글</span>
            </label>
            <p className="inquiry-write-page__help-text">비밀글로 설정하면 작성자와 관리자만 볼 수 있습니다.</p>
          </div>

          {error && (
            <div className="inquiry-write-page__error">
              {error}
            </div>
          )}

          <div className="inquiry-write-page__form-actions">
            <button
              type="button"
              className="inquiry-write-page__button inquiry-write-page__button--secondary"
              onClick={onBack}
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="inquiry-write-page__button inquiry-write-page__button--primary"
              disabled={!user || isSubmitting}
            >
              {isSubmitting ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InquiryWritePage;

