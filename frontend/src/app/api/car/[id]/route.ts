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

// GET - CAR 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = verifyToken(authHeader)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const supabase = createServiceClient()
    
    const { data: car, error } = await supabase
      .from('cars')
      .select(`
        *,
        customer:customers (
          id,
          name,
          email,
          corporation,
          contact,
          address
        ),
        reports (
          id,
          title,
          status,
          score,
          created_at,
          is_weekly_report
        ),
        created_by_user:users!cars_created_by_fkey (
          id,
          name,
          role
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Car not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    return NextResponse.json(car)

  } catch (error) {
    console.error('Get car error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - CAR 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = verifyToken(authHeader)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      car_number,
      car_model,
      corporation,
      customer_id,
      customer_contact,
      status
    } = body

    const supabase = createServiceClient()

    // 기존 CAR 존재 확인
    const { data: existingCar, error: fetchError } = await supabase
      .from('cars')
      .select('id, car_number')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Car not found' },
          { status: 404 }
        )
      }
      console.error('Database error:', fetchError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // 차량번호 변경 시 중복 검사
    if (car_number && car_number !== existingCar.car_number) {
      const { data: duplicateCar } = await supabase
        .from('cars')
        .select('id')
        .eq('car_number', car_number)
        .neq('id', id)
        .limit(1)

      if (duplicateCar && duplicateCar.length > 0) {
        return NextResponse.json(
          { error: 'Car number already exists' },
          { status: 409 }
        )
      }
    }

    // CAR 수정
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (car_number) updateData.car_number = car_number
    if (car_model) updateData.car_model = car_model
    if (corporation) updateData.corporation = corporation
    if (customer_id !== undefined) updateData.customer_id = customer_id
    if (customer_contact !== undefined) updateData.customer_contact = customer_contact
    if (status) updateData.status = status

    const { data: updatedCar, error } = await supabase
      .from('cars')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers (
          id,
          name,
          email,
          corporation
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to update car' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedCar)

  } catch (error) {
    console.error('Update car error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - CAR 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization')
    const user = verifyToken(authHeader)

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 권한 검사 (ADMIN만 삭제 가능)
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { id } = await params
    const supabase = createServiceClient()

    // 연관된 리포트가 있는지 확인
    const { data: reports } = await supabase
      .from('reports')
      .select('id')
      .eq('car_id', id)
      .limit(1)

    if (reports && reports.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete car with existing reports' },
        { status: 409 }
      )
    }

    // CAR 삭제
    const { error } = await supabase
      .from('cars')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to delete car' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Car deleted successfully' })

  } catch (error) {
    console.error('Delete car error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 