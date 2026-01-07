import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, MessageCircle } from 'lucide-react';
import { getInquiries, createInquiry } from '../services/inquiryService';
import './InquiryHistoryPage.css';

function InquiryHistoryPage({ user, onBack }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'general',
    title: '',
    content: '',
    isSecret: false,
  });

  useEffect(() => {
    if (!user) return;

    async function loadInquiries() {
      try {
        setLoading(true);
        setError('');
        const data = await getInquiries({ page: 1, limit: 100 });
        setInquiries(data.items || []);
      } catch (err) {
        console.error('1:1 문의 목록 로드 실패:', err);
        setError(err.message || '1:1 문의 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadInquiries();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createInquiry(formData);
      alert('1:1 문의가 등록되었습니다.');
      setShowForm(false);
      setFormData({
        type: 'general',
        title: '',
        content: '',
        isSecret: false,
      });
      const data = await getInquiries({ page: 1, limit: 100 });
      setInquiries(data.items || []);
    } catch (err) {
      alert(err.message || '1:1 문의 등록에 실패했습니다.');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: '답변 대기',
      answered: '답변 완료',
      closed: '종료',
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type) => {
    const labels = {
      general: '일반',
      order: '주문',
      product: '상품',
      payment: '결제',
      delivery: '배송',
      return: '반품/교환',
      other: '기타',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\. /g, '.').replace(/\.$/, '');
  };

  return (
    <div className="inquiry-history-page">
      <div className="inquiry-history-page__container">
        <button
          type="button"
          className="inquiry-history-page__back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          뒤로가기
        </button>

        <div className="inquiry-history-page__header">
          <h1 className="inquiry-history-page__title">1:1 문의 내역</h1>
          <button
            type="button"
            className="inquiry-history-page__add-button"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={18} />
            문의하기
          </button>
        </div>

        {showForm && (
          <form className="inquiry-history-page__form" onSubmit={handleSubmit}>
            <div className="inquiry-history-page__form-group">
              <label>유형</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
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
            <div className="inquiry-history-page__form-group">
              <label>제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="inquiry-history-page__form-group">
              <label>내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={6}
                required
              />
            </div>
            <div className="inquiry-history-page__form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.isSecret}
                  onChange={(e) => setFormData({ ...formData, isSecret: e.target.checked })}
                />
                비밀글
              </label>
            </div>
            <div className="inquiry-history-page__form-actions">
              <button type="button" onClick={() => setShowForm(false)}>
                취소
              </button>
              <button type="submit">등록</button>
            </div>
          </form>
        )}

        {loading && <div className="inquiry-history-page__loading">로딩 중...</div>}
        {error && <div className="inquiry-history-page__error">{error}</div>}

        {!loading && !error && inquiries.length === 0 && (
          <div className="inquiry-history-page__empty">
            <MessageCircle size={48} />
            <p>등록된 1:1 문의가 없습니다.</p>
          </div>
        )}

        <div className="inquiry-history-page__list">
          {inquiries.map((inquiry) => (
            <div key={inquiry._id} className="inquiry-history-page__card">
              <div className="inquiry-history-page__card-header">
                <div>
                  <span className="inquiry-history-page__type-badge">{getTypeLabel(inquiry.type)}</span>
                  <span className={`inquiry-history-page__status-badge inquiry-history-page__status-badge--${inquiry.status}`}>
                    {getStatusLabel(inquiry.status)}
                  </span>
                  {inquiry.isSecret && (
                    <span className="inquiry-history-page__secret-badge">비밀</span>
                  )}
                </div>
                <div className="inquiry-history-page__card-date">{formatDate(inquiry.createdAt)}</div>
              </div>
              <h3 className="inquiry-history-page__card-title">{inquiry.title}</h3>
              <p className="inquiry-history-page__card-content">{inquiry.content}</p>
              {inquiry.answer?.content && (
                <div className="inquiry-history-page__answer">
                  <strong>관리자 답변:</strong> {inquiry.answer.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default InquiryHistoryPage;

