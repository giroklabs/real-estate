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
          <img
            src="/logo2.png"
            alt="APT RANKING"
            className="logo-image"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo.svg';
            }}
          />
        </div>
        <div className="header-tabs">
          <span 
            className={`header-tab ${activeTab === 'rankings' ? 'active' : ''}`}
            onClick={() => onTabChange('rankings')}
          >
            순위보기
          </span>
          <span className="tab-separator">|</span>
          <span 
            className={`header-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => onTabChange('stats')}
          >
            거래량통계
          </span>
          <span className="tab-separator">|</span>
          <span 
            className={`header-tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => onTabChange('favorites')}
          >
            즐겨찾기
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