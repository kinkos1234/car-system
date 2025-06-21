import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'comadj-car-system-jwt-secret-2025'

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

// GET - CAR 필터 옵션 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = verifyToken(authHeader)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServiceClient()

    // 병렬로 모든 필터 옵션 조회
    const [
      { data: cars },
      { data: customers }
    ] = await Promise.all([
      supabase.from('cars').select('corporation, eventType, mainCategory'),
      supabase.from('customers').select('corporation, department')
    ])

    // 중복 제거하여 옵션 생성
    const corporations = [...new Set([
      ...(cars?.map(c => c.corporation) || []),
      ...(customers?.map(c => c.corporation) || [])
    ])].filter(Boolean)

    const eventTypes = [...new Set(cars?.map(c => c.eventType) || [])].filter(Boolean)
    
    const mainCategories = [...new Set(cars?.map(c => c.mainCategory) || [])].filter(Boolean)
    
    const departments = [...new Set(customers?.map(c => c.department) || [])].filter(Boolean)

    // 기본 옵션들 추가
    const defaultEventTypes = ['ONE_TIME', 'CONTINUOUS']
    const finalEventTypes = [...new Set([...eventTypes, ...defaultEventTypes])]

    return NextResponse.json({
      corporations,
      customers: corporations, // 고객사는 회사명과 동일
      departments,
      mainCategories,
      eventTypes: finalEventTypes
    })

  } catch (error) {
    console.error('Get CAR filters error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 