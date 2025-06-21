"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";

export default function ReportDetailRedirectPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // /admin/report/[id]로 리다이렉트
    router.replace(`/admin/report/${params.id}`);
  }, [router, params.id]);

  return (
    <div className="min-h-screen bg-[#181A20] text-white p-8">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div>리다이렉트 중...</div>
      </div>
    </div>
  );
} 