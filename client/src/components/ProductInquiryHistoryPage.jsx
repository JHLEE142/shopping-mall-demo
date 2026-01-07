import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { getUserInquiries } from '../services/productInquiryService';
import './ProductInquiryHistoryPage.css';

function ProductInquiryHistoryPage({ user, onBack }) {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    async function loadInquiries() {
      try {
        setLoading(true);
        setError('');
        const data = await getUserInquiries({ page: 1, limit: 100 });
        setInquiries(data.items || []);
      } catch (err) {
        console.error('상품 문의 목록 로드 실패:', err);
        setError(err.message || '상품 문의 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadInquiries();
  }, [user]);

  const getStatusLabel = (status) => {
    const labels = {
      pending: '답변 대기',
      answered: '답변 완료',
      closed: '종료',
    };
    return labels[status] || status;
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
    <div className="product-inquiry-history-page">
      <div className="product-inquiry-history-page__container">
        <button
          type="button"
          className="product-inquiry-history-page__back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          뒤로가기
        </button>

        <h1 className="product-inquiry-history-page__title">상품 문의 내역</h1>

        {loading && <div className="product-inquiry-history-page__loading">로딩 중...</div>}
        {error && <div className="product-inquiry-history-page__error">{error}</div>}

        {!loading && !error && inquiries.length === 0 && (
          <div className="product-inquiry-history-page__empty">
            <MessageSquare size={48} />
            <p>등록된 상품 문의가 없습니다.</p>
          </div>
        )}

        <div className="product-inquiry-history-page__list">
          {inquiries.map((inquiry) => (
            <div key={inquiry._id} className="product-inquiry-history-page__card">
              <div className="product-inquiry-history-page__card-header">
                <div className="product-inquiry-history-page__product-info">
                  {inquiry.productId?.image && (
                    <img
                      src={inquiry.productId.image}
                      alt={inquiry.productId.name}
                      className="product-inquiry-history-page__product-image"
                    />
                  )}
                  <div>
                    <div className="product-inquiry-history-page__product-name">
                      {inquiry.productId?.name || '상품 정보 없음'}
                    </div>
                    <div className="product-inquiry-history-page__card-date">
                      {formatDate(inquiry.createdAt)}
                    </div>
                  </div>
                </div>
                <span className={`product-inquiry-history-page__status-badge product-inquiry-history-page__status-badge--${inquiry.status}`}>
                  {getStatusLabel(inquiry.status)}
                </span>
              </div>
              <div className="product-inquiry-history-page__question">
                <strong>문의:</strong> {inquiry.question}
              </div>
              {inquiry.answer?.content && (
                <div className="product-inquiry-history-page__answer">
                  <strong>답변:</strong> {inquiry.answer.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductInquiryHistoryPage;

