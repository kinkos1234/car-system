"use client";
import { useEffect, useState } from "react";
import { getCurrentUser, isAuthenticated } from "@/utils/jwt";
import { User as RoleUser } from "@/utils/role";
import { dashboardAPI } from "@/utils/api";
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Title);

interface DashboardData {
  summary: {
    totalCars: number;
    totalCustomers: number;
    totalReports: number;
    totalUsers: number;
    averageScore: number;
  };
  statistics: {
    carsByStatus: Record<string, number>;
    carsByCorporation: Record<string, number>;
    customersByCorporation: Record<string, number>;
    monthlyStats: Array<{
      month: string;
      cars: number;
      customers: number;
    }>;
  };
  recentActivities: Array<{
    type: string;
    action: string;
    target: number;
    description: string;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const [user, setUser] = useState<RoleUser | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 정보 로드
  useEffect(() => {
    setUser(getCurrentUser() as RoleUser | null);
  }, []);

  // 대시보드 데이터 로드
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      if (!isAuthenticated()) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }
      
      try {
        const dashboardData = await dashboardAPI.getData();
        setData(dashboardData);
        setError(null);
      } catch (err: any) {
        setError(err.message || '데이터 로드 실패');
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // 차트 데이터 생성
  const createStatusChartData = () => {
    if (!data?.statistics.carsByStatus) return null;
    
    const statuses = Object.keys(data.statistics.carsByStatus);
    const counts = Object.values(data.statistics.carsByStatus);
    
    return {
      labels: statuses,
      datasets: [{
        data: counts,
        backgroundColor: [
          '#10B981', // 초록
          '#F59E0B', // 노랑
          '#EF4444', // 빨강
          '#3B82F6', // 파랑
          '#8B5CF6', // 보라
        ],
        borderWidth: 0,
      }]
    };
  };

  const createCorporationChartData = () => {
    if (!data?.statistics.carsByCorporation) return null;
    
    const corps = Object.keys(data.statistics.carsByCorporation);
    const counts = Object.values(data.statistics.carsByCorporation);
    
    return {
      labels: corps,
      datasets: [{
        label: 'CAR 수',
        data: counts,
        backgroundColor: '#3B82F6',
        borderColor: '#1D4ED8',
        borderWidth: 1,
      }]
    };
  };

  const createMonthlyTrendData = () => {
    if (!data?.statistics.monthlyStats) return null;
    
    const months = data.statistics.monthlyStats.map(stat => stat.month);
    const carCounts = data.statistics.monthlyStats.map(stat => stat.cars);
    const customerCounts = data.statistics.monthlyStats.map(stat => stat.customers);
    
    return {
      labels: months,
      datasets: [
        {
          label: 'CAR',
          data: carCounts,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Customer',
          data: customerCounts,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#E5E7EB'
        }
      }
    },
    scales: {
      y: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      },
      x: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-zinc-300">대시보드 로딩 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ 오류 발생</div>
          <div className="text-zinc-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">
            📊 Comad J CAR System Dashboard
          </h1>
          <p className="text-zinc-400">
            안녕하세요, {user?.name}님! 현재 시스템 현황을 확인하세요.
          </p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">총 CAR</p>
                <p className="text-2xl font-bold text-sky-400">{data?.summary.totalCars || 0}</p>
              </div>
              <div className="text-sky-400 text-2xl">🚗</div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">총 고객</p>
                <p className="text-2xl font-bold text-green-400">{data?.summary.totalCustomers || 0}</p>
              </div>
              <div className="text-green-400 text-2xl">👥</div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">총 리포트</p>
                <p className="text-2xl font-bold text-purple-400">{data?.summary.totalReports || 0}</p>
              </div>
              <div className="text-purple-400 text-2xl">📋</div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">총 사용자</p>
                <p className="text-2xl font-bold text-orange-400">{data?.summary.totalUsers || 0}</p>
              </div>
              <div className="text-orange-400 text-2xl">👤</div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">평균 점수</p>
                <p className="text-2xl font-bold text-yellow-400">{data?.summary.averageScore || 0}</p>
              </div>
              <div className="text-yellow-400 text-2xl">⭐</div>
            </div>
          </div>
        </div>

        {/* 차트 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 상태별 분포 */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
            <h3 className="text-xl font-bold text-zinc-100 mb-4">CAR 상태별 분포</h3>
            <div className="h-64">
              {createStatusChartData() && (
                <Doughnut data={createStatusChartData()!} options={chartOptions} />
              )}
            </div>
          </div>

          {/* 회사별 분포 */}
          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
            <h3 className="text-xl font-bold text-zinc-100 mb-4">회사별 CAR 분포</h3>
            <div className="h-64">
              {createCorporationChartData() && (
                <Bar data={createCorporationChartData()!} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* 월별 트렌드 */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6 mb-8">
          <h3 className="text-xl font-bold text-zinc-100 mb-4">월별 생성 트렌드 (최근 6개월)</h3>
          <div className="h-64">
            {createMonthlyTrendData() && (
              <Line data={createMonthlyTrendData()!} options={chartOptions} />
            )}
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
          <h3 className="text-xl font-bold text-zinc-100 mb-4">최근 활동</h3>
          <div className="space-y-3">
            {data?.recentActivities?.length ? (
              data.recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'car' ? 'bg-sky-400' : 'bg-green-400'
                    }`}></div>
                    <span className="text-zinc-300">{activity.description}</span>
                  </div>
                  <span className="text-zinc-500 text-sm">
                    {new Date(activity.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center text-zinc-500 py-8">
                최근 활동이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 