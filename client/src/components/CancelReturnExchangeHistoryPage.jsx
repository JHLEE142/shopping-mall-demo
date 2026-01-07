import { useState, useEffect } from 'react';
import { ArrowLeft, Search, ChevronRight, Package } from 'lucide-react';
import { getExchangeReturns } from '../services/exchangeReturnService';
import './CancelReturnExchangeHistoryPage.css';

function CancelReturnExchangeHistoryPage({ user, onBack }) {
  const [exchangeReturns, setExchangeReturns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) return;

    async function loadExchangeReturns() {
      try {
        setLoading(true);
        setError('');
        const data = await getExchangeReturns({ 
          page: 1, 
          limit: 100,
          status: statusFilter !== 'all' ? statusFilter : undefined
        });
        setExchangeReturns(data.items || []);
      } catch (err) {
        console.error('취소/반품/교환 내역 로드 실패:', err);
        setError(err.message || '취소/반품/교환 내역을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadExchangeReturns();
  }, [user, statusFilter]);

  const getStatusLabel = (status) => {
    const labels = {
      pending: '처리중',
      processing: '처리중',
      completed: '완료',
      rejected: '거절',
      cancelled: '취소됨',
    };
    return labels[status] || status;
  };

  const getSolutionLabel = (solution) => {
    return solution === 'return-refund' ? '반품/환불' : '교환';
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price || 0);
  };

  // 날짜별로 그룹화
  const groupedReturns = exchangeReturns.reduce((acc, item) => {
    const dateKey = formatDate(item.createdAt);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {});

  // 검색 필터링
  const filteredReturns = Object.entries(groupedReturns).reduce((acc, [date, dateReturns]) => {
    const filtered = dateReturns.filter(item => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return item.items?.some(item => 
        item.name?.toLowerCase().includes(query)
      );
    });
    if (filtered.length > 0) {
      acc[date] = filtered;
    }
    return acc;
  }, {});

  const statusFilters = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '처리중' },
    { value: 'processing', label: '처리중' },
    { value: 'completed', label: '완료' },
    { value: 'rejected', label: '거절' },
  ];

  return (
    <div className="cancel-return-exchange-history-page">
      <div className="cancel-return-exchange-history-page__container">
        {/* 헤더 */}
        <header className="cancel-return-exchange-history-page__header">
          <button
            type="button"
            className="cancel-return-exchange-history-page__back-button"
            onClick={onBack}
          >
            <ArrowLeft size={18} />
            뒤로가기
          </button>
          <h1 className="cancel-return-exchange-history-page__title">취소/반품/교환 내역</h1>
          
          {/* 검색바 */}
          <div className="cancel-return-exchange-history-page__search">
            <input
              type="text"
              placeholder="상품명으로 검색할 수 있어요!"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cancel-return-exchange-history-page__search-input"
            />
            <Search size={20} className="cancel-return-exchange-history-page__search-icon" />
          </div>

          {/* 상태 필터 */}
          <div className="cancel-return-exchange-history-page__status-filters">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`cancel-return-exchange-history-page__status-filter ${statusFilter === filter.value ? 'is-active' : ''}`}
                onClick={() => setStatusFilter(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </header>

        {/* 로딩 상태 */}
        {loading && (
          <div className="cancel-return-exchange-history-page__loading">
            취소/반품/교환 내역을 불러오는 중입니다...
          </div>
        )}

        {/* 에러 상태 */}
        {error && (
          <div className="cancel-return-exchange-history-page__error">
            {error}
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && !error && Object.keys(filteredReturns).length === 0 && (
          <div className="cancel-return-exchange-history-page__empty">
            <Package size={48} />
            <p>취소/반품/교환 내역이 없습니다.</p>
          </div>
        )}

        {/* 내역 목록 */}
        {!loading && !error && Object.entries(filteredReturns).map(([date, dateReturns]) => (
          <section key={date} className="cancel-return-exchange-history-page__date-group">
            <h2 className="cancel-return-exchange-history-page__date-title">{date}</h2>
            
            {dateReturns.map((item) => (
              <div key={item._id} className="cancel-return-exchange-history-page__card">
                <div className="cancel-return-exchange-history-page__card-header">
                  <div className="cancel-return-exchange-history-page__card-status">
                    <span className={`cancel-return-exchange-history-page__status-badge cancel-return-exchange-history-page__status-badge--${item.status}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    <span className="cancel-return-exchange-history-page__solution-badge">
                      {getSolutionLabel(item.solution)}
                    </span>
                  </div>
                  <div className="cancel-return-exchange-history-page__card-date">
                    신청일: {formatDate(item.createdAt)}
                  </div>
                </div>

                {item.items?.map((productItem, index) => (
                  <div key={index} className="cancel-return-exchange-history-page__item">
                    <div className="cancel-return-exchange-history-page__item-info">
                      <div className="cancel-return-exchange-history-page__item-name">
                        {productItem.name}
                      </div>
                      <div className="cancel-return-exchange-history-page__item-details">
                        수량: {productItem.quantity}개 · {formatPrice(productItem.unitPrice)}원
                      </div>
                      {item.reasonLabel && (
                        <div className="cancel-return-exchange-history-page__item-reason">
                          사유: {item.reasonLabel}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {item.refundAmount > 0 && (
                  <div className="cancel-return-exchange-history-page__refund-info">
                    환불 예정 금액: <strong>{formatPrice(item.refundAmount)}원</strong>
                  </div>
                )}

                {item.rejectedReason && (
                  <div className="cancel-return-exchange-history-page__rejected-reason">
                    거절 사유: {item.rejectedReason}
                  </div>
                )}

                {item.notes && (
                  <div className="cancel-return-exchange-history-page__notes">
                    메모: {item.notes}
                  </div>
                )}
              </div>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

export default CancelReturnExchangeHistoryPage;

