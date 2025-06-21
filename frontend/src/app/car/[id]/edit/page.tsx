"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/utils/api";

// 재사용 정보 표시 컴포넌트
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 mb-2">
      <span className="text-xs text-[#94A3B8] font-medium mb-1">{label}</span>
      {children}
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
    blue: "bg-blue-600 text-white hover:bg-blue-700",
    red: "bg-red-500 text-white hover:bg-red-600",
  };
  return <button className={`${base} ${colorMap[color] || ''}`} {...props}>{children}</button>;
}

type CarInput = {
  corporation: string;
  customerContactIds: string[];
  eventType: "ONE_TIME" | "CONTINUOUS";
  issueDate: string;
  importance: number | "";
  dueDate?: string;
  mainCategory?: string;
  internalContact?: string;
  openIssue?: string;
  followUpPlan?: string;
  completionDate?: string;
  internalScore?: number | "";
  customerScore?: number | "";
  subjectiveScore?: number | "";
};

export default function CarEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [form, setForm] = useState<CarInput | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ [k: string]: string }>({});
  const [customerContacts, setCustomerContacts] = useState<any[]>([]);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    group: "",
    company: "",
    department: "",
    name: "",
    contact: "",
    memo: "",
    newGroup: "",
    newCompany: "",
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [addError, setAddError] = useState<string | null>(null);

  // BigInt를 포함한 날짜 타입을 입력 필드용으로 포맷팅하는 함수
  function formatDateForInput(dateValue: any): string {
    if (!dateValue) return '';
    
    // BigInt인 경우 Number로 변환
    if (typeof dateValue === 'bigint') {
      dateValue = Number(dateValue);
    }
    
    // 문자열 숫자인 경우 Number로 변환
    if (typeof dateValue === 'string' && /^\d+$/.test(dateValue)) {
      dateValue = Number(dateValue);
    }
    
    // 문자열이 이미 YYYY-MM-DD 형태라면 그대로 사용
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      return dateValue.slice(0, 10);
    }
    
    // 숫자(timestamp)인 경우 Date 객체로 변환
    if (typeof dateValue === 'number') {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().slice(0, 10);
    }
    
    return '';
  }

  useEffect(() => {
    apiFetch("/api/customer").then(setCustomerContacts).catch(() => setCustomerContacts([]));
    if (!id) return;
    apiFetch(`/api/car/${id}`)
      .then((data) => {
        setForm({
          corporation: data.corporation || "",
          customerContactIds: (data.customerContacts || []).map((c: any) => String(c.id)),
          eventType: data.eventType || "ONE_TIME",
          issueDate: formatDateForInput(data.issueDate),
          importance: data.importance ?? "",
          dueDate: formatDateForInput(data.dueDate),
          mainCategory: data.mainCategory || "",
          internalContact: data.internalContact || "",
          openIssue: data.openIssue || "",
          followUpPlan: data.followUpPlan || "",
          completionDate: formatDateForInput(data.completionDate),
          internalScore: data.internalScore ?? "",
          customerScore: data.customerScore ?? "",
          subjectiveScore: data.subjectiveScore ?? "",
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  // 그룹/회사 옵션 추출 (중복 없이)
  const groupOptions = Array.from(new Set(customerContacts.map(c => c.group).filter(Boolean)));
  const companyOptions = Array.from(new Set(customerContacts.map(c => c.company).filter(Boolean)));
  const departmentOptions = [
    "Purchasing", "Engineering", "Quality", "Production", "Developing", "ETC"
  ];

  const selectedContacts = customerContacts.filter(c => form?.customerContactIds.includes(String(c.id)));

  // 신규 고객 등록 핸들러
  const handleAddCustomer = async () => {
    // 신규 입력값 반영
    const groupValue = newCustomer.group === "__new" ? newCustomer.newGroup : newCustomer.group;
    const companyValue = newCustomer.company === "__new" ? newCustomer.newCompany : newCustomer.company;
    const missing: string[] = [];
    if (!groupValue) missing.push("group");
    if (!newCustomer.department) missing.push("department");
    if (!newCustomer.name) missing.push("name");
    if (missing.length > 0) {
      setMissingFields(missing);
      setAddError(null);
      return;
    }
    setMissingFields([]);
    setAddError(null);
    try {
      const payload = {
        group: groupValue,
        company: companyValue,
        department: newCustomer.department,
        name: newCustomer.name,
        phone: newCustomer.contact || "",
        memo: newCustomer.memo || "",
      };
      const res = await apiFetch("/api/customer", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      });
      setCustomerContacts((prev) => [...prev, res]);
      setForm((prev) => prev ? { ...prev, customerContactIds: [...(prev.customerContactIds || []), String(res.id)] } : prev);
      setIsAddCustomerOpen(false);
      setNewCustomer({ group: "", company: "", department: "", name: "", contact: "", memo: "", newGroup: "", newCompany: "" });
    } catch (e: any) {
      setAddError(e?.message || "등록 실패");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (e.target instanceof HTMLSelectElement && e.target.multiple) {
      const options = e.target.options;
      const selected = Array.from(options).filter((o) => o.selected).map((o) => o.value);
      setForm((prev) => prev ? { ...prev, [name]: selected } : prev);
    } else {
      setForm((prev) => prev ? {
        ...prev,
        [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
      } : prev);
    }
  };

  const validate = () => {
    const err: { [k: string]: string } = {};
    if (!form?.corporation) err.corporation = "법인 필수";
    if (!form?.customerContactIds || form.customerContactIds.length === 0) err.customerContactIds = "고객 담당자 필수";
    if (!form?.issueDate) err.issueDate = "발행일자 필수";
    else if (new Date(form.issueDate) > new Date()) err.issueDate = "발행일자는 미래일 수 없음";
    if (form?.importance === "" || form?.importance === null) err.importance = "중요도 필수";
    else if (typeof form?.importance === "number" && (form.importance < 0 || form.importance > 5)) err.importance = "중요도는 0~5";
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError(null);
    const err = validate();
    setFieldError(err);
    if (Object.keys(err).length > 0) return;
    setLoading(true);
    try {
      const token = sessionStorage.getItem("token");
      // 날짜/숫자 필드 빈 문자열을 null로 변환 + 날짜는 timestamp로 변환
      const toTimestamp = (v: string | undefined) => v ? new Date(v).getTime() : null;
      const payload = {
        ...form,
        issueDate: toTimestamp(form.issueDate),
        dueDate: toTimestamp(form.dueDate),
        completionDate: toTimestamp(form.completionDate),
        internalScore: form.internalScore !== "" ? Number(form.internalScore) : null,
        customerScore: form.customerScore !== "" ? Number(form.customerScore) : null,
        subjectiveScore: form.subjectiveScore !== "" ? Number(form.subjectiveScore) : null,
      };
      const res = await fetch(`/api/car/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ ...payload, customerContactIds: form.customerContactIds.map(Number) }),
      });
      if (!res.ok) throw new Error("수정 실패");
      router.push(`/car/${id}`);
    } catch (e: any) {
      setError(e.message || "수정 실패");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !form) return <div className="p-8 text-center">로딩 중...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="p-8 bg-[#181A20] min-h-screen text-white">
      <div className="max-w-3xl mx-auto bg-[#23242B] rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">CAR 수정</h2>
        <form onSubmit={handleSubmit}>
          <FormField label="유형">
            <select
              name="eventType"
              value={form!.eventType}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
              required
            >
              <option value="ONE_TIME">ONE_TIME</option>
              <option value="CONTINUOUS">CONTINUOUS</option>
            </select>
          </FormField>
          <FormField label="고객 담당자">
            <div className="relative" ref={dropdownRef}>
              <div
                className={`w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] min-h-[42px] cursor-pointer ${fieldError.customerContactIds ? 'border-red-500' : ''}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {selectedContacts.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedContacts.map(contact => (
                      <span key={contact.id} className="bg-sky-600 px-2 py-1 rounded text-xs">
                        {contact.name} ({contact.group}/{contact.department})
                        <button
                          type="button"
                          className="ml-1 text-white hover:text-red-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm(prev => {
                              if (!prev) return prev;
                              return {
                                ...prev, 
                                customerContactIds: prev.customerContactIds.filter(id => id !== String(contact.id))
                              };
                            });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400">고객 담당자 선택</span>
                )}
              </div>
              {dropdownOpen && (
                <div className="absolute top-full left-0 w-full bg-[#181A20] border border-[#333] rounded mt-1 max-h-60 overflow-y-auto z-10">
                  {customerContacts.map(contact => (
                    <div
                      key={contact.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-[#333] ${form.customerContactIds.includes(String(contact.id)) ? 'bg-sky-600' : ''}`}
                      onClick={() => {
                        const isSelected = form.customerContactIds.includes(String(contact.id));
                        if (isSelected) {
                          setForm(prev => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              customerContactIds: prev.customerContactIds.filter(id => id !== String(contact.id))
                            };
                          });
                        } else {
                          setForm(prev => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              customerContactIds: [...prev.customerContactIds, String(contact.id)]
                            };
                          });
                        }
                      }}
                    >
                      {contact.name} ({contact.group}/{contact.department})
                    </div>
                  ))}
                  <div className="border-t border-[#333]">
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left hover:bg-[#333] text-sky-400"
                      onClick={() => {
                        setIsAddCustomerOpen(true);
                        setDropdownOpen(false);
                      }}
                    >
                      + 새 고객 담당자 추가
                    </button>
                  </div>
                </div>
              )}
            </div>
            {fieldError.customerContactIds && <div className="text-red-500 text-xs mt-1">{fieldError.customerContactIds}</div>}
            {/* 신규 고객 등록 모달 */}
            {isAddCustomerOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-[#23242B] p-6 rounded shadow-lg w-96">
                  <h3 className="text-lg font-bold mb-4">신규 고객 등록</h3>
                  {/* 그룹 드롭다운 + 신규 입력 */}
                  <select
                    className={`w-full mb-2 px-3 py-2 rounded bg-[#181A20] text-white border border-[#333] ${missingFields.includes('group') ? 'border-red-500' : ''}`}
                    value={newCustomer.group}
                    onChange={e => setNewCustomer({ ...newCustomer, group: e.target.value })}
                  >
                    <option value="">그룹 선택</option>
                    {groupOptions.map(g => <option key={g} value={g}>{g}</option>)}
                    <option value="__new">신규</option>
                  </select>
                  {newCustomer.group === "__new" && (
                    <input
                      className={`w-full mb-2 px-3 py-2 rounded bg-[#181A20] text-white border border-[#333] ${missingFields.includes('group') ? 'border-red-500' : ''}`}
                      placeholder="신규 그룹 입력"
                      value={newCustomer.newGroup || ""}
                      onChange={e => setNewCustomer({ ...newCustomer, newGroup: e.target.value })}
                    />
                  )}
                  {/* 회사 드롭다운 + 신규 입력 (비필수) */}
                  <select
                    className="w-full mb-2 px-3 py-2 rounded bg-[#181A20] text-white border border-[#333]"
                    value={newCustomer.company}
                    onChange={e => setNewCustomer({ ...newCustomer, company: e.target.value })}
                  >
                    <option value="">회사 선택</option>
                    {companyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__new">신규</option>
                  </select>
                  {newCustomer.company === "__new" && (
                    <input
                      className="w-full mb-2 px-3 py-2 rounded bg-[#181A20] text-white border border-[#333]"
                      placeholder="신규 회사 입력"
                      value={newCustomer.newCompany || ""}
                      onChange={e => setNewCustomer({ ...newCustomer, newCompany: e.target.value })}
                    />
                  )}
                  {/* 부서 드롭다운 (고정 옵션) */}
                  <select
                    className={`w-full mb-2 px-3 py-2 rounded bg-[#181A20] text-white border border-[#333] ${missingFields.includes('department') ? 'border-red-500' : ''}`}
                    value={newCustomer.department}
                    onChange={e => setNewCustomer({ ...newCustomer, department: e.target.value })}
                  >
                    <option value="">부서 선택</option>
                    {departmentOptions.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {/* 이름 */}
                  <input
                    className={`w-full mb-2 px-3 py-2 rounded bg-[#181A20] text-white border border-[#333] ${missingFields.includes('name') ? 'border-red-500' : ''}`}
                    placeholder="이름"
                    value={newCustomer.name}
                    onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                  {/* 연락처 (비필수) */}
                  <input
                    className="w-full mb-2 px-3 py-2 rounded bg-[#181A20] text-white border border-[#333]"
                    placeholder="연락처"
                    value={newCustomer.contact}
                    onChange={e => setNewCustomer({ ...newCustomer, contact: e.target.value })}
                  />
                  {/* 메모 (비필수) */}
                  <textarea
                    className="w-full mb-4 px-3 py-2 rounded bg-[#181A20] text-white border border-[#333] min-h-[40px]"
                    placeholder="메모"
                    value={newCustomer.memo}
                    onChange={e => setNewCustomer({ ...newCustomer, memo: e.target.value })}
                  />
                  {missingFields.length > 0 && (
                    <div className="text-red-500 text-sm mb-2">필수 항목을 입력해 주세요</div>
                  )}
                  {addError && (
                    <div className="text-red-500 text-sm mb-2">{addError}</div>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button type="button" className="px-3 py-1 rounded bg-gray-300 text-black" onClick={() => setIsAddCustomerOpen(false)}>취소</button>
                    <button type="button" className="px-3 py-1 rounded bg-sky-600 text-white" onClick={handleAddCustomer}>등록</button>
                  </div>
                </div>
              </div>
            )}
          </FormField>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
            <FormField label="법인">
              <select
                name="corporation"
                value={form!.corporation}
                onChange={handleChange}
                className={`w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] ${fieldError.corporation ? 'border-red-500' : ''}`}
                required
              >
                <option value="">법인 선택</option>
                <option value="SSKR">SSKR</option>
                <option value="SSVN">SSVN</option>
                <option value="SSSJ">SSSJ</option>
                <option value="SSMX">SSMX</option>
                <option value="SSMPL">SSMPL</option>
                <option value="SSCZ">SSCZ</option>
                <option value="SSNA">SSNA</option>
              </select>
              {fieldError.corporation && <div className="text-red-500 text-xs mt-1">{fieldError.corporation}</div>}
            </FormField>
            <FormField label="발행일자">
              <div className="relative">
                <input
                  name="issueDate"
                  type="date"
                  value={form!.issueDate}
                  onChange={handleChange}
                  className={`w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] ${fieldError.issueDate ? 'border-red-500' : ''} [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100`}
                  required
                />
              </div>
              {fieldError.issueDate && <div className="text-red-500 text-xs mt-1">{fieldError.issueDate}</div>}
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8">
            <FormField label="기한일">
              <div className="relative">
                <input
                  name="dueDate"
                  type="date"
                  value={form!.dueDate || ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
                />
              </div>
            </FormField>
            <FormField label="카테고리">
              <input
                name="mainCategory"
                value={form!.mainCategory || ""}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
              />
            </FormField>
          </div>
          <FormField label="내부 담당자">
            <input
              name="internalContact"
              value={form!.internalContact || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
            />
          </FormField>
          <SectionTitle>오픈 이슈</SectionTitle>
          <textarea
            name="openIssue"
            value={form!.openIssue || ""}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded min-h-[40px] bg-[#181A20] text-white border-[#333]"
          />
          <SectionTitle>후속 조치</SectionTitle>
          <textarea
            name="followUpPlan"
            value={form!.followUpPlan || ""}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded min-h-[40px] bg-[#181A20] text-white border-[#333]"
          />
          <SectionTitle>완료일</SectionTitle>
          <div className="relative">
            <input
              name="completionDate"
              type="date"
              value={form!.completionDate || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
            />
          </div>
          {/* 이벤트 타입에 따른 점수 입력 분기 */}
          {form!.eventType === "CONTINUOUS" ? (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <FormField label="내부 점수">
                <input
                  name="internalScore"
                  type="number"
                  value={form!.internalScore ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
                  min={0}
                  max={5}
                  step={0.1}
                />
              </FormField>
              <FormField label="고객 점수">
                <input
                  name="customerScore"
                  type="number"
                  value={form!.customerScore ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
                  min={0}
                  max={5}
                  step={0.1}
                />
              </FormField>
            </div>
          ) : form!.eventType === "ONE_TIME" ? (
            <div className="grid grid-cols-1 gap-4 mt-6 max-w-xs">
              <FormField label="주관 점수">
                <input
                  name="subjectiveScore"
                  type="number"
                  value={form!.subjectiveScore ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
                  min={0}
                  max={5}
                  step={0.1}
                />
              </FormField>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <FormField label="내부 점수">
                <input
                  name="internalScore"
                  type="number"
                  value={form!.internalScore ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
                  min={0}
                  max={5}
                  step={0.1}
                />
              </FormField>
              <FormField label="고객 점수">
                <input
                  name="customerScore"
                  type="number"
                  value={form!.customerScore ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
                  min={0}
                  max={5}
                  step={0.1}
                />
              </FormField>
              <FormField label="주관 점수">
                <input
                  name="subjectiveScore"
                  type="number"
                  value={form!.subjectiveScore ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
                  min={0}
                  max={5}
                  step={0.1}
                />
              </FormField>
            </div>
          )}
          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
          <div className="flex gap-2 mt-8 justify-end">
            <ActionButton color="gray" type="button" onClick={() => router.push(`/car/${id}`)} disabled={loading}>취소</ActionButton>
            <ActionButton color="blue" type="submit" disabled={loading || Object.keys(fieldError).length > 0}>{loading ? "수정 중..." : "수정"}</ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
} 