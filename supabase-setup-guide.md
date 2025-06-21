# 🚀 Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

### 1-1. Supabase 계정 생성 및 프로젝트 설정
1. [Supabase](https://supabase.com)에 접속하여 계정 생성
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - **Project Name**: `comadj-car-system`
   - **Database Password**: 강력한 비밀번호 설정 (기록 필수!)
   - **Region**: `Southeast Asia (Singapore)`
4. 프로젝트 생성 완료 (약 2분 소요)

### 1-2. 프로젝트 정보 확인
프로젝트 생성 후 `Settings` > `API`에서 다음 정보 확인:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon (public) key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **service_role (secret) key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 2. 데이터베이스 스키마 설정

### 2-1. SQL Editor에서 스키마 생성
Supabase Dashboard > `SQL Editor`에서 다음 스크립트 실행:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'STAFF');
CREATE TYPE event_type AS ENUM ('ONE_TIME', 'CONTINUOUS');
CREATE TYPE reception_channel AS ENUM ('EMAIL', 'CALL', 'VISIT', 'OTHER');

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    login_id VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    weekly_report_email BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer contacts table
CREATE TABLE customer_contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    "group" VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    department VARCHAR(255) NOT NULL,
    phone VARCHAR(255) NOT NULL,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CAR table
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    corporation VARCHAR(255) NOT NULL,
    event_type event_type NOT NULL,
    issue_date BIGINT NOT NULL,
    due_date BIGINT,
    importance FLOAT NOT NULL,
    internal_contact VARCHAR(255),
    reception_channel VARCHAR(255),
    main_category VARCHAR(255),
    open_issue TEXT,
    follow_up_plan TEXT,
    completion_date BIGINT,
    internal_score FLOAT,
    customer_score FLOAT,
    subjective_score FLOAT,
    score FLOAT,
    sentiment_score FLOAT,
    ai_keywords TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER NOT NULL REFERENCES users(id)
);

-- Score history table
CREATE TABLE score_histories (
    id SERIAL PRIMARY KEY,
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    score_type VARCHAR(255) NOT NULL,
    value FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly reports table
CREATE TABLE weekly_reports (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    week_start TIMESTAMP WITH TIME ZONE NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Management emails table
CREATE TABLE management_emails (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL
);

-- Car customer contact relationship table
CREATE TABLE car_customer_contacts (
    car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
    customer_contact_id INTEGER NOT NULL REFERENCES customer_contacts(id) ON DELETE CASCADE,
    PRIMARY KEY (car_id, customer_contact_id)
);

-- Create indexes for performance
CREATE INDEX idx_cars_corporation ON cars(corporation);
CREATE INDEX idx_cars_created_at ON cars(created_at);
CREATE INDEX idx_cars_issue_date ON cars(issue_date);
CREATE INDEX idx_customer_contacts_group ON customer_contacts("group");
CREATE INDEX idx_weekly_reports_week_start ON weekly_reports(week_start);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE management_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_customer_contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (기본적으로 인증된 사용자에게 모든 권한 부여)
CREATE POLICY "Enable all for authenticated users" ON users FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON cars FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON customer_contacts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON score_histories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON weekly_reports FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON management_emails FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users" ON car_customer_contacts FOR ALL USING (auth.role() = 'authenticated');
```

### 2-2. 초기 데이터 삽입
```sql
-- Insert admin user
INSERT INTO users (id, login_id, password, role, name, department, email, weekly_report_email) 
VALUES (1, 'admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'ADMIN', 'Comad J', '기술영업', 'admin@comadj.com', true);

-- Insert sample customer contacts
INSERT INTO customer_contacts (name, "group", company, department, phone, memo) VALUES
('John Smith', 'AutoMaker', 'AutoMaker Corp', 'Purchasing', '+1-555-0001', 'Primary contact'),
('Sarah Johnson', 'AutoMaker', 'AutoMaker Corp', 'Quality', '+1-555-0002', 'Quality manager'),
('Mike Wilson', 'TechSupplier', 'Tech Supplier Inc', 'Engineering', '+1-555-0003', 'Technical lead'),
('Emily Davis', 'TechSupplier', 'Tech Supplier Inc', 'Project Management', '+1-555-0004', 'PM lead');

-- Insert sample management emails
INSERT INTO management_emails (email) VALUES 
('admin@comadj.com'),
('manager@comadj.com');
```

---

## 3. 환경변수 설정

### 3-1. Frontend 환경변수 (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API Base URL (for local development)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3-2. Backend 환경변수 (.env)
```env
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres

# JWT Secret (from Supabase settings)
JWT_SECRET=your-jwt-secret

# Mock Mode (for portfolio)
USE_MOCK_APIS=true

# Legacy (will be removed)
PORT=3000
NODE_ENV=production
```

---

## 4. Next.js API Routes 설정

Supabase 연동을 위한 클라이언트 설정:

### 4-1. Supabase 클라이언트 설정
```bash
cd frontend
npm install @supabase/supabase-js
```

### 4-2. utils/supabase.ts 생성
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 5. 배포 설정 (Vercel)

### 5-1. Vercel 프로젝트 생성
1. [Vercel](https://vercel.com)에 GitHub 연동
2. Repository import
3. Framework Preset: `Next.js`
4. Root Directory: `frontend`

### 5-2. Vercel 환경변수 설정
Vercel Dashboard > Settings > Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

---

## 6. 배포 후 확인사항

1. **데이터베이스 연결 확인**
2. **인증 시스템 테스트**
3. **API Routes 동작 확인**
4. **목업 서비스 작동 확인**

---

## 🎯 완료 후 결과

- ✅ 무료 PostgreSQL 데이터베이스 (Supabase)
- ✅ 서버리스 백엔드 (Next.js API Routes)  
- ✅ 무료 배포 (Vercel)
- ✅ 외부 API 목업화 (비용 절약)
- ✅ 포트폴리오 준비 완료 