import dynamic from 'next/dynamic'

// SSR 완전 비활성화 — Supabase 브라우저 클라이언트는 빌드 시 실행 불가
const AdminDashboard = dynamic(() => import('./AdminDashboard'), { ssr: false })

export const dynamic = 'force-dynamic'

export default function AdminPage() {
  return <AdminDashboard />
}
