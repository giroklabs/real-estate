import React, { useMemo } from 'react';
import './TrendingInsights.css';

// 날짜 문자열에서 yyyy-mm 키 생성
const getMonthKey = (dateString) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// 억원 단위 포맷터
const toEok = (won) => {
  if (!won || won <= 0) return 0;
  return Math.round((won / 100000000) * 100) / 100;
};

// 증감율 계산
const calcChangePct = (curr, prev) => {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
};

const formatPct = (n) => (n === null || n === undefined ? '-' : `${n.toFixed(1)}%`);

const TrendingInsights = ({ allData }) => {
  // allData: { '서울 강남구': [rows...], ... } (전체 도시 기준)
  const insights = useMemo(() => {
    const regionMonthVolume = {}; // region -> month -> sum(transaction_count)
    const regionMonthPriceAgg = {}; // region -> month -> { totalPrice, totalCount }

    Object.entries(allData || {}).forEach(([region, rows]) => {
      if (!Array.isArray(rows)) return;
      rows.forEach((row) => {
        const dateKey = getMonthKey(row.latest_transaction_date || row.date);
        if (!dateKey) return;
        // 거래량 합산
        if (!regionMonthVolume[region]) regionMonthVolume[region] = {};
        regionMonthVolume[region][dateKey] = (regionMonthVolume[region][dateKey] || 0) + (row.transaction_count || 0);

        // 가격 가중 평균을 위한 합산
        const price = row.avg_price || row.average_price || row.price || 0;
        const count = row.transaction_count || 0;
        if (!regionMonthPriceAgg[region]) regionMonthPriceAgg[region] = {};
        if (!regionMonthPriceAgg[region][dateKey]) regionMonthPriceAgg[region][dateKey] = { totalPrice: 0, totalCount: 0 };
        regionMonthPriceAgg[region][dateKey].totalPrice += price * count;
        regionMonthPriceAgg[region][dateKey].totalCount += count;
      });
    });

    // 비교 대상 최근 2개월 키 확인 (전체 공통 집합에서 최신 2개)
    const allMonthsSet = new Set();
    Object.values(regionMonthVolume).forEach((m) => Object.keys(m).forEach((k) => allMonthsSet.add(k)));
    Object.values(regionMonthPriceAgg).forEach((m) => Object.keys(m).forEach((k) => allMonthsSet.add(k)));
    const sortedMonths = Array.from(allMonthsSet).sort();
    const last = sortedMonths[sortedMonths.length - 1];
    const prev = sortedMonths[sortedMonths.length - 2];
    if (!last || !prev) {
      return { volumeTop: [], regionVolumeTop: [], priceTop: [], monthKeys: { last, prev } };
    }

    // 1) 최근 1개월 간 거래량 급증한 곳 (전 지역 기준 상위 5)
    const volumeSpike = Object.entries(regionMonthVolume).map(([region, m]) => {
      const curr = m[last] || 0;
      const pre = m[prev] || 0;
      const pct = calcChangePct(curr, pre);
      return { region, current: curr, previous: pre, changePct: pct };
    })
    .filter((r) => r.changePct !== null && r.previous > 0 && r.changePct > 0)
    .sort((a, b) => (b.changePct - a.changePct))
    .slice(0, 5);

    // 2) 지역별 거래량 급증 (같은 계산이지만 명시적으로 분리, 필요 시 카테고리별 확장 가능)
    const regionVolumeTop = volumeSpike.slice(0, 5);

    // 3) 평균가격 급증한 곳 (가중 평균으로 월 평균 가격 계산 후 변화율 비교)
    const priceSpike = Object.entries(regionMonthPriceAgg).map(([region, m]) => {
      const preAgg = m[prev] || { totalPrice: 0, totalCount: 0 };
      const lastAgg = m[last] || { totalPrice: 0, totalCount: 0 };
      const preAvg = preAgg.totalCount > 0 ? preAgg.totalPrice / preAgg.totalCount : 0;
      const lastAvg = lastAgg.totalCount > 0 ? lastAgg.totalPrice / lastAgg.totalCount : 0;
      const pct = calcChangePct(lastAvg, preAvg);
      return { region, current: lastAvg, previous: preAvg, changePct: pct };
    })
    .filter((r) => r.changePct !== null && r.previous > 0 && r.changePct > 0)
    .sort((a, b) => (b.changePct - a.changePct))
    .slice(0, 5);

    return {
      volumeTop: volumeSpike,
      regionVolumeTop,
      priceTop: priceSpike,
      monthKeys: { last, prev }
    };
  }, [allData]);

  const { monthKeys } = insights;

  if (!allData || Object.keys(allData).length === 0) {
    return <div className="trending-empty">표시할 데이터가 없습니다.</div>;
  }

  return (
    <div className="trending-insights">
      <div className="trending-header">
        <h2>주요동향</h2>
        {monthKeys?.last && monthKeys?.prev && (
          <div className="trending-period">비교 기간: {monthKeys.prev} → {monthKeys.last}</div>
        )}
      </div>

      <div className="trending-grid">
        <section className="trend-card">
          <h3>최근 1개월 거래량 급증 지역</h3>
          <ul>
            {insights.volumeTop.map((item, idx) => (
              <li key={item.region} className="trend-item">
                <div className="rank">{idx + 1}</div>
                <div className="info">
                  <div className="title">{item.region}</div>
                  <div className="meta">{item.previous}건 → {item.current}건</div>
                </div>
                <div className="delta up">{formatPct(item.changePct)}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="trend-card">
          <h3>지역별 거래량 급증</h3>
          <ul>
            {insights.regionVolumeTop.map((item, idx) => (
              <li key={item.region} className="trend-item">
                <div className="rank">{idx + 1}</div>
                <div className="info">
                  <div className="title">{item.region}</div>
                  <div className="meta">{item.previous}건 → {item.current}건</div>
                </div>
                <div className="delta up">{formatPct(item.changePct)}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="trend-card">
          <h3>평균가격 급증 지역</h3>
          <ul>
            {insights.priceTop.map((item, idx) => (
              <li key={item.region} className="trend-item">
                <div className="rank">{idx + 1}</div>
                <div className="info">
                  <div className="title">{item.region}</div>
                  <div className="meta">{toEok(item.previous)}억 → {toEok(item.current)}억</div>
                </div>
                <div className="delta up">{formatPct(item.changePct)}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default TrendingInsights;


