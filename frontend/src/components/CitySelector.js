import React from 'react';

const CitySelector = ({ onCityChange, selectedCity, loading = false }) => {
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
        🏛️ 도시 선택
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
    </div>
  );
};

export default CitySelector;
