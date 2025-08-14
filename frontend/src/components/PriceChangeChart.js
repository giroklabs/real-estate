import React from 'react';
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
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const PriceChangeChart = ({ priceChanges }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString || '-';
    const y = String(date.getFullYear()).padStart(4, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}.`;
  };
  // 최근 30일 데이터만 사용
  const recentData = priceChanges.slice(0, 30).reverse();

  const data = {
    labels: recentData.map(item => formatDate(item.date)),
    datasets: [
      {
        label: '가격변동률 (%)',
        data: recentData.map(item => item.price_change_rate),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      {
        label: '평균 가격 (억원)',
        data: recentData.map(item => Math.round(item.avg_price / 100000000 * 100) / 100),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: false,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '날짜',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: '가격변동률 (%)',
        },
        grid: {
          color: 'rgba(239, 68, 68, 0.1)',
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: '평균 가격 (억원)',
        },
        grid: {
          drawOnChartArea: false,
          color: 'rgba(59, 130, 246, 0.1)',
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: '가격변동률 및 평균 가격 추이',
      },
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label.includes('가격변동률')) {
              return `${label}: ${value.toFixed(2)}%`;
            } else if (label.includes('평균 가격')) {
              return `${label}: ${value}억원`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
  };

  if (recentData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        가격변동 데이터가 없습니다.
      </div>
    );
  }

  return <Line data={data} options={options} />;
};

export default PriceChangeChart; 