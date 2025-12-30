const BOARD_LINKS = [
  { label: '카카오톡 상담', highlight: true },
  { label: '자주 묻는 질문' },
  { label: '반품/교환' },
  { label: '구매후기' },
  { label: '배송문의' },
  { label: '입금/결제/취소' },
];

const CUSTOMER_SUPPORT = {
  phone: '1577-1577',
  hours: ['평일 : 오전 10:00 ~ 오후 04:00', '점심 : 오후 12:00 ~ 오후 02:00', '토/일/공휴일 휴무'],
};

const BANK_INFOS = [
  { label: '예금주', value: '커멧랩스' },
  { label: '하나', value: '455-910458-16907' },
];

const FOOTER_LINKS = ['이용안내', '이용약관', '개인정보취급방침', 'instagram'];

const COMPANY_INFO = [
  '커멧랩스',
  '서울특별시 종로구 ㅇㅇㅇㅇㅇㅇㅇㅇㅇㅇ  대표 : ㅇㅇㅇ  사업자등록번호 : 000-00-00000',
  '통신판매업 신고 : 0000-ㅇㅇㅇㅇ-0000호  팩스 : 02)000-0000  개인정보관리책임자 : ㅇㅇㅇ',
  '반품주소 : 경기도 양주시 ㅇㅇㅇ 0000 ㅇㅇ빌딩 (ㅇㅇ동)',
  'COPYRIGHT(C) 주식회사 코로라 ALL RIGHT RESERVED. / Hosting By 커멧랩스',
];

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__column site-footer__column--board">
          <h3 className="site-footer__title">BOARD LIST</h3>
          <div className="site-footer__board-grid">
            {BOARD_LINKS.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`site-footer__board-button ${item.highlight ? 'is-primary' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="site-footer__column">
          <h3 className="site-footer__title">CUSTOMER CENTER</h3>
          <strong className="site-footer__phone">{CUSTOMER_SUPPORT.phone}</strong>
          <ul className="site-footer__list">
            {CUSTOMER_SUPPORT.hours.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>

        <div className="site-footer__column">
          <h3 className="site-footer__title">BANK INFO</h3>
          <ul className="site-footer__list">
            {BANK_INFOS.map((info) => (
              <li key={`${info.label}-${info.value}`}>
                <span className="site-footer__list-label">{info.label}</span>
                <span>{info.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-footer__column site-footer__column--company">
          <nav className="site-footer__links">
            {FOOTER_LINKS.map((link, index) => (
              <span key={link}>
                {link}
                {index !== FOOTER_LINKS.length - 1 && <span className="site-footer__divider">|</span>}
              </span>
            ))}
          </nav>
          <div className="site-footer__company-info">
            {COMPANY_INFO.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default SiteFooter;


