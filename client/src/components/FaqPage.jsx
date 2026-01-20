import './MonochromePage.css';

const FAQS = [
  {
    question: '배송은 얼마나 걸리나요?',
    answer: '기본 배송은 결제 완료 후 3~5일 내에 도착합니다.',
  },
  {
    question: '반품은 어떻게 신청하나요?',
    answer: '마이페이지 > 주문 내역에서 교환/반품 신청을 진행할 수 있습니다.',
  },
  {
    question: '회원 혜택은 어떤 것이 있나요?',
    answer: '적립금, 쿠폰, 무료 반품 혜택이 제공됩니다.',
  },
];

function FaqPage({ onBack, isLoggedIn = false }) {
  const handleWrite = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    alert('문의 작성 화면으로 이동합니다.');
  };

  return (
    <div className="mono-page">
      <div className="mono-page__container">
        <header className="mono-header">
          <button type="button" className="mono-back" onClick={onBack}>
            ← 뒤로가기
          </button>
          <h1 className="mono-title">자주 묻는 질문</h1>
          <p className="mono-subtitle">가장 많이 문의하는 내용을 정리했습니다.</p>
        </header>

        <section className="mono-section">
          <h2 className="mono-section__title">FAQ</h2>
          <ul className="mono-list">
            {FAQS.map((faq) => (
              <li key={faq.question} className="mono-list__item">
                <strong>{faq.question}</strong>
                <p className="mono-muted">{faq.answer}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="mono-section">
          <h2 className="mono-section__title">추가 문의</h2>
          <p className="mono-muted">원하는 답변이 없다면 문의를 남겨주세요.</p>
          <div className="mono-actions">
            <button type="button" className="mono-button" onClick={handleWrite}>
              문의 작성
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default FaqPage;
