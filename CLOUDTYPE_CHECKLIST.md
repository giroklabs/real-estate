# 🚀 클라우드타입 배포 체크리스트

## 📋 사전 준비사항

### ✅ GitHub 저장소 준비
- [x] 프로젝트 코드가 GitHub에 푸시됨
- [x] main 브랜치가 최신 상태
- [x] 필요한 파일들이 모두 포함됨

### ✅ 클라우드타입 계정
- [ ] https://cloudtype.io 접속
- [ ] GitHub 계정으로 로그인
- [ ] 새 프로젝트 생성 권한 확인

## 🏗️ 프로젝트 생성

### ✅ 새 프로젝트 설정
- [ ] **New Project** 클릭
- [ ] **Python 환경** 선택
- [ ] **프로젝트 이름**: `real-estate-app`
- [ ] **Repository**: `giroklabs/real-estate`
- [ ] **Branch**: `main`

## ⚙️ 환경 변수 설정

### ✅ 필수 환경 변수
- [ ] `FLASK_APP=app.py`
- [ ] `FLASK_ENV=production`
- [ ] `PORT=5002`
- [ ] `REB_API_KEY=e1b390d074154e338da316499695b040`
- [ ] `MOLIT_API_KEY=+6+gD3OxMqe/Y7ddcg7thoXJk/m8nYqXOw7uyZEDObEo80uaT+ZjDV7P67Syrf2b5CGaPGaELTT8OIPU5YyL0A==`
- [ ] `DATA_COLLECTION_ENABLED=true`
- [ ] `LOG_LEVEL=INFO`
- [ ] `DATABASE_URL=sqlite:///realstate.db`
- [ ] `LOG_DIR=/app/logs`
- [ ] `DATA_DIR=/app/collected_data`

## 🕐 Cron 작업 설정

### ✅ 자동 데이터 수집
- [ ] **Settings** → **Cron Jobs** 메뉴
- [ ] **Schedule**: `0 1 1 * *` (매월 1일 새벽 1시)
- [ ] **Command**: `python auto_data_collector.py`
- [ ] **Description**: `Monthly Real Estate Data Collection`

## 🐳 Docker 설정

### ✅ Dockerfile 확인
- [ ] `Dockerfile.cloudtype` 파일 사용
- [ ] Python 3.11-slim 베이스 이미지
- [ ] 필요한 시스템 패키지 설치 (gcc, g++, curl, wget)
- [ ] 데이터 및 로그 디렉토리 생성
- [ ] 헬스체크 설정

## �� 볼륨 설정

### ✅ 데이터 저장 볼륨
- [ ] `/app/collected_data` - 수집된 데이터 저장
- [ ] `/app/logs` - 로그 파일 저장
- [ ] `/app/database` - SQLite 데이터베이스

## 🚀 배포 실행

### ✅ 배포 프로세스
- [ ] **Deploy** 버튼 클릭
- [ ] 빌드 진행 상황 모니터링
- [ ] 배포 완료 확인
- [ ] 애플리케이션 접속 테스트

## 🧪 배포 후 테스트

### ✅ 기능 테스트
- [ ] 메인 페이지 접속: `https://your-app.cloudtype.app`
- [ ] 헬스체크: `/api/health`
- [ ] API 엔드포인트 테스트
- [ ] 데이터 수집 수동 실행 테스트

### ✅ 데이터 수집 테스트
- [ ] 터미널에서 `python auto_data_collector.py` 실행
- [ ] 로그 확인: `/app/logs/` 디렉토리
- [ ] 수집된 데이터 확인: `/app/collected_data/` 디렉토리

## 📊 모니터링

### ✅ 로그 모니터링
- [ ] 클라우드타입 대시보드에서 로그 확인
- [ ] 에러 발생 시 즉시 알림 설정
- [ ] 데이터 수집 성공/실패 모니터링

### ✅ 성능 모니터링
- [ ] 메모리 사용량 확인
- [ ] CPU 사용량 확인
- [ ] 네트워크 트래픽 모니터링

## 🔧 문제 해결

### ✅ 일반적인 문제들
- [ ] API 키 오류 → 환경 변수 재확인
- [ ] 메모리 부족 → 데이터 수집 범위 조정
- [ ] 네트워크 타임아웃 → 재시도 로직 확인
- [ ] 권한 오류 → 파일 권한 설정 확인

## 📈 최적화

### ✅ 성능 최적화
- [ ] 데이터 수집 배치 크기 조정
- [ ] 동시 처리 스레드 수 최적화
- [ ] 로그 레벨 조정
- [ ] 불필요한 데이터 필드 제거

## 🎯 완료 체크

### ✅ 최종 확인사항
- [ ] 애플리케이션이 정상적으로 실행됨
- [ ] API 엔드포인트가 정상 작동함
- [ ] Cron 작업이 정상적으로 설정됨
- [ ] 데이터 수집이 자동으로 실행됨
- [ ] 로그가 정상적으로 생성됨

---

## 📞 지원

문제가 발생하면:
1. 클라우드타입 로그 확인
2. 한국어 지원팀 문의
3. GitHub Issues에 문제 보고

**배포 완료 후**: 매월 1일 새벽 1시에 자동으로 부동산 데이터가 수집됩니다! 🎉

