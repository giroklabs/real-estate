# GitHub Actions를 사용한 자동 데이터 수집

## 개요
이 프로젝트는 GitHub Actions를 사용하여 매일 새벽 1시(UTC)에 서울시, 인천시, 부산시의 부동산 거래 데이터를 자동으로 수집합니다.

## 장점
- ✅ **PC가 꺼져 있어도 실행**: GitHub에서 자동 실행
- ✅ **완전 무료**: GitHub Actions 무료 할당량 사용
- ✅ **24/7 가동**: 서버 상태와 무관하게 실행
- ✅ **자동 커밋**: 수집된 데이터를 자동으로 저장소에 커밋
- ✅ **수동 실행**: 필요시 언제든지 수동으로 실행 가능

## 실행 시간
- **자동 실행**: 매일 새벽 1시 (UTC)
- **한국 시간**: 매일 새벽 10시
- **수동 실행**: 언제든지 GitHub 저장소에서 실행 가능

## 파일 구조
```
.github/
└── workflows/
    └── daily-data-collection.yml    # GitHub Actions 워크플로우
github_actions_collector.py           # GitHub Actions용 데이터 수집 스크립트
auto_data_collector.py               # 로컬용 데이터 수집 스크립트
```

## 작동 방식

### 1. 자동 실행
1. GitHub Actions가 매일 새벽 1시(UTC)에 자동으로 실행
2. Ubuntu 환경에서 Python 3.9 설정
3. 필요한 의존성 설치 (`requirements.txt`)
4. 서울시, 인천시, 부산시 데이터 수집
5. 수집된 데이터를 저장소에 자동 커밋
6. 데이터를 아티팩트로 업로드 (30일간 보관)

### 2. 수동 실행
1. GitHub 저장소 → Actions 탭
2. "Daily Real Estate Data Collection" 워크플로우 선택
3. "Run workflow" 버튼 클릭
4. 수집할 도시 선택 (all, seoul, busan, incheon)
5. "Run workflow" 클릭하여 실행

## 수집되는 데이터

### 서울시 (25개 구)
- 강남구, 강동구, 강북구, 강서구, 관악구
- 광진구, 구로구, 금천구, 노원구, 도봉구
- 동대문구, 동작구, 마포구, 서대문구, 서초구
- 성동구, 성북구, 송파구, 양천구, 영등포구
- 용산구, 은평구, 종로구, 중구, 중랑구

### 부산시 (16개 구)
- 강서구, 금정구, 기장군, 남구, 동구
- 동래구, 부산진구, 북구, 사상구, 사하구
- 서구, 수영구, 연제구, 영도구, 중구, 해운대구

### 인천시 (10개 구)
- 강화군, 계양구, 남동구, 동구, 미추홀구
- 부평구, 서구, 연수구, 옹진군, 중구

## 데이터 저장 위치
- **개별 지역**: `collected_data/지역명_data.json`
- **통합 데이터**: `collected_data/busan_incheon_seoul_all_data.json`
- **수집 요약**: `collected_data/collection_summary.json`
- **로그 파일**: `logs/github_actions_YYYYMMDD.log`

## 모니터링

### GitHub Actions 실행 상태 확인
1. GitHub 저장소 → Actions 탭
2. "Daily Real Estate Data Collection" 워크플로우 클릭
3. 실행 이력 및 상태 확인

### 로그 확인
- GitHub Actions 실행 로그: Actions 탭에서 확인
- 상세 로그: `logs/` 디렉토리의 로그 파일

## 문제 해결

### 일반적인 문제들
1. **의존성 설치 실패**: `requirements.txt` 확인
2. **API 호출 실패**: Molit API 상태 확인
3. **권한 문제**: GitHub 저장소 권한 확인

### 디버깅
- GitHub Actions 실행 로그에서 오류 메시지 확인
- 로컬에서 `github_actions_collector.py` 실행하여 테스트

## 설정 변경

### 실행 시간 변경
`.github/workflows/daily-data-collection.yml` 파일에서 cron 설정 수정:
```yaml
schedule:
  - cron: '0 1 * * *'  # 매일 새벽 1시 (UTC)
```

### 수집 지역 변경
`github_actions_collector.py` 파일의 `regions_to_collect` 딕셔너리 수정

### 데이터 보관 기간 변경
워크플로우 파일의 `retention-days` 값 수정

## 주의사항
- GitHub Actions 무료 할당량: 월 2,000분
- 데이터 수집에 약 10-15분 소요
- 매일 실행 시 월 약 450분 사용
- 무료 할당량 내에서 충분히 사용 가능

## 로컬 실행과의 차이점
| 구분 | 로컬 실행 | GitHub Actions |
|------|-----------|----------------|
| 실행 환경 | 로컬 PC | GitHub Ubuntu |
| PC 상태 | 켜져 있어야 함 | PC 상태와 무관 |
| 비용 | 무료 | 무료 (GitHub) |
| 안정성 | PC 상태에 의존 | 높음 |
| 모니터링 | 로컬 로그 | GitHub Actions |

## 결론
GitHub Actions를 사용하면 PC가 꺼져 있어도 매일 자동으로 최신 부동산 데이터를 수집할 수 있습니다. 완전 무료이며 안정적이므로 프로덕션 환경에 적합합니다.
