import { useEffect, useState } from 'react';
import './App.css';
import HomeHero from './components/HomeHero';
import SignUpPage from './components/SignUpPage';
import LoginPage from './components/LoginPage';
import AdminDashboard from './components/AdminDashboard';
import MainNavbar from './components/MainNavbar';
import SiteFooter from './components/SiteFooter';
import ProductCreatePage from './components/ProductCreatePage';
import { loadSession, clearSession, saveSession, updateActivityTime, getRemainingTime } from './utils/sessionStorage';
import { fetchCurrentSession, logout as requestLogout } from './services/authService';
import { fetchCart } from './services/cartService';
import ProductDetailPage from './components/ProductDetailPage';
import LookbookPage from './components/LookbookPage';
import StyleNotePage from './components/StyleNotePage';
import CartPage from './components/CartPage';
import OrderPage from './components/OrderPage';

function App() {
  // URL에서 초기 view 읽기
  const getInitialView = () => {
    const path = window.location.pathname;
    if (path === '/' || path === '') return 'home';
    const view = path.slice(1); // '/' 제거
    const validViews = ['home', 'login', 'signup', 'admin', 'product-create', 'product-edit', 'product-detail', 'lookbook', 'style-note', 'cart', 'order'];
    return validViews.includes(view) ? view : 'home';
  };

  const [selectedStyleNote, setSelectedStyleNote] = useState(null);
  const [view, setViewState] = useState(getInitialView);
  const [session, setSession] = useState(null);
  const [dashboardInitialNav, setDashboardInitialNav] = useState('Dashboard');
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const handleCartUpdate = (nextCount) => {
    setCartCount(Math.max(0, Number(nextCount) || 0));
  };

  // 브라우저 히스토리와 동기화된 setView
  const setView = (newView, options = {}) => {
    const { replace = false, skipHistory = false } = options;
    
    if (!skipHistory) {
      const url = newView === 'home' ? '/' : `/${newView}`;
      if (replace) {
        window.history.replaceState({ view: newView }, '', url);
      } else {
        window.history.pushState({ view: newView }, '', url);
      }
    }
    
    setViewState(newView);
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
    setSelectedProductId(product.id);
    setSelectedProductData(product);
    setView('product-detail');
  };

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state;
      if (state && state.view) {
        setViewState(state.view);
      } else {
        // state가 없으면 URL에서 읽기
        const currentView = getInitialView();
        setViewState(currentView);
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

  const handleLoginSuccess = (data) => {
    saveSession({
      token: data.token,
      user: data.user,
      expiresAt: data.expiresAt || Date.now() + 60 * 60 * 1000, // 60분
      lastActivityTime: Date.now(),
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
          onNavigateHome={() => setView('home')}
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
          cartCount={cartCount}
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
        <SiteFooter />
      </div>
    );
  }

  if (view === 'product-edit') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => setView('home')}
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
          cartCount={cartCount}
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
        <SiteFooter />
      </div>
    );
  }

  if (view === 'product-detail') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => setView('home')}
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
          cartCount={cartCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <ProductDetailPage
            productId={selectedProductId}
            product={selectedProductData}
            onBack={() => setView('home')}
            onAddToCartSuccess={handleCartUpdate}
            onViewCart={() => setView('cart')}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (view === 'lookbook') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => setView('home')}
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
          cartCount={cartCount}
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
        <SiteFooter />
      </div>
    );
  }

  if (view === 'cart') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => setView('home')}
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
          cartCount={cartCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <CartPage
            onCartChange={handleCartUpdate}
            onProceedToCheckout={() => setView('order')}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (view === 'order') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => setView('home')}
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
          cartCount={cartCount}
          onLogout={handleLogout}
        />
        <main className="app-main app-main--default">
          <OrderPage
            user={session?.user || null}
            onBackToCart={() => setView('cart')}
            onOrderPlaced={() => setView('home')}
            onCartUpdate={handleCartUpdate}
          />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (view === 'style-note') {
    return (
      <div className="app">
        <MainNavbar
          user={session?.user || null}
          onNavigateHome={() => setView('home')}
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
          cartCount={cartCount}
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
        <SiteFooter />
      </div>
    );
  }

  const isAuthView = view === 'login' || view === 'signup';
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
          />
        </div>
      );
      break;
    case 'home':
    default:
      content = (
        <HomeHero
          onMoveToSignUp={() => setView('signup')}
          onMoveToLogin={() => setView('login')}
          onMoveToLookbook={() => setView('lookbook')}
          onViewProduct={handleViewProduct}
          initialCategory={selectedCategory}
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
        onNavigateToCategory={(category) => {
          setSelectedCategory(category);
          setView('home');
        }}
        onMoveToAdmin={() => {
          setDashboardInitialNav('Dashboard');
          setView('admin');
        }}
        cartCount={cartCount}
        onLogout={handleLogout}
      />
      <main className={`app-main ${isAuthView ? 'app-main--auth' : 'app-main--default'}`}>
        {content}
      </main>
      <SiteFooter />
    </div>
  );
}

export default App;
