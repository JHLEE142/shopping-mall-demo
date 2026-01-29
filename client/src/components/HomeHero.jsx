import { useEffect, useMemo, useState, useRef } from 'react';
import { Heart, ShoppingBag, Star, ChevronLeft, ChevronRight, Search, ChevronDown } from 'lucide-react';
import { fetchProducts, searchProducts as searchProductsAPI } from '../services/productService';
import { fetchCategories } from '../services/categoryService';
import { addWishlistItem, removeWishlistItem, checkWishlistItems } from '../services/wishlistService';
import { subscribeToNewProducts, getSubscriptionStatus } from '../services/notificationService';
import { loadSession } from '../utils/sessionStorage';

// 슬라이드 데이터 (10개) - 귀여운 고귀몰 테마
const SLIDE_DATA = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1608848461950-0fe51dfc41cb?w=1920&h=800&fit=crop',
    title: '🐱 고귀한 하루의 시작',
    subtitle: '귀여운 캐릭터와 함께하는 특별한 쇼핑',
    buttonText: '신상품 보기',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=1920&h=800&fit=crop',
    title: '👑 왕관을 쓴 특별한 아이템',
    subtitle: '고귀몰만의 프리미엄 컬렉션',
    buttonText: '컬렉션 보기',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1920&h=800&fit=crop',
    title: '✨ 귀여운 일상의 발견',
    subtitle: '매일매일 특별한 순간을 만들어요',
    buttonText: '베스트 보기',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1920&h=800&fit=crop',
    title: '💝 사랑스러운 선물 아이디어',
    subtitle: '소중한 사람에게 전하는 마음',
    buttonText: '선물 보기',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=1920&h=800&fit=crop',
    title: '🎀 달콤한 라이프스타일',
    subtitle: '귀여움 가득한 생활용품 모음',
    buttonText: '라이프 보기',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1920&h=800&fit=crop',
    title: '🌟 특별한 날을 위한 준비',
    subtitle: '기념일에 어울리는 아이템들',
    buttonText: '기념일 보기',
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1920&h=800&fit=crop',
    title: '💖 따뜻한 감성 아이템',
    subtitle: '마음을 따뜻하게 만드는 상품들',
    buttonText: '감성 보기',
  },
  {
    id: 8,
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=1920&h=800&fit=crop',
    title: '🎁 행복한 쇼핑의 시작',
    subtitle: '고귀몰과 함께하는 즐거운 하루',
    buttonText: '쇼핑 시작하기',
  },
  {
    id: 9,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&h=800&fit=crop',
    title: '🌸 봄날의 특별한 선물',
    subtitle: '계절에 맞는 귀여운 아이템',
    buttonText: '시즌 보기',
  },
  {
    id: 10,
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=800&fit=crop',
    title: '💎 프리미엄 특가 세일',
    subtitle: '합리적인 가격의 고품질 상품',
    buttonText: '세일 보기',
  },
];

function mapProductsToCatalog(products = []) {
  const formatter = new Intl.NumberFormat('ko-KR');

  return products.map((product, index) => {
    const basePrice = Number(product.price || 0);
    const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
    const discountRate = product.discountRate ? Number(product.discountRate) : 0;
    
    // 할인율이 있고 원래 가격이 있으면 할인 표시
    let formattedPrice = basePrice ? `${formatter.format(basePrice)}원` : '가격 문의';
    let priceSecondary = null;
    let badge = null;
    
    // 할인율이 있거나 원래 가격이 현재 가격보다 크면 할인 표시
    if (discountRate > 0 && originalPrice && originalPrice > basePrice) {
      formattedPrice = `${formatter.format(basePrice)}원`;
      priceSecondary = `${formatter.format(originalPrice)}원`;
      badge = `${Math.round(discountRate)}%`;
    } else if (originalPrice && originalPrice > basePrice) {
      // 할인율이 없어도 원래 가격이 더 크면 할인율 계산
      const calculatedDiscountRate = Math.round(((originalPrice - basePrice) / originalPrice) * 100);
      if (calculatedDiscountRate > 0) {
        formattedPrice = `${formatter.format(basePrice)}원`;
        priceSecondary = `${formatter.format(originalPrice)}원`;
        badge = `${calculatedDiscountRate}%`;
      }
    }

    // 실제 colors 사용 (없으면 빈 배열)
    const colors = (product.colors && Array.isArray(product.colors) && product.colors.length > 0)
      ? product.colors.map((color) => ({
          name: color.name || '색상',
          value: color.value || '#000000',
        }))
      : [];

    // 실제 rating/reviewCount 사용 (없으면 0.0(0))
    const rating = product.rating !== undefined ? product.rating : 0;
    const reviewCount = product.reviewCount !== undefined ? product.reviewCount : 0;

    return {
      id: product._id,
      name: product.name,
      rating,
      reviews: reviewCount,
      pricePrimary: formattedPrice,
      priceSecondary: priceSecondary,
      badge: badge,
      colors, // 실제 colors 사용 (없으면 빈 배열)
      image:
        product.image ||
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80',
      detail: {
        id: product._id,
        category: product.category || '상의',
        price: basePrice,
        originalPrice: originalPrice,
        discountRate: discountRate,
        description: product.description,
        image: product.image,
      },
    };
  });
}

