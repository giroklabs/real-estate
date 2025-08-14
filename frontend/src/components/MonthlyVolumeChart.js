import React, { useMemo } from 'react';
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

// currentCityData: { '부산 해운대구': [ { date, transaction_count, ... }, ...], ... }
const MonthlyVolumeChart = ({ currentCityData }) => {
  const { labels, datasets } = useMemo(() => {
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

    const palette = [
      'rgb(59, 130, 246)',
      'rgb(16, 185, 129)',
      'rgb(239, 68, 68)',
      'rgb(234, 179, 8)',
      'rgb(168, 85, 247)',
      'rgb(99, 102, 241)',
    ];

    const datasets = Object.entries(regionMonthMap).map(([regionName, monthMap], idx) => {
      const data = allMonths.map((m) => monthMap[m] || 0);
      const color = palette[idx % palette.length];
      return {
        label: regionName,
        data,
        borderColor: color,
        backgroundColor: color.replace('rgb', 'rgba').replace(')', ', 0.2)'),
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 2,
      };
    });

    return { labels, datasets };
  }, [currentCityData]);

  if (!datasets || datasets.length === 0) {
    return <div className="chart-no-data">표시할 데이터가 없습니다.</div>;
  }

  const options = {
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '월별 거래량 추이' },
      tooltip: {
        callbacks: {
          title: (items) => items?.[0]?.label || '',
          label: (ctx) => `${ctx.dataset?.label}: ${ctx.parsed.y}건`,
        },
      },
    },
    scales: {
      x: { title: { display: true, text: '월' } },
      y: { title: { display: true, text: '거래량(건)' }, beginAtZero: true },
    },
  };

  const data = { labels, datasets };

  return (
    <div className="monthly-volume-chart">
      <Line data={data} options={options} />
    </div>
  );
};

export default MonthlyVolumeChart;


