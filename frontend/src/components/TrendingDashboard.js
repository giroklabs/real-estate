import React, { useMemo } from 'react';
import './TrendingDashboard.css';

// yyyy-mm key
const getMonthKey = (dateString) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const toEok = (won) => {
  if (!won || won <= 0) return 0;
  return Math.round((won / 100000000) * 100) / 100;
};

const formatPct = (n) => (n === null || n === undefined ? '-' : `${n.toFixed(1)}%`);
const formatNum = (n) => (n === null || n === undefined ? '-' : n.toLocaleString('ko-KR'));
const calcChangePct = (curr, prev) => {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
};

// 도시명 추출: '서울 강남구' → '서울'
const extractCity = (regionName = '') => (regionName.split(' ')[0] || regionName);

const TrendingDashboard = ({ allData }) => {
  const { monthKeys, volumeTop, priceTop, citySpotlight } = useMemo(() => {
    const regionMonthVolume = {}; // region -> month -> sum(transaction_count)
    const regionMonthPriceAgg = {}; // region -> month -> { totalPrice, totalCount }
    const cityComplexMonthVolume = {}; // city -> complex -> month -> sum(count)

    Object.entries(allData || {}).forEach(([region, rows]) => {
      if (!Array.isArray(rows)) return;
      rows.forEach((row) => {
        const key = getMonthKey(row.latest_transaction_date || row.date);
        if (!key) return;
        const count = row.transaction_count || 0;
        const price = row.avg_price || row.average_price || row.price || 0;
        const complex = row.complex_name || '미상 단지';
        const city = extractCity(row.region_name || region);

        // region volume
        if (!regionMonthVolume[region]) regionMonthVolume[region] = {};
        regionMonthVolume[region][key] = (regionMonthVolume[region][key] || 0) + count;

        // region price agg
        if (!regionMonthPriceAgg[region]) regionMonthPriceAgg[region] = {};
        if (!regionMonthPriceAgg[region][key]) regionMonthPriceAgg[region][key] = { totalPrice: 0, totalCount: 0 };
        regionMonthPriceAgg[region][key].totalPrice += price * count;
        regionMonthPriceAgg[region][key].totalCount += count;

        // city-complex volume
        if (!cityComplexMonthVolume[city]) cityComplexMonthVolume[city] = {};
        if (!cityComplexMonthVolume[city][complex]) cityComplexMonthVolume[city][complex] = {};
        cityComplexMonthVolume[city][complex][key] = (cityComplexMonthVolume[city][complex][key] || 0) + count;
      });
    });

    const allMonthsSet = new Set();
    Object.values(regionMonthVolume).forEach((m) => Object.keys(m).forEach((k) => allMonthsSet.add(k)));
    Object.values(regionMonthPriceAgg).forEach((m) => Object.keys(m).forEach((k) => allMonthsSet.add(k)));
    const months = Array.from(allMonthsSet).sort();
    const last = months[months.length - 1];
    const prev = months[months.length - 2];

    // 거래량 급증 지역
    const volumeTop = last && prev ? Object.entries(regionMonthVolume)
      .map(([region, m]) => {
        const curr = m[last] || 0;
        const pre = m[prev] || 0;
        const pct = calcChangePct(curr, pre);
        return { region, current: curr, previous: pre, changePct: pct };
      })
      .filter((r) => r.changePct !== null && r.previous > 0 && r.changePct > 0)
      .sort((a, b) => b.changePct - a.changePct)
      .slice(0, 8) : [];

    // 평균가격 급증 지역 (가중 평균)
    const priceTop = last && prev ? Object.entries(regionMonthPriceAgg)
      .map(([region, m]) => {
        const preAgg = m[prev] || { totalPrice: 0, totalCount: 0 };
        const lastAgg = m[last] || { totalPrice: 0, totalCount: 0 };
        const preAvg = preAgg.totalCount > 0 ? preAgg.totalPrice / preAgg.totalCount : 0;
        const lastAvg = lastAgg.totalCount > 0 ? lastAgg.totalPrice / lastAgg.totalCount : 0;
        const pct = calcChangePct(lastAvg, preAvg);
        return { region, current: lastAvg, previous: preAvg, changePct: pct };
      })
      .filter((r) => r.changePct !== null && r.previous > 0 && r.changePct > 0)
      .sort((a, b) => b.changePct - a.changePct)
      .slice(0, 8) : [];

    // 도시별 주목받는 아파트 (각 도시별 전월 대비 거래량 증가 Top 1)
    const citySpotlight = [];
    if (last && prev) {
      Object.entries(cityComplexMonthVolume).forEach(([city, complexMap]) => {
        const ranked = Object.entries(complexMap).map(([complex, monthsMap]) => {
          const curr = monthsMap[last] || 0;
          const pre = monthsMap[prev] || 0;
          const pct = calcChangePct(curr, pre);
          return { city, complex, current: curr, previous: pre, changePct: pct };
        })
        .filter((x) => x.changePct !== null && x.previous > 0 && x.changePct > 0)
        .sort((a, b) => b.changePct - a.changePct);

        if (ranked.length > 0) citySpotlight.push(ranked[0]);
      });
    }

    // 도시명 알파벳/한글 순으로 정렬
    citySpotlight.sort((a, b) => a.city.localeCompare(b.city, 'ko'));

    return { monthKeys: { last, prev }, volumeTop, priceTop, citySpotlight };
  }, [allData]);

  if (!allData || Object.keys(allData).length === 0) {
    return <div className="trending-empty">표시할 데이터가 없습니다.</div>;
  }

  return (
    <div className="trending-dashboard">
      <div className="td-header">
        <h2>주요동향</h2>
        {monthKeys?.prev && monthKeys?.last && (
          <div className="td-period">비교: {monthKeys.prev} → {monthKeys.last}</div>
        )}
      </div>

      <div className="td-grid">
        <section className="td-card">
          <h3>거래량 급증 지역</h3>
          <ul className="td-list">
            {volumeTop.map((item, idx) => (
              <li key={item.region} className="td-item">
                <div className="td-rank">{idx + 1}</div>
                <div className="td-info">
                  <div className="td-title">{item.region}</div>
                  <div className="td-meta">{formatNum(item.previous)}건 → {formatNum(item.current)}건</div>
                </div>
                <div className="td-delta up">{formatPct(item.changePct)}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="td-card">
          <h3>평균가격 급증 지역</h3>
          <ul className="td-list">
            {priceTop.map((item, idx) => (
              <li key={item.region} className="td-item">
                <div className="td-rank">{idx + 1}</div>
                <div className="td-info">
                  <div className="td-title">{item.region}</div>
                  <div className="td-meta">{toEok(item.previous)}억 → {toEok(item.current)}억</div>
                </div>
                <div className="td-delta up">{formatPct(item.changePct)}</div>
              </li>
            ))}
          </ul>
        </section>

        <section className="td-card td-wide">
          <h3>도시별 주목받는 아파트</h3>
          <ul className="td-list td-two-col">
            {citySpotlight.map((item) => (
              <li key={`${item.city}-${item.complex}`} className="td-item">
                <div className="td-badge">{item.city}</div>
                <div className="td-info">
                  <div className="td-title">{item.complex}</div>
                  <div className="td-meta">{formatNum(item.previous)}건 → {formatNum(item.current)}건</div>
                </div>
                <div className="td-delta up">{formatPct(item.changePct)}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default TrendingDashboard;


