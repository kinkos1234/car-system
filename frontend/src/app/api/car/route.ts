import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development'

// JWT 토큰 검증 함수
function verifyToken(authHeader: string | null) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}

// GET - CAR 목록 조회
export async function GET(request: NextRequest) {
  try {
    console.log('=== CAR API GET 요청 시작 ===')
    
    const authHeader = request.headers.get('authorization')
    const user = verifyToken(authHeader)

    if (!user) {
      console.log('❌ 인증 실패')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ 인증 성공:', user.email)

    // 환경변수 확인
    console.log('환경변수 확인:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '❌ 없음')
    console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '설정됨' : '❌ 없음')

    const supabase = createServiceClient()
    console.log('✅ Supabase 클라이언트 생성 완료')
    
    const { searchParams } = new URL(request.url)
    
    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    console.log('쿼리 파라미터:', { page, limit, offset })

    // 검색 파라미터
    const search = searchParams.get('search')
    const corporation = searchParams.get('corporation')
    const status = searchParams.get('status')

    // 먼저 간단한 쿼리로 테스트 (Supabase 문법에 맞게 수정)
    console.log('🔍 테이블 존재 확인 중...')
    const { data: testData, error: testError } = await supabase
      .from('cars')
      .select('id')
      .limit(1)

    if (testError) {
      console.error('❌ 테이블 접근 오류:', testError)
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: testError.message,
          code: testError.code 
        },
        { status: 500 }
      )
    }

    console.log('✅ cars 테이블 접근 성공')

    // 임시로 관계 쿼리 제거하고 기본 데이터만 조회
    let query = supabase
      .from('cars')
      .select('*')

    // 필터 적용
    if (search) {
      query = query.or(`car_number.ilike.%${search}%,car_model.ilike.%${search}%`)
    }
    if (corporation) {
      query = query.eq('corporation', corporation)
    }
    if (status) {
      query = query.eq('status', status)
    }

    console.log('🔍 메인 쿼리 실행 중...')

    // 페이지네이션과 정렬
    const { data: cars, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ 메인 쿼리 오류:', error)
      return NextResponse.json(
        { 
          error: 'Database query error',
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      )
    }

    console.log('✅ 메인 쿼리 성공, 결과 개수:', cars?.length || 0)

    // 총 개수 조회
    const { count: totalCount, error: countError } = await supabase
      .from('cars')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ 카운트 쿼리 오류:', countError)
      // 카운트 오류는 무시하고 진행
    }

    console.log('✅ 전체 응답 준비 완료')

    return NextResponse.json({
      cars: cars || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('❌ 예외 발생:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - CAR 생성
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = verifyToken(authHeader)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      car_number,
      car_model,
      corporation,
      customer_id,
      customer_contact,
      status = 'ACTIVE'
    } = body

    console.log('📝 받은 데이터:', body)

    const supabase = createServiceClient()

    // 먼저 테이블 구조 확인
    console.log('🔍 테이블 구조 확인 중...')
    const { data: tableStructure, error: structureError } = await supabase
      .from('cars')
      .select('*')
      .limit(0)

    if (structureError) {
      console.error('❌ 테이블 구조 확인 오류:', structureError)
      return NextResponse.json(
        { error: 'Table structure error', details: structureError.message },
        { status: 500 }
      )
    }

    // 최소한의 데이터로 INSERT 시도
    console.log('📝 최소 데이터로 INSERT 시도...')
    const insertData: any = {}
    
    // 확실히 존재할 것 같은 기본 컬럼들만 추가
    if (car_number) insertData.car_number = car_number
    if (corporation) insertData.corporation = corporation
    if (status) insertData.status = status
    if (user.id) insertData.created_by = user.id

    console.log('📝 삽입할 데이터:', insertData)

    // CAR 생성 (최소 컬럼만)
    const { data: newCar, error } = await supabase
      .from('cars')
      .insert(insertData)
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create car' },
        { status: 500 }
      )
    }

    return NextResponse.json(newCar, { status: 201 })

  } catch (error) {
    console.error('Create car error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 