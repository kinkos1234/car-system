# 🔄 서버리스 마이그레이션 계획

## 📋 현재 상태 vs 목표 상태

### **현재 (로컬 시스템)**
```
[SQLite] ↔ [Express.js API Server] ↔ [Next.js Frontend]
              ↕
        [OpenAI API, SendGrid]
```

### **목표 (서버리스)**
```
[Supabase PostgreSQL] ↔ [Next.js API Routes] ↔ [Next.js Frontend]
                            ↕
                    [Mock AI & Email Services]
```

---

## 🎯 마이그레이션 단계별 계획

### **Phase 1: 외부 API 목업화** ✅ (완료)
- ✅ AI 서비스 목업 (`ai.service.mock.js`)
- ✅ 메일 서비스 목업 (`email.service.mock.js`)
- ✅ 포트폴리오용 더미 데이터 준비

### **Phase 2: Supabase 설정** 🔄 (진행 중)
- 🔄 Supabase 프로젝트 생성
- 🔄 PostgreSQL 스키마 이전
- ⏳ 더미 데이터 시드

### **Phase 3: Next.js API Routes 구현**
- ⏳ Express API → Next.js API Routes 변환
- ⏳ Supabase 클라이언트 연동
- ⏳ 인증 시스템 개선

### **Phase 4: 프론트엔드 최적화**
- ⏳ API 호출 경로 업데이트
- ⏳ 환경변수 설정
- ⏳ 반응형 UI 개선

### **Phase 5: Vercel 배포**
- ⏳ GitHub Repository 준비
- ⏳ Vercel 프로젝트 설정
- ⏳ 도메인 연결 (선택사항)

---

## 📂 파일 구조 변경 계획

### **현재 구조**
```
car_smpl/
├── src/                    # Express.js 백엔드
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   └── middlewares/
├── frontend/               # Next.js 프론트엔드
│   └── src/
│       ├── app/
│       ├── components/
│       └── utils/
├── prisma/                 # SQLite 설정
└── system_documents/       # 문서
```

### **목표 구조 (서버리스)**
```
comadj-car-system/         # 새 Repository
├── src/                   # Next.js 통합 (프론트엔드 + API)
│   ├── app/              # App Router
│   │   ├── api/          # API Routes (기존 Express API 이전)
│   │   ├── dashboard/
│   │   ├── login/
│   │   └── admin/
│   ├── components/
│   ├── utils/
│   │   ├── supabase.ts   # Supabase 클라이언트
│   │   └── api.ts        # API 호출 유틸리티
│   └── services/         # Mock 서비스
│       ├── ai.service.mock.js
│       └── email.service.mock.js
├── docs/                 # 문서 (포트폴리오용)
└── README.md            # 프로젝트 소개
```

---

## 🔧 API 변환 매핑

| 기존 Express API | Next.js API Routes |
|------------------|-------------------|
| `GET /api/car` | `GET /api/car` |
| `POST /api/car` | `POST /api/car` |
| `PUT /api/car/:id` | `PUT /api/car/[id]` |
| `DELETE /api/car/:id` | `DELETE /api/car/[id]` |
| `POST /api/auth/login` | `POST /api/auth/login` |
| `GET /api/customer` | `GET /api/customer` |
| `POST /api/report/weekly/generate` | `POST /api/report/weekly/generate` |
| `GET /api/report/weekly/latest` | `GET /api/report/weekly/latest` |
| `POST /api/ai/summary` | `POST /api/ai/summary` |
| `POST /api/ai/strategy` | `POST /api/ai/strategy` |

---

## 🛠️ 기술 스택 변화

### **현재 스택**
- **Backend**: Node.js + Express.js
- **Database**: SQLite + Prisma ORM
- **Frontend**: Next.js 14
- **External APIs**: OpenAI, SendGrid
- **Deployment**: 로컬 서버

### **새로운 스택**
- **Backend**: Next.js API Routes (서버리스)
- **Database**: Supabase PostgreSQL
- **Frontend**: Next.js 14 (동일)
- **External APIs**: Mock Services (포트폴리오용)
- **Deployment**: Vercel (무료)

---

## 🎨 포트폴리오 최적화 사항

### **추가 기능**
1. **데모 계정 자동 로그인**
   - 방문자가 쉽게 시스템 체험 가능
   - "데모 체험하기" 버튼 추가

2. **실시간 데이터 시각화**
   - 차트 애니메이션 효과
   - 인터랙티브 대시보드

3. **모바일 최적화**
   - 반응형 디자인 강화
   - 터치 친화적 UI

4. **프로젝트 소개 페이지**
   - 기술 스택 설명
   - 아키텍처 다이어그램
   - GitHub 링크

### **성능 최적화**
- Next.js App Router 활용
- 이미지 최적화
- 코드 스플리팅
- SEO 최적화

---

## 🚀 다음 단계 실행 계획

### **즉시 실행 (1-2시간)**
1. Supabase 프로젝트 생성
2. 데이터베이스 스키마 설정
3. 기본 더미 데이터 삽입

### **단기 목표 (1-2일)**
1. Express API → Next.js API Routes 변환
2. Supabase 연동 완료
3. 로컬 테스트 완료

### **중기 목표 (3-5일)**
1. Vercel 배포 완료
2. 포트폴리오 기능 추가
3. 문서화 완료

---

## 📊 비용 분석

### **현재 비용**
- 로컬 서버: 전력비 + 인터넷비
- OpenAI API: 사용량에 따라 과금
- SendGrid: 월간 제한 후 과금

### **새로운 비용 (무료)**
- Supabase: 500MB DB, 50MB 파일 스토리지 무료
- Vercel: 개인 프로젝트 무료
- Mock APIs: 완전 무료

**💰 월 예상 절약액: $20-50**

---

## ✅ 성공 지표

1. **기능적 요구사항**
   - ✅ 모든 기존 기능 정상 작동
   - ✅ 데이터 무결성 유지
   - ✅ 인증/권한 시스템 정상

2. **성능 요구사항**
   - 🎯 페이지 로딩 속도 < 3초
   - 🎯 API 응답 시간 < 2초
   - 🎯 모바일 친화성 95점+

3. **포트폴리오 요구사항**
   - 🎯 GitHub 스타 10개+
   - 🎯 방문자 체험률 80%+
   - 🎯 기술 스택 어필 완료

---

**다음 단계를 진행할 준비가 되었습니다!** 🚀 