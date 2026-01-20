import { useCallback, useEffect, useRef, useState } from 'react';
import './App.css';
import HomeHero from './components/HomeHero';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import MainNavbar from './components/MainNavbar';
import SiteFooter from './components/SiteFooter';
import ProductCreatePage from './components/ProductCreatePage';
import { loadSession, clearSession, saveSession, updateActivityTime, getRemainingTime, getTrustedDevice, clearTrustedDevice } from './utils/sessionStorage';
import { fetchCurrentSession, logout as requestLogout } from './services/authService';
import { autoLogin } from './services/trustedDeviceService';
import { fetchCart } from './services/cartService';
import ProductDetailPage from './components/ProductDetailPage';
import LookbookPage from './components/LookbookPage';
import StyleNotePage from './components/StyleNotePage';
import CartPage from './components/CartPage';
import OrderPage from './components/OrderPage';
import WishlistPage from './components/WishlistPage';
import SettingsPage from './components/SettingsPage';
import PointsPage from './components/PointsPage';
import MyPage from './components/MyPage';
import OrderListPage from './components/OrderListPage';
import ExchangeReturnPage from './components/ExchangeReturnPage';
import ShippingReturnPolicyPage from './components/ShippingReturnPolicyPage';
import TrackingPage from './components/TrackingPage';
import ChatWidget from './components/ChatWidget';
import CancelReturnExchangeHistoryPage from './components/CancelReturnExchangeHistoryPage';
import EventBenefitPage from './components/EventBenefitPage';
import FeedbackPage from './components/FeedbackPage';
import InquiryHistoryPage from './components/InquiryHistoryPage';
import ProductInquiryHistoryPage from './components/ProductInquiryHistoryPage';
import NoticePage from './components/NoticePage';
import RecentlyViewedProductsPage from './components/RecentlyViewedProductsPage';
import NewArrivalsPage from './components/NewArrivalsPage';
import AboutPage from './components/AboutPage';
import FaqPage from './components/FaqPage';
import ReviewBoardPage from './components/ReviewBoardPage';
import DeliveryInquiryPage from './components/DeliveryInquiryPage';
import PaymentCancelPage from './components/PaymentCancelPage';
import KakaoSupportPage from './components/KakaoSupportPage';
import TermsPage from './components/TermsPage';
import PrivacyPage from './components/PrivacyPage';
import MarketingPolicyPage from './components/MarketingPolicyPage';
import NotificationCenterPage from './components/NotificationCenterPage';
import ProfileEditPage from './components/ProfileEditPage';
import MoneyTopupPage from './components/MoneyTopupPage';
import CouponPage from './components/CouponPage';
import OrderDetailPage from './components/OrderDetailPage';
import PasswordResetPage from './components/PasswordResetPage';

