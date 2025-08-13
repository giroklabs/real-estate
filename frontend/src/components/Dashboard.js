import React from 'react';
import StatisticsCards from './StatisticsCards';
import TransactionChart from './TransactionChart';
import PriceChangeChart from './PriceChangeChart';
import TransactionTable from './TransactionTable';
import AreaAnalysis from './AreaAnalysis';
import FloorAnalysis from './FloorAnalysis';
import DetailedTransactions from './DetailedTransactions';

const Dashboard = ({ transactions, priceChanges, statistics, selectedRegion }) => {
  return (
    <div className="dashboard">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
            {selectedRegion ? `${selectedRegion} 부동산 현황` : '전국 부동산 현황'}
          </h2>
          <StatisticsCards statistics={statistics} />
        </div>
        
        <div className="charts-grid">
          <div className="chart-card">
            <h3 className="chart-title">거래량 추이</h3>
            <TransactionChart transactions={transactions} />
          </div>
          
          <div className="chart-card">
            <h3 className="chart-title">가격변동률 추이</h3>
            <PriceChangeChart priceChanges={priceChanges} />
          </div>
        </div>
        
        <div className="table-card">
          <h3 className="table-title">최근 거래 내역</h3>
          <TransactionTable transactions={transactions} />
        </div>

        {/* 면적별 분석 */}
        {selectedRegion && (
          <div className="analysis-section">
            <AreaAnalysis regionName={selectedRegion} />
          </div>
        )}

        {/* 층수별 분석 */}
        {selectedRegion && (
          <div className="analysis-section">
            <FloorAnalysis regionName={selectedRegion} />
          </div>
        )}

        {/* 상세 거래 정보 */}
        {selectedRegion && (
          <div className="analysis-section">
            <DetailedTransactions regionName={selectedRegion} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 