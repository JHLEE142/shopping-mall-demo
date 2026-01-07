import { useState, useEffect } from 'react';
import { ArrowRight, Bell, Settings, ChevronRight, UserRound } from 'lucide-react';
import { getUnreviewedProducts } from '../services/reviewService';
import './MyPage.css';

function MyPage({ 
  user, 
  onBack, 
  onMoveToSettings, 
  onMoveToPoints, 
  onMoveToOrder, 
  onMoveToWishlist, 
  onLogout, 
  pointsBalance = 0,
  onMoveToCancelReturnExchange,
  onMoveToEventBenefit,
  onMoveToFeedback,
  onMoveToInquiry,
  onMoveToProductInquiry,
  onMoveToNotice,
  onMoveToRecentlyViewedProducts
}) {
  const [unreviewedProducts, setUnreviewedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 페이지 로드 시 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  useEffect(() => {
    if (!user) return;

    async function loadUnreviewedProducts() {
      try {
        setLoading(true);
        const data = await getUnreviewedProducts();
        setUnreviewedProducts(data.items || []);
      } catch (error) {
        console.error('리뷰 미작성 상품 로드 실패:', error);
        setUnreviewedProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadUnreviewedProducts();
  }, [user]);

  const userInitial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="my-page">
      <div className="my-page__container">
        {/* 헤더 */}
        <header className="my-page__header">
          <h1 className="my-page__title">마이페이지</h1>
          <div className="my-page__header-actions">
            <button type="button" className="my-page__icon-button" aria-label="알림">
              <Bell size={20} />
            </button>
            <button 
              type="button" 
              className="my-page__icon-button" 
              onClick={onMoveToSettings}
              aria-label="설정"
            >
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* 사용자 프로필 섹션 */}
        <section className="my-page__profile-section">
          <div className="my-page__profile-info">
            <div className="my-page__avatar">
              {userInitial}
            </div>
            <div className="my-page__profile-details">
              <button 
                type="button"
                className="my-page__profile-name"
                onClick={() => {/* 프로필 편집 페이지로 이동 */}}
              >
                {user?.name || user?.email || '사용자'} <ChevronRight size={16} />
              </button>
              <div className="my-page__membership">
                LV.2 프렌즈 · 최대 2.5% 적립 · 무료배송
              </div>
            </div>
          </div>
        </section>

        {/* 금액 정보 섹션 */}
        <section className="my-page__balance-section">
          <div className="my-page__balance-item" onClick={onMoveToPoints}>
            <div className="my-page__balance-label">적립금</div>
            <div className="my-page__balance-value">{pointsBalance.toLocaleString()}원</div>
            <ChevronRight size={16} className="my-page__balance-arrow" />
          </div>
          <div className="my-page__balance-item">
            <div className="my-page__balance-label">머니</div>
            <div className="my-page__balance-action">충전하기</div>
            <ChevronRight size={16} className="my-page__balance-arrow" />
          </div>
          <div className="my-page__balance-item">
            <div className="my-page__balance-label">쿠폰</div>
            <div className="my-page__balance-value">0장</div>
            <ChevronRight size={16} className="my-page__balance-arrow" />
          </div>
        </section>

        {/* 작성 가능한 후기 */}
        {unreviewedProducts.length > 0 && (
          <section className="my-page__review-section">
            <div className="my-page__review-count">
              작성 가능한 후기 {unreviewedProducts.length}개
            </div>
          </section>
        )}

        {/* 프로모션 배너 */}
        <section className="my-page__banner">
          <div className="my-page__banner-content">
            <div className="my-page__banner-text">
              <div className="my-page__banner-title">머니 첫 결제 시 10% 추가 적립</div>
              <div className="my-page__banner-subtitle">결제할 땐 자동 충전! 인출도 자유롭게!</div>
            </div>
            <ArrowRight size={20} />
          </div>
        </section>

        {/* 주문 내역 섹션 */}
        <section className="my-page__menu-section">
          <button 
            type="button"
            className="my-page__menu-item"
            onClick={() => {
              if (onMoveToOrder) {
                onMoveToOrder();
              }
            }}
          >
            <div className="my-page__menu-content">
              <div className="my-page__menu-title">주문 내역</div>
              <div className="my-page__menu-subtitle">온·오프라인, 상품권, 티켓 주문 내역 모아보기</div>
            </div>
            <ChevronRight size={20} />
          </button>
          <button 
            type="button" 
            className="my-page__menu-item"
            onClick={() => {
              if (onMoveToCancelReturnExchange) {
                onMoveToCancelReturnExchange();
              }
            }}
          >
            <div className="my-page__menu-content">
              <div className="my-page__menu-title">취소/반품/교환 내역</div>
            </div>
            <ChevronRight size={20} />
          </button>
          <button 
            type="button"
            className="my-page__menu-item"
            onClick={() => {
              if (onMoveToRecentlyViewedProducts) {
                onMoveToRecentlyViewedProducts();
              }
            }}
          >
            <div className="my-page__menu-content">
              <div className="my-page__menu-title">최근 본 상품</div>
            </div>
            <ChevronRight size={20} />
          </button>
        </section>


        {/* 이벤트/혜택 섹션 */}
        <section className="my-page__menu-section">
          <button 
            type="button" 
            className="my-page__menu-item"
            onClick={() => {
              if (onMoveToEventBenefit) {
                onMoveToEventBenefit();
              }
            }}
          >
            <div className="my-page__menu-content">
              <div className="my-page__menu-title">
                이벤트/회원혜택
                <span className="my-page__badge-new">준비중</span>
              </div>
              <div className="my-page__menu-subtitle">출석체크 등 매일 새로운 미션으로 혜택받기</div>
            </div>
            <ChevronRight size={20} />
          </button>
          <button 
            type="button" 
            className="my-page__menu-item"
            onClick={() => {
              if (onMoveToFeedback) {
                onMoveToFeedback();
              }
            }}
          >
            <div className="my-page__menu-content">
              <div className="my-page__menu-title">개선 의견/리서치 참여</div>
            </div>
            <ChevronRight size={20} />
          </button>
        </section>

        {/* 고객센터 섹션 */}
        <section className="my-page__menu-section">
          <div className="my-page__section-title">고객센터</div>
          <button 
            type="button" 
            className="my-page__menu-item"
            onClick={() => {
              if (onMoveToInquiry) {
                onMoveToInquiry();
              }
            }}
          >
            <div className="my-page__menu-content">
              <div className="my-page__menu-title">1:1 문의 내역</div>
            </div>
            <ChevronRight size={20} />
          </button>
          <button 
            type="button" 
            className="my-page__menu-item"
            onClick={() => {
              if (onMoveToProductInquiry) {
                onMoveToProductInquiry();
              }
            }}
          >
            <div className="my-page__menu-content">
              <div className="my-page__menu-title">상품 문의 내역</div>
            </div>
            <ChevronRight size={20} />
          </button>
          <button 
            type="button" 
            className="my-page__menu-item"
            onClick={() => {
              if (onMoveToNotice) {
                onMoveToNotice();
              }
            }}
          >
            <div className="my-page__menu-content">
              <div className="my-page__menu-title">공지사항</div>
            </div>
            <ChevronRight size={20} />
          </button>
        </section>

        {/* 로그아웃 */}
        <section className="my-page__logout-section">
          <button 
            type="button"
            className="my-page__logout-button"
            onClick={onLogout}
          >
            로그아웃
            <ChevronRight size={20} />
          </button>
        </section>
      </div>
    </div>
  );
}

export default MyPage;
