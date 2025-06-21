"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type CustomerInput = {
  name: string;
  company: string;
  department: string;
  phone: string;
  title: string;
  memo: string;
};

export default function CustomerNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<CustomerInput>({
    name: "",
    company: "",
    department: "",
    phone: "",
    title: "",
    memo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ [k: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validate = () => {
    const err: { [k: string]: string } = {};
    if (!form.name) err.name = "이름 필수";
    if (!form.company) err.company = "회사 필수";
    if (!form.department) err.department = "부서 필수";
    if (!form.phone) err.phone = "전화번호 필수";
    if (!form.title) err.title = "직함 필수";
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = validate();
    setFieldError(err);
    if (Object.keys(err).length > 0) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("등록 실패");
      router.push("/customer");
    } catch (e: any) {
      setError(e.message || "등록 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">고객 등록</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">이름</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className={`w-full border px-3 py-2 rounded ${fieldError.name ? 'border-red-500' : ''}`}
            required
            autoFocus
          />
          {fieldError.name && <div className="text-red-500 text-xs mt-1">{fieldError.name}</div>}
        </div>
        <div>
          <label className="block mb-1 font-semibold">회사</label>
          <input
            name="company"
            value={form.company}
            onChange={handleChange}
            className={`w-full border px-3 py-2 rounded ${fieldError.company ? 'border-red-500' : ''}`}
            required
          />
          {fieldError.company && <div className="text-red-500 text-xs mt-1">{fieldError.company}</div>}
        </div>
        <div>
          <label className="block mb-1 font-semibold">부서</label>
          <input
            name="department"
            value={form.department}
            onChange={handleChange}
            className={`w-full border px-3 py-2 rounded ${fieldError.department ? 'border-red-500' : ''}`}
            required
          />
          {fieldError.department && <div className="text-red-500 text-xs mt-1">{fieldError.department}</div>}
        </div>
        <div>
          <label className="block mb-1 font-semibold">전화번호</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={`w-full border px-3 py-2 rounded ${fieldError.phone ? 'border-red-500' : ''}`}
            required
          />
          {fieldError.phone && <div className="text-red-500 text-xs mt-1">{fieldError.phone}</div>}
        </div>
        <div>
          <label className="block mb-1 font-semibold">직함</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            className={`w-full border px-3 py-2 rounded ${fieldError.title ? 'border-red-500' : ''}`}
            required
          />
          {fieldError.title && <div className="text-red-500 text-xs mt-1">{fieldError.title}</div>}
        </div>
        <div>
          <label className="block mb-1 font-semibold">메모</label>
          <textarea
            name="memo"
            value={form.memo}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded min-h-[60px]"
          />
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 rounded"
            onClick={() => router.push("/customer")}
            disabled={loading}
            data-testid="customer-cancel-btn"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            disabled={loading || Object.keys(fieldError).length > 0}
          >
            {loading ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
} 