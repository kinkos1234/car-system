"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/utils/jwt";
import { canEditCar, canDeleteCar, User as RoleUser } from "@/utils/role";
import { apiFetch } from "@/utils/api";

// CAR 타입 정의 (실제 필드에 맞게 수정 필요)
type CustomerContact = {
  id: number;
  name: string;
  group: string;
  department: string;
  phone: string;
  memo?: string;
};

type Car = {
  id: number;
  corporation: string;
  customerContacts: CustomerContact[];
  eventType: string;
  issueDate: string;
  dueDate?: string;
  importance: number;
  internalContact?: string;
  mainCategory?: string;
  openIssue?: string;
  followUpPlan?: string;
  completionDate?: string;
  internalScore?: number;
  customerScore?: number;
  subjectiveScore?: number;
  score?: number;
  createdBy: number;
  status?: string;
};

type User = {
  id: number;
  name: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
};

// 재사용 정보 표시 컴포넌트
function Info({ label, value, highlight = false }: { label: string; value: any; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[#94A3B8] font-medium">{label}</span>
      <span className={`text-base font-semibold ${highlight ? 'text-green-400' : 'text-white'}`}>{value ?? '-'}</span>
    </div>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-bold text-[#38bdf8] mb-1 mt-4">{children}</div>;
}
function ActionButton({ children, color, ...props }: any) {
  const base = "px-4 py-2 rounded font-semibold text-sm shadow transition";
  const colorMap: any = {
    gray: "bg-gray-200 text-black hover:bg-gray-300",
    green: "bg-green-600 text-white hover:bg-green-700",
    red: "bg-red-500 text-white hover:bg-red-600",
  };
  return <button className={`${base} ${colorMap[color] || ''}`} {...props}>{children}</button>;
}

function formatDate(ts?: string | number | null) {
  if (!ts) return '-';
  
  // BigInt인 경우 Number로 변환
  let d = ts;
  if (typeof ts === 'bigint') {
    d = Number(ts);
  } else if (typeof ts === 'string' && /^\d+$/.test(ts)) {
    // 문자열 숫자인 경우 Number로 변환
    d = Number(ts);
  } else if (typeof ts === 'string' && /^\d{4}-\d{2}-\d{2}/.test(ts)) {
    // 이미 YYYY-MM-DD 형태라면 그대로 사용
    return ts.slice(0, 10);
  }
  
  if (!d || isNaN(d as number)) return '-';
  return new Date(d as number).toISOString().slice(0, 10);
}

export default function CarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getCurrentUser() as RoleUser | null;
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch(`/api/car/${id}`)
      .then((data) => setCar(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const canEditOrDelete = canEditCar(user, car);
  const canEdit = canEditCar(user, car);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`/api/car/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("삭제 실패");
      router.push("/car");
    } catch (e: any) {
      alert(e.message || "삭제 실패");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-8 text-center">로딩 중...</div>;
  if (error) {
    if (error === "NOT_FOUND")
      return (
        <div className="p-8 text-center text-red-500">해당 CAR 정보가 존재하지 않거나 삭제되었습니다.<br /><ActionButton color="gray" onClick={() => router.push("/car")}>목록으로</ActionButton></div>
      );
    if (error === "FORBIDDEN")
      return (
        <div className="p-8 text-center text-red-500">해당 CAR 정보에 접근할 권한이 없습니다.<br /><ActionButton color="gray" onClick={() => router.push("/car")}>목록으로</ActionButton></div>
      );
    return (
      <div className="p-8 text-center text-red-500">CAR 정보를 불러오는 중 오류가 발생했습니다.<br /><ActionButton color="gray" onClick={() => router.push("/car")}>목록으로</ActionButton></div>
    );
  }
  if (!car) return <div className="p-8 text-center text-red-500">CAR 정보가 없습니다.</div>;

  return (
    <div className="p-8 bg-[#181A20] min-h-screen text-white">
      <div className="max-w-3xl mx-auto bg-[#23242B] rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">CAR 상세 정보</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8">
          <Info label="법인" value={car.corporation} />
          <Info label="고객사" value={car.customerContacts && car.customerContacts.length > 0 ? car.customerContacts.map(cc => cc.group).filter((v, i, arr) => arr.indexOf(v) === i).join(', ') : '-'} />
          <Info label="담당자" value={car.customerContacts && car.customerContacts.length > 0 ? car.customerContacts.map(cc => cc.name).join(', ') : '-'} />
          <Info label="부서" value={car.customerContacts && car.customerContacts.length > 0 ? car.customerContacts.map(cc => cc.department).filter((v, i, arr) => arr.indexOf(v) === i).join(', ') : '-'} />
          <Info label="이벤트 타입" value={car.eventType} />
          <Info label="상태" value={car.status} highlight />
          <Info label="발행일" value={formatDate(car.issueDate)} />
          <Info label="기한일" value={formatDate(car.dueDate)} />
          <Info label="중요도" value={car.importance} />
          <Info label="내부 담당자" value={car.internalContact || '-'} />
          <Info label="카테고리" value={car.mainCategory || '-'} />
        </div>
        <SectionTitle>오픈 이슈</SectionTitle>
        <div className="bg-[#181A20] rounded p-3 mb-2 min-h-[40px] whitespace-pre-wrap break-words" style={{whiteSpace: 'pre-wrap'}}>{car.openIssue || '-'}</div>
        <SectionTitle>후속 조치</SectionTitle>
        <div className="bg-[#181A20] rounded p-3 mb-2 min-h-[40px] whitespace-pre-wrap break-words" style={{whiteSpace: 'pre-wrap'}}>{car.followUpPlan || '-'}</div>
        <SectionTitle>완료일</SectionTitle>
        <div className="bg-[#181A20] rounded p-3 mb-2 min-h-[40px]">{formatDate(car.completionDate)}</div>
        {/* 이벤트 타입에 따른 점수 표시 분기 */}
        {car.eventType === "CONTINUOUS" ? (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Info label="내부 점수" value={car.internalScore ?? '-'} />
            <Info label="고객 점수" value={car.customerScore ?? '-'} />
          </div>
        ) : car.eventType === "ONE_TIME" ? (
          <div className="grid grid-cols-1 gap-4 mt-6 max-w-xs">
            <Info label="주관 점수" value={car.subjectiveScore ?? '-'} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <Info label="내부 점수" value={car.internalScore ?? '-'} />
            <Info label="고객 점수" value={car.customerScore ?? '-'} />
            <Info label="주관 점수" value={car.subjectiveScore ?? '-'} />
          </div>
        )}
        <div className="mt-4 text-lg font-bold text-green-400">최종 SCORE: {car.score ?? '-'}</div>
        <div className="flex gap-2 mt-8 justify-end">
          <ActionButton color="gray" onClick={() => router.push("/car")}>목록으로</ActionButton>
          {canEdit && (
            <ActionButton color="green" onClick={() => router.push(`/car/${id}/edit`)}>수정</ActionButton>
          )}
          {canEditOrDelete && (
            <ActionButton color="red" onClick={handleDelete} disabled={deleting}>{deleting ? "삭제 중..." : "삭제"}</ActionButton>
          )}
        </div>
      </div>
    </div>
  );
} 