import { ArrowLeft } from 'lucide-react';
import './EventBenefitPage.css';

function EventBenefitPage({ onBack }) {
  return (
    <div className="event-benefit-page">
      <div className="event-benefit-page__container">
        <button
          type="button"
          className="event-benefit-page__back-button"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          뒤로가기
        </button>
        
        <div className="event-benefit-page__content">
          <div className="event-benefit-page__coming-soon">
            <h1 className="event-benefit-page__title">이벤트/회원혜택</h1>
            <p className="event-benefit-page__message">준비중입니다.</p>
            <p className="event-benefit-page__description">
              출석체크 등 매일 새로운 미션으로 혜택을 받을 수 있는 서비스를 준비 중입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventBenefitPage;

