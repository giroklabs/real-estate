import React, { useState } from 'react';
import TransactionDetailsModal from './TransactionDetailsModal';

const RankingsTable = ({ data, type, title }) => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatPrice = (price) => {
    if (price >= 100000000) {
      return (price / 100000000).toFixed(1) + '억원';
    } else if (price >= 10000) {
      return (price / 10000).toFixed(1) + '만원';
    }
    return price.toLocaleString() + '원';
  };

  const formatChangeRate = (rate) => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(2)}%`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // 금색
    if (rank === 2) return '#C0C0C0'; // 은색
    if (rank === 3) return '#CD7F32'; // 동색
    return 'transparent';
  };

  const handleDetailClick = (region) => {
    setSelectedRegion(region);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRegion(null);
  };

  const renderTableHeaders = () => {
    switch (type) {
      case 'volume':
        return (
          <>
            <th>순위</th>
            <th>지역명</th>
            <th>총 거래량</th>
            <th>평균 가격</th>
            <th>거래 건수</th>
            <th>상세정보</th>
          </>
        );
      case 'price-change':
        return (
          <>
            <th>순위</th>
            <th>지역명</th>
            <th>가격변동률</th>
            <th>최고가</th>
            <th>최저가</th>
            <th>상세정보</th>
          </>
        );
      case 'price':
        return (
          <>
            <th>순위</th>
            <th>지역명</th>
            <th>평균 가격</th>
            <th>총 거래량</th>
            <th>거래 건수</th>
            <th>상세정보</th>
          </>
        );
      default:
        return null;
    }
  };

  const renderTableRow = (item) => {
    switch (type) {
      case 'volume':
        return (
          <>
            <td>
              <div className="rank-badge" style={{ backgroundColor: getRankColor(item.rank) }}>
                {item.rank}
              </div>
            </td>
            <td className="region-name">{item.region_name}</td>
            <td className="volume">{formatNumber(item.total_volume)}</td>
            <td className="price">{formatPrice(item.avg_price)}</td>
            <td className="count">{item.transaction_count}</td>
            <td className="details-cell">
              <button 
                className="detail-button"
                onClick={() => handleDetailClick(item)}
              >
                상세정보
              </button>
            </td>
          </>
        );
      case 'price-change':
        return (
          <>
            <td>
              <div className="rank-badge" style={{ backgroundColor: getRankColor(item.rank) }}>
                {item.rank}
              </div>
            </td>
            <td className="region-name">{item.region_name}</td>
            <td className={`change-rate ${item.avg_change_rate >= 0 ? 'positive' : 'negative'}`}>
              {formatChangeRate(item.avg_change_rate)}
            </td>
            <td className="price">{formatPrice(item.max_price)}</td>
            <td className="price">{formatPrice(item.min_price)}</td>
            <td className="details-cell">
              <button 
                className="detail-button"
                onClick={() => handleDetailClick(item)}
              >
                상세정보
              </button>
            </td>
          </>
        );
      case 'price':
        return (
          <>
            <td>
              <div className="rank-badge" style={{ backgroundColor: getRankColor(item.rank) }}>
                {item.rank}
              </div>
            </td>
            <td className="region-name">{item.region_name}</td>
            <td className="price">{formatPrice(item.avg_price)}</td>
            <td className="volume">{formatNumber(item.total_volume)}</td>
            <td className="count">{item.transaction_count}</td>
            <td className="details-cell">
              <button 
                className="detail-button"
                onClick={() => handleDetailClick(item)}
              >
                상세정보
              </button>
            </td>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rankings-table">
      <div className="table-header">
        <h2>{title}</h2>
        <div className="table-subtitle">
          최근 데이터 기준 순위
        </div>
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {renderTableHeaders()}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <tr key={index} className="table-row">
                  {renderTableRow(item)}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && selectedRegion && (
        <TransactionDetailsModal
          region={selectedRegion}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default RankingsTable;
