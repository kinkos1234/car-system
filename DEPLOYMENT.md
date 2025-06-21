# 🚀 Vercel 배포 가이드

이 문서는 **Comad J CAR System**을 Vercel에 배포하는 방법을 설명합니다.

## 📋 사전 준비사항

1. **GitHub 계정** - 코드 저장소
2. **Vercel 계정** - 무료 호스팅 서비스
3. **Supabase 계정** - 이미 설정 완료

## 🔧 배포 단계

### 1. GitHub 저장소 생성

```bash
# 1. GitHub에서 새 저장소 생성 (예: car-system)
# 2. 로컬 프로젝트를 GitHub에 푸시

cd car_smpl
git init
git add .
git commit -m "Initial commit: Comad J CAR System"
git branch -M main
git remote add origin https://github.com/your-username/car-system.git
git push -u origin main
```

### 2. Vercel 프로젝트 생성

1. **Vercel 웹사이트 접속**: https://vercel.com
2. **GitHub 계정으로 로그인**
3. **"New Project" 클릭**
4. **GitHub 저장소 선택**: `car-system` 선택
5. **프로젝트 설정**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. 환경변수 설정

Vercel 대시보드에서 **Settings > Environment Variables**에 다음 변수들을 추가:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://prqnogpoggsuasljldjd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycW5vZ3BvZ2dzdWFzbGpsZGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0ODg5MjMsImV4cCI6MjA2NjA2NDkyM30.hTQs_fEXgNWBuHAIuSLT9MRfonontq5TFFNNKUJfhrg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBycW5vZ3BvZ2dzdWFzbGpsZGpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ4ODkyMywiZXhwIjoyMDY2MDY0OTIzfQ.qeblQvlp6X04W8SXkjLO35qt8mGammeVQzUpLXcYX-M

# JWT 설정
JWT_SECRET=comadj-car-system-jwt-secret-2025
```

### 4. 배포 실행

1. **Deploy 버튼 클릭**
2. **빌드 과정 확인**
3. **배포 완료 후 URL 확인**

## 🎯 배포 후 확인사항

### 기능 테스트

1. **로그인 테스트**:
   ```
   관리자: admin@comadj.com / admin123
   매니저: manager@comadj.com / manager123
   직원: staff@comadj.com / staff123
   ```

2. **주요 기능 확인**:
   - ✅ 대시보드 차트 표시
   - ✅ CAR 목록 조회 및 생성
   - ✅ Customer 목록 조회 및 생성
   - ✅ 권한별 메뉴 접근

### 성능 확인

- **Lighthouse 점수**: 90+ 목표
- **First Contentful Paint**: 2초 이내
- **페이지 로딩 속도**: 3초 이내

## 🔧 문제 해결

### 자주 발생하는 문제

1. **환경변수 오류**
   - Vercel 대시보드에서 환경변수 재확인
   - 재배포 실행

2. **Supabase 연결 오류**
   - Supabase 프로젝트 상태 확인
   - API 키 유효성 검증

3. **빌드 실패**
   - 로컬에서 `npm run build` 테스트
   - 의존성 버전 확인

### 로그 확인

```bash
# Vercel CLI 설치 (선택사항)
npm i -g vercel

# 로그 확인
vercel logs
```

## 📈 성능 최적화

### 권장 설정

1. **이미지 최적화**: Next.js Image 컴포넌트 사용
2. **코드 분할**: 동적 import 활용
3. **캐싱**: Vercel Edge Network 활용

### 모니터링

- **Vercel Analytics**: 사용자 트래픽 분석
- **Vercel Speed Insights**: 성능 메트릭 추적

## 🎨 커스텀 도메인 (선택사항)

1. **도메인 구매**: Namecheap, GoDaddy 등
2. **Vercel에서 도메인 연결**:
   - Settings > Domains
   - 커스텀 도메인 추가
   - DNS 설정 업데이트

## 🚀 CI/CD 자동화

GitHub에 코드 푸시 시 자동 배포:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📞 지원

배포 과정에서 문제가 발생하면:

1. **Vercel 문서**: https://vercel.com/docs
2. **Supabase 문서**: https://supabase.com/docs
3. **GitHub Issues**: 프로젝트 저장소에서 이슈 생성

---

🎉 **배포 완료 후 포트폴리오로 활용하세요!** 