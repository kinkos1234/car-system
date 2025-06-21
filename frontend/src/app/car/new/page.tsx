"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/utils/api";

type CarInput = {
  eventType: "ONE_TIME" | "CONTINUOUS";
  corporation: string;
  customerContactIds: string[];
  issueDate: string;
  internalContact: string;
  receptionChannel?: string;
  mainCategory?: string;
  importance: number | "";
  openIssue?: string;
  followUpPlan?: string;
  dueDate?: string;
  completionDate?: string;
  internalScore?: number | "";
  customerScore?: number | "";
  subjectiveScore?: number | "";
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-lg font-bold text-[#38bdf8] mb-4 mt-6">{children}</div>;
}

export default function CarNewPage() {
  const router = useRouter();
  const [form, setForm] = useState<CarInput>({
    eventType: "ONE_TIME",
    corporation: "",
    customerContactIds: [],
    issueDate: new Date().toISOString().slice(0, 10), // 오늘 날짜를 기본값으로
    internalContact: "",
    importance: "",
  });
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    apiFetch("/api/customer").then(setCustomerContacts).catch(() => setCustomerContacts([]));
  }, []);

  // 외부 클릭 감지
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAddCustomer = async () => {
    setMissingFields([]);
    setAddError(null);
    
    const missing = [];
    if (!newCustomer.group && !newCustomer.newGroup) missing.push('group');
    if (!newCustomer.department) missing.push('department');
    if (!newCustomer.name) missing.push('name');
    
    if (missing.length > 0) {
      setMissingFields(missing);
      return;
    }

    try {
      const finalGroup = newCustomer.group === "__new" ? newCustomer.newGroup : newCustomer.group;
      const finalCompany = newCustomer.company === "__new" ? newCustomer.newCompany : newCustomer.company;
      
      const customerData = {
        group: finalGroup,
        company: finalCompany || "",
        department: newCustomer.department,
        name: newCustomer.name,
        contact: newCustomer.contact || "",
        memo: newCustomer.memo || "",
      };
      
      const result = await apiFetch("/api/customer", {
        method: "POST",
        body: JSON.stringify(customerData),
      });
      
      setCustomerContacts(prev => [...prev, result]);
      setForm(prev => ({ ...prev, customerContactIds: [...prev.customerContactIds, String(result.id)] }));
      setNewCustomer({ group: "", company: "", department: "", name: "", contact: "", memo: "", newGroup: "", newCompany: "" });
      setIsAddCustomerOpen(false);
    } catch (e: any) {
      setAddError(e.message || "고객 담당자 추가 실패");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (e.target instanceof HTMLSelectElement && e.target.multiple) {
      const options = e.target.options;
      const selected = Array.from(options).filter((o) => o.selected).map((o) => o.value);
      setForm((prev) => ({ ...prev, [name]: selected }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
      }));
    }
  };

  const validate = () => {
    const err: { [k: string]: string } = {};
    if (!form.corporation) err.corporation = "법인 필수";
    if (!form.customerContactIds || form.customerContactIds.length === 0) err.customerContactIds = "고객 담당자 필수";
    if (!form.issueDate) err.issueDate = "발생일 필수";
    else if (new Date(form.issueDate) > new Date()) err.issueDate = "발생일은 미래일 수 없음";
    if (!form.internalContact) err.internalContact = "내부 담당자 필수";
    if (form.importance === "" || form.importance === null) err.importance = "중요도 필수";
    else if (typeof form.importance === "number" && (form.importance < 0 || form.importance > 1)) err.importance = "중요도는 0~1";
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = validate();
    setFieldError(err);
    if (Object.keys(err).length > 0) {
      setError("필수 항목이 미기입되었습니다.");
      return;
    }
    setLoading(true);
    try {
      const userStr = sessionStorage.getItem("user");
      if (!userStr) throw new Error("로그인 정보 없음");
      const user = JSON.parse(userStr);
      const token = sessionStorage.getItem("token");
      
      // 날짜 필드는 timestamp로 변환
      const toTimestamp = (v: string | undefined) => v ? new Date(v).getTime() : null;
      
      const res = await fetch("/api/car", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ 
          ...form, 
          issueDate: toTimestamp(form.issueDate),
          dueDate: toTimestamp(form.dueDate),
          completionDate: toTimestamp(form.completionDate),
          customerContactIds: form.customerContactIds.map(Number), 
          createdBy: user.id 
        }),
      });
      if (!res.ok) throw new Error("등록 실패");
      router.push("/car");
    } catch (e: any) {
      setError(e.message || "등록 실패");
    } finally {
      setLoading(false);
    }
  };

  // 고객 담당자 관련 옵션들
  const groupOptions = Array.from(new Set(customerContacts.map(c => c.group).filter(Boolean)));
  const companyOptions = Array.from(new Set(customerContacts.map(c => c.company).filter(Boolean)));
  const departmentOptions = ["Purchasing", "Engineering", "Quality", "Sales", "Finance", "HR", "IT"];

  const selectedContacts = customerContacts.filter(c => form.customerContactIds.includes(String(c.id)));

  return (
    <div className="p-8 bg-[#181A20] min-h-screen text-white">
      <div className="max-w-4xl mx-auto bg-[#23242B] rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-6">CAR 등록</h2>
        
        <form onSubmit={handleSubmit}>
          {/* 1. 이벤트 타입 (최상단) */}
          <FormField label="이벤트 타입" required>
            <select
              name="eventType"
              value={form.eventType}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
              required
            >
              <option value="ONE_TIME">ONE_TIME</option>
              <option value="CONTINUOUS">CONTINUOUS</option>
            </select>
          </FormField>

          <SectionTitle>공통 항목</SectionTitle>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* 법인 */}
            <FormField label="법인" required>
              <select
                name="corporation"
                value={form.corporation}
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

            {/* 발생일 */}
            <FormField label="발생일" required>
              <div className="relative">
                <input
                  name="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={handleChange}
                  className={`w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] ${fieldError.issueDate ? 'border-red-500' : ''} [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100`}
                  required
                />
              </div>
              {fieldError.issueDate && <div className="text-red-500 text-xs mt-1">{fieldError.issueDate}</div>}
            </FormField>
          </div>

          {/* 고객 담당자 */}
          <FormField label="고객 담당자" required>
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
                            setForm(prev => ({ 
                              ...prev, 
                              customerContactIds: prev.customerContactIds.filter(id => id !== String(contact.id))
                            }));
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
                          setForm(prev => ({
                            ...prev,
                            customerContactIds: prev.customerContactIds.filter(id => id !== String(contact.id))
                          }));
                        } else {
                          setForm(prev => ({
                            ...prev,
                            customerContactIds: [...prev.customerContactIds, String(contact.id)]
                          }));
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
            
            {/* 새 고객 담당자 추가 모달 */}
            {isAddCustomerOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-[#23242B] p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
                  <h3 className="text-lg font-bold mb-4">새 고객 담당자 추가</h3>
                  
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

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {/* 내부 담당자 */}
            <FormField label="내부 담당자" required>
              <input
                name="internalContact"
                value={form.internalContact}
                onChange={handleChange}
                placeholder="홍길동대리, 임꺽정과장"
                className={`w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] ${fieldError.internalContact ? 'border-red-500' : ''}`}
                required
              />
              {fieldError.internalContact && <div className="text-red-500 text-xs mt-1">{fieldError.internalContact}</div>}
            </FormField>

            {/* 접수 채널 */}
            <FormField label="접수 채널">
              <input
                name="receptionChannel"
                value={form.receptionChannel || ""}
                onChange={handleChange}
                placeholder="e-mail, conference call 등"
                className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
              />
            </FormField>

            {/* 주제 */}
            <FormField label="주제">
              <input
                name="mainCategory"
                value={form.mainCategory || ""}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
              />
            </FormField>

            {/* 중요도 */}
            <FormField label="중요도" required>
              <input
                name="importance"
                type="number"
                value={form.importance}
                onChange={handleChange}
                className={`w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] ${fieldError.importance ? 'border-red-500' : ''}`}
                required
                min={0}
                max={1}
                step={0.1}
                placeholder="0.0 ~ 1.0"
              />
              {fieldError.importance && <div className="text-red-500 text-xs mt-1">{fieldError.importance}</div>}
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-4">
            {/* 기한일 */}
            <FormField label="기한일">
              <div className="relative">
                <input
                  name="dueDate"
                  type="date"
                  value={form.dueDate || ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
                />
              </div>
            </FormField>

            {/* 완료일 */}
            <FormField label="완료일">
              <div className="relative">
                <input
                  name="completionDate"
                  type="date"
                  value={form.completionDate || ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
                />
              </div>
            </FormField>
          </div>

          {/* 오픈 이슈 */}
          <FormField label="오픈 이슈">
            <textarea
              name="openIssue"
              value={form.openIssue || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] min-h-[100px] resize-y"
              style={{ overflowY: 'auto' }}
            />
          </FormField>

          {/* 후속 업무 */}
          <FormField label="후속 업무">
            <textarea
              name="followUpPlan"
              value={form.followUpPlan || ""}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333] min-h-[100px] resize-y"
              style={{ overflowY: 'auto' }}
            />
          </FormField>

          {/* 분기 항목 */}
          <SectionTitle>점수 입력</SectionTitle>
          
          {form.eventType === "CONTINUOUS" ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <FormField label="내부 점수">
                <input
                  name="internalScore"
                  type="number"
                  value={form.internalScore ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
                  min={-5}
                  max={5}
                  step={1}
                  placeholder="-5 ~ 5"
                />
              </FormField>
              <FormField label="고객 점수">
                <input
                  name="customerScore"
                  type="number"
                  value={form.customerScore ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
                  min={-5}
                  max={5}
                  step={1}
                  placeholder="-5 ~ 5"
                />
              </FormField>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-w-xs">
              <FormField label="주관 점수">
                <input
                  name="subjectiveScore"
                  type="number"
                  value={form.subjectiveScore ?? ""}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded bg-[#181A20] text-white border-[#333]"
                  min={-30}
                  max={30}
                  step={1}
                  placeholder="-30 ~ 30"
                />
              </FormField>
            </div>
          )}

          {error && <div className="text-red-500 text-sm mt-4 p-3 bg-red-100 bg-opacity-10 rounded">{error}</div>}
          
          <div className="flex gap-2 mt-8 justify-end">
            <button
              type="button"
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
              onClick={() => router.push("/car")}
              disabled={loading}
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