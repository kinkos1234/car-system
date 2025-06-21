"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/utils/jwt";
import { canEditCustomer, canDeleteCustomer, User as RoleUser } from "@/utils/role";
import { apiFetch } from "@/utils/api";

type Customer = {
  id: number;
  group: string;
  company: string;
  department: string;
  name: string;
  phone: string;
  memo?: string;
};

type User = {
  id: number;
  name: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
};

// 재사용 정보 표시 컴포넌트
function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-[#94A3B8] font-medium">{label}</span>
      <span className="text-base font-semibold text-white">{value ?? '-'}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-bold text-[#38bdf8] mb-1 mt-4">{children}</div>;
}

function ActionButton({ children, color, ...props }: any) {
  const base = "px-4 py-2 rounded font-semibold text-sm shadow transition";
  const colorMap: any = {
    gray: "bg-gray-600 text-white hover:bg-gray-700",
    blue: "bg-blue-600 text-white hover:bg-blue-700",
    red: "bg-red-500 text-white hover:bg-red-600",
  };
  return <button className={`${base} ${colorMap[color] || ''}`} {...props}>{children}</button>;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getCurrentUser() as RoleUser | null;
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch(`/api/customer/${id}`)
      .then((data) => setCustomer(data))
      .catch((err) => setError(err.message || "고객 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  const canEditOrDelete = canEditCustomer(user);
  const canDelete = canDeleteCustomer(user);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`/api/customer/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      if (!res.ok) throw new Error("삭제 실패");
      router.push("/car/customer");
    } catch (e: any) {
      alert(e.message || "삭제 실패");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-8 bg-[#181A20] min-h-screen text-white text-center">로딩 중...</div>;
  if (error) return <div className="p-8 bg-[#181A20] min-h-screen text-white text-center text-red-500">에러: {error}</div>;
  if (!customer) return <div className="p-8 bg-[#181A20] min-h-screen text-white text-center">고객 정보가 없습니다.</div>;

  return (
    <div className="p-8 bg-[#181A20] min-h-screen text-white">
      <div className="max-w-3xl mx-auto bg-[#23242B] rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">고객 상세 정보</h2>
        
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8">
          <Info label="ID" value={customer.id} />
          <Info label="그룹" value={customer.group} />
          <Info label="회사" value={customer.company || customer.group || '-'} />
          <Info label="부서" value={customer.department} />
          <Info label="이름" value={customer.name} />
          <Info label="전화번호" value={customer.phone} />
        </div>

        <SectionTitle>메모</SectionTitle>
        <div className="bg-[#181A20] rounded p-3 mb-2 min-h-[40px] whitespace-pre-line">
          {customer.memo || '-'}
        </div>
        
        <div className="flex gap-2 mt-8 justify-end">
          <ActionButton 
            color="gray" 
            onClick={() => router.push("/car/customer")}
            data-testid="customer-back-btn"
          >
            목록으로
          </ActionButton>
          {canEditOrDelete && (
            <>
              <ActionButton
                color="blue"
                onClick={() => router.push(`/customer/${customer.id}/edit`)}
              >
                수정
              </ActionButton>
              {canDelete && (
                <ActionButton
                  color="red"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? "삭제 중..." : "삭제"}
                </ActionButton>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 