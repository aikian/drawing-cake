'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type DeliveryType = 'pickup' | 'delivery'

function CheckoutForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const designId = searchParams.get('design_id')
  const productType = searchParams.get('type') ?? 'cake'
  const quantity = Number(searchParams.get('quantity') ?? 1)

  const unitPrice = productType === 'cake' ? 22000 : 6000
  const totalPrice = unitPrice * quantity

  const [design, setDesign] = useState<{ thumbnail_url: string; title: string } | null>(null)
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('pickup')
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('12:00')
  const [address, setAddress] = useState('')
  const [request, setRequest] = useState('')
  const [loading, setLoading] = useState(false)

  // 디자인 정보 불러오기
  useEffect(() => {
    if (!designId) return
    const supabase = createClient()
    supabase
      .from('designs')
      .select('thumbnail_url, title')
      .eq('id', designId)
      .single()
      .then(({ data }) => { if (data) setDesign(data) })
  }, [designId])

  // 오늘 날짜 기본값
  useEffect(() => {
    const today = new Date()
    today.setDate(today.getDate() + 1)
    setPickupDate(today.toISOString().split('T')[0])
  }, [])

  const pickupTimes = ['11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30',
                       '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30']

  const handlePayment = async () => {
    if (deliveryType === 'pickup' && !pickupDate) {
      alert('픽업 날짜를 선택해주세요.')
      return
    }
    if (deliveryType === 'delivery' && !address.trim()) {
      alert('배달 주소를 입력해주세요.')
      return
    }

    setLoading(true)

    const tossClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY

    if (!tossClientKey) {
      // Toss 키 없을 때 — 테스트용으로 바로 완료 처리
      await createOrderDirectly()
      return
    }

    // Toss Payments 결제창 호출
    try {
      const TossSDK = await import('@tosspayments/payment-sdk')
      const toss = await TossSDK.loadTossPayments(tossClientKey)
      // 실제 연동 시 결제창 호출 (추후 구현)
      alert('Toss 결제 키를 환경변수에 추가하면 결제창이 열립니다.')
      setLoading(false)
    } catch {
      await createOrderDirectly()
    }
  }

  const createOrderDirectly = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const pickupTimestamp = deliveryType === 'pickup'
        ? new Date(`${pickupDate}T${pickupTime}:00+09:00`).toISOString()
        : null

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id ?? null,
          design_id: designId,
          product_type: productType,
          quantity,
          total_price: totalPrice,
          delivery_type: deliveryType,
          delivery_address: deliveryType === 'delivery' ? address : null,
          pickup_time: pickupTimestamp,
          request: request || null,
          status: 'pending',
        })
        .select('id')
        .single()

      if (error) throw error

      // 크레딧 적립 (로그인한 경우)
      if (user) {
        await supabase.rpc('add_order_credits', {
          p_user_id: user.id,
          p_order_id: order.id,
          p_total_price: totalPrice,
        }).then(null, () => {}) // 실패해도 주문은 완료
      }

      router.push(`/complete?order_id=${order.id}&total=${totalPrice}`)
    } catch (e) {
      alert('주문 처리 중 오류가 발생했습니다.')
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-[#E0D0B8]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-[#C9B99A] hover:text-[#8B6F47]">←</button>
          <span className="font-bold text-[#5C4A30]">주문 확인 & 결제</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5 pb-32">
        {/* 단계 */}
        <div className="flex items-center gap-2 text-xs text-[#C9B99A]">
          <span>1 상품 선택</span><span>→</span>
          <span>2 디자인</span><span>→</span>
          <span className="font-semibold text-[#8B6F47]">3 결제</span><span>→</span>
          <span>4 완료</span>
        </div>

        {/* 주문 요약 */}
        <div className="card p-5">
          <h3 className="font-semibold text-[#2C2417] mb-4">주문 내역</h3>
          <div className="flex items-center gap-4">
            {design?.thumbnail_url ? (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#E8D9C0] flex-shrink-0">
                <Image src={design.thumbnail_url} alt="디자인" width={64} height={64} className="object-cover w-full h-full" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#F5EDD8] flex items-center justify-center text-2xl flex-shrink-0">
                {productType === 'cake' ? '🎂' : '🍩'}
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-[#2C2417]">
                {productType === 'cake' ? '커스텀 케이크' : '커스텀 도넛'}
              </p>
              <p className="text-sm text-[#A88B63]">{quantity}개 × {unitPrice.toLocaleString()}원</p>
              <p className="text-lg font-bold text-[#8B6F47] mt-1">{totalPrice.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        {/* 픽업 / 배달 */}
        <div className="card p-5">
          <h3 className="font-semibold text-[#2C2417] mb-4">수령 방법</h3>
          <div className="flex gap-3 mb-4">
            {([['pickup', '📍 매장 픽업'], ['delivery', '🚚 배달']] as const).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setDeliveryType(type)}
                className={`flex-1 py-3 rounded-xl font-medium text-sm border-2 transition-all ${
                  deliveryType === type
                    ? 'border-[#8B6F47] bg-[#F5EDD8] text-[#5C4A30]'
                    : 'border-[#E0D0B8] text-[#A88B63] hover:border-[#C9B99A]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {deliveryType === 'pickup' ? (
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-sm font-medium text-[#5C4A30] block mb-1.5">픽업 날짜</label>
                <input
                  type="date"
                  value={pickupDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setPickupDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#5C4A30] block mb-1.5">픽업 시간</label>
                <div className="grid grid-cols-4 gap-2">
                  {pickupTimes.map(t => (
                    <button
                      key={t}
                      onClick={() => setPickupTime(t)}
                      className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                        pickupTime === t
                          ? 'bg-[#8B6F47] text-white border-[#8B6F47]'
                          : 'border-[#E0D0B8] text-[#8B6F47] hover:bg-[#F5EDD8]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs text-[#A88B63] bg-[#FBF7EF] p-3 rounded-xl">
                📍 대구 남구 대명동 명덕역~교대역 라인
              </div>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-[#5C4A30] block mb-1.5">배달 주소</label>
              <input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="도로명 주소를 입력해주세요"
                className="input"
              />
              <p className="text-xs text-[#C9B99A] mt-2">배달은 배달앱 기사를 통해 진행됩니다.</p>
            </div>
          )}
        </div>

        {/* 요청사항 */}
        <div className="card p-5">
          <h3 className="font-semibold text-[#2C2417] mb-3">요청사항 <span className="text-[#C9B99A] font-normal text-sm">(선택)</span></h3>
          <textarea
            value={request}
            onChange={e => setRequest(e.target.value)}
            placeholder="예: 생일 축하 문구 추가해주세요, 견과류 알레르기 있어요..."
            rows={3}
            className="input resize-none"
          />
        </div>

        {/* 최종 금액 */}
        <div className="card p-5">
          <h3 className="font-semibold text-[#2C2417] mb-3">결제 금액</h3>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-[#A88B63]">
              <span>{productType === 'cake' ? '커스텀 케이크' : '커스텀 도넛'} × {quantity}</span>
              <span>{totalPrice.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-[#A88B63]">
              <span>배달비</span>
              <span>{deliveryType === 'delivery' ? '별도' : '무료'}</span>
            </div>
            <div className="h-px bg-[#E0D0B8] my-1" />
            <div className="flex justify-between font-bold text-[#2C2417] text-base">
              <span>합계</span>
              <span className="text-[#8B6F47]">{totalPrice.toLocaleString()}원</span>
            </div>
          </div>
          {totalPrice >= 30000 && (
            <div className="mt-3 bg-[#F5EDD8] rounded-xl p-3 text-xs text-[#8B6F47]">
              🌟 30,000원 이상 주문 — 다음 주문 시 보너스 크레딧 +3 적립!
            </div>
          )}
        </div>
      </main>

      {/* 결제 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0D0B8] p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                처리 중...
              </>
            ) : (
              `${totalPrice.toLocaleString()}원 결제하기`
            )}
          </button>
          <p className="text-xs text-[#C9B99A] text-center mt-2">
            주문 완료 시 AI 크레딧 +3 자동 적립
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FDFAF6]">
        <div className="w-8 h-8 border-[3px] border-[#E0D0B8] border-t-[#8B6F47] rounded-full animate-spin" />
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  )
}
