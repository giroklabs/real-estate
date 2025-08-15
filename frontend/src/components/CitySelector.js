import React, { useEffect } from 'react';

const CitySelector = ({ onCityChange, selectedCity, loading = false }) => {
  // 카카오 애드핏 스크립트 로드
  useEffect(() => {
    const initAd = () => {
      if (window.kakaoAdfit) {
        try {
          window.kakaoAdfit();
          console.log('카카오 애드핏 초기화 완료');
        } catch (error) {
          console.log('카카오 애드핏 초기화 실패:', error);
        }
      }
    };

    // 이미 로드된 경우 즉시 초기화
    if (window.kakaoAdfit) {
      initAd();
      return;
    }

    // 광고 스크립트 동적 로드
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = '//t1.daumcdn.net/kas/static/ba.min.js';
    script.async = true;
    
    script.onload = () => {
      // 스크립트 로드 완료 후 광고 초기화
      setTimeout(initAd, 100); // 약간의 지연 후 초기화
    };
    
    script.onerror = () => {
      console.log('카카오 애드핏 스크립트 로드 실패');
    };
    
    document.head.appendChild(script);
    
    // 컴포넌트 언마운트 시 스크립트 제거
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  const cities = [
    { id: 'seoul', name: '서울시' },
    { id: 'busan', name: '부산시' },
    { id: 'incheon', name: '인천시' },
    { id: 'daegu', name: '대구시' },
    { id: 'daejeon', name: '대전시' },
    { id: 'gwangju', name: '광주시' },
    { id: 'ulsan', name: '울산시' },
    { id: 'bucheon', name: '부천시' },
    { id: 'seongnam', name: '성남시' },
    { id: 'guri', name: '구리시' }
  ];

  return (
    <div className="city-selector">
      <h3 className="city-selector-title">
        도시 선택
        {loading && <span className="loading-indicator"> 🔄 데이터 수집 중...</span>}
      </h3>
      <div className="city-buttons">
        {cities.map((city) => (
          <button
            key={city.id}
            className={`city-button ${selectedCity === city.id ? 'active' : ''}`}
            onClick={() => onCityChange(city.id)}
            disabled={loading}
          >
            <span className="city-name">{city.name}</span>
            {loading && selectedCity === city.id && (
              <span className="city-loading">🔄</span>
            )}
          </button>
        ))}
      </div>
      
      {/* 카카오 애드핏 광고 */}
      <div className="ad-container" id="kakao-ad-container">
        <ins 
          className="kakao_ad_area" 
          style={{display: 'none'}}
          data-ad-unit="DAN-QA2FBESkKFffQ6n6"
          data-ad-width="728"
          data-ad-height="90"
        />
      </div>
    </div>
  );
};

export default CitySelector;
