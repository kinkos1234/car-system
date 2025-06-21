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

// GET - 대시보드 데이터 조회
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

    // 병렬로 모든 데이터 조회
    const [
      carsResult,
      customersResult,
      reportsResult,
      usersResult
    ] = await Promise.all([
      // CAR 통계
      supabase
        .from('cars')
        .select('id, corporation, status, created_at')
        .order('created_at', { ascending: false }),
      
      // Customer 통계  
      supabase
        .from('customers')
        .select('id, corporation, created_at')
        .order('created_at', { ascending: false }),
      
      // Report 통계 (테이블이 있다면)
      supabase
        .from('reports')
        .select('id, score, status, created_at, is_weekly_report')
        .order('created_at', { ascending: false })
        .limit(100),
      
      // User 통계
      supabase
        .from('users')
        .select('id, role, created_at')
        .order('created_at', { ascending: false })
    ])

    // 에러 체크 (reports 테이블은 없을 수 있으므로 제외)
    if (carsResult.error) {
      console.error('Cars query error:', carsResult.error)
    }
    if (customersResult.error) {
      console.error('Customers query error:', customersResult.error)
    }
    if (usersResult.error) {
      console.error('Users query error:', usersResult.error)
    }

    const cars = carsResult.data || []
    const customers = customersResult.data || []
    const reports = reportsResult.data || []
    const users = usersResult.data || []

    // 기본 통계 계산
    const totalCars = cars.length
    const totalCustomers = customers.length
    const totalReports = reports.length
    const totalUsers = users.length

    // 상태별 CAR 통계
    const carsByStatus = cars.reduce((acc: any, car: any) => {
      acc[car.status] = (acc[car.status] || 0) + 1
      return acc
    }, {})

    // 회사별 CAR 통계
    const carsByCorporation = cars.reduce((acc: any, car: any) => {
      acc[car.corporation] = (acc[car.corporation] || 0) + 1
      return acc
    }, {})

    // 회사별 Customer 통계
    const customersByCorporation = customers.reduce((acc: any, customer: any) => {
      acc[customer.corporation] = (acc[customer.corporation] || 0) + 1
      return acc
    }, {})

    // 월별 생성 통계 (최근 6개월)
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    
    const monthlyStats = []
    for (let i = 0; i < 6; i++) {
      const month = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1)
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1)
      
      const monthCars = cars.filter((car: any) => {
        const createdAt = new Date(car.created_at)
        return createdAt >= month && createdAt < nextMonth
      }).length
      
      const monthCustomers = customers.filter((customer: any) => {
        const createdAt = new Date(customer.created_at)
        return createdAt >= month && createdAt < nextMonth
      }).length

      monthlyStats.push({
        month: month.toISOString().substring(0, 7), // YYYY-MM 형식
        cars: monthCars,
        customers: monthCustomers
      })
    }

    // 평균 점수 계산 (reports가 있는 경우)
    const validReports = reports.filter((report: any) => report.score != null)
    const averageScore = validReports.length > 0 
      ? validReports.reduce((sum: number, report: any) => sum + report.score, 0) / validReports.length
      : 0

    // 최근 활동 (최근 10개)
    const recentActivities = [
      ...cars.slice(0, 5).map((car: any) => ({
        type: 'car',
        action: 'created',
        target: car.id,
        description: `새로운 CAR ${car.id}가 등록되었습니다`,
        created_at: car.created_at
      })),
      ...customers.slice(0, 5).map((customer: any) => ({
        type: 'customer', 
        action: 'created',
        target: customer.id,
        description: `새로운 고객 ${customer.id}가 등록되었습니다`,
        created_at: customer.created_at
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)

    return NextResponse.json({
      summary: {
        totalCars,
        totalCustomers,
        totalReports,
        totalUsers,
        averageScore: Math.round(averageScore * 100) / 100
      },
      statistics: {
        carsByStatus,
        carsByCorporation,
        customersByCorporation,
        monthlyStats
      },
      recentActivities
    })

  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 