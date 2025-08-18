import React from 'react';
import './MobileMessage.css';

const MobileMessage = () => {
  return (
    <div className="mobile-message">
      <div className="mobile-message-content">
        <div className="mobile-icon">💻</div>
        <h1 className="mobile-title">데스크톱 접속 권장</h1>
        <p className="mobile-description">
          해당 사이트는 데스크톱으로 접속하시기를 권장드립니다.
        </p>
        <div className="mobile-features">
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>차트 및 그래프 최적화</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🖥️</span>
            <span>넓은 화면으로 데이터 표시</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⌨️</span>
            <span>키보드 및 마우스 조작</span>
          </div>
        </div>
        <div className="mobile-note">
          <p>모바일에서는 일부 기능이 제한될 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
};

export default MobileMessage;
