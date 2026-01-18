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
        <h1 className="shipping-return-policy-page__title">배송/반품/교환안내</h1>
      </div>

      <div className="shipping-return-policy-page__content">
        {/* 배송 안내 */}
        <section className="shipping-return-policy-section">
          <h2 className="shipping-return-policy-section__title">배송 안내</h2>
          <div className="shipping-return-policy-section__content">
            {/* 배송방법 */}
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>배송방법</strong>
                <p>방문수령, 용달, 화물, 택배, 배달</p>
              </div>
            </div>

            {/* 배송기간 */}
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>배송기간</strong>
                <p>평균 1~3일</p>
                <p className="shipping-return-policy-item__note">
                  (택배사의 사정에 따라 변경될 수 있습니다. 도서/산간지역 또는 택배사의 상황에 따라 몇 일 더 소요될 수 있습니다.)
                </p>
              </div>
            </div>

            {/* 배송비용 */}
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>배송비용</strong>
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>1) 택배</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                      <li>배송비: 착불(3,000원)</li>
                      <li>평균박스 규격: 630x450x500mm (평균 합포장금액 200,000~300,000원)</li>
                    </ul>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>2) 화물</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                      <li>배송비: 착불(5,000원)</li>
                      <li>평균박스 규격: 660x500x750mm (평균 합포장금액 300,000~400,000원)</li>
                    </ul>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <strong>3) 용달</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                      <li>배송비: <strong style={{ color: '#dc2626' }}>조건부무료 (300만원 이상 주문시, 용달비 지원(최대 10만원))</strong></li>
                    </ul>
                  </div>
                  <div>
                    <strong>4) 배달</strong>
                    <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                      <li>배송비: 무료</li>
                      <li>배달조건: <strong style={{ color: '#dc2626' }}>경기도 광주, 성남지역(100만원 이상 주문시)</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 추가 안내사항 */}
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <ul style={{ paddingLeft: '1.5rem' }}>
                  <li style={{ marginBottom: '0.5rem' }}>
                    도서/산간 지역 배송시 추가운임비가 나오며, 물품의 부피와 무게에 따라 배송비는 변동될 수 있습니다.
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#dc2626' }}>세제, 밀폐용기, 저금통, 건조대, 서랍장등 무게가 많이 나가거나 부피가 큰 제품은 배송비 대비하여, 용달, 방문수령, 배달을 권해드립니다.</strong>
                  </li>
                  <li style={{ marginBottom: '0.5rem' }}>
                    <strong style={{ color: '#dc2626' }}>당사는 과중된 배송료에 대한 책임을 지지 않습니다.</strong>
                  </li>
                  <li>
                    <strong style={{ color: '#dc2626' }}>택배로 배송을 원하실 경우 제품 특성상 택배가 불가한 제품도 있습니다. (ex)전신거울, 술병, 락스등)</strong>
                  </li>
                </ul>
              </div>
            </div>

            {/* 배송마감시간 */}
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>배송마감시간</strong>
                <p><strong style={{ color: '#dc2626' }}>당일 오후 12시 전 결제완료건에 한해서 당일 출고</strong></p>
                <p className="shipping-return-policy-item__note" style={{ color: '#dc2626' }}>
                  <strong>(토요일, 일요일, 공휴일 출고불가)</strong>
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
                <strong>1. 오배송인 경우</strong>
                <p>상품 수령 후 7일 이내 고객센터 또는 마이페이지를 통해 신청 가능</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>2. 계절상품인 경우</strong>
                <p>해당 계절에만 반품/교환 가능 (공지사항 참고)</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>3. 단순 변심인 경우</strong>
                <p>상품 수령 후 7일 이내 신청 가능 (단, 배송비는 고객 부담)</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>4. 상품 하자/불량인 경우 (오배송 제외)</strong>
                <p>반품 금액이 80,000원 이상일 경우 박스당 80,000원 기준으로 반품 처리</p>
                <p className="shipping-return-policy-item__note">※ 80,000원 미만일 경우 배송비는 고객 부담 (80,000원 이상 모으면 배송비 절약 가능)</p>
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
                <strong>반품 상품 미도착 시</strong>
                <p>반품/교환 신청 후 7일 이내에 상품이 도착하지 않으면 구매 확정으로 처리되며, 반품 처리가 불가능합니다.</p>
              </li>
              <li>
                <strong>포장 훼손/재판매 불가</strong>
                <p>포장이 훼손되었거나 시간 경과로 인해 재판매가 불가능한 상품은 교환/반품이 불가능합니다.</p>
              </li>
              <li>
                <strong>일방적 조치</strong>
                <p>회사와 사전 협의 없이 일방적으로 교환/반품/환불 처리한 경우 불가능합니다. 반드시 고객센터와 협의 후 신청해주세요.</p>
              </li>
              <li>
                <strong>전자제품 포장 개봉</strong>
                <p>전자제품의 경우 제조사 특성상 포장을 개봉한 경우 교환/반품이 불가능합니다.</p>
              </li>
              <li>
                <strong>구성품 누락/파손</strong>
                <p>상품의 구성품이 누락되거나 파손된 경우, 상품을 사용하지 않았더라도 반품이 불가능합니다.</p>
              </li>
              <li>
                <strong>상품 하자/불량 (출고일 기준 3개월 경과)</strong>
                <p>판매 중 발견된 상품 하자나 불량의 경우, 출고일로부터 3개월 이내에만 반품/환불이 가능합니다.</p>
              </li>
              <li>
                <strong>상품 파손/택배 라벨 부착</strong>
                <p>상품이 파손되었거나 택배 라벨이 상품에 직접 부착되어 재판매가 불가능한 경우 반품이 불가능합니다.</p>
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
                <strong>1. 처리 시간</strong>
                <p>반품/교환/환불 처리는 반품 상품 확인 후 약 2~3일 소요됩니다.</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>2. 지정 택배사 이용</strong>
                <p>반품/교환 시 지정 택배사를 이용해주세요. 지정 택배사가 아닌 경우 배송비는 고객 부담입니다.</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>3. 특수 케이스</strong>
                <p>오픈마켓 및 장기 거래 업체의 경우 별도 문의를 부탁드립니다.</p>
              </div>
            </div>
            <div className="shipping-return-policy-item">
              <div className="shipping-return-policy-item__content">
                <strong>4. 반품 사유 명시</strong>
                <p>상품에 하자가 있는 경우 반드시 반품 사유를 명확히 기재해주세요.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ShippingReturnPolicyPage;
