import { useEffect, useRef, useState } from 'react';
import { LogOut, UserRound, ChevronDown } from 'lucide-react';
import SessionTimer from './SessionTimer';

const NAV_LINKS = ['New', 'Collections', 'Categories', 'About'];
const CATEGORIES = ['상의', '하의', '악세사리', '아우터', '신발', '기타'];

function MainNavbar({
  user = null,
  onNavigateHome = () => {},
  onMoveToLogin = () => {},
  onMoveToSignUp = () => {},
  onMoveToAdmin = () => {},
  onMoveToCart = () => {},
  onMoveToLookbook = () => {},
  onNavigateToCategory = () => {},
  cartCount = 0,
  onLogout = () => {},
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const userMenuRef = useRef(null);
  const categoriesRef = useRef(null);
  const isAdmin = user?.user_type === 'admin';

  const closeMenu = () => setIsMenuOpen(false);
  const closeUserMenu = () => setIsUserMenuOpen(false);
  const closeCategories = () => setIsCategoriesOpen(false);

  const handleNavigateHome = () => {
    closeMenu();
    closeUserMenu();
    onNavigateHome();
  };

  const handleMoveToLogin = () => {
    closeMenu();
    closeUserMenu();
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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoriesOpen]);

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

  const handleMoveToLookbook = () => {
    closeMenu();
    closeUserMenu();
    closeCategories();
    onMoveToLookbook();
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
            Caurora
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
              if (link === 'Categories') {
                return (
                  <div
                    key={link}
                    className="nav-link-dropdown"
                    ref={categoriesRef}
                    onMouseEnter={() => setIsCategoriesOpen(true)}
                    onMouseLeave={() => setIsCategoriesOpen(false)}
                  >
                    <button type="button" className="nav-link-button nav-link-button--dropdown">
                      {link}
                      <ChevronDown size={16} />
                    </button>
                    {isCategoriesOpen && (
                      <div className="nav-dropdown-menu">
                        {CATEGORIES.map((category) => (
                          <button
                            key={category}
                            type="button"
                            className="nav-dropdown-item"
                            onClick={() => handleNavigateToCategory(category)}
                          >
                            {category}
                          </button>
                        ))}
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
            {isAdmin && (
              <button type="button" className="nav-cta nav-cta--solid" onClick={handleMoveToAdmin}>
                Admin Dashboard
              </button>
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
                    <button type="button" className="nav-user__logout" onClick={handleLogout}>
                      <LogOut size={16} />
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button type="button" className="nav-cta nav-cta--ghost" onClick={handleMoveToLogin}>
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

