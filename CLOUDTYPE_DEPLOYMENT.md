# ☁️ Cloudtype 배포 가이드

## 🎯 Cloudtype 선택 이유

### 장점
- **한국 서버**: 빠른 네트워크 속도
- **Python 지원**: Flask 앱 완벽 실행
- **Cron 작업**: 자동 스케줄링 내장
- **데이터베이스**: MySQL/PostgreSQL 제공
- **무료 플랜**: 개발 및 테스트용
- **한국어 지원**: 기술 지원 편리

### 현재 프로젝트와의 호환성
- ✅ Flask 백엔드 실행
- ✅ Python 크롤러 실행
- ✅ 자동화 스크립트 실행
- ✅ Gzip 압축 지원
- ✅ 데이터 저장 및 관리

## 🚀 배포 단계

### 1단계: Cloudtype 계정 설정
1. [Cloudtype](https://cloudtype.io) 접속
2. GitHub 계정으로 로그인
3. 새 프로젝트 생성
4. Python 환경 선택

### 2단계: Git 저장소 연결
```bash
# GitHub 저장소 연결
Repository: giroklabs/real-estate
Branch: main
```

### 3단계: 환경 변수 설정
```bash
# Cloudtype 대시보드에서 설정
FLASK_APP=app.py
FLASK_ENV=production
PORT=5002
REB_API_KEY=your_api_key
MOBILE_API_KEY=your_api_key
MOBILE_API_SECRET=your_secret
```

### 4단계: 빌드 설정
```toml
# cloudtype.toml
[build]
builder = "python"
buildCommand = "pip install -r requirements.txt"

[deploy]
startCommand = "python app.py"
port = 5002
```

### 5단계: Cron 작업 설정
```toml
[cron]
# 매월 1일 새벽 1시 자동 데이터 수집
schedule = "0 1 1 * *"
command = "python auto_data_collector.py"
```

### 6단계: 볼륨 설정
```toml
[volumes]
# 데이터 저장용 볼륨
data = "/app/collected_data"
```

## 📊 배포 후 자동화 흐름

```
매월 1일 새벽 1시
    ↓
Cloudtype Cron 작업 실행
    ↓
자동 데이터 수집 시작
    ↓
각 도시별 최신 거래 데이터 수집
    ↓
데이터베이스에 자동 저장
    ↓
통합 데이터 파일 자동 생성
    ↓
Gzip 압축 자동 적용
    ↓
웹사이트에 자동 반영
```

## 🔧 환경별 설정 비교

### 로컬 개발 환경
```bash
# 백엔드
python app.py  # localhost:5002

# 프론트엔드
cd frontend && npm start  # localhost:3000

# 자동화
./setup_cron.sh  # 로컬 cron
```

### Cloudtype 프로덕션 환경
```bash
# 백엔드
https://your-app.cloudtype.io  # 자동 배포

# 프론트엔드
정적 파일로 빌드하여 배포

# 자동화
Cloudtype Cron 작업 (매월 1일)
```

## 💰 비용 비교

### 로컬 환경
- **서버 비용**: 0원 (PC 사용)
- **전기료**: 월 10,000원 (추정)
- **유지보수**: 수동 관리 필요
- **가용성**: PC 켜져 있을 때만

### Cloudtype 환경
- **무료 플랜**: 월 0원
- **프로 플랜**: 월 29,000원 (필요시)
- **유지보수**: 자동 관리
- **가용성**: 24/7 운영

## 🎯 Cloudtype 배포의 장점

### 1. 자동화 완성
```
✅ 매월 1일 자동 데이터 수집
✅ PC를 끄고 있어도 실행
✅ 실패 시 자동 재시도
✅ 로그 자동 관리
```

### 2. 성능 최적화
```
✅ 한국 서버로 빠른 응답
✅ Gzip 압축 자동 지원
✅ CDN으로 빠른 전송
✅ 자동 스케일링
```

### 3. 관리 편의성
```
✅ Git 연동으로 자동 배포
✅ 웹 대시보드로 모니터링
✅ 로그 실시간 확인
✅ 백업 및 복구 자동화
```

## ⚠️ 주의사항

### 1. API 키 관리
- 환경 변수로 안전하게 설정
- 민감한 정보는 절대 코드에 포함하지 않음

### 2. 데이터 저장
- Cloudtype 볼륨 사용으로 데이터 영속성 보장
- 정기적인 백업 권장

### 3. 리소스 제한
- 무료 플랜의 제한사항 확인
- 필요시 프로 플랜으로 업그레이드

## 🚀 다음 단계

### 즉시 실행 가능
1. **Cloudtype 계정 생성**
2. **Git 저장소 연결**
3. **자동 배포 테스트**

### 추가 최적화
1. **데이터베이스 연동**
2. **모니터링 시스템 구축**
3. **알림 시스템 추가**

## 📞 지원

- **Cloudtype 공식 문서**: https://docs.cloudtype.io
- **한국어 지원**: 기술 지원팀 연락 가능
- **커뮤니티**: 개발자 포럼 및 가이드

---

**Cloudtype으로 배포하면 매월 1일 새벽 1시에 자동으로 데이터를 수집하여 24/7 운영이 가능해집니다!** 🎉


