# 🚀 클라우드타입 배포 가이드

## 📋 **현재 설정 상태**

### **✅ 수정된 파일들**
- `frontend/Dockerfile.frontend` - 경로 문제 해결
- `frontend/cloudtype.yaml` - 클라우드타입 설정 파일
- `test-docker-build.sh` - Docker 빌드 테스트 스크립트

## 🔧 **Dockerfile 경로 문제 해결**

### **이전 문제점:**
```dockerfile
# ❌ 잘못된 경로 (루트 컨텍스트에서 빌드)
COPY frontend/package*.json ./
COPY frontend/ ./
```

### **수정된 경로:**
```dockerfile
# ✅ 올바른 경로 (frontend 컨텍스트에서 빌드)
COPY package*.json ./
COPY . .
```

## 🐳 **Docker 빌드 방법**

### **방법 1: 스크립트 사용 (권장)**
```bash
./test-docker-build.sh
```

### **방법 2: 수동 빌드**
```bash
cd frontend
docker build -f Dockerfile.frontend -t real-estate-frontend:test .
```

### **방법 3: 루트에서 빌드 (기존 방식)**
```bash
docker build -f frontend/Dockerfile.frontend -t real-estate-frontend:test .
```

## ☁️ **클라우드타입 배포 설정**

### **1. cloudtype.yaml 설정**
```yaml
services:
  - name: real-estate-frontend
    source:
      type: git
      repository: https://github.com/greego86/real-estate.git
      branch: main
      path: frontend  # ✅ 중요: frontend 디렉토리 지정
    build:
      dockerfile: Dockerfile.frontend
      context: frontend  # ✅ 중요: 빌드 컨텍스트 지정
```

### **2. 환경 변수 설정**
- `REACT_APP_API_URL`: 백엔드 API URL
- `PORT`: 서비스 포트 (기본값: 3000)

### **3. 리소스 설정**
- CPU: 0.5 코어
- 메모리: 512MB
- 스케일링: 1-3개 인스턴스

## 🚀 **배포 단계**

### **1단계: 로컬 테스트**
```bash
# Docker 빌드 테스트
./test-docker-build.sh

# 컨테이너 실행 테스트
docker run -p 3000:3000 real-estate-frontend:test
```

### **2단계: GitHub 푸시**
```bash
git add .
git commit -m "Fix Dockerfile paths for Cloudtype deployment"
git push origin main
```

### **3단계: 클라우드타입 배포**
1. 클라우드타입 대시보드 접속
2. 새 서비스 생성
3. GitHub 저장소 연결
4. `frontend` 디렉토리 선택
5. 환경 변수 설정
6. 배포 실행

## 🔍 **문제 해결**

### **빌드 실패 시 확인사항:**
1. **경로 문제**: `frontend/` 접두사 제거 확인
2. **컨텍스트**: 빌드 컨텍스트가 `frontend` 디렉토리인지 확인
3. **파일 존재**: `package.json`, `Dockerfile.frontend` 존재 확인

### **배포 실패 시 확인사항:**
1. **GitHub 연동**: 저장소 접근 권한 확인
2. **브랜치**: `main` 브랜치에 최신 코드가 있는지 확인
3. **환경 변수**: `REACT_APP_API_URL` 설정 확인

## 📊 **성능 최적화**

### **Docker 빌드 최적화:**
- ✅ 멀티 스테이지 빌드
- ✅ 레이어 캐싱 (package.json 먼저 복사)
- ✅ 프로덕션 의존성만 설치

### **런타임 최적화:**
- ✅ 정적 파일 서빙 (serve)
- ✅ 환경 변수 기반 설정
- ✅ 포트 동적 할당

## 🎯 **다음 단계**

1. **로컬 Docker 빌드 테스트**
2. **GitHub에 코드 푸시**
3. **클라우드타입에서 서비스 생성**
4. **환경 변수 설정**
5. **배포 및 테스트**

---

**개발팀**: GIROK Labs.  
**최종 수정일**: 2025년 1월  
**버전**: v1.1.0
