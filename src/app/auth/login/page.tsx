import { Suspense } from 'react'
import LoginForm from './LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
         style={{ background: 'linear-gradient(135deg, #FBF7EF 0%, #F5EDD8 100%)' }}>
      {/* 로고 */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">🎂</div>
        <h1 className="text-3xl font-bold text-[#5C4A30]">드로잉케이크</h1>
        <p className="text-[#A88B63] mt-2 text-sm">AI × 미술 융합 커스텀 케이크</p>
      </div>

      <Suspense fallback={
        <div className="card w-full max-w-sm p-8 flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-[#E0D0B8] border-t-[#8B6F47] rounded-full animate-spin" />
        </div>
      }>
        <LoginForm />
      </Suspense>

      <a href="/" className="mt-6 text-sm text-[#A88B63] hover:text-[#5C4A30] transition-colors">
        ← 홈으로 돌아가기
      </a>
    </div>
  )
}
