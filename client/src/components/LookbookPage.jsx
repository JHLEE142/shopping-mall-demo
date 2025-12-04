import { ArrowLeft, ExternalLink, Sparkles, MoveRight } from 'lucide-react';

export const SEASON_CAMPAIGNS = [
  {
    season: '2025 SPRING',
    title: 'Urban Bloom',
    description: '산뜻한 파스텔과 유광 텍스처가 조화를 이루는 도심 스타일. 레이어링 가능한 윈드 자켓과 플리츠 쇼츠가 포인트.',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    season: '2025 SUMMER',
    title: 'Sunset Motion',
    description: '여름 노을에서 영감을 받은 오렌지와 바이올렛 프레이밍. 컷아웃 수영복과 시어 커버업으로 완성.',
    image:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
  },
  {
    season: '2025 PRE-FALL',
    title: 'Soft Momentum',
    description: '소프트 뉴트럴 톤과 구조적인 실루엣이 어우러진 프리폴 룩. 스카프 디테일과 비대칭 커팅이 시선을 사로잡습니다.',
    image:
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80',
  },
];

const EDITORIAL_FEATURES = [
  {
    title: 'Runway to Road',
    summary: '하이엔드 러닝 웨어를 일상 속 스타일링으로 확장하는 5가지 방법. 재킷과 쇼츠의 비율, 소재 밀도에 주목하세요.',
    image:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Monochrome Layers',
    summary: '한 가지 톤으로 완성하는 레이어드 룩북. 텍스처 차이를 이용해 깊이감 있는 실루엣을 연출합니다.',
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Night Runner',
    summary: '반사 디테일과 글로시 소재를 활용한 야간 러닝 스타일. 빛을 받으면 은은하게 빛나는 시그니처 요소를 확인하세요.',
    image:
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
  },
];

const ACCESSORY_HIGHLIGHTS = [
  '무광 실버 하드웨어와 매트한 텍스처의 백팩',
  '라이트웨이트 니트 버킷 햇과 소프트 코튼 스카프',
  '컬러 포인트를 주는 러닝 슈레이스 키트',
];

function LookbookPage({ onBack = () => {}, onOpenStyleNote = () => {} }) {
  return (
    <div className="lookbook">
      <button type="button" className="lookbook__back" onClick={onBack}>
        <ArrowLeft size={18} />
        쇼핑으로 돌아가기
      </button>

      <section className="lookbook-hero">
        <div className="lookbook-hero__badge">
          <Sparkles size={18} />
          2025 시즌 룩북
        </div>
        <h1>Movement, Reimagined</h1>
        <p>
          컬렉션 디자이너가 제안하는 러닝 & 애슬레저 룩의 최신 무브먼트를 만나보세요. 패브릭 연구소의 리포트와 함께
          색감, 실루엣, 기능을 균형 있게 담아낸 룩을 선보입니다.
        </p>
        <a
          className="lookbook-hero__cta"
          href="https://www.vogue.com/fashion/runway" /* reference link */
          target="_blank"
          rel="noreferrer"
        >
          레퍼런스 아카이브 살펴보기
          <ExternalLink size={16} />
        </a>
      </section>

      <section className="lookbook-campaigns">
        {SEASON_CAMPAIGNS.map((campaign) => (
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
          <p>런웨이 감성을 일상적인 실루엣으로 풀어낸 에디토리얼을 살펴보세요.</p>
        </header>
        <div className="lookbook-editorial__grid">
          {EDITORIAL_FEATURES.map((feature) => (
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
          <h2>Accessories Highlight</h2>
          <p>스타일의 완성도를 높이는 포인트 아이템을 제안합니다.</p>
          <ul>
            {ACCESSORY_HIGHLIGHTS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="lookbook-accessories__visual">
          <img
            src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"
            alt="Lookbook accessories"
          />
        </div>
      </section>
    </div>
  );
}

export default LookbookPage;

