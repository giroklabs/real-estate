import React from 'react';

const Header = ({ activeTab = 'rankings', onTabChange = () => {} }) => {
  const handleLogoClick = () => {
    // 순위보기 탭으로 변경
    onTabChange('rankings');
    // 첫화면으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/apt-icon.svg" alt="APT" className="logo-mark" />
          <div className="logo-text" aria-label="APT Ranking - 아파트 거래량랭킹">
            <span className="logo-text-en">APT Ranking</span>
            <span className="logo-text-ko">아파트 거래량랭킹</span>
          </div>
        </div>
        <div className="header-tabs">
          <span 
            className={`header-tab ${activeTab === 'rankings' ? 'active' : ''}`}
            onClick={() => onTabChange('rankings')}
          >
            지역별 아파트순위
          </span>
          <span className="tab-separator">|</span>
          <span 
            className={`header-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => onTabChange('stats')}
          >
            거래량과 가격 통계
          </span>
          <span className="tab-separator">|</span>
          <span 
            className={`header-tab ${activeTab === 'trending' ? 'active' : ''}`}
            onClick={() => onTabChange('trending')}
          >
            HOT한 아파트
          </span>
          
        </div>
        <div className="developer-info">
          <span className="developer-name">GIROK Labs.</span>
        </div>
      </div>
    </header>
  );
};

export default Header; 