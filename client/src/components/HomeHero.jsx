import { useEffect, useMemo, useState, useRef } from 'react';
import { Heart, ShoppingBag, Star, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { fetchProducts, searchProducts as searchProductsAPI } from '../services/productService';
import { fetchCategories } from '../services/categoryService';
import { addWishlistItem, removeWishlistItem, checkWishlistItems } from '../services/wishlistService';
import { loadSession } from '../utils/sessionStorage';

const FALLBACK_CATALOG = [
  {
    id: null,
    name: '패스트 앤 프리 하프 타이츠 8"',
    rating: 4.9,
    reviews: 64,
    pricePrimary: '138,000원',
    priceSecondary: null,
    badge: null,
    colors: [
      { name: 'Black', value: '#1f1f21' },
      { name: 'Moonlit', value: '#5d5e64' },
    ],
    image:
      'https://images.lululemon.com/is/image/lululemon/LW9BQUS_0001_1?wid=1200&hei=1200',
    detail: {
      category: '러닝',
      price: 138000,
    },
  },
  {
    id: null,
    name: '패스트 앤 프리 라인드 러닝 쇼츠 5"',
    rating: 4.8,
    reviews: 78,
    pricePrimary: '100,000원',
    priceSecondary: '125,000원',
    badge: '새로운 컬러',
    colors: [
      { name: 'Black', value: '#111111' },
      { name: 'Graphite Grey', value: '#737680' },
      { name: 'Silver', value: '#c8cbd3' },
      { name: 'Fog', value: '#dee0e6' },
    ],
    image:
      'https://images.lululemon.com/is/image/lululemon/LM3EKIS_0001_1?wid=1200&hei=1200',
    detail: {
      category: '남성 · 쇼츠',
      price: 125000,
      priceSale: 100000,
    },
  },
  {
    id: null,
    name: '패스트 앤 프리 하이라이즈 파인브 포켓 타이츠 24"',
    rating: 4.7,
    reviews: 95,
    pricePrimary: '129,000원',
    priceSecondary: '184,000원',
    badge: null,
    colors: [
      { name: 'Black', value: '#18181b' },
      { name: 'Deep Plum', value: '#32213a' },
      { name: 'Olive', value: '#6d6f58' },
      { name: 'Slate Blue', value: '#5a6279' },
      { name: 'Navy', value: '#1e2430' },
    ],
    image:
      'https://images.lululemon.com/is/image/lululemon/LW5FOES_0001_1?wid=1200&hei=1200',
    detail: {
      category: '여성 · 타이츠',
      price: 184000,
      priceSale: 129000,
    },
  },
  {
    id: null,
    name: '패스트 앤 프리 하이라이즈 쇼츠 6" 5 포켓',
    rating: 4.6,
    reviews: 43,
    pricePrimary: '93,000원',
    priceSecondary: null,
    badge: null,
    colors: [
      { name: 'Black', value: '#151516' },
      { name: 'Powder Grey', value: '#c7cad2' },
      { name: 'Navy', value: '#1f2430' },
    ],
    image:
      'https://images.lululemon.com/is/image/lululemon/LW7BW4S_0001_1?wid=1200&hei=1200',
    detail: {
      category: '여성 · 쇼츠',
      price: 93000,
    },
  },
  {
    id: null,
    name: '패스트 앤 프리 재킷',
    rating: 4.8,
    reviews: 128,
    pricePrimary: '158,000원',
    priceSecondary: '198,000원',
    badge: null,
    colors: [
      { name: 'Bone', value: '#d6d1c8' },
      { name: 'Grey', value: '#7e7f84' },
      { name: 'Black', value: '#202124' },
    ],
    image:
      'https://images.lululemon.com/is/image/lululemon/LM3EWQS_0001_1?wid=1200&hei=1200',
    detail: {
      category: '남성 · 아우터웨어',
      price: 198000,
      priceSale: 158000,
    },
  },
  {
    id: null,
    name: '패스트 앤 프리 하이라이즈 타이츠 25" 5 포켓',
    rating: 4.7,
    reviews: 66,
    pricePrimary: '129,000원',
    priceSecondary: '184,000원',
    badge: null,
    colors: [
      { name: 'Olive', value: '#7b8160' },
      { name: 'Slate', value: '#6b7280' },
      { name: 'Deep Navy', value: '#0f172a' },
      { name: 'Black', value: '#111827' },
    ],
    image:
      'https://images.lululemon.com/is/image/lululemon/LW5FOFS_028932_1?wid=1200&hei=1200',
    detail: {
      category: '여성 · 타이츠',
      price: 184000,
      priceSale: 129000,
    },
  },
];

const COLOR_PRESETS = [
  ['#111827', '#4b5563', '#d1d5db', '#e2e8f0'],
  ['#1f2937', '#7c3aed', '#f4d35e', '#ee964b'],
  ['#0f172a', '#ec4899', '#fde68a', '#f97316'],
  ['#111827', '#475569', '#94a3b8', '#f8fafc'],
];

// 슬라이드 데이터 (10개)
const SLIDE_DATA = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=800&fit=crop',
    title: 'New Season Collection',
    subtitle: '트렌디한 스타일을 만나보세요',
    buttonText: '신상품 보기',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=800&fit=crop',
    title: 'Premium Outerwear',
    subtitle: '프리미엄 아우터 컬렉션',
    buttonText: '아우터 보기',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&h=800&fit=crop',
    title: 'Street Style',
    subtitle: '스트릿 패션의 새로운 해석',
    buttonText: '컬렉션 보기',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=800&fit=crop',
    title: 'Minimalist Design',
    subtitle: '미니멀리즘의 정수',
    buttonText: '미니멀 컬렉션',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&h=800&fit=crop',
    title: 'Casual Essentials',
    subtitle: '일상의 편안함을 위한 필수템',
    buttonText: '캐주얼 보기',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1920&h=800&fit=crop',
    title: 'Luxury Collection',
    subtitle: '럭셔리한 품격의 아이템',
    buttonText: '럭셔리 보기',
  },
  {
    id: 7,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=800&fit=crop',
    title: 'Urban Fashion',
    subtitle: '도시를 위한 패션',
    buttonText: '도시 컬렉션',
  },
  {
    id: 8,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&h=800&fit=crop',
    title: 'Athletic Style',
    subtitle: '스포티한 라이프스타일',
    buttonText: '스포츠웨어',
  },
  {
    id: 9,
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=800&fit=crop',
    title: 'Winter Collection',
    subtitle: '따뜻한 겨울을 위한 컬렉션',
    buttonText: '겨울 컬렉션',
  },
  {
    id: 10,
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=800&fit=crop',
    title: 'Special Sale',
    subtitle: '특별 할인 이벤트',
    buttonText: '세일 보기',
  },
];

