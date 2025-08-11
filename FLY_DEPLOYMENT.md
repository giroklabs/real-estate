# Fly.io 배포 가이드

이 문서는 한국 부동산 데이터 분석 웹사이트를 Fly.io에 배포하는 방법을 설명합니다.

## 사전 준비사항

### 1. Fly.io 계정 생성
- [Fly.io](https://fly.io)에 가입
- 신용카드 정보 등록 (무료 티어: 3개 앱, 월 3GB 저장공간)

### 2. Fly CLI 설치
```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### 3. 로그인
```bash
fly auth login
```

## 자동 배포 (권장)

### 1. 배포 스크립트 실행
```bash
chmod +x deploy.sh
./deploy.sh
```

스크립트가 자동으로 다음 작업을 수행합니다:
- Fly CLI 설치 확인
- 로그인 상태 확인
- 앱 생성 (최초 1회)
- 볼륨 생성 (최초 1회)
- 환경 변수 설정
- 배포 실행

## 수동 배포

### 1. 앱 생성
```bash
fly apps create realstate-app --org personal
```

### 2. 볼륨 생성 (데이터 저장용)
```bash
fly volumes create realstate_data --size 10 --region nrt
```

### 3. 환경 변수 설정
```bash
# API 키들을 secrets로 설정
fly secrets set MOBILE_API_KEY="your_mobile_api_key"
fly secrets set MOBILE_API_SECRET="your_mobile_api_secret"
fly secrets set REB_API_KEY="your_reb_api_key"

# 일반 환경 변수 설정
fly secrets set FLASK_ENV="production"
fly secrets set DATABASE_URL="sqlite:///realstate.db"
```

### 4. 배포
```bash
fly deploy
```

## GitHub Actions 자동 배포

### 1. FLY_API_TOKEN 생성
```bash
fly tokens create deploy
```

### 2. GitHub Secrets 설정
GitHub 저장소 → Settings → Secrets and variables → Actions에서:

- `FLY_API_TOKEN`: 위에서 생성한 토큰

### 3. 자동 배포 활성화
`main` 브랜치에 푸시하면 자동으로 배포됩니다.

## 배포 후 확인

### 1. 앱 상태 확인
```bash
fly status
```

### 2. 로그 확인
```bash
fly logs
```

### 3. 앱 URL 확인
```bash
fly open
```

## 문제 해결

### 1. 배포 실패 시
```bash
# 로그 확인
fly logs

# 앱 재시작
fly restart

# 앱 삭제 후 재생성
fly apps destroy realstate-app
fly apps create realstate-app --org personal
```

### 2. 볼륨 문제
```bash
# 볼륨 상태 확인
fly volumes list

# 볼륨 재생성
fly volumes destroy realstate_data
fly volumes create realstate_data --size 10 --region nrt
```

### 3. 환경 변수 문제
```bash
# 현재 secrets 확인
fly secrets list

# secrets 재설정
fly secrets unset MOBILE_API_KEY
fly secrets set MOBILE_API_KEY="new_key"
```

## 모니터링 및 유지보수

### 1. 정기적인 확인사항
- 앱 상태: `fly status`
- 로그: `fly logs`
- 리소스 사용량: `fly status --all`

### 2. 업데이트 배포
```bash
# 코드 변경 후
git add .
git commit -m "Update: description"
git push origin main

# GitHub Actions가 자동으로 배포
```

### 3. 앱 스케일링
```bash
# 메모리 증가
fly scale memory 2048

# CPU 증가
fly scale cpu 2
```

## 비용 최적화

### 1. 무료 티어 제한
- 앱: 3개
- 저장공간: 3GB
- 네트워크: 160GB/월

### 2. 비용 절약 팁
- `auto_stop_machines = true` 설정 유지
- 불필요한 볼륨 삭제
- 사용하지 않는 앱 정리

## 보안 고려사항

### 1. API 키 보호
- 절대 코드에 하드코딩하지 마세요
- `fly secrets` 사용
- GitHub Secrets 활용

### 2. 네트워크 보안
- `force_https = true` 설정 유지
- 필요한 포트만 노출

## 지원 및 문서

- [Fly.io 공식 문서](https://fly.io/docs/)
- [Fly.io Discord](https://fly.io/discord)
- [GitHub Issues](https://github.com/your-repo/issues)
