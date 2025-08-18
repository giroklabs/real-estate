import React, { useState } from 'react';
import MonthlyVolumeChart from './MonthlyVolumeChart';
import PriceChangeChart from './PriceChangeChart';
import './MarketCharts.css';

const MarketCharts = ({ currentCityData }) => {
  const [active, setActive] = useState('volume'); // 'volume' | 'price'

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
        </div>
      </div>

      <div className="mc-body">
        {active === 'volume' && (
          <MonthlyVolumeChart currentCityData={currentCityData} />
        )}
        {active === 'price' && (
          <PriceChangeChart currentCityData={currentCityData} />
        )}
      </div>
    </div>
  );
};

export default MarketCharts;


