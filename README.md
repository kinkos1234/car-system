# 🚗 Comad J CAR System

**Customer Account Review System** - 고객 계정 검토 시스템

> **포트폴리오 프로젝트**: 실제 기업용 CRM 시스템을 서버리스 환경으로 마이그레이션한 데모 버전입니다.

## 📋 프로젝트 개요

이 프로젝트는 고객 관계 관리(CRM)와 VOC(Voice of Customer) 분석을 위한 통합 시스템입니다. 
기존 로컬 기반 시스템을 현대적인 서버리스 아키텍처로 전환하여 확장성과 유지보수성을 크게 개선했습니다.

## 🛠️ 기술 스택

### Frontend
- **Next.js 14** - React 기반 풀스택 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 유틸리티 퍼스트 CSS 프레임워크
- **Chart.js** - 데이터 시각화

### Backend
- **Next.js API Routes** - 서버리스 API
- **Supabase** - PostgreSQL 데이터베이스 & 인증
- **JWT** - 사용자 인증 및 권한 관리

### 배포 & 인프라
- **Vercel** - 프론트엔드 호스팅
- **Supabase Cloud** - 데이터베이스 호스팅

## ✨ 주요 기능

### 🔐 사용자 관리
- JWT 기반 인증 시스템
- 역할 기반 접근 제어 (Admin, Manager, Staff)
- 세션 관리 및 자동 로그아웃

### 📊 대시보드
- 실시간 통계 데이터 시각화
- 상태별/회사별 분포 차트
- 월별 트렌드 분석
- 최근 활동 추적

### 🚗 CAR 관리
- CAR(Customer Account Review) 생성/수정/삭제
- 고급 필터링 및 검색
- 상태 관리 (진행중, 지연, 완료)
- 점수 계산 시스템

### 👥 고객 관리
- 고객 정보 CRUD 기능
- 회사별/부서별 분류
- 연락처 및 이메일 관리
- 통계 대시보드

## 🚀 시스템 아키텍처

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │───▶│  API Routes     │───▶│   Supabase      │
│   (Frontend)    │    │  (Backend)      │    │  (Database)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   JWT Auth      │    │  PostgreSQL     │
│   (Hosting)     │    │   (Security)    │    │  (Data Store)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🎯 프로젝트 하이라이트

### 🔄 마이그레이션 성과
- **로컬 → 클라우드**: 온프레미스 시스템을 서버리스로 완전 전환
- **SQLite → PostgreSQL**: 더 강력한 데이터베이스로 업그레이드
- **Express.js → Next.js**: 모던 풀스택 프레임워크로 통합

### 🏗️ 아키텍처 개선
- **서버리스 아키텍처**: 무한 확장성과 비용 효율성
- **타입 안전성**: TypeScript로 런타임 오류 최소화
- **RESTful API**: 표준화된 API 설계

### 🎨 UX/UI 개선
- **반응형 디자인**: 모든 디바이스에서 최적화
- **다크 테마**: 현대적이고 눈에 편한 디자인
- **직관적 네비게이션**: 사용자 친화적 인터페이스

## 📈 데모 데이터

시스템에는 다음과 같은 샘플 데이터가 포함되어 있습니다:

- **사용자**: Admin, Manager, Staff 역할별 계정
- **고객사**: AutoMaker, TechSupplier 등 가상 기업
- **CAR 항목**: 다양한 상태와 점수를 가진 샘플 케이스

## 🔑 로그인 정보

```
관리자 계정:
- 이메일: admin@comadj.com
- 비밀번호: admin123

매니저 계정:
- 이메일: manager@comadj.com  
- 비밀번호: manager123

직원 계정:
- 이메일: staff@comadj.com
- 비밀번호: staff123
```

## 🚀 로컬 실행 방법

### 1. 저장소 클론
```bash
git clone https://github.com/comadj/car-system.git
cd car-system
```

### 2. 의존성 설치
```bash
cd frontend
npm install
```

### 3. 환경변수 설정
```bash
# .env.local 파일 생성
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### 4. 개발 서버 실행
```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 📝 개발 과정

### Phase 1: 분석 및 계획
- 기존 시스템 아키텍처 분석
- 서버리스 마이그레이션 전략 수립
- 기술 스택 선정

### Phase 2: 데이터 마이그레이션
- SQLite → PostgreSQL 스키마 변환
- 민감정보 더미화 및 브랜딩 변경
- 샘플 데이터 생성

### Phase 3: API 개발
- Next.js API Routes 구현
- JWT 인증 시스템 구축
- CRUD 기능 완성

### Phase 4: Frontend 개발
- React 컴포넌트 현대화
- 반응형 UI 구현
- 상태 관리 최적화

### Phase 5: 배포 및 최적화
- Vercel 배포 설정
- 성능 최적화
- 사용자 테스트

## 🎨 스크린샷

### 대시보드
![Dashboard](docs/dashboard.png)

### CAR 관리
![CAR Management](docs/car-management.png)

### 고객 관리
![Customer Management](docs/customer-management.png)

## 🤝 기여자

**Comad J** - Full Stack Developer
- 시스템 설계 및 아키텍처
- 프론트엔드 및 백엔드 개발
- 데이터베이스 설계
- UI/UX 디자인

## 📄 라이선스

이 프로젝트는 포트폴리오 목적으로 제작되었습니다.

---

⭐ **이 프로젝트가 마음에 드셨다면 Star를 눌러주세요!** 