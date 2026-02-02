import { useEffect, useRef, useState } from 'react';
import { LogOut, UserRound, ChevronDown, Bell, Heart, Settings } from 'lucide-react';
import SessionTimer from './SessionTimer';
import { fetchCategories } from '../services/categoryService';
import { getUnreviewedProducts } from '../services/reviewService';
import LogoImage from '../assets/고귀몰_로고_홈버튼_수정.png';

const NAV_LINKS = ['New', 'Collections', 'Categories', 'About'];

function MainNavbar({
  user = null,
  onNavigateHome = () => {},
  onMoveToLogin = () => {},
  onMoveToSignUp = () => {},
  onMoveToAdmin = () => {},
  onMoveToCart = () => {},
  onMoveToLookbook = () => {},
  onMoveToNew = null,
  onMoveToAbout = null,
  onNavigateToCategory = () => {},
  onMoveToWishlist = () => {},
  onMoveToSettings = () => {},
  onMoveToPoints = () => {},
  onMoveToMyPage = () => {},
  cartCount = 0,
  wishlistCount = 0,
  pointsBalance = 0,
  onLogout = () => {},
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [unreviewedProducts, setUnreviewedProducts] = useState([]);
  const [unreviewedLoading, setUnreviewedLoading] = useState(false);
  const userMenuRef = useRef(null);
  const categoriesRef = useRef(null);
  const notificationRef = useRef(null);
  const isAdmin = user?.user_type === 'admin';

  // 카테고리 목록 로드 (등록된 상품의 카테고리만 표시)
  useEffect(() => {
    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        // 등록된 상품의 카테고리만 조회 (상품 데이터 기반)
        const categories = await fetchCategories({ includeProductCount: true });
        // 상품이 있는 카테고리만 필터링
        const categoriesWithProducts = categories.filter(cat => (cat.productCount || 0) > 0);
        // console.log('카테고리 로드 성공:', categoriesWithProducts?.length || 0, '개');
        setCategories(categoriesWithProducts || []);
      } catch (error) {
        console.error('카테고리 로드 실패:', error.message);
        // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    }
    loadCategories();
  }, []);

  // 리뷰 미작성 상품 목록 로드
  useEffect(() => {
    if (!user) {
      setUnreviewedProducts([]);
      return;
    }

    async function loadUnreviewedProducts() {
      try {
        setUnreviewedLoading(true);
        const data = await getUnreviewedProducts();
        // 유효한 상품만 필터링 (productId와 productName이 있는 것만)
        const validProducts = (data.items || []).filter(item => 
          item.productId && 
          item.productName && 
          item.productName.trim() !== '' &&
          item.productName !== 'undefined'
        );
        setUnreviewedProducts(validProducts);
      } catch (error) {
        // 콘솔 에러를 표시하지 않음 (사용자 요청)
        setUnreviewedProducts([]);
      } finally {
        setUnreviewedLoading(false);
      }
    }

    loadUnreviewedProducts();
    // 30초마다 갱신
    const interval = setInterval(loadUnreviewedProducts, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const closeMenu = () => setIsMenuOpen(false);
  const closeUserMenu = () => setIsUserMenuOpen(false);
  const closeCategories = () => setIsCategoriesOpen(false);
  const closeNotification = () => setIsNotificationOpen(false);

  const toggleNotification = () => {
    setIsNotificationOpen((prev) => !prev);
    closeUserMenu();
    closeMenu();
  };

  const handleNavigateHome = () => {
    closeMenu();
    closeUserMenu();
    closeCategories();
    // 페이지 맨 위로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // 홈으로 이동
    onNavigateHome();
  };

  const handleMoveToLogin = (e) => {
    e?.preventDefault();
    closeMenu();
    closeUserMenu();
    window.scrollTo({ top: 0, behavior: 'instant' });
    onMoveToLogin();
  };

  const handleMoveToSignUp = () => {
    closeMenu();
    closeUserMenu();
    onMoveToSignUp();
  };

  const handleMoveToAdmin = () => {
    closeMenu();
    closeUserMenu();
    onMoveToAdmin();
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
    closeUserMenu();
  };

  useEffect(() => {
    if (!isUserMenuOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    if (!isCategoriesOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (categoriesRef.current && !categoriesRef.current.contains(event.target)) {
        setIsCategoriesOpen(false);
      }
    }

    // 약간의 지연을 두어 버튼 클릭 이벤트가 먼저 처리되도록 함
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoriesOpen]);

  useEffect(() => {
    if (!isNotificationOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  const toggleUserMenu = () => {
    setIsUserMenuOpen((prev) => !prev);
    closeMenu();
  };

  const handleLogout = () => {
    closeUserMenu();
    onLogout();
  };

  const handleMoveToCart = () => {
    closeMenu();
    closeUserMenu();
    onMoveToCart();
  };


  const handleMoveToWishlist = () => {
    closeMenu();
    closeUserMenu();
    onMoveToWishlist();
  };

  const handleMoveToSettings = () => {
    closeMenu();
    closeUserMenu();
    onMoveToSettings();
  };

  const handleMoveToPoints = () => {
    closeMenu();
    closeUserMenu();
    onMoveToPoints();
  };

  const handleMoveToMyPage = () => {
    closeMenu();
    closeUserMenu();
    onMoveToMyPage();
  };

  const handleMoveToLookbook = () => {
    closeMenu();
    closeUserMenu();
    closeCategories();
    onMoveToLookbook();
  };

  const handleMoveToNew = () => {
    closeMenu();
    closeUserMenu();
    if (onMoveToNew) {
      onMoveToNew();
    } else {
      window.location.href = '/new';
    }
  };

  const handleMoveToAbout = () => {
    closeMenu();
    closeUserMenu();
    if (onMoveToAbout) {
      onMoveToAbout();
    } else {
      window.location.href = '/about';
    }
  };

  const handleNavigateToCategory = (category) => {
    closeMenu();
    closeUserMenu();
    closeCategories();
    onNavigateToCategory(category);
  };

  const userInitial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="home-header">
      <nav className="home-nav">
        <div className="nav-left">
          <button type="button" className="nav-brand nav-brand--button" onClick={handleNavigateHome}>
            <img src={LogoImage} alt="고귀몰" className="nav-brand__logo" />
          </button>
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'is-open' : ''}`}>
          <div className="nav-links">
            {NAV_LINKS.map((link) => {
              if (link === 'Collections') {
                return (
                  <button
                    key={link}
                    type="button"
                    className="nav-link-button"
                    onClick={handleMoveToLookbook}
                  >
                    {link}
                  </button>
                );
              }
              if (link === 'New') {
                return (
                  <button
                    key={link}
                    type="button"
                    className="nav-link-button"
                    onClick={handleMoveToNew}
                  >
                    {link}
                  </button>
                );
              }
              if (link === 'About') {
                return (
                  <button
                    key={link}
                    type="button"
                    className="nav-link-button"
                    onClick={handleMoveToAbout}
                  >
                    {link}
                  </button>
                );
              }
              if (link === 'Categories') {
                return (
                  <div
                    key={link}
                    className="nav-link-dropdown"
                    ref={categoriesRef}
                  >
                    <button 
                      type="button" 
                      className="nav-link-button nav-link-button--dropdown"
                      onClick={() => setIsCategoriesOpen((prev) => !prev)}
                      aria-expanded={isCategoriesOpen}
                      aria-haspopup="true"
                    >
                      {link}
                      <ChevronDown size={16} style={{ transform: isCategoriesOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </button>
                    {isCategoriesOpen && (
                      <div className="nav-dropdown-menu">
                        {categoriesLoading ? (
                          <div className="nav-dropdown-item" style={{ color: '#6b7280', cursor: 'default' }}>
                            로딩 중...
                          </div>
                        ) : categories.length > 0 ? (
                          categories.map((category) => (
                            <button
                              key={category._id || category.code}
                              type="button"
                              className="nav-dropdown-item"
                              onClick={() => {
                                handleNavigateToCategory(category.name);
                                setIsCategoriesOpen(false);
                              }}
                            >
                              {category.name}
                            </button>
                          ))
                        ) : (
                          <div className="nav-dropdown-item" style={{ color: '#6b7280', cursor: 'default' }}>
                            카테고리가 없습니다
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <button key={link} type="button" className="nav-link-button" onClick={closeMenu}>
                  {link}
                </button>
              );
            })}
          </div>
          <div className="nav-actions">
            <div className="nav-cart">
              <button
                type="button"
                className="nav-cart__button"
                onClick={handleMoveToCart}
                aria-label="장바구니 보기"
              >
                <span className="nav-cart__icon" aria-hidden="true">
                  🛒
                </span>
                {cartCount > 0 && <span className="nav-cart__badge">{cartCount}</span>}
              </button>
            </div>
            {user && (
              <div className="nav-cart" style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="nav-cart__button"
                  onClick={handleMoveToWishlist}
                  aria-label="찜하기"
                  style={{ position: 'relative' }}
                >
                  <Heart size={20} fill="#ef4444" color="#ef4444" strokeWidth={0} />
                  {wishlistCount > 0 && <span className="nav-cart__badge">{wishlistCount}</span>}
                </button>
              </div>
            )}
            {user && (
              <div className="nav-cart" ref={notificationRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="nav-cart__button"
                  onClick={toggleNotification}
                  aria-label="알림"
                  style={{ position: 'relative' }}
                >
                  <Bell size={20} />
                  {unreviewedProducts.length > 0 && (
                    <span
                      className="nav-cart__badge"
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        minWidth: '18px',
                        height: '18px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {unreviewedProducts.length}
                    </span>
                  )}
                </button>
                {isNotificationOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '0.5rem',
                      width: '320px',
                      maxHeight: '400px',
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 1000,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                      }}
                    >
                      알림 ({unreviewedProducts.length}개)
                    </div>
                    <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
                      {unreviewedLoading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                          로딩 중...
                        </div>
                      ) : unreviewedProducts.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                          알림이 없습니다.
                        </div>
                      ) : (
                        unreviewedProducts.map((item) => (
                          <div
                            key={`${item.productId}-${item.orderNumber}`}
                            style={{
                              padding: '1rem',
                              borderBottom: '1px solid #f3f4f6',
                              display: 'flex',
                              gap: '0.75rem',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9fafb')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
                            onClick={() => {
                              closeNotification();
                              // 리뷰 작성 페이지로 이동
                              const url = new URL(window.location.origin);
                              url.searchParams.set('view', 'review-write');
                              url.searchParams.set('productId', item.productId);
                              url.searchParams.set('fromProduct', item.productId);
                              window.location.href = url.toString();
                            }}
                          >
                            <img
                              src={item.productImage || '/placeholder.png'}
                              alt={item.productName || '상품'}
                              style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                flexShrink: 0,
                              }}
                              onError={(e) => {
                                // 콘솔 에러를 표시하지 않고 조용히 처리
                                if (e.target.src !== '/placeholder.png') {
                                  e.target.src = '/placeholder.png';
                                }
                              }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                  marginBottom: '0.25rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.productName}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                주문일: {item.orderedAt ? (() => {
                                  try {
                                    return new Date(item.orderedAt).toLocaleDateString('ko-KR');
                                  } catch (e) {
                                    return '날짜 정보 없음';
                                  }
                                })() : '날짜 정보 없음'}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.7rem',
                                  color: '#6366f1',
                                  marginTop: '0.25rem',
                                  fontWeight: 500,
                                }}
                              >
                                리뷰 작성하기 →
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {isAdmin && (
              <button type="button" className="nav-cta nav-cta--solid" onClick={handleMoveToAdmin}>
                Admin Dashboard
              </button>
            )}
            {user && (
              <>
                <div className="nav-points">
                  <span className="nav-points__label">적립금 :</span>
                  <span 
                    className="nav-points__amount" 
                    onClick={handleMoveToPoints}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleMoveToPoints();
                      }
                    }}
                  >
                    {pointsBalance.toLocaleString()}원
                  </span>
                </div>
                <button 
                  type="button" 
                  className="nav-cta nav-cta--ghost" 
                  onClick={handleMoveToMyPage}
                >
                  마이페이지
                </button>
              </>
            )}
            {user ? (
              <div className="nav-user" ref={userMenuRef}>
                <button
                  type="button"
                  className="nav-user__button"
                  onClick={toggleUserMenu}
                  aria-haspopup="true"
                  aria-expanded={isUserMenuOpen}
                >
                  <span className="nav-user__avatar" aria-hidden="true">
                    <UserRound size={18} />
                  </span>
                  <span className="nav-user__label">
                    {user?.name || user?.email || '익명 사용자'}
                  </span>
                  {user && (
                    <span className="nav-user__timer">
                      <SessionTimer onExpired={onLogout} />
                    </span>
                  )}
                  <span className="nav-user__caret" aria-hidden="true" />
                </button>
                {isUserMenuOpen && (
                  <div className="nav-user__menu">
                    <div className="nav-user__info">
                      <div className="nav-user__badge">{userInitial}</div>
                      <div className="nav-user__details">
                        <strong>{user?.name || '이름 미등록'}</strong>
                        <span>{user?.email || '이메일 정보 없음'}</span>
                        <span className="nav-user__role">{user?.user_type || 'member'}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="nav-cta nav-cta--ghost"
                      onClick={handleMoveToSettings}
                      style={{ width: '100%', marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                      <Settings size={16} />
                      환경설정
                    </button>
                    <button type="button" className="nav-user__logout" onClick={handleLogout}>
                      <LogOut size={16} />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button 
                  type="button" 
                  className="nav-cta nav-cta--ghost" 
                  onClick={handleMoveToLogin}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  로그인
                </button>
                <button type="button" className="nav-cta nav-cta--solid" onClick={handleMoveToSignUp}>
                  회원가입
                </button>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`nav-toggle ${isMenuOpen ? 'is-open' : ''}`}
          onClick={toggleMenu}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
    </header>
  );
}

export default MainNavbar;

