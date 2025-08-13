import React from 'react';

const StatisticsCards = ({ statistics }) => {
  const formatPrice = (price) => {
    if (!price) return '0원';
    const billion = Math.floor(price / 100000000);
    const million = Math.floor((price % 100000000) / 10000);
    return `${billion}억 ${million}만원`;
  };

  const formatPercentage = (value) => {
    if (!value) return '0%';
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const cards = [
    {
      title: '총 거래 건수',
      value: statistics.total_transactions || 0,
      unit: '건',
      color: 'bg-blue-500',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      title: '평균 거래가',
      value: formatPrice(statistics.avg_price),
      unit: '',
      color: 'bg-green-500',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    },
    {
      title: '총 거래량',
      value: statistics.total_count || 0,
      unit: '건',
      color: 'bg-yellow-500',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      title: '30일 가격변동률',
      value: formatPercentage(statistics.price_change_30d),
      unit: '',
      color: statistics.price_change_30d > 0 ? 'bg-red-500' : 'bg-blue-500',
      icon: (
        <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      )
    }
  ];

  return (
    <div className="stats-grid">
      {cards.map((card, index) => (
        <div key={index} className="stat-card">
          <div className="stat-header">
            <div className={`stat-icon ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <dt className="stat-title">
                {card.title}
              </dt>
              <dd className="stat-value">
                {card.value}{card.unit}
              </dd>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatisticsCards; 