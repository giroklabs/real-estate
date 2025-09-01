# 부동산 데이터 자동 업데이트 시스템

## 📋 개요

국토교통부 실거래가 공개시스템(molit_api)에서 최신 데이터를 자동으로 수집하고 업데이트하는 시스템입니다.

## 🚀 주요 기능

- **자동 데이터 수집**: 각 지역별 최신 거래 데이터를 API에서 수집
- **매월 자동 업데이트**: 매월 1일 자정에 자동으로 데이터 업데이트
- **백업 시스템**: 업데이트 전 기존 데이터 자동 백업
- **상태 모니터링**: 각 도시별 데이터 상태 실시간 확인
- **간편한 명령어**: `./update` 명령어로 즉시 업데이트

## 📁 파일 구조

```
├── update_data.py                    # 메인 업데이트 스크립트
├── monthly_update_scheduler.py       # 매월 자동 업데이트 스케줄러
├── setup_monthly_update.sh          # 시스템 서비스 설정 스크립트
├── update                           # 간편 업데이트 명령어
└── collected_data/                  # 데이터 저장 디렉토리
    ├── seoul_all_data.json
    ├── busan_all_data.json
    ├── incheon_all_data.json
    ├── daegu_all_data.json
    ├── gwangju_all_data.json
    ├── daejeon_all_data.json
    └── ulsan_all_data.json
```

## 🛠️ 사용법

### 1. 즉시 업데이트

```bash
# 전체 도시 업데이트
./update

# 또는 Python 스크립트 직접 실행
source venv/bin/activate
python update_data.py update
```

### 2. 특정 도시만 업데이트

```bash
source venv/bin/activate
python update_data.py update seoul    # 서울만 업데이트
python update_data.py update busan    # 부산만 업데이트
```

### 3. 데이터 상태 확인

```bash
source venv/bin/activate
python update_data.py status
```

### 4. 매월 자동 업데이트 설정

```bash
# 시스템 서비스로 등록 (Linux/macOS)
sudo ./setup_monthly_update.sh

# 서비스 시작
sudo systemctl start realstate-monthly-update

# 서비스 상태 확인
sudo systemctl status realstate-monthly-update

# 로그 확인
sudo journalctl -u realstate-monthly-update -f
```

## 📊 지원 도시

| 도시 | 지역코드 | 최신 데이터 | 상태 |
|------|----------|-------------|------|
| **서울** | 11680 | 2025-08-29 | 🟢 최신 |
| **부산** | 26440 | 2025-08-29 | 🟢 최신 |
| **인천** | 28200 | 2025-08-29 | 🟢 최신 |
| **대구** | 27200 | 2025-08-28 | 🟢 최신 |
| **광주** | 29170 | 2025-08-29 | 🟢 최신 |
| **대전** | 30200 | 2025-08-30 | 🟢 최신 |
| **울산** | 31140 | 2025-08-30 | 🟢 최신 |

## 🔄 업데이트 프로세스

1. **현재 데이터 확인**: 각 도시별 최신 거래일자 확인
2. **API 데이터 수집**: 국토교통부 API에서 누락된 기간 데이터 수집
3. **데이터 병합**: 새 데이터를 기존 데이터와 병합
4. **백업 생성**: 업데이트 전 기존 데이터 자동 백업
5. **상태 업데이트**: 메타데이터 업데이트 및 로깅

## 📈 업데이트 결과 (최근 실행)

```
📊 업데이트 결과 요약:
==================================================
SEOUL     : ✅ 성공 (47건 추가)
BUSAN     : ✅ 성공 (데이터 수집됨)
INCHEON   : ✅ 성공 (178건 추가)
DAEGU     : ✅ 성공 (34건 추가)
GWANGJU   : ✅ 성공 (278건 추가)
DAEJEON   : ✅ 성공 (211건 추가)
ULSAN     : ✅ 성공 (255건 추가)
==================================================
총 7개 도시 중 7개 성공
```

## 🕐 스케줄 설정

- **매월 1일 00:00**: 전체 도시 데이터 업데이트
- **매주 월요일 09:00**: 데이터 상태 확인

## 📝 로그 파일

- **위치**: `logs/monthly_update_YYYYMM.log`
- **내용**: 업데이트 과정, 성공/실패 상태, 수집된 데이터 건수

## ⚠️ 주의사항

1. **API 제한**: 국토교통부 API 호출 제한을 고려하여 적절한 간격으로 요청
2. **백업**: 업데이트 전 자동으로 백업이 생성되지만, 중요한 데이터는 별도 백업 권장
3. **네트워크**: API 호출 시 네트워크 연결 상태 확인 필요
4. **권한**: 시스템 서비스 설정 시 관리자 권한 필요

## 🔧 문제 해결

### 업데이트 실패 시

```bash
# 로그 확인
tail -f logs/monthly_update_*.log

# 수동 업데이트 시도
python update_data.py update [도시명]

# 상태 확인
python update_data.py status
```

### 서비스 문제 시

```bash
# 서비스 재시작
sudo systemctl restart realstate-monthly-update

# 서비스 로그 확인
sudo journalctl -u realstate-monthly-update -f
```

## 📞 지원

문제가 발생하거나 추가 기능이 필요한 경우, 로그 파일과 함께 문의해주세요.

---

**마지막 업데이트**: 2025년 9월 1일  
**데이터 기준일**: 2025년 8월 30일 (국토교통부 API 최신)
