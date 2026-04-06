'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import QRModal from '@/components/admin/QRModal'
import OrderCard from '@/components/admin/OrderCard'

const STATUS_LABELS: Record<string, string> = {
  pending: '주문 접수',
  preparing: '제조 중',
  ready: '완료',
  delivering: '배달 중',
  done: '완료',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  preparing: 'bg-blue-100 text-blue-800 border-blue-200',
  ready: 'bg-green-100 text-green-800 border-green-200',
  delivering: 'bg-purple-100 text-purple-800 border-purple-200',
  done: 'bg-gray-100 text-gray-600 border-gray-200',
}

export type Order = {
  id: string
  created_at: string
  product_type: string
  quantity: number
  total_price: number
  delivery_type: string
  delivery_address: string | null
  pickup_time: string | null
  status: string
  request: string | null
  designs: {
    thumbnail_url: string
    title: string
  } | null
  users: {
    name: string | null
    phone: string | null
  } | null
}

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [qrModal, setQrModal] = useState<{ url: string; orderNum: string } | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const supabase = createClient()

  // PIN 확인
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === process.env.NEXT_PUBLIC_ADMIN_PIN_HINT) {
      // 클라이언트에서 힌트 확인 (실제 검증은 서버에서)
    }
    // 서버 측 검증
    fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    }).then(r => {
      if (r.ok) {
        setAuthenticated(true)
        sessionStorage.setItem('admin_auth', '1')
      } else {
        setPinError(true)
        setPin('')
        setTimeout(() => setPinError(false), 2000)
      }
    })
  }

  // 세션 복원
  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === '1') {
      setAuthenticated(true)
    }
  }, [])

  // 주문 목록 로드
  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id, created_at, product_type, quantity, total_price,
        delivery_type, delivery_address, pickup_time, status, request,
        designs (thumbnail_url, title),
        users (name, phone)
      `)
      .neq('status', 'done')
      .order('created_at', { ascending: false })
      .limit(100)

    if (data) setOrders(data as unknown as Order[])
  }, [supabase])

  useEffect(() => {
    if (!authenticated) return
    loadOrders()

    // Realtime 구독
    const channel = supabase
      .channel('admin_orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev])
            // 알림음
            if (audioRef.current) {
              audioRef.current.play().catch(() => {})
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev =>
              prev.map(o => o.id === (payload.new as Order).id ? { ...o, ...payload.new as Order } : o)
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [authenticated, loadOrders, supabase])

  // 상태 변경
  const updateStatus = async (orderId: string, status: string) => {
    await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
  }

  // 프린트 (QR 생성)
  const handlePrint = async (order: Order) => {
    const imageUrl = order.designs?.thumbnail_url
    if (!imageUrl) { alert('디자인 이미지가 없습니다.'); return }
    setQrModal({
      url: imageUrl,
      orderNum: order.id.slice(0, 8).toUpperCase(),
    })
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  // PIN 입력 화면
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #FBF7EF 0%, #F5EDD8 100%)' }}>
        <div className="card w-80 p-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h1 className="text-xl font-bold text-[#2C2417] mb-6">관리자 로그인</h1>
          <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                    pinError
                      ? 'border-red-400 bg-red-50'
                      : pin.length > i
                      ? 'border-[#8B6F47] bg-[#F5EDD8] text-[#5C4A30]'
                      : 'border-[#E0D0B8] bg-white text-[#C9B99A]'
                  }`}
                >
                  {pin.length > i ? '●' : '○'}
                </div>
              ))}
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              autoFocus
              className="input text-center text-2xl tracking-widest"
              placeholder="PIN 4자리"
            />
            {pinError && (
              <p className="text-red-500 text-sm">PIN이 올바르지 않습니다.</p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={pin.length !== 4}>
              입력
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFAF6]">
      {/* 알림음 */}
      <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />

      {/* 헤더 */}
      <header className="bg-white border-b border-[#E0D0B8] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎂</span>
            <div>
              <h1 className="font-bold text-[#2C2417] text-lg leading-none">드로잉케이크</h1>
              <span className="text-xs text-[#A88B63]">관리자 대시보드</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#A88B63]">
              {new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })}
            </span>
            <button
              onClick={() => { sessionStorage.removeItem('admin_auth'); setAuthenticated(false) }}
              className="btn-secondary text-sm px-4 py-2"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 통계 요약 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: '신규 주문', value: orders.filter(o => o.status === 'pending').length, color: 'text-amber-600' },
            { label: '제조 중', value: orders.filter(o => o.status === 'preparing').length, color: 'text-blue-600' },
            { label: '완료 대기', value: orders.filter(o => o.status === 'ready').length, color: 'text-green-600' },
            { label: '전체 진행', value: orders.length, color: 'text-[#8B6F47]' },
          ].map(stat => (
            <div key={stat.label} className="card p-4 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-sm text-[#A88B63] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 flex-wrap mb-4">
          {[
            { key: 'all', label: '전체' },
            { key: 'pending', label: '접수' },
            { key: 'preparing', label: '제조 중' },
            { key: 'ready', label: '완료' },
            { key: 'delivering', label: '배달 중' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filter === key
                  ? 'bg-[#8B6F47] text-white'
                  : 'bg-white border border-[#E0D0B8] text-[#8B6F47] hover:bg-[#F5EDD8]'
              }`}
            >
              {label}
              {key !== 'all' && (
                <span className="ml-1.5 text-xs opacity-70">
                  {orders.filter(o => o.status === key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 주문 목록 */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-[#C9B99A]">
            <div className="text-5xl mb-4">🎂</div>
            <p className="text-lg">아직 주문이 없어요</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                statusLabel={STATUS_LABELS[order.status] ?? order.status}
                statusColor={STATUS_COLORS[order.status] ?? ''}
                onStatusChange={updateStatus}
                onPrint={() => handlePrint(order)}
              />
            ))}
          </div>
        )}
      </main>

      {/* QR 모달 */}
      {qrModal && (
        <QRModal
          imageUrl={qrModal.url}
          orderNum={qrModal.orderNum}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  )
}
