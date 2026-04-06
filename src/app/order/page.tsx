'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PRODUCTS = [
  {
    id: 'cake',
    name: '커스텀 케이크',
    size: '9cm',
    price: 22000,
    emoji: '🎂',
    desc: 'AI 또는 직접 그린 이미지를 케이크 위에 즉석 인쇄',
    tag: '베스트',
    tagColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 'donut',
    name: '커스텀 도넛',
    size: null,
    price: 6000,
    emoji: '🍩',
    desc: '세상에 하나뿐인 나만의 도넛',
    tag: null,
    tagColor: '',
  },
]

export default function OrderPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<'cake' | 'donut'>('cake')
  const [quantity, setQuantity] = useState(1)

  const product = PRODUCTS.find(p => p.id === selected)!
  const total = product.price * quantity

  const handleNext = () => {
    router.push(`/design?type=${selected}&quantity=${quantity}`)
  }

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#E0D0B8]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <a href="/" className="text-[#C9B99A] hover:text-[#8B6F47] transition-colors">←</a>
          <span className="font-bold text-[#5C4A30]">상품 선택</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* 단계 표시 */}
        <div className="flex items-center gap-2 text-xs text-[#C9B99A]">
          <span className="font-semibold text-[#8B6F47]">1 상품 선택</span>
          <span>→</span><span>2 디자인</span>
          <span>→</span><span>3 결제</span>
          <span>→</span><span>4 완료</span>
        </div>

        {/* 상품 카드 */}
        <div className="flex flex-col gap-3">
          {PRODUCTS.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelected(p.id as 'cake' | 'donut'); setQuantity(1) }}
              className={`card p-5 text-left transition-all ${
                selected === p.id
                  ? 'border-[#8B6F47] border-2 shadow-md'
                  : 'hover:border-[#C9B99A]'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 ${
                  selected === p.id ? 'bg-[#F5EDD8]' : 'bg-[#FBF7EF]'
                }`}>
                  {p.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#2C2417]">{p.name}</span>
                    {p.size && <span className="text-xs text-[#A88B63]">({p.size})</span>}
                    {p.tag && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.tagColor}`}>
                        {p.tag}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#A88B63] mb-2">{p.desc}</p>
                  <p className="text-lg font-bold text-[#8B6F47]">
                    {p.price.toLocaleString()}원
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-1 flex items-center justify-center ${
                  selected === p.id
                    ? 'border-[#8B6F47] bg-[#8B6F47]'
                    : 'border-[#E0D0B8]'
                }`}>
                  {selected === p.id && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 수량 선택 */}
        <div className="card p-5">
          <h3 className="font-semibold text-[#2C2417] mb-4">수량</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full border border-[#E0D0B8] flex items-center justify-center text-xl font-light text-[#8B6F47] hover:bg-[#F5EDD8] transition-colors disabled:opacity-30"
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="text-2xl font-semibold text-[#2C2417] w-8 text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => Math.min(10, q + 1))}
                className="w-10 h-10 rounded-full border border-[#E0D0B8] flex items-center justify-center text-xl font-light text-[#8B6F47] hover:bg-[#F5EDD8] transition-colors disabled:opacity-30"
                disabled={quantity >= 10}
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#C9B99A]">합계</p>
              <p className="text-xl font-bold text-[#8B6F47]">{total.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        {/* 안내 */}
        <div className="bg-[#FBF7EF] rounded-xl p-4 text-sm text-[#A88B63] flex gap-3">
          <span className="text-base">ℹ️</span>
          <div>
            <p>케이크 시트는 매일 오전 9~12시 사전 제조 (당일 소진 원칙)</p>
            <p className="mt-1">영업시간: 11:00 ~ 20:00</p>
          </div>
        </div>
      </main>

      {/* 하단 CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0D0B8] p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#A88B63]">
              {product.name} × {quantity}개
            </p>
            <p className="text-lg font-bold text-[#2C2417]">{total.toLocaleString()}원</p>
          </div>
          <button onClick={handleNext} className="btn-primary px-8 py-3 text-base">
            디자인 만들기 →
          </button>
        </div>
      </div>
      <div className="h-24" />
    </div>
  )
}
