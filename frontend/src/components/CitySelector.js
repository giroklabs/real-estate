import React from 'react';

const CitySelector = ({ onCityChange, selectedCity, loadedCities = new Set(), cityLoadingStates = {} }) => {
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
        <span className="city-selector-subtitle">
          {loadedCities.size > 0 && `(${loadedCities.size}개 도시 로드됨)`}
        </span>
      </h3>
      <div className="city-buttons">
        {cities.map((city) => {
          const isLoaded = loadedCities.has(city.id);
          const isLoading = cityLoadingStates[city.id] || false;
          const isSelected = selectedCity === city.id;
          
          return (
            <button
              key={city.id}
              className={`city-button ${isSelected ? 'active' : ''} ${isLoaded ? 'loaded' : ''}`}
              onClick={() => onCityChange(city.id)}
              disabled={isLoading}
              title={isLoaded ? '데이터 로드됨' : '데이터 로드 필요'}
            >
              <span className="city-name">{city.name}</span>
              {isLoading && (
                <span className="city-loading">🔄</span>
              )}
              {isLoaded && !isLoading && (
                <span className="city-loaded">✅</span>
              )}
              {!isLoaded && !isLoading && (
                <span className="city-not-loaded">⏳</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CitySelector;
