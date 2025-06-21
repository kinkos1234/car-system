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

// GET - Customer 목록 조회
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
    const { searchParams } = new URL(request.url)
    
    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 검색 파라미터
    const search = searchParams.get('search')
    const corporation = searchParams.get('corporation')

    let query = supabase
      .from('customers')
      .select('*')

    // 필터 적용
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,contact.ilike.%${search}%`)
    }
    if (corporation) {
      query = query.eq('corporation', corporation)
    }

    // 페이지네이션과 정렬
    const { data: customers, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error', details: error.message },
        { status: 500 }
      )
    }

    // 총 개수 조회
    const { count: totalCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      customers: customers || [],
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Get customers error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Customer 생성
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
      name,
      email,
      contact,
      corporation,
      address,
      department,
      position
    } = body

    // 필수 필드 검증
    if (!name || !corporation) {
      return NextResponse.json(
        { error: 'Name and corporation are required' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // 이메일 중복 검사 (이메일이 제공된 경우)
    if (email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .limit(1)

      if (existingCustomer && existingCustomer.length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        )
      }
    }

    // Customer 생성
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        name,
        email: email || null,
        contact: contact || null,
        corporation,
        address: address || null,
        department: department || null,
        position: position || null,
        created_by: user.id
      })
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create customer', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(newCustomer, { status: 201 })

  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 