import { ArrowLeft } from 'lucide-react';
import './ShippingReturnPolicyPage.css';

function ShippingReturnPolicyPage({ onBack }) {
  return (
    <div className="shipping-return-policy-page">
      <div className="shipping-return-policy-page__header">
        <button 
          className="shipping-return-policy-page__back-button"
          onClick={onBack}
          type="button"
        >
          <ArrowLeft size={20} />
          뒤로가기
        </button>
        <h1 className="shipping-return-policy-page__title">배송/교환/반품 안내</h1>
      </div>

      <div className="shipping-return-policy-page__content">
        {/* 배송 안내 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">배송 안내</h2>
          <div className="shipping-return-policy-section__content">
            <div className="shipping-return-policy-item">
              <h3 className="shipping-return-policy-item__title">배송비</h3>
              <ul className="shipping-return-policy-item__list">
                <li>기본 배송비: 3,000원</li>
                <li><strong>20,000원 이상 구매 시 무료배송</strong></li>
                <li>제주도 및 도서산간 지역은 추가 배송비가 발생할 수 있습니다.</li>
              </ul>
            </div>

            <div className="shipping-return-policy-item">
              <h3 className="shipping-return-policy-item__title">배송 기간</h3>
              <ul className="shipping-return-policy-item__list">
                <li>주문 완료 후 1-2일 내 출고됩니다.</li>
                <li>배송 기간은 출고일로부터 2-3일 소요됩니다.</li>
                <li>주말 및 공휴일은 배송 기간에 포함되지 않습니다.</li>
                <li>천재지변, 택배사 사정 등으로 배송이 지연될 수 있습니다.</li>
              </ul>
            </div>

            <div className="shipping-return-policy-item">
              <h3 className="shipping-return-policy-item__title">배송 추적</h3>
              <ul className="shipping-return-policy-item__list">
                <li>주문 완료 후 배송 추적 번호가 발급됩니다.</li>
                <li>마이페이지의 주문 내역에서 배송 상태를 확인하실 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 교환 안내 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">교환 안내</h2>
          <div className="shipping-return-policy-section__content">
            <div className="shipping-return-policy-notice shipping-return-policy-notice--important">
              <p>
                <strong>교환 서비스는 제공하지 않습니다.</strong>
              </p>
              <p>
                상품 교환이 필요한 경우, 반품 후 원하시는 상품을 재구매해주시기 바랍니다.
              </p>
            </div>
          </div>
        </section>

        {/* 반품 안내 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">반품 안내</h2>
          <div className="shipping-return-policy-section__content">
            <div className="shipping-return-policy-item">
              <h3 className="shipping-return-policy-item__title">반품 가능 기간</h3>
              <ul className="shipping-return-policy-item__list">
                <li><strong>상품 수령 후 7일 이내</strong>에만 반품 접수가 가능합니다.</li>
                <li>반품 접수 기간을 초과한 경우 반품이 불가능합니다.</li>
              </ul>
            </div>

            <div className="shipping-return-policy-item">
              <h3 className="shipping-return-policy-item__title">반품 불가 사유</h3>
              <ul className="shipping-return-policy-item__list">
                <li><strong>상품 개봉 및 훼손 시 재판매가 불가능하여 반품이 거부될 수 있습니다.</strong></li>
                <li>고객님의 사용 또는 일부 소비로 상품의 가치가 현저히 감소한 경우</li>
                <li>시간 경과로 인해 재판매가 곤란할 정도로 상품의 가치가 감소한 경우</li>
                <li>복제가 가능한 상품의 포장을 훼손한 경우</li>
                <li>주문 확인 후 상품 제조에 들어가는 주문제작 상품</li>
              </ul>
            </div>

            <div className="shipping-return-policy-item">
              <h3 className="shipping-return-policy-item__title">반품 배송비</h3>
              <div className="shipping-return-policy-notice shipping-return-policy-notice--warning">
                <p>
                  <strong>변심으로 인한 반품 시 반품 배송비는 고객 부담입니다.</strong>
                </p>
                <ul>
                  <li>20,000원 이상 구매로 무료배송을 받으신 경우, 초기 무료배송 비용을 포함하여 <strong>왕복 6,000원</strong>을 고객이 부담해야 합니다.</li>
                  <li>일반 배송비(3,000원)를 지불하신 경우, 반품 배송비는 3,000원입니다.</li>
                </ul>
              </div>
            </div>

            <div className="shipping-return-policy-item">
              <h3 className="shipping-return-policy-item__title">반품 절차</h3>
              <ol className="shipping-return-policy-item__ordered-list">
                <li>마이페이지 &gt; 주문 내역에서 반품 신청을 진행해주세요.</li>
                <li>반품 사유를 선택하고 상세 내용을 입력해주세요.</li>
                <li>반품 승인 후 반품 배송비를 결제해주세요.</li>
                <li>상품을 원래 포장 상태로 재포장하여 반품해주세요.</li>
                <li>반품 상품 도착 후 검수 완료 시 환불이 진행됩니다.</li>
              </ol>
            </div>

            <div className="shipping-return-policy-item">
              <h3 className="shipping-return-policy-item__title">환불 안내</h3>
              <ul className="shipping-return-policy-item__list">
                <li>반품 상품 검수 완료 후 3-5일 내 환불이 진행됩니다.</li>
                <li>결제 수단에 따라 환불 기간이 다를 수 있습니다.</li>
                <li>반품 배송비는 환불 금액에서 차감됩니다.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 주의사항 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">주의사항</h2>
          <div className="shipping-return-policy-section__content">
            <div className="shipping-return-policy-notice shipping-return-policy-notice--important">
              <ul>
                <li><strong>상품 개봉 및 훼손 시 재판매가 불가능하여 반품이 거부될 수 있습니다.</strong></li>
                <li>반품 시 상품은 원래 포장 상태로 재포장해주시기 바랍니다.</li>
                <li>반품 접수는 상품 수령 후 7일 이내에만 가능합니다.</li>
                <li>교환 서비스는 제공하지 않으며, 반품 후 재구매하는 방식을 이용해주세요.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 고객센터 안내 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">문의 안내</h2>
          <div className="shipping-return-policy-section__content">
            <div className="shipping-return-policy-item">
              <p>
                배송/교환/반품 관련 문의사항이 있으시면 고객센터로 연락해주시기 바랍니다.
              </p>
              <p>
                고객센터 운영시간: 평일 09:00 - 18:00 (주말 및 공휴일 휴무)
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ShippingReturnPolicyPage;

