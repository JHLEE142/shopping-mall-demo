import { useState, useEffect } from 'react';
import { getPoints, getPointHistory } from '../services/pointService';
import { loadSession, updateActivityTime, getRemainingTime } from '../utils/sessionStorage';
import { Circle } from 'lucide-react';
import './PointsPage.css';

function PointsPage({ user, onBack }) {
  const [totalEarned, setTotalEarned] = useState(0); // 총 적립금
  const [availablePoints, setAvailablePoints] = useState(0); // 사용가능 적립금
  const [totalUsed, setTotalUsed] = useState(0); // 사용된 적립금
  const [pointsHistory, setPointsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('all'); // 'all', 'earn', 'use'
  const [showInfo, setShowInfo] = useState(true);

  // 세션 체크 및 업데이트
  useEffect(() => {
    const checkSession = () => {
      const session = loadSession();
      if (!session || !session.token) {
        // 세션이 없으면 로그인 페이지로 이동
        if (onBack) {
          onBack();
        }
        return false;
      }

      // 세션 만료 체크
      const remaining = getRemainingTime();
      if (remaining <= 0) {
        // 세션이 만료되었으면 로그인 페이지로 이동
        if (onBack) {
          onBack();
        }
        return false;
      }

      // 활동 시간 업데이트
      updateActivityTime();
      return true;
    };

    if (!checkSession()) {
      return;
    }

    if (user) {
      loadPointsData();
    } else {
      setLoading(false);
    }
  }, [user, page, filterType, onBack]);

  const loadPointsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 필터 타입에 따라 서버에서 필터링된 데이터 가져오기
      const historyType = filterType === 'all' ? undefined : filterType;
      
      const [pointsData, historyData] = await Promise.all([
        getPoints(),
        getPointHistory({ page, limit: 20, type: historyType }),
      ]);

      // 총 적립금 현황
      setTotalEarned(pointsData.totalEarned || 0);
      
      // 사용가능 적립금 현황
      setAvailablePoints(pointsData.availablePoints || 0);
      
      // 사용된 적립금 현황
      setTotalUsed(pointsData.totalUsed || 0);
      
      // 적립금 내역 (서버에서 이미 필터링됨)
      setPointsHistory(historyData.items || []);
      setTotalPages(historyData.totalPages || 1);
    } catch (err) {
      console.error('적립금 정보 로드 실패:', err);
      
      // 401 에러 또는 세션 만료 에러인 경우
      if (err.message?.includes('401') || 
          err.message?.includes('로그인 세션이 만료') || 
          err.message?.includes('로그인이 필요') ||
          err.message?.includes('Unauthorized')) {
        // 세션 체크
        const session = loadSession();
        if (!session || getRemainingTime() <= 0) {
          // 세션이 만료되었으면 로그인 페이지로 이동
          if (onBack) {
            onBack();
          }
          return;
        }
      }
      
      setError(err.message || '적립금 정보를 불러오는데 실패했습니다.');
      setTotalEarned(0);
      setAvailablePoints(0);
      setTotalUsed(0);
      setPointsHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="points-page">
      <div className="points-wrapper">
        <div className="points-container">
          <header className="points-page-header">
            <button className="points-back-link" type="button" onClick={onBack}>
              ← 뒤로가기
            </button>
            <h1 className="points-page-title">적립금</h1>
          </header>

          <div className="points-layout">
          {/* 왼쪽: 적립금 잔액 카드 */}
          <aside className="points-sidebar">
            <div className="points-balance-card">
              <div className="points-balance-header">
                <h2 className="points-balance-title">적립금</h2>
                <button
                  type="button"
                  className="points-info-link"
                  onClick={() => setShowInfo(!showInfo)}
                  title="적립 기준"
                >
                  ?
                </button>
              </div>
              <div className="points-balance-display">
                <div className="points-balance-icon">
                  <Circle size={48} fill="#000000" color="#000000" />
                </div>
                <div className="points-balance-amount">
                  {availablePoints.toLocaleString()}
                </div>
              </div>
              <div className="points-balance-summary">
                <div className="points-summary-item">
                  <span className="points-summary-label">총 적립금</span>
                  <span className="points-summary-value">{totalEarned.toLocaleString()}원</span>
                </div>
                <div className="points-summary-item">
                  <span className="points-summary-label">사용된 적립금</span>
                  <span className="points-summary-value">{totalUsed.toLocaleString()}원</span>
                </div>
              </div>
            </div>
          </aside>

          {/* 오른쪽: 적립 규칙 및 내역 */}
          <main className="points-main">
            {/* 적립 규칙 안내 */}
            {showInfo && (
              <div className="points-info-card">
                <div className="points-info-header">
                  <h3 className="points-info-title">적립금은 어떻게 적립되나요?</h3>
                  <button
                    type="button"
                    className="points-info-close"
                    onClick={() => setShowInfo(false)}
                  >
                    닫기
                  </button>
                </div>
                <div className="points-info-content">
                  <p>
                    상품 구매 시 결제 금액의 1%가 적립됩니다. 리뷰 작성 시 1,000원이 적립됩니다.
                    적립금은 1원 단위로 사용 가능하며, 유효기간이 없습니다.
                  </p>
                </div>
              </div>
            )}

            {/* 적립 내역 */}
            <div className="points-history-card">
              <div className="points-history-header">
                <h3 className="points-history-title">적립내역</h3>
                <div className="points-history-filters">
                  <div className="points-filter-tabs">
                    <button
                      type="button"
                      className={`points-filter-tab ${filterType === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterType('all')}
                    >
                      전체
                    </button>
                    <button
                      type="button"
                      className={`points-filter-tab ${filterType === 'earn' ? 'active' : ''}`}
                      onClick={() => setFilterType('earn')}
                    >
                      적립
                    </button>
                    <button
                      type="button"
                      className={`points-filter-tab ${filterType === 'use' ? 'active' : ''}`}
                      onClick={() => setFilterType('use')}
                    >
                      사용
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="points-loading">적립금 정보를 불러오는 중...</div>
              ) : error ? (
                <div className="points-error">{error}</div>
              ) : pointsHistory.length === 0 ? (
                <div className="points-empty">적립금 내역이 없습니다.</div>
              ) : (
                <>
                  <div className="points-history-table">
                    <div className="points-history-table-header">
                      <div className="points-table-col-category">구분</div>
                      <div className="points-table-col-content">내용</div>
                      <div className="points-table-col-amount">내역</div>
                      <div className="points-table-col-balance">잔여 적립금</div>
                    </div>
                    <div className="points-history-table-body">
                      {pointsHistory.map((item) => (
                        <div key={item._id} className="points-history-table-row">
                          <div className="points-table-col-category">
                            <span className={`points-category-badge points-category-badge--${item.type}`}>
                              {item.type === 'earn' ? '적립' : item.type === 'use' ? '사용' : item.type}
                            </span>
                          </div>
                          <div className="points-table-col-content">
                            <div className="points-content-description">{item.description}</div>
                            <div className="points-content-date">{formatDateShort(item.createdAt)}</div>
                          </div>
                          <div className="points-table-col-amount">
                            <span className={`points-amount ${item.type === 'earn' ? 'points-amount--positive' : 'points-amount--negative'}`}>
                              {item.type === 'earn' ? '+' : '-'}
                              {Math.abs(item.amount).toLocaleString()}원
                            </span>
                          </div>
                          <div className="points-table-col-balance">
                            {item.balance.toLocaleString()}원
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {totalPages > 1 && (
                    <div className="points-pagination">
                      <button
                        type="button"
                        className="points-pagination-button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        이전
                      </button>
                      <span className="points-pagination-info">
                        {page} / {totalPages}
                      </span>
                      <button
                        type="button"
                        className="points-pagination-button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        다음
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PointsPage;
