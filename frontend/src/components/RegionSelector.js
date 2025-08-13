import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RegionSelector = ({ onRegionChange, selectedRegions = [] }) => {
    const [provinces, setProvinces] = useState([]);
    const [selectedProvince, setSelectedProvince] = useState('');
    const [districts, setDistricts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProvinces();
    }, []);

    useEffect(() => {
        if (selectedProvince) {
            // 경기도인 경우 성남시 구별 데이터를 제외하고 가져옴
            if (selectedProvince === '경기도') {
                fetchDistrictsForGyeonggi();
            } else {
                fetchDistricts(selectedProvince);
            }
        } else {
            setDistricts([]);
        }
    }, [selectedProvince]);

    const fetchProvinces = async () => {
        try {
            const response = await axios.get('/api/provinces');
            setProvinces(response.data);
        } catch (error) {
            console.error('광역시/도 목록 조회 실패:', error);
        }
    };

    const fetchDistricts = async (provinceName) => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/provinces/${encodeURIComponent(provinceName)}/districts`);
            setDistricts(response.data);
        } catch (error) {
            console.error('구/군 목록 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 경기도용 특별 처리 - 성남시는 전체만 표시
    const fetchDistrictsForGyeonggi = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/api/provinces/${encodeURIComponent('경기도')}/districts`);
            // 성남시 구별 데이터는 제외하고, 성남시 전체만 표시
            const filteredDistricts = response.data.filter(district => 
                district.district !== '성남시 분당구' && 
                district.district !== '성남시 수정구' && 
                district.district !== '성남시 중원구'
            );
            setDistricts(filteredDistricts);
        } catch (error) {
            console.error('경기도 구/군 목록 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegionToggle = (regionName) => {
        let newSelectedRegions;
        if (selectedRegions.includes(regionName)) {
            newSelectedRegions = selectedRegions.filter(r => r !== regionName);
        } else {
            newSelectedRegions = [...selectedRegions, regionName];
        }
        onRegionChange(newSelectedRegions);
    };

    const handleSelectAll = () => {
        const allDistrictNames = districts.map(d => d.name);
        onRegionChange([...new Set([...selectedRegions, ...allDistrictNames])]);
    };

    const handleClearAll = () => {
        const provincialRegions = selectedRegions.filter(region => {
            return !districts.some(d => d.name === region);
        });
        onRegionChange(provincialRegions);
    };

    // 성남시 전체 선택 핸들러
    const handleSeongnamSelect = () => {
        if (selectedRegions.includes('성남시')) {
            // 이미 선택된 경우 제거
            onRegionChange(selectedRegions.filter(r => r !== '성남시'));
        } else {
            // 선택되지 않은 경우 추가
            onRegionChange([...selectedRegions, '성남시']);
        }
    };

    return (
        <div className="region-selector">
            <div className="region-selector-header">
                <h3>🏠 지역 선택</h3>
                <div className="selected-count">
                    선택된 지역: {selectedRegions.length}개
                </div>
            </div>

            <div className="province-selector">
                <label>광역시/도 선택:</label>
                <select 
                    value={selectedProvince} 
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="province-select"
                >
                    <option value="">-- 광역시/도를 선택하세요 --</option>
                    {provinces.map(province => (
                        <option key={province} value={province}>{province}</option>
                    ))}
                </select>
            </div>

            {/* 성남시 선택 옵션 - 구별 선택 없이 전체만 */}
            {selectedProvince === '경기도' && (
                <div className="seongnam-selector">
                    <div className="district-header">
                        <label>성남시 (구별 선택 불가):</label>
                    </div>
                    <div className="district-list">
                        <label className="district-item">
                            <input
                                type="checkbox"
                                checked={selectedRegions.includes('성남시')}
                                onChange={handleSeongnamSelect}
                            />
                            <span className="district-name">성남시 전체</span>
                            <span className="district-note">(분당구, 수정구, 중원구 통합)</span>
                        </label>
                    </div>
                </div>
            )}

            {/* 다른 지역들의 구별 선택 (경기도 제외) */}
            {selectedProvince && selectedProvince !== '경기도' && (
                <div className="district-selector">
                    <div className="district-header">
                        <label>{selectedProvince} 구/군:</label>
                        <div className="district-controls">
                            <button 
                                onClick={handleSelectAll}
                                className="select-all-btn"
                                disabled={loading}
                            >
                                전체 선택
                            </button>
                            <button 
                                onClick={handleClearAll}
                                className="clear-all-btn"
                                disabled={loading}
                            >
                                선택 해제
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading">구/군 목록을 불러오는 중...</div>
                    ) : (
                        <div className="district-list">
                            {districts.map(district => (
                                <label key={district.code} className="district-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedRegions.includes(district.name)}
                                        onChange={() => handleRegionToggle(district.name)}
                                    />
                                    <span className="district-name">{district.district}</span>
                                    <span className="district-code">({district.code})</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 경기도의 다른 지역들 (성남시 제외) */}
            {selectedProvince === '경기도' && districts.length > 0 && (
                <div className="district-selector">
                    <div className="district-header">
                        <label>경기도 기타 지역:</label>
                        <div className="district-controls">
                            <button 
                                onClick={handleSelectAll}
                                className="select-all-btn"
                                disabled={loading}
                            >
                                전체 선택
                            </button>
                            <button 
                                onClick={handleClearAll}
                                className="clear-all-btn"
                                disabled={loading}
                            >
                                선택 해제
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading">구/군 목록을 불러오는 중...</div>
                    ) : (
                        <div className="district-list">
                            {districts.map(district => (
                                <label key={district.code} className="district-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedRegions.includes(district.name)}
                                        onChange={() => handleRegionToggle(district.name)}
                                    />
                                    <span className="district-name">{district.district}</span>
                                    <span className="district-code">({district.code})</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedRegions.length > 0 && (
                <div className="selected-regions">
                    <h4>선택된 지역:</h4>
                    <div className="selected-list">
                        {selectedRegions.map(region => (
                            <div key={region} className="selected-item">
                                <span>{region}</span>
                                <button 
                                    onClick={() => handleRegionToggle(region)}
                                    className="remove-btn"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegionSelector;
