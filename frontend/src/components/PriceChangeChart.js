import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './PriceChangeChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const formatMonth = (dateString) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString || '-';
  const y = String(d.getFullYear()).padStart(4, '0');
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}.${m}.`;
};

// 가격을 억원 단위로 변환하는 함수
const formatPrice = (price) => {
  return Math.round(price / 100000000 * 100) / 100; // 억원 단위로 변환
};

const PriceChangeChart = ({ currentCityData }) => {
  const [visibleDatasets, setVisibleDatasets] = useState(new Set());

  const { labels, datasets } = useMemo(() => {
    // 월별 평균 가격을 위해 region -> month(yyyy-mm) -> avgPrice
    const regionMonthMap = {};

    // 지역 키 정규화: "서울 강남구 2024.json" -> "서울 강남구"
    const normalizeRegionKey = (name) => {
      if (!name || typeof name !== 'string') return name;
      let n = name.trim();
      n = n.replace(/\s+\d{4}\.json$/i, '');
      n = n.replace(/\.json$/i, '');
      n = n.replace(/\s+/g, ' ').trim();
      return n;
    };

    // 정규화된 데이터로 병합
    const mergedData = {};
    Object.entries(currentCityData || {}).forEach(([key, rows]) => {
      const nk = normalizeRegionKey(key);
      if (!mergedData[nk]) mergedData[nk] = [];
      if (Array.isArray(rows)) mergedData[nk] = mergedData[nk].concat(rows);
    });

    Object.entries(mergedData || {}).forEach(([regionName, rows]) => {
      if (!Array.isArray(rows)) return;
      rows.forEach((row) => {
        const d = new Date(row.latest_transaction_date || row.date);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!regionMonthMap[regionName]) regionMonthMap[regionName] = [];
        const price = row.avg_price || row.average_price || row.price || 0;
        // 트랜잭션 수가 없는 데이터가 많아 0으로 떨어지는 문제 → 가격 존재 시 카운트를 1로 처리
        regionMonthMap[regionName].push({ month: key, price });
      });
    });

    // 디버깅: 데이터 확인
    console.log('PriceChangeChart - currentCityData keys:', Object.keys(currentCityData || {}));
    console.log('PriceChangeChart - regionMonthMap:', regionMonthMap);

    // 공통 월 라벨 집합 구성 (최근 12개월)
    const allMonthsSet = new Set();
    Object.values(regionMonthMap).forEach((monthData) => {
      monthData.forEach(({ month }) => allMonthsSet.add(month));
    });
    const allMonths = Array.from(allMonthsSet)
      .sort()
      .slice(-12);

    console.log('PriceChangeChart - allMonths:', allMonths);

    const labels = allMonths.map((m) => formatMonth(`${m}-01`));

    const palette = [
      'rgb(59, 130, 246)',   // 파란색
      'rgb(16, 185, 129)',   // 녹색
      'rgb(239, 68, 68)',    // 빨간색
      'rgb(234, 179, 8)',    // 노란색
      'rgb(168, 85, 247)',   // 보라색
      'rgb(99, 102, 241)',   // 인디고
      'rgb(236, 72, 153)',   // 핑크
      'rgb(245, 101, 101)',  // 로즈
      'rgb(34, 197, 94)',    // 에메랄드
      'rgb(251, 146, 60)',   // 오렌지
    ];

    // 지역별 월별 평균 가격 계산
    const regionMonthPrices = {};
    Object.entries(regionMonthMap).forEach(([regionName, monthData]) => {
      regionMonthPrices[regionName] = {};
      monthData.forEach(({ month, price }) => {
        if (!regionMonthPrices[regionName][month]) {
          regionMonthPrices[regionName][month] = { totalPrice: 0, totalCount: 0 };
        }
        if (price && Number(price) > 0) {
          regionMonthPrices[regionName][month].totalPrice += Number(price);
          regionMonthPrices[regionName][month].totalCount += 1;
        }
      });
    });

    // 디버깅: 가격 데이터 확인
    console.log('PriceChangeChart - regionMonthPrices:', regionMonthPrices);

    // 지역별 월별 평균 가격 계산
    Object.entries(regionMonthPrices).forEach(([regionName, monthPrices]) => {
      Object.keys(monthPrices).forEach((month) => {
        const { totalPrice, totalCount } = monthPrices[month];
        monthPrices[month] = totalCount > 0 ? totalPrice / totalCount : 0;
      });
    });

    // 지역전체 평균 가격 계산
    const totalData = {};
    allMonths.forEach(month => {
      let totalPrice = 0;
      let totalCount = 0;
      Object.values(regionMonthPrices).forEach(monthPrices => {
        if (monthPrices[month]) {
          totalPrice += monthPrices[month];
          totalCount += 1;
        }
      });
      totalData[month] = totalCount > 0 ? totalPrice / totalCount : 0;
    });

    console.log('PriceChangeChart - totalData:', totalData);
    console.log('PriceChangeChart - formatted totalData:', allMonths.map((m) => formatPrice(totalData[m] || 0)));

    const datasets = [
      // 지역전체 데이터셋을 첫 번째로 추가
      {
        label: '지역전체',
        data: allMonths.map((m) => formatPrice(totalData[m] || 0)),
        borderColor: palette[0],
        backgroundColor: palette[0].replace('rgb', 'rgba').replace(')', ', 0.3)'),
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 4,
        hidden: false,
      },
      // 개별 지역 데이터셋들
      ...Object.entries(regionMonthPrices).map(([regionName, monthPrices], idx) => {
        const data = allMonths.map((m) => formatPrice(monthPrices[m] || 0));
        const color = palette[(idx + 1) % palette.length] || palette[0];
        return {
          label: regionName,
          data,
          borderColor: color,
          backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.2)'),
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 2,
          hidden: false,
        };
      })
    ];

    return { labels, datasets };
  }, [currentCityData]);

  // 초기 로드 시 지역전체를 제외한 나머지 지역만 보이도록 설정
  useEffect(() => {
    if (datasets && datasets.length > 0) {
      const individualLabels = datasets
        .filter(dataset => dataset.label !== '지역전체')
        .map(dataset => dataset.label);
      setVisibleDatasets(new Set(individualLabels));
    }
  }, [datasets]);

  const toggleDataset = useCallback((regionName) => {
    setVisibleDatasets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(regionName)) {
        newSet.delete(regionName);
      } else {
        newSet.add(regionName);
      }
      return newSet;
    });
  }, []);

  const toggleAllDatasets = useCallback((show) => {
    if (show) {
      const allLabels = datasets.map(dataset => dataset.label);
      setVisibleDatasets(new Set(allLabels));
    } else {
      setVisibleDatasets(new Set());
    }
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    return datasets.filter(dataset => visibleDatasets.has(dataset.label));
  }, [datasets, visibleDatasets]);

  if (!datasets || datasets.length === 0) {
    return <div className="price-change-chart-no-data">표시할 데이터가 없습니다.</div>;
  }

  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          title: (items) => items?.[0]?.label || '',
          label: (ctx) => `${ctx.dataset?.label}: ${ctx.parsed.y}억원`,
        },
      },
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: '월',
          color: '#ffffff'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
        }
      },
      y: { 
        title: { 
          display: true, 
          text: '평균가격(억원)', 
          color: '#ffffff'
        }, 
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff',
          callback: function(value) {
            return value + '억';
          }
        }
      },
    },
    backgroundColor: 'transparent',
    maintainAspectRatio: false,
    elements: {
      point: {
        backgroundColor: 'transparent'
      }
    },
    layout: {
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    }
  };

  const data = { labels, datasets: filteredDatasets };

  return (
    <div className="price-change-chart">
      {/* 사용자 정의 범례 */}
      <div className="custom-legend">
        <div className="legend-header">
          <div className="legend-controls">
            <button 
              className="legend-btn legend-btn-all"
              onClick={() => toggleAllDatasets(true)}
              title="모든 지역 표시"
            >
              전체표시
            </button>
            <button 
              className="legend-btn legend-btn-none"
              onClick={() => toggleAllDatasets(false)}
              title="최소 1개 지역 유지"
            >
              전체해제
            </button>
          </div>
        </div>
        <div className="legend-items">
          {datasets.map((dataset, index) => {
            const isVisible = visibleDatasets.has(dataset.label);
            const color = dataset.borderColor;
            return (
              <div 
                key={dataset.label}
                className={`legend-item ${isVisible ? 'active' : 'inactive'}`}
                onClick={() => toggleDataset(dataset.label)}
              >
                <div className="legend-color" style={{ backgroundColor: color }}></div>
                <span className="legend-label">{dataset.label}</span>
                <div className="legend-toggle">
                  {isVisible ? '●' : '○'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* 차트 */}
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default PriceChangeChart; 