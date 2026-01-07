import { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Sparkles, MoveRight } from 'lucide-react';
import { fetchProducts } from '../services/productService';

function LookbookPage({ onBack = () => {}, onOpenStyleNote = () => {} }) {
  const [seasonCampaigns, setSeasonCampaigns] = useState([]);
  const [editorialFeatures, setEditorialFeatures] = useState([]);
  const [accessoryHighlights, setAccessoryHighlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLookbookData();
  }, []);

  const loadLookbookData = async () => {
    try {
      setLoading(true);
      
      // 다양한 카테고리의 상품들을 가져와서 룩북 구성
      const [kitchenProducts, bathroomProducts, storageProducts, livingProducts] = await Promise.all([
        fetchProducts(1, 10, '주방용품'),
        fetchProducts(1, 10, '욕실/세탁/청소'),
        fetchProducts(1, 10, '수납/정리'),
        fetchProducts(1, 10, '생활잡화'),
      ]);

      // 시즌 캠페인 구성 (주방용품, 욕실용품, 수납용품)
      const campaigns = [];
      const kitchenItems = kitchenProducts?.data?.items || [];
      const bathroomItems = bathroomProducts?.data?.items || [];
      const storageItems = storageProducts?.data?.items || [];

      if (kitchenItems.length > 0) {
        const product = kitchenItems[0];
        campaigns.push({
          season: '2025 SPRING',
          title: '주방의 새로운 시작',
          description: `${product.name}을 포함한 프리미엄 주방용품 컬렉션. 실용성과 디자인을 모두 갖춘 아이템들로 주방을 새롭게 꾸며보세요.`,
          image: product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?auto=format&fit=crop&w=1200&q=80',
          product: product,
        });
      }

      if (bathroomItems.length > 0) {
        const product = bathroomItems[0];
        campaigns.push({
          season: '2025 SUMMER',
          title: '깔끔한 욕실 스타일',
          description: `${product.name}을 중심으로 한 모던한 욕실용품 라인. 세련된 디자인과 뛰어난 기능성으로 일상의 편의를 높여줍니다.`,
          image: product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
          product: product,
        });
      }

      if (storageItems.length > 0) {
        const product = storageItems[0];
        campaigns.push({
          season: '2025 PRE-FALL',
          title: '스마트한 수납 솔루션',
          description: `${product.name}을 포함한 효율적인 수납/정리 아이템들. 공간을 최대한 활용하면서도 깔끔한 인테리어를 완성할 수 있습니다.`,
          image: product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
          product: product,
        });
      }

      // 기본값 설정 (상품이 없을 경우)
      if (campaigns.length === 0) {
        campaigns.push(
          {
            season: '2025 SPRING',
            title: '주방의 새로운 시작',
            description: '프리미엄 주방용품 컬렉션으로 주방을 새롭게 꾸며보세요.',
            image: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?auto=format&fit=crop&w=1200&q=80',
          },
          {
            season: '2025 SUMMER',
            title: '깔끔한 욕실 스타일',
            description: '모던한 욕실용품 라인으로 일상의 편의를 높여보세요.',
            image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
          },
          {
            season: '2025 PRE-FALL',
            title: '스마트한 수납 솔루션',
            description: '효율적인 수납/정리 아이템들로 공간을 최대한 활용해보세요.',
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
          }
        );
      }

      setSeasonCampaigns(campaigns);

      // 에디토리얼 피처 구성 (다양한 카테고리의 상품들)
      const features = [];
      const allProducts = [
        ...(kitchenItems.slice(0, 2)),
        ...(bathroomItems.slice(0, 1)),
        ...(storageItems.slice(0, 1)),
        ...(livingProducts?.data?.items?.slice(0, 1) || []),
      ].filter(Boolean);

      if (allProducts.length >= 3) {
        features.push(
          {
            title: '주방의 완성',
            summary: `${allProducts[0]?.name || '주방용품'}을 활용한 실용적인 주방 스타일링. 일상의 요리를 더욱 즐겁게 만들어주는 아이템들을 소개합니다.`,
            image: allProducts[0]?.image || allProducts[0]?.images?.[0] || 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?auto=format&fit=crop&w=900&q=80',
          },
          {
            title: '생활의 질',
            summary: `${allProducts[1]?.name || '생활용품'}으로 시작하는 새로운 일상. 세련된 디자인과 뛰어난 기능성으로 생활의 편의를 높여보세요.`,
            image: allProducts[1]?.image || allProducts[1]?.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',
          },
          {
            title: '공간의 재발견',
            summary: `${allProducts[2]?.name || '수납용품'}을 통한 스마트한 공간 활용법. 작은 공간도 넓게 보이게 만드는 수납 솔루션을 제안합니다.`,
            image: allProducts[2]?.image || allProducts[2]?.images?.[0] || 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?auto=format&fit=crop&w=900&q=80',
          }
        );
      } else {
        // 기본값
        features.push(
          {
            title: '주방의 완성',
            summary: '실용적인 주방 스타일링으로 일상의 요리를 더욱 즐겁게 만들어보세요.',
            image: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?auto=format&fit=crop&w=900&q=80',
          },
          {
            title: '생활의 질',
            summary: '세련된 디자인과 뛰어난 기능성으로 생활의 편의를 높여보세요.',
            image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',
          },
          {
            title: '공간의 재발견',
            summary: '스마트한 공간 활용법으로 작은 공간도 넓게 보이게 만드는 수납 솔루션을 제안합니다.',
            image: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?auto=format&fit=crop&w=900&q=80',
          }
        );
      }

      setEditorialFeatures(features);

      // 액세서리 하이라이트 (생활잡화 카테고리에서 추출)
      const livingItems = livingProducts?.data?.items || [];
      const highlights = [];
      
      if (livingItems.length > 0) {
        livingItems.slice(0, 3).forEach(item => {
          if (item.name) {
            highlights.push(item.name);
          }
        });
      }

      // 기본값
      if (highlights.length === 0) {
        highlights.push(
          '실용적이고 세련된 생활용품',
          '일상의 편의를 높이는 프리미엄 아이템',
          '디자인과 기능성을 모두 갖춘 선택'
        );
      }

      setAccessoryHighlights(highlights);
    } catch (error) {
      console.error('룩북 데이터 로드 실패:', error);
      // 에러 발생 시 기본값 설정
      setSeasonCampaigns([
        {
          season: '2025 SPRING',
          title: '주방의 새로운 시작',
          description: '프리미엄 주방용품 컬렉션으로 주방을 새롭게 꾸며보세요.',
          image: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?auto=format&fit=crop&w=1200&q=80',
        },
        {
          season: '2025 SUMMER',
          title: '깔끔한 욕실 스타일',
          description: '모던한 욕실용품 라인으로 일상의 편의를 높여보세요.',
          image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
        },
        {
          season: '2025 PRE-FALL',
          title: '스마트한 수납 솔루션',
          description: '효율적인 수납/정리 아이템들로 공간을 최대한 활용해보세요.',
          image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
        }
      ]);
      setEditorialFeatures([
        {
          title: '주방의 완성',
          summary: '실용적인 주방 스타일링으로 일상의 요리를 더욱 즐겁게 만들어보세요.',
          image: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?auto=format&fit=crop&w=900&q=80',
        },
        {
          title: '생활의 질',
          summary: '세련된 디자인과 뛰어난 기능성으로 생활의 편의를 높여보세요.',
          image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=900&q=80',
        },
        {
          title: '공간의 재발견',
          summary: '스마트한 공간 활용법으로 작은 공간도 넓게 보이게 만드는 수납 솔루션을 제안합니다.',
          image: 'https://images.unsplash.com/photo-1556910096-6f5e72db6803?auto=format&fit=crop&w=900&q=80',
        }
      ]);
      setAccessoryHighlights([
        '실용적이고 세련된 생활용품',
        '일상의 편의를 높이는 프리미엄 아이템',
        '디자인과 기능성을 모두 갖춘 선택'
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="lookbook">
      <button type="button" className="lookbook__back" onClick={onBack}>
        <ArrowLeft size={18} />
        쇼핑으로 돌아가기
      </button>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <p>룩북을 불러오는 중...</p>
        </div>
      ) : (
        <>
          <section className="lookbook-hero">
            <div className="lookbook-hero__badge">
              <Sparkles size={18} />
              2025 시즌 룩북
            </div>
            <h1>일상의 새로운 발견</h1>
            <p>
              실용성과 디자인을 모두 갖춘 프리미엄 생활용품 컬렉션을 만나보세요. 주방, 욕실, 수납 등 
              일상의 모든 공간을 더욱 편리하고 아름답게 만들어주는 아이템들을 소개합니다.
            </p>
            <a
              className="lookbook-hero__cta"
              href="#lookbook-campaigns"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('.lookbook-campaigns')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              컬렉션 살펴보기
              <ExternalLink size={16} />
            </a>
          </section>

          <section id="lookbook-campaigns" className="lookbook-campaigns">
            {seasonCampaigns.map((campaign) => (
              <article key={campaign.title} className="lookbook-campaign">
                <div className="lookbook-campaign__image">
                  <img src={campaign.image} alt={`${campaign.title} 캠페인 이미지`} />
                </div>
                <div className="lookbook-campaign__content">
                  <p>{campaign.season}</p>
                  <h2>{campaign.title}</h2>
                  <p>{campaign.description}</p>
                  <button type="button" onClick={() => onOpenStyleNote(campaign)}>
                    스타일 노트 보기
                    <MoveRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section className="lookbook-editorial">
            <header>
              <h2>Editorial Stories</h2>
              <p>실제 상품을 활용한 일상 속 스타일링 아이디어를 살펴보세요.</p>
            </header>
            <div className="lookbook-editorial__grid">
              {editorialFeatures.map((feature) => (
                <article key={feature.title}>
                  <img src={feature.image} alt={feature.title} />
                  <div>
                    <h3>{feature.title}</h3>
                    <p>{feature.summary}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="lookbook-accessories">
            <div className="lookbook-accessories__card">
              <h2>추천 상품 하이라이트</h2>
              <p>일상의 완성도를 높이는 프리미엄 아이템을 제안합니다.</p>
              <ul>
                {accessoryHighlights.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="lookbook-accessories__visual">
              <img
                src={editorialFeatures[0]?.image || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80'}
                alt="Lookbook accessories"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default LookbookPage;