function HomeHero({
  onMoveToSignUp,
  onMoveToLogin,
  onMoveToLookbook = () => {},
  onMoveToNew = () => {},
  onMoveToLoyaltyHall = () => {},
  onViewProduct = () => {},
  onWishlistChange = () => {},
  initialCategory = null,
  initialSearchQuery = null,
  initialPage = 1,
  initialScrollY = null,
  onCatalogStateChange = () => {},
  onCategoryFiltered = () => {},
}) {
  const [products, setProducts] = useState([]);
  const [productsStatus, setProductsStatus] = useState('idle');
  const [sortOption, setSortOption] = useState('featured');
  const [filterOption, setFilterOption] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState(initialSearchQuery || '');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const itemsPerPage = 40;
  const [currentSlide, setCurrentSlide] = useState(0);
  const catalogToolbarRef = useRef(null);
  const searchInputRef = useRef(null);
  const isInitialLoad = useRef(true);
  const previousSearchQuery = useRef(null);
  const searchInputValueRef = useRef(initialSearchQuery || '');
  const hasRestoredScroll = useRef(false);
  const hasAppliedInitialPage = useRef(false);
  const heroTouchStartX = useRef(null);
  const catalogStateRef = useRef({
    categoryFilter,
    currentPage: initialPage || 1,
    searchQuery: initialSearchQuery || '',
  });
  const [wishlistedItems, setWishlistedItems] = useState(new Set());
  const [togglingWishlist, setTogglingWishlist] = useState(new Set());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [loyaltyDropdownOpen, setLoyaltyDropdownOpen] = useState(false);

  // 페이지 로드 시 스크롤 복원 제어
  useEffect(() => {
    // 브라우저의 스크롤 복원 방지
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    if (initialScrollY === null || initialScrollY === undefined) {
      // 즉시 스크롤을 상단으로 이동
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    isInitialLoad.current = false;
  }, []);

  useEffect(() => {
    if (!hasAppliedInitialPage.current && initialPage && initialPage !== currentPage) {
      setCurrentPage(initialPage);
      hasAppliedInitialPage.current = true;
    }
  }, [initialPage, currentPage]);

  // 카테고리 목록 로드
  useEffect(() => {
    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        const data = await fetchCategories({ includeProductCount: true });
        // console.log('카테고리 로드 성공:', data?.length || 0, '개');
        setCategories(data || []);
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

  // 찜하기 상태 로드
  useEffect(() => {
    const session = loadSession();
    if (!session?.user) {
      setWishlistedItems(new Set());
      return;
    }

    async function loadWishlistStatus() {
      try {
        const productIds = products.map((p) => p._id || p.id).filter(Boolean);
        if (productIds.length === 0) return;

        const data = await checkWishlistItems(productIds);
        setWishlistedItems(new Set(data.wishlistedItems || []));
      } catch (error) {
        console.error('찜하기 상태 로드 실패:', error.message);
      }
    }

    if (products.length > 0) {
      loadWishlistStatus();
    }
  }, [products]);

  // 알림 구독 상태 확인
  useEffect(() => {
    const session = loadSession();
    if (!session?.user) {
      setIsSubscribed(false);
      return;
    }

    async function checkSubscriptionStatus() {
      try {
        const data = await getSubscriptionStatus();
        setIsSubscribed(data.subscribed || false);
      } catch (error) {
        console.error('구독 상태 확인 실패:', error.message);
        setIsSubscribed(false);
      }
    }

    checkSubscriptionStatus();
  }, []);

  // initialCategory가 변경되면 categoryFilter 업데이트
  useEffect(() => {
    if (initialCategory) {
      setCategoryFilter(initialCategory);
      setSearchQuery('');
      setCurrentPage(initialPage || 1);
    }
  }, [initialCategory, initialPage]);

  // initialSearchQuery가 변경되면 searchQuery 업데이트
  useEffect(() => {
    if (initialSearchQuery !== null && initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      searchInputValueRef.current = initialSearchQuery;
      if (searchInputRef.current) {
        searchInputRef.current.value = initialSearchQuery;
      }
      setCategoryFilter(null);
      setCurrentPage(initialPage || 1);
    }
  }, [initialSearchQuery, initialPage]);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setProductsStatus('loading');
        
        // submittedSearchQuery가 있으면 Hybrid 검색 API 사용, 없으면 일반 상품 목록 API 사용
        let data;
        if (submittedSearchQuery && submittedSearchQuery.trim()) {
          // Hybrid 검색 사용 (페이지 번호 전달)
          const searchResult = await searchProductsAPI(submittedSearchQuery.trim(), itemsPerPage, currentPage);
          data = {
            items: searchResult.results || [],
            totalItems: searchResult.total || 0,
            totalPages: searchResult.totalPages || Math.ceil((searchResult.total || 0) / itemsPerPage),
            page: currentPage,
          };
        } else {
          // 일반 상품 목록
          data = await fetchProducts(currentPage, itemsPerPage, categoryFilter, null);
        }
        
        if (!isMounted) return;
        
        // 검색 결과 또는 일반 상품 목록 설정
        const items = data?.items ?? [];
        setProducts(items);
        setTotalPages(data?.totalPages ?? 1);
        setTotalItems(data?.totalItems ?? 0);
        setProductsStatus('success');
        
        // 디버깅: 검색 결과 로그
        if (submittedSearchQuery && submittedSearchQuery.trim()) {
          console.log('검색 결과:', {
            query: submittedSearchQuery,
            count: items.length,
            items: items.map(p => p.name || p._id),
          });
        }
        // 검색 쿼리가 변경되었거나 페이지가 변경되었을 때 스크롤 이동
        if (catalogToolbarRef.current && !isInitialLoad.current) {
          // 검색 쿼리가 변경되었거나, 페이지가 1보다 클 때 스크롤
          const searchChanged = previousSearchQuery.current !== submittedSearchQuery;
          if (searchChanged || currentPage > 1) {
            // 약간의 지연을 두어 DOM 업데이트 후 스크롤
            setTimeout(() => {
              if (catalogToolbarRef.current) {
                const toolbarTop = catalogToolbarRef.current.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({ top: toolbarTop - 20, behavior: 'smooth' });
              }
            }, 100);
          }
        }
        // 검색 쿼리 업데이트
        previousSearchQuery.current = submittedSearchQuery;
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading products:', error);
        setProductsStatus('error');
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [currentPage, categoryFilter, submittedSearchQuery]);

  const handleSlideClick = (index) => {
    setCurrentSlide(index);
  };

  const handleHeroTouchStart = (event) => {
    if (event.touches && event.touches.length > 0) {
      heroTouchStartX.current = event.touches[0].clientX;
    }
  };

  const handleHeroTouchEnd = (event) => {
    if (!heroTouchStartX.current || !event.changedTouches || event.changedTouches.length === 0) {
      heroTouchStartX.current = null;
      return;
    }
    const deltaX = event.changedTouches[0].clientX - heroTouchStartX.current;
    const threshold = 40;
    if (Math.abs(deltaX) >= threshold) {
      if (deltaX < 0) {
        setCurrentSlide((prev) => (prev + 1) % SLIDE_DATA.length);
      } else {
        setCurrentSlide((prev) => (prev - 1 + SLIDE_DATA.length) % SLIDE_DATA.length);
      }
    }
    heroTouchStartX.current = null;
  };

  useEffect(() => {
    if (
      !hasRestoredScroll.current &&
      (initialScrollY !== null && initialScrollY !== undefined) &&
      productsStatus === 'success'
    ) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: initialScrollY, behavior: 'auto' });
      });
      hasRestoredScroll.current = true;
    }
  }, [initialScrollY, productsStatus]);

  useEffect(() => {
    catalogStateRef.current = {
      categoryFilter,
      currentPage,
      searchQuery: submittedSearchQuery,
    };
    onCatalogStateChange({
      ...catalogStateRef.current,
      scrollY: window.scrollY,
    });
  }, [categoryFilter, currentPage, submittedSearchQuery, onCatalogStateChange]);

  useEffect(() => {
    const handleScroll = () => {
      onCatalogStateChange({
        ...catalogStateRef.current,
        scrollY: window.scrollY,
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [onCatalogStateChange]);

  const catalogProducts = useMemo(() => {
    // 검색 중이면 검색 결과를 그대로 사용 (필터링 없음)
    if (submittedSearchQuery && submittedSearchQuery.trim()) {
      if (!products || products.length === 0) {
        return []; // 검색 결과가 없으면 빈 배열 반환
      }
      return mapProductsToCatalog(products);
    }
    
    // 일반 목록일 때만 카테고리 필터 적용
    let filteredProducts = products;
    
    // 카테고리 필터 적용 (대분류 기준)
    if (categoryFilter) {
      filteredProducts = products.filter((product) => product.categoryMain === categoryFilter);
    }
    
    // 일반 목록에서도 products가 비어있으면 빈 배열 반환 (FALLBACK_CATALOG 제거)
    if (!filteredProducts || filteredProducts.length === 0) {
      return [];
    }
    return mapProductsToCatalog(filteredProducts);
  }, [products, categoryFilter, submittedSearchQuery]);

  // 테마별 상품 선택 로직 (검색/필터가 없을 때만 사용)
  const themedProducts = useMemo(() => {
    if (submittedSearchQuery || categoryFilter || products.length === 0) {
      return { todayProducts: [], shoppingSuggestions: [], recommendedProducts: [] };
    }

    const allCatalogProducts = mapProductsToCatalog(products);
    
    // 오늘의 상품: 최신순 또는 인기순 (최근 등록된 상품 우선, 리뷰 많은 순)
    const todayProducts = [...allCatalogProducts]
      .sort((a, b) => {
        // 리뷰 수가 같으면 최신순, 아니면 리뷰 많은 순
        if (b.reviews === a.reviews) {
          return Math.random() - 0.5; // 동일한 경우 랜덤
        }
        return b.reviews - a.reviews;
      })
      .slice(0, 8);

    // 오늘의 쇼핑 제안: 할인 상품 또는 가격대별 추천
    const shoppingSuggestions = [...allCatalogProducts]
      .filter((p) => p.badge || p.priceSecondary) // 할인 상품 우선
      .sort((a, b) => {
        const aHasDiscount = a.badge || a.priceSecondary ? 1 : 0;
        const bHasDiscount = b.badge || b.priceSecondary ? 1 : 0;
        if (aHasDiscount !== bHasDiscount) {
          return bHasDiscount - aHasDiscount;
        }
        // 동일한 경우 랜덤
        return Math.random() - 0.5;
      })
      .slice(0, 8);

    // 이 상품은 어떠세요?: 카테고리별 다양하게 또는 랜덤
    // 이미 다른 섹션에 포함된 상품 제외
    const todayIds = new Set(todayProducts.map(p => p.id));
    const suggestionIds = new Set(shoppingSuggestions.map(p => p.id));
    const recommendedProducts = [...allCatalogProducts]
      .filter((p) => !todayIds.has(p.id) && !suggestionIds.has(p.id))
      .sort(() => Math.random() - 0.5) // 랜덤 섞기
      .slice(0, 8);

    // 만약 기준이 동일하여 상품이 부족하면 랜덤으로 보충
    if (todayProducts.length === shoppingSuggestions.length && 
        todayProducts.length > 0 && 
        new Set([...todayProducts.map(p => p.id), ...shoppingSuggestions.map(p => p.id)]).size === todayProducts.length) {
      // 모든 상품이 동일하면 랜덤으로 재배치
      return {
        todayProducts: [...allCatalogProducts].sort(() => Math.random() - 0.5).slice(0, 8),
        shoppingSuggestions: [...allCatalogProducts].sort(() => Math.random() - 0.5).slice(8, 16),
        recommendedProducts: [...allCatalogProducts].sort(() => Math.random() - 0.5).slice(16, 24),
      };
    }

    return { todayProducts, shoppingSuggestions, recommendedProducts };
  }, [products, submittedSearchQuery, categoryFilter]);

  // 카테고리 필터가 적용되면 표시
  useEffect(() => {
    if (categoryFilter && onCategoryFiltered) {
      // 카테고리 필터가 적용되었음을 부모에게 알림 (선택사항)
    }
  }, [categoryFilter, onCategoryFiltered]);

  const handleSearch = (e) => {
    e.preventDefault();
    // 현재 입력 필드의 값을 가져옴 (ref 또는 input 요소에서)
    const currentValue = searchInputRef.current?.value || searchInputValueRef.current || '';
    const query = currentValue.trim();
    // 상태 업데이트 (제출 시에만)
    setSearchQuery(query);
    if (query) {
      setSubmittedSearchQuery(query);
      setCategoryFilter(null);
      setCurrentPage(1);
    } else {
      // 검색어가 비어있으면 검색 초기화
      setSubmittedSearchQuery('');
      setCategoryFilter(null);
      setCurrentPage(1);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    // ref에만 값을 저장 (상태 업데이트 없이, 리렌더링 없이)
    searchInputValueRef.current = value;
    // 상태는 업데이트하지 않음 (제출 시에만 업데이트)
  };

  const handleToggleWishlist = async (e, product) => {
    e.stopPropagation();
    const session = loadSession();
    if (!session?.user) {
      alert('로그인이 필요합니다.');
      onMoveToLogin();
      return;
    }

    const productId = product.id || product._id;
    if (!productId) return;

    const isWishlisted = wishlistedItems.has(productId);
    setTogglingWishlist((prev) => new Set(prev).add(productId));

    try {
      if (isWishlisted) {
        await removeWishlistItem(productId);
        setWishlistedItems((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        // 찜하기 개수 변경 알림
        onWishlistChange();
      } else {
        await addWishlistItem(productId);
        setWishlistedItems((prev) => new Set(prev).add(productId));
        // 찜하기 개수 변경 알림
        onWishlistChange();
      }
    } catch (error) {
      if (error.message.includes('이미 찜하기에 추가된')) {
        // 이미 찜하기에 있으면 상태만 업데이트
        setWishlistedItems((prev) => new Set(prev).add(productId));
        onWishlistChange();
      } else {
        alert(error.message || '찜하기 상태를 변경하지 못했습니다.');
      }
    } finally {
      setTogglingWishlist((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const handleSubscribeToNewProducts = async (e) => {
    e.preventDefault();
    const session = loadSession();
    if (!session?.user) {
      alert('로그인이 필요합니다.');
      onMoveToLogin();
      return;
    }

    if (isSubscribed) {
      alert('이미 신상품 알림을 구독 중입니다.');
      return;
    }

    setSubscribing(true);
    try {
      await subscribeToNewProducts();
      setIsSubscribed(true);
      alert('신상품 알림 구독이 완료되었습니다. 새로운 상품이 등록되면 알림을 받으실 수 있습니다.');
    } catch (error) {
      alert(error.message || '알림 구독에 실패했습니다.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <>
      {/* 검색 바 */}
      <div className="hero-search-bar">
        <form className="hero-search-form" onSubmit={handleSearch}>
          <div className="hero-search-container">
            <div className="hero-search-input-wrapper">
              <input
                ref={searchInputRef}
                type="text"
                className="hero-search-input"
                placeholder="무엇이든 찾아보세요!"
                defaultValue={initialSearchQuery || ''}
                onChange={handleSearchChange}
              />
              <button type="submit" className="hero-search-icon-button" aria-label="검색">
                <Search className="hero-search-icon" size={20} />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 메인 슬라이드 */}
      <section className="hero-slider">
        <div
          className="hero-slider__container"
          onTouchStart={handleHeroTouchStart}
          onTouchEnd={handleHeroTouchEnd}
        >
          <div
            className="hero-slider__track"
            style={{
              transform: `translateX(-${currentSlide * 100}%)`,
            }}
          >
            {SLIDE_DATA.map((slide) => (
              <div key={slide.id} className="hero-slider__slide">
                <div
                  className="hero-slider__image"
                  style={{
                    backgroundImage: `url(${slide.image})`,
                  }}
                >
                  <div className="hero-slider__content">
                    <h2 className="hero-slider__title">{slide.title}</h2>
                    <p className="hero-slider__subtitle">{slide.subtitle}</p>
                    <button
                      type="button"
                      className="hero-slider__button"
                      onClick={() => {
                        if (slide.buttonText.includes('컬렉션') || slide.buttonText.includes('룩')) {
                          onMoveToLookbook();
                        } else {
                          onMoveToNew();
                        }
                      }}
                    >
                      {slide.buttonText}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-slider__indicators">
          {SLIDE_DATA.map((_, index) => (
            <button
              key={index}
              type="button"
              className={`hero-slider__indicator ${currentSlide === index ? 'hero-slider__indicator--active' : ''}`}
              onClick={() => handleSlideClick(index)}
              aria-label={`슬라이드 ${index + 1}로 이동`}
            />
          ))}
        </div>
        <button
          type="button"
          className="hero-slider__nav hero-slider__nav--prev"
          onClick={() => handleSlideClick((currentSlide - 1 + SLIDE_DATA.length) % SLIDE_DATA.length)}
          aria-label="이전 슬라이드"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          type="button"
          className="hero-slider__nav hero-slider__nav--next"
          onClick={() => handleSlideClick((currentSlide + 1) % SLIDE_DATA.length)}
          aria-label="다음 슬라이드"
        >
          <ChevronRight size={24} />
        </button>
      </section>

      {/* 메인 콘텐츠 영역 (사이드바 + 테마 섹션) */}
      <div className="home-main-layout">
        {/* 좌측 사이드바 */}
        <aside className="home-sidebar">
          <div className="home-sidebar__content">
            {/* 스토어 이름 */}
            <div className="home-sidebar__store-name">
              <div className="home-sidebar__divider"></div>
              <h1 className="home-sidebar__title">Our - mind Store</h1>
              <div className="home-sidebar__divider"></div>
            </div>

            {/* 네비게이션 링크 */}
            <nav className="home-sidebar__nav">
              <button
                type="button"
                className="home-sidebar__nav-link"
                onClick={() => {
                  setCategoryFilter(null);
                  setSearchQuery('');
                  setSubmittedSearchQuery('');
                  setCurrentPage(1);
                }}
              >
                ALL PRODUCT
              </button>
              <button
                type="button"
                className="home-sidebar__nav-link"
                onClick={() => {
                  // 공지사항 페이지로 이동 (필요시 구현)
                }}
              >
                NOTICE
              </button>
              <button
                type="button"
                className="home-sidebar__nav-link"
                onClick={() => {
                  // FAQ 페이지로 이동 (필요시 구현)
                }}
              >
                FAQ
              </button>
              <button
                type="button"
                className="home-sidebar__nav-link"
                onClick={() => {
                  // 문의 페이지로 이동 (필요시 구현)
                }}
              >
                CONTACT
              </button>
            </nav>

            {/* 카테고리 섹션 */}
            <div className="home-sidebar__section">
              <button
                type="button"
                className="home-sidebar__section-button"
                onClick={() => {
                  setCategoryDropdownOpen(!categoryDropdownOpen);
                  setLoyaltyDropdownOpen(false);
                }}
                aria-expanded={categoryDropdownOpen}
              >
                <span>카테고리</span>
                <ChevronDown 
                  size={16} 
                  style={{ 
                    transform: categoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.2s' 
                  }} 
                />
              </button>
              {categoryDropdownOpen && (
                <div className="home-sidebar__dropdown-menu">
                  {categoriesLoading ? (
                    <div className="home-sidebar__dropdown-item home-sidebar__dropdown-item--loading">
                      로딩 중...
                    </div>
                  ) : categories.length > 0 ? (
                    categories.map((category) => (
                      <button
                        key={category._id || category.code}
                        type="button"
                        className="home-sidebar__dropdown-item"
                        onClick={() => {
                          setCategoryFilter(category.name);
                          setCategoryDropdownOpen(false);
                          setCurrentPage(1);
                        }}
                      >
                        {category.name}
                        {category.productCount !== undefined && category.productCount > 0 && (
                          <span className="home-sidebar__dropdown-count">({category.productCount})</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="home-sidebar__dropdown-item home-sidebar__dropdown-item--empty">
                      카테고리가 없습니다
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 로열관 섹션 */}
            <div className="home-sidebar__section">
              <button
                type="button"
                className="home-sidebar__section-button home-sidebar__section-button--loyalty"
                onClick={() => {
                  setLoyaltyDropdownOpen(!loyaltyDropdownOpen);
                  setCategoryDropdownOpen(false);
                }}
                aria-expanded={loyaltyDropdownOpen}
              >
                <span>로열관</span>
                <ChevronDown 
                  size={16} 
                  style={{ 
                    transform: loyaltyDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', 
                    transition: 'transform 0.2s' 
                  }} 
                />
              </button>
              {loyaltyDropdownOpen && (
                <div className="home-sidebar__dropdown-menu home-sidebar__dropdown-menu--loyalty">
                  <button
                    type="button"
                    className="home-sidebar__dropdown-item home-sidebar__dropdown-item--loyalty"
                    onClick={() => {
                      setLoyaltyDropdownOpen(false);
                      onMoveToLoyaltyHall();
                    }}
                  >
                    로열관 입고 예정 상품
                  </button>
                  <div className="home-sidebar__dropdown-divider"></div>
                  <button
                    type="button"
                    className="home-sidebar__dropdown-item home-sidebar__dropdown-item--loyalty"
                    onClick={() => {
                      setLoyaltyDropdownOpen(false);
                    }}
                  >
                    일반 (LV.1)
                  </button>
                  <button
                    type="button"
                    className="home-sidebar__dropdown-item home-sidebar__dropdown-item--loyalty"
                    onClick={() => {
                      setLoyaltyDropdownOpen(false);
                    }}
                  >
                    프렌즈 (LV.2)
                  </button>
                  <button
                    type="button"
                    className="home-sidebar__dropdown-item home-sidebar__dropdown-item--loyalty"
                    onClick={() => {
                      setLoyaltyDropdownOpen(false);
                    }}
                  >
                    VIP (LV.3)
                  </button>
                  <button
                    type="button"
                    className="home-sidebar__dropdown-item home-sidebar__dropdown-item--loyalty"
                    onClick={() => {
                      setLoyaltyDropdownOpen(false);
                    }}
                  >
                    로열 (LV.4)
                  </button>
                </div>
              )}
            </div>

            {/* 소셜 미디어 */}
            <div className="home-sidebar__social">
              <a href="https://instagram.com/our-mind" target="_blank" rel="noopener noreferrer" className="home-sidebar__social-link">
                @our-mind
              </a>
            </div>

            {/* 인스타그램 썸네일 그리드 */}
            <div className="home-sidebar__instagram">
              <div className="home-sidebar__instagram-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="home-sidebar__instagram-item">
                    <img 
                      src={`https://images.unsplash.com/photo-${1500000000000 + i}?w=150&h=150&fit=crop`} 
                      alt={`Instagram ${i}`}
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 검색 바 */}
            <div className="home-sidebar__search">
              <form className="home-sidebar__search-form" onSubmit={handleSearch}>
                <input
                  ref={searchInputRef}
                  type="text"
                  className="home-sidebar__search-input"
                  placeholder="Search"
                  defaultValue={initialSearchQuery || ''}
                  onChange={handleSearchChange}
                />
                <button type="submit" className="home-sidebar__search-button" aria-label="검색">
                  <Search size={16} />
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* 우측 테마별 섹션 */}
        {!submittedSearchQuery && !categoryFilter && !showAllProducts ? (
          <div className="home-theme-content">
            <div className="home-theme-content__container">
            {/* 오늘의 상품 */}
            {themedProducts.todayProducts.length > 0 && (
              <section className="product-theme-section">
                <h2 className="product-theme-section__title">오늘의 상품</h2>
                <div className="product-theme-section__grid">
                  {themedProducts.todayProducts.map((product) => (
                    <article key={`${product.id || product.name}`} className="catalog-card">
                      <div className="catalog-card__media" onClick={() => onViewProduct(product.detail)} role="button" tabIndex={0} onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          onViewProduct(product.detail);
                        }
                      }}>
                        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                        <button
                          type="button"
                          className={`catalog-card__wishlist ${wishlistedItems.has(product.id) ? 'catalog-card__wishlist--active' : ''}`}
                          aria-label={wishlistedItems.has(product.id) ? '찜하기 해제' : '찜하기 추가'}
                          onClick={(e) => handleToggleWishlist(e, product)}
                          disabled={togglingWishlist.has(product.id)}
                        >
                          <Heart 
                            size={14} 
                            strokeWidth={wishlistedItems.has(product.id) ? 0 : 2.5} 
                            fill={wishlistedItems.has(product.id) ? '#ef4444' : 'none'}
                            color={wishlistedItems.has(product.id) ? '#ef4444' : '#000000'}
                            style={{
                              transition: 'all 0.3s ease',
                            }}
                          />
                        </button>
                      </div>
                      <div className="catalog-card__body">
                        {product.colors && product.colors.length > 0 && (
                          <div className="catalog-card__colors">
                            {product.colors.map((color) => (
                              <span
                                key={`${product.name}-${color.value}`}
                                className="catalog-card__color-dot"
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        )}
                        <h3 className="catalog-card__title">{product.name}</h3>
                        <div className="catalog-card__rating">
                          <Star size={16} fill="#111" strokeWidth={0} />
                          <span>
                            {product.rating.toFixed(1)} <small>({product.reviews})</small>
                          </span>
                        </div>
                        <div className="catalog-card__prices">
                          {product.badge && (
                            <span className="catalog-card__discount-badge">{product.badge}</span>
                          )}
                          {product.priceSecondary && (
                            <span className="catalog-card__price catalog-card__price--compare">
                              {product.priceSecondary}
                            </span>
                          )}
                          <span className="catalog-card__price">{product.pricePrimary}</span>
                        </div>
                        <button
                          type="button"
                          className="catalog-card__cta"
                          onClick={() => onViewProduct(product.detail)}
                        >
                          <ShoppingBag size={16} />
                          바로 구매하기
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 오늘의 쇼핑 제안 */}
            {themedProducts.shoppingSuggestions.length > 0 && (
              <section className="product-theme-section">
                <h2 className="product-theme-section__title">오늘의 쇼핑 제안</h2>
                <div className="product-theme-section__grid">
                  {themedProducts.shoppingSuggestions.map((product) => (
                    <article key={`${product.id || product.name}`} className="catalog-card">
                      <div className="catalog-card__media" onClick={() => onViewProduct(product.detail)} role="button" tabIndex={0} onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          onViewProduct(product.detail);
                        }
                      }}>
                        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                        <button
                          type="button"
                          className={`catalog-card__wishlist ${wishlistedItems.has(product.id) ? 'catalog-card__wishlist--active' : ''}`}
                          aria-label={wishlistedItems.has(product.id) ? '찜하기 해제' : '찜하기 추가'}
                          onClick={(e) => handleToggleWishlist(e, product)}
                          disabled={togglingWishlist.has(product.id)}
                        >
                          <Heart 
                            size={14} 
                            strokeWidth={wishlistedItems.has(product.id) ? 0 : 2.5} 
                            fill={wishlistedItems.has(product.id) ? '#ef4444' : 'none'}
                            color={wishlistedItems.has(product.id) ? '#ef4444' : '#000000'}
                            style={{
                              transition: 'all 0.3s ease',
                            }}
                          />
                        </button>
                      </div>
                      <div className="catalog-card__body">
                        {product.colors && product.colors.length > 0 && (
                          <div className="catalog-card__colors">
                            {product.colors.map((color) => (
                              <span
                                key={`${product.name}-${color.value}`}
                                className="catalog-card__color-dot"
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        )}
                        <h3 className="catalog-card__title">{product.name}</h3>
                        <div className="catalog-card__rating">
                          <Star size={16} fill="#111" strokeWidth={0} />
                          <span>
                            {product.rating.toFixed(1)} <small>({product.reviews})</small>
                          </span>
                        </div>
                        <div className="catalog-card__prices">
                          {product.badge && (
                            <span className="catalog-card__discount-badge">{product.badge}</span>
                          )}
                          {product.priceSecondary && (
                            <span className="catalog-card__price catalog-card__price--compare">
                              {product.priceSecondary}
                            </span>
                          )}
                          <span className="catalog-card__price">{product.pricePrimary}</span>
                        </div>
                        <button
                          type="button"
                          className="catalog-card__cta"
                          onClick={() => onViewProduct(product.detail)}
                        >
                          <ShoppingBag size={16} />
                          바로 구매하기
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {/* 이 상품은 어떠세요? */}
            {themedProducts.recommendedProducts.length > 0 && (
              <section className="product-theme-section">
                <h2 className="product-theme-section__title">이 상품은 어떠세요?</h2>
                <div className="product-theme-section__grid">
                  {themedProducts.recommendedProducts.map((product) => (
                    <article key={`${product.id || product.name}`} className="catalog-card">
                      <div className="catalog-card__media" onClick={() => onViewProduct(product.detail)} role="button" tabIndex={0} onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          onViewProduct(product.detail);
                        }
                      }}>
                        <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
                        <button
                          type="button"
                          className={`catalog-card__wishlist ${wishlistedItems.has(product.id) ? 'catalog-card__wishlist--active' : ''}`}
                          aria-label={wishlistedItems.has(product.id) ? '찜하기 해제' : '찜하기 추가'}
                          onClick={(e) => handleToggleWishlist(e, product)}
                          disabled={togglingWishlist.has(product.id)}
                        >
                          <Heart 
                            size={14} 
                            strokeWidth={wishlistedItems.has(product.id) ? 0 : 2.5} 
                            fill={wishlistedItems.has(product.id) ? '#ef4444' : 'none'}
                            color={wishlistedItems.has(product.id) ? '#ef4444' : '#000000'}
                            style={{
                              transition: 'all 0.3s ease',
                            }}
                          />
                        </button>
                      </div>
                      <div className="catalog-card__body">
                        {product.colors && product.colors.length > 0 && (
                          <div className="catalog-card__colors">
                            {product.colors.map((color) => (
                              <span
                                key={`${product.name}-${color.value}`}
                                className="catalog-card__color-dot"
                                style={{ backgroundColor: color.value }}
                                title={color.name}
                              />
                            ))}
                          </div>
                        )}
                        <h3 className="catalog-card__title">{product.name}</h3>
                        <div className="catalog-card__rating">
                          <Star size={16} fill="#111" strokeWidth={0} />
                          <span>
                            {product.rating.toFixed(1)} <small>({product.reviews})</small>
                          </span>
                        </div>
                        <div className="catalog-card__prices">
                          {product.badge && (
                            <span className="catalog-card__discount-badge">{product.badge}</span>
                          )}
                          {product.priceSecondary && (
                            <span className="catalog-card__price catalog-card__price--compare">
                              {product.priceSecondary}
                            </span>
                          )}
                          <span className="catalog-card__price">{product.pricePrimary}</span>
                        </div>
                        <button
                          type="button"
                          className="catalog-card__cta"
                          onClick={() => onViewProduct(product.detail)}
                        >
                          <ShoppingBag size={16} />
                          바로 구매하기
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
            </div>
          </div>
        ) : (
        /* 검색/필터가 있을 때는 기존 방식 */
        <div className="home-theme-content">
          <div className="home-theme-content__container">
            <div className="mobile-frame">
              <div className="mobile-frame__container">
                <div className="catalog-page">

      <div className="catalog-toolbar" ref={catalogToolbarRef}>
        <div className="catalog-toolbar__left">
          <label className="catalog-select">
            <span>필터</span>
            <select>
              <option value="all">전체</option>
              <option value="new">신상품</option>
              <option value="sale">할인</option>
              <option value="popular">인기</option>
            </select>
          </label>
          <label className="catalog-select">
            <span>비교하기</span>
            <select value={compareMode ? 'on' : 'off'} onChange={(event) => setCompareMode(event.target.value === 'on')}>
              <option value="off">끄기</option>
              <option value="on">켜기</option>
            </select>
          </label>
        </div>

        <div className="catalog-toolbar__right">
          <label className="catalog-select">
            <span>카테고리</span>
            <select 
              value={categoryFilter || 'all'} 
              onChange={(event) => {
                const selectedCategory = event.target.value;
                if (selectedCategory === 'all') {
                  setCategoryFilter(null);
                  onCategoryFiltered();
                } else {
                  setCategoryFilter(selectedCategory);
                  setCurrentPage(1);
                }
              }}
              disabled={categoriesLoading}
            >
              <option value="all">전체 제품</option>
              {categories.map((category) => (
                <option key={category._id || category.code} value={category.name}>
                  {category.name}
                  {category.productCount !== undefined && category.productCount > 0 
                    ? ` (${category.productCount})` 
                    : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="catalog-select">
            <span>정렬</span>
            <select value={sortOption} onChange={(event) => setSortOption(event.target.value)}>
              <option value="featured">추천순</option>
              <option value="newest">신상품순</option>
              <option value="price-low">낮은 가격순</option>
              <option value="price-high">높은 가격순</option>
            </select>
          </label>
        </div>
      </div>

      <div className="catalog-metadata">
        <span>
          {submittedSearchQuery ? (
            <>
              "<strong>{submittedSearchQuery}</strong>" 검색 결과: {totalItems || catalogProducts.length}개 제품 ({(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems || catalogProducts.length)}번째 표시 중)
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSubmittedSearchQuery('');
                  setCurrentPage(1);
                }}
                style={{
                  marginLeft: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                검색 초기화
              </button>
            </>
          ) : categoryFilter ? (
            <>
              <strong>{categoryFilter}</strong> 카테고리: {catalogProducts.length}개 제품
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter(null);
                  onCategoryFiltered();
                }}
                style={{
                  marginLeft: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                필터 해제
              </button>
            </>
          ) : (
            `총 ${totalItems || catalogProducts.length}개 제품`
          )}
        </span>
        {productsStatus === 'loading' && <span className="catalog-badge">상품 불러오는 중...</span>}
        {productsStatus === 'error' && (
          <span className="catalog-badge catalog-badge--error">
            최신 상품 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </span>
        )}
      </div>

      <section className="catalog-grid">
        {catalogProducts.map((product) => (
          <article key={`${product.id || product.name}`} className="catalog-card">
            <div className="catalog-card__media" onClick={() => onViewProduct(product.detail)} role="button" tabIndex={0} onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onViewProduct(product.detail);
              }
            }}>
              <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
              <button
                type="button"
                className={`catalog-card__wishlist ${wishlistedItems.has(product.id) ? 'catalog-card__wishlist--active' : ''}`}
                aria-label={wishlistedItems.has(product.id) ? '찜하기 해제' : '찜하기 추가'}
                onClick={(e) => handleToggleWishlist(e, product)}
                disabled={togglingWishlist.has(product.id)}
              >
                <Heart 
                  size={14} 
                  strokeWidth={wishlistedItems.has(product.id) ? 0 : 2.5} 
                  fill={wishlistedItems.has(product.id) ? '#ef4444' : 'none'}
                  color={wishlistedItems.has(product.id) ? '#ef4444' : '#000000'}
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                />
              </button>
            </div>
            <div className="catalog-card__body">
              {product.colors && product.colors.length > 0 && (
                <div className="catalog-card__colors">
                  {product.colors.map((color) => (
                    <span
                      key={`${product.name}-${color.value}`}
                      className="catalog-card__color-dot"
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              )}
              <h3 className="catalog-card__title">{product.name}</h3>
              <div className="catalog-card__rating">
                <Star size={16} fill="#111" strokeWidth={0} />
                <span>
                  {product.rating.toFixed(1)} <small>({product.reviews})</small>
                </span>
              </div>
              <div className="catalog-card__prices">
                {product.badge && (
                  <span className="catalog-card__discount-badge">{product.badge}</span>
                )}
                {product.priceSecondary && (
                  <span className="catalog-card__price catalog-card__price--compare">
                    {product.priceSecondary}
                  </span>
                )}
                <span className="catalog-card__price">{product.pricePrimary}</span>
              </div>
              <button
                type="button"
                className="catalog-card__cta"
                onClick={() => onViewProduct(product.detail)}
              >
                <ShoppingBag size={16} />
                바로 구매하기
              </button>
            </div>
          </article>
        ))}
      </section>

      {totalPages > 1 && (
        <div className="catalog-pagination">
          <button
            type="button"
            className="catalog-pagination__button"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || productsStatus === 'loading'}
            aria-label="이전 페이지"
          >
            <ChevronLeft size={20} />
            이전
          </button>
          
          <div className="catalog-pagination__pages">
            {currentPage > 3 && totalPages > 5 && (
              <>
                <button
                  type="button"
                  className="catalog-pagination__page"
                  onClick={() => setCurrentPage(1)}
                  disabled={productsStatus === 'loading'}
                >
                  1
                </button>
                {currentPage > 4 && <span className="catalog-pagination__ellipsis">...</span>}
              </>
            )}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  type="button"
                  className={`catalog-pagination__page ${
                    currentPage === pageNum ? 'catalog-pagination__page--active' : ''
                  }`}
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={productsStatus === 'loading'}
                >
                  {pageNum}
                </button>
              );
            })}
            {currentPage < totalPages - 2 && totalPages > 5 && (
              <>
                {currentPage < totalPages - 3 && <span className="catalog-pagination__ellipsis">...</span>}
                <button
                  type="button"
                  className="catalog-pagination__page"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={productsStatus === 'loading'}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="catalog-pagination__button"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || productsStatus === 'loading'}
            aria-label="다음 페이지"
          >
            다음
            <ChevronRight size={20} />
          </button>
        </div>
      )}

              </div>
            </div>
          </div>
        </div>
        </div>
      )}
      </div>

      {/* Trendy & Free Collection 카드 */}
      {/*<section className="collection-card">
        <div className="collection-card__content">
          <div className="collection-card__header">
            <h2 className="collection-card__title">Trendy & Free Collection</h2>
            <p className="collection-card__breadcrumb">For Everyone &gt; Collection &gt; New Season</p>
          </div>
          <p className="collection-card__description">쓰임은 단순하게, 무드는 깊게.</p>
          <p className="collection-card__description">일상을 위한 생활용품.</p>
          <div className="collection-card__actions">
            <button type="button" className="collection-card__button collection-card__button--primary" onClick={onMoveToLookbook}>
              룩북 보기
            </button>
            <button
              type="button"
              className="collection-card__button collection-card__button--secondary"
              onClick={handleSubscribeToNewProducts}
              disabled={subscribing || isSubscribed}
            >
              {subscribing ? '구독 중...' : isSubscribed ? '알림 구독 완료' : '신상품 알림받기'}
            </button>
          </div>
        </div>
      </section> */}

      {!submittedSearchQuery && !categoryFilter && !showAllProducts && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0 4rem' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setSearchQuery('');
              setSubmittedSearchQuery('');
              setCategoryFilter(null);
              setCurrentPage(1);
              setShowAllProducts(true);
              requestAnimationFrame(() => {
                if (catalogToolbarRef.current) {
                  const top = catalogToolbarRef.current.getBoundingClientRect().top + window.pageYOffset;
                  window.scrollTo({ top: top - 20, behavior: 'smooth' });
                }
              });
            }}
          >
            전체 상품 보기
          </button>
        </div>
      )}
    </>
  );
}

export default HomeHero;
