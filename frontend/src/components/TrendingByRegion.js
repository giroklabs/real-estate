import React, { useMemo } from 'react';
import './TrendingByRegion.css';

const getMonthKey = (dateString) => {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const calcChangePct = (curr, prev) => {
  if (!prev || prev === 0) return null;
  return ((curr - prev) / prev) * 100;
};

const toEok = (won) => {
  if (!won || won <= 0) return 0;
  return Math.round((won / 100000000) * 100) / 100;
};

const pctText = (n) => (n === null || n === undefined ? '-' : `${n.toFixed(1)}%`);
const numText = (n) => (n === null || n === undefined ? '-' : n.toLocaleString('ko-KR'));

const TrendingByRegion = ({ allData }) => {
  const { priceCards, volumeCards } = useMemo(() => {
    if (!allData) return [];

    // region -> complex -> month -> {count, priceAgg}
    const regionComplexMonth = {};

    Object.entries(allData).forEach(([region, rows]) => {
      if (!Array.isArray(rows)) return;
      if (!regionComplexMonth[region]) regionComplexMonth[region] = {};
      rows.forEach((row) => {
        const key = getMonthKey(row.latest_transaction_date || row.date);
        if (!key) return;
        const complex = row.complex_name || '미상 단지';
        const count = row.transaction_count || 0;
        const price = row.avg_price || row.average_price || row.price || 0;
        if (!regionComplexMonth[region][complex]) regionComplexMonth[region][complex] = {};
        if (!regionComplexMonth[region][complex][key]) regionComplexMonth[region][complex][key] = { totalPrice: 0, totalCount: 0 };
        regionComplexMonth[region][complex][key].totalPrice += price * count;
        regionComplexMonth[region][complex][key].totalCount += count;
      });
    });

    // 전체 월 목록
    const allMonths = new Set();
    Object.values(regionComplexMonth).forEach((complexMap) => {
      Object.values(complexMap).forEach((monthsMap) => {
        Object.keys(monthsMap).forEach((m) => allMonths.add(m));
      });
    });
    const monthsSorted = Array.from(allMonths).sort();
    const last = monthsSorted[monthsSorted.length - 1];
    const prev = monthsSorted[monthsSorted.length - 2];
    const prev2 = monthsSorted[monthsSorted.length - 3];

    // 지역별 1위 산출
    const priceCards = [];
    const volumeCards = [];

    Object.entries(regionComplexMonth).forEach(([region, complexMap]) => {
      // 평균가격 급증 아파트 (전월 대비) Top1
      const priceSurgeRanked = Object.entries(complexMap).map(([complex, monthsMap]) => {
        const pAggPrev = (monthsMap[prev] || { totalPrice: 0, totalCount: 0 });
        const pAggLast = (monthsMap[last] || { totalPrice: 0, totalCount: 0 });
        const prevAvg = pAggPrev.totalCount > 0 ? pAggPrev.totalPrice / pAggPrev.totalCount : 0;
        const lastAvg = pAggLast.totalCount > 0 ? pAggLast.totalPrice / pAggLast.totalCount : 0;
        const pct = calcChangePct(lastAvg, prevAvg);
        return { complex, prevAvg, lastAvg, changePct: pct };
      })
      .filter((x) => x.changePct !== null && x.changePct > 0 && x.prevAvg > 0)
      .sort((a, b) => b.changePct - a.changePct);

      if (priceSurgeRanked.length > 0) {
        const top = priceSurgeRanked[0];
        priceCards.push({ region, ...top });
      }

      // 거래량 3개월 연속 증가 Top1
      const volumeRisersRanked = Object.entries(complexMap).map(([complex, monthsMap]) => {
        const c0 = (monthsMap[prev2]?.totalCount) || 0;
        const c1 = (monthsMap[prev]?.totalCount) || 0;
        const c2 = (monthsMap[last]?.totalCount) || 0;
        const ok = prev2 && prev && last ? (c0 < c1 && c1 < c2) : false;
        const pct = ok ? calcChangePct(c2, c0 || 0) : null;
        return { complex, m0: c0, m1: c1, m2: c2, changePct: pct };
      })
      .filter((x) => x.changePct !== null && x.changePct > 0)
      .sort((a, b) => b.changePct - a.changePct);

      if (volumeRisersRanked.length > 0) {
        const top = volumeRisersRanked[0];
        volumeCards.push({ region, ...top });
      }
    });

    // 정렬 후 카드 수 제한 (각 12개)
    priceCards.sort((a, b) => b.changePct - a.changePct);
    volumeCards.sort((a, b) => b.changePct - a.changePct);

    return { priceCards: priceCards.slice(0, 12), volumeCards: volumeCards.slice(0, 12) };
  }, [allData]);

  if (!allData || Object.keys(allData).length === 0) {
    return <div className="tbr-empty">표시할 데이터가 없습니다.</div>;
  }

  return (
    <div className="tbr">
      <h3 className="tbr-section-title">평균가격 급증 아파트 (지역별 Top1)</h3>
      <div className="tbr-grid">
        {priceCards.map((x) => (
          <section key={`price-${x.region}`} className="tbr-card single">
            <div className="tbr-card-title">{x.region}</div>
            <div className="tbr-item">
              <div className="rank">1</div>
              <div className="info">
                <div className="title">{x.complex}</div>
                <div className="meta">{toEok(x.prevAvg)}억 → {toEok(x.lastAvg)}억</div>
              </div>
              <div className="delta up">{pctText(x.changePct)}</div>
            </div>
          </section>
        ))}
      </div>

      <h3 className="tbr-section-title">거래량 상승 추세 아파트 (지역별 Top1 · 최근 3개월)</h3>
      <div className="tbr-grid">
        {volumeCards.map((x) => (
          <section key={`vol-${x.region}`} className="tbr-card single">
            <div className="tbr-card-title">{x.region}</div>
            <div className="tbr-item">
              <div className="rank">1</div>
              <div className="info">
                <div className="title">{x.complex}</div>
                <div className="meta">{numText(x.m0)} → {numText(x.m1)} → {numText(x.m2)}건</div>
              </div>
              <div className="delta up">{pctText(x.changePct)}</div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default TrendingByRegion;


