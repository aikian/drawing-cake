'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CompleteContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id') ?? ''
  const total = Number(searchParams.get('total') ?? 0)
  const orderNum = orderId.slice(0, 8).toUpperCase()
  const isBonus = total >= 30000

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#FDFAF6]">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
        {/* 성공 애니메이션 */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#F5EDD8] flex items-center justify-center text-5xl">
            🎂
          </div>
          <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-lg">
            ✓
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#2C2417] mb-2">주문 완료!</h1>
          <p className="text-[#A88B63]">맛있는 케이크를 만들고 있을게요 🍰</p>
        </div>

        {/* 주문 번호 */}
        <div className="card w-full p-5">
          <p className="text-xs text-[#C9B99A] mb-1">주문 번호</p>
          <p className="text-2xl font-bold text-[#5C4A30] tracking-widest">#{orderNum}</p>
          <p className="text-xs text-[#A88B63] mt-2">이 번호로 주문 상태를 확인할 수 있어요</p>
        </div>

        {/* 크레딧 적립 */}
        <div className="card w-full p-5 bg-gradient-to-br from-[#FBF7EF] to-[#F5EDD8] border-[#E8D9C0]">
          <p className="text-sm font-semibold text-[#5C4A30] mb-3">✨ AI 크레딧 적립</p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#A88B63]">주문 완료 보상</span>
              <span className="font-semibold text-[#8B6F47]">+3 크레딧</span>
            </div>
            {isBonus && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A88B63]">3만원↑ 보너스</span>
                <span className="font-semibold text-[#8B6F47]">+3 크레딧</span>
              </div>
            )}
            <div className="h-px bg-[#E0D0B8] my-1" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#5C4A30]">총 적립</span>
              <span className="text-lg font-bold text-[#8B6F47]">
                +{isBonus ? 6 : 3} 크레딧
              </span>
            </div>
          </div>
          <p className="text-xs text-[#C9B99A] mt-3">크레딧은 AI 이미지 생성에 사용됩니다 (6개월 유효)</p>
        </div>

        {/* 예상 시간 */}
        <div className="bg-[#FBF7EF] rounded-2xl p-4 w-full text-sm text-[#8B6F47]">
          <p className="font-semibold mb-1">⏱ 예상 준비 시간</p>
          <p className="text-[#A88B63]">주문 접수 후 약 <strong className="text-[#5C4A30]">15~20분</strong> 소요됩니다</p>
        </div>

        {/* 버튼 */}
        <div className="flex flex-col gap-3 w-full">
          <Link href="/order" className="btn-primary w-full text-center py-3.5">
            추가 주문하기
          </Link>
          <Link href="/" className="btn-secondary w-full text-center py-3.5">
            홈으로
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDFAF6]">
        <div className="w-8 h-8 border-[3px] border-[#E0D0B8] border-t-[#8B6F47] rounded-full animate-spin" />
      </div>
    }>
      <CompleteContent />
    </Suspense>
  )
}