function pickColorPalette(index = 0) {
  return COLOR_PRESETS[index % COLOR_PRESETS.length];
}

function mapProductsToCatalog(products = []) {
  const formatter = new Intl.NumberFormat('ko-KR');

  return products.map((product, index) => {
    const palette = pickColorPalette(index);
    const basePrice = Number(product.price || 0);
    const formattedPrice = basePrice ? `${formatter.format(basePrice)}원` : '가격 문의';

    return {
      id: product._id,
      name: product.name,
      rating: 4.8,
      reviews: 24 + index * 3,
      pricePrimary: formattedPrice,
      priceSecondary: null,
      badge: null,
      colors: palette.map((value, colorIndex) => ({
        name: `컬러 ${colorIndex + 1}`,
        value,
      })),
      image:
        product.image ||
        'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=900&q=80',
      detail: {
        id: product._id,
        category: product.category || '상의',
        price: basePrice,
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
  onViewProduct = () => {},
  onWishlistChange = () => {},
  initialCategory = null,
  initialSearchQuery = null,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 40;
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideIntervalRef = useRef(null);
  const catalogToolbarRef = useRef(null);
  const searchInputRef = useRef(null);
  const isInitialLoad = useRef(true);
  const previousSearchQuery = useRef(null);
  const [wishlistedItems, setWishlistedItems] = useState(new Set());
  const [togglingWishlist, setTogglingWishlist] = useState(new Set());

  // 페이지 로드 시 스크롤을 맨 위로 이동
  useEffect(() => {
    // 브라우저의 스크롤 복원 방지
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    // 즉시 스크롤을 상단으로 이동
    window.scrollTo({ top: 0, behavior: 'auto' });
    isInitialLoad.current = false;
  }, []);

  // 페이지 로드 시 스크롤을 상단으로 이동
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // 카테고리 목록 로드
  useEffect(() => {
    async function loadCategories() {
      try {
        setCategoriesLoading(true);
        const data = await fetchCategories({ includeProductCount: true });
        console.log('카테고리 로드 성공:', data?.length || 0, '개');
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

  // initialCategory가 변경되면 categoryFilter 업데이트
  useEffect(() => {
    if (initialCategory) {
      setCategoryFilter(initialCategory);
      setSearchQuery('');
      setCurrentPage(1);
    }
  }, [initialCategory]);

  // initialSearchQuery가 변경되면 searchQuery 업데이트
  useEffect(() => {
    if (initialSearchQuery !== null && initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      setCategoryFilter(null);
      setCurrentPage(1);
    }
  }, [initialSearchQuery]);

  // 슬라이드 자동 전환
  useEffect(() => {
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_DATA.length);
    }, 4000); // 4초마다 전환

    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setProductsStatus('loading');
        
        // submittedSearchQuery가 있으면 Hybrid 검색 API 사용, 없으면 일반 상품 목록 API 사용
        let data;
        if (submittedSearchQuery && submittedSearchQuery.trim()) {
          // Hybrid 검색 사용
          const searchResult = await searchProductsAPI(submittedSearchQuery.trim(), itemsPerPage);
          data = {
            items: searchResult.results || [],
            totalItems: searchResult.total || 0,
            totalPages: Math.ceil((searchResult.total || 0) / itemsPerPage),
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
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
    }
    slideIntervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_DATA.length);
    }, 4000);
  };

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
    
    // 카테고리 필터 적용
    if (categoryFilter) {
      filteredProducts = products.filter((product) => product.category === categoryFilter);
    }
    
    // 일반 목록에서도 products가 비어있으면 빈 배열 반환 (FALLBACK_CATALOG 제거)
    if (!filteredProducts || filteredProducts.length === 0) {
      return [];
    }
    return mapProductsToCatalog(filteredProducts);
  }, [products, categoryFilter, submittedSearchQuery]);

  // 카테고리 필터가 적용되면 표시
  useEffect(() => {
    if (categoryFilter && onCategoryFiltered) {
      // 카테고리 필터가 적용되었음을 부모에게 알림 (선택사항)
    }
  }, [categoryFilter, onCategoryFiltered]);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
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
    setSearchQuery(e.target.value);
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
                value={searchQuery}
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
        <div className="hero-slider__container">
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
                        if (slide.buttonText.includes('신상품')) {
                          setFilterOption('new');
                        } else if (slide.buttonText.includes('아우터')) {
                          // 아우터 필터링 로직 추가 가능
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

      {/* Trendy & Free Collection 카드 */}
      <section className="collection-card">
        <div className="collection-card__content">
          <div className="collection-card__header">
            <h2 className="collection-card__title">Trendy & Free Collection</h2>
            <p className="collection-card__breadcrumb">For Everyone &gt; Collection &gt; New Season</p>
          </div>
          <p className="collection-card__description">
            기능보다 형태, 유행보다 무드를 말합니다. 도시의 리듬 속에서 자유로움을 입는 사람들을 위한 새로운 해석.
          </p>
          <div className="collection-card__actions">
            <button type="button" className="collection-card__button collection-card__button--primary" onClick={onMoveToLookbook}>
              룩북 보기
            </button>
            <button
              type="button"
              className="collection-card__button collection-card__button--secondary"
              onClick={onMoveToSignUp}
            >
              신상품 알림받기
            </button>
          </div>
        </div>
      </section>

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
              "<strong>{submittedSearchQuery}</strong>" 검색 결과: {totalItems || catalogProducts.length}개 제품
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
              {product.badge && <span className="catalog-card__badge">{product.badge}</span>}
              <img src={product.image} alt={product.name} />
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
              <h3 className="catalog-card__title">{product.name}</h3>
              <div className="catalog-card__rating">
                <Star size={16} fill="#111" strokeWidth={0} />
                <span>
                  {product.rating.toFixed(1)} <small>({product.reviews})</small>
                </span>
              </div>
              <div className="catalog-card__prices">
                <span className="catalog-card__price">{product.pricePrimary}</span>
                {product.priceSecondary && (
                  <span className="catalog-card__price catalog-card__price--compare">
                    {product.priceSecondary}
                  </span>
                )}
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
    </>
  );
}

export default HomeHero;
