import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const TOP_N = parseInt(process.env.REACT_APP_TOP_N || '50', 10);

const ApartmentRankings = ({ allData, currentCityData, selectedCity, dataTimestamp }) => {
    console.log('ApartmentRankings 렌더링됨');
    console.log('props - allData:', allData);
    console.log('props - currentCityData:', currentCityData);
    console.log('props - selectedCity:', selectedCity);
    const [rankings, setRankings] = useState([]);

    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedMonths, setSelectedMonths] = useState(() => {
        // 초기값을 현재월과 지난월로 설정
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1; // 0-based이므로 +1
        
        const currentMonthStr = `${currentYear}-${currentMonth.toString().padStart(2, '0')}`;
        const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
        const lastMonthStr = `${lastMonthYear}-${lastMonth.toString().padStart(2, '0')}`;
        
        return [currentMonthStr, lastMonthStr];
    });
    const [sortBy, setSortBy] = useState('transaction_count'); // 정렬 기준
    const [sortOrder, setSortOrder] = useState('desc'); // 정렬 순서
    const [loading, setLoading] = useState(false);
    const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
    const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const [searchTerm, setSearchTerm] = useState(''); // 아파트명 검색어 상태 추가
    
    // 펼쳐진 상세정보 상태 관리
    const [expandedItems, setExpandedItems] = useState(new Set());

    // 사용 가능한 월 목록 생성: 현재 도시 데이터에 실제 존재하는 월만 노출 (없으면 기존 로직)
    const generateAvailableMonths = () => {
        const monthSet = new Set();
        // normalizedCityData의 모든 거래에서 YYYY-MM 추출
        if (normalizedCityData && Object.keys(normalizedCityData).length > 0) {
            Object.values(normalizedCityData).forEach(rows => {
                if (Array.isArray(rows)) {
                    rows.forEach(r => {
                        const ds = (r.latest_transaction_date || r.date || '').toString();
                        if (ds && ds.length >= 7) {
                            const ym = `${ds.slice(0,4)}-${ds.slice(5,7)}`;
                            // 2023 제외, 그 외는 포함
                            if (!ym.startsWith('2023-')) monthSet.add(ym);
                        }
                    });
                }
            });
        }

        let months = [];
        if (monthSet.size > 0) {
            // 존재하는 월만 정렬(최신 우선)
            months = Array.from(monthSet)
                .sort((a,b) => (a < b ? 1 : a > b ? -1 : 0))
                .map(ym => {
                    const [y, m] = ym.split('-');
                    return { value: ym, label: `${y}년 ${parseInt(m,10)}월` };
                });
        } else {
            // 해당 도시에서 이용 가능한 월 정보가 없으면 빈 배열 반환 → months=all 처리 유도
            months = [];
        }
        return months;
    };

    // 특정 연도 전체 선택 (예: 2024년)
    const selectYear = (year) => {
        const monthsOfYear = generateAvailableMonths()
            .filter(m => m.value.startsWith(`${year}-`))
            .map(m => m.value);
        setSelectedMonths(monthsOfYear);
        setLoading(true);
        setIsMonthDropdownOpen(false);
    };

    // 월 선택 토글 (중복 선택 허용)
    const toggleMonth = (monthValue) => {
        setSelectedMonths(prev => {
            // 이미 선택된 월이면 제거, 아니면 추가
            if (prev.includes(monthValue)) {
                return prev.filter(m => m !== monthValue);
            } else {
                // 중복 선택 허용 - 같은 월을 여러 번 선택할 수 있음
                return [...prev, monthValue];
            }
        });
        setLoading(true); // 월 선택 시 로딩 상태 표시
    };

    // 전체 월 선택/해제
    const selectAllMonths = () => {
        const allMonths = generateAvailableMonths().map(m => m.value);
        setSelectedMonths(allMonths);
        setLoading(true); // 월 선택 시 로딩 상태 표시
        setIsMonthDropdownOpen(false); // 드롭다운 닫기
    };

    const clearAllMonths = () => {
        setSelectedMonths([]);
        setLoading(true); // 월 선택 시 로딩 상태 표시
        setIsMonthDropdownOpen(false); // 드롭다운 닫기
    };

    // 드롭다운 외부 클릭 시 닫기
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMonthDropdownOpen && !event.target.closest('.month-select-container')) {
                setIsMonthDropdownOpen(false);
            }
            if (isRegionDropdownOpen && !event.target.closest('.region-select-container')) {
                setIsRegionDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMonthDropdownOpen, isRegionDropdownOpen]);

    // 도시 변경 시 현재월과 지난월 데이터 자동 선택
    useEffect(() => {
        if (selectedCity) {
            const availableMonths = generateAvailableMonths();
            if (availableMonths.length > 0) {
                const latestMonths = availableMonths.slice(0, 2).map(m => m.value);
                setSelectedMonths(latestMonths);
            } else {
                // 이용 가능한 월이 없으면 현재월+이전월 기본 설정
                const now = new Date();
                const y = now.getFullYear();
                const m = now.getMonth() + 1;
                const cur = `${y}-${String(m).padStart(2,'0')}`;
                const prevDate = new Date(y, m - 2, 1);
                const prev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2,'0')}`;
                setSelectedMonths([cur, prev]);
            }
            // 최초 진입 시 서울은 강남구 50위 우선 렌더
            if (isFirstLoad && selectedCity === 'seoul') {
                setSelectedRegion('서울 강남구');
            }
            setLoading(true);
        }
    }, [selectedCity]);

    // 월 선택 변경 시 데이터 새로고침
    useEffect(() => {
        if (loading) {
            fetchRankings();
        }
    }, [selectedMonths]);

    // 도시 전체 표시 텍스트 생성
    const getCityAllText = (city) => {
        const cityNames = {
            'seoul': '서울시 전체',
            'busan': '부산시 전체',
            'incheon': '인천시 전체',
            'daegu': '대구시 전체',
            'gwangju': '광주시 전체',
            'daejeon': '대전시 전체',
            'ulsan': '울산시 전체',
            'bucheon': '부천시 전체',
            'guri': '구리시 전체',
            'seongnam': '성남시 전체',
            'suwon': '수원시 전체',
            'yongin': '용인시 전체',
            'anyang': '안양시 전체'
        };
        return cityNames[city] || (city ? `${city} 전체` : '전체');
    };

    // 선택된 월들의 표시 텍스트 생성 (중복 선택 고려)
    const getSelectedMonthsText = () => {
        if (selectedMonths.length === 0) return '전체 기간';
        
        // 중복 제거된 고유 월들 계산
        const uniqueMonths = [...new Set(selectedMonths)];
        
        if (uniqueMonths.length === 1) {
            const month = generateAvailableMonths().find(m => m.value === uniqueMonths[0]);
            const count = selectedMonths.filter(m => m === uniqueMonths[0]).length;
            if (month) {
                return `${month.label}${count > 1 ? ` (${count}회 선택)` : ''}`;
            } else {
                // 폴백: YYYY-MM 형식을 YYYY년 MM월로 변환
                const [year, monthNum] = uniqueMonths[0].split('-');
                const formattedMonth = `${year}년 ${parseInt(monthNum, 10)}월`;
                return `${formattedMonth}${count > 1 ? ` (${count}회 선택)` : ''}`;
            }
        }
        
        if (uniqueMonths.length === generateAvailableMonths().length) return '전체 기간';
        
        // 중복 선택된 월들이 있는 경우
        const monthCounts = {};
        selectedMonths.forEach(month => {
            monthCounts[month] = (monthCounts[month] || 0) + 1;
        });
        
        // 모든 월을 "YYYY년 MM월" 형식으로 통일
        const displayText = uniqueMonths.slice(0, 2).map(month => {
            const monthInfo = generateAvailableMonths().find(m => m.value === month);
            const count = monthCounts[month];
            if (monthInfo) {
                return `${monthInfo.label}${count > 1 ? ` (${count}회)` : ''}`;
            } else {
                // 폴백: YYYY-MM 형식을 YYYY년 MM월로 변환
                const [year, monthNum] = month.split('-');
                const formattedMonth = `${year}년 ${parseInt(monthNum, 10)}월`;
                return `${formattedMonth}${count > 1 ? ` (${count}회)` : ''}`;
            }
        }).join(', ');
        
        if (uniqueMonths.length > 2) {
            return `${displayText} 외 ${uniqueMonths.length - 2}개월`;
        }
        
        return displayText;
    };

    // 상세정보 토글
    const toggleDetails = (itemId) => {
        const newExpandedItems = new Set(expandedItems);
        if (newExpandedItems.has(itemId)) {
            newExpandedItems.delete(itemId);
        } else {
            newExpandedItems.add(itemId);
        }
        setExpandedItems(newExpandedItems);
    };

    // 상세정보가 펼쳐져 있는지 확인
    const isExpanded = (itemId) => expandedItems.has(itemId);






    // 지역 키 정규화: '서울 강남구 2024.json' -> '서울 강남구'
    const normalizeRegionKey = useCallback((name) => {
        if (!name || typeof name !== 'string') return name;
        let n = name.trim();
        // 공백 + 연도 + .json 제거
        n = n.replace(/\s+\d{4}\.json$/i, '');
        // 남아있는 .json 제거
        n = n.replace(/\.json$/i, '');
        // 중복 공백 정리
        n = n.replace(/\s+/g, ' ').trim();
        return n;
    }, []);

    // 정규화된 도시 데이터로 병합 (동일 지역명으로 합치기)
    const normalizedCityData = useMemo(() => {
        const output = {};
        const entries = Object.entries(currentCityData || {});
        for (const [key, rows] of entries) {
            const nk = normalizeRegionKey(key);
            if (!output[nk]) output[nk] = [];
            if (Array.isArray(rows)) output[nk] = output[nk].concat(rows);
        }
        return output;
    }, [currentCityData, normalizeRegionKey]);

    // 도시 데이터에 실제 거래 레코드가 1건이라도 있는지 확인
    const hasAnyCityTransactions = useMemo(() => {
        if (!normalizedCityData) return false;
        return Object.values(normalizedCityData).some(rows => Array.isArray(rows) && rows.length > 0);
    }, [normalizedCityData]);

    // 아파트별 상세 거래 내역 생성 함수 (실제 데이터 사용)
    const generateSampleTransactionDetails = (item) => {
        const transactions = [];
        const seenTransactions = new Set(); // 중복 방지를 위한 Set
        
        // 정규화된 데이터에서 해당 아파트의 실제 거래 데이터 찾기
        if (normalizedCityData) {
            // selectedRegion이 있으면 해당 지역에서만 검색, 없으면 전체 도시에서 검색
            const searchRegions = selectedRegion ? [selectedRegion] : Object.keys(normalizedCityData);
            
            for (const region of searchRegions) {
                const regionData = normalizedCityData[region];
                if (regionData && Array.isArray(regionData)) {
                    // 해당 아파트명과 일치하는 거래 데이터 필터링
                    const apartmentTransactions = regionData.filter(transaction => 
                        transaction.complex_name === item.complex_name
                    );
                    
                    // 찾은 거래 데이터를 transactions 배열에 추가 (중복 제거)
                    apartmentTransactions.forEach((transaction, index) => {
                        // 중복 체크를 위한 고유 키 생성 (날짜 + 가격 + 면적 + 층수)
                        const uniqueKey = `${transaction.date || transaction.latest_transaction_date}_${transaction.avg_price || transaction.price}_${transaction.area}_${transaction.floor}`;
                        
                        if (!seenTransactions.has(uniqueKey)) {
                            seenTransactions.add(uniqueKey);
                            transactions.push({
                                id: transactions.length + 1,
                                transaction_date: transaction.date || transaction.latest_transaction_date,
                                price: transaction.avg_price || transaction.price,
                                area: transaction.area,
                                floor: transaction.floor,
                                region_name: transaction.region_name || item.region_name
                            });
                        }
                    });
                }
            }
        }
        
        // 실제 데이터가 없는 경우 빈 배열 반환 (가상 데이터 생성 제거)
        if (transactions.length === 0) {
            return [];
        }
        
        // 최대 10건까지만 표시하고 최신순으로 정렬
        return transactions
            .sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))
            .slice(0, 10);
    };

    // 검색어에 따른 필터링된 순위 데이터 생성
    const getFilteredRankings = () => {
        let filteredData = rankings;
        
        if (searchTerm.trim()) {
            filteredData = rankings.filter(item => 
                item.complex_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.region_name && item.region_name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        // 순위 추가
        return filteredData.map((item, index) => ({
            ...item,
            rank: index + 1
        }));
    };

    // 정렬 함수를 useCallback으로 메모이제이션
    const sortRankings = useCallback((data) => {
        if (!Array.isArray(data) || data.length === 0) return [];
        
        return [...data].sort((a, b) => {
            let aValue, bValue;
            
            switch (sortBy) {
                case 'transaction_count':
                    aValue = a.transaction_count || 0;
                    bValue = b.transaction_count || 0;
                    break;
                case 'avg_price':
                    aValue = a.avg_price || 0;
                    bValue = b.avg_price || 0;
                    break;
                case 'latest_transaction_date':
                    aValue = new Date(a.latest_transaction_date || 0).getTime();
                    bValue = new Date(b.latest_transaction_date || 0).getTime();
                    break;
                default:
                    aValue = a.transaction_count || 0;
                    bValue = b.transaction_count || 0;
            }
            
            // 안정적인 정렬을 위해 비교 결과를 명확하게 처리
            if (aValue === bValue) {
                // 값이 같을 때는 아파트명으로 2차 정렬 (안정성 확보)
                return (a.complex_name || '').localeCompare(b.complex_name || '');
            }
            
            if (sortOrder === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });
    }, [sortBy, sortOrder]);

    // fetchRankings 함수를 useCallback으로 메모이제이션
    const fetchRankings = useCallback(async () => {
        console.log('=== fetchRankings 시작 ===');
        console.log('selectedRegion:', selectedRegion);
        console.log('selectedCity:', selectedCity);
        console.log('currentCityData 존재 여부:', !!currentCityData);
        
        setLoading(true);
        try {
            // 정규화된 데이터가 있고, 지역이 지정된 경우 프런트 집계 경로
            if (selectedRegion && normalizedCityData && Object.keys(normalizedCityData).length > 0 && hasAnyCityTransactions) {
                console.log('프론트엔드에서 도시 데이터 처리 시작');
                console.log('정규화된 도시 데이터:', normalizedCityData);
                console.log('현재 선택된 지역:', selectedRegion);
                
                // currentCityData에서 아파트별 통계 계산
                const apartmentStats = {};
                let totalRegions = 0;
                let totalTransactions = 0;
                
                // 월별 필터링을 위한 날짜 계산
                let selectedMonthRanges = [];
                if (selectedMonths.length > 0) {
                    selectedMonthRanges = selectedMonths.map(monthStr => {
                        const [year, month] = monthStr.split('-').map(Number);
                        const startDate = new Date(year, month - 1, 1); // 해당 월의 첫째 날
                        const endDate = new Date(year, month, 0); // 해당 월의 마지막 날
                        return { startDate, endDate };
                    });
                    console.log(`월별 필터링: ${selectedMonths.length}개월 선택됨`);
                    selectedMonthRanges.forEach((range, index) => {
                        console.log(`  ${index + 1}번째 월: ${range.startDate.toISOString()} ~ ${range.endDate.toISOString()}`);
                    });
                } else {
                    console.log(`전체 기간 필터링: 날짜 제한 없음`);
                }
                
                Object.keys(normalizedCityData).forEach(region => {
                    totalRegions++;
                    console.log(`지역 ${region} 처리 중...`);
                    
                    // 특정 지역이 선택된 경우 해당 지역만 처리
                    if (selectedRegion && selectedRegion !== '전체' && region !== selectedRegion) {
                        console.log(`지역 ${region} 건너뜀 (선택된 지역: ${selectedRegion})`);
                        return;
                    }
                    
                    const regionData = normalizedCityData[region];
                    console.log(`지역 ${region} 데이터:`, {
                        type: typeof regionData,
                        isArray: Array.isArray(regionData),
                        length: Array.isArray(regionData) ? regionData.length : 'N/A'
                    });
                    
                    if (Array.isArray(regionData)) {
                        regionData.forEach((transaction, index) => {
                            // 월별 필터링 적용 (전체 기간 선택 시 필터링 없음)
                            if (selectedMonthRanges.length > 0) {
                                const transactionDate = new Date(transaction.latest_transaction_date || transaction.date);
                                const isInSelectedMonths = selectedMonthRanges.some(range => 
                                    transactionDate >= range.startDate && transactionDate <= range.endDate
                                );
                                if (!isInSelectedMonths) {
                                    return; // 선택된 월에 포함되지 않는 거래는 건너뛰기
                                }
                            }
                            
                            totalTransactions++;
                            const complexName = transaction.complex_name;
                            
                            if (!apartmentStats[complexName]) {
                                apartmentStats[complexName] = {
                                    complex_name: complexName,
                                    region_name: region,
                                    transaction_count: 0,
                                    total_price: 0,
                                    avg_price: 0,
                                    latest_transaction_date: '',
                                    min_price: Infinity,
                                    max_price: 0
                                };
                            }
                            
                            const price = transaction.avg_price || 0;
                            apartmentStats[complexName].transaction_count++;
                            apartmentStats[complexName].total_price += price;
                            apartmentStats[complexName].min_price = Math.min(apartmentStats[complexName].min_price, price);
                            apartmentStats[complexName].max_price = Math.max(apartmentStats[complexName].max_price, price);
                            
                            const transactionDate = transaction.latest_transaction_date || transaction.date;
                            if (!apartmentStats[complexName].latest_transaction_date || 
                                new Date(transactionDate) > new Date(apartmentStats[complexName].latest_transaction_date)) {
                                apartmentStats[complexName].latest_transaction_date = transactionDate;
                            }
                        });
                    } else {
                        console.log(`지역 ${region}의 데이터가 배열이 아님:`, regionData);
                    }
                });
                
                console.log(`지역 처리 완료: ${totalRegions}개 지역, ${totalTransactions}개 거래`);
                console.log(`월별 필터링 결과: ${selectedMonths.length === 0 ? '전체 기간' : selectedMonths.map(m => `${m.split('-')[0]}년 ${m.split('-')[1]}월`).join(', ')} 거래 ${totalTransactions}건`);
                
                // 평균 가격 계산
                Object.values(apartmentStats).forEach(stat => {
                    stat.avg_price = Math.round(stat.total_price / stat.transaction_count);
                    if (stat.min_price === Infinity) stat.min_price = 0;
                });
                
                const rankingsData = Object.values(apartmentStats);
                // 안정적인 정렬을 위해 복사본 생성 후 정렬
                const sortedData = sortRankings([...rankingsData]);
                console.log(`정렬 기준: ${sortBy} (${sortOrder}), 결과 순서:`, 
                    sortedData.slice(0, 5).map(item => `${item.complex_name}: ${item[sortBy]}`));
                setRankings(sortedData);
                console.log(`프론트엔드 처리 결과: ${rankingsData.length}건`);
                console.log('새로운 rankings 설정됨:', sortedData.length);
                console.log('샘플 데이터:', sortedData.slice(0, 3));
                return;
            }
            

            
            // currentCityData가 없거나, 도시 데이터에 레코드가 없으면 백엔드 API 호출 (2단계 로딩: top N -> full)
            let url = '/api/apartments/rankings?';
            const params = [];

            // 도시 데이터 기준 가용 월을 우선 확보하여 월 파라미터 보정 (서로 다른 도시 왕복 시 0건 방지)
            const monthSetForCity = new Set();
            if (normalizedCityData && Object.keys(normalizedCityData).length > 0) {
                Object.values(normalizedCityData).forEach(rows => {
                    if (Array.isArray(rows)) {
                        rows.forEach(r => {
                            const ds = (r.latest_transaction_date || r.date || '').toString();
                            if (ds && ds.length >= 7) monthSetForCity.add(`${ds.slice(0,4)}-${ds.slice(5,7)}`);
                        });
                    }
                });
            }
            const availableMonths = Array.from(monthSetForCity).sort((a,b) => (a < b ? 1 : -1));
            let monthsToUse = selectedMonths;
            if (monthsToUse.length > 0 && availableMonths.length > 0) {
                const overlap = monthsToUse.some(m => availableMonths.includes(m));
                if (!overlap) {
                    monthsToUse = availableMonths.slice(0, 2);
                    if (monthsToUse.length > 0) setSelectedMonths(monthsToUse);
                }
            }
            
            if (selectedRegion) {
                params.push(`region=${encodeURIComponent(selectedRegion)}`);
            } else if (selectedCity) {
                // 지역을 특정하지 않았을 때는 선택된 도시로 필터링하도록 city 전달
                params.push(`city=${encodeURIComponent(selectedCity)}`);
            } else {
                // 도시도 지역도 선택되지 않았을 때는 모든 지역의 Hot한 아파트 조회
                console.log('🌍 모든 지역의 Hot한 아파트 조회');
            }
            
            if (monthsToUse.length > 0) {
                params.push(`months=${monthsToUse.map(m => encodeURIComponent(m)).join(',')}`);
            } else {
                // 전체 기간 선택 시 파라미터 제거
                params.push(`months=all`);
            }
            
            // 1) Top 먼저 (최초+서울 강남구면 50위)
            const initialGangnam = isFirstLoad && selectedCity === 'seoul' && (selectedRegion === '서울 강남구' || !selectedRegion);
            const topLimit = initialGangnam ? 50 : TOP_N;
            const topUrl = `${url}${params.join('&')}${params.length ? '&' : ''}limit=${topLimit}`;
            const responseTop = await axios.get(topUrl);
            if (responseTop.data && responseTop.data.status === 'success') {
                const topData = responseTop.data.apartments || responseTop.data.data || [];
                setRankings(sortRankings(topData));
            } else {
                setRankings([]);
            }

            // 2) 전체 데이터 비동기 로드
            try {
                const fullUrl = `${url}${params.join('&')}`; // limit 없이 전체
                const responseFull = await axios.get(fullUrl);
                if (responseFull.data && responseFull.data.status === 'success') {
                    const fullData = responseFull.data.apartments || responseFull.data.data || [];
                    // 기존 top 100와 동일 정렬 기준으로 교체
                    setRankings(sortRankings(fullData));
                }
            } catch (e) {
                // 전체 로드는 실패해도 화면 영향 최소화
            }

            // 백엔드가 비어있는 경우(또는 응답 실패) → 프런트 집계 폴백 (도시 전체)
            if ((!Array.isArray(rankings) || rankings.length === 0) && normalizedCityData && hasAnyCityTransactions) {
                console.log('백엔드 랭킹이 비어 있어 프런트 집계 폴백 실행 (도시 전체)');
                const apartmentStats = {};
                let totalTransactions = 0;
                // 월별 필터링 범위 계산
                let selectedMonthRanges = [];
                const monthsForFallback = (monthsToUse && monthsToUse.length > 0) ? monthsToUse : selectedMonths;
                if (monthsForFallback.length > 0) {
                    selectedMonthRanges = monthsForFallback.map(monthStr => {
                        const [year, month] = monthStr.split('-').map(Number);
                        const startDate = new Date(year, month - 1, 1);
                        const endDate = new Date(year, month, 0);
                        return { startDate, endDate };
                    });
                }
                Object.keys(normalizedCityData).forEach(region => {
                    const regionData = normalizedCityData[region];
                    if (Array.isArray(regionData)) {
                        regionData.forEach(transaction => {
                            if (selectedMonthRanges.length > 0) {
                                const transactionDate = new Date(transaction.latest_transaction_date || transaction.date);
                                const isInSelectedMonths = selectedMonthRanges.some(range => 
                                    transactionDate >= range.startDate && transactionDate <= range.endDate
                                );
                                if (!isInSelectedMonths) return;
                            }
                            totalTransactions++;
                            const complexName = transaction.complex_name;
                            if (!apartmentStats[complexName]) {
                                apartmentStats[complexName] = {
                                    complex_name: complexName,
                                    region_name: region,
                                    transaction_count: 0,
                                    total_price: 0,
                                    avg_price: 0,
                                    latest_transaction_date: ''
                                };
                            }
                            const price = transaction.avg_price || 0;
                            apartmentStats[complexName].transaction_count++;
                            apartmentStats[complexName].total_price += price;
                            const tDate = transaction.latest_transaction_date || transaction.date;
                            if (!apartmentStats[complexName].latest_transaction_date || new Date(tDate) > new Date(apartmentStats[complexName].latest_transaction_date)) {
                                apartmentStats[complexName].latest_transaction_date = tDate;
                            }
                        });
                    }
                });
                Object.values(apartmentStats).forEach(stat => {
                    stat.avg_price = Math.round(stat.total_price / Math.max(1, stat.transaction_count));
                });
                const rankingsData = Object.values(apartmentStats);
                setRankings(sortRankings(rankingsData));
                console.log(`프런트 폴백 결과: ${rankingsData.length}건, 처리 거래수: ${totalTransactions}`);
            }
            if (isFirstLoad) setIsFirstLoad(false);
        } catch (error) {
            console.error('아파트 순위 조회 실패:', error);
            setRankings([]); // 에러 시 빈 배열로 초기화
        } finally {
            setLoading(false);
        }
    }, [selectedRegion, selectedCity, selectedMonths, normalizedCityData, sortRankings]);

    useEffect(() => {
        fetchRankings();
    }, [fetchRankings]);

    // 도시 변경 시: 최초 로드 이후에는 지역 초기화
    useEffect(() => {
        if (!isFirstLoad) setSelectedRegion('');
    }, [selectedCity]);

    // 정렬이 변경될 때마다 순위 데이터 재정렬 (중복 실행 방지)
    useEffect(() => {
        if (rankings.length > 0) {
            const sortedRankings = sortRankings([...rankings]);
            // 정렬된 결과가 현재와 다를 때만 업데이트
            const isChanged = sortedRankings.some((item, index) => 
                rankings[index]?.complex_name !== item.complex_name
            );
            if (isChanged) {
                setRankings(sortedRankings);
            }
        }
    }, [sortBy, sortOrder]);





    // 정렬 변경 핸들러를 useCallback으로 메모이제이션
    const handleSortChange = useCallback((newSortBy) => {
        if (sortBy === newSortBy) {
            // 같은 정렬 기준이면 순서만 변경
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // 다른 정렬 기준이면 기준 변경하고 기본 순서로 설정
            setSortBy(newSortBy);
            setSortOrder('desc');
        }
    }, [sortBy, sortOrder]);





    const formatPrice = (price) => {
        if (!price) return '0원';
        return new Intl.NumberFormat('ko-KR').format(price) + '원';
    };

    const formatArea = (area) => {
        if (!area) return '-';
        const pyeong = Number(area) / 3.305785;
        return `${Number(area).toFixed(1)}㎡ (${pyeong.toFixed(1)}평)`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            const y = String(date.getFullYear()).padStart(4, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}.${m}.${d}.`;
        } catch (e) {
            return dateString;
        }
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank;
    };

    // 지역명 표기 포맷 (부천시는 시 단위로만 노출)
    const inferRegionForApartment = useCallback((complexName) => {
        if (!normalizedCityData) return null;
        const regions = Object.keys(normalizedCityData);
        for (const region of regions) {
            const rows = normalizedCityData[region];
            if (Array.isArray(rows) && rows.some(t => t.complex_name === complexName)) {
                return region;
            }
        }
        return null;
    }, [normalizedCityData]);

    const formatRegionNameForDisplay = useCallback((name, item) => {
        if (selectedCity === 'bucheon') {
            return '경기 부천시';
        }
        if (selectedCity === 'seongnam') {
            // 이미 행정구가 포함된 경우 그대로 표시
            if (/성남시\s+\S+구/.test(name)) return name;
            // 아파트명으로 행정구 추론 시도
            const inferred = inferRegionForApartment(item?.complex_name || '');
            if (inferred && /성남시/.test(inferred)) return inferred;
            // 최소한 시 단위 보장
            if (/성남/.test(name)) return '경기 성남시';
        }
        return name;
    }, [selectedCity, inferRegionForApartment]);

    // 부산 지역 목록 생성
    const cityRegions = useMemo(() => Object.keys(normalizedCityData || {}), [normalizedCityData]);

    return (
        <div className="apartment-rankings">
            <div className="rankings-header">
                <div className="rankings-controls">
                    
                    {/* 지역 선택기: 부천만 도시 전체 고정, 그 외 도시는 드롭다운 유지 */}
                    <div className="region-selector">
                        {selectedCity === 'bucheon' ? (
                            <div className="region-select-container">
                                <button className="region-select-toggle" disabled>
                                    {getCityAllText(selectedCity)}
                                </button>
                            </div>
                        ) : (
                            <div className={`region-select-container ${isRegionDropdownOpen ? 'open' : ''}`}>
                                <button 
                                    onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                                    className="region-select-toggle"
                                >
                                    {selectedRegion || getCityAllText(selectedCity)}
                                </button>
                                {isRegionDropdownOpen && (
                                    <div className="region-select-dropdown">
                                        <button 
                                            onClick={() => {
                                                setSelectedRegion('');
                                                setIsRegionDropdownOpen(false);
                                            }} 
                                            className="region-select-option"
                                        >
                                            {getCityAllText(selectedCity)}
                                        </button>
                                        {cityRegions.map(region => (
                                            <button 
                                                key={region} 
                                                onClick={() => {
                                                    setSelectedRegion(region);
                                                    setIsRegionDropdownOpen(false);
                                                }}
                                                className={`region-select-option ${selectedRegion === region ? 'selected' : ''}`}
                                            >
                                                {selectedRegion === region ? (
                                                    <span style={{ 
                                                        color: '#10b981', 
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        minWidth: '16px'
                                                    }}>
                                                        ✓
                                                    </span>
                                                ) : (
                                                    <span style={{ 
                                                        minWidth: '16px'
                                                    }}></span>
                                                )}
                                                <span>{region}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* 아파트명 검색기 */}
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="아파트명 또는 지역명 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="apartment-search"
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="clear-search"
                                title="검색어 지우기"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* 월별 선택기 */}
                    <div className="month-selector">
                        <div className={`month-select-container ${isMonthDropdownOpen ? 'open' : ''}`}>
                            <button 
                                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                                className="month-select-toggle"
                            >
                                {getSelectedMonthsText()}
                            </button>
                            {isMonthDropdownOpen && (
                                <div className="month-select-dropdown">
                                    <button 
                                        onClick={selectAllMonths} 
                                        className="month-select-option"
                                        style={{ fontWeight: '600', color: '#3b82f6' }}
                                    >
                                        전체 선택
                                    </button>
                                    <button 
                                        onClick={clearAllMonths} 
                                        className="month-select-option"
                                        style={{ fontWeight: '600', color: '#ef4444' }}
                                    >
                                        전체 해제
                                    </button>
                                    {/* 빠른 선택: 2025년 전체 */}
                                    <button 
                                        onClick={() => selectYear(2025)} 
                                        className="month-select-option"
                                        style={{ fontWeight: '600', color: '#10b981' }}
                                    >
                                        2025년 전체
                                    </button>
                                    {/* 빠른 선택: 2024년 전체 */}
                                    <button 
                                        onClick={() => selectYear(2024)} 
                                        className="month-select-option"
                                        style={{ fontWeight: '600', color: '#0ea5e9' }}
                                    >
                                        2024년 전체
                                    </button>
                                    {generateAvailableMonths().map(month => {
                                        const isSelected = selectedMonths.includes(month.value);
                                        const selectionCount = selectedMonths.filter(m => m === month.value).length;
                                        const isMultiple = selectionCount > 1;
                                        
                                        return (
                                            <button 
                                                key={month.value} 
                                                onClick={() => toggleMonth(month.value)}
                                                className={`month-select-option ${isSelected ? 'selected' : ''} ${isMultiple ? 'multiple' : ''}`}
                                                title={isMultiple ? `${month.label} (${selectionCount}회 선택됨)` : month.label}
                                            >
                                                {isSelected && (
                                                    <span style={{ 
                                                        color: '#10b981', 
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        minWidth: '16px'
                                                    }}>
                                                        ✓
                                                    </span>
                                                )}
                                                {!isSelected && (
                                                    <span style={{ 
                                                        minWidth: '16px'
                                                    }}></span>
                                                )}
                                                <span>{month.label}</span>
                                                {isMultiple && (
                                                    <span style={{ 
                                                        fontSize: '0.7rem', 
                                                        opacity: 0.8,
                                                        color: '#10b981',
                                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        whiteSpace: 'nowrap',
                                                        marginLeft: '8px'
                                                    }}>
                                                        {selectionCount}회
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                

            </div>

            {/* 검색 결과 요약 */}
            {searchTerm && (
                <div className="search-summary">
                    <span>검색 결과: {getFilteredRankings().length}건</span>
                    {getFilteredRankings().length === 0 && (
                        <span className="no-results">검색 결과가 없습니다.</span>
                    )}
                </div>
            )}

            {loading ? (
                <div className="loading">데이터를 불러오는 중...</div>
            ) : (
                <div className="rankings-table">
                    <table>
                        <thead>
                            <tr>
                                <th>순위</th>
                                <th>지역</th>
                                <th style={{ textAlign: 'left' }}>아파트명</th>
                                <th 
                                    onClick={() => handleSortChange('avg_price')}
                                    className={`sortable ${sortBy === 'avg_price' ? 'active' : ''}`}
                                >
                                    평균 가격 {sortBy === 'avg_price' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th 
                                    onClick={() => handleSortChange('transaction_count')}
                                    className={`sortable ${sortBy === 'transaction_count' ? 'active' : ''}`}
                                >
                                    거래 건수 {sortBy === 'transaction_count' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                                <th 
                                    onClick={() => handleSortChange('latest_transaction_date')}
                                    className={`sortable ${sortBy === 'latest_transaction_date' ? 'active' : ''}`}
                                >
                                    최근 거래일 {sortBy === 'latest_transaction_date' && (sortOrder === 'desc' ? '↓' : '↑')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredRankings().map((item, index) => (
                                <tr key={index} className={index < 3 ? 'top-rank' : ''}>
                                    <td className="rank-cell">
                                        <span className="rank-badge">{getRankBadge(item.rank)}</span>
                                    </td>
                                    <td className="region-cell">{formatRegionNameForDisplay(item.region_name, item)}</td>
                                    <td className="complex-cell" style={{ textAlign: 'left' }}>
                                                                                 <div className="complex-header" style={{
                                             display: 'flex',
                                             alignItems: 'center',
                                             justifyContent: 'space-between',
                                             width: '100%'
                                         }}>
                                             <span>{item.complex_name}</span>
                                             <button 
                                                 className="toggle-details-btn"
                                                 onClick={() => toggleDetails(item.complex_name)}
                                                 aria-expanded={isExpanded(item.complex_name)}
                                                  style={{
                                                      background: isExpanded(item.complex_name) ? '#007bff' : '#ffffff',
                                                      border: '1px solid #007bff',
                                                      color: isExpanded(item.complex_name) ? '#ffffff' : '#007bff',
                                                      cursor: 'pointer',
                                                      padding: '4px 8px',
                                                      borderRadius: '4px',
                                                      transition: 'all 0.2s ease',
                                                      fontWeight: '500',
                                                      minWidth: '40px'
                                                  }}
                                                 onMouseEnter={(e) => {
                                                     if (!isExpanded(item.complex_name)) {
                                                         e.target.style.backgroundColor = '#f0f8ff';
                                                     }
                                                 }}
                                                 onMouseLeave={(e) => {
                                                     if (!isExpanded(item.complex_name)) {
                                                         e.target.style.backgroundColor = '#ffffff';
                                                     }
                                                 }}
                                             >
                                                 {isExpanded(item.complex_name) ? '접기' : '상세'}
                                             </button>
                                         </div>
                                         {isExpanded(item.complex_name) && (
                                             <div className="complex-details" style={{
                                                 marginTop: '6px',
                                                 padding: '12px',
                                                 backgroundColor: '#f8f9fa',
                                                 borderRadius: '6px',
                                                 border: '1px solid #e9ecef',
                                                 fontSize: '13px',
                                                 lineHeight: '1.4',
                                                 overflow: 'hidden'
                                             }}>
                                                 <h4 style={{ margin: '0 0 10px 0', color: '#495057', fontSize: '14px' }}>
                                                     {item.complex_name} 거래 상세 내역
                                                 </h4>
                                                 
                                                 {/* 거래 상세 내역 테이블 */}
                                                 <div style={{ marginTop: '8px' }}>
                                                                                                      <h5 style={{ 
                                                     margin: '0 0 10px 0', 
                                                     color: '#495057', 
                                                     fontSize: '13px',
                                                     fontWeight: '600',
                                                     borderBottom: '1px solid #dee2e6',
                                                     paddingBottom: '5px'
                                                 }}>
                                                     거래 상세 내역
                                                 </h5>
                                                                                                      <div style={{ 
                                                     overflowX: 'auto',
                                                     backgroundColor: 'white',
                                                     borderRadius: '6px',
                                                     border: '1px solid #dee2e6',
                                                     maxWidth: '100%'
                                                 }}>
                                                                                                                      <table style={{ 
                                                                 width: '100%', 
                                                                 borderCollapse: 'collapse',
                                                                 fontSize: '12px',
                                                                 lineHeight: '1.2',
                                                                 tableLayout: 'fixed'
                                                             }}>
                                                             <thead>
                                                                                                                                    <tr style={{ backgroundColor: '#f8f9fa', lineHeight: '1.0' }}>
                                                                     <th style={{ 
                                                                         padding: '6px 8px', 
                                                                         textAlign: 'left', 
                                                                         borderBottom: '1px solid #dee2e6',
                                                                         fontWeight: '600',
                                                                         color: '#495057',
                                                                         fontSize: '11px',
                                                                         width: '25%',
                                                                         wordBreak: 'break-word'
                                                                     }}>거래일자</th>
                                                                     <th style={{ 
                                                                         padding: '6px 8px', 
                                                                         textAlign: 'left', 
                                                                         borderBottom: '1px solid #dee2e6',
                                                                         fontWeight: '600',
                                                                         color: '#495057',
                                                                         fontSize: '11px',
                                                                         width: '30%',
                                                                         wordBreak: 'break-word'
                                                                     }}>거래금액</th>
                                                                     <th style={{ 
                                                                         padding: '6px 8px', 
                                                                         textAlign: 'left', 
                                                                         borderBottom: '1px solid #dee2e6',
                                                                         fontWeight: '600',
                                                                         color: '#495057',
                                                                         fontSize: '11px',
                                                                         width: '25%',
                                                                         wordBreak: 'break-word'
                                                                     }}>전용면적(㎡)</th>
                                                                     <th style={{ 
                                                                         padding: '6px 8px', 
                                                                         textAlign: 'left', 
                                                                         borderBottom: '1px solid #dee2e6',
                                                                         fontWeight: '600',
                                                                         color: '#495057',
                                                                         fontSize: '11px',
                                                                         width: '20%',
                                                                         wordBreak: 'break-word'
                                                                     }}>층수</th>
                                                                 </tr>
                                                             </thead>
                                                             <tbody>
                                                                                                                                    {generateSampleTransactionDetails(item).map((transaction, index) => (
                                                                                                                                              <tr key={index} style={{ borderBottom: '1px solid #f1f3f4', lineHeight: '1.2' }}>
                                                                         <td style={{ 
                                                                             padding: '6px 8px', 
                                                                             color: '#495057', 
                                                                             fontSize: '11px',
                                                                             wordBreak: 'break-word',
                                                                             verticalAlign: 'top'
                                                                         }}>
                                                                             {formatDate(transaction.transaction_date)}
                                                                         </td>
                                                                         <td style={{ 
                                                                             padding: '6px 8px', 
                                                                             color: '#495057', 
                                                                             fontWeight: '500', 
                                                                             fontSize: '11px',
                                                                             wordBreak: 'break-word',
                                                                             verticalAlign: 'top'
                                                                         }}>
                                                                             {formatPrice(transaction.price)}
                                                                         </td>
                                                                         <td style={{ 
                                                                             padding: '6px 8px', 
                                                                             color: '#495057', 
                                                                             fontSize: '11px',
                                                                             wordBreak: 'break-word',
                                                                             verticalAlign: 'top'
                                                                         }}>
                                                                             {formatArea(transaction.area)}
                                                                         </td>
                                                                         <td style={{ 
                                                                             padding: '6px 8px', 
                                                                             color: '#495057', 
                                                                             fontSize: '11px',
                                                                             wordBreak: 'break-word',
                                                                             verticalAlign: 'top'
                                                                         }}>
                                                                             {transaction.floor}층
                                                                         </td>
                                                                       </tr>
                                                                 ))}
                                                             </tbody>
                                                         </table>
                                                     </div>
                                                 </div>
                                             </div>
                                         )}
                                    </td>
                                    <td className="price-cell">{formatPrice(item.avg_price)}</td>
                                    <td className="count-cell">{item.transaction_count}건</td>
                                    <td className="date-cell">{formatDate(item.latest_transaction_date)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* 상세정보 모달 */}
            {/* 상세정보 모달 제거 */}
        </div>
    );
};

export default ApartmentRankings;
