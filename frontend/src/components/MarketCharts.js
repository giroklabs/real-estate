import React, { useState } from 'react';
import MonthlyVolumeChart from './MonthlyVolumeChart';
import PriceChangeChart from './PriceChangeChart';
import SentimentGauge from './SentimentGauge';
import './MarketCharts.css';

const MarketCharts = ({ currentCityData, selectedCity }) => {
  const [active, setActive] = useState('volume'); // 'volume' | 'price' | 'sentiment'

  return (
    <div className="mc">
      <div className="mc-header">
        <div className="mc-tabs" role="tablist" aria-label="시장 그래프 종류">
          <button
            type="button"
            role="tab"
            aria-selected={active === 'volume'}
            className={`mc-tab ${active === 'volume' ? 'active' : ''}`}
            onClick={() => setActive('volume')}
          >
            <span className="mc-tab-emoji">📊</span>
            <span>거래량 그래프</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={active === 'price'}
            className={`mc-tab ${active === 'price' ? 'active' : ''}`}
            onClick={() => setActive('price')}
          >
            <span className="mc-tab-emoji">💴</span>
            <span>평균가격 그래프</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={active === 'sentiment'}
            className={`mc-tab ${active === 'sentiment' ? 'active' : ''}`}
            onClick={() => setActive('sentiment')}
          >
            <span className="mc-tab-emoji">🧭</span>
            <span>공포탐욕지수</span>
          </button>
        </div>
      </div>

      <div className="mc-body">
        {active === 'volume' && (
          <MonthlyVolumeChart currentCityData={currentCityData} />
        )}
        {active === 'price' && (
          <PriceChangeChart currentCityData={currentCityData} />
        )}
        {active === 'sentiment' && (
          <div style={{ padding: '0.5rem 0' }}>
            <SentimentGauge city={selectedCity} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketCharts;


