import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Supabase 서비스 클라이언트 생성
    const supabase = createServiceClient()

    // 사용자 조회 (loginId 또는 email로 검색)
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(`login_id.eq.${email},email.eq.${email}`)
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    const user = users?.[0]
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // 비밀번호 검증
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // 사용자 정보 반환 (비밀번호 제외)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    }

    return NextResponse.json({
      token,
      user: userResponse
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 