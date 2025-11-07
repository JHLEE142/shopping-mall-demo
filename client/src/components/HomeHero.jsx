function HomeHero({ onMoveToSignUp, onMoveToLogin, user = null }) {
  return (
    <main className="home-hero">
      <h1 className="home-title">
        {user ? `${user.name}님, 다시 만나서 반가워요!` : '쇼핑몰 데모에 오신 것을 환영합니다'}
      </h1>
      <p className="home-subtitle">
        {user
          ? '계속 쇼핑을 이어가시려면 원하는 메뉴를 선택해 주세요.'
          : '간단한 회원가입으로 빠르게 쇼핑을 시작하세요. 다양한 혜택과 맞춤형 추천을 받아보세요.'}
      </p>
      <div className="home-actions">
        {!user && (
          <button className="primary-button" onClick={onMoveToSignUp}>
            회원가입
          </button>
        )}
        <button className="secondary-button" onClick={onMoveToLogin}>
          {user ? '내 계정 보기' : '로그인'}
        </button>
      </div>
    </main>
  );
}

export default HomeHero;

