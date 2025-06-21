"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/utils/api";

type CustomerInput = {
  group: string;
  company: string;
  department: string;
  name: string;
  phone: string;
  memo: string;
  newGroup: string;
  newCompany: string;
};

function FormField({ label, children, required = false }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-white mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function CustomerNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<CustomerInput>({
    group: "",
    company: "",
    department: "",
    name: "",
    phone: "",
    memo: "",
    newGroup: "",
    newCompany: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ [k: string]: string }>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [customerContacts, setCustomerContacts] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/api/customer").then(setCustomerContacts).catch(() => setCustomerContacts([]));
  }, []);

  // 그룹/회사 옵션 추출 (중복 없이)
  const groupOptions = Array.from(new Set(customerContacts.map(c => c.group).filter(Boolean)));
  const companyOptions = Array.from(new Set(customerContacts.map(c => c.company).filter(Boolean)));
  const departmentOptions = ["Purchasing", "Engineering", "Quality", "Production", "Developing", "ETC"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    setMissingFields([]);
    setError(null);
    
    const missing = [];
    const groupValue = form.group === "__new" ? form.newGroup : form.group;
    if (!groupValue) missing.push('group');
    if (!form.department) missing.push('department');
    if (!form.name) missing.push('name');
    
    if (missing.length > 0) {
      setMissingFields(missing);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    try {
      const finalGroup = form.group === "__new" ? form.newGroup : form.group;
      const finalCompany = form.company === "__new" ? form.newCompany : form.company;
      
      const customerData = {
        group: finalGroup,
        company: finalCompany || "",
        department: form.department,
        name: form.name,
        phone: form.phone || "",
        memo: form.memo || "",
      };
      
      const token = sessionStorage.getItem("token");
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(customerData),
      });
      if (!res.ok) throw new Error("등록 실패");
      router.push("/car/customer");
    } catch (e: any) {
      setError(e.message || "등록 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 bg-[#181A20] min-h-screen text-white">
      <div className="max-w-2xl mx-auto bg-[#23242B] rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">고객 등록</h2>
        
        <form onSubmit={handleSubmit}>
          {/* 그룹 드롭다운 + 신규 입력 */}
          <FormField label="그룹" required>
            <select
              className={`w-full mb-2 px-3 py-2 rounded bg-[#181A20] text-white border border-[#333] ${missingFields.includes('group') ? 'border-red-500' : ''}`}
              value={form.group}
              onChange={e => setForm({ ...form, group: e.target.value })}
            >
              <option value="">그룹 선택</option>
              {groupOptions.map(g => <option key={g} value={g}>{g}</option>)}
              <option value="__new">신규</option>
            </select>
            {form.group === "__new" && (
              <input
                className={`w-full px-3 py-2 rounded bg-[#181A20] text-white border border-[#333] ${missingFields.includes('group') ? 'border-red-500' : ''}`}
                placeholder="신규 그룹 입력"
                value={form.newGroup || ""}
                onChange={e => setForm({ ...form, newGroup: e.target.value })}
                autoFocus
              />
            )}
          </FormField>

          {/* 회사 드롭다운 + 신규 입력 (비필수) */}
          <FormField label="회사">
            <select
              className="w-full mb-2 px-3 py-2 rounded bg-[#181A20] text-white border border-[#333]"
              value={form.company}
              onChange={e => setForm({ ...form, company: e.target.value })}
            >
              <option value="">회사 선택</option>
              {companyOptions.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__new">신규</option>
            </select>
            {form.company === "__new" && (
              <input
                className="w-full px-3 py-2 rounded bg-[#181A20] text-white border border-[#333]"
                placeholder="신규 회사 입력"
                value={form.newCompany || ""}
                onChange={e => setForm({ ...form, newCompany: e.target.value })}
              />
            )}
          </FormField>

          {/* 부서 드롭다운 (고정 옵션) */}
          <FormField label="부서" required>
            <select
              className={`w-full px-3 py-2 rounded bg-[#181A20] text-white border border-[#333] ${missingFields.includes('department') ? 'border-red-500' : ''}`}
              value={form.department}
              onChange={e => setForm({ ...form, department: e.target.value })}
            >
              <option value="">부서 선택</option>
              {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </FormField>

          {/* 이름 */}
          <FormField label="이름" required>
            <input
              className={`w-full px-3 py-2 rounded bg-[#181A20] text-white border border-[#333] ${missingFields.includes('name') ? 'border-red-500' : ''}`}
              placeholder="이름"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </FormField>

          {/* 연락처 (비필수) */}
          <FormField label="연락처">
            <input
              className="w-full px-3 py-2 rounded bg-[#181A20] text-white border border-[#333]"
              placeholder="연락처"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </FormField>

          {/* 메모 (비필수) */}
          <FormField label="메모">
            <textarea
              className="w-full px-3 py-2 rounded bg-[#181A20] text-white border border-[#333] min-h-[100px]"
              placeholder="메모"
              value={form.memo}
              onChange={e => setForm({ ...form, memo: e.target.value })}
            />
          </FormField>

          {missingFields.length > 0 && (
            <div className="text-red-500 text-sm mb-4">필수 항목을 입력해 주세요</div>
          )}
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          
          <div className="flex gap-2 mt-8 justify-end">
            <button
              type="button"
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              onClick={() => router.push("/car/customer")}
              disabled={loading}
              data-testid="customer-cancel-btn"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
              disabled={loading}
            >
              {loading ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 