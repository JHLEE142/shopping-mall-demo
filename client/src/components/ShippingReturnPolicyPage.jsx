import { ArrowLeft } from 'lucide-react';
import './ShippingReturnPolicyPage.css';

function ShippingReturnPolicyPage({ onBack, isLoggedIn = false }) {
  const handleWrite = () => {
    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }
    alert('반품/교환 문의 작성 화면으로 이동합니다.');
  };

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
        <h1 className="shipping-return-policy-page__title">배송/반품/교환안내</h1>
      </div>

      <div className="shipping-return-policy-page__content">
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">반품/교환 문의</h2>
          <div className="shipping-return-policy-section__content">
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <p>반품/교환 관련 문의는 로그인 후 작성할 수 있습니다.</p>
                <button
                  type="button"
                  className="shipping-return-policy-page__action-button"
                  onClick={handleWrite}
                >
                  문의 작성
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 배송 안내 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">배송 안내</h2>
          <div className="shipping-return-policy-section__content">
            {/* 배송방법 */}
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>배송방법</strong>
                <p>택배 배송 (CJ대한통운, 한진택배 등)</p>
              </div>
            </div>

            {/* 배송기간 */}
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>배송기간</strong>
                <p>결제 완료 후 평균 1~3일 소요</p>
                <p className="shipping-return-policy-item__note">
                  (택배사의 사정에 따라 변경될 수 있습니다. 도서/산간지역 또는 택배사의 상황에 따라 추가 소요될 수 있습니다.)
                </p>
              </div>
            </div>

            {/* 배송비용 */}
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>배송비용</strong>
                <div style={{ marginTop: '1rem' }}>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    <li style={{ marginBottom: '0.5rem' }}>
                      <strong>기본 배송비: 3,000원</strong>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#059669' }}>20,000원 이상 구매 시 무료배송</strong>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      도서/산간 지역의 경우 추가 배송비가 발생할 수 있습니다.
                    </li>
                    <li>
                      제품의 무게와 부피에 따라 배송비가 변동될 수 있습니다.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 배송마감시간 */}
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>배송마감시간</strong>
                <p><strong style={{ color: '#dc2626' }}>당일 오후 12시 전 결제완료건에 한해서 당일 출고</strong></p>
                <p className="shipping-return-policy-item__note" style={{ color: '#6b7280' }}>
                  (토요일, 일요일, 공휴일 출고 불가)
                </p>
              </div>
            </div>

            {/* 배송상태 조회 */}
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>배송상태 조회</strong>
                <ol style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    주문하신 상품의 배송진행 상황은 마이페이지 &gt; 나의주문 &gt; 주문/배송조회에서 해당 주문을 클릭하시면 주문상품의 배송상태를 확인하실 수 있습니다.
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    배송진행 사항은 주문내역의 처리상황이 발송 완료일때(택배배송일 경우) 송장번호를 클릭하여 확인하실 수 있습니다.
                  </li>
                  <li>
                    고객님이 부재중이시거나 도로 교통사정으로 배송이 지연되는 경우가 발생할 수 있습니다.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* 반품/교환이 가능한 경우 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">반품/교환이 가능한 경우</h2>
          <div className="shipping-return-policy-section__content">
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>1. 상품의 하자 및 오배송</strong>
                <p>상품 수령 후 7일 이내 고객센터 또는 마이페이지를 통해 신청 가능 (배송비 무료)</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>2. 단순 변심</strong>
                <p>상품 수령 후 7일 이내 신청 가능 (단, 배송비는 고객 부담)</p>
                <p className="shipping-return-policy-item__note">
                  ※ 상품의 내용을 확인하기 위해 포장을 개봉한 경우에도 상품의 가치가 훼손되지 않은 한 반품/교환이 가능합니다.
                </p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>3. 계절상품</strong>
                <p>해당 계절에만 반품/교환 가능 (공지사항 참고)</p>
              </div>
            </div>
          </div>
        </section>

        {/* 반품/교환이 불가능한 경우 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">반품/교환이 불가능한 경우</h2>
          <div className="shipping-return-policy-section__content">
            <ol className="shipping-return-policy-item__ordered-list">
              <li>
                <strong>고객의 사용 또는 일부 소비로 상품의 가치가 현저히 감소한 경우</strong>
                <p>상품을 사용하거나 일부 소비하여 상품의 가치가 현저히 감소한 경우 반품/교환이 불가능합니다.</p>
              </li>
              <li>
                <strong>시간 경과로 재판매가 곤란할 정도로 상품의 가치가 현저히 감소한 경우</strong>
                <p>상품 수령 후 시간이 경과하여 재판매가 곤란할 정도로 상품의 가치가 현저히 감소한 경우 반품/교환이 불가능합니다.</p>
              </li>
              <li>
                <strong>복제가 가능한 상품의 포장을 훼손한 경우</strong>
                <p>CD, DVD, 소프트웨어 등 복제가 가능한 상품의 포장을 훼손한 경우 반품/교환이 불가능합니다.</p>
              </li>
              <li>
                <strong>고객의 주문에 따라 개별적으로 생산되는 상품</strong>
                <p>고객의 주문에 따라 개별적으로 생산되는 상품으로 재판매가 어려운 경우 반품/교환이 불가능합니다.</p>
              </li>
              <li>
                <strong>반품 상품 미도착 시</strong>
                <p>반품/교환 신청 후 7일 이내에 상품이 도착하지 않으면 구매 확정으로 처리되며, 반품 처리가 불가능합니다.</p>
              </li>
              <li>
                <strong>일방적 조치</strong>
                <p>회사와 사전 협의 없이 일방적으로 교환/반품/환불 처리한 경우 불가능합니다. 반드시 고객센터와 협의 후 신청해주세요.</p>
              </li>
              <li>
                <strong>상품에 직접 택배 라벨 부착</strong>
                <p>택배 라벨이 상품에 직접 부착되어 재판매가 불가능한 경우 반품이 불가능합니다.</p>
              </li>
              <li>
                <strong>"반품 불가" 표시</strong>
                <p>상품 페이지에 "반품 불가"로 명시된 상품은 반품이 불가능합니다.</p>
              </li>
            </ol>
          </div>
        </section>

        {/* 교환 및 반품 불가 예시 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">교환 및 반품 불가 예시</h2>
          <div className="shipping-return-policy-section__content">
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__example">
                <div className="shipping-return-policy-item__example-box">
                  <div className="shipping-return-policy-item__example-placeholder">
                    [기존 상품포장에 재포장한 경우]
                  </div>
                </div>
                <p>- 기존 상품포장에 재포장한 경우</p>
              </div>
              <div className="shipping-return-policy-item__example">
                <div className="shipping-return-policy-item__example-box">
                  <div className="shipping-return-policy-item__example-placeholder">
                    [상품의 포장을 훼손한 경우]
                  </div>
                </div>
                <p>- 상품의 포장을 훼손한 경우</p>
              </div>
            </div>
          </div>
        </section>

        {/* 추가 안내사항 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">추가 안내사항</h2>
          <div className="shipping-return-policy-section__content">
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>1. 반품/교환 신청 방법</strong>
                <p>마이페이지 &gt; 주문/배송조회에서 반품/교환 신청이 가능합니다. 고객센터를 통해서도 신청 가능합니다.</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>2. 반품 배송비</strong>
                <p>단순 변심으로 인한 반품의 경우 배송비는 고객 부담입니다. 상품 하자 및 오배송의 경우 배송비는 무료입니다.</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>3. 처리 시간</strong>
                <p>반품 상품 확인 후 환불 처리는 영업일 기준 2~3일 소요됩니다. 카드 결제의 경우 카드사 사정에 따라 추가 소요될 수 있습니다.</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>4. 환불 방법</strong>
                <p>결제하신 수단(신용카드, 계좌이체 등)으로 환불됩니다. 카드 결제의 경우 카드사 사정에 따라 환불까지 최대 7일이 소요될 수 있습니다.</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>5. 반품 상품 포장</strong>
                <p>반품 시 상품을 받으신 상태로 포장하여 반송해주세요. 원래 포장재가 없는 경우 다른 포장재로 안전하게 포장해주시기 바랍니다.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ShippingReturnPolicyPage;
