import React, { useEffect, useState } from 'react';
import { MessageCircle, Clock, CheckCircle, Timer, Search, X } from 'lucide-react';
import { getAllInquiries as getAllOneOnOneInquiries, answerInquiry as answerOneOnOneInquiry } from '../../../services/inquiryService';
import { getAllInquiries as getAllProductInquiries, answerInquiry as answerProductInquiry } from '../../../services/productInquiryService';
import './InquiriesPage.css';

function InquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [inquiryType, setInquiryType] = useState('one-on-one');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [answering, setAnswering] = useState(false);

  useEffect(() => {
    // URL 파라미터에서 inquiryId와 inquiryType 확인
    const params = new URLSearchParams(window.location.search);
    const inquiryId = params.get('inquiryId');
    const urlInquiryType = params.get('inquiryType');
    
    if (urlInquiryType) {
      // inquiryType이 URL에 있으면 설정
      if (urlInquiryType === 'product' || urlInquiryType === 'one-on-one') {
        setInquiryType(urlInquiryType);
      }
    }
    
    // inquiryType 설정 후 문의 목록 로드
    loadInquiries();
  }, []);

  useEffect(() => {
    // inquiryType이 변경되면 문의 목록 다시 로드
    loadInquiries();
  }, [inquiryType]);

  // 문의 목록이 로드된 후 URL 파라미터의 inquiryId로 문의 열기
  useEffect(() => {
    if (inquiries.length === 0) return;
    
    const params = new URLSearchParams(window.location.search);
    const inquiryId = params.get('inquiryId');
    
    if (inquiryId) {
      // 해당 문의 찾기
      const inquiry = inquiries.find(i => i._id === inquiryId);
      if (inquiry) {
        setSelectedInquiry(inquiry);
        // URL에서 inquiryId 제거 (한 번만 열기)
        const newUrl = new URL(window.location);
        newUrl.searchParams.delete('inquiryId');
        newUrl.searchParams.delete('inquiryType');
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [inquiries]);

  const loadInquiries = async () => {
    try {
      setLoading(true);
      const data = inquiryType === 'one-on-one'
        ? await getAllOneOnOneInquiries({ page: 1, limit: 100 })
        : await getAllProductInquiries({ page: 1, limit: 100 });
      // API 응답 형식: { items: [], pagination: {} }
      setInquiries(data?.items || data || []);
    } catch (error) {
      console.error('문의 로드 실패:', error);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async () => {
    if (!selectedInquiry || !answer.trim()) return;

    try {
      setAnswering(true);
      if (inquiryType === 'one-on-one') {
        await answerOneOnOneInquiry(selectedInquiry._id, answer);
      } else {
        await answerProductInquiry(selectedInquiry._id, answer);
      }
      setSelectedInquiry(null);
      setAnswer('');
      await loadInquiries();
    } catch (error) {
      console.error('답변 실패:', error);
      alert('답변 등록에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setAnswering(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '대기중', class: 'warning' },
      answered: { label: '답변완료', class: 'success' },
      closed: { label: '종료', class: 'default' },
    };
    return statusMap[status] || { label: status, class: 'default' };
  };

  return (
    <div className="admin-inquiries-page">
      {/* Stats Cards (Optional) */}
      <div className="admin-grid admin-grid--stats">
        <StatCard icon={MessageCircle} label="Total Inquiries" value={inquiries.length} />
        <StatCard icon={Clock} label="Pending Inquiries" value={inquiries.filter(i => i.status === 'pending').length} />
        <StatCard icon={CheckCircle} label="Answered Inquiries" value={inquiries.filter(i => i.status === 'answered').length} />
        <StatCard icon={Timer} label="Response Time (Avg)" value="2.5 hours" />
      </div>

      {/* Inquiries List */}
      <div className="admin-card">
        <div className="admin-card__header">
          <h3>Inquiries List</h3>
          <div className="admin-card__header-actions">
            <div className="admin-tabs">
              <button
                type="button"
                className={`admin-tab ${inquiryType === 'one-on-one' ? 'is-active' : ''}`}
                onClick={() => setInquiryType('one-on-one')}
              >
                1:1 문의
              </button>
              <button
                type="button"
                className={`admin-tab ${inquiryType === 'product' ? 'is-active' : ''}`}
                onClick={() => setInquiryType('product')}
              >
                상품 문의
              </button>
            </div>
            <div className="admin-search-bar">
              <Search size={18} />
              <input type="text" placeholder="문의 내용 검색..." />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="admin-page-loading">Loading...</div>
        ) : (
          <div className={`admin-table admin-table--inquiries admin-table--${inquiryType === 'one-on-one' ? 'one-on-one' : 'product'}`}>
            <div className="admin-table__header">
              {inquiryType === 'one-on-one' ? (
                <>
                  <span>번호</span>
                  <span>사용자</span>
                  <span>유형</span>
                  <span>제목</span>
                  <span>상태</span>
                  <span>작성일</span>
                  <span>관리</span>
                </>
              ) : (
                <>
                  <span>번호</span>
                  <span>사용자</span>
                  <span>상품</span>
                  <span>문의 내용</span>
                  <span>상태</span>
                  <span>작성일</span>
                  <span>관리</span>
                </>
              )}
            </div>
            <div className="admin-table__body">
              {inquiries.length === 0 ? (
                <div className="admin-empty-state" style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center' }}>
                  <MessageCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                  <p>문의가 없습니다.</p>
                </div>
              ) : (
                inquiries.map((inquiry, index) => {
                const status = getStatusBadge(inquiry.status);
                return (
                  <div key={inquiry._id || index} className="admin-table__row">
                    <span>{index + 1}</span>
                    <div className="admin-table__cell-user">
                      <div className="admin-table__user-avatar">
                        {(inquiry.user?.name || inquiry.userId?.name || 'U')?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div>{inquiry.user?.name || inquiry.userId?.name || 'Unknown'}</div>
                        <div className="admin-table__user-email">{inquiry.user?.email || inquiry.userId?.email || ''}</div>
                      </div>
                    </div>
                    {inquiryType === 'one-on-one' ? (
                      <>
                        <span>{inquiry.type || '일반'}</span>
                        <span 
                          className="admin-table__inquiry-preview"
                          style={{ 
                            cursor: 'pointer', 
                            color: '#6366f1',
                            textDecoration: 'underline',
                          }}
                          onClick={() => setSelectedInquiry(inquiry)}
                          title="클릭하여 상세보기"
                        >
                          {inquiry.title || (inquiry.content ? (inquiry.content.length > 50 ? inquiry.content.substring(0, 50) + '...' : inquiry.content) : '-')}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="admin-table__cell-product">
                          {(inquiry.productId?.image || inquiry.product?.image) && (
                            <img src={inquiry.productId?.image || inquiry.product?.image} alt={inquiry.productId?.name || inquiry.product?.name} />
                          )}
                          <span>{inquiry.productId?.name || inquiry.product?.name || '-'}</span>
                        </div>
                        <span 
                          className="admin-table__inquiry-preview"
                          style={{ 
                            cursor: 'pointer', 
                            color: '#6366f1',
                            textDecoration: 'underline',
                          }}
                          onClick={() => setSelectedInquiry(inquiry)}
                          title="클릭하여 상세보기"
                        >
                          {inquiry.question ? (inquiry.question.length > 100 ? inquiry.question.substring(0, 100) + '...' : inquiry.question) : '-'}
                        </span>
                      </>
                    )}
                    <span>
                      <span className={`admin-badge admin-badge--${status.class}`}>
                        {status.label}
                      </span>
                    </span>
                    <span>{formatDate(inquiry.createdAt)}</span>
                    <span>
                      <button
                        type="button"
                        className="admin-button"
                        onClick={() => setSelectedInquiry(inquiry)}
                      >
                        상세보기
                      </button>
                    </span>
                  </div>
                );
              }))}
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="admin-modal-overlay" onClick={() => setSelectedInquiry(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <header className="admin-modal__header">
              <h3>문의 상세</h3>
              <button type="button" className="admin-modal__close" onClick={() => setSelectedInquiry(null)}>
                <X size={18} />
              </button>
            </header>
            <div className="admin-modal__body">
              <div className="admin-inquiry-detail">
                <div className="admin-inquiry-detail__row">
                  <span>사용자</span>
                  <span>{selectedInquiry.user?.name || selectedInquiry.userId?.name || 'Unknown'}</span>
                </div>
                {inquiryType === 'one-on-one' ? (
                  <>
                    {selectedInquiry.title && (
                      <div className="admin-inquiry-detail__row">
                        <span>제목</span>
                        <span>{selectedInquiry.title}</span>
                      </div>
                    )}
                    <div className="admin-inquiry-detail__row">
                      <span>유형</span>
                      <span>{selectedInquiry.type || '일반'}</span>
                    </div>
                    <div className="admin-inquiry-detail__row">
                      <span>내용</span>
                      <span style={{ whiteSpace: 'pre-wrap' }}>{selectedInquiry.content || '-'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="admin-inquiry-detail__row">
                      <span>상품</span>
                      <span>{selectedInquiry.productId?.name || selectedInquiry.product?.name || '-'}</span>
                    </div>
                    <div className="admin-inquiry-detail__row">
                      <span>문의 내용</span>
                      <span style={{ whiteSpace: 'pre-wrap' }}>{selectedInquiry.question || '-'}</span>
                    </div>
                  </>
                )}
                <div className="admin-inquiry-detail__row">
                  <span>상태</span>
                  <span>
                    <span className={`admin-badge admin-badge--${getStatusBadge(selectedInquiry.status).class}`}>
                      {getStatusBadge(selectedInquiry.status).label}
                    </span>
                  </span>
                </div>
                {selectedInquiry.answer && (
                  <>
                    <div className="admin-inquiry-detail__row">
                      <span>답변</span>
                      <span style={{ whiteSpace: 'pre-wrap' }}>
                        {typeof selectedInquiry.answer === 'string' 
                          ? selectedInquiry.answer 
                          : (selectedInquiry.answer.content || selectedInquiry.answer.answer || '-')}
                      </span>
                    </div>
                    {selectedInquiry.answer.answeredAt && (
                      <div className="admin-inquiry-detail__row">
                        <span>답변일</span>
                        <span>{formatDate(selectedInquiry.answer.answeredAt)}</span>
                      </div>
                    )}
                    {selectedInquiry.answer.answeredBy && (
                      <div className="admin-inquiry-detail__row">
                        <span>답변자</span>
                        <span>{selectedInquiry.answer.answeredBy?.name || '-'}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
              {!selectedInquiry.answer && selectedInquiry.status !== 'answered' && (
                <div className="admin-inquiry-answer">
                  <label>답변 작성</label>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="답변 내용을 입력하세요..."
                    rows={5}
                  />
                  <div className="admin-inquiry-answer__actions">
                    <button type="button" className="admin-button" onClick={() => {
                      setSelectedInquiry(null);
                      setAnswer('');
                    }}>
                      취소
                    </button>
                    <button
                      type="button"
                      className="admin-button admin-button--primary"
                      onClick={handleAnswer}
                      disabled={answering || !answer.trim()}
                    >
                      {answering ? '답변 중...' : '답변 등록'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="admin-card admin-card--stat">
      <div className="admin-card__stat-icon">
        <Icon className="admin-icon" size={24} />
      </div>
      <div className="admin-card__stat-body">
        <div className="admin-card__label">{label}</div>
        <div className="admin-card__value">{value}</div>
      </div>
    </div>
  );
}

export default InquiriesPage;