function App() {
  // URL에서 초기 view 읽기
  const getInitialView = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '') return 'home';
    const view = path.slice(1).split('?')[0]; // '/' 제거 및 쿼리 파라미터 제거
    const validViews = [
      'home',
      'login',
      'signup',
      'password-reset',
      'admin',
      'product-create',
      'product-edit',
      'product-detail',
      'lookbook',
      'style-note',
      'cart',
      'order',
      'order-list',
      'order-detail',
      'tracking',
      'wishlist',
      'settings',
      'points',
      'mypage',
      'notifications',
      'profile-edit',
      'money-topup',
      'coupon',
      'shipping-return-policy',
      'cancel-return-exchange-history',
      'event-benefit',
      'feedback',
      'inquiry-history',
      'product-inquiry-history',
      'notice',
      'recently-viewed-products',
      'new',
      'about',
      'faq',
      'review-board',
      'delivery-inquiry',
      'payment-cancel',
      'kakao-support',
      'terms',
      'privacy',
      'marketing',
    ];
    return validViews.includes(view) ? view : 'home';
  };

  // URL에서 productId 읽기
  const getProductIdFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('productId');
  };

  const [selectedStyleNote, setSelectedStyleNote] = useState(null);
  const [view, setViewState] = useState(getInitialView);
  const [session, setSession] = useState(null);
  const [dashboardInitialNav, setDashboardInitialNav] = useState('Dashboard');
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [directOrderItem, setDirectOrderItem] = useState(null); // 바로구매 아이템
  const [homeCatalogState, setHomeCatalogState] = useState(null);
  const [homeRestoreState, setHomeRestoreState] = useState(null);
  const [pendingHomeRestore, setPendingHomeRestore] = useState(false);
  const lastHomeStateRef = useRef(null);
  const isLoggedIn = Boolean(session?.user);
  const handleCartUpdate = (nextCount) => {
    setCartCount(Math.max(0, Number(nextCount) || 0));
  };
  const handleWishlistUpdate = async () => {
    try {
      const { fetchWishlist } = await import('./services/wishlistService');
      const data = await fetchWishlist();
      setWishlistCount(data.wishlist?.items?.length || 0);
    } catch (error) {
      console.error('찜하기 개수 업데이트 실패:', error);
      setWishlistCount(0);
    }
  };

  const homeInitialState = pendingHomeRestore ? homeRestoreState : null;
  const homeInitialCategory = homeInitialState?.categoryFilter ?? selectedCategory;
  const homeInitialSearchQuery = homeInitialState?.searchQuery ?? null;
  const homeInitialPage = homeInitialState?.currentPage ?? 1;
  const homeInitialScrollY = homeInitialState?.scrollY ?? null;

  // 브라우저 히스토리와 동기화된 setView
  const setView = (newView, options = {}) => {
    const { replace = false, skipHistory = false, state = {} } = options;
    
    if (!skipHistory) {
      const url = newView === 'home' ? '/' : `/${newView}`;
      if (replace) {
        window.history.replaceState({ view: newView, ...state }, '', url);
      } else {
        window.history.pushState({ view: newView, ...state }, '', url);
      }
    }
    
    setViewState(newView);
  };

  const footerBoardViewMap = {
    '카카오톡 상담': 'kakao-support',
    '자주 묻는 질문': 'faq',
    '반품/교환': 'shipping-return-policy',
    '구매후기': 'review-board',
    '배송문의': 'delivery-inquiry',
    '입금/결제/취소': 'payment-cancel',
  };
  const footerLinkViewMap = {
    '이용안내': 'faq',
    '이용약관': 'terms',
    '개인정보취급방침': 'privacy',
  };

  const handleFooterBoardNavigate = (label) => {
    const targetView = footerBoardViewMap[label];
    if (targetView) {
      setView(targetView);
    }
  };

  const handleFooterLinkNavigate = (label) => {
    const targetView = footerLinkViewMap[label];
    if (targetView) {
      setView(targetView);
    }
  };

  const areCatalogStatesEqual = (left, right) => {
    if (!left || !right) {
      return false;
    }
    return (
      left.categoryFilter === right.categoryFilter &&
      left.currentPage === right.currentPage &&
      left.searchQuery === right.searchQuery &&
      left.scrollY === right.scrollY
    );
  };

  const handleCatalogStateChange = useCallback(
    (nextState) => {
      setHomeCatalogState((prev) => {
        const last = lastHomeStateRef.current || prev;
        if (areCatalogStatesEqual(last, nextState)) {
          return prev;
        }
        lastHomeStateRef.current = nextState;
        return nextState;
      });
      if (view === 'home') {
        const url = window.location.pathname + window.location.search;
        const currentState = window.history.state?.homeState;
        if (!areCatalogStatesEqual(currentState, nextState)) {
          window.history.replaceState({ view: 'home', homeState: nextState }, '', url);
        }
      }
    },
    [view]
  );

  const goHome = (options = {}) => {
    const { restoreState = null } = options;
    if (restoreState) {
      setHomeRestoreState(restoreState);
      setPendingHomeRestore(true);
      setSelectedCategory(restoreState.categoryFilter || null);
    } else {
      setHomeRestoreState(null);
      setPendingHomeRestore(false);
    }
    setView('home');
  };

  const handleLogout = async () => {
    if (view === 'admin') {
      setView('home', { replace: true });
    }
    try {
      await requestLogout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
      clearSession();
    } finally {
      setSession(null);
      setView('login', { replace: true });
      setDashboardInitialNav('Dashboard');
      setSelectedStyleNote(null);
      setSelectedProductId(null);
      setSelectedProductData(null);
      setEditingProduct(null);
      handleCartUpdate(0);
    }
  };

  const handleViewProduct = (product) => {
    if (!product) {
      return;
    }
    const productId = product.id || product._id;
    const homeState = view === 'home' ? homeCatalogState : null;
    setSelectedProductId(productId);
    setSelectedProductData(product);
    // URL에 productId를 쿼리 파라미터로 추가
    const url = `/product-detail?productId=${productId}`;
    window.history.pushState({ view: 'product-detail', productId, homeState }, '', url);
    if (homeState) {
      setHomeRestoreState(homeState);
      setPendingHomeRestore(true);
    }
    setViewState('product-detail');
  };

  // 페이지 로드 시 스크롤을 맨 위로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // URL에서 productId 복원 (새로고침 시)
  useEffect(() => {
    if (view === 'product-detail') {
      const urlProductId = getProductIdFromURL();
      if (urlProductId && urlProductId !== selectedProductId) {
        setSelectedProductId(urlProductId);
        // productId만 있고 데이터가 없으면 API에서 로드하도록 함
        if (!selectedProductData) {
          setSelectedProductData(null);
        }
      }
    }
  }, [view]);

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.view) {
        setViewState(state.view);
        if (state.view === 'home' && state.homeState) {
          setHomeRestoreState(state.homeState);
          setPendingHomeRestore(true);
          setSelectedCategory(state.homeState.categoryFilter || null);
        }
        // productId가 state에 있으면 복원
        if (state.productId) {
          setSelectedProductId(state.productId);
        }
      } else {
        // state가 없으면 URL에서 읽기
        const currentView = getInitialView();
        setViewState(currentView);
        // URL에서 productId 읽기
        const urlProductId = getProductIdFromURL();
        if (urlProductId && currentView === 'product-detail') {
          setSelectedProductId(urlProductId);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // 초기 히스토리 상태 설정
    if (window.history.state === null) {
      const initialView = getInitialView();
      window.history.replaceState({ view: initialView }, '', initialView === 'home' ? '/' : `/${initialView}`);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // home 뷰로 전환 시 스크롤을 맨 위로 이동
  useEffect(() => {
    if (view === 'home' && !(pendingHomeRestore && homeRestoreState?.scrollY !== null && homeRestoreState?.scrollY !== undefined)) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [view, pendingHomeRestore, homeRestoreState]);

  useEffect(() => {
    if (view === 'home' && pendingHomeRestore) {
      const id = requestAnimationFrame(() => {
        setPendingHomeRestore(false);
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [view, pendingHomeRestore]);

  useEffect(() => {
    let isMounted = true;
    const stored = loadSession();
    if (stored) {
      setSession({ user: stored.user, token: stored.token });
      fetchCurrentSession()
        .then((user) => {
          if (!isMounted) return;
          if (user) {
            setSession({ user, token: stored.token });
          }
        })
        .catch(() => {
          if (!isMounted) return;
          clearSession();
          setSession(null);
        });
    } else {
      // 세션이 없으면 자동 로그인 시도
      const device = getTrustedDevice();
      if (device && device.deviceId && device.rememberToken) {
        autoLogin(device.deviceId, device.rememberToken)
          .then((data) => {
            if (!isMounted) return;
            const expiresAt = Date.now() + 60 * 60 * 1000; // 60분
            saveSession({
              token: data.token,
              user: data.user,
              expiresAt,
              lastActivityTime: Date.now(),
              deviceId: device.deviceId,
              rememberToken: device.rememberToken,
              deviceExpiresAt: device.expiresAt,
            });
            setSession({ user: data.user, token: data.token });
            // 장바구니 및 찜하기 개수 로드
            fetchCart()
              .then((cartData) => handleCartUpdate(cartData.cart?.items?.length ?? 0))
              .catch(() => handleCartUpdate(0));
            handleWishlistUpdate();
          })
          .catch((error) => {
            if (!isMounted) return;
            console.error('자동 로그인 실패:', error);
            clearTrustedDevice();
          });
      }
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // 활동 감지 및 세션 자동 갱신
  useEffect(() => {
    if (!session?.user) {
      return;
    }

    // 활동 이벤트 리스너
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    let activityTimeout = null;

    const handleActivity = () => {
      // 디바운싱: 마지막 활동 후 1초 후에 갱신
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }

      activityTimeout = setTimeout(() => {
        const remaining = getRemainingTime();
        // 세션이 유효한 경우에만 갱신
        if (remaining > 0) {
          updateActivityTime();
        }
      }, 1000);
    };

    // 이벤트 리스너 등록
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // 주기적으로 세션 확인 (30초마다)
    const sessionCheckInterval = setInterval(() => {
      const remaining = getRemainingTime();
      if (remaining <= 0) {
        clearSession();
        setSession(null);
        setView('login');
      }
    }, 30000);

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
      clearInterval(sessionCheckInterval);
    };
  }, [session?.user]);

  useEffect(() => {
    // 세션이 없으면 장바구니를 가져오지 않음 (401 에러 방지)
    if (!session?.user) {
      handleCartUpdate(0);
      return;
    }
    
    let isMounted = true;
    fetchCart()
      .then((data) => {
        if (!isMounted) return;
        handleCartUpdate(data.cart?.items?.length ?? 0);
      })
      .catch(() => {
        if (!isMounted) return;
        handleCartUpdate(0);
      });
    return () => {
      isMounted = false;
    };
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) {
      setWishlistCount(0);
      setPointsBalance(0);
      return;
    }
    let isMounted = true;
    async function loadCounts() {
      try {
        const [wishlistData, pointsData] = await Promise.all([
          import('./services/wishlistService').then((m) => m.fetchWishlist()),
          import('./services/pointService').then((m) => m.getPoints()),
        ]);
        if (!isMounted) return;
        setWishlistCount(wishlistData.wishlist?.items?.length || 0);
        setPointsBalance(pointsData.availablePoints || 0);
      } catch (error) {
        if (!isMounted) return;
        console.error('개수 로드 실패:', error);
        setWishlistCount(0);
        setPointsBalance(0);
      }
    }
    loadCounts();
    return () => {
      isMounted = false;
    };
  }, [session?.user]);

  const handleLoginSuccess = (data) => {
    console.log('\n=== [App] 로그인 성공 ===');
    console.log('사용자:', data.user?.name || data.user?.email);
    console.log('사용자 ID:', data.user?._id || data.user?.id);
    console.log('deviceId:', data.deviceId);
    console.log('rememberToken:', data.rememberToken ? '있음' : '없음');
    console.log('deviceExpiresAt:', data.deviceExpiresAt);
    console.log('========================\n');
    
    saveSession({
      token: data.token,
      user: data.user,
      expiresAt: data.expiresAt || Date.now() + 60 * 60 * 1000, // 60분
      lastActivityTime: Date.now(),
      deviceId: data.deviceId,
      rememberToken: data.rememberToken,
      deviceExpiresAt: data.deviceExpiresAt,
    });
    setSession({ user: data.user, token: data.token });
    setView('home', { replace: true });
    fetchCart()
      .then((cartData) => handleCartUpdate(cartData.cart?.items?.length ?? 0))
      .catch(() => handleCartUpdate(0));
  };

  if (view === 'admin') {
    return (
      <div className="app app--admin">
        <AdminDashboard
          user={session?.user || null}
          onNavigateToStore={() => setView('home')}
          onLogout={handleLogout}
          onAddProduct={() => {
            setEditingProduct(null);
            setView('product-create');
          }}
          onEditProduct={(product) => {
            setEditingProduct(product);
            setView('product-edit');
          }}
          initialNav={dashboardInitialNav}
          isLoggingOut={view === 'admin' && session === null}
        />
      </div>
    );
  }

  if (view === 'product-create') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <ProductCreatePage
            onBack={() => {
              setDashboardInitialNav('Dashboard');
              setView('admin');
              fetchCurrentSession().catch(() => clearSession());
            }}
            onSubmitSuccess={(product) => {
              setDashboardInitialNav('Products');
              setView('admin');
            }}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'product-edit') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <ProductCreatePage
            product={editingProduct}
            onBack={() => {
              setDashboardInitialNav('Products');
              setView('admin');
              fetchCurrentSession().catch(() => clearSession());
            }}
            onSubmitSuccess={(updatedProduct) => {
              setEditingProduct(updatedProduct);
              setDashboardInitialNav('Products');
              setView('admin');
            }}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
        <ChatWidget 
          user={session?.user || null}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          currentView={view}
          onViewProduct={handleViewProduct}
          onAddToCart={handleCartUpdate}
        />
      </div>
    );
  }

  if (view === 'product-detail') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <ProductDetailPage
            productId={selectedProductId}
            product={selectedProductData}
            onBack={() => {
              const restoreState = window.history.state?.homeState || homeRestoreState;
              if (restoreState) {
                goHome({ restoreState });
              } else {
                goHome();
              }
            }}
            onAddToCartSuccess={handleCartUpdate}
            onViewCart={() => setView('cart')}
            onDirectOrder={(orderItem) => {
              setDirectOrderItem(orderItem);
              setView('order');
            }}
            onViewShippingPolicy={() => {
              const url = `/shipping-return-policy?from=product-detail&productId=${selectedProductId}`;
              window.history.pushState({ view: 'shipping-return-policy' }, '', url);
              setView('shipping-return-policy');
            }}
            onViewProduct={handleViewProduct}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
        <ChatWidget 
          user={session?.user || null}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          currentView={view}
          onViewProduct={handleViewProduct}
          onAddToCart={handleCartUpdate}
        />
      </div>
    );
  }

  if (view === 'lookbook') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <LookbookPage
            onBack={() => setView('home')}
            onOpenStyleNote={(campaign) => {
              setSelectedStyleNote(campaign);
              setView('style-note');
            }}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
        <ChatWidget 
          user={session?.user || null}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          currentView={view}
          onViewProduct={handleViewProduct}
          onAddToCart={handleCartUpdate}
        />
      </div>
    );
  }

  if (view === 'cart') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <CartPage
            onCartChange={handleCartUpdate}
            onProceedToCheckout={() => setView('order')}
            onMoveToWishlist={() => setView('wishlist')}
            onViewProduct={handleViewProduct}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
        <ChatWidget 
          user={session?.user || null}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          currentView={view}
          onViewProduct={handleViewProduct}
          onAddToCart={handleCartUpdate}
        />
      </div>
    );
  }

  if (view === 'order') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <OrderPage
            user={session?.user || null}
            onBackToCart={() => {
              if (directOrderItem) {
                setDirectOrderItem(null);
                // product-detail로 돌아가기 위해 productId 유지
                const urlParams = new URLSearchParams(window.location.search);
                const productId = urlParams.get('productId') || selectedProductId;
                if (productId) {
                  setSelectedProductId(productId);
                  setView('product-detail');
                } else {
                  setView('home');
                }
              } else {
                setView('cart');
              }
            }}
            onOrderPlaced={() => {
              setDirectOrderItem(null);
              setView('home');
            }}
            onCartUpdate={handleCartUpdate}
            directOrderItem={directOrderItem}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
        <ChatWidget 
          user={session?.user || null}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          currentView={view}
          onViewProduct={handleViewProduct}
          onAddToCart={handleCartUpdate}
        />
      </div>
    );
  }

  if (view === 'style-note') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <StyleNotePage
            note={selectedStyleNote}
            onBack={() => {
              setView('lookbook');
            }}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }


  if (view === 'wishlist') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <WishlistPage
            user={session?.user || null}
            onBack={() => setView('home')}
            onViewProduct={handleViewProduct}
            onWishlistChange={handleWishlistUpdate}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'settings') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <SettingsPage
            user={session?.user || null}
            onBack={() => setView('home')}
            onLogout={handleLogout}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'points') {
    return (
      <PointsPage
        user={session?.user || null}
        onBack={() => setView('home')}
      />
    );
  }

  if (view === 'mypage') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <MyPage
            user={session?.user || null}
            onBack={() => setView('home')}
            onMoveToSettings={() => setView('settings')}
            onMoveToNotifications={() => setView('notifications')}
            onMoveToProfileEdit={() => setView('profile-edit')}
            onMoveToPoints={() => setView('points')}
            onMoveToOrder={() => setView('order-list')}
            onMoveToWishlist={() => setView('wishlist')}
            onLogout={handleLogout}
            pointsBalance={pointsBalance}
            onMoveToMoneyTopup={() => setView('money-topup')}
            onMoveToCoupons={() => setView('coupon')}
            onMoveToCancelReturnExchange={() => setView('cancel-return-exchange-history')}
            onMoveToEventBenefit={() => setView('event-benefit')}
            onMoveToFeedback={() => setView('feedback')}
            onMoveToInquiry={() => setView('inquiry-history')}
            onMoveToProductInquiry={() => setView('product-inquiry-history')}
            onMoveToNotice={() => setView('notice')}
            onMoveToRecentlyViewedProducts={() => setView('recently-viewed-products')}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'order-list') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <OrderListPage
            user={session?.user || null}
            onBack={() => setView('mypage')}
            onViewOrderDetail={(order) => {
              setSelectedOrder(order);
              setView('order-detail');
            }}
            onViewProduct={(product) => {
              if (product._id || product.id) {
                setSelectedProductId(product._id || product.id);
                setView('product-detail');
              }
            }}
            onExchangeReturn={(order, orderItem) => {
              setSelectedOrder(order);
              setSelectedOrderItem(orderItem);
              setView('exchange-return');
            }}
            onTrackOrder={(order) => {
              setSelectedOrder(order);
              setView('tracking');
            }}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'tracking') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <TrackingPage
            order={selectedOrder}
            trackingNumber={selectedOrder?.shipping?.trackingNumber}
            carrier={selectedOrder?.shipping?.carrier}
            onBack={() => setView('order-list')}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'exchange-return') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <ExchangeReturnPage
            order={selectedOrder}
            orderItem={selectedOrderItem}
            user={session?.user || null}
            onBack={() => setView('order-list')}
            onSubmit={(data) => {
              console.log('교환/반품 신청 데이터:', data);
              alert('교환/반품 신청이 완료되었습니다.');
              setView('order-list');
            }}
            onNavigateToPolicy={() => {
              window.history.pushState({ view: 'shipping-return-policy' }, '', '/shipping-return-policy?from=exchange-return');
              setView('shipping-return-policy');
            }}
            onChangePickupLocation={() => setView('profile-edit')}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'shipping-return-policy') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <ShippingReturnPolicyPage
            onBack={() => {
              // 이전 페이지로 돌아가기 (히스토리 사용)
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setView('home');
              }
            }}
            isLoggedIn={isLoggedIn}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'cancel-return-exchange-history') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <CancelReturnExchangeHistoryPage
            user={session?.user || null}
            onBack={() => setView('mypage')}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'event-benefit') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <EventBenefitPage onBack={() => setView('mypage')} />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'feedback') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <FeedbackPage
            user={session?.user || null}
            onBack={() => setView('mypage')}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'inquiry-history') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <InquiryHistoryPage
            user={session?.user || null}
            onBack={() => setView('mypage')}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'product-inquiry-history') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <ProductInquiryHistoryPage
            user={session?.user || null}
            onBack={() => setView('mypage')}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'notice') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <NoticePage onBack={() => setView('mypage')} />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  if (view === 'recently-viewed-products') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => goHome()}
          onMoveToLogin={() => setView('login')}
          onMoveToSignUp={() => setView('signup')}
          onMoveToCart={() => setView('cart')}
          onMoveToLookbook={() => setView('lookbook')}
          onNavigateToCategory={(category) => {
            setSelectedCategory(category);
            setView('home');
          }}
          onMoveToAdmin={() => {
            setDashboardInitialNav('Dashboard');
            setView('admin');
          }}
          pointsBalance={pointsBalance}
          onMoveToWishlist={() => setView('wishlist')}
          onMoveToSettings={() => setView('settings')}
          onMoveToPoints={() => setView('points')}
          onMoveToMyPage={() => setView('mypage')}
          cartCount={cartCount}
          wishlistCount={wishlistCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <RecentlyViewedProductsPage
            user={session?.user || null}
            onBack={() => setView('mypage')}
            onViewProduct={(product) => {
              if (product._id || product.id) {
                setSelectedProductId(product._id || product.id);
                setView('product-detail');
              }
            }}
          />
        </main>
        <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      </div>
    );
  }

  const isAuthView = view === 'login' || view === 'signup' || view === 'password-reset';
  const appClassName = view === 'home' ? 'app app--home' : 'app';
  const user = session?.user || null;

  let content = null;

  switch (view) {
    case 'signup':
      content = (
        <div className="auth-layout">
          <SignUpPage
            onBack={() => setView('home')}
            onNavigateToLogin={() => setView('login')}
            onViewTerms={() => setView('terms')}
            onViewPrivacy={() => setView('privacy')}
            onViewMarketing={() => setView('marketing')}
          />
        </div>
      );
      break;
    case 'login':
      content = (
        <div className="auth-layout">
          <LoginPage
            onBack={() => setView('home')}
            onNavigateToSignup={() => setView('signup')}
            onLoginSuccess={handleLoginSuccess}
            onViewPasswordReset={() => setView('password-reset')}
          />
        </div>
      );
      break;
    case 'password-reset':
      content = (
        <div className="auth-layout">
          <PasswordResetPage onBack={() => setView('login')} />
        </div>
      );
      break;
    case 'new':
      content = <NewArrivalsPage onBack={() => setView('home')} />;
      break;
    case 'about':
      content = <AboutPage onBack={() => setView('home')} />;
      break;
    case 'faq':
      content = <FaqPage onBack={() => setView('home')} isLoggedIn={isLoggedIn} />;
      break;
    case 'review-board':
      content = <ReviewBoardPage onBack={() => setView('home')} isLoggedIn={isLoggedIn} />;
      break;
    case 'delivery-inquiry':
      content = <DeliveryInquiryPage onBack={() => setView('home')} isLoggedIn={isLoggedIn} />;
      break;
    case 'payment-cancel':
      content = <PaymentCancelPage onBack={() => setView('home')} isLoggedIn={isLoggedIn} />;
      break;
    case 'kakao-support':
      content = <KakaoSupportPage onBack={() => setView('home')} />;
      break;
    case 'terms':
      content = <TermsPage onBack={() => setView('signup')} />;
      break;
    case 'privacy':
      content = <PrivacyPage onBack={() => setView('signup')} />;
      break;
    case 'marketing':
      content = <MarketingPolicyPage onBack={() => setView('signup')} />;
      break;
    case 'notifications':
      content = <NotificationCenterPage onBack={() => setView('mypage')} />;
      break;
    case 'profile-edit':
      content = <ProfileEditPage user={user} onBack={() => setView('mypage')} />;
      break;
    case 'money-topup':
      content = <MoneyTopupPage onBack={() => setView('mypage')} />;
      break;
    case 'coupon':
      content = <CouponPage onBack={() => setView('mypage')} />;
      break;
    case 'order-detail':
      content = <OrderDetailPage order={selectedOrder} onBack={() => setView('order-list')} />;
      break;
    case 'home':
    default:
      content = (
        <HomeHero
          onMoveToSignUp={() => setView('signup')}
          onMoveToLogin={() => setView('login')}
          onMoveToLookbook={() => setView('lookbook')}
          onMoveToNew={() => setView('new')}
          onWishlistChange={handleWishlistUpdate}
          onViewProduct={handleViewProduct}
          initialCategory={homeInitialCategory}
          initialSearchQuery={homeInitialSearchQuery}
          initialPage={homeInitialPage}
          initialScrollY={homeInitialScrollY}
          onCatalogStateChange={handleCatalogStateChange}
          onCategoryFiltered={() => setSelectedCategory(null)}
        />
      );
      break;
  }

  return (
    <div className={appClassName}>
      <MainNavbar
        user={user}
        onNavigateHome={() => {
          setSelectedCategory(null);
          setView('home');
        }}
        onMoveToLogin={() => setView('login')}
        onMoveToSignUp={() => setView('signup')}
        onMoveToCart={() => setView('cart')}
        onMoveToLookbook={() => setView('lookbook')}
        onMoveToNew={() => setView('new')}
        onMoveToAbout={() => setView('about')}
        onNavigateToCategory={(category) => {
          setSelectedCategory(category);
          setView('home');
        }}
        onMoveToAdmin={() => {
          setDashboardInitialNav('Dashboard');
          setView('admin');
        }}
        onMoveToWishlist={() => setView('wishlist')}
        onMoveToSettings={() => setView('settings')}
        onMoveToPoints={() => setView('points')}
        onMoveToMyPage={() => setView('mypage')}
        pointsBalance={pointsBalance}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onLogout={handleLogout}
      />
      <main className={`app-main ${isAuthView ? 'app-main--auth' : 'app-main--default'}`}>
        {content}
      </main>
      <SiteFooter onNavigateBoard={handleFooterBoardNavigate} onNavigateFooter={handleFooterLinkNavigate} />
      <ChatWidget 
        user={session?.user || null}
        onMoveToLogin={() => setView('login')}
        onMoveToSignUp={() => setView('signup')}
        currentView={view}
      />
    </div>
  );
}

export default App;
