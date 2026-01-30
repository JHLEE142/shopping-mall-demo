const BOARD_LINKS = [
  { label: '자주 묻는 질문' },
  { label: '반품/교환' },
  { label: '구매후기' },
  { label: '배송문의' },
  { label: '입금/결제/취소' },
];

const CUSTOMER_SUPPORT = {
  phone: '010-4163-5771',
  hours: ['평일 : 오전 10:00 ~ 오후 04:00', '점심 : 오후 12:00 ~ 오후 01:00', '토/일/공휴일 휴무'],
};

const BANK_INFOS = [
  { label: '예금주', value: '커멧랩스' },
  { label: '하나', value: '455-910458-16907' },
];

const FOOTER_LINKS = ['이용안내', '이용약관', '개인정보취급방침', 'instagram'];

const COMPANY_INFO = [
  '커멧랩스',
  '경기도 성남시 분당구 서현로237번길 22, 3층  대표 : 이정현  사업자등록번호 : 455-910458-16907',
  '통신판매업 신고 : 제2025-성남분당B-1100호',
  '반품주소 : 경기도 성남시 분당구 서현로237번길 22, 3층',
  'COPYRIGHT(C) 커멧랩스 ALL RIGHT RESERVED. / Hosting By CometLabs',
];

function SiteFooter({
  onNavigateBoard = () => {},
  onNavigateFooter = () => {},
}) {
  const handleBoardClick = (label) => {
    onNavigateBoard(label);
  };

  const handleFooterClick = (label) => {
    if (label === 'instagram') {
      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
      return;
    }
    onNavigateFooter(label);
  };
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
                onClick={() => handleBoardClick(item.label)}
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
              <button
                key={link}
                type="button"
                className="site-footer__link-button"
                onClick={() => handleFooterClick(link)}
              >
                {link}
                {index !== FOOTER_LINKS.length - 1 && <span className="site-footer__divider">|</span>}
              </button>
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


