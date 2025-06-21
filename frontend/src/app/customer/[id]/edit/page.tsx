"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/utils/api";

type CustomerInput = {
  group: string;
  company: string;
  department: string;
  name: string;
  phone: string;
  memo: string;
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

export default function CustomerEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [form, setForm] = useState<CustomerInput>({
    group: "",
    company: "",
    department: "",
    name: "",
    phone: "",
    memo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiFetch(`/api/customer/${id}`)
      .then((data) => setForm({
        group: data.group || "",
        company: data.company || "",
        department: data.department || "",
        name: data.name || "",
        phone: data.phone || "",
        memo: data.memo || "",
      }))
      .catch((err) => setError(err.message || "데이터 로드 실패"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const err: { [k: string]: string } = {};
    if (!form.group) err.group = "그룹 필수";
    if (!form.department) err.department = "부서 필수";
    if (!form.name) err.name = "이름 필수";
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = validate();
    setFieldError(err);
    if (Object.keys(err).length > 0) return;
    setSaving(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch(`/api/customer/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("수정 실패");
      router.push(`/customer/${id}`);
    } catch (e: any) {
      setError(e.message || "수정 실패");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 bg-[#181A20] min-h-screen text-white text-center">로딩 중...</div>;
  if (error) return <div className="p-8 bg-[#181A20] min-h-screen text-white text-center text-red-500">에러: {error}</div>;

  return (
    <div className="p-8 bg-[#181A20] min-h-screen text-white">
      <div className="max-w-2xl mx-auto bg-[#23242B] rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">고객 정보 수정</h2>
        
        <form onSubmit={handleSubmit}>
          <FormField label="그룹" required>
            <input
              name="group"
              value={form.group}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] ${fieldError.group ? 'border-red-500' : ''}`}
              required
              autoFocus
            />
            {fieldError.group && <div className="text-red-500 text-xs mt-1">{fieldError.group}</div>}
          </FormField>

          <FormField label="회사">
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
            />
          </FormField>

          <FormField label="부서" required>
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] ${fieldError.department ? 'border-red-500' : ''}`}
              required
            >
              <option value="">부서 선택</option>
              <option value="Purchasing">Purchasing</option>
              <option value="Engineering">Engineering</option>
              <option value="Quality">Quality</option>
              <option value="Production">Production</option>
              <option value="Developing">Developing</option>
              <option value="ETC">ETC</option>
            </select>
            {fieldError.department && <div className="text-red-500 text-xs mt-1">{fieldError.department}</div>}
          </FormField>

          <FormField label="이름" required>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={`w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] ${fieldError.name ? 'border-red-500' : ''}`}
              required
            />
            {fieldError.name && <div className="text-red-500 text-xs mt-1">{fieldError.name}</div>}
          </FormField>

          <FormField label="전화번호">
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
            />
          </FormField>

          <FormField label="메모">
            <textarea
              name="memo"
              value={form.memo}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] min-h-[100px] resize-y"
            />
          </FormField>

          {error && <div className="text-red-500 text-sm mb-4 p-3 bg-red-100 bg-opacity-10 rounded">{error}</div>}
          
          <div className="flex gap-2 mt-8 justify-end">
            <button
              type="button"
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              onClick={() => router.push(`/customer/${id}`)}
              disabled={saving}
              data-testid="customer-edit-cancel-btn"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
              disabled={saving || Object.keys(fieldError).length > 0}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 