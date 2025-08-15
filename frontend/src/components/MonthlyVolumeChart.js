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
import './MonthlyVolumeChart.css';

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

// currentCityData: { '부산 해운대구': [ { date, transaction_count, ... }, ... ], ... }
const MonthlyVolumeChart = ({ currentCityData }) => {
  const [visibleDatasets, setVisibleDatasets] = useState(new Set());

  const { labels, datasets, regionNames } = useMemo(() => {
    // 월별 합산을 위해 region -> month(yyyy-mm) -> sumCount
    const regionMonthMap = {};

    Object.entries(currentCityData || {}).forEach(([regionName, rows]) => {
      if (!Array.isArray(rows)) return;
      rows.forEach((row) => {
        const d = new Date(row.latest_transaction_date || row.date);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!regionMonthMap[regionName]) regionMonthMap[regionName] = {};
        regionMonthMap[regionName][key] = (regionMonthMap[regionName][key] || 0) + (row.transaction_count || 0);
      });
    });

    // 공통 월 라벨 집합 구성 (최근 12개월)
    const allMonthsSet = new Set();
    Object.values(regionMonthMap).forEach((monthMap) => {
      Object.keys(monthMap).forEach((m) => allMonthsSet.add(m));
    });
    const allMonths = Array.from(allMonthsSet)
      .sort()
      .slice(-12);

    const labels = allMonths.map((m) => formatMonth(`${m}-01`));
    const regionNames = Object.keys(regionMonthMap);

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

    // 지역전체 데이터셋 생성
    const totalData = {};
    allMonths.forEach(month => {
      totalData[month] = 0;
      Object.values(regionMonthMap).forEach(monthMap => {
        totalData[month] += (monthMap[month] || 0);
      });
    });

    const datasets = [
      // 지역전체 데이터셋을 첫 번째로 추가
      {
        label: '지역전체',
        data: allMonths.map((m) => totalData[m] || 0),
        borderColor: palette[0],
        backgroundColor: palette[0].replace('rgb', 'rgba').replace(')', ', 0.3)'),
        tension: 0.3,
        borderWidth: 3,
        pointRadius: 4,
        hidden: false,
      },
      // 개별 지역 데이터셋들
      ...Object.entries(regionMonthMap).map(([regionName, monthMap], idx) => {
        const data = allMonths.map((m) => monthMap[m] || 0);
        const color = palette[idx % palette.length] || palette[0]; // 기본값 설정
        return {
          label: regionName,
          data,
          borderColor: color,
          backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.2)'),
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 2,
          hidden: false, // 초기에는 모든 데이터셋이 보이도록
        };
      })
    ];

    return { labels, datasets, regionNames };
  }, [currentCityData]);

  // 초기 로드 시 지역전체를 제외한 나머지 지역만 보이도록 설정
  useEffect(() => {
    if (datasets && datasets.length > 0) {
      // 지역전체를 제외한 나머지 지역만 선택
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
      // 모든 데이터셋 표시 (지역전체 + 개별 지역들)
      const allLabels = datasets.map(dataset => dataset.label);
      setVisibleDatasets(new Set(allLabels));
    } else {
      // 전체해제 시 모든 데이터셋을 해제
      setVisibleDatasets(new Set());
    }
  }, [datasets]);

  const filteredDatasets = useMemo(() => {
    return datasets.filter(dataset => visibleDatasets.has(dataset.label));
  }, [datasets, visibleDatasets]);

  if (!datasets || datasets.length === 0) {
    return <div className="chart-no-data">표시할 데이터가 없습니다.</div>;
  }

  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false }, // 기본 Legend 비활성화
      title: { display: false }, // 제목 비활성화
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          title: (items) => items?.[0]?.label || '',
          label: (ctx) => `${ctx.dataset?.label}: ${ctx.parsed.y}건`,
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
          text: '거래량(건)', 
          color: '#ffffff'
        }, 
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: '#ffffff'
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
    <div className="monthly-volume-chart">
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

export default MonthlyVolumeChart;


