import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TransactionChart = ({ transactions }) => {
  // 데이터 그룹화
  const groupedData = transactions.reduce((acc, transaction) => {
    const date = transaction.date;
    if (!acc[date]) {
      acc[date] = {
        date,
        count: 0,
        avgPrice: 0,
        totalPrice: 0
      };
    }
    acc[date].count += transaction.transaction_count;
    acc[date].totalPrice += transaction.avg_price * transaction.transaction_count;
    return acc;
  }, {});

  // 날짜별 평균 가격 계산
  Object.values(groupedData).forEach(item => {
    item.avgPrice = item.count > 0 ? item.totalPrice / item.count : 0;
  });

  // 최근 10일 데이터만 사용
  const sortedDates = Object.keys(groupedData).sort().slice(-10);
  const chartData = sortedDates.map(date => groupedData[date]);

  const data = {
    labels: chartData.map(item => item.date),
    datasets: [
      {
        label: '거래량',
        data: chartData.map(item => item.count),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        label: '평균 가격 (억원)',
        data: chartData.map(item => Math.round(item.avgPrice / 100000000 * 100) / 100),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
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
          text: '거래량',
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
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: '일별 거래량 및 평균 가격',
      },
      legend: {
        display: true,
      },
    },
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        거래 데이터가 없습니다.
      </div>
    );
  }

  return <Bar data={data} options={options} />;
};

export default TransactionChart; 