import { ArrowLeft, Palette, Sparkles, Scissors, Globe, MoveRight } from 'lucide-react';

const SUNSET_MOTION_CONTENT = {
  headline: 'About Us',
  intro:
    '코로라는 최신 소재 기술과 감각적인 실루엣을 바탕으로, 언제 어디에서나 빛나는 리조트 라이프스타일을 제안합니다. 고객이 원하는 순간에 맞춰 컬렉션을 빠르게 선보이며, 항상 기대 이상의 만족을 전달하는 것이 목표입니다.',
  sections: [
    '디지털 룩북, 인터랙티브 매거진 등 다양한 포맷으로 브랜드 스토리를 확장합니다.',
    '사용자 경험을 최우선으로 생각하며, 고객의 성공을 위한 툴을 끊임없이 개발합니다.',
  ],
  gallery: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  ],
  feature: {
    title: '02 New Products',
    description:
      '섬세한 패턴과 구조적인 컷아웃 디테일로 완성된 수영복 라인. 모래사장과 도시 풀사이드 모두에서 존재감을 드러냅니다.',
    image:
      'https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?auto=format&fit=crop&w=900&q=80',
    collage: [
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=600&q=80',
    ],
  },
};

const SOFT_MOMENTUM_CONTENT = {
  casual: {
    title: 'Casual',
    description:
      'Casual cool style refers to a fashion aesthetic that centers comfort, ease, and a laid-back vibe while still maintaining a sense of fashion-forwardness. 자연스러운 실루엣으로 여유로운 라이프스타일을 표현합니다.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  },
  minimalist: {
    title: 'Modern Minimalist',
    description:
      '미니멀리스트 스타일은 간결한 라인과 정제된 컬러 팔레트가 특징입니다. 불필요한 디테일을 줄여 실루엣과 소재의 가치에 집중합니다.',
    image:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  },
  inspiration:
    '이 유니크한 스타일은 슬릭한 라인, 선명한 실루엣, 예상치 못한 텍스처를 조합해 현대적인 미학을 보여줍니다.',
};

const URBAN_BLOOM_CONTENT = {
  toc: [
    {
      title: 'Introduction to the Brand',
      description: '현대적 감각과 실험적인 실루엣이 만나는 지점을 소개합니다.',
    },
    {
      title: 'Look 1: Casual Cool',
      description: '자유로운 도시 러닝 감성을 담은 데일리 룩.',
    },
    {
      title: 'Look 2: Modern Minimalist',
      description: '클린 라인과 모노톤 팔레트로 완성한 절제된 스타일.',
    },
    {
      title: 'Look 3: Weekend Getaway',
      description: '바닷바람을 닮은 컬러와 텍스처를 믹스한 리조트 룩.',
    },
    {
      title: 'Trend Inspiration',
      description: 'Bold Fashion for the Fearless – 대담한 포인트를 더한 시즌 트렌드.',
    },
  ],
  gallery: [
    'https://images.unsplash.com/photo-1511288599420-2bf5f36a0c1b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
  ],
  brandStory:
    '코로라는 클래식과 모더니티 사이를 유영하며, 우아한 라인과 대담한 디테일을 결합해 고유한 스타일을 제안합니다. 이번 시즌은 유연한 소재와 스포티한 구조를 믹스해 도시 속에서도 빛나는 룩을 완성합니다.',
  looks: [
    {
      title: 'Casual Cool',
      description:
        '편안함과 감각적인 무드를 동시에 담은 스타일. 은은한 패턴과 경쾌한 컬러 포인트로 일상의 자유로움을 표현합니다.',
      image:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80',
    },
    {
      title: 'Modern Minimalist',
      description:
        '미니멀한 라인과 따뜻한 뉴트럴 톤을 조합해 균형 잡힌 실루엣을 연출합니다. 레이어링으로 깊이감을 더하세요.',
      image:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80',
    },
  ],
  getaways: [
    'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
  ],
};

function UrbanBloomStyleNote({ note, onBack }) {
  return (
    <div className="style-note style-note--urban">
      <button type="button" className="style-note__back" onClick={onBack}>
        <ArrowLeft size={18} />
        목록으로 돌아가기
      </button>

      <section className="urban-spread urban-spread--intro">
        <div className="urban-page urban-page--toc">
          <div className="urban-page__hero">
            <img
              src="https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80"
              alt="Urban Bloom hero"
            />
            <div className="urban-page__overlay">
              <h2>Table of Contents</h2>
              <ol>
                {URBAN_BLOOM_CONTENT.toc.map((item) => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.description}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="urban-page urban-page--brand">
          <div className="urban-page__spotlight">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"
              alt="Corora denim look"
            />
            <span>Ignite Your Style · Illuminate Your Wardrobe</span>
          </div>
          <div className="urban-page__brand">
            <h3>Introduction to the Brand</h3>
            <p>{URBAN_BLOOM_CONTENT.brandStory}</p>
          </div>
          <div className="urban-page__thumbnails">
            {URBAN_BLOOM_CONTENT.gallery.map((image, index) => (
              <img key={`${image}-${index}`} src={image} alt={`Urban Bloom gallery ${index + 1}`} />
            ))}
          </div>
        </div>
      </section>

      <section className="urban-spread urban-spread--looks">
        {URBAN_BLOOM_CONTENT.looks.map((look) => (
          <article key={look.title} className="urban-look">
            <div className="urban-look__visual">
              <img src={look.image} alt={look.title} />
            </div>
            <div className="urban-look__body">
              <h3>{look.title}</h3>
              <p>{look.description}</p>
              <div className="urban-look__detail">
                <span>Style Focus</span>
                <p>
                  다양한 텍스처와 길이를 활용해 입체감을 주고, 액세서리는 내추럴 소재를 선택해 편안함을 강조하세요.
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="urban-spread urban-spread--getaway">
        <div className="urban-getaway__about">
          <h2>Weekend Getaway</h2>
          <p>
            바다에서 영감을 받은 선셋 팔레트와 시어한 소재 조합으로 감각적인 휴양지 룩을 완성합니다. 스카프와 랩 드레스,
            네트 백을 포인트로 활용해 자유로운 무드를 표현하세요.
          </p>
          <ul>
            <li>01. Lightweight Resort Shirt & Swimsuit Layering</li>
            <li>02. Resort Knit & Sun-bleached Shorts</li>
            <li>03. Sunset Flow Maxi & Net Tote Styling</li>
          </ul>
        </div>
        <div className="urban-getaway__grid">
          {URBAN_BLOOM_CONTENT.getaways.map((image, index) => (
            <div key={image} className={`urban-getaway__item urban-getaway__item--${index + 1}`}>
              <img src={image} alt={`Getaway look ${index + 1}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SunsetMotionStyleNote({ note, onBack }) {
  return (
    <div className="style-note style-note--sunset">
      <button type="button" className="style-note__back" onClick={onBack}>
        <ArrowLeft size={18} />
        목록으로 돌아가기
      </button>

      <section className="sunset-spread sunset-spread--about">
        <article className="sunset-page sunset-page--about">
          <div className="sunset-page__header">
            <h2>ABOUT US</h2>
            <p>{SUNSET_MOTION_CONTENT.intro}</p>
          </div>
          <div className="sunset-page__grid">
            {SUNSET_MOTION_CONTENT.gallery.slice(0, 4).map((image, index) => (
              <figure key={`${image}-${index}`} className={`sunset-card sunset-card--${index + 1}`}>
                <img src={image} alt={`Sunset motion gallery ${index + 1}`} />
              </figure>
            ))}
          </div>
          <div className="sunset-page__footer">
            {SUNSET_MOTION_CONTENT.sections.map((text, index) => (
              <p key={index}>{text}</p>
            ))}
          </div>
        </article>

        <article className="sunset-page sunset-page--feature">
          <div className="sunset-feature__visual">
            <img src={SUNSET_MOTION_CONTENT.feature.image} alt="Sunset motion feature" />
          </div>
          <div className="sunset-feature__meta">
            <div className="sunset-feature__tag">02</div>
            <div>
              <h3>{SUNSET_MOTION_CONTENT.feature.title}</h3>
              <p>{SUNSET_MOTION_CONTENT.feature.description}</p>
            </div>
          </div>
          <div className="sunset-feature__collage">
            {SUNSET_MOTION_CONTENT.feature.collage.map((image, index) => (
              <img key={`${image}-${index}`} src={image} alt={`Sunset collage ${index + 1}`} />
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}

function SoftMomentumStyleNote({ note, onBack }) {
  return (
    <div className="style-note style-note--soft">
      <button type="button" className="style-note__back" onClick={onBack}>
        <ArrowLeft size={18} />
        목록으로 돌아가기
      </button>

      <section className="soft-spread">
        <article className="soft-page soft-page--casual">
          <header>
            <span>COOL LOOKS</span>
            <h2>{SOFT_MOMENTUM_CONTENT.casual.title}</h2>
            <p>{SOFT_MOMENTUM_CONTENT.casual.description}</p>
          </header>
          <figure>
            <img src={SOFT_MOMENTUM_CONTENT.casual.image} alt="Soft momentum casual look" />
          </figure>
        </article>

        <article className="soft-page soft-page--minimal">
          <div className="soft-page__column">
            <h3>{SOFT_MOMENTUM_CONTENT.minimalist.title}</h3>
            <p>{SOFT_MOMENTUM_CONTENT.minimalist.description}</p>
          </div>
          <div className="soft-page__gallery">
            <img
              src={SOFT_MOMENTUM_CONTENT.minimalist.image}
              alt="Soft momentum minimalist look"
              className="soft-page__hero"
            />
            <img
              src="https://images.unsplash.com/photo-1512207855852-60cf2ad7fd12?auto=format&fit=crop&w=900&q=80"
              alt="Soft knit detail"
              className="soft-page__detail"
            />
          </div>
          <aside className="soft-page__aside">
            <h4>INSPIRATION</h4>
            <p>{SOFT_MOMENTUM_CONTENT.inspiration}</p>
          </aside>
        </article>
      </section>
    </div>
  );
}

function GenericStyleNote({ note, onBack }) {
  return (
    <div className="style-note">
      <button type="button" className="style-note__back" onClick={onBack}>
        <ArrowLeft size={18} />
        룩북으로 돌아가기
      </button>

      <header className="style-note__hero">
        <div className="style-note__hero-badge">
          <Sparkles size={18} />
          {note.season}
        </div>
        <h1>{note.title}</h1>
        <p>{note.description}</p>
        <div className="style-note__hero-meta">
          <div>
            <Palette size={18} />
            <span>Key Palette</span>
            <strong>{note.palette || 'Moody Pastel x Neutral Glow'}</strong>
          </div>
          <div>
            <Scissors size={18} />
            <span>Silhouette</span>
            <strong>{note.silhouette || 'Structured Layering & Fluid Movement'}</strong>
          </div>
          <div>
            <Globe size={18} />
            <span>Inspiration</span>
            <strong>{note.inspiration || 'Global city runners after dark'}</strong>
          </div>
        </div>
      </header>

      <section className="style-note__visual">
        <img src={note.image} alt={`${note.title} 스타일 노트`} />
        <div className="style-note__visual-overlay">
          <span>Trend Forecast</span>
          <p>텍스처 대비, 광택 조절, 그리고 비율 실험이 이번 시즌 스타일 포인트입니다.</p>
        </div>
      </section>

      <section className="style-note__details">
        <article className="style-note__card">
          <h2>Color Story</h2>
          <p>
            동일한 채도의 색을 겹겹이 쌓아 깊이감을 만들고, 메탈릭 포인트로 윤곽을 살려주세요. 실키한 소재와 매트한
            소재를 교차로 배치하면 움직일 때마다 생동감이 살아납니다.
          </p>
          <ul className="style-note__swatches">
            {(note.swatches || ['#f4ede2', '#d8c1c2', '#2c2d31', '#aab9bf']).map((color) => (
              <li key={color} style={{ backgroundColor: color }} />
            ))}
          </ul>
        </article>

        <article className="style-note__card">
          <h2>Layer Guide</h2>
          <p>
            스트럭처가 있는 재킷에 플로우한 스커트(또는 와이드 팬츠)를 매치해 대비를 강조하세요. 신체 중심을 한 번
            더 감싸는 벨트나 스카프를 활용하면 비율이 더욱 완성됩니다.
          </p>
          <ul className="style-note__steps">
            <li>
              <strong>Step 1.</strong> 시티 윈드 브레이커 위에 메쉬 탱크를 매치합니다.
            </li>
            <li>
              <strong>Step 2.</strong> 하의는 플리츠 스커트 또는 플로어 길이 쇼츠로 볼륨을 더합니다.
            </li>
            <li>
              <strong>Step 3.</strong> 발목 위로 떨어지는 미드 하이 삭스로 다리를 정돈해주세요.
            </li>
          </ul>
        </article>

        <article className="style-note__card style-note__card--focus">
          <h2>Feature Pieces</h2>
          <div className="style-note__feature-list">
            <div>
              <span>01</span>
              <h3>Glass Sheen Jacket</h3>
              <p>빛을 받으면 은은하게 빛나는 하이브리드 패브릭. 도시 야경에서 가장 돋보입니다.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Weightless Pleats</h3>
              <p>움직임에 따라 자연스럽게 펼쳐지는 플리츠 디테일. 허리 라인을 부드럽게 감싸줍니다.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Reflect Accent Belt</h3>
              <p>벨트 끝에 리플렉티브 라인이 있어 밤에도 안전하게 스타일을 유지해요.</p>
            </div>
          </div>
          <button type="button" className="style-note__cta">
            스타일링 숏폼 보기
            <MoveRight size={16} />
          </button>
        </article>
      </section>
    </div>
  );
}

function StyleNotePage({ note, onBack = () => {} }) {
  if (!note) {
    return null;
  }

  if (note.title === 'Urban Bloom') {
    return <UrbanBloomStyleNote note={note} onBack={onBack} />;
  }

  if (note.title === 'Sunset Motion') {
    return <SunsetMotionStyleNote note={note} onBack={onBack} />;
  }

  if (note.title === 'Soft Momentum') {
    return <SoftMomentumStyleNote note={note} onBack={onBack} />;
  }

  return <GenericStyleNote note={note} onBack={onBack} />;
}

export default StyleNotePage;

