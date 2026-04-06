'use client'

import dynamic from 'next/dynamic'

// 클라이언트 컴포넌트 안에서만 ssr:false 사용 가능
const AdminDashboard = dynamic(() => import('./AdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FDFAF6]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-[3px] border-[#E0D0B8] border-t-[#8B6F47] rounded-full animate-spin" />
        <span className="text-sm text-[#A88B63]">로딩 중...</span>
      </div>
    </div>
  ),
})

export default function AdminLoader() {
  return <AdminDashboard />
}
